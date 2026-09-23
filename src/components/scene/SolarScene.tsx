import { PerformanceMonitor } from '@react-three/drei';
import { useEffect } from 'react';
import { BODIES, SUN } from '../../data';
import { useSphereGeometry } from '../../hooks/useSphereGeometry';
import { useAppStore } from '../../store/useAppStore';
import { QUALITY_PROFILES } from '../../utils/quality';
import { disposeAllTextures } from '../../utils/textures/textureFactory';
import { AsteroidBelt } from './AsteroidBelt';
import { BodyLabel } from './BodyLabel';
import { CameraRig } from './CameraRig';
import { Nebula } from './Nebula';
import { OrbitRing } from './OrbitRing';
import { Planet } from './Planet';
import { PostProcessing } from './PostProcessing';
import { SelectionIndicator } from './SelectionIndicator';
import { SimulationDriver } from './SimulationDriver';
import { StarField } from './StarField';
import { Sun } from './Sun';

const NON_STAR_BODIES = BODIES.filter((b) => b.type !== 'star');

/** 3D 씬 루트 — Canvas 내부에 마운트됩니다. */
export function SolarScene(): JSX.Element {
  const quality = useAppStore((s) => s.quality);
  const degradeQuality = useAppStore((s) => s.degradeQuality);
  const profile = QUALITY_PROFILES[quality];
  const sphere = useSphereGeometry(profile.sphereSegments);

  // 씬이 완전히 사라질 때 캐시된 텍스처의 GPU 메모리 해제
  useEffect(() => () => disposeAllTextures(), []);

  return (
    <>
      <SimulationDriver />
      <PerformanceMonitor onDecline={degradeQuality} flipflops={2} bounds={() => [42, 58]} />

      <Nebula octaves={profile.nebulaOctaves} />
      <StarField count={profile.starCount} />

      <ambientLight intensity={0.05} color="#6b7bb8" />
      <hemisphereLight args={['#2a3160', '#050510', 0.12]} />

      <Sun geometry={sphere} />
      <SelectionIndicator bodyId={SUN.id} />
      <BodyLabel body={SUN} />

      {NON_STAR_BODIES.map((body) => (
        <group key={body.id}>
          <OrbitRing body={body} segments={body.parent ? 128 : profile.orbitSegments} />
          <Planet body={body} geometry={sphere} segments={profile.sphereSegments} />
          <SelectionIndicator bodyId={body.id} />
          <BodyLabel body={body} />
        </group>
      ))}

      <AsteroidBelt count={profile.asteroidCount} />
      <CameraRig />
      {profile.postprocessing && <PostProcessing profile={profile} />}
    </>
  );
}
