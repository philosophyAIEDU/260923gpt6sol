import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraFocus } from '../../hooks/useCameraFocus';

/**
 * 카메라 조작: OrbitControls(감쇠 활성화) + 포커스/추적 훅.
 * dampingFactor를 낮게 두어 손을 뗀 뒤에도 부드럽게 미끄러지듯 멈춥니다.
 */
export function CameraRig(): JSX.Element {
  const controls = useRef<OrbitControlsImpl>(null);
  useCameraFocus(controls);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.6}
      minDistance={1}
      maxDistance={9000}
    />
  );
}
