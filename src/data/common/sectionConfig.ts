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
  calculatorAllowed: boolean;
  /** Default time allocation in minutes */
  timeMinutes: number;
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
}

export const SECTION_CONFIGS: Record<string, SectionTemplate[]> = {
  calc_ab: [
    {
      sectionId: 'sec-1a',
      title: 'Section I, Part A — No Calculator',
      questionType: 'mcq',
      calculatorAllowed: false,
      timeMinutes: 60,
      calculatorPolicy: 'none',
      breakAfterMinutes: 1,
      sectionTag: '1A',
    },
    {
      sectionId: 'sec-1b',
      title: 'Section I, Part B — Calculator Required',
      questionType: 'mcq',
      calculatorAllowed: true,
      timeMinutes: 45,
      calculatorPolicy: 'required',
      breakAfterMinutes: 10,
      sectionTag: '1B',
    },
    {
      sectionId: 'sec-2a',
      title: 'Section II, Part A — Calculator Required',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 30,
      calculatorPolicy: 'required',
      breakAfterMinutes: 1,
      sectionTag: '2A',
      frqMode: 'parts',
    },
    {
      sectionId: 'sec-2b',
      title: 'Section II, Part B — No Calculator',
      questionType: 'frq',
      calculatorAllowed: false,
      timeMinutes: 30,
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
      calculatorAllowed: true,
      timeMinutes: 90,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 90,
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
      calculatorAllowed: false,
      timeMinutes: 60,
      calculatorPolicy: 'none',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: false,
      timeMinutes: 120,
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
      calculatorAllowed: true,
      timeMinutes: 80,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 100,
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
      calculatorAllowed: true,
      timeMinutes: 80,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 100,
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
      calculatorAllowed: true,
      timeMinutes: 70,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 60,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'parts',
    },
  ],
  econ_micro: [
    {
      sectionId: 'sec-1',
      title: 'Section I — Multiple Choice',
      questionType: 'mcq',
      calculatorAllowed: true,
      timeMinutes: 70,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: 10,
      sectionTag: '1',
    },
    {
      sectionId: 'sec-2',
      title: 'Section II — Free Response',
      questionType: 'frq',
      calculatorAllowed: true,
      timeMinutes: 60,
      calculatorPolicy: 'allowed',
      breakAfterMinutes: null,
      sectionTag: '2',
      frqMode: 'parts',
    },
  ],
};
