/**
 * AI Conversion Prompts
 * 
 * These prompts are given to the user to paste into an LLM (ChatGPT, Claude, etc.)
 * along with their exam PDF/images. The LLM converts the questions into the JSON
 * format expected by the Bluebook Simulator.
 * 
 * See ai_prompts.md in the project root for the full documentation.
 * 
 * SUPPORTED STIMULUS TYPES (in priority order — use the first that fits):
 *   katex          Pure math display (piecewise, systems of equations)
 *   function-plot  Simple 2D function graphs (parabola, sine, line)
 *   mermaid        Flowcharts, trees, cladograms, sign charts, xychart-beta
 *   table          Data tables with headers and rows
 *   svg            Custom diagrams with precise labeling (coordinate planes, circuits)
 *   image          LAST RESORT — photographs, slope fields, shaded regions
 */

export const AI_PROMPTS: Record<string, string> = {
  calc_ab: `You are an expert AP Calculus data processor. I will provide you with images or text from an AP Calculus AB practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:

1. Numbering: Number questions sequentially starting from 1 (ignore the original numbers on the page).
2. Math Formatting: All math equations, variables, and numbers must be wrapped in double dollar signs $$ for KaTeX rendering (e.g., $$f(x) = x^2$$, $$\\\\int_0^5 2x dx$$).
3. RENDERING PRIORITY — use the FIRST type that fits. Avoid "image" whenever possible:
   a. "katex" — for piecewise functions, systems of equations, or any pure math display. Put the raw LaTeX in "data" (no $$ wrapper). Example: "type": "katex", "data": "f(x) = \\\\begin{cases} x^2 & x \\\\ge 0 \\\\\\\\ -x & x < 0 \\\\end{cases}"
   b. "function-plot" — for any simple 2D function graph (parabola, sine wave, line). Put a JSON object string in "data" with fields: fn, xDomain, yDomain. Example: "type": "function-plot", "data": "{\\"fn\\": \\"x^2\\", \\"xDomain\\": [-5, 5], \\"yDomain\\": [-2, 10]}"
   c. "table" — for value tables (x vs f(x), velocity data, etc). Put a JSON-stringified object with "headers" and "rows" arrays. Example: "type": "table", "data": "{\\"headers\\":[\\"$$x$$\\",\\"$$0$$\\",\\"$$1$$\\",\\"$$2$$\\"],\\"rows\\":[[\\"$$f(x)$$\\",\\"$$3$$\\",\\"$$5$$\\",\\"$$7$$\\"]]}"
   d. "mermaid" — for sign charts, number lines, or flowcharts showing test logic. Use Mermaid.js graph syntax.
   e. "svg" — for custom coordinate plane diagrams or geometric figures that need precise labeling. Put raw SVG markup in "data".
   f. "image" — LAST RESORT. Only for slope fields, shaded regions, solids of revolution, or other visuals impossible to replicate programmatically. Set data to a descriptive filename that includes the ORIGINAL question number (e.g., "original_q76_slope_field.png").
4. FRQ Rules: If you encounter a Free Response Question, treat the main scenario/graph as the "stimulus". Treat each sub-part (Part A, Part B, Part C) as entries in a "parts" array. Set "questionType" to "frq" instead of providing "options". Each part can also have its own "stimulus" or "type" field if it contains a diagram.
5. Output Format:
{
  "id": "1",
  "stimulus": { "type": "function-plot", "data": "{\\"fn\\": \\"x^2 - 4\\", \\"xDomain\\": [-4, 4]}" },
  "text": "The graph of $$f$$ is shown above. At what value of $$x$$ does $$f$$ have a local minimum?",
  "options": [
    { "id": "A", "text": "$$-2$$" },
    { "id": "B", "text": "$$0$$" },
    { "id": "C", "text": "$$2$$" },
    { "id": "D", "text": "$$4$$" }
  ],
  "correctAnswer": "B"
}

Output ONLY the JSON array. Do not include any conversational text.`,

  bio: `You are an expert AP Biology data processor. I will provide you with images or text from an AP Biology practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:

1. Numbering: Number questions sequentially starting from 1 (ignore the original numbers on the page).
2. RENDERING PRIORITY — use the FIRST type that fits. Avoid "image" whenever possible:
   a. "mermaid" — for biological pathways, food webs, flowcharts, cladograms, and phylogenetic trees. Use Mermaid.js syntax (graph TD for trees, graph LR for pathways). For line graphs (e.g., enzyme activity vs temperature, population growth), use the xychart-beta type. Example cladogram: "graph TD; A[Common Ancestor] --> B[Species X]; A --> C; C --> D[Species Y]; C --> E[Species Z];" Example line graph: "xychart-beta\\n  title \\"Enzyme Activity\\"\\n  x-axis [20, 25, 30, 35, 40, 45]\\n  y-axis \\"Rate\\" 0 --> 100\\n  line [10, 30, 65, 90, 45, 15]"
   b. "table" — for data tables, trait presence/absence matrices, experimental results. Put a JSON-stringified object with "headers" and "rows". Example: "type": "table", "data": "{\\"headers\\":[\\"Species\\",\\"Trait 1\\",\\"Trait 2\\"],\\"rows\\":[[\\"V\\",\\"+\\",\\"-\\"],[\\"W\\",\\"+\\",\\"+\\"]]}"
   c. "svg" — for labeled diagrams that need precise positioning (e.g., a simple labeled cell membrane diagram). Put raw SVG markup in "data".
   d. "image" — LAST RESORT. Only for photographs, microscopy images, gel electrophoresis results, or anatomical drawings that are impossible to replicate programmatically. IMPORTANT: The filename MUST include the ORIGINAL question number from the PDF (e.g., "original_q76_chloroplast.png", NOT the new sequential number). Do NOT try to draw organic/photographic content with text.
3. Complex Answer Options: If the answer choices themselves are cladograms, phylogenetic trees, or line graphs, use Mermaid.js! Add "type": "mermaid" to the option object and put the mermaid syntax in the "text" field.
4. FRQ Rules: If you encounter a Free Response Question, treat the main scenario/graph as the "stimulus". Treat each sub-part (Part A, Part B, Part C) as entries in a "parts" array. Set "questionType" to "frq" instead of providing "options". Each part can also have its own "stimulus" or "type" field if it contains a diagram.
5. Output Format:
{
  "id": "1",
  "stimulus": { "type": "mermaid", "data": "graph TD;\\n A[DNA] --> B[RNA];" },
  "text": "Based on the flowchart above, what is the next step?",
  "options": [
    { "id": "A", "text": "Translation to Protein" },
    { "id": "B", "type": "mermaid", "text": "graph TD;\\n C-->D;" }
  ],
  "correctAnswer": "A"
}

Output ONLY the JSON array. Do not include any conversational text.`,
};
