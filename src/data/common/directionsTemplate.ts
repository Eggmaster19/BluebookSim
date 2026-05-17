export interface DirectionOptions {
  subject: string;
  sectionTitle: string;
  questionCount: number;
  timeMinutes: number;
  calculatorPolicy: 'none' | 'required' | 'allowed';
  isFRQ: boolean;
}

export function generateDirections(options: DirectionOptions): string {
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
}
