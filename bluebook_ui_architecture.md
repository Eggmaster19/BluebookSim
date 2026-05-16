# Bluebook Simulator: UI/UX Architecture Dissection

This document provides a thorough breakdown of the exact visual and structural components of the College Board Bluebook application, based on the provided reference screenshots. As more screenshots are provided, this document will be updated.

---

## 1. High-Level Screen Layout
The application features a strict, unscrollable, full-screen layout divided into three permanent horizontal layers, plus an optional warning banner.

1. **Header Bar (Fixed Top)**
2. **Warning Banner (Optional, below Header)**
3. **Main Stage (Scrollable Content Area)**
4. **Footer Bar (Fixed Bottom)**

---

## 2. Component Dissection

### A. The Header Bar
* **Background:** Very light gray or white.
* **Left Section:** 
  * Large, bold text for the current section (e.g., "Section I, Part A - No Calculator Allowed").
  * A "Directions \/" dropdown toggle directly beneath it.
* **Center Section:**
  * Bold, digital timer text (e.g., "0:00").
  * A small, pill-shaped "Hide" button underneath to collapse the timer.
* **Right Section:**
  * Icons for Battery %, Highlights & Notes, a Calculator (if permitted in the section), and a "More" (3 dots) menu. *(Note: Per requirements, functional implementation of these tools is ignored, but their visual placeholders should remain for authenticity).*

### B. The Warning Banner
* Found directly below the header.
* **Red Banner:** Light red background with black text. Displays warnings like "NO CALCULATOR ALLOWED" with a crossed-out calculator icon, and "THIS IS A TEST PREVIEW".
* **Blue Banner:** Dark blue background (e.g., `#1E2C6A`) with white text. Used for sections without calculator restrictions, displaying "THIS IS A TEST PREVIEW".

### C. The Main Stage (Question Area)
The main stage dynamically switches between two distinct layouts depending on the presence of a "Stimulus" (a passage, graph, or setup information).

1. **Single Pane Layout (Images 1, 4):**
   * Used when the question is standalone. 
   * Content is centered horizontally with plenty of white space on the sides.
2. **Split Pane Layout (Images 2, 3):**
   * Used when a question references a specific stimulus.
   * A thick gray vertical divider splits the screen precisely in half.
   * The divider has a small drag handle `[<|>]` in the exact vertical center, allowing the user to resize the panes.
   * **Focus State:** Active panes or split panes occasionally feature a thick yellow/gold border (`#FDBB30`) surrounding the content block.
   * **Left Pane:** Contains the Stimulus (text, piecewise functions, graphs).
   * **Right Pane:** Contains the actual Question and Answer Choices.

### D. The Question Block
The question block dynamically adjusts based on whether it is a Multiple Choice Question (MCQ) or a Free Response Question (FRQ):

#### 1. Multiple Choice Questions (MCQ)
* **The Question Header:**
  * **Question Number:** A solid black square with a white number inside.
  * **Mark for Review:** A flag icon next to the text "Mark for Review".
  * **Answer Eliminator Toggle:** A small blue icon with "ABC" crossed out.
  * **Divider:** A prominent dashed line (`-------`) spanning the width.
* **The Question Text:** Rendered directly below the dashed line.
* **The Answer Choices:**
  * Stacked vertically.
  * Each choice is a rounded rectangle with a thin gray border.
  * Inside the left edge is a circular badge with the letter (A, B, C, D).
  * To the right (outside the box) is the **Eliminator Button** (dashed circle, crossed-out letter).

#### 2. Free Response Questions (FRQ)
* **The Stimulus Notice:** In the left pane (above the stimulus), a bold notice appears: *"On exam day, you'll write your answer in the free-response booklet."*
* **The Question Header:** 
  * Same black square number and "Mark for Review" flag.
  * **NO Answer Eliminator Toggle** (the ABC icon is hidden).
  * The prominent dashed line remains.
* **The Question Body:** 
  * The question text is broken into multiple lettered parts (e.g., **Part A**, **Part B**, **Part C**), stacked vertically.
  * There are **no** answer selection boxes or input fields, as AP FRQs are solved on physical paper.

### E. The Footer Bar
* **Background:** Very light gray.
* **Top Border:** A dashed gray line spans the entire width of the screen.
* **Left Section:** User's full name (e.g., "Ben Baumgartner").
* **Center Section (Question Toggle):**
  * A dark pill-shaped button displaying the current progress (e.g., "Question 1 of 11 \/").
* **Right Section:**
  * Blue pill-shaped "Back" and "Next" navigation buttons. ("Back" is hidden on Question 1).

### F. The Navigation Modal (Selector at Bottom)
As seen in Image 5, clicking the center footer button opens a pop-up modal pointing down at the button.
* **Title:** "Section I, Part A - No Calculator Allowed Questions"
* **Legend (with icons):**
  * Map Pin icon = "Current"
  * Dashed outline box = "Unanswered"
  * Solid red flag = "For Review"
* **The Grid:**
  * A horizontal, wrapping grid of numbered boxes representing every question.
  * The current question has a map pin hovering above it.
  * Boxes are dashed if unanswered, and solid if answered.
* **Bottom Action:** A large button with a blue outline reading "Go to Review Page".

### G. Special Screens
1. **Directions Screen (Pre-Section):** 
   * A text-heavy page explaining the section rules (e.g., "Section I, Part B - Calculator Required Directions"). 
   * The footer replaces the navigation buttons with a solid yellow pill button: "Resume Testing" (black text).
2. **Check Your Work Screen:**
   * Appears at the end of a section. 
   * A large white card in the center of the screen displaying the same Question Grid found in the Navigation Modal. Allows users to see at a glance which questions are unanswered or flagged.
3. **Break Screen (Dark Mode):**
   * Completely dark theme (background approx `#1E1E1E`). 
   * **No Header Bar** and **No Footer Line** (though Battery % remains top right, and Name remains bottom left).
   * **Left Side:** A dark box with "Remaining Break Time:" and a large digital countdown. A yellow "Resume Testing" button is below it.
   * **Right Side:** Break rules text ("Do Not Close Your Device").

---

## 3. Design System / CSS Tokens (Draft)
* **Colors:**
  * Background: `#FFFFFF` (Main), `#1E1E1E` (Break Screen)
  * UI Bars (Header/Footer): `#F4F4F4` (Approximate light gray)
  * Primary Accent (Navigation Buttons): `#3053D2` (Approximate Bluebook Blue)
  * Secondary Accent (Resume Buttons/Focus Outline): `#FDBB30` (Yellow/Gold)
  * Warning Red Banner: `#FFC2C2`
  * Warning Blue Banner: `#1E2C6A`
  * Text: `#000000` (Main), `#555555` (Secondary), `#FFFFFF` (Dark mode / Blue banner)
  * Borders: Light gray (`#D3D3D3`) and dashed styles.
* **Typography:**
  * Clean, highly readable Sans-Serif (e.g., Inter, Roboto, or system default) for UI.
  * Serif/Math font (via KaTeX) for all equations and variables.
* **Borders:** Extensive use of dashed borders (under the question header, above the footer, and around unanswered question numbers).
