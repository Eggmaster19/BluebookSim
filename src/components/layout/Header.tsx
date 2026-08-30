import React, { useState, useRef, useEffect } from 'react';
import { useExamStore } from '../../store/examStore';
import { HelpModal } from '../modals/HelpModal';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { ExitExamModal } from '../modals/ExitExamModal';
import { UnscheduledBreakModal } from '../modals/UnscheduledBreakModal';

export const Header: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());
  const timerSeconds = useExamStore((s) => s.timerSeconds);
  const timerHidden = useExamStore((s) => s.timerHidden);
  const toggleTimerHidden = useExamStore((s) => s.toggleTimerHidden);
  const saveExamAsIncompleteAndExit = useExamStore((s) => s.saveExamAsIncompleteAndExit);
  const setPhase = useExamStore((s) => s.setPhase);
  const toggleCalculator = useExamStore((s) => s.toggleCalculator);
  const isCalculatorOpen = useExamStore((s) => s.isCalculatorOpen);
  const highlightsActive = useExamStore((s) => s.highlightsActive);
  const toggleHighlightsActive = useExamStore((s) => s.toggleHighlightsActive);

  const [moreOpen, setMoreOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [unscheduledModalOpen, setUnscheduledModalOpen] = useState(false);

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
  const calculatorAvailable = section.calculatorType !== 'none';

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = timerSeconds <= 300 && timerSeconds > 0; // 5 minutes

  return (
    <div className="bb-header">
      <div className="bb-header__left">
        <div className="bb-header__title">{section.title}</div>
        <button className="bb-header__directions-btn" onClick={() => setDirectionsOpen(!directionsOpen)}>
          Directions {directionsOpen ? '▴' : '▾'}
        </button>
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
        <button
          className={`bb-header__tool bb-header__tool--interactive ${highlightsActive ? 'bb-header__tool--active bb-header__tool--notes-active' : ''}`}
          onClick={toggleHighlightsActive}
          style={{
            background: 'none',
            border: 'none',
            color: '#000000',
            font: 'inherit',
            padding: '4px 8px',
            outline: 'none',
            opacity: 1,
            cursor: 'pointer',
            borderBottom: highlightsActive ? '3px solid #000000' : '3px solid transparent'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Highlights &amp; Notes</span>
        </button>
        {calculatorAvailable && (
          <div
            className={`bb-header__tool ${isCalculatorOpen ? 'bb-header__tool--active' : ''}`}
            onClick={toggleCalculator}
            style={{ cursor: 'pointer' }}
          >
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
            style={{ background: 'none', border: 'none', color: '#000000', font: 'inherit', padding: '4px 8px', outline: 'none', opacity: 1, cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
            <span>More</span>
          </button>
          
          {moreOpen && (
            <div className="bb-header__dropdown">
              <button
                className="bb-header__dropdown-item"
                onClick={() => {
                  setMoreOpen(false);
                  setHelpOpen(true);
                }}
              >
                Help
              </button>
              <button
                className="bb-header__dropdown-item"
                onClick={() => {
                  setMoreOpen(false);
                  setShortcutsOpen(true);
                }}
              >
                Shortcuts
              </button>
              <div
                className="bb-header__dropdown-item bb-header__dropdown-item--disabled"
                style={{ opacity: 0.35, filter: 'blur(0.5px)', cursor: 'not-allowed' }}
                title="Assistive Technology"
              >
                Assistive Technology
              </div>
              <div
                className="bb-header__dropdown-item bb-header__dropdown-item--disabled"
                style={{ opacity: 0.35, filter: 'blur(0.5px)', cursor: 'not-allowed' }}
                title="Line Reader"
              >
                Line Reader
              </div>
              <button
                className="bb-header__dropdown-item"
                onClick={() => {
                  setMoreOpen(false);
                  setUnscheduledModalOpen(true);
                }}
              >
                Unscheduled Break
              </button>
              <button
                className="bb-header__dropdown-item bb-header__dropdown-item--danger"
                onClick={() => {
                  setMoreOpen(false);
                  setExitModalOpen(true);
                }}
              >
                Exit the Exam
              </button>
            </div>
          )}
        </div>
      </div>

      {directionsOpen && (
        <div className="bb-directions-modal-overlay">
          <div className="bb-directions-modal">
            <div className="bb-directions-modal__header">
              <div className="bb-directions-modal__title">{section.title}</div>
              <button className="bb-directions-modal__close-btn" onClick={() => setDirectionsOpen(false)}>
                ✕
              </button>
            </div>
            <div className="bb-directions-modal__body" dangerouslySetInnerHTML={{ __html: section.directions }} />
            <div className="bb-directions-modal__footer">
              <button className="bb-directions-modal__close-btn" onClick={() => setDirectionsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {exitModalOpen && (
        <ExitExamModal
          onContinue={() => setExitModalOpen(false)}
          onExit={() => {
            setExitModalOpen(false);
            saveExamAsIncompleteAndExit();
          }}
        />
      )}
      {unscheduledModalOpen && (
        <UnscheduledBreakModal
          onCancel={() => setUnscheduledModalOpen(false)}
          onConfirm={() => {
            setUnscheduledModalOpen(false);
            setPhase('unscheduled-break');
          }}
        />
      )}
    </div>
  );
};