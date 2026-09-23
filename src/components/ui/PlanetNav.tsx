import { motion } from 'framer-motion';
import { NAV_ORDER, getBody } from '../../data';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import type { CelestialBody } from '../../types';

const NAV_BODIES: CelestialBody[] = NAV_ORDER.map((id) => getBody(id)).filter(
  (b): b is CelestialBody => b !== undefined,
);

/**
 * 천체 목록 네비게이션 — 데스크톱은 좌측 세로 레일, 모바일은 하단 가로 스크롤 칩.
 * 선택 표시 막대는 layoutId로 항목 사이를 부드럽게 이동합니다.
 */
export function PlanetNav(): JSX.Element {
  const selectedId = useAppStore((s) => s.selectedId);
  const select = useAppStore((s) => s.select);
  const hover = useAppStore((s) => s.hover);

  return (
    <nav aria-label="천체 목록" className="pointer-events-auto">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible">
        {NAV_BODIES.map((body) => {
          const active = body.id === selectedId;
          const isMoon = body.type === 'moon';
          return (
            <li key={body.id} className={isMoon ? 'md:pl-4' : ''}>
              <button
                type="button"
                onClick={() => select(active ? null : body.id)}
                onPointerEnter={() => hover(body.id)}
                onPointerLeave={() => hover(null)}
                aria-current={active ? 'true' : undefined}
                className={[
                  'group relative flex items-center gap-2.5 whitespace-nowrap rounded-full py-1.5 pl-3 pr-3.5 md:rounded-lg md:pr-5',
                  'text-[13px] transition-all duration-220 ease-out-quint',
                  'max-md:glass max-md:py-2',
                  active ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-primary',
                ].join(' ')}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-accent-cyan/[0.14] to-transparent md:rounded-lg"
                    transition={{ duration: m.base / 1000, ease: m.easeOut }}
                  >
                    <span className="absolute left-0 top-1/2 hidden h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent-cyan shadow-[0_0_10px_rgba(77,216,255,0.9)] md:block" />
                  </motion.span>
                )}
                <span
                  aria-hidden
                  className={[
                    'block rounded-full transition-transform duration-220 group-hover:scale-125',
                    isMoon ? 'h-1.5 w-1.5' : body.type === 'star' ? 'h-2.5 w-2.5' : 'h-2 w-2',
                  ].join(' ')}
                  style={{
                    background: body.color,
                    boxShadow: active || body.type === 'star' ? `0 0 10px ${body.color}` : undefined,
                  }}
                />
                <span className={isMoon ? 'text-[12px]' : ''}>{body.name}</span>
                <span className="hidden font-display text-[10px] uppercase tracking-wider text-ink-faint transition-colors duration-220 group-hover:text-ink-muted lg:inline">
                  {body.nameEn}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
