import { create } from 'zustand';
import type { Exam, Question } from '../types/ExamSchema';

export type ExamPhase = 'directions' | 'exam' | 'check' | 'break' | 'done';

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

  // Question Navigation
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  // Answer Management
  selectAnswer: (questionId: string, optionId: string) => void;
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
      selectedExamType: null,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      phase: 'directions',
      answers: {},
      flagged: {},
      eliminated: {},
      timerSeconds: firstSection.timeMinutes * 60,
      timerRunning: false,
      timerHidden: false,
      breakDuration: 0,
      navModalOpen: false,
    });
  },

  setPhase: (phase) => set({ phase }),

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
      set({ timerSeconds: state.timerSeconds - 1 });
    } else if (state.timerSeconds === 0 && state.timerRunning) {
      set({ timerRunning: false, phase: 'check' });
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
    return section.questions.filter((q) => state.answers[q.id]).length;
  },

  getFlaggedCount: () => {
    const state = get();
    const section = state.getCurrentSection();
    if (!section) return 0;
    return section.questions.filter((q) => state.flagged[q.id]).length;
  },
}));
