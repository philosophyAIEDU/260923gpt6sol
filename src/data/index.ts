import rawBodies from './planets.json';
import rawQuiz from './quiz.json';
import type {
  AtmosphereSpec,
  BodyType,
  CelestialBody,
  OrbitalElements,
  QuizQuestion,
  RingSpec,
  SpotFeature,
  TextureSpec,
  TextureStyle,
} from '../types';

/**
 * JSON 데이터는 TypeScript에서 넓은 타입(string 등)으로 추론되므로,
 * 런타임에 형태를 검증하면서 좁은 타입(CelestialBody)으로 변환합니다.
 * planets.json을 직접 수정하다가 필드를 빠뜨리면 여기서 명확한 에러 메시지를 줍니다.
 */

const BODY_TYPES: readonly BodyType[] = ['star', 'terrestrial', 'gas-giant', 'ice-giant', 'moon'];
const TEXTURE_STYLES: readonly TextureStyle[] = [
  'sun',
  'cratered',
  'venus',
  'earth',
  'mars',
  'banded',
  'icy',
];

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(o: Json, key: string, ctx: string): number {
  const v = o[key];
  if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`[data] ${ctx}.${key}: 숫자가 필요합니다`);
  return v;
}

function str(o: Json, key: string, ctx: string): string {
  const v = o[key];
  if (typeof v !== 'string') throw new Error(`[data] ${ctx}.${key}: 문자열이 필요합니다`);
  return v;
}

function strOrNull(o: Json, key: string, ctx: string): string | null {
  const v = o[key];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') throw new Error(`[data] ${ctx}.${key}: 문자열 또는 null이 필요합니다`);
  return v;
}

function strArray(o: Json, key: string, ctx: string): string[] {
  const v = o[key];
  if (!Array.isArray(v) || v.length === 0 || !v.every((s): s is string => typeof s === 'string')) {
    throw new Error(`[data] ${ctx}.${key}: 비어 있지 않은 문자열 배열이 필요합니다`);
  }
  return v;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], ctx: string): T {
  const found = allowed.find((a) => a === value);
  if (!found) throw new Error(`[data] ${ctx}: '${value}'는 허용되지 않는 값입니다 (${allowed.join(', ')})`);
  return found;
}

function parseOrbit(v: unknown, ctx: string): OrbitalElements | null {
  if (v === null) return null;
  if (!isObject(v)) throw new Error(`[data] ${ctx}.orbit: 객체 또는 null이 필요합니다`);
  const c = `${ctx}.orbit`;
  return {
    semiMajorAxisAU: num(v, 'semiMajorAxisAU', c),
    eccentricity: num(v, 'eccentricity', c),
    inclinationDeg: num(v, 'inclinationDeg', c),
    ascendingNodeDeg: num(v, 'ascendingNodeDeg', c),
    longitudeOfPerihelionDeg: num(v, 'longitudeOfPerihelionDeg', c),
    meanLongitudeDeg: num(v, 'meanLongitudeDeg', c),
    periodDays: num(v, 'periodDays', c),
  };
}

function parseSpot(v: unknown, ctx: string): SpotFeature | undefined {
  if (v === undefined || v === null) return undefined;
  if (!isObject(v)) throw new Error(`[data] ${ctx}.spot: 객체가 필요합니다`);
  const c = `${ctx}.spot`;
  return {
    latDeg: num(v, 'latDeg', c),
    lonDeg: num(v, 'lonDeg', c),
    widthDeg: num(v, 'widthDeg', c),
    heightDeg: num(v, 'heightDeg', c),
    color: str(v, 'color', c),
  };
}

function parseTexture(v: unknown, ctx: string): TextureSpec {
  if (!isObject(v)) throw new Error(`[data] ${ctx}.texture: 객체가 필요합니다`);
  const c = `${ctx}.texture`;
  return {
    style: oneOf(str(v, 'style', c), TEXTURE_STYLES, `${c}.style`),
    palette: strArray(v, 'palette', c),
    seed: num(v, 'seed', c),
    map: strOrNull(v, 'map', c),
    normalMap: strOrNull(v, 'normalMap', c),
    spot: parseSpot(v.spot, c),
  };
}

function parseRing(v: unknown, ctx: string): RingSpec | null {
  if (v === null || v === undefined) return null;
  if (!isObject(v)) throw new Error(`[data] ${ctx}.ring: 객체 또는 null이 필요합니다`);
  const c = `${ctx}.ring`;
  return {
    inner: num(v, 'inner', c),
    outer: num(v, 'outer', c),
    palette: strArray(v, 'palette', c),
    opacity: num(v, 'opacity', c),
  };
}

function parseAtmosphere(v: unknown, ctx: string): AtmosphereSpec | null {
  if (v === null || v === undefined) return null;
  if (!isObject(v)) throw new Error(`[data] ${ctx}.atmosphere: 객체 또는 null이 필요합니다`);
  const c = `${ctx}.atmosphere`;
  return { color: str(v, 'color', c), intensity: num(v, 'intensity', c) };
}

export function parseBody(v: unknown, index: number): CelestialBody {
  if (!isObject(v)) throw new Error(`[data] bodies[${index}]: 객체가 필요합니다`);
  const ctx = `bodies[${typeof v.id === 'string' ? v.id : index}]`;
  const tidallyLocked = v.tidallyLocked;
  if (typeof tidallyLocked !== 'boolean') throw new Error(`[data] ${ctx}.tidallyLocked: boolean이 필요합니다`);
  return {
    id: str(v, 'id', ctx),
    name: str(v, 'name', ctx),
    nameEn: str(v, 'nameEn', ctx),
    type: oneOf(str(v, 'type', ctx), BODY_TYPES, `${ctx}.type`),
    parent: strOrNull(v, 'parent', ctx),
    color: str(v, 'color', ctx),
    diameterKm: num(v, 'diameterKm', ctx),
    rotationPeriodHours: num(v, 'rotationPeriodHours', ctx),
    axialTiltDeg: num(v, 'axialTiltDeg', ctx),
    tidallyLocked,
    moons: num(v, 'moons', ctx),
    meanTempC: num(v, 'meanTempC', ctx),
    orbit: parseOrbit(v.orbit, ctx),
    texture: parseTexture(v.texture, ctx),
    ring: parseRing(v.ring, ctx),
    atmosphere: parseAtmosphere(v.atmosphere, ctx),
    description: str(v, 'description', ctx),
    funFact: str(v, 'funFact', ctx),
  };
}

export function parseBodies(raw: unknown): CelestialBody[] {
  if (!Array.isArray(raw)) throw new Error('[data] planets.json 최상위는 배열이어야 합니다');
  const bodies = raw.map(parseBody);
  const ids = new Set(bodies.map((b) => b.id));
  for (const b of bodies) {
    if (b.parent !== null && !ids.has(b.parent)) {
      throw new Error(`[data] ${b.id}.parent: '${b.parent}' 천체를 찾을 수 없습니다`);
    }
    if (b.type !== 'star' && b.orbit === null) {
      throw new Error(`[data] ${b.id}: 항성이 아닌 천체는 orbit 정보가 필요합니다`);
    }
  }
  return bodies;
}

export function parseQuiz(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) throw new Error('[data] quiz.json 최상위는 배열이어야 합니다');
  return raw.map((q, i) => {
    if (!isObject(q)) throw new Error(`[data] quiz[${i}]: 객체가 필요합니다`);
    const ctx = `quiz[${i}]`;
    const options = strArray(q, 'options', ctx);
    const answerIndex = num(q, 'answerIndex', ctx);
    if (answerIndex < 0 || answerIndex >= options.length) {
      throw new Error(`[data] ${ctx}.answerIndex: 보기 범위를 벗어났습니다`);
    }
    return {
      id: str(q, 'id', ctx),
      question: str(q, 'question', ctx),
      options,
      answerIndex,
      targetId: str(q, 'targetId', ctx),
      explanation: str(q, 'explanation', ctx),
    };
  });
}

export const BODIES: readonly CelestialBody[] = parseBodies(rawBodies);
export const QUIZ_QUESTIONS: readonly QuizQuestion[] = parseQuiz(rawQuiz);

const BODY_MAP = new Map(BODIES.map((b) => [b.id, b] as const));

export function getBody(id: string): CelestialBody | undefined {
  return BODY_MAP.get(id);
}

/** 태양을 도는 천체(행성) 목록 — 거리 순 */
export const PLANETS: readonly CelestialBody[] = BODIES.filter(
  (b) => b.parent === null && b.type !== 'star',
).sort((a, b) => (a.orbit?.semiMajorAxisAU ?? 0) - (b.orbit?.semiMajorAxisAU ?? 0));

export const SUN: CelestialBody = (() => {
  const sun = BODIES.find((b) => b.type === 'star');
  if (!sun) throw new Error('[data] 항성(star) 데이터가 필요합니다');
  return sun;
})();

export function getMoonsOf(parentId: string): CelestialBody[] {
  return BODIES.filter((b) => b.parent === parentId);
}

/** 네비게이션 순서: 태양 → 행성(각 행성 뒤에 위성) */
export const NAV_ORDER: readonly string[] = [
  SUN.id,
  ...PLANETS.flatMap((p) => [p.id, ...getMoonsOf(p.id).map((m) => m.id)]),
];
