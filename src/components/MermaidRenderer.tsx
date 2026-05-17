import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Initialize mermaid globally (safe to call multiple times)
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose', // Needed sometimes for certain diagrams, but loose is okay for local dev
      fontFamily: 'Inter, sans-serif'
    });

    let isMounted = true;

    const renderChart = async () => {
      try {
        setError(false);
        // Generate a unique ID for the mermaid element
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvg(svg);
        }
      } catch (e) {
        console.error('Mermaid render error:', e);
        if (isMounted) {
          setError(true);
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return <div className="bb-mermaid bb-mermaid--error">Error rendering diagram</div>;
  }

  return (
    <div 
      className="bb-mermaid" 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
