import React from 'react';
import type { Stimulus } from '../../types/ExamSchema';
import { KaTeXRenderer } from '../KaTeXRenderer';
import katex from 'katex';
import { MermaidRenderer } from '../MermaidRenderer';
import { FunctionPlotRenderer } from '../FunctionPlotRenderer';
import { SVGRenderer } from '../SVGRenderer';
import { HighlightedText } from '../highlights/HighlightedText';
import { AudioPlayer } from './AudioPlayer';
import { ImageStimulus } from './ImageStimulus';

interface StimulusRendererProps {
  stimulus: Stimulus;
  introText?: string;
  questionId?: string;
  areaId?: string;
}

interface HighlightContext {
  questionId: string;
  areaId: string;
}

export const StimulusRenderer: React.FC<StimulusRendererProps> = ({ stimulus, introText, questionId, areaId = 'stimulus' }) => {
  const context = questionId ? { questionId, areaId } : undefined;
  const showIntro = introText && (stimulus.type !== 'text' || stimulus.data !== introText);

  return (
    <div className="bb-stimulus">
      {showIntro && (
        <div className="bb-stimulus__intro">
          {context ? (
            <HighlightedText text={introText} questionId={context.questionId} areaId={`${context.areaId}-intro`} />
          ) : (
            <KaTeXRenderer text={introText} />
          )}
        </div>
      )}
      {renderStimulus(stimulus, context)}
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function renderStimulus(stimulus: Stimulus, context?: HighlightContext) {
  switch (stimulus.type) {
    case 'text':
      return (
        <div className="bb-stimulus__intro">
          {context ? (
            <HighlightedText text={stimulus.data as string} questionId={context.questionId} areaId={context.areaId} />
          ) : (
            <KaTeXRenderer text={stimulus.data as string} />
          )}
        </div>
      );

    case 'katex': {
      let html: string;
      try {
        html = katex.renderToString(stimulus.data as string, {
          displayMode: true,
          throwOnError: false,
          errorColor: '#cc0000'
        });
      } catch {
        html = `<span class="katex-error" style="color: #cc0000;">${stimulus.data}</span>`;
      }
      return (
        <div 
          className="bb-stimulus__katex" 
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      );
    }

    case 'table':
      return renderTable(stimulus.data as string | Record<string, unknown>);

    case 'audio':
      return <AudioPlayer src={stimulus.data as string} maxPlays={stimulus.maxPlays} />;

    case 'mermaid':
      return <MermaidRenderer chart={stimulus.data as string} />;

    case 'function-plot':
      return <FunctionPlotRenderer data={stimulus.data as string | Record<string, unknown>} />;

    case 'svg':
      return <SVGRenderer data={stimulus.data as string} />;

    case 'image': {
      const srcList = Array.isArray(stimulus.data)
        ? (stimulus.data as string[])
        : [stimulus.data as string];

      return (
        <div className="bb-stimulus__image-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {srcList.map((src, i) => {
            if (!src || src.startsWith('IMG_') || src.startsWith('IMAGE_')) {
              return (
                <div
                  key={i}
                  style={{
                    padding: '24px',
                    border: '2px dashed #444',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#aaa',
                    margin: '12px 0',
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#fff' }}>
                    🖼️ Figure Placeholder ({src || 'Image'})
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    No image was attached for this placeholder.
                  </div>
                </div>
              );
            }
            return <ImageStimulus key={i} src={src} />;
          })}
        </div>
      );
    }

    default:
      return (
        <div className="bb-stimulus__intro">
          {context ? (
            <HighlightedText text={stimulus.data as string} questionId={context.questionId} areaId={context.areaId} />
          ) : (
            <KaTeXRenderer text={stimulus.data as string} />
          )}
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
