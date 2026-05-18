import React, { useEffect, useRef, useState } from 'react';

interface FunctionPlotConfig {
  fn: string;                // e.g. "x^2", "sin(x)"
  xDomain?: [number, number];
  yDomain?: [number, number];
  title?: string;
  grid?: boolean;
}

interface FunctionPlotRendererProps {
  data: string | Record<string, unknown>; // JSON string or object of FunctionPlotConfig
}

/**
 * Renders 2D function graphs using the function-plot library.
 * Accepts a JSON string with fields: fn, xDomain, yDomain, title, grid.
 * Example data: '{"fn": "x^2", "xDomain": [-5, 5], "yDomain": [-2, 10]}'
 */
export const FunctionPlotRenderer: React.FC<FunctionPlotRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!containerRef.current || !data) return;

    let isMounted = true;

    const renderPlot = async () => {
      try {
        setError('');

        // Dynamically import function-plot (it's a CommonJS module)
        const functionPlot = (await import('function-plot')).default;

        let config: FunctionPlotConfig | FunctionPlotConfig[];
        if (typeof data === 'string') {
          try {
            config = JSON.parse(data);
          } catch {
            throw new Error('Invalid function-plot JSON data');
          }
        } else {
          config = data as unknown as FunctionPlotConfig;
        }

        // Normalize to array
        const configs = Array.isArray(config) ? config : [config];

        if (configs.length === 0 || !configs[0].fn) {
          throw new Error('Missing "fn" field in function-plot data');
        }

        // Build function-plot data array
        const plotData = configs.map((c) => ({
          fn: c.fn,
          graphType: 'polyline' as const,
        }));

        // Determine domain
        const primary = configs[0];
        const xDomain = primary.xDomain ?? [-10, 10];
        const yDomain = primary.yDomain ?? undefined;

        if (!isMounted || !containerRef.current) return;

        // Clear previous render
        containerRef.current.innerHTML = '';

        functionPlot({
          target: containerRef.current,
          width: Math.min(containerRef.current.clientWidth, 500),
          height: 300,
          xAxis: { domain: xDomain },
          ...(yDomain ? { yAxis: { domain: yDomain } } : {}),
          grid: primary.grid !== false,
          title: primary.title,
          data: plotData,
        });
      } catch (e: any) {
        console.error('Function-plot render error:', e);
        if (isMounted) {
          setError(e.message || 'Error rendering function plot');
        }
      }
    };

    renderPlot();

    return () => {
      isMounted = false;
    };
  }, [data]);

  if (error) {
    return <div className="bb-function-plot bb-function-plot--error">Error: {error}</div>;
  }

  return (
    <div className="bb-function-plot" ref={containerRef} />
  );
};
