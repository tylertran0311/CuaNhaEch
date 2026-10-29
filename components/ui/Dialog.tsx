"use client";

import { useEffect, useRef, useState } from "react";

/** What a confirm popup asks: `danger` styles the confirm button red and puts focus on Cancel */
export interface Ask { title: string; body?: React.ReactNode; ok: string; cancel: string; danger?: boolean }

/**
 * Themed yes/no popup. Render `node` once, then `if (await ask({...}))` before the action.
 * Esc, Cancel or a click outside answers no.
 */
export function useConfirm() {
  const [q, setQ] = useState<(Ask & { done: (v: boolean) => void }) | null>(null);
  const ask = (a: Ask) => new Promise<boolean>((done) => setQ({ ...a, done }));
  const answer = (v: boolean) => { q?.done(v); setQ(null); };
  return [q && <ConfirmDialog key={q.title} {...q} onAnswer={answer} />, ask] as const;
}

function ConfirmDialog({ title, body, ok, cancel, danger, onAnswer }: Ask & { onAnswer: (v: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    (d?.querySelector(danger ? ".cfm-no" : ".cfm-ok") as HTMLButtonElement | null)?.focus();
  }, [danger]);
  return (
    <dialog ref={ref} className="cfm" aria-labelledby="cfm-t"
      onCancel={(e) => { e.preventDefault(); onAnswer(false); }}
      onClick={(e) => { if (e.target === e.currentTarget) onAnswer(false); }}>
      {/* The dialog itself has no padding, so a click on it (not on this box) is a click on the backdrop */}
      <div className="cfm-in">
        <h3 id="cfm-t">{title}</h3>
        {body && <div className="cfm-b">{body}</div>}
        <div className="cfm-acts">
          <button type="button" className="ghost cfm-no" onClick={() => onAnswer(false)}>{cancel}</button>
          <button type="button" className={`btn cfm-ok${danger ? " danger" : ""}`} onClick={() => onAnswer(true)}>{ok}</button>
        </div>
      </div>
    </dialog>
  );
}
