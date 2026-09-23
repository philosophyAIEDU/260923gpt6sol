import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** 클릭 가능한 천체 위에 커서가 있으면 pointer 커서로 바꿉니다. */
export function useHoverCursor(): void {
  useEffect(
    () =>
      useAppStore.subscribe((state, prev) => {
        if (state.hoveredId !== prev.hoveredId) {
          document.body.style.cursor = state.hoveredId ? 'pointer' : '';
        }
      }),
    [],
  );
}
