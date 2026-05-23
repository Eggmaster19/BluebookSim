import React from 'react';
import { renderToString } from 'react-dom/server';
import { InlineMath, BlockMath } from 'react-katex';

const text = "$$\\int \\frac{1}{t\\sqrt{t}} dt =$$";

const parts = text.split(/(\$\$[^$]+\$\$)/g);

const elements = parts.map((part, i) => {
  if (part.startsWith('$$') && part.endsWith('$$')) {
    const math = part.slice(2, -2);
    return <InlineMath key={i} math={math} />;
  }
  return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
});

console.log(renderToString(<>{elements}</>));
