import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useFps } from '../../hooks/useFps';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import type { Quality } from '../../types';
import { LabelIcon, OrbitIcon, SettingsIcon, SoundOffIcon, SoundOnIcon } from './Icons';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';

const QUALITY_OPTIONS: ReadonlyArray<SegmentOption<Quality>> = [
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '높음' },
];

const QUALITY_HINT: Record<Quality, string> = {
  low: '후처리(Bloom 등) 끔 · 저사양 기기용',
  medium: 'Bloom + 비네트 · 균형',
  high: '멀티샘플링 + 필름 그레인 · 최고 화질',
};

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon: JSX.Element;
}

function ToggleRow({ label, checked, onChange, icon }: ToggleRowProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="group flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-[13px] text-ink-secondary transition-colors duration-220 hover:bg-white/[0.04] hover:text-ink-primary"
    >
      <span className="flex items-center gap-2.5">
        <span className={checked ? 'text-accent-cyan' : 'text-ink-muted'}>{icon}</span>
        {label}
      </span>
      <span
        className={[
          'relative h-5 w-9 rounded-full border transition-colors duration-220',
          checked ? 'border-accent-cyan/50 bg-accent-cyan/25' : 'border-white/10 bg-white/[0.05]',
        ].join(' ')}
      >
        <motion.span
          className={[
            'absolute top-[2px] h-3.5 w-3.5 rounded-full',
            checked ? 'bg-accent-cyan shadow-[0_0_10px_rgba(140,217,209,0.9)]' : 'bg-ink-muted',
          ].join(' ')}
          animate={{ left: checked ? 18 : 2 }}
          transition={{ duration: m.base / 1000, ease: m.easeOut }}
        />
      </span>
    </button>
  );
}

/** 설정 팝오버: 그래픽 품질, 궤도선/이름표/사운드 토글, FPS */
export function SettingsPopover(): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const quality = useAppStore((s) => s.quality);
  const setQuality = useAppStore((s) => s.setQuality);
  const showOrbits = useAppStore((s) => s.showOrbits);
  const showLabels = useAppStore((s) => s.showLabels);
  const soundOn = useAppStore((s) => s.soundOn);
  const toggleOrbits = useAppStore((s) => s.toggleOrbits);
  const toggleLabels = useAppStore((s) => s.toggleLabels);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const fps = useFps(open);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-btn glass h-10 w-10"
        aria-label="설정"
        aria-expanded={open}
        aria-pressed={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SettingsIcon />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-strong absolute right-0 top-12 z-30 w-72 rounded-2xl p-4"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: m.base / 1000, ease: m.easeOut }}
            style={{ transformOrigin: 'top right' }}
          >
            <div className="flex items-center justify-between">
              <p className="eyebrow">그래픽 품질</p>
              <span className="num font-display text-[11px] text-ink-muted">
                <span className={fps >= 50 ? 'text-accent-success' : fps >= 30 ? 'text-accent-warning' : 'text-accent-danger'}>
                  {fps || '--'}
                </span>{' '}
                FPS
              </span>
            </div>
            <div className="mt-3">
              <SegmentedControl options={QUALITY_OPTIONS} value={quality} onChange={(q) => setQuality(q)} ariaLabel="그래픽 품질" size="sm" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{QUALITY_HINT[quality]}</p>
            <div className="hairline my-4" />
            <p className="eyebrow mb-1.5">표시</p>
            <ToggleRow label="궤도선" checked={showOrbits} onChange={toggleOrbits} icon={<OrbitIcon size={16} />} />
            <ToggleRow label="이름표" checked={showLabels} onChange={toggleLabels} icon={<LabelIcon size={16} />} />
            <ToggleRow
              label="앰비언트 사운드"
              checked={soundOn}
              onChange={toggleSound}
              icon={soundOn ? <SoundOnIcon size={16} /> : <SoundOffIcon size={16} />}
            />
            <div className="hairline my-4" />
            <p className="text-[11px] leading-relaxed text-ink-faint">
              <kbd className="font-display text-ink-muted">Space</kbd> 재생/정지 · <kbd className="font-display text-ink-muted">← →</kbd> 천체 이동 ·{' '}
              <kbd className="font-display text-ink-muted">Esc</kbd> 전체 보기
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
