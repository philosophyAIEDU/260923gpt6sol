import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable || target.getAttribute('role') === 'slider' || Boolean(target.closest('[role="dialog"]'));
}

/**
 * 전역 단축키
 *   Space  재생/일시정지
 *   Esc    선택 해제(전체 조망)
 *   ← / →  이전/다음 천체
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      const s = useAppStore.getState();
      if (e.code === 'Space') {
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        s.togglePlay();
      } else if (e.key === 'Escape') {
        if (s.selectedId) s.select(null);
      } else if (e.key === 'ArrowRight') {
        s.cycleSelection(1);
      } else if (e.key === 'ArrowLeft') {
        s.cycleSelection(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
