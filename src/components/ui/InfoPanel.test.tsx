import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBody } from '../../data';
import { createInitialState, useAppStore } from '../../store/useAppStore';
import { InfoPanel, buildStats } from './InfoPanel';

beforeEach(() => {
  useAppStore.setState(createInitialState());
});

describe('InfoPanel', () => {
  it('선택된 천체가 없으면 아무것도 렌더링하지 않는다', () => {
    render(<InfoPanel />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('천체 선택 시 이름·지름·거리·주기·위성 수·설명을 보여준다', () => {
    act(() => useAppStore.getState().select('earth'));
    render(<InfoPanel />);
    const panel = screen.getByRole('complementary', { name: '지구 정보' });
    expect(panel).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '지구' })).toBeInTheDocument();
    expect(screen.getByText('12,742 km')).toBeInTheDocument();
    expect(screen.getByText('1.00 AU')).toBeInTheDocument();
    expect(screen.getByText('365.3일')).toBeInTheDocument();
    expect(screen.getByText('23.9시간')).toBeInTheDocument();
    expect(screen.getByText('1개')).toBeInTheDocument();
    expect(screen.getByText(/생명체가 확인된 유일한 천체/)).toBeInTheDocument();
  });

  it('닫기 버튼은 선택을 해제한다', async () => {
    const user = userEvent.setup();
    act(() => useAppStore.getState().select('mars'));
    render(<InfoPanel />);
    await user.click(screen.getByRole('button', { name: '정보 패널 닫기' }));
    expect(useAppStore.getState().selectedId).toBeNull();
  });

  it('위성 칩과 다음 버튼으로 다른 천체로 이동한다', async () => {
    const user = userEvent.setup();
    act(() => useAppStore.getState().select('earth'));
    render(<InfoPanel />);
    await user.click(screen.getByRole('button', { name: '달' }));
    expect(useAppStore.getState().selectedId).toBe('moon');
    await waitFor(() => expect(screen.getByRole('heading', { name: '달' })).toBeInTheDocument());
    // 위성에서는 모행성 칩이 보인다
    expect(screen.getByRole('button', { name: '지구' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /다음/ }));
    expect(useAppStore.getState().selectedId).toBe('mars');
  });

  it('buildStats: 태양/위성/행성별 항목', () => {
    const sun = getBody('sun');
    const moon = getBody('moon');
    const venus = getBody('venus');
    if (!sun || !moon || !venus) throw new Error('data');
    expect(buildStats(sun).map((s) => s.value)).toContain('태양계 중심');
    expect(buildStats(moon).find((s) => s.label.includes('지구과의 거리'))?.value).toBe('384,399 km');
    expect(buildStats(venus).find((s) => s.label === '자전 주기')?.value).toBe('243일 (역방향)');
  });
});
