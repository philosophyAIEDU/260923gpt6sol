import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';
import { CompassIcon } from './Icons';

/** 첫 방문 조작 안내 — 인트로 비행이 끝난 뒤 나타났다가 첫 선택 또는 9초 후 사라짐 */
export function InteractionHint(): JSX.Element {
  const sceneReady = useAppStore((s) => s.loading.sceneReady);
  const selectedId = useAppStore((s) => s.selectedId);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!sceneReady || dismissed) return;
    const show = window.setTimeout(() => setVisible(true), 3400);
    const hide = window.setTimeout(() => setDismissed(true), 12500);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [sceneReady, dismissed]);

  useEffect(() => {
    if (selectedId) setDismissed(true);
  }, [selectedId]);

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          className="pointer-events-none flex items-center gap-2.5 text-[12px] text-ink-muted"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: m.slow / 1000, ease: m.easeOut }}
        >
          <CompassIcon size={15} className="text-accent-cyan" />
          <span>드래그로 회전 · 스크롤로 확대 · 행성을 클릭해 탐험해 보세요</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
