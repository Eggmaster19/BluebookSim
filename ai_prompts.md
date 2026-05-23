# Bluebook Simulator: AI Conversion Prompts

This document contains the prompt templates and guidelines you will feed into an LLM (like ChatGPT, Claude, or Google AI Studio) to convert physical exam PDFs/images into the exact JSON format required by the Bluebook Simulator.

---

## 1. Supported Stimulus Types (Rendering Priority)

The simulator supports **six** programmatic rendering types plus image as a fallback. When converting questions, the AI should use the **first type that fits** — `image` is always the **last resort**.

| Priority | Type | Best For | Data Format |
|----------|------|----------|-------------|
| 1 | `katex` | Pure math display (piecewise, systems) | Raw LaTeX string (no `$$` wrapper) |
| 2 | `function-plot` | Simple 2D function graphs | JSON: `{"fn": "x^2", "xDomain": [-5, 5]}` |
| 3 | `mermaid` | Flowcharts, trees, cladograms, sign charts, xy-charts | Mermaid.js syntax string |
| 4 | `table` | Data tables, value tables | JSON: `{"headers": [...], "rows": [[...]]}` |
| 5 | `svg` | Custom labeled diagrams, coordinate planes | Raw SVG markup string |
| 6 | `image` | Photographs, slope fields, shaded regions | Descriptive filename (e.g., `"original_q76_graph.png"`) |

### Data Format Examples

**function-plot:**
```json
{ "type": "function-plot", "data": "{\"fn\": \"x^2 - 4\", \"xDomain\": [-5, 5], \"yDomain\": [-5, 10]}" }
```

**mermaid (flowchart):**
```json
{ "type": "mermaid", "data": "graph TD;\n A[DNA] --> B[RNA];\n B --> C[Protein];" }
```

**mermaid (line chart):**
```json
{ "type": "mermaid", "data": "xychart-beta\n  title \"Enzyme Activity\"\n  x-axis [20, 25, 30, 35, 40, 45]\n  y-axis \"Rate\" 0 --> 100\n  line [10, 30, 65, 90, 45, 15]" }
```

**table:**
```json
{ "type": "table", "data": "{\"headers\":[\"$$x$$\",\"$$0$$\",\"$$1$$\",\"$$2$$\"],\"rows\":[[\"$$f(x)$$\",\"$$3$$\",\"$$5$$\",\"$$7$$\"]]}" }
```

**svg:**
```json
{ "type": "svg", "data": "<svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"100\" cy=\"100\" r=\"80\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/><text x=\"100\" y=\"105\" text-anchor=\"middle\" font-size=\"14\">Cell</text></svg>" }
```

---

## 2. Universal Rules (Apply to All Prompts)

No matter what subject you are converting, the AI must follow these strict rules:

1. **Sequential Numbering:** Completely ignore the question numbers written on the physical exam pages. Number all questions sequentially from `1` to `N` based on the order they are provided.
2. **Required Section Label:** Every question object MUST include a `"section"` field. The simulator uses this label to assign official timing, calculator type, breaks, directions, and FRQ mode. AP Calculus uses `"1A"`, `"1B"`, `"2A"`, `"2B"`; the other current AP exams use `"1"` for multiple choice and `"2"` for free response.
3. **Strict JSON:** Output *only* valid JSON. Do not include introductory text like "Here is the JSON."
4. **Minimize Image Usage:** Always prefer programmatic types (`katex`, `function-plot`, `mermaid`, `table`, `svg`) over `image`. Only use `image` for content that is truly impossible to replicate (photographs, slope fields, shaded regions, anatomical drawings).
5. **Image Filenames:** When `image` is unavoidable, the filename MUST include the **ORIGINAL** question number from the PDF (e.g., `"original_q76_graph.png"`) so the user can find and screenshot it.
6. **Complex Answer Options:** MCQ options can also have a `"type"` field (e.g., `"type": "mermaid"`) with diagram syntax in the `"text"` field.
7. **FRQ Parts:** Each FRQ sub-part can have its own `"stimulus"` or `"type"` field if it contains a diagram specific to that part.

---

## 3. AP Calculus AB Prompt

**Copy and paste this into the LLM before providing your Calculus exam images/text:**

> You are an expert AP Calculus data processor. I will provide you with images or text from an AP Calculus AB practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:
> 
> 1. **Numbering:** Number questions sequentially starting from 1.
> 2. **Section Tagging:** Every question MUST include `"section"`. Use `"1A"` for Section I Part A no-calculator MCQ, `"1B"` for Section I Part B graphing-calculator MCQ, `"2A"` for Section II Part A graphing-calculator FRQ, and `"2B"` for Section II Part B no-calculator FRQ.
> 3. **Math Formatting:** All math must be wrapped in `$$` for KaTeX rendering.
> 4. **RENDERING PRIORITY** (use the FIRST type that fits — avoid "image" whenever possible):
>    - `"katex"` — piecewise functions, systems of equations. Raw LaTeX in `data`.
>    - `"function-plot"` — simple 2D graphs. JSON in `data`: `{"fn": "x^2", "xDomain": [-5, 5]}`
>    - `"table"` — value tables. JSON in `data`: `{"headers": [...], "rows": [...]}`
>    - `"mermaid"` — sign charts, number lines, flowcharts. Mermaid.js syntax.
>    - `"svg"` — custom coordinate diagrams. Raw SVG markup.
>    - `"image"` — LAST RESORT. Filename must include original question number.
> 5. **FRQ Rules:** Use `"questionType": "frq"` with `"parts"` array. Parts can have `"stimulus"` or `"type"`.
> 6. **Output Format:**
> ```json
> {
>   "id": "1",
>   "section": "1A",
>   "stimulus": { "type": "function-plot", "data": "{\"fn\": \"x^2 - 4\", \"xDomain\": [-4, 4]}" },
>   "text": "The graph of $$f$$ is shown above. At what value of $$x$$ does $$f$$ have a local minimum?",
>   "options": [
>     { "id": "A", "text": "$$-2$$" },
>     { "id": "B", "text": "$$0$$" },
>     { "id": "C", "text": "$$2$$" },
>     { "id": "D", "text": "$$4$$" }
>   ],
>   "correctAnswer": "B"
> }
> ```
> Output ONLY the JSON array.

---

## 4. AP Biology Prompt

**Copy and paste this into the LLM before providing your Biology exam images/text:**

> You are an expert AP Biology data processor. I will provide you with images or text from an AP Biology practice exam. Your job is to convert them into a strict JSON array of question objects following these rules:
> 
> 1. **Numbering:** Number questions sequentially starting from 1.
> 2. **RENDERING PRIORITY** (use the FIRST type that fits — avoid "image" whenever possible):
>    - `"mermaid"` — pathways, food webs, cladograms, phylogenetic trees (`graph TD`), line graphs (`xychart-beta`).
>    - `"table"` — data tables, trait matrices. JSON: `{"headers": [...], "rows": [...]}`
>    - `"svg"` — labeled diagrams needing precise positioning.
>    - `"image"` — LAST RESORT. Photographs, microscopy, gel results only. Filename must include original question number.
> 3. **Complex Options:** If answer choices are cladograms or graphs, add `"type": "mermaid"` to the option.
> 4. **FRQ Rules:** Use `"questionType": "frq"` with `"parts"` array. Parts can have `"stimulus"` or `"type"`.
> 5. **Output Format:**
> ```json
> {
>   "id": "1",
>   "section": "1",
>   "stimulus": { "type": "mermaid", "data": "graph TD;\n A[DNA] --> B[RNA];" },
>   "text": "Based on the flowchart above, what is the next step?",
>   "options": [
>     { "id": "A", "text": "Translation to Protein" },
>     { "id": "B", "type": "mermaid", "text": "graph TD;\n C-->D;" }
>   ],
>   "correctAnswer": "A"
> }
> ```
> Output ONLY the JSON array.

---

## 5. FRQ (Free Response Question) Guidelines

FRQs for subjects like Calculus and Biology require a different structure than Multiple Choice. Instead of `options`, FRQs have multiple sub-parts (A, B, C, D).

**Add this instruction to your prompt when processing an FRQ section:**

> **FRQ Rules:** You are processing a Free Response Question. 
> 1. Treat the main scenario/graph as the `"stimulus"`.
> 2. Treat each sub-part (Part A, Part B, Part C) as entries in a `"parts"` array.
> 3. Set `"questionType"` to `"frq"` instead of providing `"options"`.
> 4. Each part can have its own `"stimulus"` or `"type"` field if it contains a diagram.
> 
> **Example FRQ Output:**
> ```json
> {
>   "id": "1",
>   "section": "2",
>   "questionType": "frq",
>   "stimulus": { "type": "table", "data": "{\"headers\":[\"$$t$$\",\"$$0$$\",\"$$2$$\",\"$$4$$\"],\"rows\":[[\"$$R(t)$$\",\"$$2935$$\",\"$$3653$$\",\"$$3442$$\"]]}" },
>   "text": "The rate at which vehicles cross a bridge is modeled by $$R(t)$$.",
>   "parts": [
>     { "partLabel": "A", "text": "Approximate $$R'(3)$$ using the average rate of change." },
>     { "partLabel": "B", "text": "Use a midpoint sum to approximate $$\\int_0^4 R(t) dt$$." }
>   ]
> }
> ```
