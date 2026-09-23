import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { runtime } from '../../store/runtime';
import { createInitialState, selectSpeed, useAppStore } from '../../store/useAppStore';
import { dateToSimDays } from '../../utils/time';
import { TimeControl } from './TimeControl';

beforeEach(() => {
  useAppStore.setState(createInitialState());
});

describe('TimeControl', () => {
  it('커스텀 슬라이더가 ARIA slider로 노출된다', () => {
    render(<TimeControl />);
    const slider = screen.getByRole('slider', { name: '시간 배속' });
    expect(slider).toHaveAttribute('aria-valuenow', '2');
    expect(slider).toHaveAttribute('aria-valuetext', '10x, 1초 = 10일');
    // 기본 브라우저 range input을 쓰지 않음
    expect(document.querySelector('input[type="range"]')).toBeNull();
  });

  it('키보드로 배속을 바꾼다 (← → Home End)', () => {
    render(<TimeControl />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(selectSpeed(useAppStore.getState())).toBe(100);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(selectSpeed(useAppStore.getState())).toBe(1000);
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(selectSpeed(useAppStore.getState())).toBe(1000);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(selectSpeed(useAppStore.getState())).toBe(0);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(selectSpeed(useAppStore.getState())).toBe(0);
  });

  it('눈금 라벨 클릭으로 배속을 선택한다', async () => {
    const user = userEvent.setup();
    render(<TimeControl />);
    await user.click(screen.getByRole('button', { name: '1,000x' }));
    expect(selectSpeed(useAppStore.getState())).toBe(1000);
    expect(await screen.findByText('1초 ≈ 2.7년')).toBeInTheDocument();
  });

  it('트랙 드래그로 배속을 선택한다', () => {
    render(<TimeControl />);
    const slider = screen.getByRole('slider');
    slider.getBoundingClientRect = () =>
      ({ left: 0, width: 400, top: 0, height: 20, right: 400, bottom: 20, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
    expect(useAppStore.getState().speedIndex).toBe(1);
    fireEvent.pointerMove(slider, { clientX: 390, pointerId: 1 });
    expect(useAppStore.getState().speedIndex).toBe(4);
    fireEvent.pointerUp(slider, { pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 0, pointerId: 1 });
    expect(useAppStore.getState().speedIndex).toBe(4);
  });

  it('재생/일시정지 버튼', async () => {
    const user = userEvent.setup();
    render(<TimeControl />);
    await user.click(screen.getByRole('button', { name: '일시정지' }));
    expect(selectSpeed(useAppStore.getState())).toBe(0);
    expect(await screen.findByText('시간이 멈췄어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '재생' }));
    expect(selectSpeed(useAppStore.getState())).toBe(10);
  });

  it('오늘 날짜로 버튼은 시뮬레이션 시간을 현재로 되돌린다', async () => {
    const user = userEvent.setup();
    runtime.simDays = 0;
    render(<TimeControl />);
    await user.click(screen.getByRole('button', { name: '오늘 날짜로 돌아가기' }));
    expect(runtime.simDays).toBeCloseTo(dateToSimDays(new Date()), 1);
    expect(useAppStore.getState().toast?.tone).toBe('success');
    act(() => useAppStore.getState().dismissToast());
  });
});
