import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getBodyRuntime } from '../../store/runtime';
import { useAppStore } from '../../store/useAppStore';
import type { CelestialBody } from '../../types';
import { DEG2RAD, damp } from '../../utils/math';
import { getBodyTextures } from '../../utils/textures/textureFactory';
import { Atmosphere } from './Atmosphere';
import { PlanetRing } from './PlanetRing';

interface PlanetProps {
  body: CelestialBody;
  geometry: THREE.SphereGeometry;
  segments: number;
}

/** 드래그(카메라 회전) 후 손을 뗀 것을 클릭으로 오인하지 않기 위한 임계값(px) */
const CLICK_DRAG_THRESHOLD = 6;

/**
 * 행성/위성 컴포넌트.
 *
 * 계층 구조
 *   root (월드 위치 = runtime.position)
 *   └ scaleGroup (scale = 표시 반지름) — 비율 전환 시 이 값만 바뀜
 *     ├ tiltGroup (자전축 기울기, 공간에 고정)
 *     │  ├ surface mesh (자전 = rotation.y)
 *     │  ├ clouds mesh (지구만, 표면보다 조금 빠르게 회전)
 *     │  └ ring (적도면)
 *     └ atmosphere (프레넬 글로우)
 */
export function Planet({ body, geometry, segments }: PlanetProps): JSX.Element {
  const root = useRef<THREE.Group>(null);
  const scaleGroup = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const hoverGlow = useRef(0);

  const select = useAppStore((s) => s.select);
  const hover = useAppStore((s) => s.hover);

  const textures = useMemo(() => getBodyTextures(body.id), [body.id]);
  const isFallback = textures.source === 'fallback';
  const emissiveColor = useMemo(() => new THREE.Color(body.color), [body.color]);
  const normalScale = useMemo(() => new THREE.Vector2(1, 1), []);

  useFrame((_, delta) => {
    const rt = getBodyRuntime(body.id);
    root.current?.position.copy(rt.position);
    scaleGroup.current?.scale.setScalar(rt.radius);
    if (surface.current) surface.current.rotation.y = rt.spin;
    if (clouds.current) clouds.current.rotation.y = rt.spin * 1.12 + 0.4;

    // 호버 시 표면이 살짝 밝아지는 미세한 glow
    const hovered = useAppStore.getState().hoveredId === body.id;
    hoverGlow.current = damp(hoverGlow.current, hovered ? 1 : 0, 12, delta);
    if (material.current) material.current.emissiveIntensity = 0.02 + hoverGlow.current * 0.14;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    if (e.delta > CLICK_DRAG_THRESHOLD) return;
    select(body.id);
  };

  const handleOver = (e: ThreeEvent<PointerEvent>): void => {
    e.stopPropagation();
    hover(body.id);
  };

  const handleOut = (): void => {
    if (useAppStore.getState().hoveredId === body.id) hover(null);
  };

  const roughness = body.type === 'gas-giant' || body.type === 'ice-giant' ? 0.95 : 0.88;

  return (
    <group ref={root} name={body.id}>
      <group ref={scaleGroup}>
        <group rotation-z={body.axialTiltDeg * DEG2RAD}>
          <mesh
            ref={surface}
            geometry={geometry}
            onClick={handleClick}
            onPointerOver={handleOver}
            onPointerOut={handleOut}
          >
            <meshStandardMaterial
              ref={material}
              map={textures.map}
              normalMap={textures.normalMap}
              normalScale={normalScale}
              color={isFallback ? body.color : '#ffffff'}
              roughness={roughness}
              metalness={0}
              emissive={emissiveColor}
              emissiveIntensity={0.02}
            />
          </mesh>
          {textures.clouds && (
            <mesh ref={clouds} geometry={geometry} scale={1.012} raycast={() => null}>
              <meshStandardMaterial
                map={textures.clouds}
                transparent
                depthWrite={false}
                roughness={1}
                metalness={0}
              />
            </mesh>
          )}
          {body.ring && <PlanetRing bodyId={body.id} spec={body.ring} seed={body.texture.seed} segments={segments} />}
        </group>
        {body.atmosphere && <Atmosphere spec={body.atmosphere} geometry={geometry} />}
      </group>
    </group>
  );
}
