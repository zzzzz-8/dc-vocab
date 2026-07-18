'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FontSizeLevel, ThemeMode, GlobalSettings } from '@/types';

// ==================== User Store ====================
interface UserState {
  userId: string | null;
  username: string;
  nickname: string;
  avatar: string;
  token: string;
  isLoggedIn: boolean;
  isMember: boolean;
  memberExpiry: string | null;
  credits: number;
  setUser: (user: {
    id: string; username: string; nickname?: string; avatar?: string;
    token: string; isMember?: boolean; memberExpiry?: string | null; credits?: number;
  }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      username: '',
      nickname: '',
      avatar: '',
      token: '',
      isLoggedIn: false,
      isMember: false,
      memberExpiry: null,
      trialStartAt: null,
      setUser: (user) =>
        set({
          userId: user.id,
          username: user.username,
          nickname: user.nickname || user.username,
          avatar: user.avatar || 'default-avatar.png',
          token: user.token,
          isLoggedIn: true,
          isMember: user.isMember || false,
          memberExpiry: user.memberExpiry || null,
          credits: user.credits || 0,
        }),
      logout: () =>
        set({
          userId: null, username: '', nickname: '', avatar: '', token: '',
          isLoggedIn: false, isMember: false, memberExpiry: null, credits: 0,
        }),
    }),
    { name: 'duo-vocab-user' }
  )
);

// ==================== Learning Store ====================
interface LearningState {
  currentWordBookId: string | null;
  currentWordBookName: string;
  accent: 'US' | 'UK';
  setCurrentWordBook: (id: string, name: string) => void;
  setAccent: (accent: 'US' | 'UK') => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      currentWordBookId: null,
      currentWordBookName: '',
      accent: 'US',
      setCurrentWordBook: (id, name) => set({ currentWordBookId: id, currentWordBookName: name }),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'duo-vocab-learning' }
  )
);

// ==================== Settings Store ====================
interface SettingsState extends GlobalSettings {
  setFontSize: (level: FontSizeLevel) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMute: () => void;
  setMascot: (id: string) => void;
  setAccentPreference: (accent: 'US' | 'UK') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSizeLevel: 3,
      themeMode: 'light',
      isMuted: false,
      mascotId: 'default',
      accent: 'US',
      setFontSize: (level) => set({ fontSizeLevel: level }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMascot: (id) => set({ mascotId: id }),
      setAccentPreference: (accent) => set({ accent }),
    }),
    { name: 'duo-vocab-settings' }
  )
);

// ==================== Toast Store ====================
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// ==================== Sidebar Store ====================
interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
}));

// ==================== New Word Learning Store ====================
interface NewWordLearningState {
  pretestWords: { wordId: string; word: any; isKnown: boolean | null }[];
  selectedWordBookId: string | null;
  selectedWordBookName: string;
  currentGroupIndex: number;
  isPretestComplete: boolean;
  setPretestWords: (words: any[]) => void;
  markWord: (wordId: number, isKnown: boolean) => void;
  clearMarks: () => void;
  markAllKnown: () => void;
  markAllUnknown: () => void;
  setSelectedBook: (id: number, name: string) => void;
  completePretest: () => void;
  nextGroup: () => void;
  reset: () => void;
}

export const useNewWordLearningStore = create<NewWordLearningState>()(
  persist(
    (set, get) => ({
      pretestWords: [],
      selectedWordBookId: null,
      selectedWordBookName: '',
      currentGroupIndex: 0,
      isPretestComplete: false,

      setPretestWords: (words) =>
        set({
          pretestWords: words.map((w: any) => ({ wordId: w.id, word: w, isKnown: null })),
          currentGroupIndex: 0,
          isPretestComplete: false,
        }),

      markWord: (wordId: string, isKnown: boolean) =>
        set((state) => ({
          pretestWords: state.pretestWords.map((pw) =>
            pw.wordId === wordId ? { ...pw, isKnown } : pw
          ),
        })),

      clearMarks: () =>
        set((state) => ({
          pretestWords: state.pretestWords.map((pw) => ({ ...pw, isKnown: null })),
        })),

      markAllKnown: () =>
        set((state) => ({
          pretestWords: state.pretestWords.map((pw) => ({ ...pw, isKnown: true })),
        })),

      markAllUnknown: () =>
        set((state) => ({
          pretestWords: state.pretestWords.map((pw) => ({ ...pw, isKnown: false })),
        })),

      setSelectedBook: (id, name) =>
        set({ selectedWordBookId: id, selectedWordBookName: name }),

      completePretest: () => set({ isPretestComplete: true }),

      nextGroup: () =>
        set((state) => ({ currentGroupIndex: state.currentGroupIndex + 1 })),

      reset: () =>
        set({
          pretestWords: [],
          currentGroupIndex: 0,
          isPretestComplete: false,
        }),
    }),
    { name: 'duo-vocab-new-word-learning' }
  )
);

// ==================== Cycle Game Store ====================
interface CycleGameState {
  gameWords: any[];
  currentWordIndex: number;
  correctCount: number;
  errorCount: number;
  isActive: boolean;
  setGameWords: (words: any[]) => void;
  recordCorrect: () => void;
  recordError: () => void;
  nextWord: () => void;
  setActive: (active: boolean) => void;
  reset: () => void;
}

export const useCycleGameStore = create<CycleGameState>()((set, get) => ({
  gameWords: [],
  currentWordIndex: 0,
  correctCount: 0,
  errorCount: 0,
  isActive: false,

  setGameWords: (words) => set({ gameWords: words, currentWordIndex: 0, correctCount: 0, errorCount: 0, isActive: true }),

  recordCorrect: () => set((state) => ({ correctCount: state.correctCount + 1 })),

  recordError: () => set((state) => ({ errorCount: state.errorCount + 1 })),

  nextWord: () =>
    set((state) => ({
      currentWordIndex: state.currentWordIndex + 1,
    })),

  setActive: (active) => set({ isActive: active }),

  reset: () =>
    set({ gameWords: [], currentWordIndex: 0, correctCount: 0, errorCount: 0, isActive: false }),
}));
