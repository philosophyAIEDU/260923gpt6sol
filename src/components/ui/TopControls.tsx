import { useAppStore } from '../../store/useAppStore';
import type { ScaleMode } from '../../types';
import { QuizIcon } from './Icons';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import { SettingsPopover } from './SettingsPopover';

const SCALE_OPTIONS: ReadonlyArray<SegmentOption<ScaleMode>> = [
  { value: 'learning', label: '학습용 비율', shortLabel: '학습용' },
  { value: 'real', label: '실제 비율', shortLabel: '실제' },
];

/** 우상단 컨트롤: 비율 모드 세그먼트 + 퀴즈 + 설정 */
export function TopControls({ onTour, onGallery, tourOpen = false, galleryOpen = false }: { onTour?: () => void; onGallery?: () => void; tourOpen?: boolean; galleryOpen?: boolean } = {}): JSX.Element {
  const scaleMode = useAppStore((s) => s.scaleMode);
  const setScaleMode = useAppStore((s) => s.setScaleMode);
  const quizOpen = useAppStore((s) => s.quiz.open);
  const openQuiz = useAppStore((s) => s.openQuiz);
  const closeQuiz = useAppStore((s) => s.closeQuiz);

  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
      <div className="glass rounded-full">
        <SegmentedControl options={SCALE_OPTIONS} value={scaleMode} onChange={setScaleMode} ariaLabel="비율 모드" />
      </div>
      {onTour && <button type="button" onClick={onTour} aria-pressed={tourOpen} className="glass rounded-full px-3 py-2.5 text-xs font-medium text-accent-cyan hover:bg-white/10">▶ 3D 탐사</button>}
      {onGallery && <button type="button" onClick={onGallery} aria-pressed={galleryOpen} className="glass rounded-full px-3 py-2.5 text-xs font-medium text-ink-primary hover:bg-white/10">NASA 사진</button>}
      <button
        type="button"
        onClick={() => (quizOpen ? closeQuiz() : openQuiz())}
        aria-pressed={quizOpen}
        className={[
          'group relative flex h-10 items-center gap-2 overflow-hidden rounded-full px-3 font-display sm:px-4 text-xs font-medium tracking-wide',
          'transition-all duration-220 ease-out-quint',
          quizOpen
            ? 'glass text-accent-cyan shadow-glow'
            : 'bg-gradient-to-r from-accent-violet to-[#5b8cff] text-ink-primary shadow-[0_8px_30px_-8px_rgba(124,92,255,0.8)] hover:shadow-[0_8px_36px_-6px_rgba(124,92,255,1)]',
        ].join(' ')}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <QuizIcon size={16} />
        <span className="sr-only sm:not-sr-only">{quizOpen ? '퀴즈 닫기' : '퀴즈 모드'}</span>
      </button>
      <SettingsPopover />
    </div>
  );
}
