import React from 'react';
import type { MCQuestion } from '../../types/ExamSchema';
import { useExamStore } from '../../store/examStore';
import { KaTeXRenderer } from '../KaTeXRenderer';
import { renderStimulus } from './StimulusRenderer';
import { Bookmark } from 'lucide-react';

interface MCQBlockProps {
  question: MCQuestion;
}

export const MCQBlock: React.FC<MCQBlockProps> = ({ question }) => {
  const { 
    answers, flagged, eliminated, eliminatorMode, 
    selectAnswer, toggleFlag, toggleEliminate, toggleEliminatorMode 
  } = useExamStore();

  const selectedAnswer = answers[question.id];
  const isFlagged = flagged[question.id];
  const eliminatedOptions = eliminated[question.id] || [];
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
        {/* Dashed line is done via border-bottom on bb-question-header */}
        <button 
          className={`bb-question-abc ${eliminatorMode ? 'bb-question-abc--active' : ''}`} 
          title="Answer Eliminator"
          onClick={toggleEliminatorMode}
        >
          ABC
        </button>
      </div>

      {/* ── Question Text ── */}
      <div className="bb-question-text">
        <KaTeXRenderer text={question.text} />
      </div>

      {/* ── Options Stimulus (for grouped option images) ── */}
      {question.optionsStimulus && (
        <div className="bb-question-options-stimulus" style={{ margin: '16px 0' }}>
          {renderStimulus(question.optionsStimulus)}
        </div>
      )}

      {/* ── Options ── */}
      <div className="bb-options">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isEliminated = eliminatedOptions.includes(option.id);

          return (
            <div
              key={option.id}
              className={`bb-option ${isSelected ? 'bb-option--selected' : ''} ${isEliminated ? 'bb-option--eliminated' : ''}`}
              onClick={() => selectAnswer(question.id, option.id)}
            >
              <div className="bb-option__box">
                <span className="bb-option__letter">{option.id}</span>
                <span className="bb-option__text">
                  {option.type && option.type !== 'text' ? (
                    renderStimulus({ type: option.type, data: option.text })
                  ) : (
                    <KaTeXRenderer text={option.text} />
                  )}
                </span>
              </div>
              {eliminatorMode && (
                <button
                  className={`bb-option__eliminator ${isEliminated ? 'bb-option__eliminator--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEliminate(question.id, option.id);
                  }}
                  title={`Eliminate option ${option.id}`}
                >
                  <span>{option.id}</span>
                  <span className="bb-option__eliminator-line" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
