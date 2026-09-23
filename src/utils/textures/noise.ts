/**
 * 절차적 텍스처용 노이즈 함수 (외부 의존성 없음, 순수 함수).
 *
 * - hash3: 정수 격자점 → [0,1) 의사난수 (정수 곱셈/시프트 기반 해시)
 * - valueNoise3: 격자점 난수를 quintic(6t⁵−15t⁴+10t³) 곡선으로 3중 선형 보간 → 부드러운 노이즈
 * - fbm3: 주파수를 lacunarity배, 진폭을 gain배씩 바꾸며 여러 옥타브를 더한 프랙탈 노이즈
 *
 * 구(sphere) 표면 좌표(x,y,z)로 3D 노이즈를 샘플링하므로 경도 0°/360° 경계(seam)가 생기지 않습니다.
 */

export function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683);
  h ^= Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);

  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);

  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

/** 프랙탈 브라운 운동(fBm). 결과는 [0,1]로 정규화됩니다. */
export function fbm3(
  x: number,
  y: number,
  z: number,
  octaves: number,
  seed: number,
  lacunarity = 2,
  gain = 0.5,
): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise3(x * freq, y * freq, z * freq, seed + o * 1013) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** 능선(ridged) 노이즈 — 산맥, 태양 쌀알 무늬 같은 날카로운 경계 표현 */
export function ridged3(x: number, y: number, z: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise3(x * freq, y * freq, z * freq, seed + o * 7919);
    const r = 1 - Math.abs(n * 2 - 1);
    sum += r * r * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

/** 시드 기반 난수 생성기 (Mulberry32) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
