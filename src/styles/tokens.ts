/**
 * 디자인 토큰 — 색상/폰트/모션 값의 단일 진실 공급원(Single Source of Truth).
 * Tailwind 설정(tailwind.config.ts)과 3D 씬(셰이더 uniform, 머티리얼 색상)이 모두 이 파일을 참조합니다.
 * 테마를 바꾸고 싶다면 이 파일만 수정하면 UI와 3D 씬에 동시에 반영됩니다.
 */
export const colors = {
  space: {
    950: '#030b11',
    900: '#07131c',
    800: '#0c1d29',
    700: '#132b38',
    600: '#1c3845',
  },
  accent: {
    cyan: '#8cd9d1',
    violet: '#d3ae75',
    magenta: '#a9bdc6',
    success: '#82d8b0',
    danger: '#ee9292',
    warning: '#e8bf76',
  },
  ink: {
    // 순수 흰색 대신 푸른 기가 도는 오프화이트를 사용해 우주 배경과 자연스럽게 어울리게 합니다.
    primary: '#f2f4f0',
    secondary: '#c4d2d2',
    muted: '#96aeb2',
    faint: '#708991',
  },
  glass: {
    bg: 'rgba(9, 29, 39, 0.88)',
    bgStrong: 'rgba(8, 26, 36, 0.97)',
    border: 'rgba(197, 222, 218, 0.16)',
    borderStrong: 'rgba(197, 222, 218, 0.26)',
    highlight: 'rgba(197, 222, 218, 0.05)',
  },
} as const;

export const fonts = {
  display: ['"Space Grotesk"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
  body: ['Inter', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
} as const;

/** 모션 토큰 (ms). 모든 UI 전환은 150~300ms 범위를 유지합니다. */
export const motion = {
  fast: 150,
  base: 220,
  slow: 300,
  /** Framer Motion용 cubic-bezier — easeOutQuint 계열로 "착 붙는" 감속감을 줍니다. */
  easeOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

/** 3D 씬에서 사용하는 시각 파라미터 */
export const sceneTokens = {
  orbitBaseOpacity: 0.22,
  orbitHoverOpacity: 0.4,
  orbitSelectedOpacity: 0.85,
  cameraTransitionSec: 1.8,
  introTransitionSec: 3.2,
} as const;
