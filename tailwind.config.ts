import type { Config } from 'tailwindcss';
import { colors, fonts } from './src/styles/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: colors.space,
        accent: colors.accent,
        ink: colors.ink,
        glass: colors.glass,
      },
      fontFamily: {
        display: [...fonts.display],
        body: [...fonts.body],
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-cubic': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        150: '150ms',
        220: '220ms',
        300: '300ms',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: '0 24px 60px -24px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        glow: '0 0 0 1px rgba(77, 216, 255, 0.45), 0 0 24px -4px rgba(77, 216, 255, 0.55)',
        'glow-violet': '0 0 0 1px rgba(124, 92, 255, 0.5), 0 0 28px -6px rgba(124, 92, 255, 0.6)',
      },
      letterSpacing: {
        widest2: '0.32em',
      },
      keyframes: {
        'orbit-spin': { to: { transform: 'rotate(360deg)' } },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'orbit-slow': 'orbit-spin 9s linear infinite',
        'orbit-mid': 'orbit-spin 5.5s linear infinite',
        'orbit-fast': 'orbit-spin 3.2s linear infinite',
        'pulse-soft': 'pulse-soft 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
