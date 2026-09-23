import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS } from '../data';
import { buildQuizRound, scoreMessage, shuffle } from './quiz';
import { mulberry32 } from './textures/noise';

describe('quiz utils', () => {
  it('shuffle은 원본을 바꾸지 않고 같은 원소를 유지한다', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffle(src, mulberry32(1));
    expect(src).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(src);
  });

  it('같은 시드면 같은 결과 (결정적)', () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(9))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(9)));
  });

  it('buildQuizRound: 보기를 섞어도 정답 텍스트는 유지된다', () => {
    const round = buildQuizRound(QUIZ_QUESTIONS, 5, mulberry32(3));
    expect(round).toHaveLength(5);
    for (const q of round) {
      const original = QUIZ_QUESTIONS.find((o) => o.id === q.id);
      expect(original).toBeDefined();
      if (!original) continue;
      expect(q.options[q.answerIndex]).toBe(original.options[original.answerIndex]);
      expect(new Set(q.options).size).toBe(original.options.length);
    }
  });

  it('buildQuizRound: 개수는 1 ~ 전체 범위로 제한', () => {
    expect(buildQuizRound(QUIZ_QUESTIONS, 999)).toHaveLength(QUIZ_QUESTIONS.length);
    expect(buildQuizRound(QUIZ_QUESTIONS, 0)).toHaveLength(1);
  });

  it('scoreMessage', () => {
    expect(scoreMessage(7, 7)).toContain('완벽');
    expect(scoreMessage(5, 7)).toContain('훌륭');
    expect(scoreMessage(3, 7)).toContain('좋아요');
    expect(scoreMessage(0, 7)).toContain('괜찮아요');
    expect(scoreMessage(0, 0)).toContain('괜찮아요');
  });
});
