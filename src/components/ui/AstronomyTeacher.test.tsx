import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, useAppStore } from '../../store/useAppStore';
import { AstronomyTeacher } from './AstronomyTeacher';

beforeEach(() => { window.localStorage.clear(); useAppStore.setState(createInitialState()); });
afterEach(() => vi.unstubAllGlobals());

describe('AI 천문 선생님', () => {
  it('키 없이 전송을 막고, 키를 넣으면 답변을 표시하며 키를 지운다', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '지구는 태양을 공전해요.' }] } }] }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<AstronomyTeacher open onClose={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: '천문 질문' }), '지구는 움직이나요?');
    await user.click(screen.getByRole('button', { name: '질문' }));
    expect(screen.getByRole('alert')).toHaveTextContent('API 키');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('내 Gemini API 키'), 'test-user-key');
    expect(window.localStorage.length).toBe(0);
    await user.click(screen.getByRole('button', { name: '질문' }));
    await waitFor(() => expect(screen.getByText('지구는 태양을 공전해요.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'API 키 지우기' }));
    expect(screen.getByLabelText('내 Gemini API 키')).toHaveValue('');
    expect(window.localStorage.length).toBe(0);
  });

  it('명시적으로 선택한 경우에만 로컬 저장하고, 선택 해제 시 삭제한다', async () => {
    const user = userEvent.setup();
    const first = render(<AstronomyTeacher open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText('내 Gemini API 키'), 'opt-in-key');
    expect(window.localStorage.length).toBe(0);
    await user.click(screen.getByRole('checkbox', { name: /이 기기에 API 키 저장/ }));
    expect(window.localStorage.getItem('solar-gemini-user-key')).toBe('opt-in-key');
    first.unmount();
    render(<AstronomyTeacher open onClose={vi.fn()} />);
    expect(screen.getByLabelText('내 Gemini API 키')).toHaveValue('opt-in-key');
    await user.click(screen.getByRole('checkbox', { name: /이 기기에 API 키 저장/ }));
    expect(window.localStorage.getItem('solar-gemini-user-key')).toBeNull();
    expect(window.localStorage.getItem('solar-gemini-remember-key')).toBeNull();
  });
});
