"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fold, unitKey } from "@/lib/address";
import { isoDate } from "@/lib/store";

/** Closes a popup on outside click or Escape */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, ref]);
}

/** A suggestion; `alias` lists other ways people write it, "|"-separated and accent-free (e.g. "hcm|sai gon") */
export interface Opt { value: string; hint?: string; alias?: string }

const plain = (s: string) => fold(s).replace(/\./g, " ").replace(/\s+/g, " ").trim();
const aliasOf = (o: Opt, s: string) => !!o.alias && o.alias.split("|").includes(plain(s));

/**
 * Text field with a searchable suggestion list. Typing anything is allowed (values not in the list are kept),
 * so it works both as a picker (province, district, ward) and as autocomplete (customer names).
 * With `snap`, a typed short form that names exactly one option ("p.tân sơn", "q.1", "hcm") becomes that option
 * when the field is left.
 */
export function Combobox({ value, onChange, onPick, options, placeholder, className = "", bad, noMatch, inputProps, snap }: {
  value: string; onChange: (v: string) => void; onPick?: (o: Opt) => void; options: Opt[]; placeholder: string;
  className?: string; bad?: boolean; noMatch?: string; inputProps?: React.InputHTMLAttributes<HTMLInputElement>; snap?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // What the user typed since opening; "" lists everything
  const [query, setQuery] = useState("");
  const [act, setAct] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useDismiss(open, () => setOpen(false), box);

  const shown = useMemo(() => {
    const q = fold(query.trim()), uk = unitKey(query);
    if (!q) return options.slice(0, 400);
    // Matches the text, a short form ("q.1" → Quận 1…) or an alias; exact short-form matches come first
    const hits = options.filter((o) => fold(o.value + " " + (o.hint || "")).includes(q)
      || (uk && unitKey(o.value).includes(uk)) || aliasOf(o, query));
    const exact = (o: Opt) => (unitKey(o.value) === uk || aliasOf(o, query) ? 0 : 1);
    return hits.sort((a, b) => exact(a) - exact(b)).slice(0, 400);
  }, [options, query]);

  function snapTo() {
    if (!snap || !value.trim() || options.some((o) => o.value === value)) return;
    const uk = unitKey(value);
    const hits = options.filter((o) => (uk && unitKey(o.value) === uk) || aliasOf(o, value));
    if (hits.length === 1) { onChange(hits[0].value); onPick?.(hits[0]); }
  }

  useEffect(() => { list.current?.children[act]?.scrollIntoView({ block: "nearest" }); }, [act]);

  function pick(o: Opt) {
    onChange(o.value);
    onPick?.(o);
    setOpen(false);
  }

  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && shown[act]) { e.preventDefault(); pick(shown[act]); }
    else if (e.key === "Tab") setOpen(false);
  }

  // Clicking the field (or its arrow) again closes the list. The click that focuses the field only opens it.
  const focusedAt = useRef(0);
  function show() { setQuery(""); setAct(0); setOpen(true); }
  function toggle() { if (open) setOpen(false); else show(); }
  const listShown = open && (shown.length > 0 || !!(noMatch && query));

  return (
    <div ref={box} className={`cb ${className}${listShown ? " open" : ""}`}>
      <input {...inputProps} className={bad ? "bad" : ""} placeholder={placeholder} value={value} autoComplete="off"
        role="combobox" aria-expanded={listShown} aria-autocomplete="list"
        onFocus={() => { focusedAt.current = Date.now(); show(); }}
        onClick={() => { if (Date.now() - focusedAt.current > 300) toggle(); }}
        onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); setAct(0); setOpen(true); }}
        onKeyDown={key} onBlur={snapTo} />
      <button type="button" className="dd-tog" tabIndex={-1} aria-label={placeholder}
        onPointerDown={(e) => e.preventDefault()} onClick={() => { box.current?.querySelector("input")?.focus(); toggle(); }}>
        <Chevron />
      </button>
      {listShown && (
        <ul ref={list} className="pop cb-list" role="listbox">
          {shown.map((o, i) => (
            <li key={o.value + i} role="option" aria-selected={o.value === value}
              className={`${i === act ? "act" : ""}${o.value === value ? " sel" : ""}`}
              onPointerDown={(e) => e.preventDefault()} onClick={() => pick(o)} onPointerEnter={() => setAct(i)}>
              <span>{o.value}</span>{o.hint && <small>{o.hint}</small>}
            </li>
          ))}
          {!shown.length && <li className="none">{noMatch}</li>}
        </ul>
      )}
    </div>
  );
}

/** Hand-drawn chevron; CSS turns it to point up while its dropdown is open */
function Chevron() {
  return (
    <svg className="dd-chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 8.8c2.6 2.3 4.9 4.6 7.4 6.9 0 0 .2.1.3 0 2.5-2.4 4.7-4.6 7.3-7.2" />
    </svg>
  );
}

/** Pick-one list (no typing) styled like the other dropdowns */
/** An option for Select: shown as `label` (defaults to the value), optionally under a `group` heading */
export interface SelOpt { value: string; label?: string; hint?: string; group?: string }

export function Select({ value, onChange, options, className = "", label }: {
  value: string; onChange: (v: string) => void; options: (string | SelOpt)[]; className?: string; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  useDismiss(open, () => setOpen(false), box);
  const opts: SelOpt[] = options.map((o) => (typeof o === "string" ? { value: o } : o));
  const cur = opts.find((o) => o.value === value);

  useEffect(() => { list.current?.querySelector(".act")?.scrollIntoView({ block: "nearest" }); }, [act, open]);

  function toggle() { setAct(Math.max(0, opts.findIndex((o) => o.value === value))); setOpen(!open); }
  function pick(v: string) { onChange(v); setOpen(false); }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) toggle(); else setAct((a) => Math.min(a + 1, opts.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); pick(opts[act].value); }
    else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div ref={box} className={`sl ${className}${open ? " open" : ""}`}>
      <button type="button" className="sl-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={toggle} onKeyDown={key}>
        <span>{cur ? cur.label ?? cur.value : value}</span>
        <span className="dd-tog" aria-hidden="true"><Chevron /></span>
      </button>
      {open && (
        <ul ref={list} className="pop cb-list" role="listbox">
          {opts.map((o, i) => (
            <Fragment key={o.value}>
              {o.group && o.group !== opts[i - 1]?.group && <li className="grp" role="presentation">{o.group}</li>}
              <li role="option" aria-selected={o.value === value} className={`${i === act ? "act" : ""}${o.value === value ? " sel" : ""}`}
                onClick={() => pick(o.value)} onPointerEnter={() => setAct(i)}>
                <span>{o.label ?? o.value}</span>{o.hint && <small>{o.hint}</small>}
              </li>
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Popup that drops under its field on wide screens and becomes a bottom sheet on phones */
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <div className="pop sheet" role="dialog">{children}</div>
    </>
  );
}

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
