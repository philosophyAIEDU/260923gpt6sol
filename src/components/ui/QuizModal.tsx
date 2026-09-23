import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import { scoreMessage } from '../../utils/quiz';
import { Confetti } from './Confetti';
import { ArrowRightIcon, CheckIcon, CloseIcon } from './Icons';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function ScoreRing({ score, total }: { score: number; total: number }): JSX.Element {
  const r = 44;
  const c = 2 * Math.PI * r;
  const ratio = total === 0 ? 0 : score / total;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="score-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#d3ae75" />
            <stop offset="100%" stopColor="#8cd9d1" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#score-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - ratio) }}
          transition={{ duration: 1.1, ease: m.easeOut, delay: 0.15 }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(140,217,209,0.6))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-display text-3xl font-semibold text-ink-primary">
          {score}
          <span className="text-base text-ink-muted">/{total}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * 퀴즈 패널 — 화면 왼쪽에 떠 있어 가운데 3D 씬(정답 행성으로 날아가는 카메라)을 가리지 않습니다.
 * 정답: 글로우 펄스 + 컨페티 / 오답: 흔들림 + 정답 보기 강조.
 */
export function QuizModal(): JSX.Element {
  const quiz = useAppStore((s) => s.quiz);
  const answerQuiz = useAppStore((s) => s.answerQuiz);
  const nextQuestion = useAppStore((s) => s.nextQuestion);
  const closeQuiz = useAppStore((s) => s.closeQuiz);
  const openQuiz = useAppStore((s) => s.openQuiz);
  const [burst, setBurst] = useState(0);

  const q = quiz.questions[quiz.index];
  const answered = quiz.picked !== null;
  const correct = answered && quiz.picked === q?.answerIndex;
  const total = quiz.questions.length;

  const onPick = (i: number): void => {
    const result = answerQuiz(i);
    if (result) setBurst((b) => b + 1);
  };

  return (
    <AnimatePresence>
      {quiz.open && q && (
        <motion.section
          key="quiz"
          role="dialog"
          aria-modal="false"
          aria-label="태양계 퀴즈"
          className="glass-strong pointer-events-auto fixed inset-x-3 bottom-3 z-30 max-h-[70vh] overflow-y-auto rounded-3xl p-6 scrollbar-none md:absolute md:inset-x-auto md:bottom-auto md:left-6 md:top-36 md:w-[400px] md:max-h-[calc(100vh-15rem)] md:p-7"
          initial={{ opacity: 0, x: -48, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -48, filter: 'blur(4px)' }}
          transition={{ duration: m.slow / 1000, ease: m.easeOut }}
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow text-accent-cyan">Quiz Mode</p>
            <button type="button" className="icon-btn -mr-2 h-8 w-8" aria-label="퀴즈 닫기" onClick={closeQuiz}>
              <CloseIcon size={16} />
            </button>
          </div>

          {/* 진행 표시 */}
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {quiz.questions.map((qq, i) => (
              <span
                key={qq.id}
                className={[
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  i < quiz.index || (i === quiz.index && answered)
                    ? 'bg-accent-cyan/80'
                    : i === quiz.index
                      ? 'bg-white/30'
                      : 'bg-white/[0.08]',
                ].join(' ')}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {quiz.finished ? (
              <motion.div
                key="result"
                className="flex flex-col items-center py-4 text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: m.slow / 1000, ease: m.easeOut }}
              >
                <p className="eyebrow mt-4">결과</p>
                <div className="mt-4">
                  <ScoreRing score={quiz.score} total={total} />
                </div>
                <p className="mt-5 max-w-[280px] text-sm leading-relaxed text-ink-secondary">
                  {scoreMessage(quiz.score, total)}
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openQuiz()}
                    className="rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan px-5 py-2.5 font-display text-xs font-semibold text-space-900 shadow-[0_8px_30px_-8px_rgba(140,217,209,0.8)] transition-transform duration-220 hover:scale-[1.03]"
                  >
                    다시 도전
                  </button>
                  <button
                    type="button"
                    onClick={closeQuiz}
                    className="rounded-full border border-white/10 px-5 py-2.5 font-display text-xs text-ink-secondary transition-colors duration-220 hover:text-ink-primary"
                  >
                    탐험으로 돌아가기
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: m.base / 1000, ease: m.easeOut }}
              >
                <p className="num mt-5 font-display text-[11px] text-ink-muted">
                  문제 {quiz.index + 1} / {total}
                </p>
                <h3 className="mt-2 text-[17px] font-medium leading-snug text-ink-primary">{q.question}</h3>

                <ul className="mt-5 flex flex-col gap-2">
                  {q.options.map((opt, i) => {
                    const isPicked = quiz.picked === i;
                    const isAnswer = i === q.answerIndex;
                    const state = !answered ? 'idle' : isAnswer ? 'correct' : isPicked ? 'wrong' : 'dim';
                    return (
                      <li key={opt} className="relative">
                        <motion.button
                          type="button"
                          disabled={answered}
                          onClick={() => onPick(i)}
                          animate={
                            state === 'wrong'
                              ? { x: [0, -7, 7, -5, 5, 0] }
                              : state === 'correct' && isPicked
                                ? { scale: [1, 1.03, 1] }
                                : { x: 0, scale: 1 }
                          }
                          transition={{ duration: 0.42, ease: 'easeOut' }}
                          className={[
                            'group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-220 ease-out-quint',
                            state === 'idle' &&
                              'border-white/[0.08] bg-white/[0.02] text-ink-secondary hover:border-accent-cyan/40 hover:bg-accent-cyan/[0.05] hover:text-ink-primary',
                            state === 'correct' &&
                              'border-accent-success/60 bg-accent-success/10 text-ink-primary shadow-[0_0_24px_-6px_rgba(92,242,176,0.7)]',
                            state === 'wrong' && 'border-accent-danger/60 bg-accent-danger/10 text-ink-primary',
                            state === 'dim' && 'border-white/[0.05] text-ink-faint',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span
                            className={[
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-[11px] font-semibold transition-colors duration-220',
                              state === 'correct'
                                ? 'bg-accent-success text-space-900'
                                : state === 'wrong'
                                  ? 'bg-accent-danger text-space-900'
                                  : 'bg-white/[0.06] text-ink-muted group-hover:text-accent-cyan',
                            ].join(' ')}
                          >
                            {state === 'correct' ? <CheckIcon size={14} /> : state === 'wrong' ? <CloseIcon size={13} /> : LETTERS[i]}
                          </span>
                          {opt}
                        </motion.button>
                        {state === 'correct' && isPicked && <Confetti seed={burst * 7919 + 13} />}
                        {state === 'correct' && isPicked && (
                          <motion.span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-xl border border-accent-success"
                            initial={{ opacity: 0.9, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.08 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: m.slow / 1000, ease: m.easeOut }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 rounded-xl bg-white/[0.03] p-4" role="status" aria-live="polite">
                        <p
                          className={[
                            'font-display text-sm font-semibold',
                            correct ? 'text-accent-success' : 'text-accent-danger',
                          ].join(' ')}
                        >
                          {correct ? '정답이에요! 🎉' : '아쉬워요, 정답을 확인해 볼까요?'}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{q.explanation}</p>
                        <p className="mt-2 text-[11px] text-ink-faint">카메라가 정답 천체로 이동했어요 →</p>
                      </div>
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan py-3 font-display text-sm font-semibold text-space-900 shadow-[0_8px_30px_-10px_rgba(140,217,209,0.9)] transition-transform duration-220 hover:scale-[1.015]"
                      >
                        {quiz.index >= total - 1 ? '결과 보기' : '다음 문제'}
                        <ArrowRightIcon size={16} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
