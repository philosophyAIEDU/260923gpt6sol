/**
 * 시뮬레이션 시간 계산.
 *
 * 규칙: 배속 1x = 실제 1초에 시뮬레이션 1일.
 *   simDays += deltaSec × speed
 * 프레임 간격(deltaSec)을 곱하므로 60fps든 144fps든 같은 속도로 진행됩니다(델타타임 기반).
 * 탭이 백그라운드였다가 돌아오면 delta가 수 초가 될 수 있어, MAX_FRAME_DELTA로 잘라 순간이동을 방지합니다.
 */
import { TAU } from './math';

export const SPEED_STEPS = [0, 1, 10, 100, 1000] as const;
export type SpeedStep = (typeof SPEED_STEPS)[number];
export const DEFAULT_SPEED_INDEX = 2;

/** 한 프레임에서 허용하는 최대 delta (초) */
export const MAX_FRAME_DELTA = 0.1;

/** 자전 애니메이션의 최대 시각 속도(초당 회전 수). 고배속에서 스트로보(깜빡임) 현상을 방지합니다. */
export const MAX_VISUAL_SPIN_TURNS_PER_SEC = 0.6;

export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
export const MS_PER_DAY = 86_400_000;

export function clampDelta(deltaSec: number): number {
  if (!Number.isFinite(deltaSec) || deltaSec < 0) return 0;
  return Math.min(deltaSec, MAX_FRAME_DELTA);
}

/** 다음 프레임의 시뮬레이션 시각 (J2000 기준 경과일) */
export function advanceSimDays(simDays: number, deltaSec: number, speed: number): number {
  return simDays + clampDelta(deltaSec) * speed;
}

export function speedFromIndex(index: number): SpeedStep {
  const i = Math.min(SPEED_STEPS.length - 1, Math.max(0, Math.round(index)));
  return SPEED_STEPS[i];
}

export function dateToSimDays(date: Date): number {
  return (date.getTime() - J2000_MS) / MS_PER_DAY;
}

export function simDaysToDate(days: number): Date {
  return new Date(J2000_MS + days * MS_PER_DAY);
}

/**
 * 한 프레임 동안의 자전 각도 증가량 (rad).
 * 실제 각속도 = 배속 × 24 / |자전주기(시간)| (초당 회전 수).
 * 시각적 최대치를 넘으면 잘라내 고배속에서도 자전 방향을 눈으로 따라갈 수 있게 합니다.
 */
export function spinIncrement(rotationPeriodHours: number, deltaSec: number, speed: number): number {
  if (rotationPeriodHours === 0) return 0;
  const turnsPerSec = (speed * 24) / Math.abs(rotationPeriodHours);
  const capped = Math.min(turnsPerSec, MAX_VISUAL_SPIN_TURNS_PER_SEC);
  return capped * TAU * clampDelta(deltaSec);
}

export interface SpeedLabel {
  short: string;
  detail: string;
}

export function speedLabel(speed: number): SpeedLabel {
  if (speed === 0) return { short: '정지', detail: '시간이 멈췄어요' };
  const daysPerSec = speed;
  let detail: string;
  if (daysPerSec < 30) detail = `1초 = ${daysPerSec}일`;
  else if (daysPerSec < 365) detail = `1초 ≈ ${(daysPerSec / 30.44).toFixed(1)}개월`;
  else detail = `1초 ≈ ${(daysPerSec / 365.25).toFixed(1)}년`;
  return { short: `${speed.toLocaleString('en-US')}x`, detail };
}
