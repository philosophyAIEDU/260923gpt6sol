import { describe, expect, it } from 'vitest';
import {
  auToKm,
  formatAU,
  formatKm,
  formatNumber,
  formatPeriodDays,
  formatRatio,
  formatRotation,
  formatSimDate,
  formatTemp,
} from './format';

describe('format', () => {
  it('formatKm', () => {
    expect(formatKm(149_597_870)).toBe('1.50억 km');
    expect(formatKm(57_909_000)).toBe('5,791만 km');
    expect(formatKm(12_742)).toBe('12,742 km');
    expect(formatKm(116_460)).toBe('116,460 km');
    expect(formatKm(1_392_700)).toBe('139만 km');
  });
  it('formatAU / auToKm', () => {
    expect(formatAU(1)).toBe('1.00 AU');
    expect(auToKm(1)).toBeCloseTo(149_597_870.7);
  });
  it('formatPeriodDays', () => {
    expect(formatPeriodDays(0.5)).toBe('12시간');
    expect(formatPeriodDays(87.969)).toBe('88일');
    expect(formatPeriodDays(365.256)).toBe('365.3일');
    expect(formatPeriodDays(4332.59)).toBe('11.86년');
  });
  it('formatRotation', () => {
    expect(formatRotation(23.934)).toBe('23.9시간');
    expect(formatRotation(-5832.5)).toBe('243일 (역방향)');
    expect(formatRotation(1407.6)).toBe('58.7일');
  });
  it('formatTemp / formatNumber / formatRatio', () => {
    expect(formatTemp(-63)).toBe('-63°C');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(3.14159, 1)).toBe('3.1');
    expect(formatNumber(3.14159, 2)).toBe('3.14');
    expect(formatRatio(109.2)).toBe('109배');
    expect(formatRatio(1.52)).toBe('1.5배');
    expect(formatRatio(0.383)).toBe('0.38배');
  });
  it('formatSimDate', () => {
    expect(formatSimDate(new Date(Date.UTC(2026, 8, 2)))).toBe('2026. 09. 02');
    expect(formatSimDate(new Date(Number.NaN))).toBe('----. --. --');
  });
});
