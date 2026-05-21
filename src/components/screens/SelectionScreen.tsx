import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { HistoryScreen } from './HistoryScreen';
import '../../styles/bluebook.css';

export const SelectionScreen: React.FC = () => {
  const selectExamType = useExamStore((s) => s.selectExamType);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleNext = () => {
    if (selectedExamId === 'previous_exams') {
      setShowHistory(true);
      setSelectedExamId('');
    } else if (selectedExamId) {
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
          <option value="previous_exams">Previous exams</option>
          <option value="" disabled hidden></option>
          <option value="calc_ab">calc ab</option>
          <option value="bio">bio</option>
          <option value="lit">lit</option>
          <option value="phys_mech">mech</option>
          <option value="phys_em">e&m</option>
          <option value="econ_macro">macro</option>
          <option value="econ_micro">micro</option>
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
    </div>
  );
};
