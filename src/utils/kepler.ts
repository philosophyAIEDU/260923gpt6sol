/**
 * 단순화된 케플러 궤도 계산.
 *
 * 원리 요약
 * 1) 평균 근점 이각 M: 행성이 "등속 원운동을 한다고 가정했을 때" 근일점에서 지난 각도.
 *    M(t) = M₀ + 2π · t / P   (M₀ = L₀ − ϖ, t = J2000 이후 경과일, P = 공전 주기)
 * 2) 케플러 방정식 M = E − e·sin(E) 를 풀어 이심 근점 이각 E를 구합니다.
 *    해석적 해가 없어 뉴턴-랩슨 반복법 E ← E − (E − e·sinE − M) / (1 − e·cosE) 을 사용합니다.
 * 3) 궤도면 좌표: x' = a(cosE − e), y' = a·√(1−e²)·sinE  (근일점이 +x' 방향, 태양은 초점)
 * 4) 궤도면 → 황도 좌표: 근일점 인수 ω, 궤도 경사 i, 승교점 경도 Ω 순서로 3번 회전합니다.
 * 5) 황도 좌표(z = 북쪽) → Three.js 좌표(y = 위쪽): (x, y, z) → (x, z, −y)
 *
 * N체 섭동은 무시하므로 수백 년 단위에서는 오차가 누적되지만 학습용으로 충분히 정확합니다.
 */
import type { OrbitalElements, Vec3Like } from '../types';
import { DEG2RAD, TAU, normalizeAngle } from './math';

/** 뉴턴-랩슨 반복으로 케플러 방정식 M = E − e·sinE 를 풉니다. */
export function solveKepler(meanAnomaly: number, eccentricity: number, tolerance = 1e-10, maxIter = 50): number {
  const M = normalizeAngle(meanAnomaly);
  const e = eccentricity;
  // 이심률이 크면 E = M 초기값이 수렴을 느리게 하므로 π에서 시작합니다.
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }
  return E;
}

/** 이심 근점 이각 E → 진근점 이각 ν (실제 태양-행성 각도) */
export function eccentricToTrueAnomaly(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

/** t(J2000 기준 경과일)에서의 평균 근점 이각 (rad, [0, 2π)) */
export function meanAnomalyAt(orbit: OrbitalElements, daysSinceJ2000: number): number {
  const M0 = (orbit.meanLongitudeDeg - orbit.longitudeOfPerihelionDeg) * DEG2RAD;
  return normalizeAngle(M0 + (TAU * daysSinceJ2000) / orbit.periodDays);
}

/** 공전 진행도 [0, 1) — 궤도선의 "꼬리" 그라데이션 셰이더에 사용 */
export function orbitPhase(orbit: OrbitalElements, daysSinceJ2000: number): number {
  return meanAnomalyAt(orbit, daysSinceJ2000) / TAU;
}

/** 궤도면(2D) 좌표 — AU 단위, 근일점이 +x 방향 */
export function orbitalPlanePosition(a: number, e: number, E: number): { x: number; y: number } {
  return {
    x: a * (Math.cos(E) - e),
    y: a * Math.sqrt(1 - e * e) * Math.sin(E),
  };
}

/**
 * 궤도면 좌표 → 황도 좌표계 (z = 황도 북극).
 * 회전 행렬 R = Rz(Ω) · Rx(i) · Rz(ω) 를 전개한 식입니다.
 */
export function orbitalToEcliptic(xp: number, yp: number, orbit: OrbitalElements): Vec3Like {
  const O = orbit.ascendingNodeDeg * DEG2RAD;
  const w = (orbit.longitudeOfPerihelionDeg - orbit.ascendingNodeDeg) * DEG2RAD;
  const i = orbit.inclinationDeg * DEG2RAD;
  const cosO = Math.cos(O);
  const sinO = Math.sin(O);
  const cosw = Math.cos(w);
  const sinw = Math.sin(w);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  return {
    x: (cosw * cosO - sinw * sinO * cosi) * xp + (-sinw * cosO - cosw * sinO * cosi) * yp,
    y: (cosw * sinO + sinw * cosO * cosi) * xp + (-sinw * sinO + cosw * cosO * cosi) * yp,
    z: sinw * sini * xp + cosw * sini * yp,
  };
}

/** 황도 좌표(z-up) → Three.js 씬 좌표(y-up). 위에서 봤을 때 반시계 방향 공전이 유지됩니다. */
export function eclipticToScene(v: Vec3Like): Vec3Like {
  return { x: v.x, y: v.z, z: -v.y };
}

/** 평균 근점 이각 M일 때의 씬 좌표 위치 (AU) */
export function positionAtMeanAnomaly(orbit: OrbitalElements, M: number): Vec3Like {
  const E = solveKepler(M, orbit.eccentricity);
  const p = orbitalPlanePosition(orbit.semiMajorAxisAU, orbit.eccentricity, E);
  return eclipticToScene(orbitalToEcliptic(p.x, p.y, orbit));
}

/** t(J2000 기준 경과일)일 때의 씬 좌표 위치 (AU) */
export function positionAt(orbit: OrbitalElements, daysSinceJ2000: number): Vec3Like {
  return positionAtMeanAnomaly(orbit, meanAnomalyAt(orbit, daysSinceJ2000));
}

export interface OrbitSample {
  /** 씬 좌표 AU 위치 */
  points: Vec3Like[];
  /** 각 점의 공전 진행도 [0, 1] — 평균 근점 이각 / 2π */
  phases: number[];
}

/**
 * 궤도 경로 샘플링. 평균 근점 이각 M을 균등 분할하므로
 * 각 점의 phase가 "행성이 그 점을 지나는 시각"과 정확히 대응합니다.
 * (근일점 부근에서는 점 간격이 넓어지고 원일점에서는 촘촘해집니다 — 케플러 제2법칙)
 */
export function sampleOrbit(orbit: OrbitalElements, segments: number): OrbitSample {
  const points: Vec3Like[] = [];
  const phases: number[] = [];
  for (let k = 0; k <= segments; k++) {
    const phase = k / segments;
    points.push(positionAtMeanAnomaly(orbit, phase * TAU));
    // 마지막 점은 phase=1로 둬서 셰이더 보간 시 0↔1 경계에서 끊기지 않게 합니다.
    phases.push(phase);
  }
  return { points, phases };
}

export function vectorLength(v: Vec3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
