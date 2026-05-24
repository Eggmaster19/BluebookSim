// ── Stimulus Types ──────────────────────────────────────────────────
export type StimulusType = 'text' | 'katex' | 'function-plot' | 'mermaid' | 'svg' | 'image' | 'table' | 'audio';

export interface Stimulus {
  type: StimulusType;
  data: string | Record<string, unknown>;
  maxPlays?: number; // Optional limit for audio plays
}

// ── Answer Option ───────────────────────────────────────────────────
export interface AnswerOption {
  id: string;      // "A", "B", "C", "D"
  text: string;    // May contain $$katex$$ inline or raw data for complex types
  type?: StimulusType; // Optional type for rendering complex options (e.g., 'mermaid')
}

// ── Question Types ──────────────────────────────────────────────────
export interface MCQuestion {
  id: string;
  questionType: 'mcq';
  stimulus?: Stimulus;
  text: string;
  optionsStimulus?: Stimulus;
  options: AnswerOption[];
  correctAnswer: string;
  explanation?: string;
}

export interface FRQPart {
  partLabel: string;  // "A", "B", "C", "D"
  text: string;
  type?: StimulusType;   // Optional type for rendering complex part content (e.g., 'mermaid')
  stimulus?: Stimulus;   // Optional stimulus attached to this specific part
}

export interface FRQuestion {
  id: string;
  questionType: 'frq';
  stimulus?: Stimulus;
  text: string;       // The introductory setup text
  parts: FRQPart[];
  correctAnswer?: string;
}

export interface AudioResponseQuestion {
  id: string;
  questionType: 'audio-response';
  stimulus?: Stimulus;
  text: string;
  prepTimeMinutes?: number;
  recordingTimeMinutes?: number;
  interlocutorAudio?: string[]; // Array of audio paths/data for Q&A (e.g. 4 interlocutor clips)
  recordingWindows?: number; // Number of recordings to make (e.g. 4 for Q&A)
  windowDurationSeconds?: number; // Duration of each recording window (e.g. 40s)
}

export type Question = MCQuestion | FRQuestion | AudioResponseQuestion;

export type CalculatorType = 'none' | 'scientific' | 'graphing' | 'both' | '4-function';
export type HighlightColor = 'yellow' | 'blue' | 'pink';
export type HighlightUnderline = 'solid' | 'dashed' | 'dotted' | 'none';

export interface HighlightNote {
  id: string;
  questionId: string;
  areaId: string;
  text: string;
  color: HighlightColor;
  underline: HighlightUnderline;
  note: string;
  hasNote: boolean;
  createdAt: number;
}

// ── Section ─────────────────────────────────────────────────────────
export interface ExamSection {
  id: string;
  title: string;           // e.g. "Section I, Part A - No Calculator Allowed"
  calculatorAllowed: boolean;
  calculatorType: CalculatorType;
  timeMinutes: number;     // The actual time limit applied to the section
  defaultTimeMinutes?: number; // The standard time for this section
  suggestedTimeMinutes?: number; // Suggested time based on number of questions
  readingPeriodMinutes?: number; // E.g. 10 minutes reading period for Econ FRQ
  directions: string;      // HTML/text for the directions screen
  questions: Question[];
  breakAfterMinutes: number | null; // null = no break (last section)
  /** Controls FRQ rendering: 'parts' = multi-part (Calc/Bio), 'essay' = rich-text editor (Lit) */
  frqMode?: 'parts' | 'essay';
}

// ── Full Exam ───────────────────────────────────────────────────────
export interface Exam {
  metadata: {
    title: string;
    examType: string;
    subject: string;
  };
  sections: ExamSection[];
}
