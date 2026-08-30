import React, { useEffect } from 'react';
import { useExamStore } from './store/examStore';
import { SelectionScreen } from './components/screens/SelectionScreen';
import { JsonInputScreen } from './components/screens/JsonInputScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layout
import { Header } from './components/layout/Header';
import { WarningBanner } from './components/layout/WarningBanner';

import { Footer } from './components/layout/Footer';

// Screens
import { PreviewScreen } from './components/screens/PreviewScreen';
import { DirectionsScreen } from './components/screens/DirectionsScreen';
import { ExamScreen } from './components/screens/ExamScreen';
import { CheckYourWorkScreen } from './components/screens/CheckYourWorkScreen';
import { BreakScreen } from './components/screens/BreakScreen';
import { UnscheduledBreakScreen } from './components/screens/UnscheduledBreakScreen';
import { DoneScreen } from './components/screens/DoneScreen';
import { CalculatorOverlay } from './components/exam/CalculatorOverlay';

// Styles
import './styles/bluebook.css';
import 'katex/dist/katex.min.css';

const App: React.FC = () => {
  const phase = useExamStore((s) => s.phase);
  const exam = useExamStore((s) => s.exam);
  const selectedExamType = useExamStore((s) => s.selectedExamType);
  const setPhase = useExamStore((s) => s.setPhase);
  const startTimer = useExamStore((s) => s.startTimer);
  const tickTimer = useExamStore((s) => s.tickTimer);
  const timerRunning = useExamStore((s) => s.timerRunning);
  const hasHydrated = useExamStore((s) => s._hasHydrated);

  // Timer tick effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // Auto-resume timer after rehydration if we were mid-exam
  useEffect(() => {
    if (hasHydrated && phase === 'exam' && !timerRunning && exam) {
      startTimer();
    }
  }, [hasHydrated, phase, timerRunning, exam, startTimer]);
  // Emergency keyboard reset shortcut: Ctrl+Alt+R or Cmd+Option+R
  useEffect(() => {
    const handleEmergencyKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (window.confirm('Emergency Reset: Do you want to clear the saved session and return to the home screen?')) {
          if (typeof (window as unknown as { resetBluebookState?: () => void }).resetBluebookState === 'function') {
            (window as unknown as { resetBluebookState: () => void }).resetBluebookState();
          }
        }
      }
    };
    window.addEventListener('keydown', handleEmergencyKey);
    return () => window.removeEventListener('keydown', handleEmergencyKey);
  }, []);

  // Handle resume from directions
  const handleResume = () => {
    setPhase('exam');
    startTimer();
  };

  // Wait for IndexedDB hydration before rendering anything
  if (!hasHydrated) {
    return (
      <div className="selection-screen">
        <div className="selection-container" style={{ color: '#555' }}>
          loading…
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* ── Pre-exam screens ── */}
      {!exam && (selectedExamType ? <JsonInputScreen /> : <SelectionScreen />)}

      {/* ── Preview Screen: full takeover (dark mode, no header/footer) ── */}
      {exam && phase === 'preview' && <PreviewScreen />}

      {/* ── Break Screen: full takeover (dark mode, no header/footer) ── */}
      {exam && phase === 'break' && <BreakScreen />}

      {/* ── Unscheduled Break Screen: full takeover ── */}
      {exam && phase === 'unscheduled-break' && <UnscheduledBreakScreen />}

      {/* ── Done Screen ── */}
      {exam && phase === 'done' && <DoneScreen />}

      {/* ── Exam Shell (directions, exam, check) ── */}
      {exam && (phase === 'directions' || phase === 'exam' || phase === 'check') && (
        <div className="bluebook-shell">
          {/* ── Header (always visible in directions, exam, check) ── */}
          <Header />
          <WarningBanner />

          {/* ── Main Content ── */}
          {phase === 'directions' && <DirectionsScreen />}
          {phase === 'exam' && <ExamScreen />}
          {phase === 'check' && <CheckYourWorkScreen />}

          <CalculatorOverlay />

          {/* ── Footer ── */}
          <Footer onResume={handleResume} />
        </div>
      )}
    </ErrorBoundary>
  );
};

export default App;