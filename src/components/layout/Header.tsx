import React, { useState, useRef, useEffect } from 'react';
import { useExamStore } from '../../store/examStore';

export const Header: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());
  const timerSeconds = useExamStore((s) => s.timerSeconds);
  const timerHidden = useExamStore((s) => s.timerHidden);
  const toggleTimerHidden = useExamStore((s) => s.toggleTimerHidden);
  const exitHistoryView = useExamStore((s) => s.exitHistoryView);

  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!section) return null;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = timerSeconds <= 300 && timerSeconds > 0; // 5 minutes

  const handleExitExam = () => {
    setMoreOpen(false);
    if (window.confirm('Are you sure you want to exit the exam? Your current progress will be lost.')) {
      exitHistoryView();
    }
  };

  return (
    <div className="bb-header">
      <div className="bb-header__left">
        <div className="bb-header__title">{section.title}</div>
        <button className="bb-header__directions-btn">Directions ▾</button>
      </div>

      <div className="bb-header__center">
        <div
          className={`bb-header__timer ${isWarning ? 'bb-header__timer--warning' : ''} ${timerHidden ? 'bb-header__timer--hidden' : ''}`}
        >
          {timeStr}
        </div>
        <button className="bb-header__hide-btn" onClick={toggleTimerHidden}>
          {timerHidden ? 'Show' : 'Hide'}
        </button>
      </div>

      <div className="bb-header__right">
        <div className="bb-header__tool">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Highlights &amp; Notes</span>
        </div>
        {section.calculatorAllowed && (
          <div className="bb-header__tool">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="8" y2="10.01" />
              <line x1="12" y1="10" x2="12" y2="10.01" />
              <line x1="16" y1="10" x2="16" y2="10.01" />
              <line x1="8" y1="14" x2="8" y2="14.01" />
              <line x1="12" y1="14" x2="12" y2="14.01" />
              <line x1="16" y1="14" x2="16" y2="14.01" />
              <line x1="8" y1="18" x2="8" y2="18.01" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
              <line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
            <span>Calculator</span>
          </div>
        )}
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            className={`bb-header__tool bb-header__tool--interactive ${moreOpen ? 'bb-header__tool--active' : ''}`}
            onClick={() => setMoreOpen(!moreOpen)}
            style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', padding: 0, outline: 'none' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
            <span>More</span>
          </button>
          
          {moreOpen && (
            <div className="bb-header__dropdown">
              <button className="bb-header__dropdown-item" onClick={handleExitExam}>
                Exit the exam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
