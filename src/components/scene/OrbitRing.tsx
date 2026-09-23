import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getBody } from '../../data';
import { getBodyRuntime, runtime } from '../../store/runtime';
import { useAppStore } from '../../store/useAppStore';
import { colors, sceneTokens } from '../../styles/tokens';
import type { CelestialBody } from '../../types';
import { sampleOrbit } from '../../utils/kepler';
import { damp } from '../../utils/math';
import { displayDistance, moonDisplayDistance, scaleRadially } from '../../utils/scale';
import { orbitFragment, orbitVertex } from './shaders';

interface OrbitRingProps {
  body: CelestialBody;
  segments: number;
}

/**
 * 궤도선 — 얇고 은은하게(기본 opacity 0.22), 선택된 천체의 궤도만 밝게 강조합니다.
 * 셰이더가 행성 바로 뒤쪽을 더 밝게 칠해 "지나온 길"이 꼬리처럼 보입니다.
 * 궤도 좌표는 AU로 한 번만 샘플링해 두고, 비율 전환 중에만 표시 좌표를 다시 계산합니다.
 */
export function OrbitRing({ body, segments }: OrbitRingProps): JSX.Element | null {
  const orbit = body.orbit;
  const parent = body.parent ? getBody(body.parent) : undefined;
  const group = useRef<THREE.Group>(null);
  const lastMix = useRef(-1);
  const opacity = useRef<number>(sceneTokens.orbitBaseOpacity);
  const highlight = useRef(0);

  const sample = useMemo(() => (orbit ? sampleOrbit(orbit, segments) : null), [orbit, segments]);

  const line = useMemo(() => {
    if (!sample) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sample.points.length * 3), 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(sample.phases), 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: orbitVertex,
      fragmentShader: orbitFragment,
      uniforms: {
        uColor: { value: new THREE.Color(parent ? '#a9b4e8' : '#8fa2f0') },
        uHighlight: { value: new THREE.Color(colors.accent.cyan) },
        uHighlightMix: { value: 0 },
        uOpacity: { value: sceneTokens.orbitBaseOpacity },
        uPhase: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const l = new THREE.Line(geometry, material);
    l.frustumCulled = false;
    l.raycast = () => undefined;
    return l;
  }, [sample, parent]);

  useEffect(
    () => () => {
      if (!line) return;
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame((_, delta) => {
    if (!line || !sample || !orbit) return;
    const mix = runtime.scaleMix;

    // 비율이 바뀌는 동안에만 정점 위치 재계산 (평소에는 비용 0)
    if (mix !== lastMix.current) {
      lastMix.current = mix;
      const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const map = parent
        ? (au: number) => moonDisplayDistance(au, parent, mix)
        : (au: number) => displayDistance(au, mix);
      for (let i = 0; i < sample.points.length; i++) {
        const p = scaleRadially(sample.points[i], map);
        arr[i * 3] = p.x;
        arr[i * 3 + 1] = p.y;
        arr[i * 3 + 2] = p.z;
      }
      attr.needsUpdate = true;
    }

    if (parent && group.current) group.current.position.copy(getBodyRuntime(parent.id).position);

    const { selectedId, hoveredId, showOrbits } = useAppStore.getState();
    const selected = selectedId === body.id;
    const hovered = hoveredId === body.id;
    const target = !showOrbits
      ? selected
        ? sceneTokens.orbitSelectedOpacity * 0.6
        : 0
      : selected
        ? sceneTokens.orbitSelectedOpacity
        : hovered
          ? sceneTokens.orbitHoverOpacity
          : sceneTokens.orbitBaseOpacity;
    opacity.current = damp(opacity.current, target, 6, delta);
    highlight.current = damp(highlight.current, selected || hovered ? 1 : 0, 6, delta);

    const mat = line.material as THREE.ShaderMaterial;
    mat.uniforms.uOpacity.value = opacity.current;
    mat.uniforms.uHighlightMix.value = highlight.current;
    mat.uniforms.uPhase.value = getBodyRuntime(body.id).phase;
    line.visible = opacity.current > 0.004;
  });

  if (!line) return null;
  return (
    <group ref={group}>
      <primitive object={line} />
    </group>
  );
}
