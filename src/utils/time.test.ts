import { describe, expect, it } from 'vitest';
import {
  MAX_FRAME_DELTA,
  MAX_VISUAL_SPIN_TURNS_PER_SEC,
  SPEED_STEPS,
  advanceSimDays,
  clampDelta,
  dateToSimDays,
  simDaysToDate,
  speedFromIndex,
  speedLabel,
  spinIncrement,
} from './time';
import { TAU } from './math';

describe('델타타임 기반 시간 계산', () => {
  it('1x = 1초에 1일', () => {
    let d = 0;
    for (let i = 0; i < 60; i++) d = advanceSimDays(d, 1 / 60, 1);
    expect(d).toBeCloseTo(1, 10);
  });

  it('프레임레이트가 달라도 같은 실제 시간이면 같은 결과', () => {
    let a = 0;
    for (let i = 0; i < 144; i++) a = advanceSimDays(a, 1 / 144, 100);
    let b = 0;
    for (let i = 0; i < 30; i++) b = advanceSimDays(b, 1 / 30, 100);
    expect(a).toBeCloseTo(b, 8);
    expect(a).toBeCloseTo(100, 8);
  });

  it('배속을 중간에 바꿔도 누적 시간이 연속적이다 (점프 없음)', () => {
    let d = 0;
    d = advanceSimDays(d, 0.05, 10); // 0.5일
    const before = d;
    d = advanceSimDays(d, 0.05, 1000); // +50일
    expect(d - before).toBeCloseTo(50);
    d = advanceSimDays(d, 0.05, 0);
    expect(d).toBeCloseTo(50.5);
  });

  it('1000x는 약 2.7년/초', () => {
    let d = 0;
    for (let i = 0; i < 60; i++) d = advanceSimDays(d, 1 / 60, 1000);
    expect(d / 365.25).toBeCloseTo(2.74, 1);
  });

  it('큰 delta(탭 전환 등)는 MAX_FRAME_DELTA로 제한된다', () => {
    expect(clampDelta(5)).toBe(MAX_FRAME_DELTA);
    expect(clampDelta(-1)).toBe(0);
    expect(clampDelta(Number.NaN)).toBe(0);
    expect(advanceSimDays(0, 10, 1)).toBeCloseTo(MAX_FRAME_DELTA);
  });

  it('speedFromIndex는 범위를 넘으면 클램프', () => {
    expect(speedFromIndex(0)).toBe(0);
    expect(speedFromIndex(4)).toBe(1000);
    expect(speedFromIndex(99)).toBe(1000);
    expect(speedFromIndex(-3)).toBe(0);
    expect(SPEED_STEPS).toEqual([0, 1, 10, 100, 1000]);
  });

  it('날짜 ↔ J2000 경과일 왕복 변환', () => {
    const date = new Date(Date.UTC(2026, 8, 22, 0, 0, 0));
    expect(simDaysToDate(dateToSimDays(date)).getTime()).toBe(date.getTime());
    expect(dateToSimDays(new Date(Date.UTC(2000, 0, 1, 12)))).toBe(0);
  });

  it('자전 증가량: 저속은 실제 비율, 고속은 시각적 최대치로 제한', () => {
    // 지구(24h) 1x → 초당 1바퀴 → 최대치에 걸림
    const capped = spinIncrement(24, 0.1, 1000);
    expect(capped).toBeCloseTo(MAX_VISUAL_SPIN_TURNS_PER_SEC * TAU * 0.1);
    // 금성(5832h) 1x → 초당 0.0041바퀴
    const slow = spinIncrement(-5832.5, 1, 1);
    expect(slow).toBeCloseTo((24 / 5832.5) * TAU * MAX_FRAME_DELTA);
    expect(slow).toBeGreaterThan(0);
    expect(spinIncrement(0, 1, 1)).toBe(0);
    expect(spinIncrement(24, 0.05, 0)).toBe(0);
  });

  it('배속 라벨', () => {
    expect(speedLabel(0).short).toBe('정지');
    expect(speedLabel(1).detail).toBe('1초 = 1일');
    expect(speedLabel(100).detail).toContain('개월');
    expect(speedLabel(1000).short).toBe('1,000x');
    expect(speedLabel(1000).detail).toBe('1초 ≈ 2.7년');
  });
});
