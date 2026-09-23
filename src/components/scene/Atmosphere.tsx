import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { AtmosphereSpec } from '../../types';
import { atmosphereFragment, atmosphereVertex } from './shaders';

interface AtmosphereProps {
  spec: AtmosphereSpec;
  geometry: THREE.BufferGeometry;
}

function makeMaterial(spec: AtmosphereSpec, halo: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    uniforms: {
      uColor: { value: new THREE.Color(spec.color) },
      uIntensity: { value: spec.intensity * (halo ? 0.85 : 1.1) },
      uPower: { value: halo ? 1.6 : 2.8 },
      uHalo: { value: halo ? 1 : 0 },
    },
    side: halo ? THREE.BackSide : THREE.FrontSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * 대기 글로우 — 두 겹의 프레넬 셸.
 *  1) 앞면 림: 행성 가장자리를 따라 얇게 빛나는 대기층
 *  2) 뒷면 헤일로: 행성 윤곽 바깥으로 은은하게 번지는 빛
 * 부모 그룹이 반지름만큼 스케일되므로 여기서는 단위 구 기준 배율만 지정합니다.
 */
export function Atmosphere({ spec, geometry }: AtmosphereProps): JSX.Element {
  const rim = useMemo(() => makeMaterial(spec, false), [spec]);
  const halo = useMemo(() => makeMaterial(spec, true), [spec]);

  useEffect(
    () => () => {
      rim.dispose();
      halo.dispose();
    },
    [rim, halo],
  );

  return (
    <group>
      <mesh geometry={geometry} material={rim} scale={1.015} raycast={() => null} renderOrder={2} />
      <mesh geometry={geometry} material={halo} scale={1.12} raycast={() => null} renderOrder={1} />
    </group>
  );
}
