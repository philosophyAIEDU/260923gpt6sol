import { describe, expect, it } from 'vitest';
import { QUALITY_PROFILES, detectQuality, isQuality, lowerQuality } from './quality';

describe('quality', () => {
  it('URL 파라미터가 최우선', () => {
    expect(detectQuality({ search: '?quality=low', hardwareConcurrency: 16 })).toBe('low');
    expect(detectQuality({ search: '?quality=ultra', hardwareConcurrency: 16, deviceMemory: 16 })).toBe('high');
  });
  it('기기 사양으로 추정', () => {
    expect(detectQuality({ hardwareConcurrency: 2 })).toBe('low');
    expect(detectQuality({ hardwareConcurrency: 8, deviceMemory: 2 })).toBe('low');
    expect(detectQuality({ hardwareConcurrency: 8, coarsePointer: true })).toBe('medium');
    expect(detectQuality({ hardwareConcurrency: 4 })).toBe('medium');
    expect(detectQuality({ hardwareConcurrency: 12, deviceMemory: 16 })).toBe('high');
    expect(detectQuality({})).toBe('medium');
  });
  it('낮음 모드는 후처리를 끈다', () => {
    expect(QUALITY_PROFILES.low.postprocessing).toBe(false);
    expect(QUALITY_PROFILES.low.bloom).toBe(false);
    expect(QUALITY_PROFILES.high.starCount).toBeGreaterThan(QUALITY_PROFILES.low.starCount);
  });
  it('lowerQuality / isQuality', () => {
    expect(lowerQuality('high')).toBe('medium');
    expect(lowerQuality('medium')).toBe('low');
    expect(lowerQuality('low')).toBe('low');
    expect(isQuality('medium')).toBe(true);
    expect(isQuality(3)).toBe(false);
  });
});
