import React, { useMemo } from 'react';
import { useExamStore } from '../../store/examStore';
import { StimulusRenderer } from '../exam/StimulusRenderer';
import { MCQBlock } from '../exam/MCQBlock';
import { FRQBlock } from '../exam/FRQBlock';
import { EssayFRQBlock } from '../exam/EssayFRQBlock';
// Archived foreign language speaking task block:
// import { AudioResponseBlock } from '../exam/AudioResponseBlock';
// import type { AudioResponseQuestion } from '../../types/ExamSchema';
import type { FRQuestion } from '../../types/ExamSchema';
import { NotesPanel } from '../highlights/NotesPanel';
import { HighlightsLayer } from '../highlights/HighlightsLayer';

export const ExamScreen: React.FC = () => {
  const question = useExamStore((s) => s.getCurrentQuestion());
  const section = useExamStore((s) => s.getCurrentSection());
  const notesPanelOpen = useExamStore((s) => s.notesPanelOpen);
  const highlights = useExamStore((s) => s.highlights);

  const hasQuestionNotes = useMemo(() => {
    if (!question || !Array.isArray(highlights)) return false;
    return highlights.some(
      (highlight) => highlight && highlight.questionId === question.id && highlight.hasNote
    );
  }, [question, highlights]);

  if (!question) return <div style={{ padding: '32px', textAlign: 'center' }}>No question found.</div>;

  const hasStimulus = !!question.stimulus || ('sharedStimulus' in question && !!question.sharedStimulus);
  const isFRQ = question.questionType === 'frq';
  const isEssayMode = section?.frqMode === 'essay';

  // Determine which FRQ component to render
  const renderFRQ = () => {
    // Archived foreign language speaking task:
    // if (question.questionType === 'audio-response') {
    //   return <AudioResponseBlock question={question as AudioResponseQuestion} />;
    // }
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
            <StimulusRenderer
              stimulus={question.stimulus || { type: 'text', data: ('sharedStimulus' in question ? question.sharedStimulus : '') as string }}
              introText={
                isFRQ && !isEssayMode
                  ? question.text
                  : ('sharedStimulus' in question && question.sharedStimulus
                    ? question.sharedStimulus
                    : undefined)
              }
              questionId={question.id}
              areaId="stimulus"
            />
          </div>

          <div className="bb-split__divider" />

          {notesPanelOpen && hasQuestionNotes && (
            <NotesPanel questionId={question.id} splitPane />
          )}

          <div className="bb-split__pane bb-split__pane--right">
            {question.questionType === 'mcq' ? (
              <MCQBlock question={question} />
            ) : (
              renderFRQ()
            )}
          </div>
        </div>
        <HighlightsLayer />
      </div>
    );
  }

  // ── Single Pane (no stimulus) ──
  return (
    <div className={`bb-main bb-main--single ${notesPanelOpen && hasQuestionNotes ? 'bb-main--with-notes' : ''}`}>
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
      {notesPanelOpen && hasQuestionNotes && (
        <NotesPanel questionId={question.id} splitPane={false} />
      )}
      <HighlightsLayer />
    </div>
  );
};
