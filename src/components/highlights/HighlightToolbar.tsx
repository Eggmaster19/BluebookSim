import React, { useState } from 'react';
import { ChevronDown, Droplet, FilePlus2, Trash2, Underline } from 'lucide-react';
import { useExamStore } from '../../store/examStore';
import type { HighlightColor, HighlightUnderline } from '../../types/ExamSchema';

interface HighlightToolbarProps {
  highlightId: string | null;
  x: number;
  y: number;
  onClose: () => void;
}

const colors: Array<{ value: HighlightColor; label: string }> = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'blue', label: 'Blue' },
  { value: 'pink', label: 'Pink' },
];

const underlineOptions: Array<{ value: HighlightUnderline; label: string }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'none', label: 'None' },
];

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({ highlightId, x, y, onClose }) => {
  const [underlineOpen, setUnderlineOpen] = useState(false);
  const activeColor = useExamStore((s) => s.highlightColor);
  const activeUnderline = useExamStore((s) => s.highlightUnderline);
  const setHighlightColor = useExamStore((s) => s.setHighlightColor);
  const setHighlightUnderline = useExamStore((s) => s.setHighlightUnderline);
  const updateHighlightStyle = useExamStore((s) => s.updateHighlightStyle);
  const removeHighlight = useExamStore((s) => s.removeHighlight);
  const addNoteToHighlight = useExamStore((s) => s.addNoteToHighlight);

  if (!highlightId) return null;

  const chooseColor = (color: HighlightColor) => {
    setHighlightColor(color);
    updateHighlightStyle(highlightId, { color });
  };

  const chooseUnderline = (underline: HighlightUnderline) => {
    setHighlightUnderline(underline);
    updateHighlightStyle(highlightId, { underline });
    setUnderlineOpen(false);
  };

  return (
    <div
      className="bb-highlight-toolbar"
      style={{ left: x, top: y }}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="bb-highlight-toolbar__colors">
        {colors.map((color) => (
          <button
            key={color.value}
            className={`bb-highlight-toolbar__swatch bb-highlight-toolbar__swatch--${color.value} ${activeColor === color.value ? 'bb-highlight-toolbar__swatch--active' : ''}`}
            aria-label={color.label}
            onClick={() => chooseColor(color.value)}
          >
            {activeColor === color.value && <Droplet size={15} fill="currentColor" />}
          </button>
        ))}
      </div>

      <div className="bb-highlight-toolbar__divider" />

      <div className="bb-highlight-toolbar__menu-wrap">
        <button
          className={`bb-highlight-toolbar__round bb-highlight-toolbar__underline bb-highlight-toolbar__underline--${activeUnderline}`}
          aria-label="Underline style"
          onClick={() => setUnderlineOpen((open) => !open)}
        >
          <Underline size={21} />
          <ChevronDown size={14} className={underlineOpen ? 'bb-highlight-toolbar__chevron--open' : ''} />
        </button>

        {underlineOpen && (
          <div className="bb-highlight-menu">
            {underlineOptions.map((option) => (
              <button
                key={option.value}
                className={`bb-highlight-menu__item ${activeUnderline === option.value ? 'bb-highlight-menu__item--active' : ''}`}
                onClick={() => chooseUnderline(option.value)}
              >
                {option.value === 'none' ? (
                  <span>None</span>
                ) : (
                  <span className={`bb-highlight-menu__u bb-highlight-menu__u--${option.value}`}>U</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="bb-highlight-toolbar__round"
        aria-label="Delete highlight"
        onClick={() => {
          removeHighlight(highlightId);
          onClose();
        }}
      >
        <Trash2 size={24} />
      </button>

      <button
        className="bb-highlight-toolbar__round bb-highlight-toolbar__note"
        aria-label="Add note"
        onClick={() => {
          addNoteToHighlight(highlightId);
          onClose();
        }}
      >
        <FilePlus2 size={24} />
      </button>
    </div>
  );
};
