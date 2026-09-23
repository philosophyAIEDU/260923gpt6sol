import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const STOPS = [
  { id: 'sun', title: '태양은 별이에요', fact: '스스로 빛과 열을 내며, 행성들은 태양 둘레를 공전해요.', ask: '태양에서 지구까지 빛이 오는 데 얼마나 걸릴까요?', answer: '약 8분 20초예요.' },
  { id: 'mercury', title: '가장 가까운 수성', fact: '태양에 가장 가깝지만 낮과 밤의 온도 차가 아주 커요.', ask: '태양에 가까우면 가장 뜨거운 행성일까요?', answer: '아니요. 두꺼운 대기가 열을 가두는 금성이 더 뜨거워요.' },
  { id: 'venus', title: '뜨거운 금성', fact: '두꺼운 이산화탄소 대기로 인한 강한 온실 효과가 있어요.', ask: '수성과 금성 중 평균 표면 온도가 더 높은 곳은?', answer: '금성이에요.' },
  { id: 'earth', title: '우리의 지구', fact: '액체 상태의 물이 표면에 풍부하고 생명체가 살아요.', ask: '지구가 태양을 한 바퀴 도는 기간을 무엇이라 할까요?', answer: '1년이에요.' },
  { id: 'mars', title: '붉은 화성', fact: '표면의 산화철 때문에 붉게 보이는 암석 행성이에요.', ask: '화성도 지구처럼 고체 표면이 있을까요?', answer: '네, 있어요.' },
  { id: 'jupiter', title: '거대한 목성', fact: '태양계에서 가장 큰 행성이고, 대기에는 거대한 폭풍이 있어요.', ask: '목성의 줄무늬는 땅의 무늬일까요, 대기의 무늬일까요?', answer: '대기의 구름과 바람이 만든 무늬예요.' },
  { id: 'saturn', title: '고리가 있는 토성', fact: '고리는 얼음과 암석 조각으로 이루어져 있어요.', ask: '고리는 하나의 단단한 판일까요?', answer: '아니요. 수많은 작은 조각들이 공전하고 있어요.' },
  { id: 'neptune', title: '멀리 있는 해왕성', fact: '태양에서 가장 멀리 있는 여덟 번째 행성이에요.', ask: '해왕성 너머에 행성이 더 있을까요?', answer: '여덟 행성은 여기까지예요. 그 너머에는 왜행성 등 다른 천체도 있어요.' },
] as const;

export function GuidedTour({ onClose, onQuiz }: { onClose: () => void; onQuiz: () => void }): JSX.Element {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const select = useAppStore((s) => s.select);
  const setScaleMode = useAppStore((s) => s.setScaleMode);

  useEffect(() => { setScaleMode('learning'); }, [setScaleMode]);
  useEffect(() => { select(STOPS[index].id); setRevealed(false); }, [index, select]);
  useEffect(() => {
    if (!playing || index === STOPS.length - 1) return;
    const timer = window.setTimeout(() => setIndex((i) => i + 1), 11000);
    return () => window.clearTimeout(timer);
  }, [playing, index]);
  const stop = STOPS[index];

  return (
    <section aria-label="3D 탐사 가이드" className="glass-strong pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[55vh] overflow-y-auto rounded-3xl p-5 sm:inset-x-auto sm:bottom-28 sm:left-6 sm:w-[370px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="eyebrow text-accent-cyan">3D 탐사 영상 · {index + 1} / {STOPS.length}</p><h2 className="mt-2 font-display text-xl font-semibold">{stop.title}</h2></div>
        <button type="button" className="icon-btn" aria-label="3D 탐사 종료" onClick={onClose}>✕</button>
      </div>
      <div aria-label="탐사 진행도" className="mt-4 flex gap-1">{STOPS.map((item, i) => <span key={item.id} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-accent-cyan' : 'bg-white/15'}`} />)}</div>
      <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{stop.fact}</p>
      <div className="mt-4 rounded-xl border border-accent-violet/30 bg-accent-violet/10 p-3.5">
        <p className="text-xs font-semibold text-accent-cyan">생각해 보기</p>
        <p className="mt-1 text-sm leading-relaxed">{stop.ask}</p>
        {revealed ? <p className="mt-2 text-sm text-ink-secondary" role="status">{stop.answer}</p> : <button type="button" onClick={() => setRevealed(true)} className="mt-2 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">답 확인</button>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="rounded-full border border-white/15 px-3 py-2 disabled:opacity-40">이전</button>
        <button type="button" onClick={() => { if (index === STOPS.length - 1) { setIndex(0); setPlaying(true); } else setPlaying(!playing); }} className="rounded-full bg-accent-cyan/20 px-3 py-2 text-accent-cyan">{index === STOPS.length - 1 ? '처음부터 재생' : playing ? '자동 진행 멈춤' : '자동 진행 ▶'}</button>
        {index < STOPS.length - 1 ? <button type="button" onClick={() => setIndex(index + 1)} className="rounded-full border border-white/15 px-3 py-2">다음</button> : <button type="button" onClick={onQuiz} className="rounded-full bg-accent-violet px-3 py-2">퀴즈로 복습</button>}
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">화면은 학습용 3D 시뮬레이션입니다. 크기와 거리 비율을 단순화했어요.</p>
    </section>
  );
}
