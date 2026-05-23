import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXRendererProps {
  text: string;
  display?: boolean;
}

/**
 * Renders text containing $$...$$ delimiters as KaTeX math.
 * Anything outside $$ is rendered as plain text/HTML.
 */
export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ text, display = false }) => {
  if (!text) return null;

  // Split on $$...$$ patterns
  const parts = text.split(/(\$\$[^$]+\$\$)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          let html = '';
          try {
            html = katex.renderToString(math, {
              displayMode: display,
              throwOnError: false, // Prevents crashing, renders raw string + error color
              errorColor: '#cc0000',
            });
          } catch (e: any) {
            html = `<span class="katex-error" style="color: #cc0000;" title="${e?.message || 'Math rendering error'}">${math}</span>`;
          }
          
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        // Render non-math as HTML to support <em>, <strong>, etc.
        return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </>
  );
};
