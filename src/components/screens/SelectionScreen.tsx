import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { calculusABExam, biologyExam } from '../../data/exams';
import '../../styles/bluebook.css';

export const SelectionScreen: React.FC = () => {
  const loadExam = useExamStore((s) => s.loadExam);
  const [selectedExamId, setSelectedExamId] = useState('');

  const handleNext = () => {
    if (selectedExamId === 'calc_ab') {
      loadExam(calculusABExam, 'Isaac Newton');
    } else if (selectedExamId === 'bio') {
      loadExam(biologyExam, 'Gregor Mendel');
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
