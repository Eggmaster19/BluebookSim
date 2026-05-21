import React from 'react';
import { useExamStore } from '../../store/examStore';

export const CheckYourWorkScreen: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());
  const answers = useExamStore((s) => s.answers);
  const flagged = useExamStore((s) => s.flagged);
  const essayResponses = useExamStore((s) => s.essayResponses);
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const setPhase = useExamStore((s) => s.setPhase);

  if (!section) return null;

  const isEssayMode = section.frqMode === 'essay';

  return (
    <div className="bb-check">
      <h1 className="bb-check__title">Check Your Work</h1>
      <p className="bb-check__subtitle">
        On test day, you won't be able to move on to the next module until time expires.
      </p>
      <p className="bb-check__subtitle">
        For these practice questions, you can click <strong>Next</strong> when you're ready to move on.
      </p>

      <div className="bb-check__card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="bb-check__card-title">{section.title} Questions</div>
          <div className="bb-check__card-legend">
            <div className="bb-check__card-legend-item">
              <span className="bb-nav-modal__legend-icon--unanswered" />
              <span>Unanswered</span>
            </div>
            <div className="bb-check__card-legend-item">
              <span>🚩</span>
              <span>For Review</span>
            </div>
          </div>
        </div>

        <div className="bb-nav-modal__grid">
          {section.questions.map((q, i) => {
            // For essay FRQs, check essayResponses; for MCQs, check answers
            let isAnswered = !!answers[q.id];
            if (!isAnswered && q.questionType === 'frq' && isEssayMode && essayResponses[q.id]) {
              const text = essayResponses[q.id].replace(/<[^>]*>/g, '').trim();
              isAnswered = text.length > 0;
            }
            const isFlagged = !!flagged[q.id];

            let className = 'bb-nav-modal__item';
            className += isAnswered
              ? ' bb-nav-modal__item--answered'
              : ' bb-nav-modal__item--unanswered';
            if (isFlagged) className += ' bb-nav-modal__item--flagged';

            return (
              <div
                key={q.id}
                className={className}
                onClick={() => {
                  goToQuestion(i);
                  setPhase('exam');
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
