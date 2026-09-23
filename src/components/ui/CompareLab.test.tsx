import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, useAppStore } from '../../store/useAppStore';
import { CompareLab } from './CompareLab';

beforeEach(() => useAppStore.setState(createInitialState()));

describe('행성 비교 실험실', () => {
  it('예상 후 실제 비교 수치와 피드백을 보여주고 3D로 연결한다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CompareLab onClose={onClose} />);
    const diameter = screen.getByRole('heading', { name: '지름' }).closest('article')!;
    await user.click(within(diameter).getByRole('button', { name: '지구' }));
    expect(within(diameter).getByRole('status')).toHaveTextContent('목성이(가) 더 커요');
    expect(within(diameter).getByText(/139,820/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3D에서 목성 보기' }));
    expect(useAppStore.getState().selectedId).toBe('jupiter');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
