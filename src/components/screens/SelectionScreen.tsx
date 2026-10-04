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
          <optgroup label="History & Social Sciences">
            <option value="apush">apush</option>
            <option value="euro">euro</option>
            <option value="world_">world</option>
            <option value="gov">gov</option>
            <option value="comp_gov">comp gov</option>
            <option value="hug">hug</option>
            <option value="african_am_studies">aas</option>
            <option value="psych">psych</option>
            <option value="econ_macro">macro</option>
            <option value="econ_micro">micro</option>
          </optgroup>
          <optgroup label="Sciences">
            <option value="bio">bio</option>
            <option value="phys_1">physics 1</option>
            <option value="phys_2">physics 2</option>
            <option value="phys_mech">mech</option>
            <option value="phys_em">e&m</option>
            <option value="apes">apes</option>
          </optgroup>
          <optgroup label="Math & Computer Science">
            <option value="calc">calc</option>
            <option value="precalc">precalc</option>
            <option value="stats">stats</option>
            <option value="csa">csa</option>
            <option value="csp">csp</option>
          </optgroup>
          <optgroup label="English">
            <option value="lit">lit</option>
            <option value="lang">lang</option>
          </optgroup>
          <optgroup label="Career Kickstart">
            <option value="business_finance">business</option>
            <option value="cybersecurity">cybersecurity</option>
          </optgroup>
          <optgroup label="Arts">
            <option value="art_hist">art history</option>
          </optgroup>
          <optgroup label="General">
            <option value="test">test</option>
            <option value="previous_exams">previous exams</option>
          </optgroup>
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
