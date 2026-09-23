import type { Quality } from '../types';

export interface QualityProfile {
  /** 렌더러 픽셀 비율 [min, max] */
  dpr: [number, number];
  postprocessing: boolean;
  bloom: boolean;
  multisampling: number;
  starCount: number;
  asteroidCount: number;
  sphereSegments: number;
  orbitSegments: number;
  nebulaOctaves: number;
  filmGrain: boolean;
}

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  low: {
    dpr: [1, 1],
    postprocessing: false,
    bloom: false,
    multisampling: 0,
    starCount: 2500,
    asteroidCount: 700,
    sphereSegments: 48,
    orbitSegments: 180,
    nebulaOctaves: 2,
    filmGrain: false,
  },
  medium: {
    dpr: [1, 1.5],
    postprocessing: true,
    bloom: true,
    multisampling: 0,
    starCount: 6000,
    asteroidCount: 1800,
    sphereSegments: 64,
    orbitSegments: 360,
    nebulaOctaves: 4,
    filmGrain: false,
  },
  high: {
    dpr: [1, 2],
    postprocessing: true,
    bloom: true,
    multisampling: 4,
    starCount: 10000,
    asteroidCount: 3500,
    sphereSegments: 96,
    orbitSegments: 512,
    nebulaOctaves: 5,
    filmGrain: true,
  },
};

export const QUALITY_ORDER: readonly Quality[] = ['low', 'medium', 'high'];

export function isQuality(v: unknown): v is Quality {
  return v === 'low' || v === 'medium' || v === 'high';
}

export interface DeviceHints {
  search?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  coarsePointer?: boolean;
}

/** URL에 ?quality= 가 지정되었는지 (지정 시 자동 품질 조절을 끕니다) */
export function hasQualityParam(search: string): boolean {
  return isQuality(new URLSearchParams(search).get('quality'));
}

/** 기기 정보를 바탕으로 초기 그래픽 품질을 추정합니다. URL ?quality=low|medium|high 로 강제할 수 있습니다. */
export function detectQuality(hints: DeviceHints): Quality {
  const param = new URLSearchParams(hints.search ?? '').get('quality');
  if (isQuality(param)) return param;
  const cores = hints.hardwareConcurrency ?? 4;
  const memory = hints.deviceMemory ?? 8;
  if (cores <= 2 || memory <= 2) return 'low';
  if (hints.coarsePointer || cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

export function lowerQuality(q: Quality): Quality {
  const i = QUALITY_ORDER.indexOf(q);
  return QUALITY_ORDER[Math.max(0, i - 1)];
}
