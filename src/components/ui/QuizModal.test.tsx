import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState, QUIZ_LENGTH, useAppStore } from '../../store/useAppStore';
import { mulberry32 } from '../../utils/textures/noise';
import { QuizModal } from './QuizModal';

beforeEach(() => {
  useAppStore.setState(createInitialState());
});

function openQuiz(seed = 1): void {
  act(() => useAppStore.getState().openQuiz(mulberry32(seed)));
}

function optionButtons(): HTMLElement[] {
  return screen.getAllByRole('listitem').map((li) => li.querySelector('button') as HTMLElement);
}

describe('QuizModal', () => {
  it('닫혀 있으면 렌더링하지 않는다', () => {
    render(<QuizModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('문제와 보기를 보여준다', () => {
    openQuiz();
    render(<QuizModal />);
    const q = useAppStore.getState().quiz.questions[0];
    expect(screen.getByRole('dialog', { name: '태양계 퀴즈' })).toBeInTheDocument();
    expect(screen.getByText(q.question)).toBeInTheDocument();
    expect(screen.getByText(`문제 1 / ${QUIZ_LENGTH}`)).toBeInTheDocument();
    expect(optionButtons()).toHaveLength(q.options.length);
  });

  it('정답 선택: 피드백 + 점수 + 카메라 대상 이동 + 보기 잠금', async () => {
    const user = userEvent.setup();
    openQuiz(2);
    render(<QuizModal />);
    const q = useAppStore.getState().quiz.questions[0];
    await user.click(optionButtons()[q.answerIndex]);
    expect(await screen.findByText(/정답이에요/)).toBeInTheDocument();
    expect(screen.getByText(q.explanation)).toBeInTheDocument();
    expect(useAppStore.getState().quiz.score).toBe(1);
    expect(useAppStore.getState().selectedId).toBe(q.targetId);
    for (const b of optionButtons()) expect(b).toBeDisabled();
  });

  it('오답 선택: 오답 피드백, 점수 변화 없음', async () => {
    const user = userEvent.setup();
    openQuiz(3);
    render(<QuizModal />);
    const q = useAppStore.getState().quiz.questions[0];
    const wrong = (q.answerIndex + 1) % q.options.length;
    await user.click(optionButtons()[wrong]);
    expect(await screen.findByText(/아쉬워요/)).toBeInTheDocument();
    expect(useAppStore.getState().quiz.score).toBe(0);
  });

  it('끝까지 풀면 결과 화면과 다시 도전 버튼이 나온다', async () => {
    const user = userEvent.setup();
    openQuiz(4);
    render(<QuizModal />);
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      const { quiz } = useAppStore.getState();
      const q = quiz.questions[quiz.index];
      await waitFor(() => expect(screen.getByText(q.question)).toBeInTheDocument());
      await user.click(optionButtons()[q.answerIndex]);
      await user.click(await screen.findByRole('button', { name: i === QUIZ_LENGTH - 1 ? /결과 보기/ : /다음 문제/ }));
    }
    expect(await screen.findByText(/완벽해요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 도전' }));
    expect(useAppStore.getState().quiz.index).toBe(0);
    expect(useAppStore.getState().quiz.score).toBe(0);
    await user.click(screen.getByRole('button', { name: '퀴즈 닫기' }));
    expect(useAppStore.getState().quiz.open).toBe(false);
  });
});
