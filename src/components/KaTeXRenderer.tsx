import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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
          return display ? (
            <BlockMath key={i} math={math} />
          ) : (
            <InlineMath key={i} math={math} />
          );
        }
        // Render non-math as HTML to support <em>, <strong>, etc.
        return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </>
  );
};
