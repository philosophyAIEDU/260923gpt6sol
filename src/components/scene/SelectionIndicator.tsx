import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getBodyRuntime } from '../../store/runtime';
import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../styles/tokens';
import { damp } from '../../utils/math';

interface SelectionIndicatorProps {
  bodyId: string;
}

/**
 * 선택/호버 링 — 항상 카메라를 향하는 얇은 원.
 * 크기는 max(천체 반지름 × 1.5, 화면상 최소 크기)로 계산해,
 * 실제 비율 모드에서 행성이 점보다 작아도 링으로 위치를 알 수 있게 합니다.
 */
export function SelectionIndicator({ bodyId }: SelectionIndicatorProps): JSX.Element {
  const group = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Mesh>(null);
  const opacity = useRef(0);
  const innerGeo = useMemo(() => new THREE.RingGeometry(0.975, 1, 128), []);
  const outerGeo = useMemo(() => new THREE.RingGeometry(1.14, 1.15, 128, 1, 0, Math.PI * 1.6), []);
  const innerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent.cyan).multiplyScalar(1.4),
        transparent: true,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      }),
    [],
  );
  const outerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent.violet).multiplyScalar(1.3),
        transparent: true,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      }),
    [],
  );
  const hoverColor = useMemo(() => new THREE.Color(colors.accent.violet).multiplyScalar(1.3), []);
  const selectColor = useMemo(() => new THREE.Color(colors.accent.cyan).multiplyScalar(1.4), []);

  useEffect(
    () => () => {
      innerGeo.dispose();
      outerGeo.dispose();
      innerMat.dispose();
      outerMat.dispose();
    },
    [innerGeo, outerGeo, innerMat, outerMat],
  );

  useFrame(({ camera, clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const { selectedId, hoveredId } = useAppStore.getState();
    const selected = selectedId === bodyId;
    const hovered = hoveredId === bodyId;
    const rt = getBodyRuntime(bodyId);
    const dist = camera.position.distanceTo(rt.position);
    // 천체가 화면을 크게 채울 만큼 가까우면 링은 역할(위치 표시)을 다했으므로 사라집니다.
    const near = dist < rt.radius * 9;
    const target = near ? 0 : selected ? 0.85 : hovered ? 0.5 : 0;
    opacity.current = damp(opacity.current, target, 10, delta);
    const visible = opacity.current > 0.01;
    g.visible = visible;
    if (!visible) return;

    g.position.copy(rt.position);
    const pulse = selected ? 1 + Math.sin(clock.elapsedTime * 2.4) * 0.03 : 1;
    const s = Math.max(rt.radius * 1.55, dist * 0.016) * pulse;
    g.scale.setScalar(s);
    innerMat.color.copy(selected ? selectColor : hoverColor);
    innerMat.opacity = opacity.current * (selected ? 0.9 : 0.8);
    outerMat.opacity = opacity.current * 0.55;
    if (outer.current) outer.current.rotation.z += delta * 0.6;
  });

  return (
    <group ref={group} visible={false}>
      <Billboard>
        <mesh geometry={innerGeo} material={innerMat} raycast={() => null} renderOrder={10} />
        <mesh ref={outer} geometry={outerGeo} material={outerMat} raycast={() => null} renderOrder={10} />
      </Billboard>
    </group>
  );
}
