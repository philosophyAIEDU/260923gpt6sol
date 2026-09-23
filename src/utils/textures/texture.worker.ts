/// <reference lib="webworker" />
/**
 * 텍스처 생성 워커 — 무거운 노이즈 계산을 메인 스레드 밖에서 수행해
 * 로딩 중에도 로더 애니메이션이 60fps로 부드럽게 돌아가게 합니다.
 */
import type { TextureSpec } from '../../types';
import { bumpToNormalMap, generateSurface } from './generators';

export interface SurfaceRequest {
  jobId: number;
  spec: TextureSpec;
  width: number;
  height: number;
}

export interface SurfaceResponse {
  jobId: number;
  ok: boolean;
  error?: string;
  width: number;
  height: number;
  color?: Uint8Array;
  normal?: Uint8Array | null;
  clouds?: Uint8Array | null;
}

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<SurfaceRequest>) => {
  const { jobId, spec, width, height } = event.data;
  try {
    const surface = generateSurface(spec, width, height);
    const normal =
      surface.normalStrength > 0 ? bumpToNormalMap(surface.bump, width, height, surface.normalStrength) : null;
    const response: SurfaceResponse = {
      jobId,
      ok: true,
      width,
      height,
      color: surface.color,
      normal,
      clouds: surface.clouds,
    };
    const transfer: Transferable[] = [surface.color.buffer];
    if (normal) transfer.push(normal.buffer);
    if (surface.clouds) transfer.push(surface.clouds.buffer);
    self.postMessage(response, transfer);
  } catch (err) {
    const response: SurfaceResponse = {
      jobId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      width,
      height,
    };
    self.postMessage(response);
  }
};
