import React, { useEffect } from 'react';
import { useExamStore } from './store/examStore';
import { SelectionScreen } from './components/screens/SelectionScreen';
import { JsonInputScreen } from './components/screens/JsonInputScreen';

// Layout
import { Header } from './components/layout/Header';

import { Footer } from './components/layout/Footer';

// Screens
import { PreviewScreen } from './components/screens/PreviewScreen';
import { DirectionsScreen } from './components/screens/DirectionsScreen';
import { ExamScreen } from './components/screens/ExamScreen';
import { CheckYourWorkScreen } from './components/screens/CheckYourWorkScreen';
import { BreakScreen } from './components/screens/BreakScreen';
import { DoneScreen } from './components/screens/DoneScreen';

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

  // No longer load mock exam on mount automatically

  // Timer tick effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // ── Pre-exam screens ──
  if (!exam) {
    if (selectedExamType) {
      return <JsonInputScreen />;
    }
    return <SelectionScreen />;
  }

  // ── Preview Screen: full takeover (dark mode, no header/footer) ──
  if (phase === 'preview') {
    return <PreviewScreen />;
  }

  // ── Break Screen: full takeover (dark mode, no header/footer) ──
  if (phase === 'break') {
    return <BreakScreen />;
  }

  // ── Done Screen ──
  if (phase === 'done') {
    return <DoneScreen />;
  }

  // Handle resume from directions
  const handleResume = () => {
    setPhase('exam');
    startTimer();
  };

  return (
    <div className="bluebook-shell">
      {/* ── Header (always visible in directions, exam, check) ── */}
      <Header />


      {/* ── Main Content ── */}
      {phase === 'directions' && <DirectionsScreen />}
      {phase === 'exam' && <ExamScreen />}
      {phase === 'check' && <CheckYourWorkScreen />}

      {/* ── Footer ── */}
      <Footer onResume={handleResume} />
    </div>
  );
};

export default App;
