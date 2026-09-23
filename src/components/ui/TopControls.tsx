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
interface TopControlsProps {
  onTour?: () => void;
  onGallery?: () => void;
  onTeacher?: () => void;
  onCompare?: () => void;
  onQuizToggle?: () => void;
  tourOpen?: boolean;
  galleryOpen?: boolean;
  teacherOpen?: boolean;
  compareOpen?: boolean;
}

export function TopControls({ onTour, onGallery, onTeacher, onCompare, onQuizToggle, tourOpen = false, galleryOpen = false, teacherOpen = false, compareOpen = false }: TopControlsProps = {}): JSX.Element {
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
      {onGallery && <button type="button" onClick={onGallery} aria-pressed={galleryOpen} className="glass rounded-full px-3 py-2.5 text-xs font-medium text-ink-primary hover:bg-white/10">사진 아틀라스</button>}
      {onCompare && <button type="button" onClick={onCompare} aria-pressed={compareOpen} className="glass rounded-full px-3 py-2.5 text-xs font-medium text-ink-primary hover:bg-white/10">행성 비교</button>}
      {onTeacher && <button type="button" onClick={onTeacher} aria-pressed={teacherOpen} className="glass rounded-full px-3 py-2.5 text-xs font-medium text-accent-cyan hover:bg-white/10">✦ AI 선생님</button>}
      <button
        type="button"
        onClick={() => onQuizToggle ? onQuizToggle() : (quizOpen ? closeQuiz() : openQuiz())}
        aria-pressed={quizOpen}
        className={[
          'group relative flex h-10 items-center gap-2 overflow-hidden rounded-full px-3 font-display sm:px-4 text-xs font-medium tracking-wide',
          'transition-all duration-220 ease-out-quint',
          quizOpen
            ? 'glass text-accent-cyan shadow-glow'
            : 'border border-accent-violet/60 bg-accent-violet text-space-950 shadow-[0_8px_24px_-12px_rgba(211,174,117,0.8)] hover:bg-[#e2c496]',
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
