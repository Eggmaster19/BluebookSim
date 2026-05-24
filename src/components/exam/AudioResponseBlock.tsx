import React from 'react';
import type { AudioResponseQuestion } from '../../types/ExamSchema';
import { useExamStore } from '../../store/examStore';
import { Bookmark } from 'lucide-react';
import { HighlightedText } from '../highlights/HighlightedText';
import { AudioRecorder } from './AudioRecorder';
import { StimulusRenderer } from './StimulusRenderer';

interface AudioResponseBlockProps {
  question: AudioResponseQuestion;
}

export const AudioResponseBlock: React.FC<AudioResponseBlockProps> = ({ question }) => {
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
      </div>

      {/* ── Question Text ── */}
      <div className="bb-question-text" style={{ padding: '24px' }}>
        {question.stimulus && (
          <StimulusRenderer stimulus={question.stimulus} questionId={question.id} areaId="stimulus" />
        )}
        <HighlightedText text={question.text} questionId={question.id} areaId="question" />
      </div>

      {/* ── Recorder ── */}
      <div style={{ padding: '0 24px' }}>
        <AudioRecorder question={question} />
      </div>
    </div>
  );
};
