import React from 'react';
import { useExamStore } from '../../store/examStore';

export const NavigationModal: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());
  const currentQuestionIndex = useExamStore((s) => s.currentQuestionIndex);
  const answers = useExamStore((s) => s.answers);
  const flagged = useExamStore((s) => s.flagged);
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const closeNavModal = useExamStore((s) => s.closeNavModal);
  const setPhase = useExamStore((s) => s.setPhase);

  if (!section) return null;

  return (
    <>
      <div className="bb-nav-modal-overlay" onClick={closeNavModal} />
      <div className="bb-nav-modal">
        <div className="bb-nav-modal__header">
          <div className="bb-nav-modal__title">{section.title} Questions</div>
          <button className="bb-nav-modal__close" onClick={closeNavModal}>
            ×
          </button>
        </div>

        <div className="bb-nav-modal__legend">
          <div className="bb-nav-modal__legend-item">
            <span className="bb-nav-modal__legend-icon--current">📍</span>
            <span>Current</span>
          </div>
          <div className="bb-nav-modal__legend-item">
            <span className="bb-nav-modal__legend-icon--unanswered" />
            <span>Unanswered</span>
          </div>
          <div className="bb-nav-modal__legend-item">
            <span className="bb-nav-modal__legend-icon--flagged">🚩</span>
            <span>For Review</span>
          </div>
        </div>

        <div className="bb-nav-modal__grid">
          {section.questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentQuestionIndex;
            const isFlagged = !!flagged[q.id];

            let className = 'bb-nav-modal__item';
            className += isAnswered
              ? ' bb-nav-modal__item--answered'
              : ' bb-nav-modal__item--unanswered';
            if (isCurrent) className += ' bb-nav-modal__item--current';
            if (isFlagged) className += ' bb-nav-modal__item--flagged';

            return (
              <div key={q.id} className={className} onClick={() => goToQuestion(i)}>
                {i + 1}
              </div>
            );
          })}
        </div>

        <button
          className="bb-nav-modal__review-btn"
          onClick={() => {
            closeNavModal();
            setPhase('check');
          }}
        >
          Go to Review Page
        </button>
      </div>
    </>
  );
};
