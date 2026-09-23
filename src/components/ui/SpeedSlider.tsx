import { motion } from 'framer-motion';
import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { motion as m } from '../../styles/tokens';
import { SPEED_STEPS, speedLabel } from '../../utils/time';

interface SpeedSliderProps {
  value: number;
  onChange: (index: number) => void;
}

const LAST = SPEED_STEPS.length - 1;
const STOP_LABELS = SPEED_STEPS.map((s) => (s === 0 ? '정지' : `${s.toLocaleString('en-US')}x`));

/**
 * 커스텀 단계형 슬라이더 (기본 브라우저 슬라이더 미사용).
 *  - 포인터 드래그 / 트랙 클릭 / 눈금 라벨 클릭 / 키보드(←→↑↓ Home End) 모두 지원
 *  - WAI-ARIA slider 패턴 준수 (스크린리더에 "10x, 1초 = 10일"처럼 읽힘)
 */
export function SpeedSlider({ value, onChange }: SpeedSliderProps): JSX.Element {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const indexFromClientX = useCallback((clientX: number): number => {
    const el = track.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    if (!Number.isFinite(clientX) || rect.width <= 0) return value;
    const t = (clientX - rect.left) / rect.width;
    return Math.min(LAST, Math.max(0, Math.round(t * LAST)));
  }, [value]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(indexFromClientX(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return;
    const i = indexFromClientX(e.clientX);
    if (i !== value) onChange(i);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    let next = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = LAST;
    else return;
    e.preventDefault();
    e.stopPropagation();
    onChange(Math.min(LAST, Math.max(0, next)));
  };

  const pct = (value / LAST) * 100;
  const label = speedLabel(SPEED_STEPS[value]);

  return (
    <div className="w-full select-none">
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="시간 배속"
        aria-valuemin={0}
        aria-valuemax={LAST}
        aria-valuenow={value}
        aria-valuetext={`${label.short}, ${label.detail}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="group relative mx-2 flex h-7 cursor-pointer touch-none items-center rounded-full focus-visible:outline-none"
      >
        {/* 트랙 */}
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.08]" />
        {/* 채워진 구간 */}
        <motion.div
          className="absolute left-0 h-[3px] rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan shadow-[0_0_12px_rgba(77,216,255,0.6)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: m.base / 1000, ease: m.easeOut }}
        />
        {/* 눈금 */}
        {SPEED_STEPS.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={[
              'absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full transition-colors duration-220',
              i <= value ? 'bg-accent-cyan/90' : 'bg-white/20',
            ].join(' ')}
            style={{ left: `${(i / LAST) * 100}%` }}
          />
        ))}
        {/* 썸 */}
        <motion.span
          aria-hidden
          className="absolute h-4 w-4 -translate-x-1/2 rounded-full border border-white/70 bg-ink-primary shadow-[0_0_0_4px_rgba(77,216,255,0.18),0_0_18px_rgba(77,216,255,0.75)] transition-shadow duration-220 group-hover:shadow-[0_0_0_6px_rgba(77,216,255,0.22),0_0_22px_rgba(77,216,255,0.9)] group-focus-visible:shadow-[0_0_0_6px_rgba(77,216,255,0.4),0_0_22px_rgba(77,216,255,0.9)]"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ duration: m.base / 1000, ease: m.easeOut }}
        />
      </div>
      <div className="relative mx-2 mt-1 h-4">
        {STOP_LABELS.map((text, i) => (
          <button
            key={text}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(i)}
            className={[
              'num absolute -translate-x-1/2 font-display text-[10px] tracking-wide transition-colors duration-220',
              i === value ? 'text-accent-cyan' : 'text-ink-faint hover:text-ink-secondary',
            ].join(' ')}
            style={{ left: `${(i / LAST) * 100}%` }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
