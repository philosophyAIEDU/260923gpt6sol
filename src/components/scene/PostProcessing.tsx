import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import type { QualityProfile } from '../../utils/quality';

interface PostProcessingProps {
  profile: QualityProfile;
}

/**
 * 후처리 체인: Bloom → ACES 톤매핑 → 비네트 (→ 필름 그레인, 높음 품질만)
 *  - Bloom: HDR 밝기가 1을 넘는 픽셀(태양, 밝은 별, 선택 링)만 번지게 → 태양이 실제로 "빛나는" 느낌
 *  - 톤매핑: HDR → 화면 범위로 자연스럽게 압축 (하이라이트가 하얗게 뭉개지지 않음)
 *  - 비네트: 화면 가장자리를 어둡게 해 시선을 중앙으로 모음
 * 낮음 품질에서는 이 컴포넌트 자체를 마운트하지 않습니다.
 */
export function PostProcessing({ profile }: PostProcessingProps): JSX.Element {
  const effects: JSX.Element[] = [];
  if (profile.bloom) {
    effects.push(
      <Bloom
        key="bloom"
        mipmapBlur
        intensity={1.35}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.28}
        radius={0.78}
        kernelSize={KernelSize.LARGE}
      />,
    );
  }
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />);
  effects.push(<Vignette key="vignette" offset={0.28} darkness={0.72} eskil={false} />);
  if (profile.filmGrain) {
    effects.push(<Noise key="noise" premultiply blendFunction={BlendFunction.SCREEN} opacity={0.035} />);
  }
  return (
    <EffectComposer multisampling={profile.multisampling} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
