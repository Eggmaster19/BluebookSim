import React from 'react';
import { useExamStore } from '../../store/examStore';
import { StimulusRenderer } from '../exam/StimulusRenderer';
import { MCQBlock } from '../exam/MCQBlock';
import { FRQBlock } from '../exam/FRQBlock';
import type { FRQuestion } from '../../types/ExamSchema';

export const ExamScreen: React.FC = () => {
  const question = useExamStore((s) => s.getCurrentQuestion());

  if (!question) return <div>No question found.</div>;

  const hasStimulus = !!question.stimulus;
  const isFRQ = question.questionType === 'frq';

  // ── Split Pane (stimulus + question) ──
  if (hasStimulus) {
    return (
      <div className="bb-main">
        <div className="bb-split">
          <div className="bb-split__pane bb-split__pane--left">
            {isFRQ && (
              <div className="bb-frq-notice">
                On exam day, you'll write your answer in the free-response booklet.
              </div>
            )}
            {question.stimulus && (
              <StimulusRenderer
                stimulus={question.stimulus}
                introText={isFRQ ? question.text : undefined}
              />
            )}
            {/* For MCQ with stimulus, show the stimulus text as intro */}
            {!isFRQ && question.text && (
              <div className="bb-stimulus__intro" style={{ marginTop: 0 }}>
                {/* Intro text only if needed — handled by question text in right pane */}
              </div>
            )}
          </div>

          <div className="bb-split__divider">
            <div className="bb-split__divider-handle">⋮</div>
          </div>

          <div className="bb-split__pane bb-split__pane--right">
            {question.questionType === 'mcq' ? (
              <MCQBlock question={question} />
            ) : (
              <FRQBlock question={question as FRQuestion} />
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
        {isFRQ && (
          <div className="bb-frq-notice">
            On exam day, you'll write your answer in the free-response booklet.
          </div>
        )}
        {question.questionType === 'mcq' ? (
          <MCQBlock question={question} />
        ) : (
          <FRQBlock question={question as FRQuestion} />
        )}
      </div>
    </div>
  );
};
