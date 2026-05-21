import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { useHistoryStore } from '../../store/historyStore';
import { HistoryScreen } from './HistoryScreen';
import '../../styles/bluebook.css';

export const SelectionScreen: React.FC = () => {
  const selectExamType = useExamStore((s) => s.selectExamType);
  const historyCount = useHistoryStore((s) => s.history.length);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleNext = () => {
    if (selectedExamId) {
      selectExamType(selectedExamId);
    }
  };

  if (showHistory) {
    return <HistoryScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="selection-screen">
      <div className="selection-container">
        <span>select:</span>
        <select 
          value={selectedExamId} 
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="" disabled></option>
          <option value="calc_ab">calc ab</option>
          <option value="bio">bio</option>
          <option value="lit">lit</option>
          <option value="test">test</option>
        </select>
        
        <button 
          className="next-btn" 
          onClick={handleNext} 
          disabled={!selectedExamId}
        >
          next
        </button>
      </div>

      {historyCount > 0 && (
        <button
          className="selection-history-btn"
          onClick={() => setShowHistory(true)}
        >
          previous tests ({historyCount})
        </button>
      )}
    </div>
  );
};
