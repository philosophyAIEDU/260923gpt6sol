import { AnimatePresence, motion } from 'framer-motion';
import { getBody, getMoonsOf } from '../../data';
import { getSpacePhoto } from '../../data/media';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import type { BodyType, CelestialBody } from '../../types';
import {
  auToKm,
  formatAU,
  formatKm,
  formatNumber,
  formatPeriodDays,
  formatRatio,
  formatRotation,
  formatTemp,
} from '../../utils/format';
import { EARTH_DIAMETER_KM } from '../../utils/scale';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons';

const TYPE_LABEL: Record<BodyType, string> = {
  star: '항성 · Star',
  terrestrial: '암석 행성 · Terrestrial',
  'gas-giant': '가스 행성 · Gas Giant',
  'ice-giant': '얼음 거인 · Ice Giant',
  moon: '위성 · Moon',
};

interface Stat {
  label: string;
  value: string;
  sub?: string;
}

export function buildStats(body: CelestialBody): Stat[] {
  const stats: Stat[] = [{ label: '지름', value: formatKm(body.diameterKm) }];
  if (body.orbit && body.parent) {
    stats.push({
      label: `${getBody(body.parent)?.name ?? '모행성'}과의 거리`,
      value: formatKm(auToKm(body.orbit.semiMajorAxisAU)),
    });
  } else if (body.orbit) {
    stats.push({
      label: '태양과의 평균 거리',
      value: formatAU(body.orbit.semiMajorAxisAU),
      sub: formatKm(auToKm(body.orbit.semiMajorAxisAU)),
    });
  } else {
    stats.push({ label: '위치', value: '태양계 중심' });
  }
  stats.push({
    label: '공전 주기',
    value: body.orbit ? formatPeriodDays(body.orbit.periodDays) : '—',
    sub: body.type === 'star' ? '은하 중심을 약 2억 3천만 년에 1바퀴' : undefined,
  });
  stats.push({ label: '자전 주기', value: formatRotation(body.rotationPeriodHours) });
  stats.push({ label: '위성 수', value: body.type === 'star' ? '행성 8개' : `${formatNumber(body.moons)}개` });
  stats.push({ label: body.type === 'star' ? '표면 온도' : '평균 온도', value: formatTemp(body.meanTempC) });
  return stats;
}

function SizeComparison({ body }: { body: CelestialBody }): JSX.Element {
  const ratio = body.diameterKm / EARTH_DIAMETER_KM;
  // 로그 스케일 막대: 달(0.27배) ~ 태양(109배)을 한 막대 안에 표현
  const t = (Math.log10(ratio) + 1) / (Math.log10(120) + 1);
  const earthT = 1 / (Math.log10(120) + 1);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">지구 대비 크기</span>
        <span className="num font-display text-sm font-medium text-ink-primary">{formatRatio(ratio)}</span>
      </div>
      <div className="relative mt-2.5 h-1.5 rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, rgba(211,174,117,0.6), ${body.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(3, Math.min(100, t * 100))}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: m.easeOut }}
        />
        <span
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-secondary/60"
          style={{ left: `${earthT * 100}%` }}
          title="지구"
        />
      </div>
    </div>
  );
}

function PlanetSwatch({ body }: { body: CelestialBody }): JSX.Element {
  const glow = body.type === 'star';
  return (
    <div
      aria-hidden
      className="h-14 w-14 shrink-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.55), ${body.color} 38%, rgba(5,5,16,0.95) 78%)`,
        boxShadow: glow
          ? `0 0 40px 6px ${body.color}88, inset -6px -8px 16px rgba(0,0,0,0.3)`
          : `0 0 28px -6px ${body.color}aa, inset -6px -8px 16px rgba(0,0,0,0.55)`,
      }}
    />
  );
}

function PanelContent({ body }: { body: CelestialBody }): JSX.Element {
  const select = useAppStore((s) => s.select);
  const cycleSelection = useAppStore((s) => s.cycleSelection);
  const moons = getMoonsOf(body.id);
  const parent = body.parent ? getBody(body.parent) : undefined;
  const stats = buildStats(body);
  const photo = getSpacePhoto(body.id);

  return (
    <motion.div
      key={body.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: m.base / 1000, ease: m.easeOut }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-4">
        <PlanetSwatch body={body} />
        <div className="min-w-0">
          <p className="eyebrow">{TYPE_LABEL[body.type]}</p>
          <h2 className="mt-1.5 font-display text-[32px] font-semibold leading-none tracking-tight text-ink-primary">
            {body.name}
          </h2>
          <p className="mt-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-muted">{body.nameEn}</p>
        </div>
      </div>

      <SizeComparison body={body} />

      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-[11px] text-ink-muted">{s.label}</dt>
            <dd className="num mt-1 font-display text-[15px] font-medium text-ink-primary">{s.value}</dd>
            {s.sub && <dd className="num mt-0.5 text-[11px] text-ink-faint">{s.sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="hairline" />

      <p className="text-[13.5px] leading-[1.75] text-ink-secondary">{body.description}</p>

      {body.orbit && !body.parent && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <p className="eyebrow">빛의 여행 시간 · 평균 거리 기준</p>
          <p className="num mt-1 font-display text-lg text-accent-cyan">약 {Math.round(body.orbit.semiMajorAxisAU * 8.317)}분</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">태양에서 여기까지 빛이 오는 시간이에요. 실제 거리는 공전 위치에 따라 달라집니다.</p>
        </div>
      )}

      {photo && (
        <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0d222d]">
          <img className="aspect-[16/9] w-full object-cover" loading="lazy" src={photo.image} alt={`${photo.title} — ${photo.subtitle}`} />
          <figcaption className="p-3 text-xs leading-relaxed text-ink-secondary">
            <span className="font-semibold text-ink-primary">NASA 실제 관측 사진</span> · {photo.subtitle}<br />
            <a href={photo.source} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-accent-cyan underline underline-offset-4">출처: {photo.credit} ↗</a>
          </figcaption>
        </figure>
      )}

      <div className="relative overflow-hidden rounded-xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/[0.07] to-accent-violet/[0.06] px-4 py-3.5">
        <p className="font-display text-[10px] font-medium uppercase tracking-widest2 text-accent-cyan">알고 있었나요?</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-primary/90">{body.funFact}</p>
      </div>

      {(moons.length > 0 || parent) && (
        <div>
          <p className="eyebrow mb-2">{parent ? '모행성' : '주요 위성'}</p>
          <div className="flex flex-wrap gap-2">
            {(parent ? [parent] : moons).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => select(b.id)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-secondary transition-all duration-220 hover:border-accent-cyan/40 hover:text-ink-primary hover:shadow-glow"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => cycleSelection(-1)}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-ink-muted transition-colors duration-220 hover:text-ink-primary"
        >
          <ChevronLeftIcon size={15} /> 이전
        </button>
        <button
          type="button"
          onClick={() => cycleSelection(1)}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-ink-muted transition-colors duration-220 hover:text-ink-primary"
        >
          다음 <ChevronRightIcon size={15} />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * 정보 패널 — 천체 선택 시 오른쪽에서 슬라이드+페이드로 등장 (모바일은 하단 시트).
 * 패널이 열려 있어도 3D 씬 조작이 가능하도록 패널 바깥은 pointer-events를 막지 않습니다.
 * 시뮬레이션 값(위치 등)에 의존하지 않아 고배속에서도 리렌더가 발생하지 않습니다.
 */
export function InfoPanel(): JSX.Element {
  const selectedId = useAppStore((s) => s.selectedId);
  const select = useAppStore((s) => s.select);
  const body = selectedId ? getBody(selectedId) : undefined;

  return (
    <AnimatePresence>
      {body && (
        <motion.aside
          key="info-panel"
          aria-label={`${body.name} 정보`}
          className="glass pointer-events-auto fixed inset-x-3 bottom-3 z-20 max-h-[58vh] overflow-y-auto rounded-3xl p-6 scrollbar-none md:absolute md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:max-h-[calc(100vh-8.5rem)] md:w-[372px] md:p-7"
          initial={{ opacity: 0, x: 48, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 48, filter: 'blur(4px)' }}
          transition={{ duration: m.slow / 1000, ease: m.easeOut }}
        >
          <button
            type="button"
            onClick={() => select(null)}
            aria-label="정보 패널 닫기"
            className="icon-btn absolute right-4 top-4 z-10 h-8 w-8"
          >
            <CloseIcon size={16} />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            <PanelContent key={body.id} body={body} />
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
