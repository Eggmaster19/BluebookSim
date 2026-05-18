import React, { useEffect } from 'react';
import { useExamStore } from '../../store/examStore';

export const BreakScreen: React.FC = () => {
  const studentName = useExamStore((s) => s.studentName);
  const setPhase = useExamStore((s) => s.setPhase);
  const breakDuration = useExamStore((s) => s.breakDuration);
  const tickBreak = useExamStore((s) => s.tickBreak);

  useEffect(() => {
    const interval = setInterval(() => {
      tickBreak();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickBreak]);

  const minutes = Math.floor(breakDuration / 60);
  const seconds = breakDuration % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Short break (≤ 2 min) vs long break (10 min)
  // Use the initial breakDuration from the store to determine break type
  // (breakDuration ticks down, but we want the label to stay consistent)
  const isShortBreak = breakDuration <= 120;

  const handleResume = () => {
    setPhase('directions');
  };

  return (
    <div className="bb-break">
      <div className="bb-break__left">
        <div className="bb-break__timer-box">
          <div className="bb-break__timer-label">Remaining Break Time:</div>
          <div className="bb-break__timer-value">{timeStr}</div>
        </div>
        <button className="bb-break__resume-btn" onClick={handleResume}>
          Resume Testing
        </button>
      </div>

      <div className="bb-break__right">
        <h1 className="bb-break__title">
          {isShortBreak ? 'Short Break' : 'Test Preview Break'}
        </h1>
        <p className="bb-break__subtitle">
          {isShortBreak
            ? 'This is a brief pause between sections. You can resume as soon as you\'re ready.'
            : 'You can resume this practice test as soon as you\'re ready to move on. On test day, you\'ll wait until the clock counts down. Read below to see how breaks work on test day.'}
        </p>
        <hr style={{ borderColor: '#444', marginBottom: '24px' }} />
        <h2 className="bb-break__rules-title">
          Take a Break: Do Not Close Your Device
        </h2>
        <ol className="bb-break__rules">
          <li>Do not disturb students who are still testing.</li>
          <li>Do not exit the app or close your laptop.</li>
          <li>Do not access phones, smartwatches, textbooks, notes, or the internet.</li>
          <li>Do not eat or drink in the test room.</li>
          <li>
            Do not speak in the test room; outside the test room, do not discuss the exam with
            anyone.
          </li>
        </ol>
      </div>

      <div className="bb-break__footer">
        <span className="bb-break__name">{studentName}</span>
      </div>
    </div>
  );
};
