// ── Stimulus Types ──────────────────────────────────────────────────
export type StimulusType = 'text' | 'katex' | 'function-plot' | 'mermaid' | 'svg' | 'image' | 'table';

export interface Stimulus {
  type: StimulusType;
  data: string | Record<string, unknown>;
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

export type Question = MCQuestion | FRQuestion;

// ── Section ─────────────────────────────────────────────────────────
export interface ExamSection {
  id: string;
  title: string;           // e.g. "Section I, Part A - No Calculator Allowed"
  calculatorAllowed: boolean;
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
