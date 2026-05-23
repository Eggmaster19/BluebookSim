import React from 'react';
import type { FRQuestion } from '../../types/ExamSchema';
import { useExamStore } from '../../store/examStore';
import { StimulusRenderer, renderStimulus } from './StimulusRenderer';
import { Bookmark } from 'lucide-react';
import { HighlightedText } from '../highlights/HighlightedText';

interface FRQBlockProps {
  question: FRQuestion;
}

export const FRQBlock: React.FC<FRQBlockProps> = ({ question }) => {
  const { flagged, toggleFlag } = useExamStore();
  const isFlagged = flagged[question.id];
  const questionIndex = useExamStore((s) => s.currentQuestionIndex);

  return (
    <div className="bb-question-block">
      {/* ── Question Header ── */}
      <div className="bb-question-header">
        <span className="bb-question-number">{questionIndex + 1}</span>
        <button
          className={`bb-question-flag ${isFlagged ? 'bb-question-flag--active' : ''}`}
          onClick={() => toggleFlag(question.id)}
        >
          <Bookmark size={16} />
          Mark for Review
        </button>
        <span className="bb-question-header__spacer" />
        {/* No ABC eliminator for FRQ */}
      </div>

      {/* ── FRQ Parts ── */}
      <div className="bb-frq-parts">
        {question.parts.map((part) => (
          <div key={part.partLabel} className="bb-frq-part">
            <span className="bb-frq-part__label">Part {part.partLabel}</span>
            {/* Render part-level stimulus if present */}
            {part.stimulus && (
              <StimulusRenderer stimulus={part.stimulus} questionId={question.id} areaId={`part-${part.partLabel}-stimulus`} />
            )}
            <div className="bb-frq-part__text">
              {part.type && part.type !== 'text' ? (
                renderStimulus({ type: part.type, data: part.text }, { questionId: question.id, areaId: `part-${part.partLabel}` })
              ) : (
                <HighlightedText text={part.text} questionId={question.id} areaId={`part-${part.partLabel}`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
