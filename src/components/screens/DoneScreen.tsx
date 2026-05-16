import React from 'react';
import { useExamStore } from '../../store/examStore';

export const DoneScreen: React.FC = () => {
  const studentName = useExamStore((s) => s.studentName);
  const exam = useExamStore((s) => s.exam);
  const answers = useExamStore((s) => s.answers);

  // Calculate total questions answered
  const totalQuestions = exam?.sections.reduce((acc, s) => acc + s.questions.length, 0) || 0;
  const totalAnswered = Object.keys(answers).length;

  return (
    <div className="bb-done">
      <h1 className="bb-done__title">🎉 Test Complete!</h1>
      <p className="bb-done__subtitle">
        Congratulations, {studentName}. You have completed the practice exam.
      </p>
      <p className="bb-done__subtitle">
        {totalAnswered} of {totalQuestions} questions answered.
      </p>
      <button
        className="bb-footer__btn bb-footer__btn--next"
        style={{ marginTop: '24px', padding: '12px 40px', fontSize: '16px' }}
        onClick={() => window.location.reload()}
      >
        Start New Exam
      </button>
    </div>
  );
};
