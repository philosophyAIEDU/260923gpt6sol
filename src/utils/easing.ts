/**
 * 이징(easing) 함수 모음. 입력 t ∈ [0, 1], 출력도 [0, 1].
 * 카메라 이동·비율 전환 등 모든 애니메이션은 선형 대신 이징을 사용해
 * "출발할 때 부드럽게 가속하고 도착할 때 부드럽게 감속"하도록 합니다.
 */
import { clamp } from './math';

export type EasingFn = (t: number) => number;

export const linear: EasingFn = (t) => clamp(t, 0, 1);

/** 3차 함수 기반 가속-감속. 전반부는 4t³, 후반부는 대칭 */
export const easeInOutCubic: EasingFn = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const easeOutCubic: EasingFn = (t) => {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
};

/** 5차 함수 기반 — cubic보다 가속/감속 구간이 길어 더 "시네마틱"합니다 */
export const easeInOutQuint: EasingFn = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
};

export const easeInOutSine: EasingFn = (t) => {
  const x = clamp(t, 0, 1);
  return -(Math.cos(Math.PI * x) - 1) / 2;
};

export const easeOutExpo: EasingFn = (t) => {
  const x = clamp(t, 0, 1);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
