import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBody } from '../data';
import { askAstronomyTeacher, GEMINI_MODEL } from './gemini';

afterEach(() => vi.unstubAllGlobals());

describe('AI 천문 선생님 API', () => {
  it('정해진 모델과 요청 헤더로 키를 보내고 선택 천체 문맥을 전달한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '토성의 고리는 ' }, { text: '얼음 조각으로 이루어져 있어요.' }] } }] }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await askAstronomyTeacher('  private-key  ', [{ role: 'user', text: '토성의 고리는 무엇인가요?' }], getBody('saturn'));
    expect(result).toContain('얼음 조각');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain(`/models/${GEMINI_MODEL}:generateContent`);
    expect(options.headers['x-goog-api-key']).toBe('private-key');
    expect(url).not.toContain('private-key');
    expect(options.body).not.toContain('private-key');
    expect(JSON.parse(options.body).systemInstruction.parts[0].text).toContain('토성');
  });

  it('키 오류에서 서버 응답 내용을 노출하지 않고 안내한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(askAstronomyTeacher('bad', [{ role: 'user', text: '안녕' }], undefined)).rejects.toThrow('API 키와 Gemini API 사용 권한');
  });
});
