import { useOrbitAnimation } from '../../hooks/useOrbitAnimation';

/** 매 프레임 시뮬레이션을 진행시키는 보이지 않는 컴포넌트 */
export function SimulationDriver(): null {
  useOrbitAnimation();
  return null;
}
