import { useEffect, useState } from 'react';

/** requestAnimationFrame 기반 FPS 측정 (0.5초마다 갱신) */
export function useFps(enabled: boolean): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number): void => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return fps;
}
