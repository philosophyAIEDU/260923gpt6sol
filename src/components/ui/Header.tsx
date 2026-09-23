import { useSimDate } from '../../hooks/useSimDate';

/** 좌상단 브랜드 + 시뮬레이션 날짜 */
export function Header(): JSX.Element {
  const date = useSimDate();
  return (
    <header className="pointer-events-none flex select-none flex-col gap-4">
      <div className="flex items-center gap-3">
        <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden>
          <defs>
            <radialGradient id="brand-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff4d9" />
              <stop offset=".55" stopColor="#d3ae75" />
              <stop offset="1" stopColor="#d3ae75" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="27" ry="10.5" fill="none" stroke="#8cd9d1" strokeOpacity=".8" strokeWidth="1.4" transform="rotate(-18 32 32)" />
          <circle cx="32" cy="32" r="12" fill="url(#brand-sun)" />
          <circle cx="56" cy="24.5" r="3.4" fill="#d3ae75" />
        </svg>
        <div className="leading-none">
          <p className="font-display text-[15px] font-semibold tracking-[0.34em] text-ink-primary">SOLAR</p>
          <p className="mt-1.5 hidden text-[11px] tracking-wide text-ink-muted sm:block">천체 관측 · INTERACTIVE ATLAS</p>
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
