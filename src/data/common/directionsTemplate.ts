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
 * Shared direction generator for AP Calculus exams (Calculus AB & Calculus BC).
 */
function generateCalculusDirections(subject: string, options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;

  let calculatorText: string;
  if (calculatorPolicy === 'none') {
    calculatorText = '<p><strong>No calculator is allowed for this part of the exam.</strong></p>';
  } else if (calculatorPolicy === 'required') {
    if (isFRQ) {
      calculatorText = '<p><strong>A graphing calculator is required for the questions on this part of the exam.</strong> You may use a handheld graphing calculator or the calculator available in this application. <strong>Make sure your calculator is in radian mode.</strong></p>';
    } else {
      calculatorText = '<p><strong>A graphing calculator is required for some questions on this part of the exam.</strong> You may use a handheld calculator or the calculator available in this application. <strong>Make sure your calculator is in radian mode.</strong></p>';
    }
  } else {
    calculatorText = '<p><strong>A calculator is allowed for this part of the exam.</strong></p>';
  }

  let instructionsText: string;
  if (isFRQ) {
    instructionsText = `
<p>You may use the available paper for scratch work and planning, but only work written in the free-response booklet will be scored. Any work done on scratch paper will not be scored. In the free-response booklet, write your solution to each part of each question in the space provided for that part. For questions that have sub-parts, be sure to label those clearly in your solution. Use a pencil or a pen with black or dark blue ink.</p>`;

    if (calculatorPolicy === 'required') {
      instructionsText += `\n<p>You are permitted to use your calculator to solve an equation, find the derivative of a function at a point, or calculate the value of a definite integral. However, you must clearly indicate the setup of your question, namely the equation, function, or integral you are using. If you use other built-in features or programs, you must show the mathematical steps necessary to produce your results.</p>`;
    }

    instructionsText += `
<p>Show all of your work, even though a question may not explicitly remind you to do so. Clearly label any functions, graphs, tables, or other objects that you use. Justifications require that you give mathematical reasons and that you verify the needed conditions under which relevant theorems, properties, definitions, or tests are applied. Your work will be scored on the correctness and completeness of your methods as well as your answers. Answers without supporting work will usually not receive credit.</p>
<p>Your work must be expressed in standard mathematical notation rather than calculator syntax. For example, &#8747;<sub>1</sub><sup>5</sup> <em>x</em><sup>2</sup> <em>dx</em> may not be written as fnInt(X<sup>2</sup>, X, 1, 5).</p>
<p>Unless otherwise specified, answers (numeric or algebraic) need not be simplified. If you use decimal approximations in calculations, your work will be scored on accuracy. Unless otherwise specified, your final answers should be accurate to three places after the decimal point.</p>
<p>Unless otherwise specified, the domain of a function <em>f</em> is assumed to be the set of all real numbers <em>x</em> for which <em>f(x)</em> is a real number.</p>`;
  } else {
    instructionsText = `
<p>Solve each problem. You may use the available paper for scratch work. After examining the choices, select the best of the choices given.</p>`;

    if (calculatorPolicy === 'required') {
      instructionsText += `\n<p>The exact numerical value of the correct answer does not always appear among the choices given. When this happens, select from among the choices the number that best approximates the exact numerical value.</p>`;
    }

    instructionsText += `\n<p>Unless otherwise specified, the domain of a function <em>f</em> is assumed to be the set of all real numbers <em>x</em> for which <em>f(x)</em> is a real number.</p>
<p>The inverse of a trigonometric function <em>f</em> may be indicated using the inverse function notation <em>f</em><sup>-1</sup> or with the prefix "arc" (e.g., sin<sup>-1</sup> <em>x</em> = arcsin <em>x</em>).</p>`;
  }

  const timeDisplay = timeMinutes === 60 ? '1 hour' : 
                      timeMinutes > 60 && timeMinutes % 60 === 0 ? `${timeMinutes / 60} hours` :
                      `${timeMinutes} minutes`;

  const shortSectionTitle = sectionTitle.split(' — ')[0].split(' - ')[0];

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day${!isFRQ ? ' and has fewer multiple-choice questions than the exam' : ''}.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${shortSectionTitle} has ${questionCount} ${isFRQ ? 'free-response' : 'multiple-choice'} questions and lasts ${timeDisplay}.</p>
${calculatorText}
${instructionsText}
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
}

/**
 * Registry of exam-specific direction generators.
 * If an exam type has an entry here, it will be used instead of the
 * generic fallback. Each generator receives the same DirectionOptions.
 */

/* ─── Additional Subject Direction Generators ───────────────────────── */

function generateHistoryDirections(subject: string, options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, isFRQ } = options;
  const timeDisplay = timeMinutes >= 60
    ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
    : `${timeMinutes} minutes`;

  if (isFRQ) {
    const isDBQ = sectionTitle.includes('Document-Based') || sectionTitle.includes('2A');
    const isLEQ = sectionTitle.includes('Long Essay') || sectionTitle.includes('2B');
    const isSAQ = sectionTitle.includes('Short Answer') || sectionTitle.includes('1B');

    let specificGuidance = '<p>Write your responses directly into the text editor. Your work will be saved automatically as you type.</p>';
    if (isDBQ) {
      specificGuidance = '<p><strong>Document-Based Question:</strong> Suggested reading and planning time is 15 minutes. Spend approximately 45 minutes writing your response. Analyze the provided primary sources and construct a coherent historical argument supported by documentary and outside historical evidence.</p>';
    } else if (isLEQ) {
      specificGuidance = '<p><strong>Long Essay Question:</strong> Spend approximately 40 minutes writing your response. Formulate a defensible thesis, analyze historical causality, continuity/change, or comparison, and support your argument with specific historical evidence.</p>';
    } else if (isSAQ) {
      specificGuidance = '<p><strong>Short-Answer Questions:</strong> Respond to all parts of each prompt. Answers must be written in complete sentences; bullet points or outline fragments will not receive credit.</p>';
    }

    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview represents the functionality you will encounter on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} free-response prompt${questionCount === 1 ? '' : 's'} and lasts ${timeDisplay}.</p>
<p><strong>Calculators are NOT permitted for this section.</strong></p>
${specificGuidance}
<p>You may use scratch paper for notes and outlining, but credit will only be awarded for responses typed into this application.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  }

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} multiple-choice questions and lasts ${timeDisplay}.</p>
<p>Questions in this section are presented in stimulus sets anchored to primary documents, historical interpretations, maps, charts, or images. Choose the single best answer for each question.</p>
<p><strong>Calculators are NOT permitted on this exam.</strong></p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
}

function generatePhysicsAlgebraDirections(subject: string, options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, isFRQ } = options;
  const timeDisplay = timeMinutes >= 60
    ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
    : `${timeMinutes} minutes`;

  if (isFRQ) {
    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow represent what you will see on exam day for the Hybrid Digital administration.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} questions and lasts ${timeDisplay}.</p>
<div style="border: 2px solid #ffcc00; padding: 12px; margin: 12px 0; border-radius: 4px; background: rgba(255, 204, 0, 0.1);">
  <p style="margin: 0;"><strong>HYBRID DIGITAL NOTICE:</strong> Questions are displayed on screen in this application, but <strong>all answers, derivations, diagrams, and mathematical work must be handwritten in your paper free-response exam booklet</strong>. Work typed on screen or written on scratch paper will NOT be scored.</p>
</div>
<p>A calculator is allowed in this section. You may use an approved handheld calculator or the built-in Desmos calculator available in this application. The AP Physics equation tables are accessible throughout this section.</p>
<p>Show all your work clearly. Label parts (e.g., A, B, C) and indicate units for all numerical results.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain.</p>`;
  }

  return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day.</strong></p>
<p style="text-align:center">${subject}</p>
<p>${sectionTitle} has ${questionCount} multiple-choice questions and lasts ${timeDisplay}.</p>
<p>All questions are single-select items with four answer choices (A–D). Select the best answer for each question.</p>
<p>A calculator is allowed. Handheld calculators and the built-in Desmos calculator are permitted. Equation tables are accessible on screen.</p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain.</p>`;
}

function generatePrecalcDirections(options: DirectionOptions): string {
  const { sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;
  const timeDisplay = timeMinutes >= 60
    ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
    : `${timeMinutes} minutes`;

  if (isFRQ) {
    const calcNotice = calculatorPolicy === 'required'
      ? '<p><strong>A graphing calculator is REQUIRED for Part A.</strong> You may use an approved handheld calculator or the built-in Desmos graphing calculator.</p>'
      : '<p><strong>NO calculator is allowed for Part B.</strong> You may continue working on Part A questions during this time, but without calculator assistance.</p>';

    return `<h1>${sectionTitle} Directions</h1>
<p style="text-align:center">AP Precalculus</p>
<p>${sectionTitle} has ${questionCount} questions and lasts ${timeDisplay}.</p>
<div style="border: 2px solid #ffcc00; padding: 12px; margin: 12px 0; border-radius: 4px; background: rgba(255, 204, 0, 0.1);">
  <p style="margin: 0;"><strong>HYBRID DIGITAL NOTICE:</strong> Questions are displayed digitally on screen, but <strong>all mathematical work and solutions must be handwritten in your paper free-response booklet</strong>.</p>
</div>
${calcNotice}
<p>The AP Precalculus formula and reference sheet is available throughout the exam.</p>
<p>You can go back and forth between questions in this section until time expires.</p>`;
  }

  const calcNotice = calculatorPolicy === 'required'
    ? '<p><strong>A graphing calculator is REQUIRED for Part B.</strong></p>'
    : '<p><strong>NO calculator is allowed for Part A.</strong></p>';

  return `<h1>${sectionTitle} Directions</h1>
<p style="text-align:center">AP Precalculus</p>
<p>${sectionTitle} has ${questionCount} multiple-choice questions and lasts ${timeDisplay}.</p>
${calcNotice}
<p>The AP Precalculus reference sheet is accessible on screen. Select the best answer from the four choices given.</p>
<p>You can go back and forth between questions in this section until time expires.</p>`;
}

const EXAM_DIRECTIONS: Record<string, (options: DirectionOptions) => string> = {
  /* ── History Exams ──────────────────────────────────────────────── */
  us_hist: (options) => generateHistoryDirections('AP United States History', options),
  euro_hist: (options) => generateHistoryDirections('AP European History', options),
  world_hist: (options) => generateHistoryDirections('AP World History: Modern', options),

  /* ── Government & Social Sciences ────────────────────────────────── */
  us_gov: (options) => generateGenericDirections(options),
  comp_gov: (options) => generateGenericDirections(options),
  human_geo: (options) => generateGenericDirections(options),
  african_am_studies: (options) => generateGenericDirections(options),
  psych: (options) => generateGenericDirections(options),

  /* ── STEM & Sciences ──────────────────────────────────────────────── */
  phys_1: (options) => generatePhysicsAlgebraDirections('AP Physics 1: Algebra-Based', options),
  phys_2: (options) => generatePhysicsAlgebraDirections('AP Physics 2: Algebra-Based', options),
  env_sci: (options) => generateGenericDirections(options),
  stats: (options) => generateGenericDirections(options),
  precalc: (options) => generatePrecalcDirections(options),

  /* ── Computer Science ────────────────────────────────────────────── */
  csa: (options) => generateGenericDirections(options),
  csp: (options) => generateGenericDirections(options),

  /* ── English Language ────────────────────────────────────────────── */
  lang: (options) => generateGenericDirections(options),

  /* ── Career Kickstart ────────────────────────────────────────────── */
  business_finance: (options) => generateGenericDirections(options),
  cybersecurity: (options) => generateGenericDirections(options),

  /* ── Arts ────────────────────────────────────────────────────────── */
  art_hist: (options) => generateGenericDirections(options),


  /* ── AP Physics C: Mechanics ─────────────────────────────────────── */
  phys_mech: (options) => generatePhysicsCDirections('Physics C: Mechanics', options),

  /* ── AP Physics C: Electricity and Magnetism ─────────────────────── */
  phys_em: (options) => generatePhysicsCDirections('Physics C: Electricity and Magnetism', options),

  /* ── AP Macroeconomics ───────────────────────────────────────────── */
  econ_macro: (options) => generateEconDirections('Macroeconomics', options),

  /* ── AP Microeconomics ───────────────────────────────────────────── */
  econ_micro: (options) => generateEconDirections('Microeconomics', options),

  /* ── AP Calculus ─────────────────────────────────────────────────── */
  calc: (options) => generateCalculusDirections('Calculus', options),
  calc_ab: (options) => generateCalculusDirections('Calculus AB', options),
  calc_bc: (options) => generateCalculusDirections('Calculus BC', options),

  /* ── AP Biology ─────────────────────────────────────────────────── */
  bio: (options) => {
    const { subject, sectionTitle, questionCount, timeMinutes, calculatorPolicy, isFRQ } = options;

    let calculatorText: string;
    if (calculatorPolicy === 'none') {
      calculatorText = '<p><strong>A calculator is not allowed for this part of the exam.</strong></p>';
    } else if (calculatorPolicy === 'required') {
      calculatorText = '<p><strong>A calculator is required for some questions on this part of the exam.</strong></p>';
    } else {
      calculatorText = '<p><strong>A four-function calculator is allowed for this part of the exam.</strong></p>';
    }

    let instructionsText: string;
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

  /* ARCHIVED: Foreign Language (German)
  german: (options) => {
    const { sectionTitle, questionCount, timeMinutes, isFRQ } = options;

    const timeDisplay = timeMinutes >= 60
      ? `${Math.floor(timeMinutes / 60)} hour${Math.floor(timeMinutes / 60) > 1 ? 's' : ''}${timeMinutes % 60 > 0 ? ` and ${timeMinutes % 60} minutes` : ''}`
      : `${timeMinutes} minutes`;

    if (isFRQ) {
      return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day.</strong></p>
<p style="text-align:center">AP German Language and Culture</p>
<p>${sectionTitle} has ${questionCount} free-response tasks and lasts ${timeDisplay}.</p>
<p>This section of the exam consists of speaking and writing tasks. You will be evaluated on your language control, range, and accuracy, and how well you communicate ideas and cultural understanding in German.</p>
<p><strong>Speaking Tasks (Questions 1–2):</strong> You will record your spoken responses within the time allotted. You cannot replay your recordings after submission. Make sure your microphone is ready before beginning a speaking task.</p>
<p><strong>Writing Tasks (Questions 3–4):</strong> Your responses will be saved automatically as you type. You may go back and edit your written responses at any time during this section.</p>
<p><em>Note: On exam day, speaking responses are recorded and submitted digitally. Written responses are entered directly in the exam application.</em></p>
<p>You can go back and forth between questions in this section until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
    }

    return `<h1>${sectionTitle} Directions</h1>
<p><strong>The directions that follow are what you will see on exam day. This untimed preview is intended to represent the different question types and functionality you will encounter on exam day and has fewer questions than the exam.</strong></p>
<p style="text-align:center">AP German Language and Culture</p>
<p>${sectionTitle} has ${questionCount} multiple-choice questions and lasts ${timeDisplay}.</p>
<p>This section includes both listening and reading questions. For <strong>listening questions</strong>, an audio recording will play automatically. You may replay the recording a limited number of times as indicated. For <strong>reading questions</strong>, a printed source will appear on screen.</p>
<p>For each question, choose the best answer from the four choices given.</p>
<p>You can go back and forth between questions in this part until time expires. The clock will turn red when 5 minutes remain—<strong>the proctor will not give you any time updates or warnings.</strong></p>`;
  },
  */
};

// Aliases
EXAM_DIRECTIONS['apush'] = EXAM_DIRECTIONS['us_hist'];
EXAM_DIRECTIONS['ap_ush'] = EXAM_DIRECTIONS['us_hist'];
EXAM_DIRECTIONS['ush'] = EXAM_DIRECTIONS['us_hist'];
EXAM_DIRECTIONS['euro'] = EXAM_DIRECTIONS['euro_hist'];
EXAM_DIRECTIONS['ap_euro'] = EXAM_DIRECTIONS['euro_hist'];
EXAM_DIRECTIONS['world_'] = EXAM_DIRECTIONS['world_hist'];
EXAM_DIRECTIONS['world'] = EXAM_DIRECTIONS['world_hist'];
EXAM_DIRECTIONS['ap_world'] = EXAM_DIRECTIONS['world_hist'];
EXAM_DIRECTIONS['gov'] = EXAM_DIRECTIONS['us_gov'];
EXAM_DIRECTIONS['hug'] = EXAM_DIRECTIONS['human_geo'];
EXAM_DIRECTIONS['aas'] = EXAM_DIRECTIONS['african_am_studies'];
EXAM_DIRECTIONS['macro'] = EXAM_DIRECTIONS['econ_macro'];
EXAM_DIRECTIONS['micro'] = EXAM_DIRECTIONS['econ_micro'];
EXAM_DIRECTIONS['mech'] = EXAM_DIRECTIONS['phys_mech'];
EXAM_DIRECTIONS['em'] = EXAM_DIRECTIONS['phys_em'];
EXAM_DIRECTIONS['apes'] = EXAM_DIRECTIONS['env_sci'];
EXAM_DIRECTIONS['physics_1'] = EXAM_DIRECTIONS['phys_1'];
EXAM_DIRECTIONS['physics_2'] = EXAM_DIRECTIONS['phys_2'];
EXAM_DIRECTIONS['cs_a'] = EXAM_DIRECTIONS['csa'];
EXAM_DIRECTIONS['compsci_a'] = EXAM_DIRECTIONS['csa'];
EXAM_DIRECTIONS['cs_principles'] = EXAM_DIRECTIONS['csp'];
EXAM_DIRECTIONS['compsci_principles'] = EXAM_DIRECTIONS['csp'];
EXAM_DIRECTIONS['english_lang'] = EXAM_DIRECTIONS['lang'];
EXAM_DIRECTIONS['business'] = EXAM_DIRECTIONS['business_finance'];
EXAM_DIRECTIONS['cyber'] = EXAM_DIRECTIONS['cybersecurity'];
EXAM_DIRECTIONS['arthistory'] = EXAM_DIRECTIONS['art_hist'];

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

  let calculatorText: string;
  if (calculatorPolicy === 'none') {
    calculatorText = '<p><strong>A calculator is not allowed for this part of the exam.</strong></p>';
  } else if (calculatorPolicy === 'required') {
    calculatorText = '<p><strong>A graphing calculator is required for some questions on this part of the exam.</strong></p>';
  } else {
    calculatorText = '<p><strong>A calculator is allowed for this part of the exam.</strong></p>';
  }

  let instructionsText: string;
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
