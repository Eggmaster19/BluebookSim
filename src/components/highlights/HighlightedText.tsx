import React, { useMemo } from 'react';
import katex from 'katex';
import { useExamStore } from '../../store/examStore';
import type { HighlightNote } from '../../types/ExamSchema';

interface HighlightedTextProps {
  text: string;
  questionId: string;
  areaId: string;
  className?: string;
  displayMath?: boolean;
}

const colorVars = {
  yellow: 'var(--bb-highlight-yellow)',
  blue: 'var(--bb-highlight-blue)',
  pink: 'var(--bb-highlight-pink)',
};

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  questionId,
  areaId,
  className,
  displayMath = false,
}) => {
  const highlights = useExamStore((s) =>
    s.highlights.filter((highlight) => highlight.questionId === questionId && highlight.areaId === areaId)
  );

  const content = useMemo(
    () => renderMixedText(text, highlights, displayMath),
    [text, highlights, displayMath]
  );

  return (
    <span
      className={className}
      data-bb-highlight-area
      data-question-id={questionId}
      data-area-id={areaId}
    >
      {content}
    </span>
  );
};

function renderMixedText(text: string, highlights: HighlightNote[], displayMath: boolean): React.ReactNode[] {
  const parts = text.split(/(\$\$[^$]+\$\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      let html = '';
      try {
        html = katex.renderToString(math, {
          displayMode: displayMath,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Math rendering error';
        html = `<span class="katex-error" style="color: #cc0000;" title="${escapeHtml(message)}">${escapeHtml(math)}</span>`;
      }

      return <span key={`math-${index}`} dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return <React.Fragment key={`text-${index}`}>{renderHtmlFragment(part, highlights, `part-${index}`)}</React.Fragment>;
  });
}

function renderHtmlFragment(html: string, highlights: HighlightNote[], keyPrefix: string): React.ReactNode {
  if (!html) return null;

  const template = document.createElement('template');
  template.innerHTML = html;

  return Array.from(template.content.childNodes).map((node, index) =>
    renderNode(node, highlights, `${keyPrefix}-${index}`)
  );
}

function renderNode(node: Node, highlights: HighlightNote[], key: string): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return renderHighlightedPlainText(node.textContent ?? '', highlights, key);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map((child, index) =>
    renderNode(child, highlights, `${key}-${index}`)
  );

  if (tagName === 'br') return <br key={key} />;
  if (tagName === 'em') return <em key={key}>{children}</em>;
  if (tagName === 'strong' || tagName === 'b') return <strong key={key}>{children}</strong>;
  if (tagName === 'sup') return <sup key={key}>{children}</sup>;
  if (tagName === 'sub') return <sub key={key}>{children}</sub>;
  if (tagName === 'p') return <p key={key}>{children}</p>;
  if (tagName === 'span') return <span key={key}>{children}</span>;

  return <span key={key}>{children}</span>;
}

function renderHighlightedPlainText(text: string, highlights: HighlightNote[], keyPrefix: string): React.ReactNode[] {
  if (!text || highlights.length === 0) return [text];

  const matches: Array<{ start: number; end: number; highlight: HighlightNote }> = [];

  for (const highlight of highlights) {
    const needle = highlight.text.trim();
    if (!needle) continue;

    let searchFrom = 0;
    while (searchFrom < text.length) {
      const start = text.indexOf(needle, searchFrom);
      if (start === -1) break;
      const end = start + needle.length;
      if (!matches.some((match) => start < match.end && end > match.start)) {
        matches.push({ start, end, highlight });
      }
      searchFrom = end;
    }
  }

  if (matches.length === 0) return [text];

  matches.sort((a, b) => a.start - b.start);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(text.slice(cursor, match.start));
    }

    nodes.push(
      <span
        key={`${keyPrefix}-highlight-${match.highlight.id}-${index}`}
        className={`bb-highlight bb-highlight--${match.highlight.color} bb-highlight--underline-${match.highlight.underline}`}
        data-highlight-id={match.highlight.id}
        style={{ backgroundColor: colorVars[match.highlight.color] }}
      >
        {text.slice(match.start, match.end)}
      </span>
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function escapeHtml(value: string): string {
  const span = document.createElement('span');
  span.textContent = value;
  return span.innerHTML;
}
