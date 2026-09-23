/**
 * 커스텀 GLSL 셰이더 모음.
 * 씬은 logarithmicDepthBuffer를 사용하므로(실제 비율 모드에서 0.001 ~ 수천 단위를 한 화면에 담기 위해)
 * 깊이 테스트를 하는 셰이더에는 logdepthbuf 청크를 반드시 포함합니다.
 * 색상 uniform은 선형(linear) 공간 값이며, 마지막에 colorspace_fragment로 출력 색공간에 맞춥니다
 * (후처리 on/off 어느 쪽이든 같은 색으로 보이도록).
 */

// ---------------------------------------------------------------------------
// 궤도선: 행성 바로 뒤쪽이 밝고 멀어질수록 흐려지는 "혜성 꼬리" 그라데이션
// ---------------------------------------------------------------------------
export const orbitVertex = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  attribute float aPhase;
  varying float vPhase;
  void main() {
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

export const orbitFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform vec3 uColor;
  uniform vec3 uHighlight;
  uniform float uHighlightMix;
  uniform float uOpacity;
  uniform float uPhase;
  varying float vPhase;
  void main() {
    #include <logdepthbuf_fragment>
    // 행성 위치(uPhase)에서 뒤쪽으로 얼마나 떨어져 있는지: 0 = 바로 뒤, 1 = 한 바퀴 전
    float behind = fract(uPhase - vPhase);
    float trail = pow(1.0 - behind, 5.0);
    float alpha = uOpacity * (0.6 + 0.4 * trail);
    vec3 col = mix(uColor, uHighlight, uHighlightMix) * (1.0 + trail * 0.9);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// 대기: 프레넬(Fresnel) 림 라이트 — 가장자리로 갈수록 밝아지고, 태양 쪽 면만 빛남
// ---------------------------------------------------------------------------
export const atmosphereVertex = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
    #include <logdepthbuf_vertex>
  }
`;

export const atmosphereFragment = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uHalo;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    #include <logdepthbuf_fragment>
    float d = dot(vNormal, vViewDir);
    // uHalo = 0: 앞면 림 (가장자리 밝음) / uHalo = 1: 뒷면 헤일로 (행성 바깥으로 번짐)
    float rim = mix(pow(1.0 - clamp(d, 0.0, 1.0), uPower), pow(clamp(-d, 0.0, 1.0), uPower), uHalo);
    // 태양(원점) 방향과의 각도로 낮/밤 구분 → 밤 쪽 대기는 거의 보이지 않게
    vec3 toSun = normalize(-vWorldPos);
    float lit = smoothstep(-0.4, 0.55, dot(vWorldNormal, toSun));
    float a = rim * uIntensity * (0.08 + 0.92 * lit);
    gl_FragColor = vec4(uColor * a, a);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// 별: 크기/색온도/반짝임이 제각각인 포인트 스프라이트
// ---------------------------------------------------------------------------
export const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vColor = aColor;
    // 느린 사인파 두 개를 섞어 불규칙한 반짝임
    float tw = 0.78 + 0.22 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0)
                    * sin(uTime * 0.37 + aPhase * 13.0);
    vBright = aBright * tw;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio;
  }
`;

export const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float a = core * core;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * vBright * a, 1.0);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// 성운 스카이돔: 딥 스페이스 그라데이션 + fBm 노이즈 성운 + 은하수 띠
// ---------------------------------------------------------------------------
export const nebulaVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragment = /* glsl */ `
  uniform vec3 uBaseA;
  uniform vec3 uBaseB;
  uniform vec3 uViolet;
  uniform vec3 uCyan;
  uniform vec3 uMagenta;
  uniform int uOctaves;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= uOctaves) break;
      s += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec3 d = normalize(vDir);
    // 기본 그라데이션: #050510 → #0a0a1f
    vec3 col = mix(uBaseA, uBaseB, smoothstep(-0.6, 0.8, d.y));

    // 은하수 띠 (기울어진 대원)
    vec3 galNormal = normalize(vec3(0.35, 0.82, 0.45));
    float band = exp(-pow(dot(d, galNormal) / 0.22, 2.0));

    float n1 = fbm(d * 2.2 + vec3(uTime * 0.002, 0.0, 0.0));
    float n2 = fbm(d * 4.5 + vec3(7.1, 3.3, 1.7));
    float cloud = smoothstep(0.35, 0.85, n1) * (0.35 + 0.65 * band);
    float wisps = smoothstep(0.45, 0.9, n2) * band;

    col += uViolet * cloud * 0.11;
    col += uCyan * wisps * 0.055;
    col += uMagenta * smoothstep(0.55, 0.95, n1 * n2 * 1.6) * 0.03;
    col += vec3(0.55, 0.6, 0.85) * band * n2 * 0.018;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
