import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MATH_REGEX, formatMarkdown } from '../utils/textFormatting';

interface KaTeXRendererProps {
  text: string;
  display?: boolean;
}

/**
 * Renders text containing LaTeX math ($$...$$, $...$, \(...\), \[...\]) as KaTeX.
 * Non-math content is rendered with HTML and markdown formatting (*italics*, **bold**).
 */
export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ text, display = false }) => {
  if (!text) return null;

  const parts = text.split(MATH_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        const isDoubleDollar = part.startsWith('$$') && part.endsWith('$$') && part.length >= 4;
        const isBracket = part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4;
        const isParen = part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4;
        const isSingleDollar = part.startsWith('$') && part.endsWith('$') && part.length >= 2 && !isDoubleDollar;

        if (isDoubleDollar || isBracket || isParen || isSingleDollar) {
          const isDisplay = isDoubleDollar || isBracket || display;
          let math: string;
          if (isDoubleDollar || isBracket || isParen) {
            math = part.slice(2, -2);
          } else {
            math = part.slice(1, -1);
          }

          let html: string;
          try {
            html = katex.renderToString(math, {
              displayMode: isDisplay,
              throwOnError: false, // Prevents crashing, renders raw string + error color
              errorColor: '#cc0000',
            });
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Math rendering error';
            html = `<span class="katex-error" style="color: #cc0000;" title="${message}">${math}</span>`;
          }

          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }

        // Render non-math as HTML with markdown formatting (*italics*, **bold**)
        const formatted = formatMarkdown(part);
        return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </>
  );
};
