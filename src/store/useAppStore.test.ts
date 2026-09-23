import { beforeEach, describe, expect, it } from 'vitest';
import { NAV_ORDER } from '../data';
import { mulberry32 } from '../utils/textures/noise';
import { QUIZ_LENGTH, createInitialState, selectSpeed, useAppStore } from './useAppStore';
import { getBodyRuntime, resetSimTimeToNow, runtime } from './runtime';
import { dateToSimDays } from '../utils/time';

const s = () => useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(createInitialState());
});

describe('selection', () => {
  it('select는 포커스 토큰을 증가시킨다', () => {
    const t = s().focusToken;
    s().select('earth');
    expect(s().selectedId).toBe('earth');
    expect(s().focusToken).toBe(t + 1);
    s().select(null);
    expect(s().selectedId).toBeNull();
  });

  it('cycleSelection은 순환한다', () => {
    s().cycleSelection(1);
    expect(s().selectedId).toBe(NAV_ORDER[0]);
    s().cycleSelection(-1);
    expect(s().selectedId).toBe(NAV_ORDER[NAV_ORDER.length - 1]);
    s().cycleSelection(1);
    expect(s().selectedId).toBe(NAV_ORDER[0]);
    s().select(null);
    s().cycleSelection(-1);
    expect(s().selectedId).toBe(NAV_ORDER[NAV_ORDER.length - 1]);
  });

  it('hover는 값이 같으면 상태를 바꾸지 않는다', () => {
    s().hover('mars');
    const before = s();
    s().hover('mars');
    expect(s()).toBe(before);
    s().hover(null);
    expect(s().hoveredId).toBeNull();
  });
});

describe('time', () => {
  it('배속 설정과 클램프', () => {
    s().setSpeedIndex(4);
    expect(selectSpeed(s())).toBe(1000);
    s().setSpeedIndex(10);
    expect(s().speedIndex).toBe(4);
    s().setSpeedIndex(-1);
    expect(selectSpeed(s())).toBe(0);
    s().setSpeedIndex(Number.NaN);
    expect(s().speedIndex).toBe(0);
  });

  it('togglePlay는 마지막 배속을 기억한다', () => {
    s().setSpeedIndex(3);
    s().togglePlay();
    expect(selectSpeed(s())).toBe(0);
    s().togglePlay();
    expect(selectSpeed(s())).toBe(100);
  });

  it('runtime: 오늘 날짜로 리셋 / 천체 런타임 생성', () => {
    runtime.simDays = 0;
    resetSimTimeToNow();
    expect(runtime.simDays).toBeCloseTo(dateToSimDays(new Date()), 1);
    const r = getBodyRuntime('test-body');
    expect(getBodyRuntime('test-body')).toBe(r);
  });
});

describe('scale / quality / toggles', () => {
  it('비율 모드 전환 시 재포커스 + 실제 비율 안내 토스트', () => {
    const t = s().focusToken;
    s().setScaleMode('real');
    expect(s().scaleMode).toBe('real');
    expect(s().focusToken).toBe(t + 1);
    expect(s().toast?.message).toContain('실제 비율');
    s().setScaleMode('real');
    expect(s().focusToken).toBe(t + 1);
    s().dismissToast();
    expect(s().toast).toBeNull();
  });

  it('자동 품질 저하는 사용자가 직접 고르면 멈춘다', () => {
    s().setQuality('high', false);
    s().degradeQuality();
    expect(s().quality).toBe('medium');
    expect(s().toast?.tone).toBe('warning');
    s().setQuality('high');
    s().degradeQuality();
    expect(s().quality).toBe('high');
  });

  it('low에서는 더 낮추지 않는다', () => {
    s().setQuality('low', false);
    s().degradeQuality();
    expect(s().quality).toBe('low');
  });

  it('토글들', () => {
    s().toggleLabels();
    s().toggleOrbits();
    s().toggleSound();
    expect(s().showLabels).toBe(false);
    expect(s().showOrbits).toBe(false);
    expect(s().soundOn).toBe(true);
    s().setLoading({ progress: 0.5 });
    expect(s().loading.progress).toBe(0.5);
    expect(s().loading.texturesReady).toBe(false);
  });
});

describe('quiz', () => {
  it('정답 시 점수가 오르고 해당 천체로 포커스한다', () => {
    s().openQuiz(mulberry32(1));
    expect(s().quiz.questions).toHaveLength(QUIZ_LENGTH);
    const q = s().quiz.questions[0];
    expect(s().answerQuiz(q.answerIndex)).toBe(true);
    expect(s().quiz.score).toBe(1);
    expect(s().selectedId).toBe(q.targetId);
    // 중복 답변 무시
    expect(s().answerQuiz(0)).toBeNull();
    expect(s().quiz.score).toBe(1);
  });

  it('오답이어도 정답 천체로 이동하고 점수는 그대로', () => {
    s().openQuiz(mulberry32(2));
    const q = s().quiz.questions[0];
    const wrong = (q.answerIndex + 1) % q.options.length;
    expect(s().answerQuiz(wrong)).toBe(false);
    expect(s().quiz.score).toBe(0);
    expect(s().selectedId).toBe(q.targetId);
  });

  it('답하기 전에는 다음 문제로 넘어갈 수 없고, 마지막 문제 후 종료', () => {
    s().openQuiz(mulberry32(3));
    s().nextQuestion();
    expect(s().quiz.index).toBe(0);
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      const q = s().quiz.questions[s().quiz.index];
      s().answerQuiz(q.answerIndex);
      s().nextQuestion();
    }
    expect(s().quiz.finished).toBe(true);
    expect(s().quiz.score).toBe(QUIZ_LENGTH);
    s().closeQuiz();
    expect(s().quiz.open).toBe(false);
    expect(s().answerQuiz(0)).toBeNull();
  });
});
