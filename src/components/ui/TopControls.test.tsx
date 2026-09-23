import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState, useAppStore } from '../../store/useAppStore';
import { Loader } from './Loader';
import { TopControls } from './TopControls';

beforeEach(() => {
  useAppStore.setState(createInitialState());
});

describe('TopControls', () => {
  it('비율 모드 세그먼트 컨트롤', async () => {
    const user = userEvent.setup();
    render(<TopControls />);
    const real = screen.getByRole('radio', { name: '실제 비율' });
    expect(screen.getByRole('radio', { name: '학습용 비율' })).toHaveAttribute('aria-checked', 'true');
    await user.click(real);
    expect(useAppStore.getState().scaleMode).toBe('real');
    expect(real).toHaveAttribute('aria-checked', 'true');
  });

  it('퀴즈 버튼 토글', async () => {
    const user = userEvent.setup();
    render(<TopControls />);
    await user.click(screen.getByRole('button', { name: '퀴즈 모드' }));
    expect(useAppStore.getState().quiz.open).toBe(true);
    await user.click(screen.getByRole('button', { name: '퀴즈 닫기' }));
    expect(useAppStore.getState().quiz.open).toBe(false);
  });

  it('설정 팝오버: 그래픽 품질과 토글', async () => {
    const user = userEvent.setup();
    render(<TopControls />);
    await user.click(screen.getByRole('button', { name: '설정' }));
    await user.click(await screen.findByRole('radio', { name: '낮음' }));
    expect(useAppStore.getState().quality).toBe('low');
    expect(useAppStore.getState().qualityLocked).toBe(true);
    expect(screen.getByText(/후처리\(Bloom 등\) 끔/)).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: /궤도선/ }));
    expect(useAppStore.getState().showOrbits).toBe(false);
    await user.click(screen.getByRole('switch', { name: /이름표/ }));
    expect(useAppStore.getState().showLabels).toBe(false);
    await user.keyboard('{Escape}');
    // (jsdom에서는 layoutId 요소의 exit 애니메이션이 끝나지 않으므로 상태 속성으로 검증)
    expect(screen.getByRole('button', { name: '설정' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Loader', () => {
  it('진행률과 상태 문구를 보여준다', () => {
    useAppStore.getState().setLoading({ progress: 0.42, label: '목성' });
    render(<Loader />);
    expect(screen.getByRole('status', { name: /42%/ })).toBeInTheDocument();
    expect(screen.getByText('목성 표면 생성 중…')).toBeInTheDocument();
  });
});
