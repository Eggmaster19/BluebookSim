import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useExamStore } from '../../store/examStore';
import type { HighlightNote } from '../../types/ExamSchema';

interface NotesPanelProps {
  questionId: string;
  splitPane: boolean;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ questionId, splitPane }) => {
  const highlights = useExamStore((s) =>
    s.highlights.filter((highlight) => highlight.questionId === questionId && highlight.hasNote)
  );
  const notesPanelWidth = useExamStore((s) => s.notesPanelWidth);
  const setNotesPanelWidth = useExamStore((s) => s.setNotesPanelWidth);

  if (highlights.length === 0) return null;

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = notesPanelWidth;

    const onMove = (moveEvent: MouseEvent) => {
      setNotesPanelWidth(startWidth + (moveEvent.clientX - startX));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <aside
      className={`bb-notes-panel ${splitPane ? 'bb-notes-panel--split' : 'bb-notes-panel--single'}`}
      style={{ width: splitPane ? notesPanelWidth : 280 }}
    >
      <div className="bb-notes-panel__list">
        {highlights.map((highlight) => (
          <NoteCard key={highlight.id} highlight={highlight} />
        ))}
      </div>

      {splitPane && (
        <button className="bb-notes-panel__resize" aria-label="Resize notes panel" onMouseDown={startResize}>
          <span />
        </button>
      )}
    </aside>
  );
};

const NoteCard: React.FC<{ highlight: HighlightNote }> = ({ highlight }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateNoteText = useExamStore((s) => s.updateNoteText);
  const removeHighlight = useExamStore((s) => s.removeHighlight);

  return (
    <div className="bb-note-card">
      <div className={`bb-note-card__header bb-note-card__header--${highlight.color}`}>
        <div className="bb-note-card__snippet">{highlight.text}</div>
        <button className="bb-note-card__delete" aria-label="Delete note" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={18} />
        </button>
      </div>
      <textarea
        className="bb-note-card__textarea"
        placeholder="Notes are saved automatically."
        value={highlight.note}
        onChange={(event) => updateNoteText(highlight.id, event.target.value)}
      />

      {confirmDelete && (
        <div className="bb-note-card__confirm">
          <div className="bb-note-card__confirm-title">Delete This Note?</div>
          <div className="bb-note-card__confirm-actions">
            <button className="bb-note-card__confirm-no" onClick={() => setConfirmDelete(false)}>
              No
            </button>
            <button className="bb-note-card__confirm-yes" onClick={() => removeHighlight(highlight.id)}>
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
