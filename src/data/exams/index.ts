import { calculusABExam } from './calculusAB';
import { biologyExam } from './biology';
import type { Exam } from '../../types/ExamSchema';

export const exams: Exam[] = [
  calculusABExam,
  biologyExam,
];

// Re-export individually if needed elsewhere
export { calculusABExam, biologyExam };
