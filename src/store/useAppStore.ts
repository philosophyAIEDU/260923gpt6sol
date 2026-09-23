/**
 * 전역 UI 상태 (Zustand).
 * 카메라 포커스 대상, 시간 배속, 비율 모드, 그래픽 품질, 퀴즈, 로딩 상태를 관리합니다.
 * 프레임 단위로 변하는 값(시뮬레이션 시각, 천체 위치)은 runtime.ts에 있습니다.
 */
import { create } from 'zustand';
import { NAV_ORDER, QUIZ_QUESTIONS } from '../data';
import type { Quality, QuizQuestion, ScaleMode } from '../types';
import { detectQuality, hasQualityParam, lowerQuality } from '../utils/quality';
import { buildQuizRound, type RandomFn } from '../utils/quiz';
import { DEFAULT_SPEED_INDEX, SPEED_STEPS, speedFromIndex } from '../utils/time';

export const QUIZ_LENGTH = 7;

export type ToastTone = 'info' | 'success' | 'warning';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface QuizState {
  open: boolean;
  questions: QuizQuestion[];
  index: number;
  /** 사용자가 고른 보기 (null = 아직 답하지 않음) */
  picked: number | null;
  score: number;
  finished: boolean;
}

export interface LoadingState {
  progress: number;
  label: string;
  texturesReady: boolean;
  sceneReady: boolean;
}

export interface AppState {
  selectedId: string | null;
  hoveredId: string | null;
  /** 같은 대상에 다시 포커스(예: 비율 전환 후)해야 할 때 증가시키는 토큰 */
  focusToken: number;
  speedIndex: number;
  lastMovingSpeedIndex: number;
  scaleMode: ScaleMode;
  quality: Quality;
  qualityLocked: boolean;
  showLabels: boolean;
  showOrbits: boolean;
  soundOn: boolean;
  loading: LoadingState;
  quiz: QuizState;
  toast: Toast | null;

  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  cycleSelection: (direction: 1 | -1) => void;
  setSpeedIndex: (index: number) => void;
  togglePlay: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  setQuality: (quality: Quality, byUser?: boolean) => void;
  degradeQuality: () => void;
  toggleLabels: () => void;
  toggleOrbits: () => void;
  toggleSound: () => void;
  setLoading: (patch: Partial<LoadingState>) => void;
  openQuiz: (random?: RandomFn) => void;
  closeQuiz: () => void;
  answerQuiz: (optionIndex: number) => boolean | null;
  nextQuestion: () => void;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
}

function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'medium';
  const nav = navigator as Navigator & { deviceMemory?: number };
  return detectQuality({
    search: window.location.search,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    coarsePointer: typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
  });
}

const emptyQuiz: QuizState = {
  open: false,
  questions: [],
  index: 0,
  picked: null,
  score: 0,
  finished: false,
};

let toastSeq = 0;

export const createInitialState = (): Omit<
  AppState,
  | 'select'
  | 'hover'
  | 'cycleSelection'
  | 'setSpeedIndex'
  | 'togglePlay'
  | 'setScaleMode'
  | 'setQuality'
  | 'degradeQuality'
  | 'toggleLabels'
  | 'toggleOrbits'
  | 'toggleSound'
  | 'setLoading'
  | 'openQuiz'
  | 'closeQuiz'
  | 'answerQuiz'
  | 'nextQuestion'
  | 'showToast'
  | 'dismissToast'
> => ({
  selectedId: null,
  hoveredId: null,
  focusToken: 0,
  speedIndex: DEFAULT_SPEED_INDEX,
  lastMovingSpeedIndex: DEFAULT_SPEED_INDEX,
  scaleMode: 'learning',
  quality: initialQuality(),
  qualityLocked: typeof window !== 'undefined' && hasQualityParam(window.location.search),
  showLabels: true,
  showOrbits: true,
  soundOn: false,
  loading: { progress: 0, label: '', texturesReady: false, sceneReady: false },
  quiz: emptyQuiz,
  toast: null,
});

export const useAppStore = create<AppState>()((set, get) => ({
  ...createInitialState(),

  select: (id) => set((s) => ({ selectedId: id, focusToken: s.focusToken + 1 })),

  hover: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },

  cycleSelection: (direction) => {
    const { selectedId } = get();
    const idx = selectedId ? NAV_ORDER.indexOf(selectedId) : -1;
    const next =
      idx === -1
        ? direction === 1
          ? 0
          : NAV_ORDER.length - 1
        : (idx + direction + NAV_ORDER.length) % NAV_ORDER.length;
    get().select(NAV_ORDER[next]);
  },

  setSpeedIndex: (index) => {
    if (!Number.isFinite(index)) return;
    const i = Math.min(SPEED_STEPS.length - 1, Math.max(0, Math.round(index)));
    set(() => ({
      speedIndex: i,
      ...(speedFromIndex(i) !== 0 ? { lastMovingSpeedIndex: i } : {}),
    }));
  },

  togglePlay: () => {
    const { speedIndex, lastMovingSpeedIndex } = get();
    if (speedFromIndex(speedIndex) === 0) get().setSpeedIndex(lastMovingSpeedIndex || 1);
    else set({ speedIndex: 0 });
  },

  setScaleMode: (mode) => {
    if (get().scaleMode === mode) return;
    // 비율이 바뀌면 카메라가 새 크기에 맞는 거리로 다시 날아가도록 포커스 토큰을 올립니다.
    set((s) => ({ scaleMode: mode, focusToken: s.focusToken + 1 }));
    if (mode === 'real') {
      get().showToast('실제 비율에서는 행성이 아주 작아요. 이름표를 눌러 찾아가 보세요.', 'info');
    }
  },

  setQuality: (quality, byUser = true) => set({ quality, qualityLocked: byUser || get().qualityLocked }),

  degradeQuality: () => {
    const { quality, qualityLocked } = get();
    if (qualityLocked || quality === 'low') return;
    const next = lowerQuality(quality);
    set({ quality: next });
    get().showToast('부드러운 화면을 위해 그래픽 품질을 자동으로 낮췄어요.', 'warning');
  },

  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

  setLoading: (patch) => set((s) => ({ loading: { ...s.loading, ...patch } })),

  openQuiz: (random = Math.random) =>
    set({
      quiz: {
        ...emptyQuiz,
        open: true,
        questions: buildQuizRound(QUIZ_QUESTIONS, QUIZ_LENGTH, random),
      },
    }),

  closeQuiz: () => set({ quiz: emptyQuiz }),

  answerQuiz: (optionIndex) => {
    const { quiz } = get();
    const q = quiz.questions[quiz.index];
    if (!quiz.open || !q || quiz.picked !== null) return null;
    const correct = optionIndex === q.answerIndex;
    set({ quiz: { ...quiz, picked: optionIndex, score: quiz.score + (correct ? 1 : 0) } });
    // 정답 천체로 카메라 이동 — 오답이어도 정답 천체를 보여주며 학습 효과를 높입니다.
    get().select(q.targetId);
    return correct;
  },

  nextQuestion: () => {
    const { quiz } = get();
    if (quiz.picked === null) return;
    const last = quiz.index >= quiz.questions.length - 1;
    set({
      quiz: last ? { ...quiz, finished: true } : { ...quiz, index: quiz.index + 1, picked: null },
    });
  },

  showToast: (message, tone = 'info') => set({ toast: { id: ++toastSeq, message, tone } }),
  dismissToast: () => set({ toast: null }),
}));

/** 현재 배속 값 (일/초) */
export const selectSpeed = (s: AppState): number => speedFromIndex(s.speedIndex);
