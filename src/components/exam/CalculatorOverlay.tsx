import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useExamStore } from '../../store/examStore';

type DesmosCalculatorInstance = {
  destroy: () => void;
  resize: () => void;
};

type DesmosApi = {
  GraphingCalculator: (element: HTMLElement, options: Record<string, unknown>) => DesmosCalculatorInstance;
  FourFunctionCalculator: (element: HTMLElement, options: Record<string, unknown>) => DesmosCalculatorInstance;
  ScientificCalculator: (element: HTMLElement, options: Record<string, unknown>) => DesmosCalculatorInstance;
};

declare global {
  interface Window {
    Desmos?: DesmosApi;
  }
}

export const CalculatorOverlay: React.FC = () => {
  const isCalculatorOpen = useExamStore((s) => s.isCalculatorOpen);
  const closeCalculator = useExamStore((s) => s.closeCalculator);
  const calculatorMode = useExamStore((s) => s.calculatorMode);
  const setCalculatorMode = useExamStore((s) => s.setCalculatorMode);
  const section = useExamStore((s) => s.getCurrentSection());

  const calculatorType = section?.calculatorType ?? 'none';
  const calculatorAvailable = calculatorType !== 'none';

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 540,
    height: 580,
  });

  const draggableNodeRef = useRef<HTMLDivElement>(null);
  const calcContainerRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<DesmosCalculatorInstance | null>(null);

  useEffect(() => {
    if (!isCalculatorOpen || !calculatorAvailable || !calcContainerRef.current) return;

    // Determine mode to load without calling setCalculatorMode inside effect
    const modeToLoad = calculatorType === 'both'
      ? (calculatorMode === 'graphing' ? 'graphing' : 'scientific')
      : calculatorType;

    const Desmos = window.Desmos;
    if (!Desmos) {
      console.error('Desmos API not loaded');
      return;
    }

    // Initialize the correct calculator
    if (modeToLoad === 'graphing') {
      calculatorInstance.current = Desmos.GraphingCalculator(calcContainerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
      });
    } else if (modeToLoad === '4-function') {
      calculatorInstance.current = Desmos.FourFunctionCalculator(calcContainerRef.current, {
        keypad: true,
      });
    } else {
      // scientific is fallback
      calculatorInstance.current = Desmos.ScientificCalculator(calcContainerRef.current, {
        keypad: true,
      });
    }

    return () => {
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
        calculatorInstance.current = null;
      }
    };
  }, [isCalculatorOpen, calculatorAvailable, calculatorType, calculatorMode, setCalculatorMode]);

  // Adjust resize logic when dimensions change
  useEffect(() => {
    if (calculatorInstance.current) {
      calculatorInstance.current.resize();
    }
  }, [dimensions]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(380, Math.min(window.innerWidth - 60, startWidth + (moveEvent.clientX - startX)));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 60, startHeight + (moveEvent.clientY - startY)));
      setDimensions({ width: newWidth, height: newHeight });
      if (calculatorInstance.current) {
        calculatorInstance.current.resize();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (calculatorInstance.current) {
        calculatorInstance.current.resize();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isCalculatorOpen || !calculatorAvailable) return null;

  return (
    <Draggable handle=".calculator-header" bounds="body" nodeRef={draggableNodeRef}>
      <div
        ref={draggableNodeRef}
        style={{
          position: 'absolute',
          top: '100px',
          left: '100px',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          border: '1px solid #ccc',
        }}
      >
        {/* Header - Draggable Area */}
        <div
          className="calculator-header"
          style={{
            height: '46px',
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {calculatorType === 'both' ? (
              <div style={{ display: 'flex', border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setCalculatorMode('graphing')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: calculatorMode === 'graphing' ? '#ffffff' : '#1a1a1a',
                    color: calculatorMode === 'graphing' ? '#000000' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                  Graphing
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setCalculatorMode('scientific')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: calculatorMode === 'scientific' ? '#ffffff' : '#1a1a1a',
                    color: calculatorMode === 'scientific' ? '#000000' : '#ffffff',
                    border: 'none',
                    borderLeft: '1px solid #444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="8" y1="10" x2="8" y2="10" />
                  </svg>
                  Scientific
                </button>
              </div>
            ) : (
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                {calculatorType === 'graphing' ? 'Graphing Calculator' : 
                 calculatorType === 'scientific' ? 'Scientific Calculator' : 
                 calculatorType === '4-function' ? '4-Function Calculator' : 'Calculator'}
              </span>
            )}
          </div>

          {/* Centered drag handle icon */}
          <div style={{ display: 'flex', alignItems: 'center', color: '#888', cursor: 'grab' }} title="Drag to move">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="8" r="1.5" />
              <circle cx="15" cy="8" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="16" r="1.5" />
              <circle cx="15" cy="16" r="1.5" />
            </svg>
          </div>

          {/* Right close button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={closeCalculator}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calculator Content */}
        <div ref={calcContainerRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }} />

        {/* Bottom Right Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '18px',
            height: '18px',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            userSelect: 'none',
            zIndex: 10,
          }}
          title="Drag to resize"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="5" x2="5" y2="19" />
            <line x1="19" y1="11" x2="11" y2="19" />
            <line x1="19" y1="17" x2="17" y2="19" />
          </svg>
        </div>
      </div>
    </Draggable>
  );
};
