import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { RingSpec } from '../../types';
import { getRingTexture } from '../../utils/textures/textureFactory';

interface PlanetRingProps {
  bodyId: string;
  spec: RingSpec;
  seed: number;
  segments: number;
}

/**
 * 행성 고리. RingGeometry의 기본 UV는 평면 투영이라 고리 결이 휘어 보이므로,
 * 각 정점의 "중심으로부터 거리"를 u좌표로 다시 매핑해 동심원 무늬가 되도록 합니다.
 */
export function PlanetRing({ bodyId, spec, seed, segments }: PlanetRingProps): JSX.Element {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(spec.inner, spec.outer, segments * 2, 4);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const u = (v.length() - spec.inner) / (spec.outer - spec.inner);
      uv.setXY(i, u, 0.5);
    }
    uv.needsUpdate = true;
    return g;
  }, [spec, segments]);

  const texture = useMemo(() => getRingTexture(bodyId, spec, seed), [bodyId, spec, seed]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} raycast={() => null} renderOrder={3}>
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={spec.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={1}
        metalness={0}
        emissive="#f2e6c9"
        emissiveMap={texture}
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}
