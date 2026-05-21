import { create } from 'zustand';
import type { Exam, Question } from '../types/ExamSchema';

export type ExamPhase = 'preview' | 'directions' | 'exam' | 'check' | 'break' | 'done';

interface ExamState {
  // ── Exam Data ──
  exam: Exam | null;
  studentName: string;

  // ── JSON Input Flow ──
  selectedExamType: string | null;          // e.g. 'calc_ab', 'bio'
  imageBlobs: Record<string, string>;       // JSON filename -> Blob URL

  // ── Navigation ──
  currentSectionIndex: number;
  currentQuestionIndex: number;
  phase: ExamPhase;

  // ── Answers & Flags ──
  answers: Record<string, string>;          // questionId -> answerId
  flagged: Record<string, boolean>;         // questionId -> true
  eliminated: Record<string, string[]>;     // questionId -> [optionId, ...]
  timeSpent: Record<string, number>;        // questionId -> seconds spent
  essayResponses: Record<string, string>;   // questionId -> HTML essay content

  // ── Timer ──
  timerSeconds: number;
  timerRunning: boolean;
  breakDuration: number;    // Break countdown in seconds (set by nextSection)
  timerHidden: boolean;

  // ── Navigation Modal ──
  navModalOpen: boolean;

  // ── Answer Eliminator Mode ──
  eliminatorMode: boolean;

  // ── Actions ──
  selectExamType: (id: string) => void;
  setImageBlob: (filename: string, blobUrl: string) => void;
  removeImageBlob: (filename: string) => void;
  clearInputState: () => void;
  loadExam: (exam: Exam, studentName: string) => void;
  setPhase: (phase: ExamPhase) => void;
  updateSectionTime: (sectionIndex: number, timeMinutes: number) => void;
  startExamFromPreview: () => void;

  // Question Navigation
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  // Answer Management
  selectAnswer: (questionId: string, optionId: string) => void;
  setEssayResponse: (questionId: string, html: string) => void;
  toggleFlag: (questionId: string) => void;
  toggleEliminate: (questionId: string, optionId: string) => void;

  // Timer
  tickTimer: () => void;
  toggleTimerHidden: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tickBreak: () => void;
  getBreakDuration: () => number;

  // Section Navigation
  nextSection: () => void;

  // Nav Modal
  toggleNavModal: () => void;
  closeNavModal: () => void;

  // Eliminator Mode
  toggleEliminatorMode: () => void;

  // Helpers
  getCurrentSection: () => Exam['sections'][0] | null;
  getCurrentQuestion: () => Question | null;
  getSectionQuestionCount: () => number;
  getAnsweredCount: () => number;
  getFlaggedCount: () => number;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exam: null,
  studentName: 'Isaac Newton',
  selectedExamType: null,
  imageBlobs: {},
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  phase: 'directions',
  answers: {},
  flagged: {},
  eliminated: {},
  timeSpent: {},
  essayResponses: {},
  timerSeconds: 0,
  timerRunning: false,
  timerHidden: false,
  breakDuration: 0,
  navModalOpen: false,
  eliminatorMode: false,

  selectExamType: (id) => set({ selectedExamType: id }),

  setImageBlob: (filename, blobUrl) => {
    set({ imageBlobs: { ...get().imageBlobs, [filename]: blobUrl } });
  },

  removeImageBlob: (filename) => {
    const blobs = { ...get().imageBlobs };
    if (blobs[filename]) {
      URL.revokeObjectURL(blobs[filename]);
      delete blobs[filename];
    }
    set({ imageBlobs: blobs });
  },

  clearInputState: () => set({ selectedExamType: null, imageBlobs: {} }),

  loadExam: (exam, studentName) => {
    const firstSection = exam.sections[0];
    set({
      exam,
      studentName,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      phase: 'preview',
      answers: {},
      flagged: {},
      eliminated: {},
      timeSpent: {},
      essayResponses: {},
      timerSeconds: firstSection ? firstSection.timeMinutes * 60 : 0,
      timerRunning: false,
      timerHidden: false,
      breakDuration: 0,
      navModalOpen: false,
    });
  },

  setPhase: (phase) => set({ phase }),

  updateSectionTime: (sectionIndex, timeMinutes) => {
    const state = get();
    if (!state.exam) return;
    const newSections = [...state.exam.sections];
    if (newSections[sectionIndex]) {
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        timeMinutes,
      };
      set({ exam: { ...state.exam, sections: newSections } });
    }
  },

  startExamFromPreview: () => {
    const state = get();
    if (!state.exam) return;
    const firstSection = state.exam.sections[0];
    set({
      phase: 'directions',
      timerSeconds: firstSection ? firstSection.timeMinutes * 60 : 0,
    });
  },

  goToQuestion: (index) => {
    const section = get().getCurrentSection();
    if (section && index >= 0 && index < section.questions.length) {
      set({ currentQuestionIndex: index, navModalOpen: false });
    }
  },

  nextQuestion: () => {
    const state = get();
    const section = state.getCurrentSection();
    if (!section) return;
    if (state.currentQuestionIndex < section.questions.length - 1) {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
    } else {
      // Last question → go to Check Your Work
      set({ phase: 'check', timerRunning: false });
    }
  },

  prevQuestion: () => {
    const state = get();
    if (state.currentQuestionIndex > 0) {
      set({ currentQuestionIndex: state.currentQuestionIndex - 1 });
    }
  },

  selectAnswer: (questionId, optionId) => {
    const state = get();
    // Do not deselect if clicking the already selected option
    set({ answers: { ...state.answers, [questionId]: optionId } });
  },

  setEssayResponse: (questionId, html) => {
    const state = get();
    set({ essayResponses: { ...state.essayResponses, [questionId]: html } });
  },

  toggleFlag: (questionId) => {
    const state = get();
    set({
      flagged: {
        ...state.flagged,
        [questionId]: !state.flagged[questionId],
      },
    });
  },

  toggleEliminate: (questionId, optionId) => {
    const state = get();
    const current = state.eliminated[questionId] || [];
    const isEliminating = !current.includes(optionId);

    const newEliminated = isEliminating
      ? [...current, optionId]
      : current.filter((id) => id !== optionId);

    // If we are eliminating the currently selected answer, deselect it
    const newAnswers = { ...state.answers };
    if (isEliminating && state.answers[questionId] === optionId) {
      delete newAnswers[questionId];
    }

    set({
      eliminated: { ...state.eliminated, [questionId]: newEliminated },
      answers: newAnswers,
    });
  },

  tickTimer: () => {
    const state = get();
    if (state.timerRunning && state.timerSeconds > 0) {
      const currentQuestion = state.getCurrentQuestion();
      const newTimeSpent = { ...state.timeSpent };
      if (currentQuestion) {
        newTimeSpent[currentQuestion.id] = (newTimeSpent[currentQuestion.id] || 0) + 1;
      }
      set({
        timerSeconds: state.timerSeconds - 1,
        timeSpent: newTimeSpent,
      });
    } else if (state.timerSeconds === 0 && state.timerRunning) {
      set({ timerRunning: false, phase: 'done' });
    }
  },

  toggleTimerHidden: () => set({ timerHidden: !get().timerHidden }),
  startTimer: () => set({ timerRunning: true }),
  pauseTimer: () => set({ timerRunning: false }),

  nextSection: () => {
    const state = get();
    if (!state.exam) return;
    const currentSection = state.getCurrentSection();
    const nextIdx = state.currentSectionIndex + 1;
    if (nextIdx < state.exam.sections.length) {
      const nextSection = state.exam.sections[nextIdx];
      const breakMins = currentSection?.breakAfterMinutes ?? 10;
      set({
        currentSectionIndex: nextIdx,
        currentQuestionIndex: 0,
        phase: 'break',
        timerSeconds: nextSection.timeMinutes * 60,
        timerRunning: false,
        navModalOpen: false,
        breakDuration: breakMins * 60,
      });
    } else {
      set({ phase: 'done' });
    }
  },

  toggleNavModal: () => set({ navModalOpen: !get().navModalOpen }),
  closeNavModal: () => set({ navModalOpen: false }),

  toggleEliminatorMode: () => set({ eliminatorMode: !get().eliminatorMode }),

  tickBreak: () => {
    const state = get();
    if (state.breakDuration > 0) {
      set({ breakDuration: state.breakDuration - 1 });
    }
  },

  getBreakDuration: () => get().breakDuration,

  getCurrentSection: () => {
    const state = get();
    if (!state.exam) return null;
    return state.exam.sections[state.currentSectionIndex] || null;
  },

  getCurrentQuestion: () => {
    const state = get();
    const section = state.getCurrentSection();
    if (!section) return null;
    return section.questions[state.currentQuestionIndex] || null;
  },

  getSectionQuestionCount: () => {
    const section = get().getCurrentSection();
    return section ? section.questions.length : 0;
  },

  getAnsweredCount: () => {
    const state = get();
    const section = state.getCurrentSection();
    if (!section) return 0;
    return section.questions.filter((q) => {
      if (state.answers[q.id]) return true;
      // Count essay FRQs with non-empty content as answered
      if (q.questionType === 'frq' && state.essayResponses[q.id]) {
        const text = state.essayResponses[q.id].replace(/<[^>]*>/g, '').trim();
        return text.length > 0;
      }
      return false;
    }).length;
  },

  getFlaggedCount: () => {
    const state = get();
    const section = state.getCurrentSection();
    if (!section) return 0;
    return section.questions.filter((q) => state.flagged[q.id]).length;
  },
}));
