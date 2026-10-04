import React, { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import type { ExamSection } from '../../types/ExamSchema';
import '../../styles/bluebook.css';

export const PreviewScreen: React.FC = () => {
  const exam = useExamStore((s) => s.exam);
  const updateSectionTime = useExamStore((s) => s.updateSectionTime);
  const startExamFromPreview = useExamStore((s) => s.startExamFromPreview);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleCommitTime = (idx: number) => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateSectionTime(idx, parsed);
    }
    setEditingIndex(null);
  };

  const getMinutesPerQuestion = (sec: ExamSection) => {
    if (sec.timePerQuestion !== undefined) {
      return Number(sec.timePerQuestion.toFixed(2));
    }
    const qCount = sec.questions.length;
    const standardTime = sec.defaultTimeMinutes || sec.timeMinutes;
    if (qCount > 0) {
      return Number((standardTime / qCount).toFixed(1));
    }
    return 1.5;
  };

  if (!exam) return null;

  return (
    <div className="json-input-screen">
      {/* ── Header ── */}
      <div className="json-input-header">
        <button 
          className="json-input-back" 
          onClick={() => useExamStore.setState({ exam: null, phase: 'directions' })} // Just reset to json input screen, we can just clear exam
        >
          ← back to input
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className="json-input-exam-label" style={{ fontSize: '16px', color: '#fff', fontWeight: 500 }}>
            Exam Preview & Settings
          </span>
        </div>
        <div style={{ width: '80px' }} /> {/* Spacer for centering */}
      </div>

      {/* ── Content ── */}
      <div className="json-input-split" style={{ flexDirection: 'column', alignItems: 'center', padding: '40px 20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="json-input-instructions" style={{ border: 'none', padding: 0, fontSize: '15px', color: '#aaa', textAlign: 'center' }}>
            Review the sections for your upcoming exam. You can adjust the time limit for each section below before beginning.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {exam.sections.map((section, index) => (
              <div key={section.id} style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>{section.title}</span>
                  <span style={{ fontSize: '14px', color: '#888', background: '#1a1a1a', padding: '4px 10px', borderRadius: '12px' }}>
                    {section.questions.length} Question{section.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="json-input-label" style={{ marginBottom: '4px', color: '#aaa' }}>Time Limit</label>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Suggested: {section.suggestedTimeMinutes ?? section.timeMinutes} mins (Standard: {section.defaultTimeMinutes ?? 90} min, {getMinutesPerQuestion(section)} minutes per question.)
                      </div>
                    </div>
                    {editingIndex === index ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-end', paddingBottom: '2px' }}>
                        <input
                          type="number"
                          min="1"
                          max="600"
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCommitTime(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitTime(index);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          style={{
                            width: '68px',
                            padding: '3px 8px',
                            background: '#111',
                            border: '1px solid #4ade80',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 600,
                            textAlign: 'center',
                            outline: 'none',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#aaa' }}>minutes</span>
                      </div>
                    ) : (
                      <span 
                        onClick={() => {
                          setEditingIndex(index);
                          setEditValue(String(section.timeMinutes));
                        }}
                        title="Click to type a custom time limit"
                        style={{ 
                          fontSize: '16px', 
                          color: '#fff', 
                          fontWeight: 500, 
                          alignSelf: 'flex-end', 
                          paddingBottom: '2px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderBottom: '1px dashed #666',
                        }}
                      >
                        <strong style={{ fontWeight: 600 }}>{section.timeMinutes}</strong> minutes
                      </span>
                    )}
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max={Math.max(180, section.timeMinutes)} 
                    step="1"
                    value={section.timeMinutes} 
                    onChange={(e) => updateSectionTime(index, parseInt(e.target.value, 10))}
                    style={{ 
                      width: '100%', 
                      cursor: 'pointer',
                      accentColor: '#4ade80' // A nice green from status--valid
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
                    <span>1 min</span>
                    <span>{Math.max(180, section.timeMinutes)} min</span>
                  </div>
                </div>

                {/* ── Question Preview ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <label className="json-input-label" style={{ marginBottom: 0, color: '#aaa' }}>Questions Preview</label>
                  <div style={{ 
                    background: '#111', 
                    border: '1px solid #222', 
                    borderRadius: '6px', 
                    padding: '12px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {section.questions.map((q, qIndex) => (
                      <div key={q.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
                        <span style={{ 
                          color: '#fff', 
                          background: '#222', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '11px',
                          whiteSpace: 'nowrap'
                        }}>
                          Q{qIndex + 1}
                        </span>
                        <span style={{ color: '#4ade80', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, paddingTop: '1px' }}>
                          {q.questionType}
                        </span>
                        <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {q.text || '(No text)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {section.breakAfterMinutes !== null && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Followed by a {section.breakAfterMinutes}-minute break
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="json-input-footer" style={{ justifyContent: 'center', padding: '20px' }}>
        <button 
          className="json-input-start" 
          onClick={startExamFromPreview}
          style={{ fontSize: '16px', padding: '12px 40px', fontWeight: 600, background: '#fff', color: '#000', borderColor: '#fff' }}
        >
          Begin Test
        </button>
      </div>
    </div>
  );
};
