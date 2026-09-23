import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SUN } from '../../data';
import { getBodyRuntime } from '../../store/runtime';
import { useAppStore } from '../../store/useAppStore';
import { damp } from '../../utils/math';
import { getBodyTextures, getGlowTexture } from '../../utils/textures/textureFactory';

interface SunProps {
  geometry: THREE.SphereGeometry;
}

interface CoronaLayer {
  color: string;
  falloff: number;
  /** 반지름 대비 크기 */
  size: number;
  /** 카메라 거리 대비 최소 크기 — 멀리서도 태양이 "빛나는 점"으로 보이게 */
  minScreen: number;
  opacity: number;
  /** HDR 밝기 (1 초과 → Bloom 대상) */
  intensity: number;
}

const CORONA: readonly CoronaLayer[] = [
  { color: '#ffe3a3', falloff: 3.0, size: 2.9, minScreen: 0.03, opacity: 0.9, intensity: 2.0 },
  { color: '#ffa53d', falloff: 1.9, size: 6.5, minScreen: 0.07, opacity: 0.5, intensity: 1.5 },
  { color: '#ff8a2a', falloff: 1.7, size: 14, minScreen: 0.12, opacity: 0.08, intensity: 1.0 },
];

/**
 * 태양 — emissive 머티리얼(HDR 밝기 > 1)이 Bloom 후처리와 만나 실제로 빛이 번지는 느낌을 냅니다.
 *  - 표면: 절차적 쌀알 무늬(granulation) 텍스처를 emissiveMap으로 사용
 *  - 대류층: 같은 텍스처를 반대로 회전시킨 반투명 셸을 겹쳐 표면이 "끓는" 듯한 움직임
 *  - 코로나: 가산 혼합(additive) 스프라이트 3겹
 *  - 광원: 감쇠 없는 PointLight (학습용 비율에서 먼 행성도 충분히 밝도록)
 */
export function Sun({ geometry }: SunProps): JSX.Element {
  const scaleGroup = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const convection = useRef<THREE.Mesh>(null);
  const coronaRefs = useRef<Array<THREE.Sprite | null>>([]);
  const surfaceMat = useRef<THREE.MeshStandardMaterial>(null);
  const hoverGlow = useRef(0);

  const select = useAppStore((s) => s.select);
  const hover = useAppStore((s) => s.hover);

  const textures = useMemo(() => getBodyTextures(SUN.id), []);
  const coronaTextures = useMemo(() => CORONA.map((c) => getGlowTexture(c.color, c.falloff)), []);
  const coronaColors = useMemo(
    () => CORONA.map((c) => new THREE.Color(c.color).multiplyScalar(c.intensity)),
    [],
  );

  useFrame(({ camera, clock }, delta) => {
    const rt = getBodyRuntime(SUN.id);
    scaleGroup.current?.scale.setScalar(rt.radius);
    if (surface.current) surface.current.rotation.y = rt.spin + clock.elapsedTime * 0.01;
    if (convection.current) {
      convection.current.rotation.y = -clock.elapsedTime * 0.018;
      convection.current.rotation.x = clock.elapsedTime * 0.007;
    }
    const hovered = useAppStore.getState().hoveredId === SUN.id;
    hoverGlow.current = damp(hoverGlow.current, hovered ? 1 : 0, 10, delta);
    // 은은한 맥동 + 호버 시 밝기 상승
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    if (surfaceMat.current) surfaceMat.current.emissiveIntensity = (1.55 + hoverGlow.current * 0.6) * pulse;

    const dist = camera.position.length();
    CORONA.forEach((layer, i) => {
      const sprite = coronaRefs.current[i];
      if (!sprite) return;
      const s = Math.max(rt.radius * layer.size, dist * layer.minScreen) * (1 + Math.sin(clock.elapsedTime * 0.5 + i) * 0.025);
      sprite.scale.set(s, s, 1);
    });
  });

  const handleClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    if (e.delta > 6) return;
    select(SUN.id);
  };

  return (
    <group name="sun">
      <pointLight position={[0, 0, 0]} intensity={2.8} decay={0} distance={0} color="#fff4e0" />
      <group ref={scaleGroup}>
        <mesh
          ref={surface}
          geometry={geometry}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover(SUN.id);
          }}
          onPointerOut={() => {
            if (useAppStore.getState().hoveredId === SUN.id) hover(null);
          }}
        >
          <meshStandardMaterial
            ref={surfaceMat}
            color="#000000"
            emissive={textures.map ? '#ffffff' : SUN.color}
            emissiveMap={textures.map}
            emissiveIntensity={1.55}
            roughness={1}
            metalness={0}
          />
        </mesh>
        <mesh ref={convection} geometry={geometry} scale={1.006} raycast={() => null}>
          <meshBasicMaterial
            map={textures.map}
            color={new THREE.Color('#ffb347').multiplyScalar(0.9)}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      {CORONA.map((layer, i) => (
        <sprite
          key={layer.color}
          ref={(el) => {
            coronaRefs.current[i] = el;
          }}
          raycast={() => null}
          renderOrder={-1}
        >
          <spriteMaterial
            map={coronaTextures[i]}
            color={coronaColors[i]}
            transparent
            opacity={layer.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
