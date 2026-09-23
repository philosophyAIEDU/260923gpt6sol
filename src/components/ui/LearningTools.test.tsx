import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, useAppStore } from '../../store/useAppStore';
import { GuidedTour } from './GuidedTour';
import { PhotoGallery } from './PhotoGallery';

beforeEach(() => useAppStore.setState(createInitialState()));

describe('학생용 탐사 도구', () => {
  it('3D 투어에서 학습 질문을 확인하고 다음 천체로 이동한다', async () => {
    const user = userEvent.setup();
    render(<GuidedTour onClose={vi.fn()} onQuiz={vi.fn()} />);
    await waitFor(() => expect(useAppStore.getState().selectedId).toBe('sun'));
    await user.click(screen.getByRole('button', { name: '답 확인' }));
    expect(screen.getByText('약 8분 20초예요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(useAppStore.getState().selectedId).toBe('mercury'));
    expect(screen.getByText('가장 가까운 수성')).toBeInTheDocument();
  });

  it('NASA 원본 링크를 제공하며 사진에서 3D 천체를 선택한다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PhotoGallery onClose={onClose} />);
    expect(screen.getAllByRole('link', { name: 'NASA 원본 ↗' })).toHaveLength(18);
    await user.click(screen.getAllByRole('button', { name: '3D에서 보기' })[0]);
    expect(useAppStore.getState().selectedId).toBe('sun');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('사진을 확대하고 키보드로 넘긴 뒤 원래 사진으로 초점을 돌린다', async () => {
    const user = userEvent.setup();
    render(<PhotoGallery onClose={vi.fn()} />);
    const thumbnail = screen.getByRole('button', { name: '태양의 표면 사진 크게 보기' });
    await user.click(thumbnail);
    expect(screen.getByRole('dialog', { name: '태양의 표면 확대 사진' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: '수성의 지형 확대 사진' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /확대 사진/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '수성의 지형 사진 크게 보기' })).toHaveFocus());
  });
});
