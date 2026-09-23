import type { QuizQuestion } from '../types';

export type RandomFn = () => number;

/** Fisher–Yates 셔플 (원본 배열은 변경하지 않음). 테스트를 위해 난수 함수를 주입할 수 있습니다. */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** 문제 순서를 섞고 count개만 뽑습니다. 보기 순서도 섞되 정답 인덱스를 함께 갱신합니다. */
export function buildQuizRound(
  questions: readonly QuizQuestion[],
  count: number,
  random: RandomFn = Math.random,
): QuizQuestion[] {
  return shuffle(questions, random)
    .slice(0, Math.max(1, Math.min(count, questions.length)))
    .map((q) => {
      const order = shuffle(
        q.options.map((_, i) => i),
        random,
      );
      return {
        ...q,
        options: order.map((i) => q.options[i]),
        answerIndex: order.indexOf(q.answerIndex),
      };
    });
}

export function scoreMessage(score: number, total: number): string {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio === 1) return '완벽해요! 진정한 우주 탐험가예요 🚀';
  if (ratio >= 0.7) return '훌륭해요! 태양계를 잘 알고 있네요.';
  if (ratio >= 0.4) return '좋아요! 조금만 더 탐험해 볼까요?';
  return '괜찮아요. 행성을 클릭해 더 알아본 뒤 다시 도전해 보세요!';
}
