import type { Exam, Question, MCQuestion, FRQuestion, AudioResponseQuestion, ExamSection, Stimulus } from '../types/ExamSchema';
import { SECTION_CONFIGS } from '../data/common/sectionConfig';
import { generateDirections } from '../data/common/directionsTemplate';
import { walkExamMedia, isAudioReference, type MediaManifestItem, type MediaRequirement } from './mediaWalker';

export const EXAM_META: Record<string, { label: string; title: string; examType: string; subject: string; studentName: string }> = {
  calc_ab: { label: 'calc ab', title: 'AP Calculus AB Practice', examType: 'AP', subject: 'Calculus AB', studentName: 'Gottfried Leibniz' },
  calc_bc: { label: 'calc bc', title: 'AP Calculus BC Practice', examType: 'AP', subject: 'Calculus BC', studentName: 'Isaac Newton' },
  bio: { label: 'bio', title: 'AP Biology Practice', examType: 'AP', subject: 'Biology', studentName: 'Gregor Mendel' },
  lit: { label: 'lit', title: 'AP English Literature Practice', examType: 'AP', subject: 'English Literature and Composition', studentName: 'William Shakespeare' },
  phys_mech: { label: 'mech', title: 'AP Physics C: Mechanics Practice', examType: 'AP', subject: 'Physics C: Mechanics', studentName: 'Albert Einstein' },
  phys_em: { label: 'e&m', title: 'AP Physics C: E&M Practice', examType: 'AP', subject: 'Physics C: Electricity and Magnetism', studentName: 'James Maxwell' },
  econ_macro: { label: 'macro', title: 'AP Macroeconomics Practice', examType: 'AP', subject: 'Macroeconomics', studentName: 'John Keynes' },
  econ_micro: { label: 'micro', title: 'AP Microeconomics Practice', examType: 'AP', subject: 'Microeconomics', studentName: 'Adam Smith' },
  // ARCHIVED: Foreign language exam
  // german: { label: 'german', title: 'AP German Language and Culture Practice', examType: 'AP', subject: 'German Language and Culture', studentName: 'Johann Goethe' },
  test: { label: 'test', title: 'Simulator Test', examType: 'TEST', subject: 'Testing', studentName: 'Ben Baumgartner' },
};

export interface ExamParseResult {
  exam: Exam | null;
  questions: Question[];
  mediaManifest: MediaManifestItem[];
  requiredMedia: MediaRequirement[];
  error: string | null;
  errors: string[];
  warnings: string[];
  fixupPrompt: string | null;
  questionCount: number;
}

/**
 * Strips code fences, removes JS comments outside strings, converts smart quote delimiters,
 * handles unescaped newlines inside strings, and cleans trailing commas.
 */
export function cleanJsonString(raw: string): string {
  let text = raw.trim();

  // Strip markdown code fences if wrapped
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Strip anti-recitation dummy tags (e.g. [PartyMor], [pm]) used to defeat LLM copyright blocks
  text = text.replace(/\s*\[PartyMor\]\s*/gi, ' ');
  text = text.replace(/\s*\[pm\]\s*/gi, ' ');
  text = text.replace(/\[PartyMor\]/gi, '');
  text = text.replace(/\[pm\]/gi, '');

  let output = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inString) {
      if (isEscaped) {
        output += ch;
        isEscaped = false;
      } else if (ch === '\\') {
        const remainder = text.slice(i);
        // Check if backslash is followed by a LaTeX command colliding with standard JSON escapes (\t, \f, \b, \n, \r)
        const isLatexCollision =
          /^\\(?:t(?:ext|imes|heta|au|an|o|extbf|textit|tilde|triangle|tag|top|tiny|tfrac|therefore|tanh|thickapprox)|f(?:rac|forall|flat|frown|footnote|fbox|figure)|b(?:eta|begin|bar|binom|bot|bullet|bm|bf|bold|mathbf|boldsymbol|big|bigg|bmatrix|bmod)|n(?:eq|nabla|nu|not|neg|newline|normalsize|natural|nearrow|nwarrow)|r(?:ightarrow|ight|ho|angle|ring|rm|rfloor|rceil|rbrace))\b/i.test(remainder);

        // Check if followed by invalid unicode escape (e.g. \uparrow instead of \uXXXX)
        const isInvalidUnicode =
          next === 'u' && !/^[0-9a-fA-F]{4}/.test(text.slice(i + 2, i + 6));

        // Check if followed by any character that is not a valid JSON escape
        const isNonJsonEscape =
          (next !== undefined && !['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(next)) || isInvalidUnicode;

        if (isLatexCollision || isNonJsonEscape) {
          // Double the backslash so JSON.parse receives a literal '\'
          output += '\\\\';
          // isEscaped remains false so next character is handled as normal text
        } else {
          output += ch;
          isEscaped = true;
        }
      } else if (ch === '"') {
        output += ch;
        inString = false;
      } else if (ch === '\n') {
        // AI sometimes puts unescaped literal newlines inside string values.
        // Standard JSON disallows raw newlines in strings, causing "Unterminated string".
        output += '\\n';
      } else if (ch === '\r') {
        // Skip carriage return inside strings
      } else if (ch === '\t') {
        // If literal tab character is followed by 'ext', 'imes', etc., it was likely an unescaped \text corrupted into a tab
        if (/^(?:ext|imes|heta|au|an|o|extbf|textit)\b/i.test(text.slice(i + 1))) {
          output += '\\\\t';
        } else {
          output += '\\t';
        }
      } else {
        output += ch;
      }
      continue;
    }

    // Outside string:
    // Handle double quote or smart quotes acting as string delimiters
    if (ch === '"' || ch === '\u201C' || ch === '\u201D') {
      inString = true;
      output += '"';
      continue;
    }

    // Single-line comment: // outside of string
    if (ch === '/' && next === '/') {
      i += 1;
      while (i + 1 < text.length && text[i + 1] !== '\n' && text[i + 1] !== '\r') {
        i++;
      }
      continue;
    }

    // Multi-line comment: /* ... */ outside of string
    if (ch === '/' && next === '*') {
      i += 1;
      while (i + 1 < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        i++;
      }
      i++; // skip closing '/'
      continue;
    }

    // Trailing comma: comma followed only by whitespace before } or ]
    if (ch === ',') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) {
        j++;
      }
      if (j < text.length && (text[j] === '}' || text[j] === ']')) {
        // Skip trailing comma
        continue;
      }
    }

    output += ch;
  }

  return output.trim();
}

/**
 * Scans raw text and extracts all balanced root JSON structures ({...} or [...]).
 * Accurately tracks quotes (including smart quotes), escape sequences, and comments.
 */
export function extractJsonChunksByScanning(raw: string): string[] {
  let text = raw.replace(/\s*\[PartyMor\]\s*/gi, ' ').replace(/\s*\[pm\]\s*/gi, ' ');
  text = text.replace(/\[PartyMor\]/gi, '').replace(/\[pm\]/gi, '');

  const chunks: string[] = [];
  const stack: ('brace' | 'bracket')[] = [];
  let chunkStart = -1;
  let inString = false;
  let isEscaped = false;
  let inSingleComment = false;
  let inMultiComment = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inSingleComment) {
      if (ch === '\n' || ch === '\r') inSingleComment = false;
      continue;
    }
    if (inMultiComment) {
      if (ch === '*' && next === '/') {
        inMultiComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"' || ch === '\u201C' || ch === '\u201D') {
        inString = false;
      }
      continue;
    }

    // Outside string and comments
    if (ch === '/' && next === '/') {
      inSingleComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inMultiComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === '\u201C' || ch === '\u201D') {
      inString = true;
      continue;
    }

    if (ch === '{' || ch === '[') {
      if (stack.length === 0) {
        chunkStart = i;
      }
      stack.push(ch === '{' ? 'brace' : 'bracket');
    } else if (ch === '}' || ch === ']') {
      const expected = ch === '}' ? 'brace' : 'bracket';
      if (stack.length > 0 && stack[stack.length - 1] === expected) {
        stack.pop();
        if (stack.length === 0 && chunkStart !== -1) {
          chunks.push(text.slice(chunkStart, i + 1).trim());
          chunkStart = -1;
        }
      }
    }
  }

  return chunks;
}

/**
 * Extracts multiple JSON batch chunks from arbitrary text.
 * Supports multiple markdown code blocks, back-to-back objects, comment-separated batches,
 * or wrapped arrays.
 */
export function extractJsonChunks(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  // Check for multiple markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = codeBlockRegex.exec(raw)) !== null) {
    if (m[1].trim()) blocks.push(m[1].trim());
  }

  if (blocks.length > 1) {
    const extracted: string[] = [];
    for (const block of blocks) {
      const subChunks = extractJsonChunksByScanning(block);
      if (subChunks.length > 0) {
        extracted.push(...subChunks);
      } else {
        extracted.push(block);
      }
    }
    return extracted;
  }

  const sourceText = blocks.length === 1 ? blocks[0] : raw;
  const chunks = extractJsonChunksByScanning(sourceText);
  if (chunks.length > 0) {
    return chunks;
  }

  return [sourceText.trim()];
}

/**
 * Absorbs and merges parsed data structures (batches, questions, media, sections)
 * into target collections.
 */
function absorbParsed(
  parsed: unknown,
  rawQuestions: Record<string, unknown>[],
  mediaManifest: MediaManifestItem[]
): void {
  if (!parsed) return;

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if (Array.isArray(obj.questions) || Array.isArray(obj.media) || Array.isArray(obj.sections)) {
          absorbParsed(obj, rawQuestions, mediaManifest);
        } else {
          rawQuestions.push(obj);
        }
      }
    }
    return;
  }

  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;

    // 1. Media
    if (Array.isArray(obj.media)) {
      for (const m of obj.media) {
        if (m && typeof m === 'object') {
          const item = m as MediaManifestItem;
          if (item.id) {
            const existingIdx = mediaManifest.findIndex((existing) => existing.id === item.id);
            if (existingIdx >= 0) {
              const existing = mediaManifest[existingIdx];
              let mergedSourceQuestion = existing.sourceQuestion;
              if (item.sourceQuestion && existing.sourceQuestion && String(item.sourceQuestion) !== String(existing.sourceQuestion)) {
                mergedSourceQuestion = `${existing.sourceQuestion}, ${item.sourceQuestion}`;
              } else if (item.sourceQuestion) {
                mergedSourceQuestion = item.sourceQuestion;
              }
              const mergedCrop =
                item.crop && (!existing.crop || item.crop.length > existing.crop.length)
                  ? item.crop
                  : existing.crop;

              mediaManifest[existingIdx] = {
                ...existing,
                ...item,
                sourceQuestion: mergedSourceQuestion,
                crop: mergedCrop,
              };
            } else {
              mediaManifest.push(item);
            }
          }
        }
      }
    }

    // 2. Questions
    if (Array.isArray(obj.questions)) {
      for (const q of obj.questions) {
        if (q && typeof q === 'object') {
          rawQuestions.push(q as Record<string, unknown>);
        }
      }
    } else if (Array.isArray(obj.sections)) {
      for (const sec of obj.sections as Record<string, unknown>[]) {
        const secTag = sec.section ?? sec.sectionTag ?? sec.tag;
        const sQuestions = Array.isArray(sec.questions) ? (sec.questions as Record<string, unknown>[]) : [];
        for (const q of sQuestions) {
          rawQuestions.push(secTag && !q.section ? { ...q, section: secTag } : q);
        }
      }
    } else if (obj.text !== undefined || obj.questionType !== undefined || Array.isArray(obj.options) || Array.isArray(obj.parts)) {
      rawQuestions.push(obj);
    }
  }
}

/**
 * Normalizes options into standard [{ id: "A", text: "..." }, ...]
 * Handles arrays of strings like ["(A) 4", "(B) 6"] or ["A. 4", "B. 6"]
 */
function normalizeOptions(rawOptions: unknown): MCQuestion['options'] {
  if (!Array.isArray(rawOptions)) return [];

  const defaultLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return rawOptions.map((opt, idx) => {
    if (typeof opt === 'string') {
      const match = opt.match(/^\s*\(?([A-Fa-f0-9])\)?[.:-]?\s*(.*)$/);
      if (match) {
        return {
          id: match[1].toUpperCase(),
          text: match[2].trim(),
        };
      }
      return {
        id: defaultLetters[idx] || String(idx + 1),
        text: opt.trim(),
      };
    }

    if (opt && typeof opt === 'object') {
      const optObj = opt as Record<string, unknown>;
      const rawId = typeof optObj.id === 'string' ? optObj.id.trim().toUpperCase() : defaultLetters[idx];
      const text = typeof optObj.text === 'string' ? optObj.text : String(optObj.text ?? '');
      const type = typeof optObj.type === 'string' ? (optObj.type as MCQuestion['options'][number]['type']) : undefined;

      return {
        id: rawId,
        text,
        ...(type && { type }),
      };
    }

    return {
      id: defaultLetters[idx] || String(idx + 1),
      text: String(opt),
    };
  });
}

/**
 * Cleans single-letter answer key (e.g. "(B)" -> "B", "Option C" -> "C")
 */
function cleanCorrectAnswer(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/^\(?\s*(?:Option\s*)?([A-Ea-e])\s*\)?$/i);
  return match ? match[1].toUpperCase() : trimmed.toUpperCase();
}

/**
 * Normalizes any raw stimulus into a clean Stimulus object.
 * Handles strings (e.g. "IMG_1"), objects with .type, or objects with .image / .src.
 */
export function normalizeStimulus(rawStim: unknown): Stimulus | undefined {
  if (!rawStim) return undefined;
  if (typeof rawStim === 'string') {
    const trimmed = rawStim.trim();
    if (!trimmed) return undefined;
    return {
      type: isAudioReference(trimmed) ? 'audio' : 'image',
      data: trimmed,
    };
  }
  if (Array.isArray(rawStim)) {
    const list: string[] = [];
    for (const item of rawStim) {
      if (typeof item === 'string' && item.trim()) {
        list.push(item.trim());
      } else if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        const d = itemObj.data ?? itemObj.src ?? itemObj.image ?? itemObj.img;
        if (typeof d === 'string' && d.trim()) {
          list.push(d.trim());
        }
      }
    }
    if (list.length > 0) {
      return {
        type: 'image',
        data: list.length === 1 ? list[0] : list,
      };
    }
    return undefined;
  }
  if (typeof rawStim === 'object') {
    const obj = rawStim as Record<string, unknown>;
    if (obj.type && obj.data !== undefined) {
      if (Array.isArray(obj.data)) {
        const cleanArr = obj.data.map(String).map((s) => s.trim()).filter(Boolean);
        return {
          type: obj.type as Stimulus['type'],
          data: cleanArr.length === 1 ? cleanArr[0] : cleanArr,
          ...(typeof obj.maxPlays === 'number' && { maxPlays: obj.maxPlays }),
        };
      }
      return {
        type: obj.type as Stimulus['type'],
        data: obj.data as string | Record<string, unknown>,
        ...(typeof obj.maxPlays === 'number' && { maxPlays: obj.maxPlays }),
      };
    }
    const imgData = obj.image ?? obj.src ?? obj.img ?? obj.url ?? obj.images;
    if (Array.isArray(imgData)) {
      const cleanArr = imgData.map(String).map((s) => s.trim()).filter(Boolean);
      return {
        type: 'image',
        data: cleanArr.length === 1 ? cleanArr[0] : cleanArr,
      };
    }
    if (typeof imgData === 'string' && imgData.trim()) {
      return { type: 'image', data: imgData.trim() };
    }
    const audioData = obj.audio;
    if (typeof audioData === 'string' && audioData.trim()) {
      return { type: 'audio', data: audioData.trim() };
    }
  }
  return undefined;
}

/**
 * Parses source question descriptors like "5-8", "5 to 8", "5, 6, 7, 8", or "5"
 * into a list of 1-based question numbers.
 */
export function parseQuestionRange(source: string | number | undefined): number[] {
  if (source === undefined || source === null) return [];
  const str = String(source).trim();
  if (!str) return [];

  const parts = str.split(/[,;&]|\band\b/i);
  const resultSet = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/(?:questions?|q)?\s*(\d+)\s*(?:-|–|—|to)\s*(?:questions?|q)?\s*(\d+)/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        resultSet.add(i);
      }
    } else {
      const single = trimmed.match(/\d+/);
      if (single) {
        resultSet.add(parseInt(single[0], 10));
      }
    }
  }

  return Array.from(resultSet).sort((a, b) => a - b);
}

/**
 * Normalizes a raw question object.
 */
function normalizeQuestionObject(
  raw: Record<string, unknown>,
  index: number
): Question & { _sectionTag?: string } {
  const id = raw.id !== undefined ? String(raw.id) : String(index + 1);
  const sectionTag = typeof raw.section === 'string' && raw.section.trim()
    ? raw.section.trim().toUpperCase()
    : undefined;

  const rawStim = normalizeStimulus(raw.stimulus ?? raw.image ?? raw.img);

  // 1. Audio Response
  if (raw.type === 'audio-response' || raw.questionType === 'audio-response') {
    const arq: AudioResponseQuestion & { _sectionTag?: string } = {
      id,
      questionType: 'audio-response',
      text: (raw.text as string) ?? '',
      prepTimeMinutes: typeof raw.prepTimeMinutes === 'number' ? raw.prepTimeMinutes : undefined,
      recordingTimeMinutes: typeof raw.recordingTimeMinutes === 'number' ? raw.recordingTimeMinutes : undefined,
      interlocutorAudio: Array.isArray(raw.interlocutorAudio) ? (raw.interlocutorAudio as string[]) : undefined,
      recordingWindows: typeof raw.recordingWindows === 'number' ? raw.recordingWindows : undefined,
      windowDurationSeconds: typeof raw.windowDurationSeconds === 'number' ? raw.windowDurationSeconds : undefined,
      _sectionTag: sectionTag,
    };
    if (rawStim) arq.stimulus = rawStim;
    return arq;
  }

  // 2. FRQ
  if (raw.type === 'frq' || raw.questionType === 'frq' || Array.isArray(raw.parts)) {
    const rawParts = Array.isArray(raw.parts) ? (raw.parts as Record<string, unknown>[]) : [];
    const parts: FRQuestion['parts'] = rawParts.map((p, pIdx) => {
      const partItem: FRQuestion['parts'][number] = {
        partLabel: String(p.partLabel ?? p.part ?? p.id ?? String.fromCharCode(65 + pIdx)),
        text: String(p.text ?? ''),
      };
      if (p.type) {
        partItem.type = p.type as FRQuestion['parts'][number]['type'];
      }
      const pStim = normalizeStimulus(p.stimulus ?? p.image);
      if (pStim) {
        partItem.stimulus = pStim;
      }
      return partItem;
    });

    const frq: FRQuestion & { _sectionTag?: string } = {
      id,
      questionType: 'frq',
      text: (raw.text as string) ?? '',
      parts,
      _sectionTag: sectionTag,
    };
    if (rawStim) frq.stimulus = rawStim;
    if (raw.correctAnswer) frq.correctAnswer = String(raw.correctAnswer);
    if (typeof raw.sharedStimulus === 'string' && raw.sharedStimulus.trim()) {
      frq.sharedStimulus = raw.sharedStimulus.trim();
      if (!frq.stimulus) {
        frq.stimulus = { type: 'text', data: frq.sharedStimulus };
      }
    }
    return frq;
  }

  // 3. MCQ (Default)
  const options = normalizeOptions(raw.options);
  const mcq: MCQuestion & { _sectionTag?: string } = {
    id,
    questionType: 'mcq',
    text: (raw.text as string) ?? '',
    options,
    correctAnswer: cleanCorrectAnswer(raw.correctAnswer),
    _sectionTag: sectionTag,
  };
  if (rawStim) mcq.stimulus = rawStim;
  const optStim = normalizeStimulus(raw.optionsStimulus ?? raw.optionsImage);
  if (optStim) mcq.optionsStimulus = optStim;
  if (raw.explanation) mcq.explanation = String(raw.explanation);
  if (typeof raw.sharedStimulus === 'string' && raw.sharedStimulus.trim()) {
    mcq.sharedStimulus = raw.sharedStimulus.trim();
    if (!mcq.stimulus) {
      mcq.stimulus = { type: 'text', data: mcq.sharedStimulus };
    }
  }
  return mcq;
}

/**
 * Splits a list of questions into ExamSection objects using the configured templates.
 */
function organizeIntoSections(
  questions: (Question & { _sectionTag?: string })[],
  examType: string,
  meta: typeof EXAM_META[string]
): { sections: ExamSection[]; errors: string[] } {
  const config = SECTION_CONFIGS[examType];
  const errors: string[] = [];

  if (!config || config.length === 0) {
    // Single section fallback
    const hasFRQ = questions.some((q) => q.questionType === 'frq');
    questions.forEach((q, idx) => {
      q.id = `section-1-${idx + 1}`;
    });

    const singleSection: ExamSection = {
      id: 'section-1',
      title: `Section I${hasFRQ ? ' — Free Response' : ' — Multiple Choice'}`,
      calculatorAllowed: false,
      calculatorType: 'none',
      timeMinutes: Math.max(30, questions.length * 2),
      defaultTimeMinutes: 30,
      suggestedTimeMinutes: Math.max(30, questions.length * 2),
      timePerQuestion: 2,
      breakAfterMinutes: null,
      directions: generateDirections({
        subject: meta.subject,
        sectionTitle: 'Section I',
        questionCount: questions.length,
        timeMinutes: Math.max(30, questions.length * 2),
        calculatorPolicy: 'none',
        isFRQ: hasFRQ,
        examType,
      }),
      questions: questions.map((q) => {
        const clean = { ...q };
        delete clean._sectionTag;
        return clean as Question;
      }),
    };

    return { sections: [singleSection], errors };
  }

  const templatesByTag = new Map(config.map((t) => [t.sectionTag.toUpperCase(), t]));
  const tagList = config.map((t) => `"${t.sectionTag}"`).join(', ');

  const tagBuckets: Record<string, Question[]> = {};

  questions.forEach((q, idx) => {
    let tag = q._sectionTag;

    // Auto-inference: if there's only 1 section or if tag is missing
    if (!tag) {
      if (config.length === 1) {
        tag = config[0].sectionTag;
      } else {
        // Try matching by questionType if unique
        const matchingTemplates = config.filter((t) => t.questionType === q.questionType);
        if (matchingTemplates.length === 1) {
          tag = matchingTemplates[0].sectionTag;
        }
      }
    }

    if (!tag) {
      errors.push(`Question ${idx + 1} is missing a "section" tag. Valid tags for ${meta.subject} are: ${tagList}.`);
      return;
    }

    const template = templatesByTag.get(tag);
    if (!template) {
      errors.push(`Question ${idx + 1} has invalid section "${tag}". Valid tags are: ${tagList}.`);
      return;
    }

    const isAudioInFrq = q.questionType === 'audio-response' && template.questionType === 'frq';
    if (q.questionType !== template.questionType && !isAudioInFrq) {
      errors.push(
        `Question ${idx + 1} is tagged "${tag}", but section "${template.title}" expects ${template.questionType.toUpperCase()} questions (found ${q.questionType}).`
      );
    }

    const clean = { ...q };
    delete clean._sectionTag;
    if (!tagBuckets[tag]) tagBuckets[tag] = [];
    tagBuckets[tag].push(clean as Question);
  });

  if (errors.length > 0) {
    return { sections: [], errors };
  }

  const sections: ExamSection[] = [];
  for (const template of config) {
    const sectionQuestions = tagBuckets[template.sectionTag] ?? [];
    if (sectionQuestions.length === 0) continue;

    sectionQuestions.forEach((q, idx) => {
      q.id = `${template.sectionId}-${idx + 1}`;
    });

    const defaultTime = template.timeMinutes;
    let suggestedTime = template.timeMinutes;
    if (template.timePerQuestion) {
      suggestedTime = Math.ceil(sectionQuestions.length * template.timePerQuestion);
      if (template.readingPeriodMinutes) {
        suggestedTime += template.readingPeriodMinutes;
      }
    }

    sections.push({
      id: template.sectionId,
      title: template.title,
      calculatorAllowed: template.calculatorType !== 'none',
      calculatorType: template.calculatorType,
      timeMinutes: defaultTime,
      defaultTimeMinutes: defaultTime,
      suggestedTimeMinutes: suggestedTime,
      timePerQuestion: template.timePerQuestion,
      readingPeriodMinutes: template.readingPeriodMinutes,
      breakAfterMinutes: template.breakAfterMinutes,
      frqMode: template.frqMode,
      directions: generateDirections({
        subject: meta.subject,
        sectionTitle: template.title,
        questionCount: sectionQuestions.length,
        timeMinutes: defaultTime,
        calculatorPolicy: template.calculatorPolicy,
        isFRQ: template.questionType === 'frq',
        examType,
      }),
      questions: sectionQuestions,
    });
  }

  if (sections.length > 0) {
    sections[sections.length - 1].breakAfterMinutes = null;
  }

  return { sections, errors };
}

/**
 * Detects shared passages, experiment descriptions, and reading sets in question texts
 * (e.g. "Questions 12-17 refer to the following information...") or from media manifests,
 * extracts the passage into `sharedStimulus`, cleans the question prompt in `q.text`,
 * and propagates `sharedStimulus` across all questions in the group so that the passage
 * persists on the left stimulus pane throughout the entire question group.
 */
function extractAndPropagateSharedStimuli(
  questions: (Question & { _sectionTag?: string })[],
  manifest: MediaManifestItem[]
): void {
  // 1. Scan for explicit passage headers embedded in question texts
  // e.g. "Questions 12-17 refer to...", "Directions: Questions 5–8 refer to...", "Questions 40 to 44 are based on..."
  const passageHeaderRegex =
    /(?:(?:Directions:?\s*)?(?:Questions?|Q)\s*(\d+)\s*(?:-|–|—|to|through)\s*(\d+)[^.<>\n]*?(?:refer to|are based on|pertain to)[^.<>\n]*[.:]?|(?:refer to the following[^.<>\n]*?(?:for\s+)?(?:questions?|q)\s*(\d+)\s*(?:-|–|—|to|through)\s*(\d+)[^.<>\n]*[.:]?)|(?:(?:Questions?|Q)\s*(\d+)\s*(?:-|–|—|to|through)\s*(\d+)\s*[:.-]\s*(?:Read the following|The following|Refer to)))/i;

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    if (!q || !q.text) continue;

    const match = q.text.match(passageHeaderRegex);
    if (match) {
      const rawStart = match[1] || match[3] || match[5];
      const rawEnd = match[2] || match[4] || match[6];
      const startQ = parseInt(rawStart, 10);
      const endQ = parseInt(rawEnd, 10);
      const minQ = Math.min(startQ, endQ);
      const maxQ = Math.max(startQ, endQ);

      // Separate passage prefix from the final question prompt
      let passageText: string;
      let promptText: string;

      const paragraphs = q.text.split(/(?:<br\s*\/?>\s*){2,}|\n\s*\n/i).map((p) => p.trim()).filter(Boolean);
      if (paragraphs.length >= 2) {
        promptText = paragraphs[paragraphs.length - 1];
        passageText = paragraphs.slice(0, -1).join('<br><br>');
      } else {
        const lines = q.text.split(/<br\s*\/?>|\n/i).map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          promptText = lines[lines.length - 1];
          passageText = lines.slice(0, -1).join('<br>');
        } else {
          const sentenceSplit = q.text.match(/^([\s\S]*?[.:])\s*(((?:Which of the following|Based on|What |How |Why |In which|Explain|According to|If |Assuming ).+?\?))$/i);
          if (sentenceSplit) {
            passageText = sentenceSplit[1].trim();
            promptText = sentenceSplit[2].trim();
          } else {
            passageText = q.text.trim();
            promptText = q.text.trim();
          }
        }
      }

      if (passageText) {
        if ('sharedStimulus' in q) {
          q.sharedStimulus = passageText;
        }
        q.text = promptText;

        // Propagate to all questions in the range minQ..maxQ
        for (let targetIdx = 0; targetIdx < questions.length; targetIdx++) {
          const targetQ = questions[targetIdx];
          const parsedId = parseInt(targetQ.id, 10);
          const qNum = !isNaN(parsedId) ? parsedId : targetIdx + 1;

          if (qNum >= minQ && qNum <= maxQ) {
            if ('sharedStimulus' in targetQ && (!targetQ.sharedStimulus || !targetQ.sharedStimulus.trim())) {
              targetQ.sharedStimulus = passageText;
            }
            if (!targetQ.stimulus) {
              targetQ.stimulus = { type: 'text', data: passageText };
            }
          }
        }
      }
    }
  }

  // 2. Propagate sharedStimulus across question ranges defined in media manifest (e.g. sourceQuestion: "12-17" or "5-8")
  for (const item of manifest) {
    if (!item || !item.sourceQuestion) continue;
    const qNumbers = parseQuestionRange(item.sourceQuestion);
    if (qNumbers.length <= 1) continue;

    const matchingQuestions = questions.filter((q, idx) => {
      const parsedNum = parseInt(q.id, 10);
      const qNum = !isNaN(parsedNum) ? parsedNum : idx + 1;
      return qNumbers.includes(qNum);
    });

    if (matchingQuestions.length === 0) continue;

    // Find any existing sharedStimulus in the group
    const groupSharedText = matchingQuestions.find(
      (q) => 'sharedStimulus' in q && typeof q.sharedStimulus === 'string' && q.sharedStimulus.trim()
    );
    let sharedTextStr = groupSharedText && 'sharedStimulus' in groupSharedText ? groupSharedText.sharedStimulus : undefined;

    // If none found, check if the first question contains an introductory passage
    if (!sharedTextStr && matchingQuestions.length > 0) {
      const firstQ = matchingQuestions[0];
      const isIntroductory = /(?:refer to the following|in an experiment|in an investigation|researchers? (?:studied|investigated|analyzed|tested)|a study was conducted|a student)/i.test(firstQ.text);
      const paragraphs = firstQ.text.split(/(?:<br\s*\/?>\s*){2,}|\n\s*\n/i).map((p) => p.trim()).filter(Boolean);

      if (isIntroductory && paragraphs.length >= 2) {
        const promptText = paragraphs[paragraphs.length - 1];
        const passageText = paragraphs.slice(0, -1).join('<br><br>');
        if ('sharedStimulus' in firstQ) {
          firstQ.sharedStimulus = passageText;
        }
        firstQ.text = promptText;
        sharedTextStr = passageText;
      }
    }

    if (sharedTextStr) {
      for (const q of matchingQuestions) {
        if ('sharedStimulus' in q && (!q.sharedStimulus || !q.sharedStimulus.trim())) {
          q.sharedStimulus = sharedTextStr;
        }
        if (!q.stimulus) {
          q.stimulus = { type: 'text', data: sharedTextStr };
        }
      }
    }
  }
}

/**
 * Main auto-repair parser function.
 * Accepts any JSON format (flat array, manifest object, or multi-batch text),
 * repairs common syntax anomalies, extracts all media, and organizes into an Exam.
 */
export function parseAndRepairExam(rawInput: string, examType: string): ExamParseResult {
  const emptyResult: ExamParseResult = {
    exam: null,
    questions: [],
    mediaManifest: [],
    requiredMedia: [],
    error: null,
    errors: [],
    warnings: [],
    fixupPrompt: null,
    questionCount: 0,
  };

  const rawChunks = extractJsonChunks(rawInput);
  if (rawChunks.length === 0) {
    return emptyResult;
  }

  const meta = EXAM_META[examType] || {
    label: examType,
    title: `${examType} Practice`,
    examType: 'AP',
    subject: examType,
    studentName: 'Student',
  };

  const rawQuestions: Record<string, unknown>[] = [];
  const mediaManifest: MediaManifestItem[] = [];
  const parseErrors: string[] = [];

  for (let idx = 0; idx < rawChunks.length; idx++) {
    const chunk = rawChunks[idx];
    const cleaned = cleanJsonString(chunk);
    if (!cleaned) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e: unknown) {
      // Attempt recovery for concatenated arrays or objects:
      // e.g. [...] [...] -> [[...], [...]]
      // or {...} {...} -> [{...}, {...}]
      try {
        const fixedArray = cleaned.startsWith('[') && cleaned.endsWith(']')
          ? cleaned
          : `[${cleaned.replace(/}\s*{/g, '},{').replace(/]\s*\[/g, '],[')}]`;
        parsed = JSON.parse(fixedArray);
      } catch {
        const msg = e instanceof Error ? e.message : String(e);
        parseErrors.push(`Batch ${idx + 1}: ${msg}`);
      }
    }

    if (parsed !== undefined) {
      absorbParsed(parsed, rawQuestions, mediaManifest);
    }
  }

  if (rawQuestions.length === 0) {
    if (parseErrors.length > 0) {
      const msg = parseErrors[0];
      return {
        ...emptyResult,
        error: `JSON Syntax Error: ${msg}. Check for unmatched brackets or invalid characters.`,
        errors: parseErrors.map((m) => `JSON Syntax Error: ${m}`),
        fixupPrompt: `There was a JSON syntax error in your output:\n"${msg}"\nPlease re-output valid, well-formed JSON without markdown text or truncation.`,
      };
    }
    return {
      ...emptyResult,
      error: 'No questions detected. Provide an array of question objects.',
      errors: ['No questions detected in the input.'],
    };
  }

  // Normalize questions
  const normalizedQuestions = rawQuestions.map((q, idx) => normalizeQuestionObject(q, idx));

  // Auto-detect and split compound figure crops (e.g. "Figure 1 ... and Figure 2 ...") into distinct media items
  const finalManifest: MediaManifestItem[] = [];
  const splitMap = new Map<string, { id1: string; id2: string }>();

  for (const item of mediaManifest) {
    if (item.crop) {
      const splitRegex = /(Fig(?:ure|\.)?\s*\d+\b[\s\S]*?)(?:,\s*and\s+|\s+and\s+)(Fig(?:ure|\.)?\s*\d+\b[\s\S]*)/i;
      const match = item.crop.match(splitRegex);
      if (match) {
        const item1: MediaManifestItem = {
          ...item,
          id: item.id,
          crop: match[1].trim(),
        };
        const item2: MediaManifestItem = {
          ...item,
          id: `${item.id}_B`,
          crop: match[2].trim(),
        };
        finalManifest.push(item1, item2);
        splitMap.set(item.id, { id1: item1.id, id2: item2.id });
        continue;
      }
    }
    finalManifest.push(item);
  }

  // Auto-extract and propagate shared passages across grouped questions
  extractAndPropagateSharedStimuli(normalizedQuestions, finalManifest);

  // Auto-propagate persistent media & shared stimuli across question ranges (e.g. "sourceQuestion": "5-8")
  for (const item of finalManifest) {
    if (!item || !item.id || item.sourceQuestion === undefined) continue;
    const qNumbers = parseQuestionRange(item.sourceQuestion);
    if (qNumbers.length === 0) continue;

    const matchingQuestions = normalizedQuestions.filter((q, idx) => {
      const parsedNum = parseInt(q.id, 10);
      const qNum = !isNaN(parsedNum) ? parsedNum : idx + 1;
      return qNumbers.includes(qNum);
    });

    const sharedText = matchingQuestions.find(
      (q) => 'sharedStimulus' in q && typeof q.sharedStimulus === 'string' && q.sharedStimulus.trim()
    );
    const sharedTextStr = sharedText && 'sharedStimulus' in sharedText ? sharedText.sharedStimulus : undefined;

    for (const q of matchingQuestions) {
      let shouldAttach = true;
      if (item.id.endsWith('_B') && item.crop) {
        const figNumMatch = item.crop.match(/Fig(?:ure|\.)?\s*(\d+)/i);
        const figNum = figNumMatch ? figNumMatch[1] : null;
        if (figNum) {
          const otherFigMatch = q.text.match(/Fig(?:ure|\.)?\s*(\d+)/i);
          if (otherFigMatch && otherFigMatch[1] !== figNum) {
            shouldAttach = false;
          }
        }
      } else {
        const splitInfo = splitMap.get(item.id);
        if (splitInfo) {
          const fig2Item = finalManifest.find((m) => m.id === splitInfo.id2);
          const fig2NumMatch = fig2Item?.crop?.match(/Fig(?:ure|\.)?\s*(\d+)/i);
          const fig2Num = fig2NumMatch ? fig2NumMatch[1] : '2';
          const fig1NumMatch = item.crop?.match(/Fig(?:ure|\.)?\s*(\d+)/i);
          const fig1Num = fig1NumMatch ? fig1NumMatch[1] : '1';
          if (
            new RegExp(`Fig(?:ure|\\.)?\\s*${fig2Num}\\b`, 'i').test(q.text) &&
            !new RegExp(`Fig(?:ure|\\.)?\\s*${fig1Num}\\b`, 'i').test(q.text)
          ) {
            shouldAttach = false;
          }
        }
      }

      if (shouldAttach) {
        const attachId = item.id.trim();
        if (!q.stimulus) {
          q.stimulus = {
            type: item.kind || 'image',
            data: attachId,
          };
        } else if (q.stimulus.type === 'text') {
          if ('sharedStimulus' in q && !q.sharedStimulus) {
            q.sharedStimulus = typeof q.stimulus.data === 'string' ? q.stimulus.data : JSON.stringify(q.stimulus.data);
          }
          q.stimulus = {
            type: item.kind || 'image',
            data: attachId,
          };
        } else if (q.stimulus.type === 'image') {
          const currentData = Array.isArray(q.stimulus.data) ? q.stimulus.data : [q.stimulus.data as string];
          if (!currentData.includes(attachId)) {
            q.stimulus.data = [...currentData, attachId];
          }
        }
      }

      if ('sharedStimulus' in q && !q.sharedStimulus && sharedTextStr) {
        q.sharedStimulus = sharedTextStr;
      }
    }
  }

  // Organize into sections
  const { sections, errors: sectionErrors } = organizeIntoSections(normalizedQuestions, examType, meta);

  // Extract all media requirements
  const requiredMedia = walkExamMedia(normalizedQuestions, finalManifest);

  if (sectionErrors.length > 0) {
    const fixup = `The following questions have issues with section formatting:\n${sectionErrors
      .slice(0, 5)
      .map((e) => `- ${e}`)
      .join('\n')}\n\nPlease regenerate the JSON ensuring every question has a valid "section" tag matching the subject requirements.`;

    return {
      ...emptyResult,
      questions: normalizedQuestions,
      mediaManifest: finalManifest,
      requiredMedia,
      error: sectionErrors[0],
      errors: sectionErrors,
      fixupPrompt: fixup,
      questionCount: normalizedQuestions.length,
    };
  }

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
    questions: normalizedQuestions,
    mediaManifest: finalManifest,
    requiredMedia,
    error: null,
    errors: [],
    warnings: [],
    fixupPrompt: null,
    questionCount: normalizedQuestions.length,
  };
}
