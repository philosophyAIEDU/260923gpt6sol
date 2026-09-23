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
    expect(screen.getAllByRole('link', { name: 'NASA 원본 ↗' })).toHaveLength(11);
    await user.click(screen.getAllByRole('button', { name: '3D에서 보기' })[0]);
    expect(useAppStore.getState().selectedId).toBe('sun');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
