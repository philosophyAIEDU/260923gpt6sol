import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
  };
}

export const PlayIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const PauseIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <rect x="6.5" y="5.5" width="3.6" height="13" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.9" y="5.5" width="3.6" height="13" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const CloseIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const SettingsIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

export const QuizIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.9 8l4.6.4-3.5 3 1.1 4.6L12 13.6 7.9 16l1.1-4.6-3.5-3 4.6-.4L12 3.5Z" />
    <path d="M5 20.5h14" opacity=".5" />
  </svg>
);

export const OrbitIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-20 12 12)" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    <circle cx="19.6" cy="9.1" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const LabelIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7.9a2 2 0 0 1 1.5.7l3.6 4.3a3 3 0 0 1 0 3.9l-3.6 4.3a2 2 0 0 1-1.5.8H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
    <circle cx="9" cy="12" r="1.4" />
  </svg>
);

export const SoundOnIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
  </svg>
);

export const SoundOffIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </svg>
);

export const ResetIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5v3.8h3.8" />
  </svg>
);

export const CheckIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CompassIcon = (p: IconProps): JSX.Element => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </svg>
);
