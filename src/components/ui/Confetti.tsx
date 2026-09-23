import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { colors } from '../../styles/tokens';
import { mulberry32 } from '../../utils/textures/noise';

interface ConfettiProps {
  /** 버스트마다 다른 모양이 되도록 하는 시드 */
  seed: number;
  count?: number;
}

const PALETTE = [colors.accent.cyan, colors.accent.violet, colors.accent.success, '#ffd27a', '#ffffff'];

/** 정답 시 터지는 컨페티 파티클 (DOM + framer-motion, 0.9초 후 사라짐) */
export function Confetti({ seed, count = 26 }: ConfettiProps): JSX.Element {
  const particles = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 50 + rand() * 90;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.7 - 20,
        rotate: (rand() - 0.5) * 540,
        color: PALETTE[Math.floor(rand() * PALETTE.length)],
        w: 3 + rand() * 4,
        h: rand() > 0.5 ? 3 + rand() * 3 : 8 + rand() * 4,
        delay: rand() * 0.08,
      };
    });
  }, [seed, count]);

  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0 w-0">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-[1px]"
          style={{ width: p.w, height: p.h, background: p.color, boxShadow: `0 0 6px ${p.color}` }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: 0.95, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}
