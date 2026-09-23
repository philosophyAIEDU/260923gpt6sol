/**
 * 스케일 변환 — "학습용 비율"과 "실제 비율" 사이의 거리/크기 매핑.
 *
 * 실제 태양계는 너무 넓고 행성은 너무 작습니다.
 * (해왕성까지 30AU인데 지구 지름은 0.000085AU → 실제 비율로는 행성이 점으로도 안 보입니다.)
 *
 * 학습용 비율
 *   - 거리: displayDistance = baseUnit · r^0.5   (제곱근 압축: 안쪽 행성은 벌리고 바깥 행성은 당김)
 *   - 크기: displayRadius   = radiusBase · (D / D_지구)^0.45  (거대 행성과 작은 행성 차이를 줄임)
 *   - 태양: 고정 반지름 (실제로는 지구의 109배라 그대로 쓰면 수성 궤도를 삼킵니다)
 *
 * 실제 비율
 *   - 거리, 크기 모두 1AU = unitsPerAU 씬 단위로 동일하게 선형 변환합니다.
 *
 * 전환(mix ∈ [0,1])
 *   - 거리는 선형 보간, 반지름은 로그 공간 보간(logLerp)을 사용합니다 — math.ts 참고.
 */
import type { CelestialBody, Vec3Like } from '../types';
import { lerp, logLerp } from './math';
import { vectorLength } from './kepler';

export const AU_KM = 149_597_870.7;
export const EARTH_DIAMETER_KM = 12_742;

export const LEARNING_SCALE = {
  distanceBase: 24,
  distanceExponent: 0.5,
  radiusBase: 0.9,
  radiusExponent: 0.45,
  sunRadius: 6,
  /** 위성 거리 = 모행성 반지름 × (moonOffset + moonFactor·√(거리/모행성반지름)) */
  moonOffset: 1.6,
  moonFactor: 0.45,
} as const;

export const REAL_SCALE = {
  unitsPerAU: 80,
} as const;

/** 학습용 비율의 태양-행성 거리 (씬 단위) */
export function learningDistance(au: number): number {
  return LEARNING_SCALE.distanceBase * Math.pow(Math.max(au, 0), LEARNING_SCALE.distanceExponent);
}

/** 실제 비율의 거리 (씬 단위) */
export function realDistance(au: number): number {
  return au * REAL_SCALE.unitsPerAU;
}

/** 두 모드 사이의 행성 거리 보간 */
export function displayDistance(au: number, mix: number): number {
  return lerp(learningDistance(au), realDistance(au), mix);
}

export function learningRadius(body: Pick<CelestialBody, 'type' | 'diameterKm'>): number {
  if (body.type === 'star') return LEARNING_SCALE.sunRadius;
  return LEARNING_SCALE.radiusBase * Math.pow(body.diameterKm / EARTH_DIAMETER_KM, LEARNING_SCALE.radiusExponent);
}

export function realRadius(body: Pick<CelestialBody, 'diameterKm'>): number {
  return (body.diameterKm / 2 / AU_KM) * REAL_SCALE.unitsPerAU;
}

/** 두 모드 사이의 반지름 보간 (로그 공간) */
export function displayRadius(body: Pick<CelestialBody, 'type' | 'diameterKm'>, mix: number): number {
  return logLerp(learningRadius(body), realRadius(body), mix);
}

/**
 * 위성-모행성 거리 (씬 단위).
 * 학습용에서는 모행성의 "화면상 반지름"에 비례하도록 해서, 모행성이 커져도 위성이 파묻히지 않게 합니다.
 */
export function moonDisplayDistance(
  distanceAU: number,
  parent: Pick<CelestialBody, 'type' | 'diameterKm'>,
  mix: number,
): number {
  const parentRadiusKm = parent.diameterKm / 2;
  const distanceKm = distanceAU * AU_KM;
  const learn =
    learningRadius(parent) *
    (LEARNING_SCALE.moonOffset + LEARNING_SCALE.moonFactor * Math.sqrt(distanceKm / parentRadiusKm));
  return lerp(learn, realDistance(distanceAU), mix);
}

/**
 * AU 단위 위치 벡터의 "방향은 유지하고 길이만" 비선형 스케일 함수로 변환합니다.
 * 타원 궤도의 모양(이심률)이 압축된 거리에서도 자연스럽게 보존됩니다.
 */
export function scaleRadially(posAU: Vec3Like, mapLength: (lengthAU: number) => number): Vec3Like {
  const len = vectorLength(posAU);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  const k = mapLength(len) / len;
  return { x: posAU.x * k, y: posAU.y * k, z: posAU.z * k };
}

/** 모드별 전체 조망 카메라 위치 */
export function overviewCamera(mix: number): { position: Vec3Like; target: Vec3Like } {
  // 해왕성 궤도가 화면에 들어오도록 거리 보간
  const learnDist = learningDistance(30.1);
  const realDist = realDistance(30.1);
  const span = lerp(learnDist, realDist, mix);
  return {
    position: { x: 0, y: span * 0.78, z: span * 1.5 },
    target: { x: 0, y: 0, z: 0 },
  };
}

/** 비율 모드 전환에 걸리는 시간 (초) */
export const SCALE_TRANSITION_SEC = 1.8;

/**
 * 비율 전환 진행도(0=학습용, 1=실제)를 목표 쪽으로 한 프레임만큼 이동합니다.
 * 진행도 자체는 선형으로 움직이고, 실제 적용 시 이징 함수를 통과시켜 부드럽게 만듭니다.
 */
export function advanceScaleProgress(
  progress: number,
  target: 0 | 1,
  deltaSec: number,
  durationSec: number = SCALE_TRANSITION_SEC,
): number {
  const step = Math.max(0, deltaSec) / durationSec;
  return target === 1 ? Math.min(1, progress + step) : Math.max(0, progress - step);
}
