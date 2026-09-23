import { describe, expect, it } from 'vitest';
import rawBodies from './planets.json';
import { BODIES, NAV_ORDER, PLANETS, QUIZ_QUESTIONS, SUN, getBody, getMoonsOf, parseBodies, parseQuiz } from '.';

describe('planets.json', () => {
  it('태양 + 8개 행성 + 달을 포함한다', () => {
    expect(SUN.id).toBe('sun');
    expect(PLANETS.map((p) => p.id)).toEqual([
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
    ]);
    expect(getMoonsOf('earth').map((m) => m.id)).toEqual(['moon']);
    expect(getBody('moon')?.parent).toBe('earth');
    expect(getBody('pluto')).toBeUndefined();
  });

  it('네비게이션 순서는 태양 → 행성(+위성)', () => {
    expect(NAV_ORDER[0]).toBe('sun');
    expect(NAV_ORDER.indexOf('moon')).toBe(NAV_ORDER.indexOf('earth') + 1);
    expect(NAV_ORDER).toHaveLength(BODIES.length);
  });

  it('퀴즈 정답 대상 천체가 모두 존재한다', () => {
    expect(QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    for (const q of QUIZ_QUESTIONS) expect(getBody(q.targetId)).toBeDefined();
  });

  it('잘못된 데이터는 명확한 에러를 던진다', () => {
    const clone = (): Record<string, unknown>[] => JSON.parse(JSON.stringify(rawBodies));
    expect(() => parseBodies({})).toThrow(/배열/);
    const a = clone();
    delete a[1].diameterKm;
    expect(() => parseBodies(a)).toThrow(/diameterKm/);
    const b = clone();
    b[1].type = 'comet';
    expect(() => parseBodies(b)).toThrow(/허용되지 않는/);
    const c = clone();
    c[4].parent = 'nowhere';
    expect(() => parseBodies(c)).toThrow(/nowhere/);
    const d = clone();
    d[2].orbit = null;
    expect(() => parseBodies(d)).toThrow(/orbit/);
    const e = clone();
    (e[3].texture as Record<string, unknown>).palette = [];
    expect(() => parseBodies(e)).toThrow(/palette/);
    const f = clone();
    f[3].tidallyLocked = 'yes';
    expect(() => parseBodies(f)).toThrow(/tidallyLocked/);
    const g = clone();
    f[0].ring = 5;
    g[3].atmosphere = 'blue';
    expect(() => parseBodies(g)).toThrow(/atmosphere/);
    expect(() => parseBodies(f)).toThrow();
    const h = clone();
    (h[6].texture as Record<string, unknown>).spot = 'x';
    expect(() => parseBodies(h)).toThrow(/spot/);
    const i = clone();
    (i[6].texture as Record<string, unknown>).map = 3;
    expect(() => parseBodies(i)).toThrow(/map/);
    expect(() => parseBodies([3])).toThrow(/객체/);
    const j = clone();
    j[2].orbit = 'x';
    expect(() => parseBodies(j)).toThrow(/orbit/);
    const k = clone();
    k[2].texture = null;
    expect(() => parseBodies(k)).toThrow(/texture/);
    const l = clone();
    l[2].name = 3;
    expect(() => parseBodies(l)).toThrow(/name/);
  });

  it('퀴즈 데이터 검증', () => {
    expect(() => parseQuiz('x')).toThrow();
    expect(() => parseQuiz([1])).toThrow();
    expect(() =>
      parseQuiz([{ id: 'a', question: 'q', options: ['a', 'b'], answerIndex: 5, targetId: 'sun', explanation: '' }]),
    ).toThrow(/answerIndex/);
  });
});
