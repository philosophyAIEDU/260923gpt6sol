import { useEffect, useState } from 'react';
import { runtime } from '../store/runtime';
import { formatSimDate } from '../utils/format';
import { simDaysToDate } from '../utils/time';

/**
 * 시뮬레이션 날짜 문자열을 낮은 빈도(기본 8Hz)로 샘플링합니다.
 * 1000배속에서도 매 프레임 리렌더하지 않아 UI가 버벅이지 않습니다.
 * 문자열이 바뀔 때만 setState 하므로 정지 상태에서는 리렌더가 전혀 없습니다.
 */
export function useSimDate(hz = 8): string {
  const [text, setText] = useState(() => formatSimDate(simDaysToDate(runtime.simDays)));
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = formatSimDate(simDaysToDate(runtime.simDays));
      setText((prev) => (prev === next ? prev : next));
    }, 1000 / hz);
    return () => window.clearInterval(id);
  }, [hz]);
  return text;
}
