import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';


export const DoneScreen: React.FC = () => {
  const studentName = useExamStore((s) => s.studentName);
  const exam = useExamStore((s) => s.exam);
  const answers = useExamStore((s) => s.answers);
  const timeSpent = useExamStore((s) => s.timeSpent || {});
  const essayResponses = useExamStore((s) => s.essayResponses || {});
  const viewingHistoryId = useExamStore((s) => s.viewingHistoryId);
  const exitHistoryView = useExamStore((s) => s.exitHistoryView);
  const isHistoryView = !!viewingHistoryId;

  const [copiedMCQ, setCopiedMCQ] = useState(false);
  const [copiedFRQ, setCopiedFRQ] = useState(false);

  if (!exam) {
    return (
      <div className="bb-done-dashboard-container">
        <div className="bb-done-dashboard">No exam data found.</div>
      </div>
    );
  }

  // Determine if this exam has essay-mode FRQs (used by export sections)

  // 1. Flatten all questions with clean display labels
  const allQuestions = exam.sections.flatMap((sec) =>
    sec.questions.map((q, qIdx) => {
      const titleClean = sec.title.split(' - ')[0].replace('Section ', 'Sec ');
      return {
        ...q,
        sectionId: sec.id,
        sectionTitle: sec.title,
        frqMode: sec.frqMode,
        localNumber: qIdx + 1,
        displayLabel: `${titleClean} Q${qIdx + 1}`,
      };
    })
  );

  const mcqs = allQuestions.filter((q) => q.questionType === 'mcq');
  const frqs = allQuestions.filter((q) => q.questionType === 'frq');
  const essayFRQs = frqs.filter((q) => q.frqMode === 'essay');
  const paperFRQs = frqs.filter((q) => q.frqMode !== 'essay');
  const hasAnswerKey = mcqs.some((q) => !!q.correctAnswer);

  // 2. Performance Metrics
  const totalQuestions = allQuestions.length;
  const totalMCQs = mcqs.length;

  // Count answered: MCQ answers + non-empty essays
  const answeredCount = allQuestions.filter((q) => {
    if (answers[q.id]) return true;
    if (q.questionType === 'frq' && q.frqMode === 'essay' && essayResponses[q.id]) {
      const text = essayResponses[q.id].replace(/<[^>]*>/g, '').trim();
      return text.length > 0;
    }
    return false;
  }).length;

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredMCQs = 0;

  if (hasAnswerKey) {
    mcqs.forEach((q) => {
      const selected = answers[q.id];
      if (!selected) {
        unansweredMCQs++;
        incorrectCount++;
      } else if (selected === q.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });
  } else {
    mcqs.forEach((q) => {
      if (!answers[q.id]) {
        unansweredMCQs++;
      }
    });
  }

  // 3. Time Calculations
  const totalSeconds = allQuestions.reduce((acc, q) => acc + (timeSpent[q.id] || 0), 0);
  
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatTimeSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Word count helper
  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  };

  // Graph time bounds (min 10s height scale representation)
  const maxTime = Math.max(...allQuestions.map((q) => timeSpent[q.id] || 0), 10);

  // 4. MCQ Export Text Generation
  const generateMCQExportText = () => {
    let text = `--- MCQ RESPONSES ---\n\n`;

    mcqs.forEach((q) => {
      const selected = answers[q.id] || '[No Answer]';
      if (hasAnswerKey) {
        const isCorrect = answers[q.id] === q.correctAnswer;
        text += `${q.displayLabel}: ${selected} (Correct: ${q.correctAnswer}) - ${isCorrect ? 'CORRECT' : 'INCORRECT'}\n`;
      } else {
        text += `${q.displayLabel}: ${selected}\n`;
      }
    });

    return text;
  };

  // 5. FRQ Essay Export Text Generation
  const generateFRQExportText = () => {
    let text = `--- FRQ RESPONSES ---\n\n`;

    essayFRQs.forEach((q) => {
      const essayHtml = essayResponses[q.id] || '';
      const essayText = essayHtml.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      const wordCount = getWordCount(essayHtml);

      text += `--- ${q.displayLabel} (${wordCount} words) ---\n`;
      text += `Prompt: ${q.text}\n\n`;
      text += `Response:\n${essayText || '[No Response]'}\n\n`;
    });

    return text;
  };

  const handleCopyMCQExport = () => {
    navigator.clipboard.writeText(generateMCQExportText()).then(() => {
      setCopiedMCQ(true);
      setTimeout(() => setCopiedMCQ(false), 2000);
    });
  };

  const handleCopyFRQExport = () => {
    navigator.clipboard.writeText(generateFRQExportText()).then(() => {
      setCopiedFRQ(true);
      setTimeout(() => setCopiedFRQ(false), 2000);
    });
  };

  return (
    <div className="bb-done-dashboard-container">
      <div className="bb-done-dashboard">
        
        {/* Header */}
        <div className="bb-done-header">
          <div className="bb-done-header__celebration">Test Complete!</div>
          <h1 className="bb-done-header__title">Practice Results Dashboard</h1>
          <p className="bb-done-header__subtitle">
            Great job, <strong>{studentName}</strong>. Review your performance stats below.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="bb-metrics-grid">
          {hasAnswerKey ? (
            <div className="bb-metric-card bb-metric-card--accent">
              <div className="bb-metric-card__value">
                {totalMCQs > 0 ? Math.round((correctCount / totalMCQs) * 100) : 0}%
              </div>
              <div className="bb-metric-card__label">MCQ Accuracy</div>
              <div className="bb-metric-card__sublabel">
                {correctCount} / {totalMCQs} Correct
              </div>
            </div>
          ) : (
            <div className="bb-metric-card">
              <div className="bb-metric-card__value">
                {answeredCount} / {totalQuestions}
              </div>
              <div className="bb-metric-card__label">Answered Questions</div>
              <div className="bb-metric-card__sublabel">
                {totalQuestions - answeredCount} Skipped
              </div>
            </div>
          )}

          <div className="bb-metric-card">
            <div className="bb-metric-card__value">{formatTime(totalSeconds)}</div>
            <div className="bb-metric-card__label">Total Time Spent</div>
            <div className="bb-metric-card__sublabel">Active testing time</div>
          </div>

          <div className="bb-metric-card">
            <div className="bb-metric-card__value">{totalQuestions}</div>
            <div className="bb-metric-card__label">Total Questions</div>
            <div className="bb-metric-card__sublabel">
              {totalMCQs} MCQs · {frqs.length} FRQs
            </div>
          </div>

          {/* Essay word counts — only for AP Lit / essay mode */}
          {essayFRQs.length > 0 && (
            <div className="bb-metric-card">
              <div className="bb-metric-card__value">
                {essayFRQs.reduce((acc, q) => acc + getWordCount(essayResponses[q.id] || ''), 0)}
              </div>
              <div className="bb-metric-card__label">Total Words Written</div>
              <div className="bb-metric-card__sublabel">
                {essayFRQs.map((q, i) => `Essay ${i + 1}: ${getWordCount(essayResponses[q.id] || '')}`).join(' · ')}
              </div>
            </div>
          )}
        </div>

        {/* Section: Time spent Graph */}
        <div className="bb-dashboard-section">
          <div className="bb-section-header">
            <h2 className="bb-section-title">Time Spent & Correctness per Question</h2>
            <div className="bb-legend">
              {hasAnswerKey && (
                <>
                  <div className="bb-legend-item">
                    <span className="bb-legend-dot bb-legend-dot--green"></span> Correct MCQ
                  </div>
                  <div className="bb-legend-item">
                    <span className="bb-legend-dot bb-legend-dot--red"></span> Incorrect/Unanswered MCQ
                  </div>
                </>
              )}
              {!hasAnswerKey && (
                <div className="bb-legend-item">
                  <span className="bb-legend-dot bb-legend-dot--blue"></span> Answered MCQ
                </div>
              )}
              {paperFRQs.length > 0 && (
                <div className="bb-legend-item">
                  <span className="bb-legend-dot bb-legend-dot--frq"></span> Paper FRQ (Unscored)
                </div>
              )}
              {essayFRQs.length > 0 && (
                <div className="bb-legend-item">
                  <span className="bb-legend-dot bb-legend-dot--essay"></span> Essay FRQ
                </div>
              )}
            </div>
          </div>

          <div className="bb-graph-wrapper">
            {/* Graph Y Axis Labels */}
            <div className="bb-graph-y-axis">
              <div>{formatTimeSeconds(maxTime)}</div>
              <div>{formatTimeSeconds(Math.round(maxTime / 2))}</div>
              <div>0:00</div>
            </div>

            {/* Graph Canvas */}
            <div className="bb-graph-scroll-container">
              <div className="bb-graph-canvas" style={{ minWidth: `${Math.max(600, allQuestions.length * 48)}px` }}>
                {allQuestions.map((q, qIdx) => {
                  const seconds = timeSpent[q.id] || 0;
                  const heightPercent = maxTime > 0 ? (seconds / maxTime) * 100 : 0;
                  const isTall = heightPercent > 50;
                  const isNearEnd = qIdx > allQuestions.length - 4;

                  let tooltipClass = 'bb-graph-tooltip';
                  if (isTall) {
                    tooltipClass += isNearEnd ? ' bb-graph-tooltip--side-left' : ' bb-graph-tooltip--side-right';
                  }
                  
                  // Color code selection
                  let barClass = 'bb-graph-bar--neutral';
                  let statusLabel = 'Answered';
                  
                  if (q.questionType === 'frq') {
                    if (q.frqMode === 'essay') {
                      const hasEssay = essayResponses[q.id] && getWordCount(essayResponses[q.id]) > 0;
                      barClass = hasEssay ? 'bb-graph-bar--essay' : 'bb-graph-bar--unanswered';
                      statusLabel = hasEssay ? `Essay (${getWordCount(essayResponses[q.id])} words)` : 'Essay (Empty)';
                    } else {
                      barClass = 'bb-graph-bar--frq';
                      statusLabel = 'FRQ (Paper)';
                    }
                  } else {
                    const answered = !!answers[q.id];
                    if (hasAnswerKey) {
                      const correct = answers[q.id] === q.correctAnswer;
                      barClass = correct ? 'bb-graph-bar--correct' : 'bb-graph-bar--incorrect';
                      statusLabel = correct ? 'Correct' : answered ? 'Incorrect' : 'Skipped / Incorrect';
                    } else {
                      barClass = answered ? 'bb-graph-bar--answered' : 'bb-graph-bar--unanswered';
                      statusLabel = answered ? 'Answered' : 'Skipped';
                    }
                  }

                  return (
                    <div key={q.id} className="bb-graph-col">
                      <div className="bb-graph-bar-wrap">
                        {/* Bar */}
                        <div
                          className={`bb-graph-bar ${barClass}`}
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                        >
                          {/* CSS Tooltip */}
                          <div className={tooltipClass}>
                            <div className="bb-graph-tooltip__title">{q.displayLabel}</div>
                            <div className="bb-graph-tooltip__row">
                              <strong>Status:</strong> {statusLabel}
                            </div>
                            <div className="bb-graph-tooltip__row">
                              <strong>Time:</strong> {formatTimeSeconds(seconds)}
                            </div>
                            {q.questionType === 'mcq' && (
                              <>
                                <div className="bb-graph-tooltip__row">
                                  <strong>Selected:</strong> {answers[q.id] || '[No Answer]'}
                                </div>
                                {hasAnswerKey && (
                                  <div className="bb-graph-tooltip__row">
                                    <strong>Correct:</strong> {q.correctAnswer}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bb-graph-col-label" title={q.displayLabel}>
                        {q.localNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section: MCQ Export */}
        {mcqs.length > 0 && (
          <div className="bb-dashboard-section">
            <div className="bb-section-header">
              <h2 className="bb-section-title">MCQ Export</h2>
              <p className="bb-section-desc">
                Copy this streamlined response sheet.
              </p>
            </div>

            <div className="bb-export-box">
              <pre className="bb-export-content">{generateMCQExportText()}</pre>
              <button className="bb-export-btn" onClick={handleCopyMCQExport}>
                {copiedMCQ ? '✓ Copied to Clipboard!' : '📋 Copy MCQ Results'}
              </button>
            </div>
          </div>
        )}

        {/* Section: FRQ Export */}
        {essayFRQs.length > 0 && (
          <div className="bb-dashboard-section">
            <div className="bb-section-header">
              <h2 className="bb-section-title">FRQ Export</h2>
              <p className="bb-section-desc">
                Copy your essay responses.
              </p>
            </div>

            <div className="bb-export-box">
              <pre className="bb-export-content">{generateFRQExportText()}</pre>
              <button className="bb-export-btn" onClick={handleCopyFRQExport}>
                {copiedFRQ ? '✓ Copied to Clipboard!' : '📋 Copy FRQ Responses'}
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bb-done-actions">
          {isHistoryView ? (
            <button className="bb-done-btn bb-done-btn--primary" onClick={exitHistoryView}>
              ← Back to Previous Tests
            </button>
          ) : (
            <button className="bb-done-btn bb-done-btn--primary" onClick={exitHistoryView}>
              Home
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
