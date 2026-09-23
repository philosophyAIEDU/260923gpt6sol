import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';

const ORBITS = [
  { r: 34, dur: 3.2, size: 3.2, color: '#b3aa9f', delay: 0 },
  { r: 52, dur: 5.4, size: 4.2, color: '#8cd9d1', delay: 0.15 },
  { r: 72, dur: 8.6, size: 3.6, color: '#d0643a', delay: 0.3 },
  { r: 96, dur: 13, size: 6, color: '#d8b48a', delay: 0.45 },
] as const;

/** 궤도 타원의 세로/가로 비율 (비스듬히 내려다보는 시점) */
const TILT = 0.42;

/**
 * 커스텀 로더 — 단순 스피너 대신 궤도가 그려지고 행성이 공전하는 미니 태양계.
 *  - 궤도선: SVG pathLength 애니메이션으로 "그려지듯" 나타남
 *  - 행성: 서로 다른 주기로 회전 (안쪽일수록 빠름 — 케플러 제3법칙 느낌)
 *  - 진행률: 얇은 그라데이션 바 + tabular-nums 퍼센트
 */
export function Loader(): JSX.Element {
  const progress = useAppStore((s) => s.loading.progress);
  const label = useAppStore((s) => s.loading.label);
  const texturesReady = useAppStore((s) => s.loading.texturesReady);
  const status = texturesReady ? '장면을 준비하는 중…' : label ? `${label} 표면 생성 중…` : '궤도를 계산하는 중…';
  const pct = Math.round(progress * 100);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-space-900"
      style={{
        background:
          'radial-gradient(700px 500px at 50% 42%, rgba(211,174,117,0.12), transparent 70%), linear-gradient(180deg,#030b11,#0c1d29)',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease: m.easeInOut }}
      role="status"
      aria-live="polite"
      aria-label={`태양계를 불러오는 중 ${pct}%`}
    >
      <div className="relative h-[240px] w-[240px]">
        <svg viewBox="-120 -120 240 240" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="loader-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff6d8" />
              <stop offset="45%" stopColor="#ffb347" />
              <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="loader-orbit" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#8cd9d1" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#d3ae75" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g transform="rotate(-12)">
            {ORBITS.map((o) => (
              <motion.ellipse
                key={o.r}
                rx={o.r}
                ry={o.r * TILT}
                fill="none"
                stroke="url(#loader-orbit)"
                strokeWidth={1.1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: o.delay, ease: m.easeOut }}
              />
            ))}
          </g>
          <circle r="30" fill="url(#loader-sun)" className="animate-pulse-soft" style={{ transformOrigin: 'center' }} />
          <circle r="9" fill="#fff1c9" />
          {/* 공전하는 행성들 — SVG animateMotion으로 타원 궤도를 따라 이동 */}
          <g transform="rotate(-12)">
            {ORBITS.map((o) => (
              <circle key={o.r} r={o.size} fill={o.color} style={{ filter: `drop-shadow(0 0 4px ${o.color})` }}>
                <animateMotion
                  dur={`${o.dur}s`}
                  begin={`-${o.delay * 4}s`}
                  repeatCount="indefinite"
                  path={`M ${o.r},0 A ${o.r},${o.r * TILT} 0 1,1 ${-o.r},0 A ${o.r},${o.r * TILT} 0 1,1 ${o.r},0`}
                />
              </circle>
            ))}
          </g>
        </svg>
      </div>

      <motion.div
        className="mt-6 flex flex-col items-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: m.easeOut }}
      >
        <p className="eyebrow">Solar System Atlas</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-gradient">태양계로 떠나는 중</h1>
        <div className="mt-6 h-[2px] w-56 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet shadow-[0_0_12px_rgba(140,217,209,0.8)]"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(3, pct)}%` }}
            transition={{ duration: 0.3, ease: m.easeOut }}
          />
        </div>
        <div className="mt-3 flex w-56 items-center justify-between text-[11px] text-ink-muted">
          <span className="truncate">{status}</span>
          <span className="num font-display text-ink-secondary">{pct}%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
