import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useExamStore } from '../../store/examStore';
import { generateDirections } from '../../data/common/directionsTemplate';
import { AI_PROMPTS } from '../../data/common/aiPrompts';
import type { Exam, Question, MCQuestion, FRQuestion, ExamSection } from '../../types/ExamSchema';
import '../../styles/bluebook.css';

/* ── Exam type metadata for directions generation ── */
const EXAM_META: Record<string, { label: string; title: string; examType: string; subject: string; studentName: string }> = {
  calc_ab: { label: 'calc ab', title: 'AP Calculus AB Practice', examType: 'AP', subject: 'Calculus AB', studentName: 'Isaac Newton' },
  bio: { label: 'bio', title: 'AP Biology Practice', examType: 'AP', subject: 'Biology', studentName: 'Gregor Mendel' },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

interface ParseResult {
  exam: Exam | null;
  error: string | null;
  requiredImages: string[];
  questionCount: number;
}

function normalizeQuestion(raw: any, index: number): Question {
  const id = raw.id ?? String(index + 1);

  // Detect FRQ
  if (raw.type === 'frq' || raw.questionType === 'frq' || raw.parts) {
    const frq: FRQuestion = {
      id,
      questionType: 'frq',
      text: raw.text ?? '',
      parts: (raw.parts ?? []).map((p: any) => ({
        partLabel: p.partLabel ?? p.part ?? '',
        text: p.text ?? '',
      })),
    };
    if (raw.stimulus) frq.stimulus = raw.stimulus;
    if (raw.correctAnswer) frq.correctAnswer = raw.correctAnswer;
    return frq;
  }

  // Default: MCQ
  const mcq: MCQuestion = {
    id,
    questionType: 'mcq',
    text: raw.text ?? '',
    options: (raw.options ?? []).map((o: any) => ({
      id: o.id ?? '',
      text: o.text ?? '',
    })),
    correctAnswer: raw.correctAnswer ?? '',
  };
  if (raw.stimulus) mcq.stimulus = raw.stimulus;
  if (raw.explanation) mcq.explanation = raw.explanation;
  return mcq;
}

function collectImageFilenames(questions: Question[]): string[] {
  const images: string[] = [];
  for (const q of questions) {
    if (q.stimulus?.type === 'image' && q.stimulus.data) {
      images.push(q.stimulus.data);
    }
  }
  return images;
}

function parseJsonInput(raw: string, examType: string): ParseResult {
  const empty: ParseResult = { exam: null, error: null, requiredImages: [], questionCount: 0 };

  if (!raw.trim()) return empty;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    return { ...empty, error: `Invalid JSON: ${e.message}` };
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
          directions: sec.directions ?? generateDirections({
            subject: meta.subject,
            sectionTitle: sec.title ?? `Section ${si + 1}`,
            questionCount: questions.length,
            timeMinutes: sec.timeMinutes ?? 60,
            calculatorPolicy: sec.calculatorAllowed ? 'required' : 'none',
            isFRQ: questions.some((q: Question) => q.questionType === 'frq'),
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
      const hasFRQ = questions.some((q) => q.questionType === 'frq');

      const section: ExamSection = {
        id: 'section-1',
        title: `Section I${hasFRQ ? ' - Free Response' : ' - Multiple Choice'}`,
        calculatorAllowed: false,
        timeMinutes: Math.max(30, questions.length * 2), // ~2 min per question, min 30
        directions: generateDirections({
          subject: meta.subject,
          sectionTitle: 'Section I',
          questionCount: questions.length,
          timeMinutes: Math.max(30, questions.length * 2),
          calculatorPolicy: 'none',
          isFRQ: hasFRQ,
        }),
        questions,
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
          if (q.stimulus?.type === 'image' && imageBlobs[q.stimulus.data]) {
            q.stimulus.data = imageBlobs[q.stimulus.data];
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
        take your exam questions (pdf, images) and give them to an ai along with the prompt below. paste the result into the left panel.
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
            placeholder={'[\n  {\n    "id": "1",\n    "text": "What is ...",\n    "options": [\n      { "id": "A", "text": "..." },\n      { "id": "B", "text": "..." }\n    ],\n    "correctAnswer": "A"\n  }\n]'}
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
                    {requiredImages.length > 0 && ` · ${requiredImages.length} image${requiredImages.length !== 1 ? 's' : ''} required`}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="json-input-divider" />

        {/* ── Right: Image Dropzone ── */}
        <div className="json-input-right">
          <label className="json-input-label">images</label>
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
            {' · '}
            {exam.sections.reduce((t, s) => t + s.timeMinutes, 0)} min
          </span>
        )}
        <button className="json-input-start" onClick={handleStart} disabled={!canStart}>
          start exam
        </button>
      </div>
    </div>
  );
};
