import React, { useEffect, useState } from 'react';
import { Highlighter } from 'lucide-react';
import { useExamStore } from '../../store/examStore';
import { HighlightToolbar } from './HighlightToolbar';

interface ToolbarState {
  highlightId: string;
  x: number;
  y: number;
}

interface CursorState {
  visible: boolean;
  x: number;
  y: number;
}

export const HighlightsLayer: React.FC = () => {
  const highlightsActive = useExamStore((s) => s.highlightsActive);
  const highlightColor = useExamStore((s) => s.highlightColor);
  const highlightUnderline = useExamStore((s) => s.highlightUnderline);
  const addHighlight = useExamStore((s) => s.addHighlight);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [cursor, setCursor] = useState<CursorState>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    document.body.classList.toggle('bb-highlights-mode', highlightsActive);
    if (!highlightsActive) {
      setToolbar(null);
      setCursor((current) => ({ ...current, visible: false }));
    }

    return () => document.body.classList.remove('bb-highlights-mode');
  }, [highlightsActive]);

  useEffect(() => {
    if (!highlightsActive) return;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const selectable = target?.closest('[data-bb-highlight-area]');
      setCursor({
        visible: !!selectable,
        x: event.clientX + 11,
        y: event.clientY + 13,
      });
    };

    const handleMouseLeave = () => {
      setCursor((current) => ({ ...current, visible: false }));
    };

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const selectedText = selection.toString().replace(/\s+/g, ' ').trim();
      if (!selectedText) return;

      const range = selection.getRangeAt(0);
      const startElement = getElementFromNode(range.startContainer);
      const endElement = getElementFromNode(range.endContainer);
      const startArea = startElement?.closest('[data-bb-highlight-area]') as HTMLElement | null;
      const endArea = endElement?.closest('[data-bb-highlight-area]') as HTMLElement | null;

      if (!startArea || !endArea || startArea !== endArea) return;

      const questionId = startArea.dataset.questionId;
      const areaId = startArea.dataset.areaId;
      if (!questionId || !areaId) return;

      const rect = range.getBoundingClientRect();
      const highlightId = addHighlight({
        questionId,
        areaId,
        text: selectedText,
        color: highlightColor,
        underline: highlightUnderline,
      });

      setToolbar({
        highlightId,
        x: Math.max(12, rect.left + rect.width / 2),
        y: Math.max(80, rect.top - 18),
      });

      selection.removeAllRanges();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [addHighlight, highlightColor, highlightUnderline, highlightsActive]);

  return (
    <>
      {cursor.visible && (
        <div className="bb-highlight-cursor" style={{ left: cursor.x, top: cursor.y }}>
          <Highlighter size={18} />
        </div>
      )}
      {toolbar && (
        <HighlightToolbar
          highlightId={toolbar.highlightId}
          x={toolbar.x}
          y={toolbar.y}
          onClose={() => setToolbar(null)}
        />
      )}
    </>
  );
};

function getElementFromNode(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}
