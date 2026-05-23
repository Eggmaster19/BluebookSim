import React from 'react';
import { useExamStore } from '../../store/examStore';

export const WarningBanner: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());
  if (!section) return null;

  if (section.calculatorType === 'none') {
    return (
      <div className="bb-banner bb-banner--red">
        <div className="bb-banner__left">
          <span className="bb-banner__icon">🚫</span>
          <span>NO CALCULATOR ALLOWED</span>
        </div>
        <div className="bb-banner__center">THIS IS A TEST PREVIEW</div>
        <div className="bb-banner__right">
          <span>NO CALCULATOR ALLOWED</span>
          <span className="bb-banner__icon">🚫</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-banner bb-banner--blue">
      <div className="bb-banner__left" />
      <div className="bb-banner__center">THIS IS A TEST PREVIEW</div>
      <div className="bb-banner__right" />
    </div>
  );
};
