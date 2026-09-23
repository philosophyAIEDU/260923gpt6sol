import { describe, expect, it } from 'vitest';
import { BODIES } from '../../data';
import type { TextureSpec } from '../../types';
import {
  bumpToNormalMap,
  generateGlowSprite,
  generateRingStrip,
  generateSurface,
  hexToRgb,
  rampInto,
} from './generators';
import { fbm3, hash3, mulberry32, ridged3, smoothstep, valueNoise3 } from './noise';

describe('noise', () => {
  it('hash3는 결정적이며 [0,1) 범위', () => {
    expect(hash3(1, 2, 3, 4)).toBe(hash3(1, 2, 3, 4));
    expect(hash3(1, 2, 3, 4)).not.toBe(hash3(1, 2, 3, 5));
    for (let i = 0; i < 200; i++) {
      const h = hash3(i, i * 3, -i, 7);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });

  it('valueNoise3는 격자점에서 해시값과 같고 연속적이다', () => {
    expect(valueNoise3(2, 3, 4, 1)).toBeCloseTo(hash3(2, 3, 4, 1));
    const a = valueNoise3(1.5, 1.5, 1.5, 1);
    const b = valueNoise3(1.5001, 1.5, 1.5, 1);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });

  it('fbm3 / ridged3는 [0,1] 범위', () => {
    for (let i = 0; i < 100; i++) {
      const f = fbm3(i * 0.37, i * 0.11, i * 0.23, 5, 3);
      const r = ridged3(i * 0.37, i * 0.11, i * 0.23, 3, 3);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('mulberry32 / smoothstep', () => {
    const r1 = mulberry32(5);
    const r2 = mulberry32(5);
    expect(r1()).toBe(r2());
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });
});

describe('texture generators', () => {
  it('hexToRgb (6자리/3자리/잘못된 입력)', () => {
    expect(hexToRgb('#4dd8ff')).toEqual({ r: 77, g: 216, b: 255 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('nope')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('rampInto는 팔레트 양 끝과 중간을 보간한다', () => {
    const out = new Float32Array(3);
    const stops = [hexToRgb('#000000'), hexToRgb('#ffffff')];
    rampInto(out, stops, 0);
    expect(out[0]).toBe(0);
    rampInto(out, stops, 1);
    expect(out[0]).toBe(255);
    rampInto(out, stops, 0.5);
    expect(out[0]).toBeCloseTo(127.5);
    rampInto(out, [hexToRgb('#102030')], 0.7);
    expect(out[0]).toBe(16);
  });

  it.each(BODIES.map((b) => [b.id, b.texture] as const))('%s 스타일 표면을 생성한다', (_id, spec) => {
    const s = generateSurface(spec, 32, 16);
    expect(s.color).toHaveLength(32 * 16 * 4);
    expect(s.bump).toHaveLength(32 * 16);
    // 모든 픽셀 알파 = 255, 완전 검정만 있는 텍스처가 아님
    let sum = 0;
    for (let i = 0; i < s.color.length; i += 4) {
      expect(s.color[i + 3]).toBe(255);
      sum += s.color[i] + s.color[i + 1] + s.color[i + 2];
    }
    expect(sum).toBeGreaterThan(0);
    if (spec.style === 'earth') expect(s.clouds).not.toBeNull();
    else expect(s.clouds).toBeNull();
  });

  it('경도 0°/360° 경계가 이어진다 (seam 없음)', () => {
    const spec = BODIES.find((b) => b.id === 'mars')?.texture as TextureSpec;
    const w = 256;
    const s = generateSurface(spec, w, 8);
    const row = 4 * w * 4;
    const first = s.color[row];
    const last = s.color[row + (w - 1) * 4];
    expect(Math.abs(first - last)).toBeLessThan(40);
  });

  it('평평한 높이맵의 노멀은 (0,0,1) → (128,128,255)', () => {
    const n = bumpToNormalMap(new Float32Array(16).fill(0.5), 4, 4, 5);
    expect(n[0]).toBe(127);
    expect(n[2]).toBe(255);
  });

  it('기울어진 높이맵은 노멀이 기울어진다', () => {
    const w = 8;
    const bump = new Float32Array(w * w);
    for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) bump[j * w + i] = i / w;
    const n = bumpToNormalMap(bump, w, w, 10);
    const o = (3 * w + 3) * 4;
    expect(n[o]).toBeLessThan(120); // x 성분이 음수 방향
  });

  it('고리 띠: 카시니 간극은 주변보다 투명하다', () => {
    const strip = generateRingStrip(['#333333', '#eeeeee'], 512, 3);
    const alphaAt = (u: number) => strip[Math.round(u * 511) * 4 + 3];
    expect(alphaAt(0.715)).toBeLessThan(alphaAt(0.5));
    expect(alphaAt(0)).toBe(0);
  });

  it('글로우 스프라이트: 중심이 가장자리보다 밝다', () => {
    const size = 32;
    const g = generateGlowSprite(size, '#ffffff');
    const center = g[((size / 2) * size + size / 2) * 4 + 3];
    const edge = g[3];
    expect(center).toBeGreaterThan(200);
    expect(edge).toBe(0);
  });
});
