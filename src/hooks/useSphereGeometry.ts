import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * 모든 천체가 공유하는 단위 구 지오메트리.
 * 천체마다 새로 만들지 않고 하나를 재사용해 GPU 메모리와 업로드 비용을 줄이고,
 * 세그먼트 수가 바뀌거나 언마운트되면 dispose 합니다.
 */
export function useSphereGeometry(segments: number): THREE.SphereGeometry {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1, segments, Math.round(segments / 2));
    return g;
  }, [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}
