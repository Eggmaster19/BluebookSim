import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useExamStore } from '../../store/examStore';
import { HistoryScreen } from './HistoryScreen';
import { ChevronDown } from 'lucide-react';
import '../../styles/bluebook.css';

interface ExamOption {
  value: string;
  label: string;
}

interface ExamGroup {
  label: string;
  options: ExamOption[];
}

const EXAM_GROUPS: ExamGroup[] = [
  {
    label: 'History & Social Sciences',
    options: [
      { value: 'apush', label: 'apush' },
      { value: 'euro', label: 'euro' },
      { value: 'world_', label: 'world' },
      { value: 'gov', label: 'gov' },
      { value: 'comp_gov', label: 'comp gov' },
      { value: 'hug', label: 'hug' },
      { value: 'african_am_studies', label: 'aas' },
      { value: 'psych', label: 'psych' },
      { value: 'econ_macro', label: 'macro' },
      { value: 'econ_micro', label: 'micro' },
    ],
  },
  {
    label: 'Sciences',
    options: [
      { value: 'bio', label: 'bio' },
      { value: 'phys_1', label: 'physics 1' },
      { value: 'phys_2', label: 'physics 2' },
      { value: 'phys_mech', label: 'mech' },
      { value: 'phys_em', label: 'e&m' },
      { value: 'apes', label: 'apes' },
    ],
  },
  {
    label: 'Math & Computer Science',
    options: [
      { value: 'calc', label: 'calc' },
      { value: 'precalc', label: 'precalc' },
      { value: 'stats', label: 'stats' },
      { value: 'csa', label: 'csa' },
      { value: 'csp', label: 'csp' },
    ],
  },
  {
    label: 'English',
    options: [
      { value: 'lit', label: 'lit' },
      { value: 'lang', label: 'lang' },
    ],
  },
  {
    label: 'Career Kickstart',
    options: [
      { value: 'business_finance', label: 'business' },
      { value: 'cybersecurity', label: 'cybersecurity' },
    ],
  },
  {
    label: 'Arts',
    options: [
      { value: 'art_hist', label: 'art history' },
    ],
  },
  {
    label: 'General',
    options: [
      { value: 'test', label: 'test' },
      { value: 'previous_exams', label: 'previous exams' },
    ],
  },
];

export const SelectionScreen: React.FC = () => {
  const selectExamType = useExamStore((s) => s.selectExamType);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo(() => EXAM_GROUPS.flatMap((g) => g.options), []);
  const selectedOption = allOptions.find((o) => o.value === selectedExamId);
  const optionIndexMap = useMemo(() => new Map(allOptions.map((opt, i) => [opt.value, i])), [allOptions]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-scroll highlighted option into view within the stationary scroll container
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const idx = allOptions.findIndex((o) => o.value === selectedExamId);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return next;
    });
  };

  const handleSelect = (val: string) => {
    setSelectedExamId(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        const idx = allOptions.findIndex((o) => o.value === selectedExamId);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % allOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + allOptions.length) % allOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
        setSelectedExamId(allOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    }
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
        <div 
          className="custom-select-wrapper" 
          ref={wrapperRef}
          onKeyDown={handleKeyDown}
        >
          <div
            className={`custom-select-trigger ${isOpen ? 'is-open' : ''}`}
            onClick={handleToggle}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span>{selectedOption ? selectedOption.label : ''}</span>
            <div className="custom-select-arrow">
              <ChevronDown size={16} />
            </div>
          </div>

          {isOpen && (
            <div 
              className="custom-select-dropdown" 
              ref={listRef}
              role="listbox"
            >
              {EXAM_GROUPS.map((group) => (
                <div key={group.label} className="custom-select-group">
                  <div className="custom-select-group-label">{group.label}</div>
                  {group.options.map((opt) => {
                    const currentIndex = optionIndexMap.get(opt.value) ?? 0;
                    const isSelected = selectedExamId === opt.value;
                    const isHighlighted = highlightedIndex === currentIndex;

                    return (
                      <div
                        key={opt.value}
                        data-index={currentIndex}
                        className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(currentIndex)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

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
