import type { Exam } from '../../types/ExamSchema';
import { generateDirections } from '../common/directionsTemplate';

export const calculusABExam: Exam = {
  metadata: {
    title: 'AP Calculus AB Practice',
    examType: 'AP',
    subject: 'Calculus AB',
  },
  sections: [
    {
      id: 'section-1a',
      title: 'Section I, Part A - No Calculator Allowed',
      calculatorAllowed: false,
      timeMinutes: 60,
      directions: generateDirections({
        subject: 'Calculus AB',
        sectionTitle: 'Section I, Part A',
        questionCount: 30,
        timeMinutes: 60,
        calculatorPolicy: 'none',
        isFRQ: false,
      }),
      questions: [
        {
          id: 'q1',
          questionType: 'mcq',
          text: 'Which of the following is the limit?  $$\\lim_{x \\to 0} \\frac{1 - \\cos^2(2x)}{(2x)^2} = $$',
          options: [
            { id: 'A', text: '$$0$$' },
            { id: 'B', text: '$$\\frac{1}{4}$$' },
            { id: 'C', text: '$$\\frac{1}{2}$$' },
            { id: 'D', text: '$$1$$' },
          ],
          correctAnswer: 'D',
        },
        {
          id: 'q2',
          questionType: 'mcq',
          stimulus: {
            type: 'katex',
            data: 'f(x) = \\begin{cases} \\frac{2}{x} & \\text{for } x < -1 \\\\ x^2 - 3 & \\text{for } -1 \\le x \\le 2 \\\\ 4x - 3 & \\text{for } x > 2 \\end{cases}',
          },
          text: 'Let $$f$$ be the function defined as shown. At what values of $$x$$, if any, is $$f$$ not differentiable?',
          options: [
            { id: 'A', text: '$$x = -1$$ only' },
            { id: 'B', text: '$$x = 2$$ only' },
            { id: 'C', text: '$$x = -1$$ and $$x = 2$$' },
            { id: 'D', text: '$$f$$ is differentiable for all values of $$x$$.' },
          ],
          correctAnswer: 'C',
        },
        {
          id: 'q3',
          questionType: 'mcq',
          text: 'If $$f(x) = 3x^3 - 2x^2 + x - 5$$, what is $$f\'(1)$$?',
          options: [
            { id: 'A', text: '$$-3$$' },
            { id: 'B', text: '$$2$$' },
            { id: 'C', text: '$$6$$' },
            { id: 'D', text: '$$8$$' },
          ],
          correctAnswer: 'C',
        },
        {
          id: 'q4',
          questionType: 'mcq',
          text: 'What is the derivative of $$y = \\sin(x) \\cdot \\cos(x)$$?',
          options: [
            { id: 'A', text: '$$\\cos^2(x) - \\sin^2(x)$$' },
            { id: 'B', text: '$$2\\sin(x)\\cos(x)$$' },
            { id: 'C', text: '$$-\\sin^2(x) + \\cos^2(x)$$' },
            { id: 'D', text: '$$\\cos(2x)$$' },
          ],
          correctAnswer: 'D',
        },
        {
          id: 'q5',
          questionType: 'mcq',
          text: 'The function $$g$$ is given by $$g(x) = x^4 - 4x^3 + 6$$. On which of the following intervals is $$g$$ concave down?',
          options: [
            { id: 'A', text: '$$(0, 2)$$' },
            { id: 'B', text: '$$(2, \\infty)$$' },
            { id: 'C', text: '$$(-\\infty, 0)$$' },
            { id: 'D', text: '$$(0, 3)$$' },
          ],
          correctAnswer: 'A',
        },
        {
          id: 'q6',
          questionType: 'mcq',
          text: '$$\\int_0^4 (3x^2 + 2x) \\, dx = $$',
          options: [
            { id: 'A', text: '$$72$$' },
            { id: 'B', text: '$$80$$' },
            { id: 'C', text: '$$64$$' },
            { id: 'D', text: '$$96$$' },
          ],
          correctAnswer: 'B',
        },
        {
          id: 'q7',
          questionType: 'mcq',
          text: 'Which of the following is equivalent to the definite integral $$\\int_2^8 \\sqrt{x} \\, dx$$?',
          options: [
            { id: 'A', text: '$$\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\frac{6}{n} \\sqrt{\\frac{4k}{n}}$$' },
            { id: 'B', text: '$$\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\frac{6}{n} \\sqrt{\\frac{6k}{n}}$$' },
            { id: 'C', text: '$$\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\frac{6}{n} \\sqrt{2 + \\frac{4k}{n}}$$' },
            { id: 'D', text: '$$\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\frac{6}{n} \\sqrt{2 + \\frac{6k}{n}}$$' },
          ],
          correctAnswer: 'D',
        },
      ],
    },
    {
      id: 'section-1b',
      title: 'Section I, Part B - Calculator Required',
      calculatorAllowed: true,
      timeMinutes: 45,
      directions: generateDirections({
        subject: 'Calculus AB',
        sectionTitle: 'Section I, Part B',
        questionCount: 15,
        timeMinutes: 45,
        calculatorPolicy: 'required',
        isFRQ: false,
      }),
      questions: [
        {
          id: 'q8',
          questionType: 'mcq',
          stimulus: {
            type: 'table',
            data: JSON.stringify({
              headers: ['$$x$$', '$$-1$$', '$$0$$', '$$2$$', '$$4$$', '$$5$$'],
              rows: [['$$f\'(x)$$', '$$11$$', '$$9$$', '$$8$$', '$$5$$', '$$2$$']],
            }),
          },
          text: 'Let $$f$$ be a twice-differentiable function. Values of $$f\'$$, the derivative of $$f$$, at selected values of $$x$$ are given in the table. Which of the following statements must be true?',
          options: [
            { id: 'A', text: '$$f$$ is increasing for $$-1 \\le x \\le 5$$.' },
            { id: 'B', text: 'The graph of $$f$$ is concave down for $$-1 < x < 5$$.' },
            { id: 'C', text: "There exists $$c$$, where $$-1 < c < 5$$, such that $$f'(c) = -\\frac{3}{2}$$." },
            { id: 'D', text: "There exists $$c$$, where $$-1 < c < 5$$, such that $$f''(c) = -\\frac{3}{2}$$." },
          ],
          correctAnswer: 'D',
        },
        {
          id: 'q9',
          questionType: 'mcq',
          text: 'If $$\\frac{dy}{dx} = 2xy$$ and $$y(0) = 3$$, then $$y = $$',
          options: [
            { id: 'A', text: '$$3e^{x^2}$$' },
            { id: 'B', text: '$$3e^{2x}$$' },
            { id: 'C', text: '$$e^{x^2} + 2$$' },
            { id: 'D', text: '$$x^2 + 3$$' },
          ],
          correctAnswer: 'A',
        },
        {
          id: 'q10',
          questionType: 'mcq',
          text: 'The area of the region enclosed by the graphs of $$y = x$$ and $$y = x^2 - 2$$ is',
          options: [
            { id: 'A', text: '$$\\frac{9}{2}$$' },
            { id: 'B', text: '$$\\frac{7}{6}$$' },
            { id: 'C', text: '$$\\frac{27}{6}$$' },
            { id: 'D', text: '$$\\frac{15}{2}$$' },
          ],
          correctAnswer: 'A',
        },
        {
          id: 'q11',
          questionType: 'mcq',
          text: 'The position of a particle moving along the $$x$$-axis is given by $$x(t) = t^3 - 6t^2 + 9t + 1$$ for $$t \\ge 0$$. At what time $$t$$ does the particle change direction?',
          options: [
            { id: 'A', text: '$$t = 1$$ only' },
            { id: 'B', text: '$$t = 3$$ only' },
            { id: 'C', text: '$$t = 1$$ and $$t = 3$$' },
            { id: 'D', text: '$$t = 2$$' },
          ],
          correctAnswer: 'C',
        },
      ],
    },
    {
      id: 'section-2a',
      title: 'Section II, Part A - Calculator Required',
      calculatorAllowed: true,
      timeMinutes: 30,
      directions: generateDirections({
        subject: 'Calculus AB',
        sectionTitle: 'Section II, Part A',
        questionCount: 2,
        timeMinutes: 30,
        calculatorPolicy: 'required',
        isFRQ: true,
      }),
      questions: [
        {
          id: 'q12',
          questionType: 'frq',
          stimulus: {
            type: 'table',
            data: JSON.stringify({
              headers: ['$$t$$ (hours)', '$$0$$', '$$2$$', '$$4$$', '$$6$$', '$$8$$', '$$10$$', '$$12$$'],
              rows: [['$$R(t)$$ (vehicles per hour)', '$$2935$$', '$$3653$$', '$$3442$$', '$$3010$$', '$$3604$$', '$$1986$$', '$$2201$$']],
            }),
          },
          text: 'On a certain weekday, the rate at which vehicles cross a bridge is modeled by the differentiable function $$R$$ for $$0 \\le t \\le 12$$, where $$R(t)$$ is measured in vehicles per hour and $$t$$ is the number of hours since 7:00 a.m. $$(t = 0)$$. Values of $$R(t)$$ for selected values of $$t$$ are given in the table.',
          parts: [
            {
              partLabel: 'A',
              text: "Approximate $$R'(5)$$ using the average rate of change of $$R$$ over the interval $$4 \\le t \\le 6$$. Show the computations that lead to your answer. Using correct units, explain the meaning of $$R'(5)$$ in the context of the problem.",
            },
            {
              partLabel: 'B',
              text: 'Use a midpoint sum with three subintervals of equal length indicated by the data in the table to approximate the value of $$\\int_0^{12} R(t) \\, dt$$. Indicate units of measure.',
            },
            {
              partLabel: 'C',
              text: 'On a certain weekend day, the rate at which vehicles cross the bridge is modeled by the function $$H$$ defined by $$H(t) = -t^3 - 3t^2 + 288t + 1300$$ for $$0 \\le t \\le 17$$, where $$H(t)$$ is measured in vehicles per hour and $$t$$ is the number of hours since 7:00 a.m. $$(t = 0)$$. According to this model, what is the average number of vehicles crossing the bridge per hour on the weekend day for $$0 \\le t \\le 12$$?',
            },
            {
              partLabel: 'D',
              text: 'For $$12 < t < 17$$, $$L(t)$$, the local linear approximation to the function $$H$$ given in part C at $$t = 12$$, is a better model for the rate at which vehicles cross the bridge on the weekend day. Use $$L(t)$$ to find the time $$t$$, for $$12 < t < 17$$, at which the rate of vehicles crossing the bridge is 2000 vehicles per hour. Show the work that leads to your answer.',
            },
          ],
        },
      ],
    },
    {
      id: 'section-2b',
      title: 'Section II, Part B - No Calculator Allowed',
      calculatorAllowed: false,
      timeMinutes: 60,
      directions: generateDirections({
        subject: 'Calculus AB',
        sectionTitle: 'Section II, Part B',
        questionCount: 4,
        timeMinutes: 60,
        calculatorPolicy: 'none',
        isFRQ: true,
      }),
      questions: [
        {
          id: 'q13',
          questionType: 'frq',
          text: 'Let $$f$$ be a continuous function defined on the interval $$[0, 4]$$ with $$f(2) = 5$$. The graph of $$f\'$$ is shown.',
          parts: [
            {
              partLabel: 'A',
              text: 'On what open intervals contained in $$(0, 4)$$ is the graph of $$f$$ both decreasing and concave down? Give a reason for your answer.',
            },
            {
              partLabel: 'B',
              text: 'Find the absolute minimum value of $$f$$ on the interval $$[0, 4]$$. Justify your answer.',
            },
            {
              partLabel: 'C',
              text: "Evaluate $$\\int_0^4 f(x) f'(x) \\, dx$$.",
            },
            {
              partLabel: 'D',
              text: "The function $$g$$ is defined by $$g(x) = x^3 f(x)$$. Find $$g'(2)$$. Show the work that leads to your answer.",
            },
          ],
        },
      ],
    },
  ],
};
