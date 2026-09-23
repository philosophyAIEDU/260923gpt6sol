import { describe, expect, it } from 'vitest';
import {
  AU_KM,
  LEARNING_SCALE,
  REAL_SCALE,
  advanceScaleProgress,
  displayDistance,
  displayRadius,
  learningDistance,
  learningRadius,
  moonDisplayDistance,
  overviewCamera,
  realDistance,
  realRadius,
  scaleRadially,
} from './scale';
import { clamp, damp, lerp, logLerp, normalizeAngle } from './math';
import { vectorLength } from './kepler';

const earth = { type: 'terrestrial' as const, diameterKm: 12742 };
const jupiter = { type: 'gas-giant' as const, diameterKm: 139820 };
const sun = { type: 'star' as const, diameterKm: 1392700 };

describe('math helpers', () => {
  it('clamp / lerp', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  it('logLerp: 양 끝값과 기하 평균', () => {
    expect(logLerp(6, 0.06, 0)).toBeCloseTo(6);
    expect(logLerp(6, 0.06, 1)).toBeCloseTo(0.06);
    expect(logLerp(6, 0.06, 0.5)).toBeCloseTo(Math.sqrt(6 * 0.06));
  });

  it('logLerp: 0 이하 값은 선형 보간으로 대체', () => {
    expect(logLerp(0, 10, 0.5)).toBe(5);
  });

  it('damp는 프레임레이트와 무관하게 수렴한다', () => {
    let a = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 4, 1 / 60);
    let b = 0;
    for (let i = 0; i < 30; i++) b = damp(b, 1, 4, 1 / 30);
    expect(a).toBeCloseTo(b, 6);
  });

  it('normalizeAngle', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
    expect(normalizeAngle(5 * Math.PI)).toBeCloseTo(Math.PI);
  });
});

describe('스케일 변환', () => {
  it('학습용 거리 = base · √AU', () => {
    expect(learningDistance(1)).toBeCloseTo(LEARNING_SCALE.distanceBase);
    expect(learningDistance(4)).toBeCloseTo(LEARNING_SCALE.distanceBase * 2);
    expect(learningDistance(-1)).toBe(0);
  });

  it('실제 거리 = AU · unitsPerAU', () => {
    expect(realDistance(30)).toBe(30 * REAL_SCALE.unitsPerAU);
  });

  it('displayDistance는 mix 0/1에서 각 모드와 같고 그 사이는 선형', () => {
    expect(displayDistance(5.2, 0)).toBeCloseTo(learningDistance(5.2));
    expect(displayDistance(5.2, 1)).toBeCloseTo(realDistance(5.2));
    expect(displayDistance(5.2, 0.5)).toBeCloseTo((learningDistance(5.2) + realDistance(5.2)) / 2);
  });

  it('학습용 반지름: 지구 = radiusBase, 목성은 더 크지만 실제 비(11배)보다 압축', () => {
    expect(learningRadius(earth)).toBeCloseTo(LEARNING_SCALE.radiusBase);
    const ratio = learningRadius(jupiter) / learningRadius(earth);
    expect(ratio).toBeGreaterThan(2);
    expect(ratio).toBeLessThan(11);
    expect(learningRadius(sun)).toBe(LEARNING_SCALE.sunRadius);
  });

  it('실제 반지름은 km → AU 비례', () => {
    expect(realRadius(earth)).toBeCloseTo((6371 / AU_KM) * REAL_SCALE.unitsPerAU);
  });

  it('displayRadius는 로그 공간에서 단조 감소한다', () => {
    let prev = Infinity;
    for (let m = 0; m <= 1; m += 0.1) {
      const r = displayRadius(earth, m);
      expect(r).toBeLessThan(prev);
      prev = r;
    }
    expect(displayRadius(earth, 0)).toBeCloseTo(learningRadius(earth));
    expect(displayRadius(earth, 1)).toBeCloseTo(realRadius(earth));
  });

  it('학습용에서 태양이 수성 궤도를 삼키지 않는다', () => {
    expect(learningDistance(0.307)).toBeGreaterThan(LEARNING_SCALE.sunRadius * 1.5);
  });

  it('위성 거리: 학습용에서 모행성 반지름보다 충분히 멀고, 실제 비율에서 실제 거리', () => {
    const moonAU = 384400 / AU_KM;
    expect(moonDisplayDistance(moonAU, earth, 0)).toBeGreaterThan(learningRadius(earth) * 2);
    expect(moonDisplayDistance(moonAU, earth, 1)).toBeCloseTo(realDistance(moonAU));
  });

  it('scaleRadially는 방향을 보존하고 길이만 바꾼다', () => {
    const v = scaleRadially({ x: 3, y: 0, z: 4 }, (len) => len * 2);
    expect(vectorLength(v)).toBeCloseTo(10);
    expect(v.x / v.z).toBeCloseTo(3 / 4);
    expect(scaleRadially({ x: 0, y: 0, z: 0 }, () => 5)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('overviewCamera는 실제 비율에서 더 멀리 있다', () => {
    const a = overviewCamera(0).position;
    const b = overviewCamera(1).position;
    expect(vectorLength(b)).toBeGreaterThan(vectorLength(a));
  });

  it('advanceScaleProgress는 목표 방향으로 이동하고 [0,1]에 머문다', () => {
    expect(advanceScaleProgress(0, 1, 0.9, 1.8)).toBeCloseTo(0.5);
    expect(advanceScaleProgress(0.9, 1, 1, 1.8)).toBe(1);
    expect(advanceScaleProgress(0.2, 0, 1, 1.8)).toBe(0);
    expect(advanceScaleProgress(0.5, 1, -1, 1.8)).toBe(0.5);
  });
});
