/**
 * 시뮬레이션 구동 훅 — 매 프레임 한 번, 모든 천체의 위치/크기/자전 각도를 계산해 runtime에 기록합니다.
 *
 * 우선순위 -2로 실행되어 OrbitControls(-1), 카메라 리그·천체 컴포넌트(0)보다 먼저 돕니다.
 * 덕분에 카메라가 행성을 추적할 때 "한 프레임 늦은 위치"를 읽어 떨리는 현상이 없습니다.
 */
import { useFrame } from '@react-three/fiber';
import { BODIES, getBody } from '../data';
import { getBodyRuntime, runtime } from '../store/runtime';
import { useAppStore } from '../store/useAppStore';
import type { CelestialBody } from '../types';
import { easeInOutCubic } from '../utils/easing';
import { meanAnomalyAt, positionAtMeanAnomaly } from '../utils/kepler';
import { TAU } from '../utils/math';
import { displayDistance, displayRadius, advanceScaleProgress, moonDisplayDistance, scaleRadially } from '../utils/scale';
import { advanceSimDays, clampDelta, speedFromIndex, spinIncrement } from '../utils/time';

/** 모천체가 먼저 계산되도록 정렬 (태양 → 행성 → 위성) */
const UPDATE_ORDER: readonly CelestialBody[] = [...BODIES].sort((a, b) => {
  const rank = (x: CelestialBody): number => (x.type === 'star' ? 0 : x.parent === null ? 1 : 2);
  return rank(a) - rank(b);
});

export function updateBodies(deltaSec: number, speed: number): void {
  const mix = runtime.scaleMix;
  const t = runtime.simDays;
  for (const body of UPDATE_ORDER) {
    const r = getBodyRuntime(body.id);
    r.radius = displayRadius(body, mix);

    if (!body.orbit) {
      r.position.set(0, 0, 0);
      r.spin += spinIncrement(body.rotationPeriodHours, deltaSec, speed);
      continue;
    }

    const M = meanAnomalyAt(body.orbit, t);
    r.phase = M / TAU;
    const rel = positionAtMeanAnomaly(body.orbit, M);
    const parent = body.parent ? getBody(body.parent) : undefined;

    if (parent) {
      // 위성: 모행성 기준 상대 위치를 위성 전용 스케일로 변환 후 모행성 위치에 더함
      const scaled = scaleRadially(rel, (au) => moonDisplayDistance(au, parent, mix));
      const p = getBodyRuntime(parent.id).position;
      r.position.set(p.x + scaled.x, p.y + scaled.y, p.z + scaled.z);
    } else {
      const scaled = scaleRadially(rel, (au) => displayDistance(au, mix));
      r.position.set(scaled.x, scaled.y, scaled.z);
    }

    if (body.tidallyLocked) {
      // 조석 고정: 항상 같은 면(+x)이 모천체를 향하도록 공전 각도에서 자전 각도를 직접 계산
      r.spin = Math.atan2(rel.z, -rel.x);
    } else {
      r.spin += spinIncrement(body.rotationPeriodHours, deltaSec, speed);
    }
  }
}

export function useOrbitAnimation(): void {
  useFrame((_, delta) => {
    const state = useAppStore.getState();
    const speed = speedFromIndex(state.speedIndex);
    const dt = clampDelta(delta);
    runtime.elapsed += dt;
    runtime.simDays = advanceSimDays(runtime.simDays, dt, speed);
    runtime.scaleProgress = advanceScaleProgress(runtime.scaleProgress, state.scaleMode === 'real' ? 1 : 0, dt);
    runtime.scaleMix = easeInOutCubic(runtime.scaleProgress);
    updateBodies(dt, speed);
  }, -2);
}
