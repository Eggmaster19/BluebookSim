import React, { useEffect, useState } from 'react';
import { useExamStore } from '../../store/examStore';

export const BreakScreen: React.FC = () => {
  const studentName = useExamStore((s) => s.studentName);
  const setPhase = useExamStore((s) => s.setPhase);

  // 10-minute break countdown
  const [breakSeconds, setBreakSeconds] = useState(10 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreakSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(breakSeconds / 60);
  const seconds = breakSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
        <h1 className="bb-break__title">Test Preview Break</h1>
        <p className="bb-break__subtitle">
          You can resume this practice test as soon as you're ready to move on. On test day, you'll
          wait until the clock counts down. Read below to see how breaks work on test day.
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
