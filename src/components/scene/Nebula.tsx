import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colors } from '../../styles/tokens';
import { nebulaFragment, nebulaVertex } from './shaders';

interface NebulaProps {
  octaves: number;
}

/**
 * 성운 스카이돔 — 카메라를 감싸는 뒷면 구에 딥 스페이스 그라데이션과 fBm 성운을 그립니다.
 * 가장 먼저(renderOrder -1000), 깊이 테스트 없이 그려져 모든 천체의 배경이 됩니다.
 */
export function Nebula({ octaves }: NebulaProps): JSX.Element {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(950, 48, 24), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nebulaVertex,
        fragmentShader: nebulaFragment,
        uniforms: {
          uBaseA: { value: new THREE.Color(colors.space[900]) },
          uBaseB: { value: new THREE.Color(colors.space[800]) },
          uViolet: { value: new THREE.Color(colors.accent.violet) },
          uCyan: { value: new THREE.Color(colors.accent.cyan) },
          uMagenta: { value: new THREE.Color(colors.accent.magenta) },
          uOctaves: { value: octaves },
          uTime: { value: 0 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    // octaves는 uniform으로만 갱신
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.uniforms.uOctaves.value = octaves;
  }, [octaves, material]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ camera, clock }) => {
    mesh.current?.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1000}
      raycast={() => null}
    />
  );
}
