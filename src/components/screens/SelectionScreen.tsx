import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import '../../styles/bluebook.css';

export const SelectionScreen: React.FC = () => {
  const selectExamType = useExamStore((s) => s.selectExamType);
  const [selectedExamId, setSelectedExamId] = useState('');

  const handleNext = () => {
    if (selectedExamId) {
      selectExamType(selectedExamId);
    }
  };

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
