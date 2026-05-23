import React, { useRef, useCallback, useEffect } from 'react';
import type { FRQuestion } from '../../types/ExamSchema';
import { useExamStore } from '../../store/examStore';
import { Bookmark } from 'lucide-react';

interface EssayFRQBlockProps {
  question: FRQuestion;
}

/**
 * Essay-style FRQ block for AP English Literature.
 * Renders a rich-text editor with formatting toolbar, matching the Bluebook UI.
 * Essays are persisted to the exam store on every content change.
 */
export const EssayFRQBlock: React.FC<EssayFRQBlockProps> = ({ question }) => {
  const { flagged, toggleFlag, essayResponses, setEssayResponse, timerSeconds } = useExamStore();
  const isFlagged = flagged[question.id];
  const questionIndex = useExamStore((s) => s.currentQuestionIndex);
  const section = useExamStore((s) => s.getCurrentSection());
  const editorRef = useRef<HTMLDivElement>(null);

  // Determine reading period
  const isReadingPeriod = section?.readingPeriodMinutes 
    ? timerSeconds > (section.timeMinutes - section.readingPeriodMinutes) * 60
    : false;

  const readingPeriodMinutesLeft = isReadingPeriod && section?.readingPeriodMinutes
    ? Math.ceil((timerSeconds - (section.timeMinutes - section.readingPeriodMinutes) * 60) / 60)
    : 0;

  // Load saved essay content when question changes
  useEffect(() => {
    if (editorRef.current) {
      const saved = essayResponses[question.id] || '';
      if (editorRef.current.innerHTML !== saved) {
        editorRef.current.innerHTML = saved;
      }
    }
  }, [question.id, essayResponses]);

  // Auto-save on content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setEssayResponse(question.id, editorRef.current.innerHTML);
    }
  }, [question.id, setEssayResponse]);

  // Execute formatting commands
  const execCommand = useCallback((command: string, value?: string) => {
    // Focus the editor first to make sure execCommand works
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Trigger save after formatting
    handleInput();
  }, [handleInput]);

  // Handle Tab key — insert tab spaces instead of losing focus
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertHTML', '&emsp;&emsp;');
    }
  }, [execCommand]);

  // Toolbar button definition
  const toolbarButtons = [
    { label: 'B', command: 'bold', title: 'Bold (Ctrl+B)', className: 'bb-essay-toolbar__btn--bold' },
    { label: 'I', command: 'italic', title: 'Italic (Ctrl+I)', className: 'bb-essay-toolbar__btn--italic' },
    { label: 'U', command: 'underline', title: 'Underline (Ctrl+U)', className: 'bb-essay-toolbar__btn--underline' },
    { label: 'Ω', command: 'special', title: 'Special Characters', className: '' },
    { label: '✂', command: 'cut', title: 'Cut (Ctrl+X)', className: '' },
    { label: '📋', command: 'copy', title: 'Copy (Ctrl+C)', className: '' },
    { label: '📄', command: 'paste', title: 'Paste (Ctrl+V)', className: '' },
    { label: '↩', command: 'undo', title: 'Undo (Ctrl+Z)', className: '' },
    { label: '↪', command: 'redo', title: 'Redo (Ctrl+Y)', className: '' },
    { label: 'X²', command: 'superscript', title: 'Superscript', className: '' },
    { label: 'X₂', command: 'subscript', title: 'Subscript', className: '' },
    { label: '≡', command: 'indent', title: 'Indent', className: '' },
  ];

  const handleToolbarClick = useCallback((command: string) => {
    switch (command) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'superscript':
      case 'subscript':
      case 'undo':
      case 'redo':
        execCommand(command);
        break;
      case 'cut':
        execCommand('cut');
        break;
      case 'copy':
        execCommand('copy');
        break;
      case 'paste':
        // Use clipboard API for paste
        navigator.clipboard.readText().then(text => {
          execCommand('insertText', text);
        }).catch(() => {
          // Fallback — execCommand paste is unreliable
          execCommand('paste');
        });
        break;
      case 'indent':
        execCommand('indent');
        break;
      case 'special':
        // Insert a common special character (em dash) as a demo
        // Could be expanded to a character picker modal
        execCommand('insertHTML', '—');
        break;
      default:
        break;
    }
  }, [execCommand]);

  // Instructions matching the real Bluebook UI
  const instructions = [
    'Respond to the prompt with a thesis that presents a defensible interpretation.',
    'Select and use evidence to support your line of reasoning.',
    'Explain how the evidence supports your line of reasoning.',
    'Use appropriate grammar and punctuation in communicating your argument.',
  ];

  return (
    <div className="bb-question-block">
      {/* ── Question Header ── */}
      <div className="bb-question-header">
        <span className="bb-question-number">{questionIndex + 1}</span>
        <button
          className={`bb-question-flag ${isFlagged ? 'bb-question-flag--active' : ''}`}
          onClick={() => toggleFlag(question.id)}
        >
          <Bookmark size={16} />
          Mark for Review
        </button>
        <span className="bb-question-header__spacer" />
        {/* No ABC eliminator for essay FRQ */}
      </div>

      {/* ── Essay Prompt Text ── */}
      <div className="bb-question-text">
        <div dangerouslySetInnerHTML={{ __html: question.text }} />
      </div>

      {/* ── Response Instructions ── */}
      <div className="bb-essay-instructions">
        <p>In your response you should do the following:</p>
        <ul>
          {instructions.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ul>
      </div>

      {/* ── Auto-save Label ── */}
      <div className="bb-essay-autosave">
        Your response will be saved automatically
      </div>

      {/* ── Formatting Toolbar ── */}
      <div className="bb-essay-toolbar">
        {toolbarButtons.map((btn, i) => (
          <button
            key={i}
            className={`bb-essay-toolbar__btn ${btn.className}`}
            title={btn.title}
            onMouseDown={(e) => {
              // Prevent blur on the editor when clicking toolbar
              e.preventDefault();
              handleToolbarClick(btn.command);
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Reading Period Banner ── */}
      {isReadingPeriod && (
        <div style={{ padding: '12px', background: '#222', color: '#ccc', borderRadius: '4px', border: '1px solid #444', margin: '0 24px 16px', fontWeight: 500, textAlign: 'center' }}>
          Optional Reading Period: {readingPeriodMinutesLeft} minute{readingPeriodMinutesLeft !== 1 ? 's' : ''} remaining.
        </div>
      )}

      {/* ── Rich Text Editor ── */}
      <div
        ref={editorRef}
        className="bb-essay-editor"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="Type your essay here..."
        suppressContentEditableWarning
      />
    </div>
  );
};
