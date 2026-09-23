/**
 * 절차적 행성 표면 생성기 (순수 함수 — Canvas/WebGL 없이 동작해 테스트 가능).
 *
 * 출력은 등장방형(equirectangular) 투영의 RGBA 바이트 배열과 높이(bump) 배열입니다.
 * - 행(row) 0 = 남극, 마지막 행 = 북극 (Three.js DataTexture의 v축 방향과 일치)
 * - 열(column) 0 → 경도 0°, 오른쪽으로 갈수록 경도 증가
 * 높이 배열은 bumpToNormalMap()으로 탄젠트 공간 노멀맵으로 변환되어 조명에 입체감을 줍니다.
 */
import type { SpotFeature, TextureSpec } from '../../types';
import { fbm3, hash3, mulberry32, ridged3, smoothstep } from './noise';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface SurfaceData {
  width: number;
  height: number;
  /** RGBA, sRGB 색 공간 */
  color: Uint8Array;
  /** 0..1 높이 */
  bump: Float32Array;
  /** 구름 레이어 (RGBA, 알파=구름 밀도) — 지구 스타일에만 존재 */
  clouds: Uint8Array | null;
  /** 노멀맵 강도 권장값 */
  normalStrength: number;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return { r: 128, g: 128, b: 128 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** 균등 간격 팔레트를 t∈[0,1]로 샘플링해 out[0..2]에 0..255 값을 씁니다 (할당 없음). */
export function rampInto(out: Float32Array, stops: readonly RGB[], t: number): void {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = stops.length === 1 ? 0 : x - i;
  const a = stops[Math.max(0, i)];
  const b = stops[Math.min(stops.length - 1, i + 1)];
  out[0] = a.r + (b.r - a.r) * f;
  out[1] = a.g + (b.g - a.g) * f;
  out[2] = a.b + (b.b - a.b) * f;
}

function mixInto(out: Float32Array, c: RGB, t: number): void {
  const k = Math.min(1, Math.max(0, t));
  out[0] += (c.r - out[0]) * k;
  out[1] += (c.g - out[1]) * k;
  out[2] += (c.b - out[2]) * k;
}

/** 경도 차이를 [-180, 180]으로 */
function lonDiff(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

interface Crater {
  cx: number;
  cy: number;
  cz: number;
  radius: number;
  depth: number;
}

function makeCraters(count: number, seed: number, minR: number, maxR: number): Crater[] {
  const rand = mulberry32(seed);
  const craters: Crater[] = [];
  for (let k = 0; k < count; k++) {
    // 구 표면 균등 분포: z ∈ [-1,1] 균등, 방위각 균등
    const z = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    // 작은 크레이터가 훨씬 많도록 거듭제곱 분포
    const r = minR + (maxR - minR) * Math.pow(rand(), 3);
    craters.push({ cx: s * Math.cos(phi), cy: z, cz: s * Math.sin(phi), radius: r, depth: 0.5 + rand() * 0.5 });
  }
  return craters;
}

/** 크레이터 높이 기여도: 오목한 그릇 + 솟아오른 테두리(rim) */
function craterHeight(x: number, y: number, z: number, craters: readonly Crater[]): number {
  let h = 0;
  for (let k = 0; k < craters.length; k++) {
    const c = craters[k];
    const dx = x - c.cx;
    const dy = y - c.cy;
    const dz = z - c.cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    const lim = c.radius * 1.5;
    if (d2 > lim * lim) continue;
    const t = Math.sqrt(d2) / c.radius;
    if (t < 1) h += (t * t - 1) * 0.6 * c.depth;
    const rim = (t - 1) / 0.22;
    h += Math.exp(-rim * rim) * 0.35 * c.depth;
  }
  return h;
}

function applySpot(out: Float32Array, latDeg: number, lonDeg: number, spot: SpotFeature, spotRgb: RGB): number {
  const dx = lonDiff(lonDeg, spot.lonDeg) / (spot.widthDeg / 2);
  const dy = (latDeg - spot.latDeg) / (spot.heightDeg / 2);
  const r2 = dx * dx + dy * dy;
  if (r2 > 2.2) return 0;
  const core = smoothstep(1.05, 0.15, r2);
  mixInto(out, spotRgb, core * 0.9);
  // 폭풍 가장자리의 밝은 소용돌이 띠
  const halo = Math.exp(-Math.pow((r2 - 1.25) / 0.25, 2)) * 0.25;
  out[0] += (255 - out[0]) * halo;
  out[1] += (245 - out[1]) * halo;
  out[2] += (230 - out[2]) * halo;
  return core;
}

type PixelFn = (
  x: number,
  y: number,
  z: number,
  latDeg: number,
  lonDeg: number,
  out: Float32Array,
  cloud: Float32Array,
) => void;

function createPixelFn(spec: TextureSpec): { fn: PixelFn; normalStrength: number; hasClouds: boolean } {
  const pal = spec.palette.map(hexToRgb);
  const seed = spec.seed;
  const spotRgb = spec.spot ? hexToRgb(spec.spot.color) : null;

  switch (spec.style) {
    case 'sun':
      return {
        normalStrength: 0,
        hasClouds: false,
        fn: (x, y, z, _lat, _lon, out) => {
          const g = fbm3(x * 4, y * 4, z * 4, 5, seed);
          const cells = ridged3(x * 14, y * 14, z * 14, 3, seed + 3);
          const t = 0.18 + 0.55 * g + 0.32 * cells;
          rampInto(out, pal, t);
          out[3] = 0;
        },
      };

    case 'cratered': {
      const craters = makeCraters(140, seed, 0.015, 0.2);
      return {
        normalStrength: 7,
        hasClouds: false,
        fn: (x, y, z, _lat, _lon, out) => {
          const base = fbm3(x * 3, y * 3, z * 3, 6, seed);
          const maria = smoothstep(0.52, 0.66, fbm3(x * 1.3 + 9, y * 1.3, z * 1.3, 3, seed + 17));
          const ch = craterHeight(x, y, z, craters);
          const t = 0.52 + (base - 0.5) * 0.9 + ch * 0.35 - maria * 0.28;
          rampInto(out, pal, t);
          out[3] = Math.min(1, Math.max(0, 0.45 + (base - 0.5) * 0.6 + ch * 0.5));
        },
      };
    }

    case 'venus':
      return {
        normalStrength: 1.2,
        hasClouds: false,
        fn: (x, y, z, latDeg, _lon, out) => {
          const q = fbm3(x * 1.5, y * 1.5, z * 1.5, 4, seed);
          const v = fbm3(x * 2 + q * 1.6, y * 5 + q, z * 2 + q * 1.6, 5, seed + 5);
          const band = 0.5 + 0.5 * Math.sin((latDeg * Math.PI) / 30 + v * 5);
          const t = 0.2 + 0.55 * v + 0.2 * band;
          rampInto(out, pal, t);
          out[3] = v * 0.6;
        },
      };

    case 'earth': {
      // 팔레트: [심해, 얕은 바다, 초원, 사막/산, 얼음]
      const [deep, shallow, green, desert, ice] = pal;
      const forest: RGB = { r: green.r * 0.6, g: green.g * 0.72, b: green.b * 0.6 };
      const tmp = new Float32Array(3);
      return {
        normalStrength: 5,
        hasClouds: true,
        fn: (x, y, z, latDeg, _lon, out, cloud) => {
          const absLat = Math.abs(latDeg) / 90;
          const cont = fbm3(x * 1.7, y * 1.7, z * 1.7, 7, seed);
          const elev = cont - 0.53;
          const iceEdge = 0.8 + (fbm3(x * 5, y * 5, z * 5, 3, seed + 41) - 0.5) * 0.12;
          let bump = 0;
          if (elev > 0) {
            const h = Math.min(1, elev / 0.2);
            const moist = fbm3(x * 2.6 + 3, y * 2.6, z * 2.6, 4, seed + 7);
            // 위도 20~30° 부근은 건조대(사막) 경향
            const arid = Math.exp(-Math.pow((absLat - 0.27) / 0.12, 2)) * 0.35;
            const dry = smoothstep(0.42, 0.62, 1 - moist + arid);
            tmp[0] = forest.r + (green.r - forest.r) * h;
            tmp[1] = forest.g + (green.g - forest.g) * h;
            tmp[2] = forest.b + (green.b - forest.b) * h;
            out[0] = tmp[0];
            out[1] = tmp[1];
            out[2] = tmp[2];
            mixInto(out, desert, dry);
            mixInto(out, { r: 120, g: 104, b: 88 }, smoothstep(0.55, 0.95, h) * 0.7);
            bump = 0.25 + h * 0.75 + (ridged3(x * 9, y * 9, z * 9, 3, seed + 2) - 0.5) * 0.3 * h;
          } else {
            const depth = Math.min(1, -elev / 0.16);
            rampInto(out, [shallow, deep], depth);
          }
          if (absLat > iceEdge) {
            mixInto(out, ice, smoothstep(iceEdge, iceEdge + 0.05, absLat));
            bump = Math.max(bump, 0.2);
          }
          out[3] = bump;
          // 구름: 도메인 워핑으로 소용돌이 모양
          const wq = fbm3(x * 2, y * 2, z * 2, 3, seed + 90);
          const c = fbm3(x * 3.2 + wq * 1.8, y * 4.5 + wq, z * 3.2 + wq * 1.8, 6, seed + 99);
          const band = 0.1 * Math.cos((latDeg * Math.PI) / 18);
          cloud[0] = smoothstep(0.5, 0.75, c + band) * 0.95;
        },
      };
    }

    case 'mars': {
      const craters = makeCraters(60, seed, 0.015, 0.12);
      const capColor = pal[pal.length - 1];
      return {
        normalStrength: 4.5,
        hasClouds: false,
        fn: (x, y, z, latDeg, _lon, out) => {
          const absLat = Math.abs(latDeg) / 90;
          const base = fbm3(x * 2.5, y * 2.5, z * 2.5, 6, seed);
          const dark = smoothstep(0.5, 0.68, fbm3(x * 1.4 + 4, y * 1.4, z * 1.4, 4, seed + 5));
          const ch = craterHeight(x, y, z, craters) * 0.6;
          const t = 0.52 + (base - 0.5) * 0.9 - dark * 0.28 + ch * 0.2;
          rampInto(out, pal.slice(0, pal.length - 1), t);
          const capEdge = 0.87 + (fbm3(x * 6, y * 6, z * 6, 3, seed + 9) - 0.5) * 0.08;
          if (absLat > capEdge) mixInto(out, capColor, smoothstep(capEdge, capEdge + 0.03, absLat));
          out[3] = Math.min(1, Math.max(0, 0.4 + (base - 0.5) * 0.8 + ch));
        },
      };
    }

    case 'banded':
      return {
        normalStrength: 1.4,
        hasClouds: false,
        fn: (x, y, z, latDeg, lonDeg, out) => {
          const lat = (latDeg * Math.PI) / 180;
          const n1 = fbm3(x * 3, y * 3, z * 3, 4, seed);
          const fine = fbm3(x * 10, y * 22, z * 10, 3, seed + 3);
          const latW = lat + (n1 - 0.5) * 0.1 + (fine - 0.5) * 0.035;
          const b =
            0.6 * (0.5 + 0.5 * Math.sin(latW * 13)) + 0.4 * (0.5 + 0.5 * Math.sin(latW * 31 + 1.3));
          const bandId = Math.floor(((latW + Math.PI / 2) * 13) / Math.PI);
          const tint = hash3(bandId, 0, 0, seed) - 0.5;
          const t = 0.18 + 0.62 * b + tint * 0.28 + (fine - 0.5) * 0.12;
          rampInto(out, pal, t);
          let spot = 0;
          if (spec.spot && spotRgb) spot = applySpot(out, latDeg, lonDeg, spec.spot, spotRgb);
          out[3] = b * 0.5 + fine * 0.3 + spot * 0.2;
        },
      };

    case 'icy':
      return {
        normalStrength: 0.8,
        hasClouds: false,
        fn: (x, y, z, latDeg, lonDeg, out) => {
          const lat = (latDeg * Math.PI) / 180;
          const n = fbm3(x * 2.5, y * 2.5, z * 2.5, 4, seed);
          const fine = fbm3(x * 8, y * 18, z * 8, 3, seed + 3);
          const band = 0.5 + 0.5 * Math.sin(lat * 9 + (n - 0.5) * 1.2);
          const t = 0.42 + (band - 0.5) * 0.28 + (fine - 0.5) * 0.14 + Math.abs(lat) * 0.08;
          rampInto(out, pal, t);
          let spot = 0;
          if (spec.spot && spotRgb) spot = applySpot(out, latDeg, lonDeg, spec.spot, spotRgb);
          out[3] = band * 0.4 + fine * 0.3 + spot * 0.2;
        },
      };
  }
}

/**
 * 표면 텍스처 데이터를 생성합니다.
 * @param width 가로 픽셀 (세로는 width/2 권장 — 등장방형 투영 비율)
 */
export function generateSurface(spec: TextureSpec, width: number, height: number): SurfaceData {
  const { fn, normalStrength, hasClouds } = createPixelFn(spec);
  const color = new Uint8Array(width * height * 4);
  const bump = new Float32Array(width * height);
  const clouds = hasClouds ? new Uint8Array(width * height * 4) : null;
  const out = new Float32Array(4);
  const cloud = new Float32Array(1);

  // 경도별 cos/sin을 미리 계산 (행마다 반복 계산 방지)
  const cosLon = new Float32Array(width);
  const sinLon = new Float32Array(width);
  const lonDegArr = new Float32Array(width);
  for (let i = 0; i < width; i++) {
    const lon = ((i + 0.5) / width) * Math.PI * 2;
    cosLon[i] = Math.cos(lon);
    sinLon[i] = Math.sin(lon);
    lonDegArr[i] = (lon * 180) / Math.PI;
  }

  for (let j = 0; j < height; j++) {
    const lat = -Math.PI / 2 + (Math.PI * (j + 0.5)) / height;
    const latDeg = (lat * 180) / Math.PI;
    const cosLat = Math.cos(lat);
    const y = Math.sin(lat);
    for (let i = 0; i < width; i++) {
      const x = cosLat * cosLon[i];
      const z = cosLat * sinLon[i];
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      cloud[0] = 0;
      fn(x, y, z, latDeg, lonDegArr[i], out, cloud);
      const p = j * width + i;
      const o = p * 4;
      color[o] = out[0];
      color[o + 1] = out[1];
      color[o + 2] = out[2];
      color[o + 3] = 255;
      bump[p] = out[3];
      if (clouds) {
        clouds[o] = 250;
        clouds[o + 1] = 252;
        clouds[o + 2] = 255;
        clouds[o + 3] = cloud[0] * 255;
      }
    }
  }
  return { width, height, color, bump, clouds, normalStrength };
}

/**
 * 높이맵 → 탄젠트 공간 노멀맵.
 * 중앙 차분으로 기울기(∂h/∂u, ∂h/∂v)를 구하고 n = normalize(−s·∂h/∂u, −s·∂h/∂v, 1) 로 변환합니다.
 * 가로(경도)는 좌우가 이어지도록 wrap, 세로(위도)는 가장자리에서 clamp 합니다.
 * 결과는 [-1,1] → [0,255] 로 인코딩됩니다 (RGB = XYZ).
 */
export function bumpToNormalMap(bump: Float32Array, width: number, height: number, strength: number): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  for (let j = 0; j < height; j++) {
    // 극지방은 등장방형 투영에서 픽셀이 한 점으로 모이므로 기울기가 과장됩니다 → cos(위도)로 약화
    const lat = -Math.PI / 2 + (Math.PI * (j + 0.5)) / height;
    const s = strength * Math.pow(Math.cos(lat), 0.75);
    const jUp = Math.min(height - 1, j + 1);
    const jDown = Math.max(0, j - 1);
    for (let i = 0; i < width; i++) {
      const iL = (i - 1 + width) % width;
      const iR = (i + 1) % width;
      const dx = (bump[j * width + iR] - bump[j * width + iL]) * 0.5;
      const dy = (bump[jUp * width + i] - bump[jDown * width + i]) * 0.5;
      let nx = -dx * s;
      let ny = -dy * s;
      let nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const o = (j * width + i) * 4;
      out[o] = (nx * 0.5 + 0.5) * 255;
      out[o + 1] = (ny * 0.5 + 0.5) * 255;
      out[o + 2] = (nz * 0.5 + 0.5) * 255;
      out[o + 3] = 255;
    }
  }
  return out;
}

/**
 * 고리 텍스처(1픽셀 높이 가로 띠). u=0 → 안쪽, u=1 → 바깥쪽.
 * 여러 주파수의 사인파 + 노이즈로 미세한 고리 결을 만들고, 카시니 간극 같은 틈을 넣습니다.
 */
export function generateRingStrip(palette: readonly string[], width: number, seed: number): Uint8Array {
  const pal = palette.map(hexToRgb);
  const out = new Uint8Array(width * 4);
  const tmp = new Float32Array(3);
  for (let i = 0; i < width; i++) {
    const u = i / (width - 1);
    const fine = fbm3(u * 60, 0.5, 0.5, 4, seed);
    const coarse = fbm3(u * 9, 3.5, 1.5, 3, seed + 7);
    let density = 0.35 + 0.45 * coarse + 0.3 * (fine - 0.5);
    density *= 0.85 + 0.15 * Math.sin(u * 180);
    // 카시니 간극 (u ≈ 0.69~0.75)
    density *= 1 - smoothstep(0.66, 0.69, u) * (1 - smoothstep(0.745, 0.77, u)) * 0.92;
    // 안쪽/바깥쪽 가장자리 페이드
    density *= smoothstep(0, 0.06, u) * (1 - smoothstep(0.93, 1, u));
    density = Math.min(1, Math.max(0, density));
    rampInto(tmp, pal, 0.2 + coarse * 0.8);
    out[i * 4] = tmp[0];
    out[i * 4 + 1] = tmp[1];
    out[i * 4 + 2] = tmp[2];
    out[i * 4 + 3] = density * 255;
  }
  return out;
}

/** 방사형 글로우 스프라이트 (태양 코로나, 선택 효과 등) */
export function generateGlowSprite(size: number, hex: string, falloff = 2.2): Uint8Array {
  const c = hexToRgb(hex);
  const out = new Uint8Array(size * size * 4);
  const half = size / 2;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const dx = (i + 0.5 - half) / half;
      const dy = (j + 0.5 - half) / half;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const a = Math.pow(1 - r, falloff) * 0.85 + Math.pow(1 - r, 12) * 0.15;
      const o = (j * size + i) * 4;
      out[o] = c.r;
      out[o + 1] = c.g;
      out[o + 2] = c.b;
      out[o + 3] = a * 255;
    }
  }
  return out;
}
