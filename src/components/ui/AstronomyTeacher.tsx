import { useEffect, useRef, useState } from 'react';
import { getBody } from '../../data';
import { useAppStore } from '../../store/useAppStore';
import { askAstronomyTeacher, GEMINI_MODEL, type ChatTurn } from '../../services/gemini';

const COMMON_QUESTIONS = ['지구에 계절이 생기는 이유는?', '별과 행성은 어떻게 달라요?', '태양계의 크기를 쉽게 설명해 주세요'];
const KEY_STORAGE = 'solar-gemini-user-key';
const CONSENT_STORAGE = 'solar-gemini-remember-key';

function readSavedKey(): { key: string; remember: boolean } {
  try {
    if (window.localStorage.getItem(CONSENT_STORAGE) === 'yes') {
      return { key: window.localStorage.getItem(KEY_STORAGE) ?? '', remember: true };
    }
  } catch { /* 저장이 차단된 브라우저는 메모리에서만 사용합니다. */ }
  return { key: '', remember: false };
}

function removeSavedKey(): void {
  try { window.localStorage.removeItem(KEY_STORAGE); window.localStorage.removeItem(CONSENT_STORAGE); } catch { /* ignore */ }
}

function saveKey(key: string): boolean {
  try {
    window.localStorage.setItem(CONSENT_STORAGE, 'yes');
    if (key) window.localStorage.setItem(KEY_STORAGE, key);
    else window.localStorage.removeItem(KEY_STORAGE);
    return true;
  } catch { removeSavedKey(); return false; }
}

export function AstronomyTeacher({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  const [initial] = useState(readSavedKey);
  const [key, setKey] = useState(initial.key);
  const [remember, setRemember] = useState(initial.remember);
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const scrollEnd = useRef<HTMLDivElement | null>(null);
  const selectedId = useAppStore((s) => s.selectedId);
  const selectedBody = selectedId ? getBody(selectedId) : undefined;

  useEffect(() => {
    if (!open) { controller.current?.abort(); controller.current = null; setPending(false); }
  }, [open]);
  useEffect(() => { if (open) scrollEnd.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [open, messages, pending]);
  useEffect(() => () => controller.current?.abort(), []);

  if (!open) return null;

  const changeKey = (value: string): void => {
    setKey(value);
    setError('');
    if (remember && !saveKey(value)) { setRemember(false); setError('이 브라우저에서는 키를 저장할 수 없어요. 현재 페이지에서는 계속 사용할 수 있습니다.'); }
  };

  const changeRemember = (checked: boolean): void => {
    if (!checked) { removeSavedKey(); setRemember(false); return; }
    if (saveKey(key)) setRemember(true);
    else setError('이 브라우저에서는 키를 저장할 수 없어요. 현재 페이지에서는 계속 사용할 수 있습니다.');
  };

  const submit = async (text: string): Promise<void> => {
    const prompt = text.trim();
    if (!prompt || pending) return;
    if (!key.trim()) { setError('먼저 Gemini API 키를 입력해 주세요.'); return; }
    const next: ChatTurn[] = [...messages, { role: 'user', text: prompt }];
    setMessages(next);
    setQuestion('');
    setError('');
    setPending(true);
    const request = new AbortController();
    controller.current = request;
    try {
      const answer = await askAstronomyTeacher(key, next, selectedBody, request.signal);
      if (!request.signal.aborted) setMessages([...next, { role: 'model', text: answer }]);
    } catch (failure) {
      if (!request.signal.aborted) {
        setMessages(messages);
        setQuestion(prompt);
        setError(failure instanceof Error && failure.message !== 'Failed to fetch' ? failure.message : '연결을 확인한 뒤 다시 시도해 주세요.');
      }
    } finally {
      if (controller.current === request) { controller.current = null; setPending(false); }
    }
  };

  return (
    <section role="dialog" aria-label="AI 천문 선생님" className="glass-strong pointer-events-auto fixed inset-x-3 bottom-3 top-3 z-40 flex flex-col overflow-hidden rounded-3xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-20 sm:h-[min(740px,calc(100vh-6rem))] sm:w-[420px]">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 p-5">
        <div><p className="eyebrow text-accent-cyan">질문하며 배우는 태양계</p><h2 className="mt-1 font-display text-xl font-semibold">AI 천문 선생님</h2><p className="mt-1 text-[11px] text-ink-muted">{GEMINI_MODEL} · {selectedBody ? `지금 보는 천체: ${selectedBody.name}` : '태양계 전체 질문'}</p></div>
        <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="AI 선생님 닫기">✕</button>
      </div>
      <div className="space-y-2 border-b border-white/10 px-5 py-3">
        <label htmlFor="gemini-key" className="block text-xs font-medium">내 Gemini API 키</label>
        <div className="flex gap-2">
          <input id="gemini-key" type={visible ? 'text' : 'password'} autoComplete="new-password" spellCheck={false} value={key} onChange={(event) => changeKey(event.target.value)} placeholder="API 키를 입력하세요" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-accent-cyan" />
          <button type="button" className="rounded-xl border border-white/15 px-2 text-xs" onClick={() => setVisible(!visible)} aria-label={visible ? 'API 키 숨기기' : 'API 키 보기'}>{visible ? '숨김' : '보기'}</button>
          <button type="button" className="rounded-xl border border-white/15 px-2 text-xs" onClick={() => { controller.current?.abort(); setKey(''); setRemember(false); removeSavedKey(); setError(''); }} aria-label="API 키 지우기">지우기</button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-secondary"><input type="checkbox" checked={remember} onChange={(event) => changeRemember(event.target.checked)} className="accent-cyan-400" /> 이 기기에 API 키 저장 (선택)</label>
        <p className="text-[11px] leading-relaxed text-ink-muted">기본값은 저장하지 않음입니다. 저장을 선택하면 이 브라우저의 localStorage에 키가 보관됩니다. 공용 기기에서는 선택하지 마세요. 질문은 Google Gemini API로 직접 전송됩니다.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 && <div className="rounded-2xl border border-accent-cyan/20 bg-accent-cyan/[0.07] p-4 text-sm leading-relaxed text-ink-secondary">안녕하세요! 궁금한 천체를 클릭하거나 아래 질문을 골라 보세요. 어려운 개념도 쉽게 설명해 드릴게요.</div>}
        {messages.map((message, index) => <div key={index} className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-accent-violet/25 text-ink-primary' : 'border border-white/10 bg-white/[0.05] text-ink-secondary'}`}>{message.text}</div>)}
        {pending && <p role="status" className="text-xs text-accent-cyan">답변을 생각하고 있어요…</p>}
        <div ref={scrollEnd} />
      </div>
      <div className="border-t border-white/10 p-4">
        {error && <p role="alert" className="mb-2 text-xs text-rose-300">{error}</p>}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{(selectedBody ? [`${selectedBody.name}에서 가장 신기한 점은?`, `${selectedBody.name}과 지구를 비교해 줘`] : COMMON_QUESTIONS).map((sample) => <button type="button" key={sample} onClick={() => setQuestion(sample)} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-ink-secondary hover:border-accent-cyan/50">{sample}</button>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); void submit(question); }} className="flex items-end gap-2">
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(question); } }} maxLength={600} rows={2} placeholder="예: 토성의 고리는 무엇으로 만들어졌나요?" aria-label="천문 질문" className="min-w-0 flex-1 resize-none rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-accent-cyan" />
          <button type="submit" disabled={pending || !question.trim()} className="rounded-xl bg-accent-violet px-4 py-3 text-sm font-semibold disabled:opacity-40">질문</button>
        </form>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted"><span>답변은 틀릴 수 있어요. 중요한 내용은 NASA 자료와 비교해 보세요.</span><button type="button" onClick={() => setMessages([])} disabled={pending || messages.length === 0} className="shrink-0 underline disabled:opacity-40">대화 지우기</button></div>
      </div>
    </section>
  );
}
