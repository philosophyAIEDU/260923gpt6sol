import { useEffect, useRef, useState } from 'react';
import { getBody } from '../../data';
import { CONCEPT_ILLUSTRATIONS, SPACE_PHOTOS, type SpacePhoto } from '../../data/media';
import { useAppStore } from '../../store/useAppStore';

const GALLERY_ITEMS = [...SPACE_PHOTOS, ...CONCEPT_ILLUSTRATIONS];

function PhotoCard({ photo, onFocus, onZoom, buttonRef }: {
  photo: SpacePhoto;
  onFocus: (id: string) => void;
  onZoom: () => void;
  buttonRef: (button: HTMLButtonElement | null) => void;
}): JSX.Element {
  const [failed, setFailed] = useState(false);
  const body = getBody(photo.focusId ?? photo.id);
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#0d222d] shadow-[0_16px_36px_-24px_#000]">
      {failed ? (
        <div className="flex aspect-[4/3] items-center justify-center bg-space-700 p-6 text-center text-xs text-ink-muted">이미지를 표시할 수 없습니다.</div>
      ) : (
        <button ref={buttonRef} type="button" onClick={onZoom} aria-label={`${photo.title} 사진 크게 보기`} className="group relative block w-full overflow-hidden focus-visible:outline-offset-[-3px]">
          <img className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" src={photo.image} alt={`${photo.title} — ${photo.subtitle}`} onError={() => setFailed(true)} />
          <span className="absolute bottom-2 right-2 rounded-md bg-[#06151d]/90 px-3 py-1.5 text-xs text-white">⌕ 크게 보기</span>
        </button>
      )}
      <div className="space-y-2 p-4">
        <div><span className="eyebrow text-accent-violet">{photo.kind === 'illustration' ? '개념 일러스트' : 'NASA 관측 자료'}</span><h3 className="mt-1 font-display text-base font-semibold">{photo.title}</h3><p className="mt-1 text-xs text-ink-muted">{photo.subtitle}</p></div>
        <p className="text-sm leading-relaxed text-ink-secondary">{photo.observation}</p>
        <p className="text-[11px] text-ink-muted">{photo.kind === 'illustration' ? '제작' : '자료'}: {photo.credit}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {body && <button type="button" className="rounded-full bg-accent-cyan/15 px-3 py-1.5 text-accent-cyan hover:bg-accent-cyan/25" onClick={() => onFocus(body.id)}>3D에서 보기</button>}
          {photo.source && <a className="text-ink-secondary underline underline-offset-4 hover:text-ink-primary" href={photo.source} target="_blank" rel="noreferrer noopener">NASA 원본 ↗</a>}
        </div>
      </div>
    </article>
  );
}

export function PhotoGallery({ onClose }: { onClose: () => void }): JSX.Element {
  const select = useAppStore((s) => s.select);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const thumbnailRefs = useRef(new Map<number, HTMLButtonElement>());
  const closeRef = useRef<HTMLButtonElement>(null);
  const focus = (id: string): void => { select(id); onClose(); };
  const closeZoom = (): void => {
    const index = activeIndex;
    setActiveIndex(null);
    if (index !== null) window.requestAnimationFrame(() => thumbnailRefs.current.get(index)?.focus());
  };

  useEffect(() => {
    if (activeIndex === null) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === 'Escape') closeZoom();
      else setActiveIndex((current) => current === null ? null : (current + (event.key === 'ArrowRight' ? 1 : GALLERY_ITEMS.length - 1)) % GALLERY_ITEMS.length);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activeIndex]);

  const photo = activeIndex === null ? null : GALLERY_ITEMS[activeIndex];

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#02040c]/85 p-3 backdrop-blur-md" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="gallery-heading" className="glass-strong flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#12313b] to-[#081923] p-5 sm:p-8">
          <div><p className="eyebrow text-accent-violet">OBSERVATION ATLAS · NASA 사진 {SPACE_PHOTOS.length}장 + 학습 일러스트 {CONCEPT_ILLUSTRATIONS.length}장</p><h2 id="gallery-heading" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">우주를 가까이 관찰하세요</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">이미지를 눌러 확대하고 관찰 질문에 답해 보세요. 관측 사진에는 색 보정과 합성 영상이 포함되며, 생성 일러스트는 따로 표시했습니다.</p></div>
          <button type="button" className="icon-btn shrink-0" aria-label="사진 관찰실 닫기" onClick={onClose}>✕</button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {GALLERY_ITEMS.map((item, index) => <PhotoCard key={item.id} photo={item} onFocus={focus} onZoom={() => setActiveIndex(index)} buttonRef={(button) => { if (button) thumbnailRefs.current.set(index, button); else thumbnailRefs.current.delete(index); }} />)}
        </div>
      </section>
      {photo && activeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02030a]/95 p-2 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeZoom(); }}>
          <section role="dialog" aria-modal="true" aria-label={`${photo.title} 확대 사진`} className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0b1c26]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0"><p className="eyebrow text-accent-violet">{photo.kind === 'illustration' ? '개념 일러스트' : 'NASA 관측 자료'} · {activeIndex + 1} / {GALLERY_ITEMS.length}</p><h3 className="truncate font-display text-lg font-semibold">{photo.title}</h3></div>
              <button ref={closeRef} type="button" className="icon-btn shrink-0" aria-label="확대 사진 닫기" onClick={closeZoom}>✕</button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/40 p-2 sm:p-4">
              <img key={photo.id} src={photo.image} alt={`${photo.title} — ${photo.subtitle}`} className="max-h-full max-w-full object-contain" />
              <button type="button" aria-label="이전 사진" onClick={() => setActiveIndex((activeIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-[#071923]/85 px-3 py-2 text-xl hover:bg-[#1d3943] sm:left-4">‹</button>
              <button type="button" aria-label="다음 사진" onClick={() => setActiveIndex((activeIndex + 1) % GALLERY_ITEMS.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#071923]/85 px-3 py-2 text-xl hover:bg-[#1d3943] sm:right-4">›</button>
            </div>
            <div className="space-y-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed text-ink-secondary sm:px-6">
              <p className="text-ink-primary">{photo.subtitle}</p>
              {photo.learningPoint && <p>{photo.learningPoint}</p>}
              <p><strong>관찰 질문:</strong> {photo.observation}</p>
              <p>{photo.kind === 'illustration' ? '제작' : '출처'}: {photo.credit} {photo.source && <>· <a href={photo.source} target="_blank" rel="noreferrer noopener" className="text-accent-cyan underline underline-offset-4">NASA 원본 보기 ↗</a></>}</p>
              <p className="text-ink-muted">키보드 ← →로 사진 이동, Esc로 확대 닫기</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
