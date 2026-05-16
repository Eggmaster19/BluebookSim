import React from 'react';
import { useExamStore } from '../../store/examStore';

export const DirectionsScreen: React.FC = () => {
  const section = useExamStore((s) => s.getCurrentSection());

  if (!section) return null;

  return (
    <div className="bb-directions">
      <div className="bb-directions__content">
        <div
          className="bb-directions__inner"
          dangerouslySetInnerHTML={{ __html: section.directions }}
        />
      </div>
    </div>
  );
};
