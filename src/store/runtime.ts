/**
 * 프레임 단위로 바뀌는 "뜨거운" 상태 — React 상태가 아닌 일반 객체로 관리합니다.
 *
 * 시뮬레이션 시각·천체 위치는 초당 60번 바뀌므로 Zustand/React state에 넣으면
 * 매 프레임 리렌더가 발생해 고배속에서 UI가 버벅입니다.
 * 3D 컴포넌트는 useFrame 안에서 이 객체를 직접 읽고, UI는 필요한 값만 낮은 빈도로 샘플링합니다.
 */
import * as THREE from 'three';
import { dateToSimDays } from '../utils/time';

export interface BodyRuntime {
  /** 월드 좌표 (씬 단위) */
  position: THREE.Vector3;
  /** 현재 표시 반지름 (씬 단위) */
  radius: number;
  /** 공전 진행도 [0,1) */
  phase: number;
  /** 누적 자전 각도 (rad) */
  spin: number;
}

export interface Runtime {
  simDays: number;
  /** 비율 전환 선형 진행도 (0 = 학습용, 1 = 실제) */
  scaleProgress: number;
  /** 이징이 적용된 비율 혼합값 — 실제 크기/거리 계산에 사용 */
  scaleMix: number;
  bodies: Map<string, BodyRuntime>;
  elapsed: number;
}

export const runtime: Runtime = {
  simDays: dateToSimDays(new Date()),
  scaleProgress: 0,
  scaleMix: 0,
  bodies: new Map(),
  elapsed: 0,
};

export function getBodyRuntime(id: string): BodyRuntime {
  let r = runtime.bodies.get(id);
  if (!r) {
    r = { position: new THREE.Vector3(), radius: 1, phase: 0, spin: 0 };
    runtime.bodies.set(id, r);
  }
  return r;
}

export function resetSimTimeToNow(): void {
  runtime.simDays = dateToSimDays(new Date());
}
