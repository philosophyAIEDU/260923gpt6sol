export const TAU = Math.PI * 2;
export const DEG2RAD = Math.PI / 180;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 선형 보간: t=0 → a, t=1 → b */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 로그 공간 보간 (기하 보간).
 * 값의 범위가 수백 배 차이 날 때(예: 반지름 6 → 0.02) 선형 보간을 쓰면
 * 전환 초반에 급격히 작아지는 것처럼 보이지 않고 후반에 "뚝" 떨어집니다.
 * ln(a)와 ln(b) 사이를 선형 보간한 뒤 exp로 되돌리면
 * 매 순간 같은 "비율"로 줄어들어 눈에 자연스러운 크기 변화가 됩니다.
 *   logLerp(a, b, t) = a^(1-t) · b^t
 */
export function logLerp(a: number, b: number, t: number): number {
  if (a <= 0 || b <= 0) return lerp(a, b, t);
  return Math.exp(lerp(Math.log(a), Math.log(b), t));
}

/**
 * 프레임레이트에 독립적인 지수 감쇠(damping).
 * current를 target 쪽으로 매 초 lambda 비율만큼 끌어당깁니다.
 * 1 - e^(-λ·dt) 를 사용하므로 30fps든 144fps든 같은 시간에 같은 만큼 수렴합니다.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** 각도를 [0, 2π) 범위로 정규화 */
export function normalizeAngle(rad: number): number {
  const r = rad % TAU;
  return r < 0 ? r + TAU : r;
}
