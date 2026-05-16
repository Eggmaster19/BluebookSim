import React from 'react';
import { useExamStore } from '../../store/examStore';
import { NavigationModal } from '../exam/NavigationModal';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface FooterProps {
  onResume?: () => void;
  showResume?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onResume, showResume }) => {
  const studentName = useExamStore((s) => s.studentName);
  const currentQuestionIndex = useExamStore((s) => s.currentQuestionIndex);
  const questionCount = useExamStore((s) => s.getSectionQuestionCount());
  const nextQuestion = useExamStore((s) => s.nextQuestion);
  const prevQuestion = useExamStore((s) => s.prevQuestion);
  const navModalOpen = useExamStore((s) => s.navModalOpen);
  const toggleNavModal = useExamStore((s) => s.toggleNavModal);
  const phase = useExamStore((s) => s.phase);

  return (
    <div className="bb-footer">
      <div className="bb-footer__name">{studentName}</div>

      {phase === 'exam' && (
        <>
          <div className="bb-footer__center">
            <button className="bb-footer__toggle" onClick={toggleNavModal}>
              Question {currentQuestionIndex + 1} of {questionCount}
              {navModalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            {navModalOpen && <NavigationModal />}
          </div>

          <div className="bb-footer__nav">
            {currentQuestionIndex > 0 && (
              <button
                className="bb-footer__btn bb-footer__btn--back"
                onClick={prevQuestion}
              >
                Back
              </button>
            )}
            <button
              className="bb-footer__btn bb-footer__btn--next"
              onClick={nextQuestion}
            >
              Next
            </button>
          </div>
        </>
      )}

      {(showResume || phase === 'directions') && (
        <>
          <div />
          <div className="bb-footer__nav">
            <button
              className="bb-footer__btn bb-footer__btn--resume"
              onClick={onResume}
            >
              Resume Testing
            </button>
          </div>
        </>
      )}

      {phase === 'check' && (
        <>
          <div />
          <div className="bb-footer__nav">
            <button
              className="bb-footer__btn bb-footer__btn--back"
              onClick={() => {
                useExamStore.getState().setPhase('exam');
              }}
            >
              Back
            </button>
            <button
              className="bb-footer__btn bb-footer__btn--next"
              onClick={() => {
                useExamStore.getState().nextSection();
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
