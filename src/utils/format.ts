/** 화면 표시용 숫자/단위 포맷터 (한국어) */
import { AU_KM } from './scale';

const nf0 = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatNumber(n: number, digits: 0 | 1 | 2 = 0): string {
  if (digits === 2) return nf2.format(n);
  if (digits === 1) return nf1.format(n);
  return nf0.format(n);
}

/** km → "1.50억 km" / "5,791만 km" / "12,742 km" */
export function formatKm(km: number): string {
  const abs = Math.abs(km);
  if (abs >= 1e8) return `${nf2.format(km / 1e8)}억 km`;
  if (abs >= 1e6) return `${nf0.format(km / 1e4)}만 km`;
  return `${nf0.format(km)} km`;
}

export function formatAU(au: number): string {
  return `${nf2.format(au)} AU`;
}

export function auToKm(au: number): number {
  return au * AU_KM;
}

/** 공전 주기: 2년 미만은 일, 이상은 년 */
export function formatPeriodDays(days: number): string {
  if (days < 1) return `${nf1.format(days * 24)}시간`;
  if (days < 730) return `${nf1.format(days)}일`;
  return `${nf2.format(days / 365.25)}년`;
}

/** 자전 주기: 48시간 미만은 시간, 이상은 일. 음수는 역방향 */
export function formatRotation(hours: number): string {
  const abs = Math.abs(hours);
  const base = abs < 48 ? `${nf1.format(abs)}시간` : `${nf1.format(abs / 24)}일`;
  return hours < 0 ? `${base} (역방향)` : base;
}

export function formatTemp(celsius: number): string {
  return `${nf0.format(celsius)}°C`;
}

export function formatRatio(ratio: number): string {
  if (ratio >= 10) return `${nf0.format(ratio)}배`;
  if (ratio >= 1) return `${nf1.format(ratio)}배`;
  return `${nf2.format(ratio)}배`;
}

export function formatSimDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return '----. --. --';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}`;
}
