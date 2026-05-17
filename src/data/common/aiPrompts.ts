/**
 * AI Conversion Prompts
 * 
 * These prompts are given to the user to paste into an LLM (ChatGPT, Claude, etc.)
 * along with their exam PDF/images. The LLM converts the questions into the JSON
 * format expected by the Bluebook Simulator.
 * 
 * See ai_prompts.md in the project root for the full documentation.
 */

export const AI_PROMPTS: Record<string, string> = {
  calc_ab: `You are an expert AP Calculus data processor. I will provide you with images or text from an AP Calculus AB practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:

1. Numbering: Number questions sequentially starting from 1 (ignore the original numbers on the page).
2. Math Formatting: All math equations, variables, and numbers must be wrapped in double dollar signs $$ for KaTeX rendering (e.g., $$f(x) = x^2$$, $$\\int_0^5 2x dx$$).
3. Graphs: If the question has a simple 2D function graph (e.g., a parabola), use "type": "function-plot" and provide the equation. If the question has a complex visual (like a slope field, solid of revolution, or a shaded area under a curve), use "type": "image" and set the data to a descriptive filename (e.g., "q5_slope_field.png").
4. Image Handling: If a question contains a diagram or complex graph that cannot be perfectly replicated using plain text, KaTeX, or Mermaid.js, set the stimulus type to "image" and invent a descriptive, unique filename for the data field (e.g., "calc_q4_slope_field.png").
5. FRQ Rules: If you encounter a Free Response Question, treat the main scenario/graph as the "stimulus". Treat each sub-part (Part A, Part B, Part C) as entries in a "parts" array. Set "questionType" to "frq" instead of providing "options".
6. Output Format:
{
  "id": "1",
  "stimulus": { "type": "text", "data": "Optional setup text or equation" },
  "text": "What is the derivative of $$y = \\sin(x)$$?",
  "options": [
    { "id": "A", "text": "$$\\cos(x)$$" },
    { "id": "B", "text": "$$-\\cos(x)$$" },
    { "id": "C", "text": "$$\\sin(x)$$" },
    { "id": "D", "text": "$$-\\sin(x)$$" }
  ],
  "correctAnswer": "A"
}

Output ONLY the JSON array. Do not include any conversational text.`,

  bio: `You are an expert AP Biology data processor. I will provide you with images or text from an AP Biology practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:

1. Numbering: Number questions sequentially starting from 1 (ignore the original numbers on the page).
2. Pathways & Flowcharts: If the question contains a biological pathway, food web, or logic flowchart, convert it into Mermaid.js syntax and use "type": "mermaid".
3. Anatomical Diagrams: If the question contains an organic/anatomical image (e.g., a picture of a cell, an animal, a gel electrophoresis result), YOU MUST use "type": "image" and assign a descriptive filename (e.g., "q12_chloroplast.png"). Do NOT try to draw it with text.
4. Tables: If the stimulus is a table (like a trait presence/absence table), use "type": "table" and provide a JSON stringified object with \`headers\` and \`rows\`. Example: \`"data": "{\\"headers\\":[\\"Species\\",\\"Trait 1\\"],\\"rows\\":[[\\"V\\",\\"+\\"]]}"\`.
5. Complex Options (Graphs/Cladograms): If the answer choices themselves are cladograms, phylogenetic trees, or line graphs (like relative amount vs time), use Mermaid.js! Add \`"type": "mermaid"\` to the option object and put the mermaid syntax in the \`text\` field (e.g., use \`graph TD\` for cladograms or \`xychart-beta\` for line graphs).
6. FRQ Rules: If you encounter a Free Response Question, treat the main scenario/graph as the "stimulus". Treat each sub-part (Part A, Part B, Part C) as entries in a "parts" array. Set "questionType" to "frq" instead of providing "options".
7. Output Format:
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
