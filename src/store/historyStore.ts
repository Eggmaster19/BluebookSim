import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idbStorage';
import type { Exam } from '../types/ExamSchema';

/** Snapshot of a completed exam for the history archive */
export interface ExamHistoryEntry {
  id: string;
  timestamp: number;                        // Date.now()
  studentName: string;
  exam: Exam;
  answers: Record<string, string>;
  essayResponses: Record<string, string>;
  audioRecordings?: Record<string, string>;
  audioTranscriptions?: Record<string, string>;
  timeSpent: Record<string, number>;
}

interface HistoryState {
  history: ExamHistoryEntry[];

  // Actions
  saveToHistory: (entry: ExamHistoryEntry) => void;
  deleteFromHistory: (id: string) => void;
  clearAllHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],

      saveToHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history],
        })),

      deleteFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((e) => e.id !== id),
        })),

      clearAllHistory: () => set({ history: [] }),
    }),
    {
      name: 'bluebook-history',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
