import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SVGRendererProps {
  data: string; // Raw SVG markup string
}

/**
 * Renders raw SVG markup safely using DOMPurify sanitization.
 * Useful for custom diagrams that neither Mermaid nor function-plot can express
 * (e.g., labeled coordinate planes, circuit diagrams, custom scientific figures).
 */
export const SVGRenderer: React.FC<SVGRendererProps> = ({ data }) => {
  const sanitizedSvg = useMemo(() => {
    if (!data) return '';

    // Configure DOMPurify to allow SVG elements and attributes
    const clean = DOMPurify.sanitize(data, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use', 'defs', 'pattern', 'marker', 'clipPath', 'mask', 'linearGradient', 'radialGradient', 'stop', 'foreignObject'],
      ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'transform', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'font-size', 'font-family', 'text-anchor', 'dominant-baseline', 'dx', 'dy', 'offset', 'stop-color', 'stop-opacity', 'marker-start', 'marker-mid', 'marker-end', 'gradientUnits', 'patternUnits'],
    });

    return clean;
  }, [data]);

  if (!sanitizedSvg) {
    return <div className="bb-svg bb-svg--error">Error: No SVG data provided</div>;
  }

  // Check that the sanitized output still contains an SVG element
  if (!sanitizedSvg.includes('<svg')) {
    return <div className="bb-svg bb-svg--error">Error: Invalid SVG markup</div>;
  }

  return (
    <div
      className="bb-svg"
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  );
};
