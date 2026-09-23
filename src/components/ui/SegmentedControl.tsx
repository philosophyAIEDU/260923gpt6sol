import { motion } from 'framer-motion';
import { useId } from 'react';
import { motion as motionTokens } from '../../styles/tokens';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** 좁은 화면(640px 미만)에서 쓸 짧은 라벨 */
  shortLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

/**
 * iOS 스타일 세그먼트 컨트롤. 선택 표시(thumb)가 framer-motion layoutId로
 * 옵션 사이를 스프링 없이 부드럽게(250ms easeOut) 미끄러집니다.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedControlProps<T>): JSX.Element {
  const id = useId();
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={[
              'relative z-10 whitespace-nowrap rounded-full font-display font-medium tracking-wide transition-colors duration-220',
              pad,
              active ? 'text-space-900' : 'text-ink-secondary hover:text-ink-primary',
            ].join(' ')}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-accent-cyan to-[#a4ecff] shadow-[0_0_18px_-4px_rgba(140,217,209,0.8)]"
                transition={{ duration: motionTokens.slow / 1000, ease: motionTokens.easeOut }}
              />
            )}
            {opt.shortLabel ? (
              <>
                <span className="sm:hidden">{opt.shortLabel}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </>
            ) : (
              opt.label
            )}
          </button>
        );
      })}
    </div>
  );
}
