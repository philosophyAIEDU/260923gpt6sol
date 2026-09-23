import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { motion as m } from '../../styles/tokens';

const TONE_DOT: Record<string, string> = {
  info: 'bg-accent-cyan shadow-[0_0_10px_rgba(77,216,255,0.9)]',
  success: 'bg-accent-success shadow-[0_0_10px_rgba(92,242,176,0.9)]',
  warning: 'bg-accent-warning shadow-[0_0_10px_rgba(255,200,107,0.9)]',
};

/** 화면 상단 중앙의 짧은 안내 메시지 (4초 후 자동으로 사라짐) */
export function Toast(): JSX.Element {
  const toast = useAppStore((s) => s.toast);
  const dismiss = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismiss, 4200);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4 md:top-6">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-4 py-2.5 text-[13px] text-ink-primary"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: m.base / 1000, ease: m.easeOut }}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[toast.tone]}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
