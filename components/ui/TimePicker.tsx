"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Sheet, useDismiss } from "./popup";

const p2 = (n: number) => String(n).padStart(2, "0");

/** Themed time field: pick the hour, then optionally the minutes */
export function TimePicker({ value, onChange, t, label, className = "" }: {
  value: string; onChange: (v: string) => void; t: Dict; label?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), box);
  const [h, mm] = value ? value.split(":") : ["", ""];

  return (
    <div ref={box} className={`pk ${className}${open ? " open" : ""}`}>
      <button type="button" className="pk-btn" onClick={() => setOpen(!open)} aria-haspopup="dialog" aria-expanded={open}>
        {label && <span className="pk-lbl">{label}</span>}
        <b className={value ? "" : "ph"}>{value || t.pickTime}</b>
        <span className="pk-ic" aria-hidden="true">🕒</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="tp-t">{t.hour}</div>
        <div className="tp-h">
          {Array.from({ length: 24 }, (_, i) => p2(i)).map((x) => (
            <button type="button" key={x} className={x === h ? "sel" : ""} onClick={() => onChange(`${x}:${mm || "00"}`)}>{x}</button>
          ))}
        </div>
        <div className="tp-t">{t.minute}</div>
        <div className="tp-m">
          {["00", "15", "30", "45"].map((x) => (
            <button type="button" key={x} className={x === mm ? "sel" : ""} onClick={() => { onChange(`${h || p2(new Date().getHours())}:${x}`); setOpen(false); }}>:{x}</button>
          ))}
        </div>
        <div className="pk-foot">
          <button type="button" className="btn" onClick={() => setOpen(false)}>{t.done}</button>
          {value && <button type="button" className="ghost" onClick={() => { onChange(""); setOpen(false); }}>{t.clear}</button>}
        </div>
      </Sheet>
    </div>
  );
}
