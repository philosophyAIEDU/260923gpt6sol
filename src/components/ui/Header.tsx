import { useSimDate } from '../../hooks/useSimDate';

/** 좌상단 브랜드 + 시뮬레이션 날짜 */
export function Header(): JSX.Element {
  const date = useSimDate();
  return (
    <header className="pointer-events-none flex select-none flex-col gap-4">
      <div className="flex items-center gap-3">
        <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden className="drop-shadow-[0_0_14px_rgba(77,216,255,0.35)]">
          <defs>
            <radialGradient id="brand-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset=".55" stopColor="#ffb347" />
              <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="27" ry="10.5" fill="none" stroke="#4dd8ff" strokeOpacity=".55" strokeWidth="1.4" transform="rotate(-18 32 32)" />
          <circle cx="32" cy="32" r="12" fill="url(#brand-sun)" />
          <circle cx="56" cy="24.5" r="3.4" fill="#7c5cff" />
        </svg>
        <div className="leading-none">
          <p className="font-display text-[15px] font-semibold tracking-[0.34em] text-ink-primary">SOLAR</p>
          <p className="mt-1.5 hidden text-[11px] tracking-wide text-ink-muted sm:block">태양계 탐험 · Interactive Atlas</p>
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="eyebrow">시뮬레이션 날짜</p>
        <p className="num mt-1 font-display text-lg font-medium tracking-wide text-ink-primary" aria-live="off">
          {date}
        </p>
      </div>
    </header>
  );
}
