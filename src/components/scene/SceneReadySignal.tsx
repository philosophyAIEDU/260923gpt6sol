import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TEXTURE_PROGRESS_SHARE } from '../../hooks/useTexturePreload';

/** 셰이더 컴파일이 끝나고 몇 프레임이 실제로 그려진 뒤에 로더를 걷어냅니다 (첫 프레임 버벅임 숨김). */
const FRAMES_BEFORE_READY = 12;

export function SceneReadySignal(): null {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > FRAMES_BEFORE_READY) return;
    frames.current += 1;
    const { setLoading } = useAppStore.getState();
    const share = 1 - TEXTURE_PROGRESS_SHARE;
    setLoading({ progress: TEXTURE_PROGRESS_SHARE + (share * frames.current) / FRAMES_BEFORE_READY });
    if (frames.current === FRAMES_BEFORE_READY) {
      window.setTimeout(() => useAppStore.getState().setLoading({ sceneReady: true }), 250);
    }
  });
  return null;
}
