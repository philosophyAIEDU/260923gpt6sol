import { AnimatePresence, motion } from 'framer-motion';
import { resetSimTimeToNow } from '../../store/runtime';
import { selectSpeed, useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import { speedLabel } from '../../utils/time';
import { PauseIcon, PlayIcon, ResetIcon } from './Icons';
import { SpeedSlider } from './SpeedSlider';

/** 하단 중앙 시간 컨트롤 도크 */
export function TimeControl(): JSX.Element {
  const speedIndex = useAppStore((s) => s.speedIndex);
  const speed = useAppStore(selectSpeed);
  const setSpeedIndex = useAppStore((s) => s.setSpeedIndex);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const showToast = useAppStore((s) => s.showToast);
  const paused = speed === 0;
  const label = speedLabel(speed);

  return (
    <section
      aria-label="시간 컨트롤"
      className="glass pointer-events-auto flex w-full max-w-[560px] items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-4 sm:px-4"
    >
      <button
        type="button"
        onClick={togglePlay}
        aria-label={paused ? '재생' : '일시정지'}
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-220 ease-out-quint',
          paused
            ? 'bg-accent-cyan text-space-900 shadow-[0_0_24px_-2px_rgba(140,217,209,0.8)] hover:scale-105'
            : 'bg-white/[0.06] text-ink-primary hover:bg-white/[0.1]',
        ].join(' ')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={paused ? 'play' : 'pause'}
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            transition={{ duration: m.fast / 1000, ease: m.easeOut }}
            className="flex"
          >
            {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
          </motion.span>
        </AnimatePresence>
      </button>

      <div className="min-w-0 flex-1 pt-1">
        <SpeedSlider value={speedIndex} onChange={setSpeedIndex} />
      </div>

      <div className="hidden w-[92px] shrink-0 flex-col items-end sm:flex">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={label.short}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: m.fast / 1000, ease: m.easeOut }}
            className="flex flex-col items-end"
          >
            <span className="num font-display text-base font-semibold leading-tight text-ink-primary">{label.short}</span>
            <span className="num text-[10px] text-ink-muted">{label.detail}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="icon-btn shrink-0"
        aria-label="오늘 날짜로 돌아가기"
        title="오늘 날짜로"
        onClick={() => {
          resetSimTimeToNow();
          showToast('오늘 날짜의 실제 행성 배치로 돌아왔어요.', 'success');
        }}
      >
        <ResetIcon size={17} />
      </button>
    </section>
  );
}
