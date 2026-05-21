export interface DirectionOptions {
  subject: string;
  sectionTitle: string;
  questionCount: number;
  timeMinutes: number;
  calculatorPolicy: 'none' | 'required' | 'allowed';
  isFRQ: boolean;
  /** Exam type key — used for exam-specific direction overrides */
  examType?: string;
}

/* ─── Exam-specific direction generators ────────────────────────── */

/**
 * Shared direction generator for AP Physics C exams (Mechanics & E&M).
 * Both exams share identical structure; only the subject name differs.
 */
function generatePhysicsCDirections(subject: string, options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, isFRQ } = options;

  const timeDisplay = timeMinutes >= 60
    ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
    : `${timeMinutes} minutes`;

  if (isFRQ) {
    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} questions and lasts ${timeDisplay}.</p>
<p>You may use the available paper for scratch work and planning, but only work written in the free response booklet will be scored. Any work done on scratch paper will not be scored. Label parts (e.g., A, B, C) and sub-parts (e.g., i, ii, iii) as needed. Use a pencil or a pen with black or dark blue ink to write your responses.</p>
<p>A calculator is allowed in this section, as well as a ruler and straightedge. You may use a handheld four function, scientific, or graphing calculator, or the calculator available in this application. Reference information, including lists of equations, can be used throughout the exam. A digital version is available in this application.</p>
<p>All final numerical answers should include appropriate units when applicable. Credit for your work depends on demonstrating that you know which physical principles to apply in a particular situation. Credit will be awarded only for work that is clearly designated as the solution to a specific part of a question. Credit also depends on the quality of your solutions and explanations. Therefore, you should show your work for each part in the space provided for that part. If you need more space, be sure to clearly indicate where you continue your work. When constructing a graph or diagram, use only one color of ink or pencil.</p>
<p>You may pace yourself as you answer the questions in this section, or you may use these optional timing recommendations:</p>
<p>It is suggested that you spend about 25 minutes each on Questions 1 and 3, about 30 minutes on Question 2, and about 20 minutes on Question 4.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  }

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer multiple-choice questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} multiple choice questions and lasts ${timeDisplay}.</p>
<p>Each of the questions or incomplete statements is followed by four suggested answers or completions. Select the one that is best in each case.</p>
<p>To simplify calculations, you may use <em>g</em> = 10 m/s<sup>2</sup> in all problems.</p>
<p>A calculator is allowed in this section, as well as a ruler and straightedge. You may use a handheld four-function, scientific, or graphing calculator, or the calculator available in this application.</p>
<p>Reference information, including lists of equations, can be used throughout the exam. A digital version is available in this application.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
}

/**
 * Shared direction generator for AP Economics exams (Macroeconomics & Microeconomics).
 * Both exams share identical structure; only the subject name differs.
 */
function generateEconDirections(subject: string, options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, isFRQ } = options;

  const timeDisplay = timeMinutes >= 60
    ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
    : `${timeMinutes} minutes`;

  if (isFRQ) {
    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} questions and lasts ${timeDisplay}.</p>
<p>You may use the available paper for scratch work and planning, but only work written in the free response booklet will be scored. Any work done on scratch paper will not be scored. Label parts (e.g., A, B, C) and sub-parts (e.g., i, ii, iii) as needed. Use a pencil or a pen with black or dark blue ink to write your responses.</p>
<p>Include correctly labeled graphs, if useful or required, in explaining your answers. A correctly labeled graph must have all axes and curves clearly labeled and must show directional changes. If the question prompts you to "Calculate," you must show how you arrived at your final answer.</p>
<p>A calculator is allowed in this section. You may use a handheld calculator that is approved for this exam or the calculator available in this application.</p>
<p>You may pace yourself as you answer the questions in this section, or you may use these optional timing recommendations:</p>
<p>It is suggested that you spend the first 10 minutes reading all of the questions and planning your answers. Then, it is suggested that you spend about 25 minutes on question 1 and about 12 minutes each on questions 2 and 3.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  }

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer multiple-choice questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} questions and lasts ${timeDisplay}.</p>
<p>Each of the questions or incomplete statements is followed by 5 suggested answers or completions. Select the one that is best in each case.</p>
<p>A calculator is allowed in this section. You may use a handheld calculator that is approved for this exam or the calculator available in this application.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
}

/**
 * Registry of exam-specific direction generators.
 * If an exam type has an entry here, it will be used instead of the
 * generic fallback. Each generator receives the same DirectionOptions.
 */
const EXAM_DIRECTIONS: Record<string, (options: DirectionOptions) => string> = {

  /* ── AP Physics C: Mechanics ─────────────────────────────────────── */
  phys_mech: (options) => generatePhysicsCDirections('Physics C: Mechanics', options),

  /* ── AP Physics C: Electricity and Magnetism ─────────────────────── */
  phys_em: (options) => generatePhysicsCDirections('Physics C: Electricity and Magnetism', options),

  /* ── AP Macroeconomics ───────────────────────────────────────────── */
  econ_macro: (options) => generateEconDirections('Macroeconomics', options),

  /* ── AP Microeconomics ───────────────────────────────────────────── */
  econ_micro: (options) => generateEconDirections('Microeconomics', options),

  /* ── AP Calculus AB ─────────────────────────────────────────────── */
  calc_ab: (options) => {
    const { subject, sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;

    let calculatorText = '';
    if (calculatorPolicy === 'none') {
      calculatorText = '<p><strong>A calculator is not allowed for this part of the exam.</strong></p>';
    } else if (calculatorPolicy === 'required') {
      calculatorText = '<p><strong>A graphing calculator is required for some questions on this part of the exam.</strong> You may use a handheld calculator or the calculator available in this application. <strong>Make sure your calculator is in the correct mode (e.g., radian mode for Calculus).</strong></p>';
    } else {
      calculatorText = '<p><strong>A calculator is allowed for this part of the exam.</strong></p>';
    }

    let instructionsText = '';
    if (isFRQ) {
      instructionsText = `
<p>You may use the available paper for scratch work and planning, but only work written in the free-response booklet will be scored. In the free-response booklet, write your solution to each part of each question in the space provided for that part. For questions that have sub-parts, be sure to label those clearly in your solution. Use a pencil or a pen with black or dark blue ink.</p>
<p>Show all of your work, even though a question may not explicitly remind you to do so. Clearly label any functions, graphs, tables, or other objects that you use. Justifications require that you give mathematical reasons and that you verify the needed conditions under which relevant theorems, properties, definitions, or tests are applied. Your work will be scored on the correctness and completeness of your methods as well as your answers. Answers without supporting work will usually not receive credit.</p>
<p>Your work must be expressed in standard mathematical notation rather than calculator syntax.</p>`;
    } else {
      instructionsText = `
<p>Solve each problem. You may use the available paper for scratch work. After examining the choices, select the best of the choices given.</p>
<p>The exact numerical value of the correct answer does not always appear among the choices given. When this happens, select from among the choices the number that best approximates the exact numerical value.</p>`;
    }

    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} ${isFRQ ? 'free-response' : 'multiple choice'} questions and lasts ${timeMinutes} minutes.</p>
${calculatorText}
${instructionsText}
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  },

  /* ── AP Biology ─────────────────────────────────────────────────── */
  bio: (options) => {
    const { subject, sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;

    let calculatorText = '';
    if (calculatorPolicy === 'none') {
      calculatorText = '<p><strong>A calculator is not allowed for this part of the exam.</strong></p>';
    } else if (calculatorPolicy === 'required') {
      calculatorText = '<p><strong>A calculator is required for some questions on this part of the exam.</strong></p>';
    } else {
      calculatorText = '<p><strong>A four-function calculator is allowed for this part of the exam.</strong></p>';
    }

    let instructionsText = '';
    if (isFRQ) {
      instructionsText = `
<p>Read each question carefully and completely. Write your response in the space provided for each question. Only material written in the space provided will be scored.</p>
<p>Answers must be written out in paragraph form. Outlines alone are not acceptable. You may plan your answers in this booklet, but no credit will be given for anything written in this booklet. You should spend approximately equal time on each question.</p>`;
    } else {
      instructionsText = `
<p>Read each question carefully and select the best answer from the choices provided. For each question, choose the one best answer unless the directions indicate otherwise.</p>`;
    }

    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} ${isFRQ ? 'free-response' : 'multiple choice'} questions and lasts ${timeMinutes} minutes.</p>
${calculatorText}
${instructionsText}
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  },

  /* ── AP English Literature ──────────────────────────────────────── */
  lit: (options) => {
    const { subject, sectionTitle, questionCount, timeMinutes, isFRQ } = options;

    if (isFRQ) {
      return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} free-response questions and lasts ${timeMinutes > 60 ? Math.floor(timeMinutes / 60) + ' hours' : timeMinutes + ' minutes'}.</p>
<p>This section of the exam requires answers in essay form. Each essay will be judged on its clarity and effectiveness in dealing with the assigned topic and on the quality of the writing. In responding to Question 3, select a work of fiction that will be appropriate to the question. Use a work that you are familiar with either from your AP English Literature and Composition class or from other literature you have previously read.</p>
<p>You may pace yourself as you answer the questions in this section, or you may use these optional timing recommendations:</p>
<p>It is suggested that you spend an equal amount of time, approximately 40 minutes, on each question.</p>
<p>You may use scratch paper for notes and planning, but credit will only be given for responses entered in this application. Text you enter as an annotation will <strong>not</strong> be included as part of your answer. You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
    }

    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} multiple choice questions and lasts ${timeMinutes} minutes.</p>
<p>Questions in this section are based on the content of the passages and poetry that accompany them. Read each passage or poem carefully before choosing the best answer to each question.</p>
<p>Some questions in this section ask about specific parts of a passage or poem, while other questions ask about the passage or poem as a whole.</p>
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  },
};

/* ─── Public API ─────────────────────────────────────────────────── */

export function generateDirections(options: DirectionOptions): string {
  const examType = options.examType;

  // Use exam-specific generator if available
  if (examType && EXAM_DIRECTIONS[examType]) {
    return EXAM_DIRECTIONS[examType](options);
  }

  // Generic fallback for unknown exam types (e.g. 'test')
  return generateGenericDirections(options);
}

/* ─── Generic Fallback ───────────────────────────────────────────── */

function generateGenericDirections(options: DirectionOptions): string {
  const { subject, sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;

  let calculatorText = '';
  if (calculatorPolicy === 'none') {
    calculatorText = '<p><strong>A calculator is not allowed for this part of the exam.</strong></p>';
  } else if (calculatorPolicy === 'required') {
    calculatorText = '<p><strong>A graphing calculator is required for some questions on this part of the exam.</strong></p>';
  } else {
    calculatorText = '<p><strong>A calculator is allowed for this part of the exam.</strong></p>';
  }

  let instructionsText = '';
  if (isFRQ) {
    instructionsText = `
<p>Write your response clearly. Show all of your work.</p>`;
  } else {
    instructionsText = `
<p>Select the best answer from the choices given.</p>`;
  }

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer questions than the exam.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} ${isFRQ ? 'free-response' : 'multiple choice'} questions and lasts ${timeMinutes} minutes.</p>
${calculatorText}
${instructionsText}
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
}
