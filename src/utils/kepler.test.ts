import { describe, expect, it } from 'vitest';
import type { OrbitalElements } from '../types';
import {
  eccentricToTrueAnomaly,
  eclipticToScene,
  meanAnomalyAt,
  orbitPhase,
  orbitalPlanePosition,
  orbitalToEcliptic,
  positionAt,
  sampleOrbit,
  solveKepler,
  vectorLength,
} from './kepler';
import { TAU } from './math';

const circular: OrbitalElements = {
  semiMajorAxisAU: 1,
  eccentricity: 0,
  inclinationDeg: 0,
  ascendingNodeDeg: 0,
  longitudeOfPerihelionDeg: 0,
  meanLongitudeDeg: 0,
  periodDays: 100,
};

const mercuryLike: OrbitalElements = {
  semiMajorAxisAU: 0.387,
  eccentricity: 0.2056,
  inclinationDeg: 7,
  ascendingNodeDeg: 48.3,
  longitudeOfPerihelionDeg: 77.5,
  meanLongitudeDeg: 252.3,
  periodDays: 87.97,
};

describe('solveKepler', () => {
  it('원 궤도(e=0)에서는 E = M', () => {
    for (const M of [0, 0.5, 1, 2, 3, 5, 6]) {
      expect(solveKepler(M, 0)).toBeCloseTo(M, 10);
    }
  });

  it.each([0.0167, 0.2056, 0.5, 0.9, 0.97])('이심률 %f 에서 케플러 방정식을 만족한다', (e) => {
    for (let M = 0; M < TAU; M += 0.37) {
      const E = solveKepler(M, e);
      expect(E - e * Math.sin(E)).toBeCloseTo(M, 8);
    }
  });

  it('음수/2π 이상의 평균 근점 이각도 정규화해 처리한다', () => {
    const E1 = solveKepler(-1, 0.1);
    const E2 = solveKepler(TAU - 1, 0.1);
    expect(E1).toBeCloseTo(E2, 10);
  });
});

describe('meanAnomalyAt / orbitPhase', () => {
  it('J2000 시점의 평균 근점 이각 = L₀ − ϖ', () => {
    const M = meanAnomalyAt(mercuryLike, 0);
    const expected = ((252.3 - 77.5) * Math.PI) / 180;
    expect(M).toBeCloseTo(expected, 10);
  });

  it('한 주기가 지나면 같은 공전각으로 돌아온다', () => {
    const a = meanAnomalyAt(mercuryLike, 123);
    const b = meanAnomalyAt(mercuryLike, 123 + mercuryLike.periodDays);
    expect(b).toBeCloseTo(a, 8);
  });

  it('반 주기 후에는 π만큼 진행한다', () => {
    const a = meanAnomalyAt(circular, 0);
    const b = meanAnomalyAt(circular, 50);
    expect(b - a).toBeCloseTo(Math.PI, 10);
  });

  it('공전 진행도는 [0,1) 범위', () => {
    for (const t of [-5000, -1, 0, 12.3, 99999]) {
      const p = orbitPhase(mercuryLike, t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });
});

describe('궤도 좌표 변환', () => {
  it('근일점(E=0)에서 거리 = a(1−e), 원일점(E=π)에서 a(1+e)', () => {
    const a = 2;
    const e = 0.3;
    const peri = orbitalPlanePosition(a, e, 0);
    const apo = orbitalPlanePosition(a, e, Math.PI);
    expect(Math.hypot(peri.x, peri.y)).toBeCloseTo(a * (1 - e), 10);
    expect(Math.hypot(apo.x, apo.y)).toBeCloseTo(a * (1 + e), 10);
  });

  it('진근점 이각: E=0 → 0, E=π → π, e=0이면 ν=E', () => {
    expect(eccentricToTrueAnomaly(0, 0.5)).toBeCloseTo(0);
    expect(Math.abs(eccentricToTrueAnomaly(Math.PI, 0.5))).toBeCloseTo(Math.PI);
    expect(eccentricToTrueAnomaly(1.2, 0)).toBeCloseTo(1.2);
  });

  it('회전 변환은 벡터 길이를 보존한다', () => {
    const v = orbitalToEcliptic(0.3, -0.2, mercuryLike);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(Math.hypot(0.3, -0.2), 10);
  });

  it('궤도 경사가 0이면 황도면(z=0)에 머문다', () => {
    const v = orbitalToEcliptic(0.5, 0.5, circular);
    expect(v.z).toBeCloseTo(0);
  });

  it('황도 좌표 → 씬 좌표: z(북)가 y(위)로', () => {
    expect(eclipticToScene({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 3, z: -2 });
  });

  it('positionAt의 거리는 항상 근일점~원일점 사이', () => {
    const { semiMajorAxisAU: a, eccentricity: e } = mercuryLike;
    for (let t = 0; t < 200; t += 7) {
      const r = vectorLength(positionAt(mercuryLike, t));
      expect(r).toBeGreaterThanOrEqual(a * (1 - e) - 1e-9);
      expect(r).toBeLessThanOrEqual(a * (1 + e) + 1e-9);
    }
  });

  it('원 궤도 위치는 반지름 a 원 위에 있다', () => {
    const p = positionAt(circular, 25);
    expect(vectorLength(p)).toBeCloseTo(1, 10);
    // 1/4 주기 → 90° 진행, 위에서 봤을 때 반시계: +x → −z
    expect(p.x).toBeCloseTo(0, 8);
    expect(p.z).toBeCloseTo(-1, 8);
  });

  it('sampleOrbit은 닫힌 경로와 0→1 진행도를 반환한다', () => {
    const s = sampleOrbit(mercuryLike, 64);
    expect(s.points).toHaveLength(65);
    expect(s.phases[0]).toBe(0);
    expect(s.phases[64]).toBe(1);
    expect(s.points[0].x).toBeCloseTo(s.points[64].x, 8);
    expect(s.points[0].z).toBeCloseTo(s.points[64].z, 8);
  });
});
