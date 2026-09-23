import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../utils/textures/noise';
import { starFragment, starVertex } from './shaders';

interface StarFieldProps {
  count: number;
}

/** 분광형별 대표 색 (O/B형 청백색 → M형 주황색). 가중치는 흰색 계열이 많도록 */
const STAR_COLORS: ReadonlyArray<[string, number]> = [
  ['#9bb0ff', 0.08],
  ['#aabfff', 0.12],
  ['#cad7ff', 0.18],
  ['#f8f7ff', 0.3],
  ['#fff4ea', 0.17],
  ['#ffd2a1', 0.1],
  ['#ffcc6f', 0.05],
];

const RADIUS = 900;

function pickColor(r: number): string {
  let acc = 0;
  for (const [c, w] of STAR_COLORS) {
    acc += w;
    if (r <= acc) return c;
  }
  return STAR_COLORS[3][0];
}

/**
 * 배경 별 — 단일 Points 드로우콜로 수천 개를 렌더링합니다.
 * 카메라를 따라다니는 스카이박스처럼 동작해(무한히 먼 배경), 실제 비율 모드에서도 시차가 생기지 않습니다.
 * 35%의 별은 은하수 띠 근처에 모아 성운 스카이돔과 자연스럽게 겹치게 합니다.
 */
export function StarField({ count }: StarFieldProps): JSX.Element {
  const points = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const rand = mulberry32(20240922);
    const positions = new Float32Array(count * 3);
    const colorsArr = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const bright = new Float32Array(count);
    const phases = new Float32Array(count);
    const galNormal = new THREE.Vector3(0.35, 0.82, 0.45).normalize();
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // 구 표면 균등 분포
      const z = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(phi), z, s * Math.sin(phi));
      if (rand() < 0.35) {
        // 은하면 쪽으로 끌어당김
        const d = v.dot(galNormal);
        v.addScaledVector(galNormal, -d * (0.75 + rand() * 0.2)).normalize();
      }
      positions.set([v.x * RADIUS, v.y * RADIUS, v.z * RADIUS], i * 3);
      c.set(pickColor(rand()));
      colorsArr.set([c.r, c.g, c.b], i * 3);
      const big = rand();
      sizes[i] = big > 0.985 ? 3.2 + rand() * 1.6 : big > 0.9 ? 2 + rand() : 0.9 + rand() * 0.9;
      // 소수의 밝은 별은 HDR(>1) 밝기 → Bloom에 걸려 은은히 번짐
      bright[i] = big > 0.985 ? 1.6 + rand() * 0.8 : 0.25 + Math.pow(rand(), 2.2) * 0.9;
      phases[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(colorsArr, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aBright', new THREE.BufferAttribute(bright, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: false,
      }),
    [],
  );

  useEffect(() => {
    material.uniforms.uPixelRatio.value = dpr;
  }, [dpr, material]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ camera, clock }) => {
    if (!points.current) return;
    points.current.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-999}
      raycast={() => null}
    />
  );
}
