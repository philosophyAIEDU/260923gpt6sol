/**
 * 텍스처 팩토리 — 천체별 텍스처를 준비하고 캐시/해제(dispose)를 관리합니다.
 *
 * 우선순위 (에러 핸들링 체인)
 *   1) planets.json의 texture.map 이미지 경로가 있으면 이미지 로드 시도
 *   2) 실패하거나 경로가 없으면 → 절차적(procedural) 텍스처 생성 (Web Worker 풀)
 *   3) 절차적 생성도 실패하면 → source: 'fallback' (컴포넌트가 단색 구체로 렌더링)
 */
import * as THREE from 'three';
import type { CelestialBody, Quality, RingSpec } from '../../types';
import { bumpToNormalMap, generateGlowSprite, generateRingStrip, generateSurface } from './generators';
import type { SurfaceRequest, SurfaceResponse } from './texture.worker';

export type TextureSource = 'image' | 'procedural' | 'fallback';

export interface BodyTextures {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  clouds: THREE.Texture | null;
  source: TextureSource;
}

const bodyCache = new Map<string, BodyTextures>();
const miscCache = new Map<string, THREE.Texture>();

export function textureSizeFor(quality: Quality): { width: number; height: number } {
  return quality === 'low' ? { width: 512, height: 256 } : { width: 1024, height: 512 };
}

function makeDataTexture(data: Uint8Array, width: number, height: number, srgb: boolean): THREE.DataTexture {
  // 워커에서 전송된 버퍼는 ArrayBufferLike 타입이므로 ArrayBuffer 뷰로 감싸서 전달 (복사 없음)
  const view = new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length);
  const tex = new THREE.DataTexture(view, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

async function loadImageTexture(url: string, srgb: boolean, timeoutMs = 10000): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();
  const base = import.meta.env.BASE_URL ?? '/';
  const resolved = /^(https?:)?\/\//.test(url) || url.startsWith('/') ? url : `${base}${url}`;
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`텍스처 로딩 시간 초과: ${url}`)), timeoutMs);
  });
  const tex = await Promise.race([loader.loadAsync(resolved), timeout]);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ---------------------------------------------------------------------------
// Web Worker 풀
// ---------------------------------------------------------------------------

type SurfaceResult = { color: Uint8Array; normal: Uint8Array | null; clouds: Uint8Array | null };

class SurfaceWorkerPool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{ req: SurfaceRequest; resolve: (r: SurfaceResult) => void; reject: (e: Error) => void }> =
    [];
  private pending = new Map<number, { resolve: (r: SurfaceResult) => void; reject: (e: Error) => void }>();
  private nextId = 1;

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(new URL('./texture.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<SurfaceResponse>) => this.handle(worker, e.data);
      worker.onerror = (e: ErrorEvent) => {
        // 워커 자체가 죽으면 대기 중인 작업을 모두 실패 처리 → 메인 스레드 fallback으로 넘어갑니다.
        for (const p of this.pending.values()) p.reject(new Error(e.message || '워커 오류'));
        this.pending.clear();
      };
      this.workers.push(worker);
      this.idle.push(worker);
    }
  }

  run(spec: SurfaceRequest['spec'], width: number, height: number): Promise<SurfaceResult> {
    return new Promise((resolve, reject) => {
      const req: SurfaceRequest = { jobId: this.nextId++, spec, width, height };
      this.queue.push({ req, resolve, reject });
      this.pump();
    });
  }

  private pump(): void {
    while (this.idle.length > 0 && this.queue.length > 0) {
      const worker = this.idle.pop();
      const job = this.queue.shift();
      if (!worker || !job) return;
      this.pending.set(job.req.jobId, { resolve: job.resolve, reject: job.reject });
      worker.postMessage(job.req);
    }
  }

  private handle(worker: Worker, res: SurfaceResponse): void {
    const p = this.pending.get(res.jobId);
    this.pending.delete(res.jobId);
    this.idle.push(worker);
    if (p) {
      if (res.ok && res.color) p.resolve({ color: res.color, normal: res.normal ?? null, clouds: res.clouds ?? null });
      else p.reject(new Error(res.error ?? '텍스처 생성 실패'));
    }
    this.pump();
  }

  terminate(): void {
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.idle = [];
  }
}

function createPool(): SurfaceWorkerPool | null {
  if (typeof Worker === 'undefined') return null;
  try {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    return new SurfaceWorkerPool(Math.max(1, Math.min(4, cores - 1)));
  } catch {
    return null;
  }
}

async function generateOnMainThread(body: CelestialBody, width: number, height: number): Promise<SurfaceResult> {
  // 한 프레임 양보해 로더 UI가 갱신될 기회를 줍니다.
  await new Promise((r) => setTimeout(r, 0));
  const s = generateSurface(body.texture, width, height);
  return {
    color: s.color,
    normal: s.normalStrength > 0 ? bumpToNormalMap(s.bump, width, height, s.normalStrength) : null,
    clouds: s.clouds,
  };
}

async function prepareBody(
  body: CelestialBody,
  width: number,
  height: number,
  pool: SurfaceWorkerPool | null,
): Promise<BodyTextures> {
  // 1) 이미지 텍스처
  if (body.texture.map) {
    try {
      const map = await loadImageTexture(body.texture.map, true);
      let normalMap: THREE.Texture | null = null;
      if (body.texture.normalMap) {
        try {
          normalMap = await loadImageTexture(body.texture.normalMap, false);
        } catch (err) {
          console.warn(`[texture] ${body.id} 노멀맵 로딩 실패 — 노멀맵 없이 진행합니다.`, err);
        }
      }
      return { map, normalMap, clouds: null, source: 'image' };
    } catch (err) {
      console.warn(`[texture] ${body.id} 이미지 텍스처 로딩 실패 — 절차적 텍스처로 대체합니다.`, err);
    }
  }

  // 2) 절차적 텍스처
  try {
    let result: SurfaceResult;
    try {
      if (!pool) throw new Error('no-worker');
      result = await pool.run(body.texture, width, height);
    } catch {
      result = await generateOnMainThread(body, width, height);
    }
    return {
      map: makeDataTexture(result.color, width, height, true),
      normalMap: result.normal ? makeDataTexture(result.normal, width, height, false) : null,
      clouds: result.clouds ? makeDataTexture(result.clouds, width, height, true) : null,
      source: 'procedural',
    };
  } catch (err) {
    // 3) 최종 fallback — 단색 구체
    console.error(`[texture] ${body.id} 텍스처 생성 실패 — 단색 구체로 표시합니다.`, err);
    return { map: null, normalMap: null, clouds: null, source: 'fallback' };
  }
}

export interface PrepareProgress {
  done: number;
  total: number;
  label: string;
}

/** 모든 천체의 텍스처를 병렬로 준비합니다. 진행 상황은 onProgress로 전달됩니다. */
export async function prepareAllTextures(
  bodies: readonly CelestialBody[],
  quality: Quality,
  onProgress: (p: PrepareProgress) => void,
): Promise<void> {
  const { width, height } = textureSizeFor(quality);
  const pool = createPool();
  let done = 0;
  const total = bodies.length;
  onProgress({ done, total, label: bodies[0]?.name ?? '' });
  try {
    await Promise.all(
      bodies.map(async (body) => {
        if (!bodyCache.has(body.id)) {
          bodyCache.set(body.id, await prepareBody(body, width, height, pool));
        }
        done += 1;
        onProgress({ done, total, label: body.name });
      }),
    );
  } finally {
    pool?.terminate();
  }
}

export function getBodyTextures(id: string): BodyTextures {
  return bodyCache.get(id) ?? { map: null, normalMap: null, clouds: null, source: 'fallback' };
}

export function getRingTexture(bodyId: string, ring: RingSpec, seed: number): THREE.Texture {
  const key = `ring:${bodyId}`;
  const cached = miscCache.get(key);
  if (cached) return cached;
  const width = 1024;
  const tex = makeDataTexture(generateRingStrip(ring.palette, width, seed), width, 1, true);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  miscCache.set(key, tex);
  return tex;
}

export function getGlowTexture(hex: string, falloff = 2.2): THREE.Texture {
  const key = `glow:${hex}:${falloff}`;
  const cached = miscCache.get(key);
  if (cached) return cached;
  const size = 256;
  const tex = makeDataTexture(generateGlowSprite(size, hex, falloff), size, size, true);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  miscCache.set(key, tex);
  return tex;
}

/**
 * 모든 캐시된 텍스처의 GPU 메모리를 해제합니다 (씬 언마운트 시 호출).
 * 텍스처 객체(픽셀 데이터)는 캐시에 남겨 두므로, 씬이 다시 마운트되면(React StrictMode 등)
 * Three.js가 다음 렌더에서 자동으로 GPU에 다시 업로드합니다.
 */
export function disposeAllTextures(): void {
  for (const t of bodyCache.values()) {
    t.map?.dispose();
    t.normalMap?.dispose();
    t.clouds?.dispose();
  }
  for (const t of miscCache.values()) t.dispose();
}

/** 캐시를 완전히 비웁니다 (텍스처를 다시 생성해야 할 때). */
export function clearTextureCache(): void {
  disposeAllTextures();
  bodyCache.clear();
  miscCache.clear();
}
