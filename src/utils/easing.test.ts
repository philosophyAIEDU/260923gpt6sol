import { describe, expect, it } from 'vitest';
import { easeInOutCubic, easeInOutQuint, easeInOutSine, easeOutCubic, easeOutExpo, linear } from './easing';

const all = { linear, easeInOutCubic, easeOutCubic, easeInOutQuint, easeInOutSine, easeOutExpo };

describe('easing', () => {
  it.each(Object.entries(all))('%s: 양 끝값 0 → 0, 1 → 1, 범위 밖 입력은 클램프', (_name, fn) => {
    expect(fn(0)).toBeCloseTo(0);
    expect(fn(1)).toBeCloseTo(1);
    expect(fn(-2)).toBeCloseTo(0);
    expect(fn(3)).toBeCloseTo(1);
  });

  it.each(Object.entries(all))('%s: 단조 증가', (_name, fn) => {
    let prev = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const v = fn(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
  });

  it('easeInOut 계열은 중앙 대칭 (f(0.5)=0.5, f(t)+f(1-t)=1)', () => {
    for (const fn of [easeInOutCubic, easeInOutQuint, easeInOutSine]) {
      expect(fn(0.5)).toBeCloseTo(0.5);
      expect(fn(0.2) + fn(0.8)).toBeCloseTo(1);
    }
  });

  it('easeInOutCubic은 시작이 선형보다 느리다 (부드러운 출발)', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });
});
