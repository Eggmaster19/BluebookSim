import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useExamStore } from '../../store/examStore';

export const CalculatorOverlay: React.FC = () => {
  const isCalculatorOpen = useExamStore((s) => s.isCalculatorOpen);
  const closeCalculator = useExamStore((s) => s.closeCalculator);
  const calculatorMode = useExamStore((s) => s.calculatorMode);
  const setCalculatorMode = useExamStore((s) => s.setCalculatorMode);
  const getCurrentSection = useExamStore((s) => s.getCurrentSection);

  const section = getCurrentSection();
  const calculatorType = section?.calculatorType;

  const [isExpanded, setIsExpanded] = useState(false);
  const draggableNodeRef = useRef<HTMLDivElement>(null);
  const calcContainerRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<any>(null);

  useEffect(() => {
    if (!isCalculatorOpen || !calcContainerRef.current) return;

    // Default to the section's base type, or the user's toggle if 'both'
    let modeToLoad = calculatorType;
    if (calculatorType === 'both') {
      modeToLoad = calculatorMode !== 'none' ? calculatorMode : 'scientific';
      if (calculatorMode === 'none') {
        setCalculatorMode('scientific');
      }
    }

    const Desmos = (window as any).Desmos;
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
  }, [isCalculatorOpen, calculatorType, calculatorMode, setCalculatorMode]);

  // Adjust resize logic when toggling expand/minimize
  useEffect(() => {
    if (calculatorInstance.current) {
      calculatorInstance.current.resize();
    }
  }, [isExpanded]);

  if (!isCalculatorOpen) return null;

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
            height: '40px',
            backgroundColor: '#f1f1f1',
            borderBottom: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Calculator</span>
            {calculatorType === 'both' && (
              <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                <button
                  onMouseDown={(e) => e.stopPropagation()} // prevent dragging when clicking
                  onClick={() => setCalculatorMode('scientific')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '12px',
                    backgroundColor: calculatorMode === 'scientific' ? '#0077c8' : '#fff',
                    color: calculatorMode === 'scientific' ? '#fff' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Scientific
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setCalculatorMode('graphing')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '12px',
                    backgroundColor: calculatorMode === 'graphing' ? '#0077c8' : '#fff',
                    color: calculatorMode === 'graphing' ? '#fff' : '#333',
                    border: 'none',
                    borderLeft: '1px solid #ccc',
                    cursor: 'pointer',
                  }}
                >
                  Graphing
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
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
                color: '#555',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
