/** 천체 분류 */
export type BodyType = 'star' | 'terrestrial' | 'gas-giant' | 'ice-giant' | 'moon';

/** 절차적(procedural) 텍스처 생성 스타일 */
export type TextureStyle =
  | 'sun'
  | 'cratered'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'banded'
  | 'icy';

/** 그래픽 품질 옵션 */
export type Quality = 'low' | 'medium' | 'high';

/** 비율 모드: 학습용(압축) / 실제 비율 */
export type ScaleMode = 'learning' | 'real';

/**
 * 케플러 궤도 6요소(단순화 버전).
 * 모든 각도는 도(degree) 단위, 기준 시각은 J2000(2000-01-01 12:00 TT)입니다.
 */
export interface OrbitalElements {
  /** 궤도 긴반지름 a (AU). 위성은 모천체 기준 거리 */
  semiMajorAxisAU: number;
  /** 이심률 e (0 = 원, 1에 가까울수록 찌그러진 타원) */
  eccentricity: number;
  /** 궤도 경사 i — 황도면에 대한 기울기 */
  inclinationDeg: number;
  /** 승교점 경도 Ω */
  ascendingNodeDeg: number;
  /** 근일점 경도 ϖ = Ω + ω */
  longitudeOfPerihelionDeg: number;
  /** J2000 시점의 평균 경도 L₀ */
  meanLongitudeDeg: number;
  /** 공전 주기 (지구일) */
  periodDays: number;
}

export interface SpotFeature {
  latDeg: number;
  lonDeg: number;
  widthDeg: number;
  heightDeg: number;
  color: string;
}

export interface RingSpec {
  /** 행성 반지름 대비 안쪽/바깥쪽 반지름 */
  inner: number;
  outer: number;
  palette: string[];
  opacity: number;
}

export interface AtmosphereSpec {
  color: string;
  intensity: number;
}

export interface TextureSpec {
  style: TextureStyle;
  /** 절차적 텍스처 색상 팔레트 (어두운 색 → 밝은 색 순) */
  palette: string[];
  seed: number;
  /** 이미지 텍스처 경로(public/ 기준). null이면 절차적 텍스처를 사용합니다. */
  map: string | null;
  normalMap: string | null;
  spot?: SpotFeature;
}

export interface CelestialBody {
  id: string;
  name: string;
  nameEn: string;
  type: BodyType;
  /** 모천체 id (위성인 경우) */
  parent: string | null;
  /** 대표 색상 — 텍스처 로딩 실패 시 fallback 및 UI 점 색상 */
  color: string;
  diameterKm: number;
  /** 자전 주기 (시간). 음수는 역방향 자전 */
  rotationPeriodHours: number;
  axialTiltDeg: number;
  /** 조석 고정(항상 같은 면이 모천체를 향함) 여부 */
  tidallyLocked: boolean;
  moons: number;
  meanTempC: number;
  orbit: OrbitalElements | null;
  texture: TextureSpec;
  ring: RingSpec | null;
  atmosphere: AtmosphereSpec | null;
  description: string;
  funFact: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  /** 정답과 연결된 천체 — 정답 후 카메라가 이동합니다 */
  targetId: string;
  explanation: string;
}

/** 카메라 포커스 대상 (null = 전체 조망) */
export type CameraTarget = { kind: 'body'; id: string } | { kind: 'overview' };

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}
