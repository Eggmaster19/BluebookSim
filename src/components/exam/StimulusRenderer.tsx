import React from 'react';
import type { Stimulus } from '../../types/ExamSchema';
import { KaTeXRenderer } from '../KaTeXRenderer';
import { BlockMath } from 'react-katex';
import { MermaidRenderer } from '../MermaidRenderer';
import { FunctionPlotRenderer } from '../FunctionPlotRenderer';
import { SVGRenderer } from '../SVGRenderer';

interface StimulusRendererProps {
  stimulus: Stimulus;
  introText?: string;
}

export const StimulusRenderer: React.FC<StimulusRendererProps> = ({ stimulus, introText }) => {
  return (
    <div className="bb-stimulus">
      {introText && (
        <div className="bb-stimulus__intro">
          <KaTeXRenderer text={introText} />
        </div>
      )}
      {renderStimulus(stimulus)}
    </div>
  );
};

export function renderStimulus(stimulus: Stimulus) {
  switch (stimulus.type) {
    case 'text':
      return (
        <div className="bb-stimulus__intro">
          <KaTeXRenderer text={stimulus.data as string} />
        </div>
      );

    case 'katex':
      return (
        <div className="bb-stimulus__katex">
          <BlockMath math={stimulus.data as string} />
        </div>
      );

    case 'table':
      return renderTable(stimulus.data);

    case 'mermaid':
      return <MermaidRenderer chart={stimulus.data as string} />;

    case 'function-plot':
      return <FunctionPlotRenderer data={stimulus.data} />;

    case 'svg':
      return <SVGRenderer data={stimulus.data as string} />;

    case 'image':
      return (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <img
            src={stimulus.data as string}
            alt="Question diagram"
            style={{ maxWidth: '100%', maxHeight: '300px' }}
          />
        </div>
      );

    default:
      return (
        <div className="bb-stimulus__intro">
          <KaTeXRenderer text={stimulus.data as string} />
        </div>
      );
  }
}

function renderTable(data: string | Record<string, unknown>) {
  try {
    const tableData = typeof data === 'string' ? JSON.parse(data) : data;
    const { headers, rows } = tableData as {
      headers: string[];
      rows: string[][];
    };
    return (
      <table className="bb-stimulus__table">
        <thead>
          <tr>
            {headers.map((h: string, i: number) => (
              <th key={i}>
                <KaTeXRenderer text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: string[], ri: number) => (
            <tr key={ri}>
              {row.map((cell: string, ci: number) => (
                <td key={ci}>
                  <KaTeXRenderer text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  } catch {
    return <p>Error rendering table</p>;
  }
}
