/**
 * 카메라 포커스 훅 — 이징이 적용된 시네마틱 카메라 이동과 공전 추적.
 *
 * 상태 머신
 *   waiting    : 로딩 화면이 사라지기 전. 멀리서 대기
 *   transition : from → to 로 easeInOut 보간 중 (사용자 조작 잠금)
 *   tracking   : 선택된 천체를 따라감 — 천체가 이동한 만큼(Δ) 카메라도 평행이동해
 *                사용자가 돌려놓은 시점(각도/거리)을 유지한 채 추적합니다.
 *   free       : 전체 조망 상태, OrbitControls 자유 조작
 *
 * 이동 중 목적지는 "매 프레임 현재 천체 위치 + 오프셋"으로 다시 계산하므로
 * 고배속으로 행성이 빠르게 움직여도 도착 순간에 정확히 붙습니다.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getBody } from '../data';
import { getBodyRuntime, runtime } from '../store/runtime';
import { useAppStore } from '../store/useAppStore';
import { sceneTokens } from '../styles/tokens';
import { easeInOutCubic, easeInOutQuint, type EasingFn } from '../utils/easing';
import { displayRadius, overviewCamera } from '../utils/scale';

type Mode = 'waiting' | 'transition' | 'tracking' | 'free';

interface FocusState {
  mode: Mode;
  t: number;
  duration: number;
  easing: EasingFn;
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  targetId: string | null;
  offsetDir: THREE.Vector3;
  distance: number;
  lastTargetPos: THREE.Vector3;
  lastToken: number;
  arc: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmpTarget = new THREE.Vector3();
const tmpDest = new THREE.Vector3();
const tmpDelta = new THREE.Vector3();
const tmpSide = new THREE.Vector3();

/** 천체 크기에 따른 적정 관측 거리 배수 */
function viewDistanceFactor(bodyId: string): number {
  const body = getBody(bodyId);
  if (!body) return 5;
  if (body.type === 'star') return 4.2;
  if (body.ring) return 6.2;
  return 4.4;
}

/**
 * 관측 방향: 태양 쪽에서 약간 비스듬히 바라보도록(3/4 위상) 설정해
 * 행성의 밝은 면과 명암 경계선(terminator)이 함께 보이게 합니다.
 */
function computeOffsetDir(targetPos: THREE.Vector3, camera: THREE.Camera, isStar: boolean, out: THREE.Vector3): void {
  if (isStar || targetPos.lengthSq() < 1e-8) {
    out.copy(camera.position).sub(targetPos).normalize();
    out.y = Math.max(out.y, 0.25);
    out.normalize();
    return;
  }
  const toSun = tmpDelta.copy(targetPos).negate().normalize();
  tmpSide.crossVectors(UP, toSun).normalize();
  out.copy(toSun).multiplyScalar(0.72).addScaledVector(tmpSide, 0.62).addScaledVector(UP, 0.32).normalize();
}

export function useCameraFocus(controlsRef: RefObject<OrbitControlsImpl>): void {
  const camera = useThree((s) => s.camera);
  const state = useRef<FocusState>({
    mode: 'waiting',
    t: 0,
    duration: sceneTokens.cameraTransitionSec,
    easing: easeInOutCubic,
    fromPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    targetId: null,
    offsetDir: new THREE.Vector3(0, 0.4, 1).normalize(),
    distance: 10,
    lastTargetPos: new THREE.Vector3(),
    lastToken: -1,
    arc: 0,
  });

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const st = state.current;
    const app = useAppStore.getState();
    const finalMix = app.scaleMode === 'real' ? 1 : 0;

    // 로딩 화면이 걷힐 때까지 대기 → 이후 인트로 비행 시작
    if (st.mode === 'waiting') {
      controls.enabled = false;
      if (!app.loading.sceneReady) return;
      st.lastToken = app.focusToken - 1; // 아래에서 인트로 트랜지션을 시작하도록
    }

    if (app.focusToken !== st.lastToken) {
      const isIntro = st.mode === 'waiting';
      st.lastToken = app.focusToken;
      st.targetId = app.selectedId;
      st.fromPos.copy(camera.position);
      st.fromTarget.copy(controls.target);
      st.t = 0;
      st.duration = isIntro ? sceneTokens.introTransitionSec : sceneTokens.cameraTransitionSec;
      st.easing = isIntro ? easeInOutQuint : easeInOutCubic;
      if (st.targetId) {
        const body = getBody(st.targetId);
        const pos = getBodyRuntime(st.targetId).position;
        computeOffsetDir(pos, camera, body?.type === 'star', st.offsetDir);
        const finalRadius = body ? displayRadius(body, finalMix) : 1;
        st.distance = finalRadius * viewDistanceFactor(st.targetId);
        st.lastTargetPos.copy(pos);
      }
      st.arc = isIntro ? 0 : 0.14;
      st.mode = 'transition';
      controls.enabled = false;
    }

    if (st.mode === 'transition') {
      st.t = Math.min(1, st.t + Math.min(delta, 0.1) / st.duration);
      const e = st.easing(st.t);

      if (st.targetId) {
        tmpTarget.copy(getBodyRuntime(st.targetId).position);
        tmpDest.copy(tmpTarget).addScaledVector(st.offsetDir, st.distance);
      } else {
        const ov = overviewCamera(finalMix);
        tmpTarget.set(ov.target.x, ov.target.y, ov.target.z);
        tmpDest.set(ov.position.x, ov.position.y, ov.position.z);
      }

      // 위치는 보간 + 중간에 살짝 떠오르는 호(arc)를 더해 영화 같은 궤적을 만듭니다.
      const travel = st.fromPos.distanceTo(tmpDest);
      camera.position.lerpVectors(st.fromPos, tmpDest, e);
      camera.position.addScaledVector(UP, Math.sin(Math.PI * e) * travel * st.arc);
      controls.target.lerpVectors(st.fromTarget, tmpTarget, e);
      camera.lookAt(controls.target);

      if (st.t >= 1) {
        st.mode = st.targetId ? 'tracking' : 'free';
        st.lastTargetPos.copy(tmpTarget);
        controls.enabled = true;
      }
    } else if (st.mode === 'tracking' && st.targetId) {
      const pos = getBodyRuntime(st.targetId).position;
      tmpDelta.subVectors(pos, st.lastTargetPos);
      camera.position.add(tmpDelta);
      controls.target.copy(pos);
      st.lastTargetPos.copy(pos);
      camera.lookAt(controls.target);
    }

    // 줌 한계: 천체 표면을 뚫고 들어가지 않도록
    const focusRadius = st.targetId ? getBodyRuntime(st.targetId).radius : 0;
    controls.minDistance = st.targetId ? Math.max(focusRadius * 1.35, 0.002) : 1;
    controls.maxDistance = 9000;
    controls.enablePan = st.mode === 'free';
    // 줌 속도를 거리에 맞게 (실제 비율에서 미세 조정 가능하도록)
    controls.zoomSpeed = runtime.scaleMix > 0.5 ? 1.1 : 0.8;
    // 우선순위 -1: OrbitControls.update()(-1, 먼저 등록됨) 직후, 천체/이름표 컴포넌트(0)보다 먼저 실행
  }, -1);
}
