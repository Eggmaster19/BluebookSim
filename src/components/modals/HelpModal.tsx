import React, { useState } from 'react';

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleAccordion = (index: number) => {
    setExpandedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const expandAll = () => {
    setExpandedItems(Array.from({ length: 14 }, (_, i) => i));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const accordionItems = [
    {
      title: 'Zoom and Magnification',
      content:
        'Use keyboard shortcuts Ctrl+/Ctrl- (or Cmd+/Cmd-) to zoom in/out. Use touch pinch zoom on touch devices. Reset zoom with Ctrl+0.',
    },
    {
      title: 'Highlights & Notes',
      content:
        'Select text with mouse, choose highlight color (yellow, blue, pink), add underlines (solid, dashed, dotted), add sticky notes, and manage notes in the side panel.',
    },
    {
      title: 'Testing Timers',
      content:
        'The countdown clock is at top center. Use the Hide/Show button. There is an automatic 5-minute warning banner.',
    },
    {
      title: 'Line Reader',
      content:
        'A visual aid tool to help focus on reading passages line by line.',
    },
    {
      title: 'Option Eliminator',
      content:
        'Use the (ABC) cross-out tool to eliminate choices.',
    },
    {
      title: 'Mark for Review',
      content:
        'Use the flag / bookmark button to mark questions to revisit.',
    },
    {
      title: 'Question Menu',
      content:
        'Open the bottom question navigator to jump to any question or access the Check Your Work review screen.',
    },
    {
      title: 'Make an Educated Guess',
      content:
        'There is no penalty for guessing. Answer every question.',
    },
    {
      title: 'Restarting the App',
      content:
        'Progress is automatically saved. Testing resumes if the device restarts.',
    },
    {
      title: 'Submitting Your Answers',
      content:
        'Complete the final section and submit the exam.',
    },
    {
      title: 'Exiting the App on a Chromebook',
      content:
        'Use keyboard shortcuts and follow steps to exit on Chromebooks.',
    },
    {
      title: 'Screen Readers',
      content:
        'Detailed subsections for Chromebook ChromeVox, Windows Narrator, MacOS VoiceOver, and iPad VoiceOver navigation commands.',
    },
    {
      title: 'Link to Referenced Content',
      content:
        'Click underlined line numbers or references to jump to passage locations.',
    },
    {
      title: 'Screen Magnification',
      content:
        'Use built-in operating system magnification tools during testing.',
    },
  ];

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          width: '80%',
          maxHeight: '90%',
          overflowY: 'auto',
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2>Help</h2>
          <div>
            <button
              style={{
                marginRight: '10px',
                padding: '5px 10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={expandedItems.length === accordionItems.length ? collapseAll : expandAll}
            >
              {expandedItems.length === accordionItems.length ? 'Collapse All' : 'Expand All'}
            </button>
            <button
              style={{
                padding: '5px 10px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '18px',
              }}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>
        {accordionItems.map((item, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
              onClick={() => toggleAccordion(index)}
            >
              <span>{item.title}</span>
              <span>{expandedItems.includes(index) ? '▲' : '▼'}</span>
            </div>
            {expandedItems.includes(index) && (
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                }}
              >
                <p>{item.content}</p>
              </div>
            )}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
          }}
        >
          <button
            style={{
              backgroundColor: '#ffd100',
              color: '#000',
              fontWeight: '700',
              borderRadius: '24px',
              padding: '10px 28px',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;