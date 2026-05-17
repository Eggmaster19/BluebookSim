import type { Exam } from '../../types/ExamSchema';
import { generateDirections } from '../common/directionsTemplate';

export const biologyExam: Exam = {
  metadata: {
    title: 'AP Biology Practice',
    examType: 'AP',
    subject: 'Biology',
  },
  sections: [
    {
      id: 'section-1',
      title: 'Section I - Multiple Choice',
      calculatorAllowed: true,
      timeMinutes: 90,
      directions: generateDirections({
        subject: 'Biology',
        sectionTitle: 'Section I',
        questionCount: 60,
        timeMinutes: 90,
        calculatorPolicy: 'allowed',
        isFRQ: false,
      }),
      questions: [
        {
          id: 'bio-q1',
          questionType: 'mcq',
          text: 'Which of the following best describes the role of water in photosynthesis?',
          options: [
            { id: 'A', text: 'Water is the terminal electron acceptor in the electron transport chain.' },
            { id: 'B', text: 'Water molecules donate electrons to the reaction center of Photosystem II.' },
            { id: 'C', text: 'Water provides the carbon atoms needed to synthesize glucose.' },
            { id: 'D', text: 'Water acts as an enzyme to catalyze the Calvin cycle.' },
          ],
          correctAnswer: 'B',
        },
        {
          id: 'bio-q3',
          questionType: 'mcq',
          text: 'Which of the following processes occurs in both respiration and photosynthesis?',
          options: [
            { id: 'A', text: 'Calvin cycle' },
            { id: 'B', text: 'Glycolysis' },
            { id: 'C', text: 'Chemiosmosis' },
            { id: 'D', text: 'Krebs cycle' },
          ],
          correctAnswer: 'C',
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Section II - Free Response',
      calculatorAllowed: true,
      timeMinutes: 90,
      directions: generateDirections({
        subject: 'Biology',
        sectionTitle: 'Section II',
        questionCount: 6,
        timeMinutes: 90,
        calculatorPolicy: 'allowed',
        isFRQ: true,
      }),
      questions: [
        {
          id: 'bio-q2',
          questionType: 'frq',
          text: 'A student investigates the effect of light intensity on the rate of photosynthesis in Elodea plants. The student measures the volume of oxygen gas produced over a 10-minute period at various distances from a light source.',
          parts: [
            {
              partLabel: 'A',
              text: 'Identify the independent and dependent variables in this experiment.',
            },
            {
              partLabel: 'B',
              text: 'Explain why oxygen gas is produced during photosynthesis. Include the specific light-dependent reactions involved.',
            },
            {
              partLabel: 'C',
              text: 'Predict how the rate of oxygen production will change as the distance from the light source increases. Justify your prediction.',
            },
          ],
        },
      ],
    },
  ],
};
