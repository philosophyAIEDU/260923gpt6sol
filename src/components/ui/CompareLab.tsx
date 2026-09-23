import { useState } from 'react';
import { PLANETS } from '../../data';
import { useAppStore } from '../../store/useAppStore';
import type { CelestialBody } from '../../types';

interface Metric {
  title: string;
  unit: string;
  read: (body: CelestialBody) => number;
  display: (value: number) => string;
  clue: string;
}

const format = (value: number): string => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
const METRICS: Metric[] = [
  { title: '지름', unit: 'km', read: (b) => b.diameterKm, display: format, clue: '행성 자체의 너비예요.' },
  { title: '태양까지 평균 거리', unit: 'AU', read: (b) => b.orbit?.semiMajorAxisAU ?? 0, display: (v) => v.toFixed(2), clue: '1 AU는 지구와 태양 사이의 평균 거리예요.' },
  { title: '공전 주기', unit: '지구 일', read: (b) => b.orbit?.periodDays ?? 0, display: (v) => format(Math.round(v)), clue: '태양을 한 바퀴 도는 데 걸리는 시간이에요.' },
];

export function CompareLab({ onClose }: { onClose: () => void }): JSX.Element {
  const [leftId, setLeftId] = useState('earth');
  const [rightId, setRightId] = useState('jupiter');
  const [guess, setGuess] = useState<Record<string, string>>({});
  const select = useAppStore((s) => s.select);
  const left = PLANETS.find((p) => p.id === leftId)!;
  const right = PLANETS.find((p) => p.id === rightId)!;
  const change = (side: 'left' | 'right', id: string): void => {
    if (side === 'left') setLeftId(id); else setRightId(id);
    setGuess({});
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#02040c]/85 p-3 backdrop-blur-md" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="행성 비교 실험실" className="glass-strong flex max-h-[94vh] w-full max-w-[780px] flex-col overflow-hidden rounded-3xl">
        <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-7">
          <div><p className="eyebrow text-accent-cyan">예상하고 수치로 확인하기</p><h2 className="mt-1 font-display text-2xl font-semibold">행성 비교 실험실</h2><p className="mt-2 text-xs text-ink-secondary">두 행성을 고르고, 각 항목에서 더 큰 쪽을 먼저 맞혀 보세요.</p></div>
          <button type="button" onClick={onClose} aria-label="비교 실험실 닫기" className="icon-btn">✕</button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3">
            {([['left', left], ['right', right]] as const).map(([side, body]) => (
              <div key={side} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <label htmlFor={`compare-${side}`} className="eyebrow">{side === 'left' ? '행성 A' : '행성 B'}</label>
                <select id={`compare-${side}`} value={body.id} onChange={(event) => change(side, event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#15192f] px-2 py-2 text-sm text-ink-primary">{PLANETS.map((planet) => <option key={planet.id} value={planet.id}>{planet.name}</option>)}</select>
                <button type="button" onClick={() => { select(body.id); onClose(); }} className="mt-2 text-xs text-accent-cyan underline underline-offset-4">3D에서 {body.name} 보기</button>
              </div>
            ))}
          </div>
          {leftId === rightId ? <p className="rounded-xl bg-white/[0.05] p-4 text-sm">서로 다른 두 행성을 골라 주세요.</p> : METRICS.map((metric) => {
            const first = metric.read(left);
            const second = metric.read(right);
            const maximum = Math.max(first, second);
            const winner = first === second ? 'same' : first > second ? left.id : right.id;
            const answer = guess[metric.title];
            const pairs: Array<[CelestialBody, number]> = [[left, first], [right, second]];
            return <article key={metric.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h3 className="font-display text-base font-semibold">{metric.title}</h3>
              <p className="mt-1 text-xs text-ink-muted">{metric.clue}</p>
              {!answer ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-ink-secondary">어느 쪽이 더 클까요?</span>{[left, right].map((body) => <button key={body.id} type="button" onClick={() => setGuess({ ...guess, [metric.title]: body.id })} className="rounded-full border border-white/20 px-3 py-1.5 hover:border-accent-cyan">{body.name}</button>)}</div> : <>
                <p className={`mt-3 text-sm ${answer === winner ? 'text-emerald-300' : 'text-amber-300'}`} role="status">{answer === winner ? '맞았어요!' : `${winner === 'same' ? '두 행성이 같아요' : `${winner === left.id ? left.name : right.name}이(가) 더 커요`}. 수치를 살펴보세요.`}</p>
                {pairs.map(([planet, number]) => {
                  return <div key={planet.id} className="mt-3 grid grid-cols-[65px_1fr_auto] items-center gap-2 text-xs"><span>{planet.name}</span><div className="h-3 rounded-full bg-white/10"><div className="h-full min-w-[2px] rounded-full" style={{ width: `${number / maximum * 100}%`, background: planet.color }} /></div><span className="num text-ink-secondary">{metric.display(number)} {metric.unit}</span></div>;
                })}
                <p className="mt-2 text-[11px] text-ink-muted">막대는 이 두 행성의 큰 값을 100%로 나타냅니다.</p>
              </>}
            </article>;
          })}
          <p className="text-xs leading-relaxed text-ink-muted">평균 거리는 공전 궤도의 긴반지름입니다. 행성은 움직이므로 어느 순간의 실제 태양 거리와 다를 수 있어요. 3D의 학습용 크기·거리는 실제 비율과 다릅니다.</p>
        </div>
      </section>
    </div>
  );
}
