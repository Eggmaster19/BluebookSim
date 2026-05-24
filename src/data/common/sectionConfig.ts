import type { CalculatorType } from '../../types/ExamSchema';

/**
 * Section Configuration Registry
 *
 * Defines the exact module structure for each AP exam subject.
 * When a flat JSON array of questions is pasted, the parser uses this
 * configuration to split questions into the correct sections with
 * proper break durations, calculator policies, and directions.
 */

export interface SectionTemplate {
  sectionId: string;
  title: string;
  /** Which question type belongs in this section */
  questionType: 'mcq' | 'frq';
  /** Default time allocation in minutes */
  timeMinutes: number;
  /** Suggested time per question in minutes */
  timePerQuestion?: number;
  calculatorPolicy: 'none' | 'required' | 'allowed';
  /** Break duration after this section in minutes. null = no break (last section). */
  breakAfterMinutes: number | null;
  /**
   * The section tag that the AI prompt instructs the LLM to use.
   * e.g. "1A", "1B", "2A", "2B" for Calc AB, or "1", "2" for Bio.
   * Used to match questions to sections when a flat array is provided.
   */
  sectionTag: string;
  /** Controls FRQ rendering: 'parts' = multi-part (Calc/Bio), 'essay' = rich-text editor (Lit) */
  frqMode?: 'parts' | 'essay';
  /** Reading period in minutes at the start of the section (e.g., 10 minutes for Econ FRQ) */
  readingPeriodMinutes?: number;
  /** Specifies the type of calculator to load if allowed */
  calculatorType: CalculatorType;
}

export const SECTION_CONFIGS: Record<string, SectionTemplate[]> = {
  calc_ab: [
    {
      sectionId: 'sec-1a',
      title: 'Section I, Part A — No Calculator',
      questionType: 'mcq',
      calculatorType: 'none',
      timeMinutes: 60,
      timePerQuestion: 2,
      calculatorPolicy: 'none',
      breakAfterMinutes: 1,
      sectionTag: '1A',
    },
    {
      sectionId: 'sec-1b',
      title: 'Section I, Part B — Calculator Required',
      questionType: 'mcq',
      calculatorType: 'graphing',
      timeMinutes: 45,
      timePerQuestion: 3,
      calculatorPolicy: 'required',
      breakAfterMinutes: 10,
      sectionTag: '1B',
    },
    {
      sectionId: 'sec-2a',
      title: 'Section II, Part A — Calculator Required',
      questionType: 'frq',
      calculatorType: 'graphing',
      timeMinutes: 30,
      timePerQuestion: 15,
      calculatorPolicy: 'required',
      breakAfterMinutes: 1,
      sectionTag: '2A',
      frqMode: 'parts',
    },
    {
      sectionId: 'sec-2b',
      title: 'Section II, Part B — No Calculator',
      questionType: 'frq',
      calculatorType: 'none',
      timeMinutes: 30,
      timePerQuestion: 15,
      calculatorPolicy: 'none',
      breakAfterMinutes: null,
      sectionTag: '2B',
      frqMode: 'parts',
    },
  ],
  bio: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: 'scientific',
      timeMinutes: 90,
      timePerQuestion: 1.5,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: 'scientific',
      timeMinutes: 90,
      timePerQuestion: 15,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'parts',
    },
  ],
  lit: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: 'none',
      timeMinutes: 60,
      timePerQuestion: 1.09, // approx 1 min 5 secs
      calculatorPolicy: 'none',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: 'none',
      timeMinutes: 120,
      timePerQuestion: 40,
      calculatorPolicy: 'none',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'essay',
    },
  ],
  phys_mech: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: 'both',
      timeMinutes: 80,
      timePerQuestion: 2,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: 'both',
      timeMinutes: 100,
      timePerQuestion: 25,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'parts',
    },
  ],
  phys_em: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: 'both',
      timeMinutes: 80,
      timePerQuestion: 2,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: 'both',
      timeMinutes: 100,
      timePerQuestion: 25,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'parts',
    },
  ],
  econ_macro: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: '4-function',
      timeMinutes: 70,
      timePerQuestion: 1.1666, // approx 1 min 10 secs
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: '4-function',
      timeMinutes: 60,
      timePerQuestion: 20,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'essay',
      readingPeriodMinutes: 10,
    },
  ],
  econ_micro: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorType: '4-function',
      timeMinutes: 70,
      timePerQuestion: 1.1666, // approx 1 min 10 secs
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorType: '4-function',
      timeMinutes: 60,
      timePerQuestion: 20,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'essay',
      readingPeriodMinutes: 10,
    },
  ],
  german: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Free-Response',
      questionType: 'frq',
      calculatorType: 'none',
      timeMinutes: 85,
      calculatorPolicy: 'none',
      breakAfterMinutes: 10,
      sectionTag: '1',
      frqMode: 'essay',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Multiple-Choice',
      questionType: 'mcq',
      calculatorType: 'none',
      timeMinutes: 80,
      timePerQuestion: 1.45,
      calculatorPolicy: 'none',
      breakAfterMinutes: null,
      sectionTag: '2',
    },
  ],
};

// Inject Calculus BC configuration (same as Calculus AB)
SECTION_CONFIGS['calc_bc'] = SECTION_CONFIGS['calc_ab'];
