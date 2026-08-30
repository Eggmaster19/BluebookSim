import React, { useEffect } from 'react';
import { useExamStore } from '../../store/examStore';

export const UnscheduledBreakScreen: React.FC = () => {
  const studentName = useExamStore((s) => s.studentName);
  const section = useExamStore((s) => s.getCurrentSection());
  const timerSeconds = useExamStore((s) => s.timerSeconds);
  const tickTimer = useExamStore((s) => s.tickTimer);
  const setPhase = useExamStore((s) => s.setPhase);
  const startTimer = useExamStore((s) => s.startTimer);

  useEffect(() => {
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer]);

  const minutes = Math.floor(timerSeconds / 60);
  const remainingSeconds = timerSeconds % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <div style={{ backgroundColor: '#191c1f', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 48px', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '48px', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', backgroundColor: '#1a5fb4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '14px' }}>
          ✦
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>Bluebook</span>
      </header>

      <div style={{ display: 'flex', gap: '48px', flex: 1, alignItems: 'flex-start' }}>
        <div style={{ borderRadius: '8px', backgroundColor: '#26292d', border: '1px solid #3a3f45', padding: '28px 32px', width: '320px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', color: '#ffd100' }}>≡</span>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>{section?.title || 'Section I'}</span>
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#aaa', fontWeight: 500 }}>Time Remaining in Module:</div>
          <div style={{ fontSize: '48px', fontWeight: '700', marginTop: '4px', color: '#ffffff', fontFamily: 'monospace' }}>
            {timeStr}
          </div>
        </div>

        <div style={{ maxWidth: '650px', paddingTop: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>
            Unscheduled Break: Do Not Close Your Device
          </h1>
          <p style={{ fontSize: '17px', color: '#cccccc', lineHeight: '1.6', marginBottom: '36px' }}>
            If this module ends while you're on break, you'll be taken to the next module.
          </p>
          <button
            style={{
              backgroundColor: '#ffd100',
              color: '#000000',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '24px',
              padding: '12px 32px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            onClick={() => {
              setPhase('exam');
              startTimer();
            }}
          >
            Resume Testing
          </button>
        </div>
      </div>

      <footer style={{ marginTop: 'auto', paddingTop: '32px', color: '#888888', fontSize: '14px' }}>
        {studentName}
      </footer>
    </div>
  );
};

export default UnscheduledBreakScreen;