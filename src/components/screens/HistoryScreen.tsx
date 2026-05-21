import React, { useState } from 'react';
import { useHistoryStore } from '../../store/historyStore';
import { useExamStore } from '../../store/examStore';
import type { ExamHistoryEntry } from '../../store/historyStore';

export const HistoryScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const history = useHistoryStore((s) => s.history);
  const deleteFromHistory = useHistoryStore((s) => s.deleteFromHistory);
  const clearAllHistory = useHistoryStore((s) => s.clearAllHistory);
  const loadHistoryEntry = useExamStore((s) => s.loadHistoryEntry);

  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleView = (entry: ExamHistoryEntry) => {
    loadHistoryEntry(entry.id);
  };

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setConfirmDeleteId(null);
  };

  const handleClearAll = () => {
    clearAllHistory();
    setConfirmClearAll(false);
  };

  // Compute score info for a history entry
  const getScoreInfo = (entry: ExamHistoryEntry) => {
    const allQuestions = entry.exam.sections.flatMap((s) => s.questions);
    const mcqs = allQuestions.filter((q) => q.questionType === 'mcq');
    const hasKey = mcqs.some((q) => !!q.correctAnswer);

    if (!hasKey || mcqs.length === 0) {
      // Count answered
      const answered = allQuestions.filter((q) => {
        if (entry.answers[q.id]) return true;
        if (q.questionType === 'frq' && entry.essayResponses[q.id]) {
          const text = entry.essayResponses[q.id].replace(/<[^>]*>/g, '').trim();
          return text.length > 0;
        }
        return false;
      }).length;
      return `${answered}/${allQuestions.length} answered`;
    }

    const correct = mcqs.filter(
      (q) => entry.answers[q.id] && entry.answers[q.id] === q.correctAnswer
    ).length;
    return `${correct}/${mcqs.length} MCQ (${Math.round((correct / mcqs.length) * 100)}%)`;
  };

  // Compute total time for an entry
  const getTotalTime = (entry: ExamHistoryEntry) => {
    const totalSecs = Object.values(entry.timeSpent).reduce((a, b) => a + b, 0);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bb-history-container">
      <div className="bb-history-dashboard">

        {/* Header */}
        <div className="bb-history-header">
          <button className="bb-history-back-btn" onClick={onBack}>
            ← back
          </button>
          <h1 className="bb-history-title">Previous Tests</h1>
          <p className="bb-history-subtitle">
            {history.length === 0
              ? 'No completed tests yet.'
              : `${history.length} completed test${history.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Actions Bar */}
        {history.length > 0 && (
          <div className="bb-history-actions-bar">
            {confirmClearAll ? (
              <div className="bb-history-confirm">
                <span>Delete all tests?</span>
                <button className="bb-history-confirm-yes" onClick={handleClearAll}>
                  yes, delete all
                </button>
                <button className="bb-history-confirm-no" onClick={() => setConfirmClearAll(false)}>
                  cancel
                </button>
              </div>
            ) : (
              <button
                className="bb-history-clear-btn"
                onClick={() => setConfirmClearAll(true)}
              >
                clear all data
              </button>
            )}
          </div>
        )}

        {/* History Table */}
        {history.length > 0 && (
          <div className="bb-history-table-wrap">
            <table className="bb-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="bb-history-cell-date">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="bb-history-cell-subject">
                      {entry.exam.metadata.subject}
                    </td>
                    <td className="bb-history-cell-score">
                      {getScoreInfo(entry)}
                    </td>
                    <td className="bb-history-cell-time">
                      {getTotalTime(entry)}
                    </td>
                    <td className="bb-history-cell-actions">
                      <button
                        className="bb-history-view-btn"
                        onClick={() => handleView(entry)}
                      >
                        view
                      </button>
                      {confirmDeleteId === entry.id ? (
                        <span className="bb-history-confirm-inline">
                          <button
                            className="bb-history-confirm-yes"
                            onClick={() => handleDelete(entry.id)}
                          >
                            confirm
                          </button>
                          <button
                            className="bb-history-confirm-no"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          className="bb-history-delete-btn"
                          onClick={() => setConfirmDeleteId(entry.id)}
                        >
                          delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
