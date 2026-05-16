# Bluebook Simulator: AI Conversion Prompts

This document contains the prompt templates and guidelines you will feed into an LLM (like ChatGPT or Claude) to convert physical exam PDFs/images into the exact JSON format required by the Bluebook Simulator.

---

## 1. Universal Rules (Apply to All Prompts)
No matter what subject you are converting, the AI must follow these strict rules:

1. **Sequential Numbering:** Completely ignore the question numbers written on the physical exam pages (e.g., if you paste a new section that starts at #1, do not restart your numbering). Number all questions sequentially from `1` to `N` based on the order they are provided.
2. **Strict JSON:** Output *only* valid JSON. Do not include introductory text like "Here is the JSON."
3. **Image Handling (Crucial):** If a question contains a diagram, anatomical drawing, or complex graph that *cannot* be perfectly replicated using plain text, KaTeX, or Mermaid.js:
   * Set the stimulus type to `"image"`.
   * Invent a descriptive, unique filename for the `data` field (e.g., `"data": "calc_q4_slope_field.png"`). 
   * The Bluebook Simulator will read this and prompt the user to manually screenshot and drop this image into the app.

---

## 2. AP Calculus AB Prompt

**Copy and paste this into the LLM before providing your Calculus exam images/text:**

> You are an expert AP Calculus data processor. I will provide you with images or text from an AP Calculus AB practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:
> 
> 1. **Numbering:** Number questions sequentially starting from 1 (ignore the original numbers on the page).
> 2. **Math Formatting:** All math equations, variables, and numbers must be wrapped in double dollar signs `$$` for KaTeX rendering (e.g., `$$f(x) = x^2$$`, `$$\int_0^5 2x dx$$`).
> 3. **Graphs:** If the question has a simple 2D function graph (e.g., a parabola), use `"type": "function-plot"` and provide the equation. If the question has a complex visual (like a slope field, solid of revolution, or a shaded area under a curve), use `"type": "image"` and set the data to a descriptive filename (e.g., `"q5_slope_field.png"`).
> 4. **Output Format:**
> ```json
> {
>   "id": "1",
>   "stimulus": { "type": "text", "data": "Optional setup text or equation" },
>   "text": "What is the derivative of $$y = \sin(x)$$?",
>   "options": [
>     { "id": "A", "text": "$$\cos(x)$$" },
>     { "id": "B", "text": "$$-\cos(x)$$" },
>     { "id": "C", "text": "$$\sin(x)$$" },
>     { "id": "D", "text": "$$-\sin(x)$$" }
>   ],
>   "correctAnswer": "A"
> }
> ```
> Output ONLY the JSON array. Do not include any conversational text.

---

## 3. AP Biology Prompt

**Copy and paste this into the LLM before providing your Biology exam images/text:**

> You are an expert AP Biology data processor. I will provide you with images or text from an AP Biology practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:
> 
> 1. **Numbering:** Number questions sequentially starting from 1 (ignore the original numbers on the page).
> 2. **Pathways & Flowcharts:** If the question contains a biological pathway, food web, or logic flowchart, convert it into Mermaid.js syntax and use `"type": "mermaid"`.
> 3. **Anatomical Diagrams:** If the question contains an organic/anatomical image (e.g., a picture of a cell, an animal, a gel electrophoresis result), YOU MUST use `"type": "image"` and assign a descriptive filename (e.g., `"q12_chloroplast.png"`). Do NOT try to draw it with text.
> 4. **Output Format:**
> ```json
> {
>   "id": "1",
>   "stimulus": { "type": "mermaid", "data": "graph TD;\n A[DNA] --> B[RNA];" },
>   "text": "Based on the flowchart above, what is the next step?",
>   "options": [
>     { "id": "A", "text": "Translation to Protein" },
>     { "id": "B", "text": "Replication" },
>     { "id": "C", "text": "Mutation" },
>     { "id": "D", "text": "Apoptosis" }
>   ],
>   "correctAnswer": "A"
> }
> ```
> Output ONLY the JSON array. Do not include any conversational text.

---

## 4. FRQ (Free Response Question) Guidelines

FRQs for subjects like Calculus and Chemistry require a different structure than Multiple Choice. Instead of `options`, FRQs usually have multiple sub-parts (A, B, C, D) and require an open text/math input area.

**Add this instruction to your prompt when processing an FRQ section:**

> **FRQ Rules:** You are processing a Free Response Question. 
> 1. Treat the main scenario/graph as the `"stimulus"`.
> 2. Treat each sub-part (Part A, Part B, Part C) as a separate JSON object, but keep the same stimulus.
> 3. Instead of an `"options"` array, use `"type": "frq"`.
> 4. For AP Chemistry, format chemical formulas using standard KaTeX subscript/superscript (e.g., `$$\text{H}_2\text{O}$$` or `$$\text{Cu}^{2+}$$`).
> 
> **Example FRQ Output:**
> ```json
> {
>   "id": "1",
>   "part": "A",
>   "stimulus": { "type": "image", "data": "chem_q1_titration_curve.png" },
>   "text": "Based on the titration curve above, what is the pKa of the weak acid?",
>   "type": "frq",
>   "correctAnswer": "The pKa is approximately 4.8, which corresponds to the pH at the half-equivalence point."
> }
> ```
