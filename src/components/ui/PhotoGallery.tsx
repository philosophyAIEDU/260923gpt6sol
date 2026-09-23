import { useState } from 'react';
import { SPACE_PHOTOS, type SpacePhoto } from '../../data/media';
import { useAppStore } from '../../store/useAppStore';

function PhotoCard({ photo, onFocus }: { photo: SpacePhoto; onFocus: (id: string) => void }): JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#11152a]">
      {failed ? (
        <div className="flex aspect-[4/3] items-center justify-center bg-[#171c35] p-6 text-center text-xs text-ink-muted">사진을 표시할 수 없습니다. NASA 원본에서 확인해 주세요.</div>
      ) : (
        <img className="aspect-[4/3] w-full object-cover" loading="lazy" src={photo.image} alt={`${photo.title} — ${photo.subtitle}`} onError={() => setFailed(true)} />
      )}
      <div className="space-y-2 p-4">
        <div><h3 className="font-display text-base font-semibold">{photo.title}</h3><p className="mt-1 text-xs text-ink-muted">{photo.subtitle}</p></div>
        <p className="text-sm leading-relaxed text-ink-secondary">{photo.observation}</p>
        <p className="text-[11px] text-ink-muted">사진: {photo.credit}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {photo.id !== 'galaxy' && <button type="button" className="rounded-full bg-accent-cyan/15 px-3 py-1.5 text-accent-cyan hover:bg-accent-cyan/25" onClick={() => onFocus(photo.id)}>3D에서 보기</button>}
          <a className="text-ink-secondary underline underline-offset-4 hover:text-ink-primary" href={photo.source} target="_blank" rel="noreferrer noopener">NASA 원본 ↗</a>
        </div>
      </div>
    </article>
  );
}

export function PhotoGallery({ onClose }: { onClose: () => void }): JSX.Element {
  const select = useAppStore((s) => s.select);
  const focus = (id: string) => { select(id); onClose(); };
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#02040c]/85 p-3 backdrop-blur-md" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="gallery-heading" className="glass-strong flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5 sm:p-7">
          <div><p className="eyebrow text-accent-cyan">NASA 사진 관찰실</p><h2 id="gallery-heading" className="mt-1 font-display text-xl font-semibold sm:text-2xl">실제 관측 사진과 3D 모형 비교</h2><p className="mt-2 text-xs leading-relaxed text-ink-secondary">일부 사진은 자외선 관측·색 보정·여러 사진의 합성입니다. 화면 속 3D 행성과 같은 시각의 사진은 아닙니다.</p></div>
          <button type="button" className="icon-btn shrink-0" aria-label="사진 관찰실 닫기" onClick={onClose}>✕</button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {SPACE_PHOTOS.map((photo) => <PhotoCard key={photo.id} photo={photo} onFocus={focus} />)}
        </div>
      </section>
    </div>
  );
}
