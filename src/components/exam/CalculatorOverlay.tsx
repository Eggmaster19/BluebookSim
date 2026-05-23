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
  const getCurrentSection = useExamStore((s) => s.getCurrentSection);

  const section = getCurrentSection();
  const calculatorType = section?.calculatorType ?? 'none';
  const calculatorAvailable = calculatorType !== 'none';

  const [isExpanded, setIsExpanded] = useState(false);
  const draggableNodeRef = useRef<HTMLDivElement>(null);
  const calcContainerRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<DesmosCalculatorInstance | null>(null);

  useEffect(() => {
    if (!isCalculatorOpen || !calculatorAvailable || !calcContainerRef.current) return;

    // Default to the section's base type, or the user's toggle if 'both'
    let modeToLoad = calculatorType;
    if (calculatorType === 'both') {
      modeToLoad = calculatorMode === 'graphing' || calculatorMode === 'scientific'
        ? calculatorMode
        : 'scientific';
      if (calculatorMode !== modeToLoad) {
        setCalculatorMode('scientific');
      }
    }

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

  // Adjust resize logic when toggling expand/minimize
  useEffect(() => {
    if (calculatorInstance.current) {
      calculatorInstance.current.resize();
    }
  }, [isExpanded]);

  if (!isCalculatorOpen || !calculatorAvailable) return null;

  return (
    <Draggable handle=".calculator-header" bounds="body" nodeRef={draggableNodeRef}>
      <div
        ref={draggableNodeRef}
        style={{
          position: 'absolute',
          top: '100px',
          left: '100px',
          width: isExpanded ? '800px' : '450px',
          height: isExpanded ? '600px' : '550px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
            height: '44px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {calculatorType === 'both' ? (
              <div style={{ display: 'flex', border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
                <button
                  onMouseDown={(e) => e.stopPropagation()} // prevent dragging when clicking
                  onClick={() => setCalculatorMode('graphing')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: calculatorMode === 'graphing' ? '#ffffff' : '#1a1a1a',
                    color: calculatorMode === 'graphing' ? '#000000' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
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
                    padding: '4px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: calculatorMode === 'scientific' ? '#ffffff' : '#1a1a1a',
                    color: calculatorMode === 'scientific' ? '#000000' : '#ffffff',
                    border: 'none',
                    borderLeft: '1px solid #444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
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

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Draggable drag handle icon */}
            <div style={{ display: 'flex', alignItems: 'center', color: '#888', marginRight: '16px', cursor: 'grab' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isExpanded ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
            </button>
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
        <div ref={calcContainerRef} style={{ flex: 1, width: '100%', height: '100%' }} />
      </div>
    </Draggable>
  );
};
