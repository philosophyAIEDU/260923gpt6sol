import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { runtime } from '../../store/runtime';
import { TAU, logLerp } from '../../utils/math';
import { displayDistance } from '../../utils/scale';
import { fbm3, mulberry32 } from '../../utils/textures/noise';

interface AsteroidBeltProps {
  count: number;
}

interface Rock {
  au: number;
  angle0: number;
  periodDays: number;
  inclination: number;
  node: number;
  size: number;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
}

/**
 * 소행성대 (화성–목성 사이, 2.1~3.3 AU) — InstancedMesh 한 번의 드로우콜.
 * 각 소행성은 케플러 제3법칙(P ∝ a^1.5)에 따른 고유 주기로 돌아
 * 안쪽이 바깥쪽보다 빠르게 움직이는 "차등 회전"이 보입니다.
 */
export function AsteroidBelt({ count }: AsteroidBeltProps): JSX.Element {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const lastKey = useRef('');

  const geometry = useMemo(() => {
    // 울퉁불퉁한 암석: 정이십면체 정점을 노이즈로 밀고 당김
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = fbm3(v.x * 1.7 + 3, v.y * 1.7, v.z * 1.7, 3, 5);
      v.multiplyScalar(0.7 + n * 0.6);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const rocks = useMemo<Rock[]>(() => {
    const rand = mulberry32(4242);
    return Array.from({ length: count }, () => {
      // 가우시안 비슷한 분포(2.7AU 부근에 밀집)
      const g = (rand() + rand() + rand()) / 3;
      const au = 2.1 + g * 1.2;
      return {
        au,
        angle0: rand() * TAU,
        periodDays: 365.25 * Math.pow(au, 1.5),
        inclination: (rand() - 0.5) * 0.28,
        node: rand() * TAU,
        size: 0.35 + Math.pow(rand(), 4) * 1.4,
        spinAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spinSpeed: 0.2 + rand() * 1.2,
      };
    });
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const inst = mesh.current;
    if (!inst) return;
    const key = `${runtime.simDays.toFixed(3)}|${runtime.scaleMix.toFixed(4)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    const mix = runtime.scaleMix;
    // 학습용 0.08 → 실제 비율에서는 사실상 보이지 않는 크기로 (로그 보간)
    const baseSize = logLerp(0.08, 0.0008, mix);
    for (let i = 0; i < rocks.length; i++) {
      const r = rocks[i];
      const theta = r.angle0 + (TAU * runtime.simDays) / r.periodDays;
      const d = displayDistance(r.au, mix);
      p.set(d * Math.cos(theta), d * Math.sin(r.inclination) * Math.sin(theta - r.node), -d * Math.sin(theta));
      q.setFromAxisAngle(r.spinAxis, runtime.elapsed * r.spinSpeed + i);
      s.setScalar(baseSize * r.size);
      m.compose(p, q, s);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      raycast={() => null}
    >
      <meshStandardMaterial color="#8d8474" roughness={0.95} metalness={0} />
    </instancedMesh>
  );
}
