/**
 * Text formatting and KaTeX delimiter utilities.
 * Handles markdown formatting (*italics*, **bold**) and math delimiters ($$...$$, $...$, \(...\), \[...\]).
 */

export const MATH_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\.|[^$\n\\])+?(?<!\s)\$)/g;

/**
 * Converts markdown bold and italic formatting into HTML tags (<strong>, <em>).
 * Preserves math and existing HTML tags.
 */
export function formatMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Bold + Italic: ***text***
    .replace(/(?<!\*)\*\*\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*\*\*(?!\*)/g, '<strong><em>$1</em></strong>')
    // Bold: **text**
    .replace(/(?<!\*)\*\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*\*(?!\*)/g, '<strong>$1</strong>')
    // Italic: *text* (e.g. *Thermus aquaticus*)
    .replace(/(?<!\*)\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*(?!\*)/g, '<em>$1</em>')
    // Bold: __text__
    .replace(/(?<!_)__(?!\s|_)([^_]+?)(?<!\s|_)__(?!_)/g, '<strong>$1</strong>')
    // Italic: _text_ (isolated by word boundaries)
    .replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
}
