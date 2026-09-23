import { useEffect } from 'react';
import { BODIES } from '../data';
import { useAppStore } from '../store/useAppStore';
import { prepareAllTextures } from '../utils/textures/textureFactory';

/** 로더를 최소 이 시간만큼은 보여줘 애니메이션이 "깜빡"하고 사라지지 않게 합니다. */
const MIN_LOADER_MS = 1400;
/** 텍스처 단계가 전체 진행률에서 차지하는 비율 (나머지는 셰이더 컴파일/첫 프레임) */
export const TEXTURE_PROGRESS_SHARE = 0.88;

let preloadPromise: Promise<void> | null = null;

/**
 * 앱 시작 시 모든 천체 텍스처를 한 번만 준비합니다.
 * (React StrictMode의 이중 effect 실행에도 중복 생성되지 않도록 모듈 단위 Promise로 보호)
 */
export function useTexturePreload(): void {
  useEffect(() => {
    const { setLoading, quality } = useAppStore.getState();
    if (!preloadPromise) {
      const started = performance.now();
      preloadPromise = prepareAllTextures(BODIES, quality, ({ done, total, label }) => {
        setLoading({ progress: (done / total) * TEXTURE_PROGRESS_SHARE, label });
      }).then(async () => {
        const elapsed = performance.now() - started;
        if (elapsed < MIN_LOADER_MS) await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
      });
    }
    let alive = true;
    preloadPromise
      .then(() => {
        if (alive) useAppStore.getState().setLoading({ texturesReady: true, label: '장면 준비 중' });
      })
      .catch((err: unknown) => {
        console.error('[preload] 텍스처 준비 실패 — 단색 구체로 진행합니다.', err);
        if (alive) useAppStore.getState().setLoading({ texturesReady: true });
      });
    return () => {
      alive = false;
    };
  }, []);
}
