import React, { useState, useCallback, useMemo } from 'react';
import { useExamStore } from '../../store/examStore';
import { generateDirections } from '../../data/common/directionsTemplate';
import { AI_PROMPTS } from '../../data/common/aiPrompts';
import { SECTION_CONFIGS } from '../../data/common/sectionConfig';
import type { Exam, Question, MCQuestion, FRQuestion, ExamSection } from '../../types/ExamSchema';
import '../../styles/bluebook.css';

/* ── Exam type metadata for directions generation ── */
const EXAM_META: Record<string, { label: string; title: string; examType: string; subject: string; studentName: string }> = {
  calc_ab: { label: 'calc ab', title: 'AP Calculus AB Practice', examType: 'AP', subject: 'Calculus AB', studentName: 'Gottfried Leibniz' },
  calc_bc: { label: 'calc bc', title: 'AP Calculus BC Practice', examType: 'AP', subject: 'Calculus BC', studentName: 'Isaac Newton' },
  bio: { label: 'bio', title: 'AP Biology Practice', examType: 'AP', subject: 'Biology', studentName: 'Gregor Mendel' },
  lit: { label: 'lit', title: 'AP English Literature Practice', examType: 'AP', subject: 'English Literature and Composition', studentName: 'William Shakespeare' },
  phys_mech: { label: 'mech', title: 'AP Physics C: Mechanics Practice', examType: 'AP', subject: 'Physics C: Mechanics', studentName: 'Einstein' },
  phys_em: { label: 'e&m', title: 'AP Physics C: E&M Practice', examType: 'AP', subject: 'Physics C: Electricity and Magnetism', studentName: 'James Maxwell' },
  econ_macro: { label: 'macro', title: 'AP Macroeconomics Practice', examType: 'AP', subject: 'Macroeconomics', studentName: 'John Keynes' },
  econ_micro: { label: 'micro', title: 'AP Microeconomics Practice', examType: 'AP', subject: 'Microeconomics', studentName: 'Adam Smith' },
  test: { label: 'test', title: 'Simulator Test', examType: 'TEST', subject: 'Testing', studentName: 'Ben Baumgartner' },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

interface ParseResult {
  exam: Exam | null;
  error: string | null;
  requiredImages: string[];
  questionCount: number;
}

function normalizeQuestion(raw: any, index: number): Question & { _sectionTag?: string } {
  const id = raw.id ?? String(index + 1);
  const sectionTag = raw.section ?? undefined;

  // Detect FRQ
  if (raw.type === 'frq' || raw.questionType === 'frq' || raw.parts) {
    const frq: FRQuestion & { _sectionTag?: string } = {
      id,
      questionType: 'frq',
      text: raw.text ?? '',
      parts: (raw.parts ?? []).map((p: any) => ({
        partLabel: p.partLabel ?? p.part ?? '',
        text: p.text ?? '',
        ...(p.type && { type: p.type }),
        ...(p.stimulus && { stimulus: p.stimulus }),
      })),
      _sectionTag: sectionTag,
    };
    if (raw.stimulus) frq.stimulus = raw.stimulus;
    if (raw.correctAnswer) frq.correctAnswer = raw.correctAnswer;
    return frq;
  }

  // Default: MCQ
  const mcq: MCQuestion & { _sectionTag?: string } = {
    id,
    questionType: 'mcq',
    text: raw.text ?? '',
    options: (raw.options ?? []).map((o: any) => ({
      id: o.id ?? '',
      text: o.text ?? '',
      ...(o.type && { type: o.type }),
    })),
    correctAnswer: raw.correctAnswer ?? '',
    _sectionTag: sectionTag,
  };
  if (raw.stimulus) mcq.stimulus = raw.stimulus;
  if (raw.explanation) mcq.explanation = raw.explanation;
  return mcq;
}

function collectImageFilenames(questions: Question[]): string[] {
  const images: string[] = [];
  for (const q of questions) {
    if (q.stimulus?.type === 'image' && q.stimulus.data) {
      images.push(q.stimulus.data as string);
    }
  }
  return images;
}

/**
 * Split a flat array of questions into exam sections using the section config.
 * Uses the `_sectionTag` on each question to route it to the correct section.
 * Questions without a tag are distributed by type (MCQ/FRQ) and split evenly
 * across matching sections.
 */
function splitIntoSections(
  questions: (Question & { _sectionTag?: string })[],
  examType: string,
  meta: typeof EXAM_META[string],
): ExamSection[] {
  const config = SECTION_CONFIGS[examType];
  if (!config) return [];

  // Bucket questions by section tag
  const tagBuckets: Record<string, Question[]> = {};
  const untaggedMCQ: Question[] = [];
  const untaggedFRQ: Question[] = [];

  for (const q of questions) {
    if (q._sectionTag) {
      const tag = q._sectionTag.toUpperCase();
      if (!tagBuckets[tag]) tagBuckets[tag] = [];
      // Strip _sectionTag before storing
      const { _sectionTag, ...clean } = q as any;
      tagBuckets[tag].push(clean);
    } else {
      // Strip _sectionTag before storing
      const { _sectionTag, ...clean } = q as any;
      if (q.questionType === 'frq') {
        untaggedFRQ.push(clean);
      } else {
        untaggedMCQ.push(clean);
      }
    }
  }

  // Distribute untagged questions evenly across matching sections
  if (untaggedMCQ.length > 0) {
    const mcqSections = config.filter((s) => s.questionType === 'mcq');
    const perSection = Math.ceil(untaggedMCQ.length / mcqSections.length);
    mcqSections.forEach((sec, i) => {
      const chunk = untaggedMCQ.slice(i * perSection, (i + 1) * perSection);
      if (chunk.length > 0) {
        if (!tagBuckets[sec.sectionTag]) tagBuckets[sec.sectionTag] = [];
        tagBuckets[sec.sectionTag].push(...chunk);
      }
    });
  }

  if (untaggedFRQ.length > 0) {
    const frqSections = config.filter((s) => s.questionType === 'frq');
    const perSection = Math.ceil(untaggedFRQ.length / frqSections.length);
    frqSections.forEach((sec, i) => {
      const chunk = untaggedFRQ.slice(i * perSection, (i + 1) * perSection);
      if (chunk.length > 0) {
        if (!tagBuckets[sec.sectionTag]) tagBuckets[sec.sectionTag] = [];
        tagBuckets[sec.sectionTag].push(...chunk);
      }
    });
  }

  // Build ExamSection objects — only include sections that have questions
  const sections: ExamSection[] = [];
  for (const template of config) {
    const sectionQuestions = tagBuckets[template.sectionTag] ?? [];
    if (sectionQuestions.length === 0) continue;

    // Reassign IDs to be sequentially unique within the section
    sectionQuestions.forEach((q, idx) => {
      q.id = `${template.sectionId}-${idx + 1}`;
    });

    // Calculate dynamic background time allocation based on number of questions
    let sectionTime = template.timeMinutes;
    if (examType === 'calc_ab' || examType === 'calc_bc') {
      if (template.sectionTag === '1A') sectionTime = sectionQuestions.length * 2;
      else if (template.sectionTag === '1B') sectionTime = sectionQuestions.length * 3;
      else if (template.sectionTag === '2A') sectionTime = sectionQuestions.length * 15;
      else if (template.sectionTag === '2B') sectionTime = sectionQuestions.length * 15;
    } else if (examType === 'bio') {
      if (template.sectionTag === '1') sectionTime = Math.ceil(sectionQuestions.length * 1.5);
      else if (template.sectionTag === '2') sectionTime = sectionQuestions.length * 15;
    } else if (examType === 'lit') {
      if (template.sectionTag === '1') sectionTime = Math.ceil(sectionQuestions.length * (80 / 60));
      else if (template.sectionTag === '2') sectionTime = sectionQuestions.length * 40;
    } else if (examType === 'phys_mech' || examType === 'phys_em') {
      if (template.sectionTag === '1') sectionTime = sectionQuestions.length * 2;
      else if (template.sectionTag === '2') sectionTime = sectionQuestions.length * 25;
    } else if (examType === 'econ_macro' || examType === 'econ_micro') {
      if (template.sectionTag === '1') sectionTime = Math.ceil(sectionQuestions.length * (70 / 60));
      else if (template.sectionTag === '2') sectionTime = sectionQuestions.length * 20;
    }

    sections.push({
      id: template.sectionId,
      title: template.title,
      calculatorAllowed: template.calculatorAllowed,
      timeMinutes: sectionTime,
      breakAfterMinutes: template.breakAfterMinutes,
      frqMode: template.frqMode,
      directions: generateDirections({
        subject: meta.subject,
        sectionTitle: template.title,
        questionCount: sectionQuestions.length,
        timeMinutes: sectionTime,
        calculatorPolicy: template.calculatorPolicy,
        isFRQ: template.questionType === 'frq',
        examType,
      }),
      questions: sectionQuestions,
    });
  }

  // Fix breakAfterMinutes for the actual last section (in case some sections were empty)
  if (sections.length > 0) {
    sections[sections.length - 1] = {
      ...sections[sections.length - 1],
      breakAfterMinutes: null,
    };
  }

  return sections;
}

function parseJsonInput(raw: string, examType: string): ParseResult {
  const empty: ParseResult = { exam: null, error: null, requiredImages: [], questionCount: 0 };

  if (!raw.trim()) return empty;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    // Attempt to handle concatenated JSON arrays (e.g., copied back-to-back)
    try {
      const fixedRaw = `[${raw.trim().replace(/\]\s*\[/g, '],[')}]`;
      const parsedMultiple = JSON.parse(fixedRaw);
      if (Array.isArray(parsedMultiple) && parsedMultiple.every(Array.isArray)) {
        parsed = parsedMultiple.flat();
      } else {
        throw new Error();
      }
    } catch (e2: any) {
      return { ...empty, error: `Invalid JSON: ${e.message}` };
    }
  }

  const meta = EXAM_META[examType] ?? { label: 'exam', title: 'Practice Exam', examType: 'AP', subject: 'General', studentName: 'Isaac Newton' };

  // ── Case 1: Full Exam object (has metadata + sections) ──
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.sections) {
    try {
      const sections: ExamSection[] = parsed.sections.map((sec: any, si: number) => {
        const questions = (sec.questions ?? []).map((q: any, qi: number) => normalizeQuestion(q, qi));
        return {
          id: sec.id ?? `section-${si + 1}`,
          title: sec.title ?? `Section ${si + 1}`,
          calculatorAllowed: sec.calculatorAllowed ?? false,
          timeMinutes: sec.timeMinutes ?? 60,
          breakAfterMinutes: sec.breakAfterMinutes ?? (si < parsed.sections.length - 1 ? 10 : null),
          frqMode: sec.frqMode,
          directions: sec.directions ?? generateDirections({
            subject: meta.subject,
            sectionTitle: sec.title ?? `Section ${si + 1}`,
            questionCount: questions.length,
            timeMinutes: sec.timeMinutes ?? 60,
            calculatorPolicy: sec.calculatorAllowed ? 'required' : 'none',
            isFRQ: questions.some((q: Question) => q.questionType === 'frq'),
            examType,
          }),
          questions,
        };
      });

      const allQuestions = sections.flatMap((s) => s.questions);

      const exam: Exam = {
        metadata: {
          title: parsed.metadata?.title ?? meta.title,
          examType: parsed.metadata?.examType ?? meta.examType,
          subject: parsed.metadata?.subject ?? meta.subject,
        },
        sections,
      };

      return {
        exam,
        error: null,
        requiredImages: collectImageFilenames(allQuestions),
        questionCount: allQuestions.length,
      };
    } catch (e: any) {
      return { ...empty, error: `Error processing exam structure: ${e.message}` };
    }
  }

  // ── Case 2: Flat array of questions ──
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { ...empty, error: 'JSON array is empty — no questions found.' };
    }

    try {
      const questions = parsed.map((q: any, i: number) => normalizeQuestion(q, i));

      // If a section config exists for this exam type, auto-split into proper sections
      if (SECTION_CONFIGS[examType]) {
        const sections = splitIntoSections(questions, examType, meta);

        if (sections.length === 0) {
          return { ...empty, error: 'No questions matched any configured section. Check question types (mcq/frq).' };
        }

        const allQuestions = sections.flatMap((s) => s.questions);

        const exam: Exam = {
          metadata: {
            title: meta.title,
            examType: meta.examType,
            subject: meta.subject,
          },
          sections,
        };

        return {
          exam,
          error: null,
          requiredImages: collectImageFilenames(allQuestions),
          questionCount: allQuestions.length,
        };
      }

      // Fallback: no section config (e.g. 'test') — single section
      const hasFRQ = questions.some((q) => q.questionType === 'frq');

      // Reassign IDs to prevent collisions
      questions.forEach((q, idx) => {
        q.id = `section-1-${idx + 1}`;
      });

      const section: ExamSection = {
        id: 'section-1',
        title: `Section I${hasFRQ ? ' - Free Response' : ' - Multiple Choice'}`,
        calculatorAllowed: false,
        timeMinutes: Math.max(30, questions.length * 2), // ~2 min per question, min 30
        breakAfterMinutes: null,
        directions: generateDirections({
          subject: meta.subject,
          sectionTitle: 'Section I',
          questionCount: questions.length,
          timeMinutes: Math.max(30, questions.length * 2),
          calculatorPolicy: 'none',
          isFRQ: hasFRQ,
        }),
        questions: questions.map((q) => {
          const { _sectionTag, ...clean } = q as any;
          return clean;
        }),
      };

      const exam: Exam = {
        metadata: {
          title: meta.title,
          examType: meta.examType,
          subject: meta.subject,
        },
        sections: [section],
      };

      return {
        exam,
        error: null,
        requiredImages: collectImageFilenames(questions),
        questionCount: questions.length,
      };
    } catch (e: any) {
      return { ...empty, error: `Error processing questions: ${e.message}` };
    }
  }

  return { ...empty, error: 'JSON must be an array of questions or an object with "sections".' };
}

/* ── Component ───────────────────────────────────────────────────── */

export const JsonInputScreen: React.FC = () => {
  const selectedExamType = useExamStore((s) => s.selectedExamType);
  const imageBlobs = useExamStore((s) => s.imageBlobs);
  const setImageBlob = useExamStore((s) => s.setImageBlob);
  const removeImageBlob = useExamStore((s) => s.removeImageBlob);
  const clearInputState = useExamStore((s) => s.clearInputState);
  const loadExam = useExamStore((s) => s.loadExam);

  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  const examType = selectedExamType ?? 'calc_ab';
  const meta = EXAM_META[examType] ?? EXAM_META['calc_ab'];
  const aiPrompt = AI_PROMPTS[examType] ?? '';

  // Parse on every change
  const parseResult = useMemo(() => parseJsonInput(jsonText, examType), [jsonText, examType]);
  const { exam, error, requiredImages, questionCount } = parseResult;

  const allImagesProvided = requiredImages.length === 0 || requiredImages.every((f) => !!imageBlobs[f]);
  const canStart = exam !== null && allImagesProvided;

  // ── Handlers ──

  const handleBack = () => {
    clearInputState();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleStart = () => {
    if (!exam) return;

    // Inject Blob URLs into stimulus data for image questions
    if (requiredImages.length > 0) {
      for (const section of exam.sections) {
        for (const q of section.questions) {
          if (q.stimulus?.type === 'image' && imageBlobs[q.stimulus.data as string]) {
            q.stimulus.data = imageBlobs[q.stimulus.data as string];
          }
        }
      }
    }

    loadExam(exam, meta.studentName);
  };

  const handleFileDrop = useCallback(
    (filename: string, file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setImageBlob(filename, url);
    },
    [setImageBlob],
  );

  const handleClickToPaste = async (filename: string) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          const file = new File([blob], filename, { type: imageType });
          handleFileDrop(filename, file);
          return;
        }
      }
      alert('No image found on clipboard.');
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      // Fallback message if clipboard permissions are denied or unsupported
      alert('Failed to read clipboard. Please ensure clipboard permissions are granted or simply press Ctrl+V / Cmd+V inside the box.');
    }
  };

  const handlePasteEvent = (filename: string) => (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileDrop(filename, file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  // ── Section summary for status bar ──
  const sectionSummary = exam && exam.sections.length > 1
    ? exam.sections.map((s) => `${s.title} (${s.questions.length}q)`).join(' → ')
    : null;

  // ── Render ──

  return (
    <div className="json-input-screen">
      {/* ── Header ── */}
      <div className="json-input-header">
        <button className="json-input-back" onClick={handleBack}>
          ← back
        </button>
        <span className="json-input-exam-label">{meta.label}</span>
        <div className="json-input-header-spacer" />
      </div>

      {/* ── Instructions ── */}
      <div className="json-input-instructions">
        Take your exam questions (pdf, images, etc) and give them to a good ai along with the prompt below. Paste the result into the left panel, and then paste any images as necessary.
      </div>

      {/* ── Copy Prompt Bar ── */}
      <button className="json-input-copy-bar" onClick={handleCopyPrompt}>
        {copied ? 'copied' : 'click to copy ai prompt to clipboard'}
      </button>

      {/* ── Split Content ── */}
      <div className="json-input-split">
        {/* ── Left: JSON Input ── */}
        <div className="json-input-left">
          <label className="json-input-label">paste exam json</label>
          <textarea
            className="json-input-textarea"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={'[\n  {\n    "id": "1",\n    "section": "1A",\n    "text": "What is ...",\n    "options": [\n      { "id": "A", "text": "..." },\n      { "id": "B", "text": "..." }\n    ],\n    "correctAnswer": "A"\n  }\n]'}
            spellCheck={false}
          />
          {/* Validation Status */}
          {jsonText.trim() && (
            <div className={`json-input-status ${error ? 'json-input-status--error' : 'json-input-status--valid'}`}>
              {error ? (
                <>
                  <span className="json-input-status-icon">✗</span>
                  <span>{error}</span>
                </>
              ) : (
                <>
                  <span className="json-input-status-icon">✓</span>
                  <span>
                    {questionCount} question{questionCount !== 1 ? 's' : ''} parsed
                    {exam && exam.sections.length > 1 && ` · ${exam.sections.length} sections`}
                    {requiredImages.length > 0 && ` · ${requiredImages.length} image${requiredImages.length !== 1 ? 's' : ''} required`}
                  </span>
                </>
              )}
            </div>
          )}
          {/* Section breakdown */}
          {sectionSummary && (
            <div className="json-input-section-breakdown">
              {exam!.sections.map((s) => (
                <div key={s.id} className="json-input-section-tag">
                  <span className="json-input-section-tag__name">{s.title}</span>
                  <span className="json-input-section-tag__count">{s.questions.length}q</span>
                  {s.breakAfterMinutes !== null && (
                    <span className="json-input-section-tag__break">→ {s.breakAfterMinutes}min break</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="json-input-divider" />

        {/* ── Right: Image Dropzone ── */}
        <div className="json-input-right">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="json-input-label" style={{ marginBottom: 0 }}>images</label>
            {examType === 'test' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="bb-footer__btn"
                  style={{ background: '#eee', color: '#333', fontSize: 12, padding: '4px 12px' }}
                  onClick={() => setJsonText(JSON.stringify([{
                    id: "1", text: "Test question 1?", options: [{ id: "A", text: "Yes" }, { id: "B", text: "No" }], correctAnswer: "A"
                  }], null, 2))}
                >
                  Load Test
                </button>
                <button
                  className="bb-footer__btn"
                  style={{ background: '#eee', color: '#333', fontSize: 12, padding: '4px 12px' }}
                  onClick={() => setJsonText(JSON.stringify([
                    { id: "1", text: "Test question 1?", options: [{ id: "A", text: "Yes" }, { id: "B", text: "No" }], correctAnswer: "A" },
                    { id: "2", stimulus: { type: "image", data: "test_image.png" }, text: "What is this image?", options: [{ id: "A", text: "Image" }, { id: "B", text: "Text" }], correctAnswer: "A" }
                  ], null, 2))}
                >
                  + Add Image
                </button>
              </div>
            )}
          </div>
          {requiredImages.length === 0 ? (
            <div className="json-input-no-images">
              {jsonText.trim()
                ? exam
                  ? 'No images required for this exam.'
                  : 'Fix JSON errors to check for images.'
                : 'Paste JSON to detect required images.'}
            </div>
          ) : (
            <div className="json-input-checklist">
              {requiredImages.map((filename) => {
                const hasImage = !!imageBlobs[filename];
                return (
                  <div key={filename} className="json-input-checklist-item">
                    <div className="json-input-checklist-header">
                      <span className={`json-input-checklist-status ${hasImage ? 'json-input-checklist-status--done' : ''}`}>
                        {hasImage ? '✓' : '○'}
                      </span>
                      <span className="json-input-checklist-filename">{filename}</span>
                      {hasImage && (
                        <button className="json-input-checklist-remove" onClick={() => removeImageBlob(filename)}>
                          ✕
                        </button>
                      )}
                    </div>
                    {hasImage ? (
                      <div className="json-input-thumbnail-wrap">
                        <img src={imageBlobs[filename]} alt={filename} className="json-input-thumbnail" />
                      </div>
                    ) : (
                      <div
                        className="json-input-dropzone"
                        onClick={() => handleClickToPaste(filename)}
                        onPaste={handlePasteEvent(filename)}
                        tabIndex={0}
                      >
                        <span className="json-input-dropzone-text">
                          click to paste
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="json-input-footer">
        {exam && (
          <span className="json-input-meta">
            {questionCount} question{questionCount !== 1 ? 's' : ''}
            {exam.sections.length > 1 && ` · ${exam.sections.length} sections`}
          </span>
        )}
        <button className="json-input-start" onClick={handleStart} disabled={!canStart}>
          next →
        </button>
      </div>
    </div>
  );
};
