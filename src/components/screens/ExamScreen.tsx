import React from 'react';
import { useExamStore } from '../../store/examStore';
import { StimulusRenderer } from '../exam/StimulusRenderer';
import { MCQBlock } from '../exam/MCQBlock';
import { FRQBlock } from '../exam/FRQBlock';
import { EssayFRQBlock } from '../exam/EssayFRQBlock';
import type { FRQuestion } from '../../types/ExamSchema';

export const ExamScreen: React.FC = () => {
  const question = useExamStore((s) => s.getCurrentQuestion());
  const section = useExamStore((s) => s.getCurrentSection());

  if (!question) return <div>No question found.</div>;

  const hasStimulus = !!question.stimulus;
  const isFRQ = question.questionType === 'frq';
  const isEssayMode = section?.frqMode === 'essay';

  // Determine which FRQ component to render
  const renderFRQ = () => {
    if (isEssayMode) {
      return <EssayFRQBlock question={question as FRQuestion} />;
    }
    return <FRQBlock question={question as FRQuestion} />;
  };

  // ── Split Pane (stimulus + question) ──
  if (hasStimulus) {
    return (
      <div className="bb-main">
        <div className="bb-split">
          <div className="bb-split__pane bb-split__pane--left">
            {/* Only show paper-booklet notice for non-essay FRQs (Calc/Bio) */}
            {isFRQ && !isEssayMode && (
              <div className="bb-frq-notice">
                On exam day, you'll write your answer in the free-response booklet.
              </div>
            )}
            {question.stimulus && (
              <StimulusRenderer
                stimulus={question.stimulus}
                introText={isFRQ && !isEssayMode ? question.text : undefined}
              />
            )}
          </div>

          <div className="bb-split__divider" />

          <div className="bb-split__pane bb-split__pane--right">
            {question.questionType === 'mcq' ? (
              <MCQBlock question={question} />
            ) : (
              renderFRQ()
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Single Pane (no stimulus) ──
  return (
    <div className="bb-main bb-main--single">
      <div className="bb-single-content">
        {/* Only show paper-booklet notice for non-essay FRQs */}
        {isFRQ && !isEssayMode && (
          <div className="bb-frq-notice">
            On exam day, you'll write your answer in the free-response booklet.
          </div>
        )}
        {question.questionType === 'mcq' ? (
          <MCQBlock question={question} />
        ) : (
          renderFRQ()
        )}
      </div>
    </div>
  );
};
