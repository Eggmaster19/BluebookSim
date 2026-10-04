import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { HistoryScreen } from './HistoryScreen';
import '../../styles/bluebook.css';

export const SelectionScreen: React.FC = () => {
  const selectExamType = useExamStore((s) => s.selectExamType);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSelectChange = (val: string) => {
    setSelectedExamId(val);
  };

  const handleNext = () => {
    if (selectedExamId === 'previous_exams') {
      setShowHistory(true);
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
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="" disabled></option>
          <option value="calc_ab">calc ab</option>
          <option value="calc_bc">calc bc</option>
          <option value="bio">bio</option>
          <option value="lit">lit</option>
          <option value="phys_mech">mech</option>
          <option value="phys_em">e&m</option>
          <option value="econ_macro">macro</option>
          <option value="econ_micro">micro</option>
          {/* ARCHIVED: Foreign language exam */}
          {/* <option value="german">german</option> */}
          <option value="test">test</option>
          <option value="previous_exams">previous exams</option>
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
