import React, { useState } from 'react';

export const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    multipleChoice: true,
    testingTimers: true,
    testTools: true,
    audioSpokenDirections: true,
    freeResponse: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleAll = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    setExpandedSections({
      multipleChoice: !allExpanded,
      testingTimers: !allExpanded,
      testTools: !allExpanded,
      audioSpokenDirections: !allExpanded,
      freeResponse: !allExpanded,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          width: '80%',
          maxWidth: '600px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid #ddd',
          }}
        >
          <h2>Keyboard Shortcuts</h2>
          <div>
            <button
              onClick={toggleAll}
              style={{
                marginRight: '16px',
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              {Object.values(expandedSections).every(Boolean)
                ? 'Collapse All'
                : 'Expand All'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ padding: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              onClick={() => toggleSection('multipleChoice')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <h3>Multiple-Choice Questions</h3>
              <span>{expandedSections.multipleChoice ? '▲' : '▼'}</span>
            </div>
            {expandedSections.multipleChoice && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td>Next question:</td>
                    <td>Alt + N (or Page Down, Right Arrow)</td>
                  </tr>
                  <tr>
                    <td>Previous question:</td>
                    <td>Alt + P (or Page Up, Left Arrow)</td>
                  </tr>
                  <tr>
                    <td>Select option A:</td>
                    <td>Alt + A</td>
                  </tr>
                  <tr>
                    <td>Select option B:</td>
                    <td>Alt + B</td>
                  </tr>
                  <tr>
                    <td>Select option C:</td>
                    <td>Alt + C</td>
                  </tr>
                  <tr>
                    <td>Select option D:</td>
                    <td>Alt + D</td>
                  </tr>
                  <tr>
                    <td>Eliminate option A:</td>
                    <td>Alt + Shift + A</td>
                  </tr>
                  <tr>
                    <td>Eliminate option B:</td>
                    <td>Alt + Shift + B</td>
                  </tr>
                  <tr>
                    <td>Eliminate option C:</td>
                    <td>Alt + Shift + C</td>
                  </tr>
                  <tr>
                    <td>Eliminate option D:</td>
                    <td>Alt + Shift + D</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              onClick={() => toggleSection('testingTimers')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <h3>Testing Timers</h3>
              <span>{expandedSections.testingTimers ? '▲' : '▼'}</span>
            </div>
            {expandedSections.testingTimers && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td>Show / Hide timer:</td>
                    <td>Alt + T</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              onClick={() => toggleSection('testTools')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <h3>Test Tools</h3>
              <span>{expandedSections.testTools ? '▲' : '▼'}</span>
            </div>
            {expandedSections.testTools && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td>Open / Close Calculator:</td>
                    <td>Alt + C</td>
                  </tr>
                  <tr>
                    <td>Reference Sheet:</td>
                    <td>Alt + R</td>
                  </tr>
                  <tr>
                    <td>Highlights & Notes:</td>
                    <td>Alt + H</td>
                  </tr>
                  <tr>
                    <td>Mark for Review:</td>
                    <td>Alt + M</td>
                  </tr>
                  <tr>
                    <td>Question Menu:</td>
                    <td>Alt + Q</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              onClick={() => toggleSection('audioSpokenDirections')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <h3>Audio and Spoken Directions</h3>
              <span>{expandedSections.audioSpokenDirections ? '▲' : '▼'}</span>
            </div>
            {expandedSections.audioSpokenDirections && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td>Play / Pause audio:</td>
                    <td>Alt + Space</td>
                  </tr>
                  <tr>
                    <td>Replay audio from start:</td>
                    <td>Alt + Shift + R</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              onClick={() => toggleSection('freeResponse')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <h3>Free-Response Questions</h3>
              <span>{expandedSections.freeResponse ? '▲' : '▼'}</span>
            </div>
            {expandedSections.freeResponse && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td>Bold:</td>
                    <td>Ctrl + B</td>
                  </tr>
                  <tr>
                    <td>Italic:</td>
                    <td>Ctrl + I</td>
                  </tr>
                  <tr>
                    <td>Underline:</td>
                    <td>Ctrl + U</td>
                  </tr>
                  <tr>
                    <td>Undo:</td>
                    <td>Ctrl + Z</td>
                  </tr>
                  <tr>
                    <td>Redo:</td>
                    <td>Ctrl + Y</td>
                  </tr>
                  <tr>
                    <td>Cut:</td>
                    <td>Ctrl + X</td>
                  </tr>
                  <tr>
                    <td>Copy:</td>
                    <td>Ctrl + C</td>
                  </tr>
                  <tr>
                    <td>Paste:</td>
                    <td>Ctrl + V</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            borderTop: '1px solid #ddd',
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ffd100',
              color: '#000',
              fontWeight: '700',
              borderRadius: '24px',
              padding: '10px 28px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;