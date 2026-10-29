"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { isoDate } from "@/lib/store";
import { Sheet, useDismiss } from "./popup";

const ymd = (d: string) => new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8));

/** Themed date field with a month calendar (Monday first) */
export function DatePicker({ value, onChange, t, label, clearable, className = "" }: {
  value: string; onChange: (v: string) => void; t: Dict; label?: string; clearable?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? ymd(value) : new Date()));
  const box = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), box);

  const today = isoDate(new Date());
  const y = view.getFullYear(), m = view.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const n = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(lead).fill(""), ...Array.from({ length: n }, (_, i) => isoDate(new Date(y, m, i + 1)))];
  // "T4, 28/10"; the year is only shown when it isn't this year
  const yr = value && value.slice(0, 4) !== today.slice(0, 4) ? "/" + value.slice(0, 4) : "";
  const shownText = value ? `${t.wd[ymd(value).getDay()]}, ${value.slice(8)}/${value.slice(5, 7)}${yr}` : "";

  function toggle() {
    if (!open) setView(value ? ymd(value) : new Date());
    setOpen(!open);
  }
  const choose = (d: string) => { onChange(d); setOpen(false); };

  return (
    <div ref={box} className={`pk ${className}${open ? " open" : ""}`}>
      <button type="button" className="pk-btn" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}>
        {label && <span className="pk-lbl">{label}</span>}
        <b className={value ? "" : "ph"}>{shownText || t.pickDate}</b>
        <span className="pk-ic" aria-hidden="true">📅</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="cal-h">
          <button type="button" className="ghost" aria-label={t.calPrev} onClick={() => setView(new Date(y, m - 1, 1))}>‹</button>
          <b>{t.months[m]} {y}</b>
          <button type="button" className="ghost" aria-label={t.calNext} onClick={() => setView(new Date(y, m + 1, 1))}>›</button>
        </div>
        <div className="cal-g">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => <span key={d} className="cal-wd">{t.wd[d]}</span>)}
          {cells.map((d, i) => d
            ? <button type="button" key={d} className={`${d === value ? "sel" : ""}${d === today ? " now" : ""}`} onClick={() => choose(d)}>{+d.slice(8)}</button>
            : <span key={"e" + i} />)}
        </div>
        <div className="pk-foot">
          <button type="button" className="ghost" onClick={() => choose(today)}>{t.today}</button>
          {clearable && value && <button type="button" className="ghost" onClick={() => choose("")}>{t.clear}</button>}
        </div>
      </Sheet>
    </div>
  );
}
