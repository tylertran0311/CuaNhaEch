"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopyBtn, Money, useConfirm, useErrors, type ViewProps } from "./ui";
import { Combobox, DatePicker, Select, TimePicker } from "./Pickers";
import { AddressBox, addrFromLink } from "./AddressBox";
import type { Dict } from "@/lib/i18n";
import { formatVN, isVNPhone } from "@/lib/phone";
import { QUICK_TEMPLATE, parseDate, parseTime, splitReply } from "@/lib/quick";
import { fold, mapLinkIn, mapUrl } from "@/lib/text";
import { CH, DEPOSITED, IC, KINDS, PAID, SHIPPED, TRASH_DAYS, byWhen, day, deposit, dueAfterDeposit, isoDate, moveTo, newId, steamFeeFor, stillDue, fd, fdw, kl, short, vnd, type Kind, type Line, type Order, type State, type Unit } from "@/lib/store";

// When editing, a line starts on its saved snapshot (pid === OLD) so the order keeps the price it was placed at
interface FormLine { key: number; pid: string; q: string; u: Unit; snap?: { k: Kind; name: string; price: number } }
const OLD = "__old";
const FORM_OPEN = "cne-form-open";
const UNDO_MS = 8000;

let lineKey = 0;
const newLine = (s: State): FormLine => {
  const first = KINDS.flatMap((k) => s.menu.items.filter((i) => i.k === k))[0];
  return { key: ++lineKey, pid: first ? first.id : "", q: "", u: "kg" };
};

function ItemsList({ o, t }: { o: Order; t: Dict }) {
  if (o.lines && o.lines.length)
    return <>{o.lines.map((l, i) => (
      <div key={i}><span className={`tg ${l.k}`}>{kl(t, l.k)}</span> {l.name} · {l.q} {l.u === "kg" ? "kg" : t.piece}</div>
    ))}</>;
  return (
    <>
      {o.crab && <div><span className="tg crab">{kl(t, "crab")}</span> {o.crab}</div>}
      {o.shrimp && <div><span className="tg shrimp">{kl(t, "shrimp")}</span> {o.shrimp}</div>}
      {o.item && !o.crab && !o.shrimp && <div>{o.item}</div>}
    </>
  );
}

/** Steamed or raw, plus closed-on-live */
export function OrderTags({ o, t }: { o: Order; t: Dict }) {
  return (
    <span className="otags">
      {o.steam ? <span className="otag steam">🔥 {t.steam}</span> : <span className="otag raw">🦀 {t.raw}</span>}
      {o.live && <span className="otag live">📺 {t.live}</span>}
    </span>
  );
}

/** Delivery day/time with the order's tags; flagged when overdue (until the order is shipped) */
function When({ o, t }: { o: Order; t: Dict }) {
  const flag = o.dDate && o.stage < SHIPPED && o.dDate < day(0) ? <span className="wn late">{t.late}</span> : null;
  return (
    <div className="ci">
      {(o.dDate || o.dTime) && <>🗓 {t.deliver}: <b className="wt">{[o.dDate && fdw(t, o.dDate), o.dTime].filter(Boolean).join(" · ")}</b> {flag} </>}
      <OrderTags o={o} t={t} />
    </div>
  );
}

/** "" shows every order, "none" the ones without a delivery date, otherwise one delivery day (YYYY-MM-DD) */
export type DayFilter = string;
const shiftDay = (d: string, n: number) => isoDate(new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8) + n));
// New orders start on today at the current hour (minutes left at :00)
const thisHour = () => String(new Date().getHours()).padStart(2, "0") + ":00";
const inDay = (f: DayFilter, o: Order) => (f === "" ? true : f === "none" ? !o.dDate : o.dDate === f);

/** Pointer-based drag between columns; works with mouse and with the ⠿ grip on touch. */
function useBoardDrag(onDrop: (id: number, stage: number) => void) {
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  useEffect(() => {
    let drag: { id: number; el: HTMLElement; x: number; y: number; on: boolean; g: HTMLElement | null } | null = null;
    const colAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>(".col") ?? null;
    const clearOver = () => document.querySelectorAll(".col.over").forEach((c) => c.classList.remove("over"));

    const down = (e: PointerEvent) => {
      const tg = e.target as Element;
      const c = tg.closest<HTMLElement>(".card");
      if (!c || tg.closest("button")) return;
      if (e.pointerType === "touch" && !tg.closest(".grip")) return;
      drag = { id: +c.dataset.id!, el: c, x: e.clientX, y: e.clientY, on: false, g: null };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (!drag.on) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
        drag.on = true;
        const g = drag.el.cloneNode(true) as HTMLElement;
        g.className = "card ghostc";
        g.style.width = drag.el.offsetWidth + "px";
        document.body.appendChild(g);
        drag.g = g;
        drag.el.style.opacity = ".35";
      }
      const g = drag.g!;
      g.style.left = e.clientX - g.offsetWidth / 2 + "px";
      g.style.top = e.clientY - 24 + "px";
      if (e.clientY < 90) window.scrollBy(0, -14);
      else if (e.clientY > innerHeight - 90) window.scrollBy(0, 14);
      clearOver();
      colAt(e.clientX, e.clientY)?.classList.add("over");
    };
    const end = (e: PointerEvent, drop: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      d.g?.remove();
      d.el.style.opacity = "";
      clearOver();
      const col = drop ? colAt(e.clientX, e.clientY) : null;
      if (col) dropRef.current(d.id, +col.dataset.stage!);
    };
    const up = (e: PointerEvent) => end(e, true);
    const cancel = (e: PointerEvent) => end(e, false);

    document.addEventListener("pointerdown", down);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
    };
  }, []);
}

export default function Orders({ s, trash, t, update, goMenu, focus, setFocus }: ViewProps & { trash: Order[]; goMenu: () => void; focus: DayFilter; setFocus: (f: DayFilter) => void }) {
  // The order just deleted, offered back for a few seconds
  const [undo, setUndo] = useState<{ id: number; name: string } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(id);
  }, [undo]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [name, setName] = useState("");
  const [ch, setCh] = useState(CH[0]);
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [map, setMap] = useState("");
  // Address read from the Maps link: filled in when the address is empty, otherwise offered with a button
  const [linkAddr, setLinkAddr] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const linkSeq = useRef(0);
  const linkRead = useRef("");
  async function readLink(link: string, fill: boolean) {
    const id = ++linkSeq.current;
    linkRead.current = link;
    setLinkAddr("");
    if (!mapLinkIn(link)) { setLinkBusy(false); return; }
    setLinkBusy(true);
    const a = await addrFromLink(link);
    if (id !== linkSeq.current) return;
    setLinkBusy(false);
    if (a && fill) setAddr(a);
    else if (a) setLinkAddr(a);
  }
  const [dDate, setDDate] = useState(() => day(0));
  const [dTime, setDTime] = useState(thisHour);
  const [steam, setSteam] = useState(false);
  const [live, setLive] = useState(false);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  // The form can be folded away to leave more room for the board; remembered on this device
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(FORM_OPEN) !== "0"; } catch { return true; } });
  // While the height animates the content is clipped; once it settles it stops clipping so focus rings and shadows show
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    setSettled(false);
    const id = setTimeout(() => setSettled(true), 420);
    return () => clearTimeout(id);
  }, [open]);
  const [lines, setLines] = useState<FormLine[]>(() => [newLine(s)]);
  const [amt, setAmt] = useState("");
  const [ship, setShip] = useState("");
  const [popId, setPopId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { bad, err, check, clear } = useErrors();
  const [confirmNode, ask] = useConfirm();
  const editing = editId == null ? undefined : s.orders.find((o) => o.id === editId);
  // Old orders saved as free text (no lines) can still be edited; their items are kept unless replaced
  const legacy = editing && !editing.lines?.length
    ? [editing.crab && kl(t, "crab") + " " + editing.crab, editing.shrimp && kl(t, "shrimp") + " " + editing.shrimp, editing.item]
        .filter(Boolean).join(", ")
    : "";

  useEffect(() => {
    if (popId == null) return;
    const id = setTimeout(() => setPopId(null), 600);
    return () => clearTimeout(id);
  }, [popId]);

  // Past customers, newest order first, with the phone and address they last used
  const custs = useMemo(() => {
    const m = new Map<string, Order>();
    [...s.orders].sort((a, b) => b.id - a.id).forEach((o) => { const k = fold(o.name.trim()); if (k && !m.has(k)) m.set(k, o); });
    return m;
  }, [s.orders]);
  // Addresses already delivered to, newest first: suggested for free before asking Goong
  const pastAddrs = useMemo(() => [...new Set([...s.orders].sort((a, b) => b.id - a.id).map((o) => o.addr?.trim() || "").filter(Boolean))], [s.orders]);
  const custOpts = useMemo(() => [...custs.values()].map((o) => ({ value: o.name, hint: o.phone || t.pastCust })), [custs, t]);
  // Quick entry: paste the customer's reply to the template and fill the form from it
  const [qOpen, setQOpen] = useState(false);
  const [qText, setQText] = useState("");
  const [qMsg, setQMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const qRef = useRef<HTMLTextAreaElement>(null);
  function applyQuick() {
    const r = splitReply(qText);
    const done: string[] = [], warn: string[] = [], unread: string[] = [];
    if (r.name) { setName(r.name); done.push(t.name); }
    if (r.phone) {
      const p = formatVN(r.phone);
      setPhone(p);
      done.push(t.phone);
      if (!isVNPhone(p)) warn.push(t.quickBadPhone);
    }
    // A Maps link pasted on the address line (or anywhere) goes to the Maps field
    const link = r.map ? mapLinkIn(r.map) || r.map : mapLinkIn(qText);
    const a = (r.addr || "").replace(link, "").replace(/\s+/g, " ").trim();
    if (a) { setAddr(a); done.push(t.addr); }
    if (link) { setMap(link); done.push(t.mapLbl); readLink(link, !a); }
    // A date or time that can't be read is kept in the note instead of being lost
    if (r.date) { const d = parseDate(r.date); if (d) { setDDate(d); done.push(t.dDate); } else unread.push(`${t.dDate}: ${r.date}`); }
    if (r.time) { const x = parseTime(r.time); if (x) { setDTime(x); done.push(t.dTime); } else unread.push(`${t.dTime}: ${r.time}`); }
    const n = [r.note, ...unread].filter(Boolean).join("\n");
    if (n) { setNote(n); setNoteOpen(true); if (r.note) done.push(t.qNote); }
    if (unread.length) warn.push(t.quickRaw);
    setQMsg(done.length ? t.quickDone + done.join(", ") + (warn.length ? " · ⚠ " + warn.join(" · ") : "") : t.quickNone);
    if (done.length) { setQOpen(false); setQText(""); }
  }
  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(QUICK_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: put the template in the box, selected, so it can be copied by hand
      setQText(QUICK_TEMPLATE);
      setTimeout(() => qRef.current?.select(), 0);
    }
  }

  function pickCustomer(o: { value: string }) {
    const c = custs.get(fold(o.value.trim()));
    if (!c) return;
    if (c.phone) setPhone(c.phone);
    setCh(c.ch);
    // Fill the address too, unless something was already typed there
    if (!addr.trim()) { setAddr(c.addr || ""); setMap(c.map || ""); }
  }

  function move(id: number, stage: number) {
    update((d) => { const o = d.orders.find((x) => x.id === id); if (o) moveTo(o, stage); });
    setPopId(id);
  }

  useBoardDrag(move);

  const item = (id: string) => s.menu.items.find((i) => i.id === id);
  // A line whose item was removed from the menu (here or on another device) falls back to the first item
  const firstId = KINDS.flatMap((k) => s.menu.items.filter((i) => i.k === k))[0]?.id ?? "";
  const pidOf = (l: FormLine) => (l.pid === OLD && l.snap ? OLD : item(l.pid) ? l.pid : firstId);
  // Dish choices grouped by kind; a line being edited also offers the item at the price it was ordered at
  const dishOpts = (l: FormLine) => [
    ...(l.snap ? [{ value: OLD, label: `${l.snap.name} — ${short(l.snap.price)}/kg`, hint: t.atOrder }] : []),
    ...KINDS.flatMap((k) => s.menu.items.filter((i) => i.k === k)
      .map((i) => ({ value: i.id, label: `${i.name} — ${short(i.price)}/kg`, group: kl(t, k) }))),
  ];
  const resolve = (l: FormLine) => {
    if (pidOf(l) === OLD) {
      const m = s.menu.items.find((i) => i.k === l.snap!.k && i.name === l.snap!.name);
      return { ...l.snap!, w: m ? m.w : l.snap!.k === "crab" ? 250 : 30 };
    }
    return item(pidOf(l));
  };

  // Suggested total from menu prices; the user can override it by typing in the total field
  let tot = 0, any = false, est = false;
  const valid: Line[] = [];
  lines.forEach((l) => {
    const it = resolve(l), q = +l.q;
    if (it && q > 0) {
      any = true;
      if (l.u !== "kg") est = true;
      tot += it.price * q * (l.u === "kg" ? 1 : it.w / 1000);
      valid.push({ k: it.k, name: it.name, q, u: l.u, price: it.price });
    }
  });
  const suggested = Math.round(tot / 1000);
  const amtShown = amt !== "" ? amt : any ? String(suggested) : "";

  const amtNum = Math.round(+amtShown * 1000), shipNum = Math.round((+ship || 0) * 1000);
  const feeNum = steamFeeFor(steam, live);

  const setLine = (key: number, patch: Partial<FormLine>) =>
    changeLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // Changing items or quantities drops any typed total so it's recalculated from the lines
  function changeLines(fn: (ls: FormLine[]) => FormLine[]) {
    setLines(fn);
    setAmt("");
  }

  function resetForm() {
    setEditId(null); setName(""); setCh(CH[0]); setPhone(""); setAddr(""); setMap(""); setLinkAddr(""); setLinkBusy(false); linkSeq.current++; setDDate(day(0)); setDTime(thisHour()); setSteam(false); setLive(false); setNote(""); setNoteOpen(false); setQMsg(""); setLines([newLine(s)]); setAmt(""); setShip(""); clear();
  }

  function showForm(v: boolean) {
    setOpen(v);
    try { localStorage.setItem(FORM_OPEN, v ? "1" : "0"); } catch {}
  }

  function startEdit(o: Order) {
    setEditId(o.id);
    setName(o.name);
    setCh(o.ch);
    setPhone(o.phone || "");
    setAddr(o.addr || "");
    setMap(o.map || "");
    setLinkAddr("");
    setDDate(o.dDate || "");
    setDTime(o.dTime || "");
    setSteam(!!o.steam);
    setLive(!!o.live);
    setNote(o.note || "");
    setNoteOpen(!!o.note);
    showForm(true);
    setLines((o.lines || []).map((l) => ({ key: ++lineKey, pid: OLD, q: String(l.q), u: l.u, snap: { k: l.k, name: l.name, price: l.price } })));
    setAmt(String(o.amt / 1000));
    setShip(o.ship ? String(o.ship / 1000) : "");
    clear();
    // Wait a frame so a folded form has opened before scrolling to it
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  // Which order a confirm popup is about: name, delivery day/time and total
  const orderLine = (o: { name: string; dDate?: string; dTime?: string; amt: number }) => (
    <><b>{o.name}</b>{(o.dDate || o.dTime) && <> · {[o.dDate && fdw(t, o.dDate), o.dTime].filter(Boolean).join(" ")}</>} · {vnd(o.amt)}</>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(), contact = { phone: formatVN(phone), addr: addr.trim(), map: map.trim() || undefined, dDate, dTime, steam, live, steamFee: feeNum, note: note.trim() || undefined };
    const ok = check(t, [
      { key: "n", ok: !!n, label: t.name },
      { key: "ph", ok: !contact.phone || isVNPhone(contact.phone), label: t.phone, msg: t.phoneBad },
      { key: "lines", ok: valid.length > 0 || !!legacy, label: t.itemMiss },
      { key: "a", ok: amtNum > 0, label: t.total },
    ]);
    if (!ok) return;
    if (editing) {
      const id = editing.id;
      if (!(await ask({ title: t.cfEditT, body: <>{t.cfEditB}<br />{orderLine({ name: n, dDate, dTime, amt: amtNum })}</>, ok: t.cfEditOk, cancel: t.cfBack }))) return;
      update((d) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o) return;
        // A deposit already received follows the new total (30% of it)
        if (o.dep && o.amt !== amtNum) o.dep = deposit(amtNum);
        Object.assign(o, { name: n, ch, ...contact, amt: amtNum, ship: shipNum });
        // Address parts from the old form are no longer used
        delete (o as { ad?: unknown }).ad;
        if (!o.map) delete o.map;
        if (valid.length) {
          o.lines = valid;
          delete o.crab; delete o.shrimp; delete o.item;
        }
      });
      setPopId(id);
    } else {
      const id = newId();
      update((d) => {
        d.orders.push({ id, name: n, ch, ...contact, lines: valid, amt: amtNum, ship: shipNum, stage: 0, date: day(0) });
      });
      setPopId(id);
    }
    // Keep the saved order in view when it's for a different delivery day than the one shown
    if (!inDay(focus, { dDate } as Order)) setFocus(dDate || "none");
    resetForm();
  }

  const shown = s.orders.filter((o) => inDay(focus, o));
  const noDate = s.orders.filter((o) => !o.dDate).length;
  // The day the arrows and date picker step from when showing all or undated orders
  const dayOf = focus === "" || focus === "none" ? day(0) : focus;

  async function delOrder(id: number) {
    const o = s.orders.find((x) => x.id === id);
    if (!o || !(await ask({ title: t.cfDelT, body: <>{orderLine(o)}<br />{t.cfDelB.replace("{n}", String(TRASH_DAYS))}</>, ok: t.cfDelOk, cancel: t.cfBack, danger: true }))) return;
    if (id === editId) resetForm();
    // Moved to the trash, not removed: undo right away, or restore from the trash for TRASH_DAYS
    update((d) => { const x = d.orders.find((y) => y.id === id); if (x) x.delAt = Date.now(); });
    setUndo({ id, name: o.name });
  }

  function restore(id: number) {
    update((d) => { const x = d.orders.find((y) => y.id === id); if (x) delete x.delAt; });
    setUndo((u) => (u?.id === id ? null : u));
    setPopId(id);
  }

  async function purge(o: Order) {
    if (!(await ask({ title: t.cfPurgeT, body: <>{orderLine(o)}<br />{t.cfPurgeB}</>, ok: t.cfPurgeOk, cancel: t.cfBack, danger: true }))) return;
    update((d) => { d.orders = d.orders.filter((x) => x.id !== o.id); });
  }

  return (
    <>
      {confirmNode}
      {s.menu.upd !== day(0) && (
        <div className="note">
          <span>{t.stale.replace("{d}", s.menu.upd ? fd(s.menu.upd) : "—")}</span>
          <button className="ghost" onClick={goMenu}>{t.openMenu}</button>
          <button className="ghost" onClick={() => update((d) => { d.menu.upd = day(0); })}>{t.priceOk}</button>
        </div>
      )}

      {/* The folded bar and the form swap with a height animation; both stay mounted so it can run both ways */}
      <div className={`fold${open ? "" : " on"}${!open && settled ? " done" : ""}`} inert={open}>
        <div>
          <button type="button" className="add foldbar" onClick={() => showForm(true)}>
            <b>📝 {t.newOrder}</b><span className="ghost">{t.unfold}</span>
          </button>
        </div>
      </div>
      <div className={`fold${open ? " on" : ""}${open && settled ? " done" : ""}`} inert={!open}>
      <div>
      <form ref={formRef} className={`add${editing ? " editing" : ""}`} onSubmit={submit}>
        <div className="fhead">
          {editing ? <div className="edh">✎ {t.editing}<b>{editing.name}</b></div> : <b>📝 {t.newOrder}</b>}
          <div className="fhead-acts">
            <button type="button" className={`ghost${qOpen ? " on" : ""}`} aria-expanded={qOpen}
              onClick={() => { setQOpen(!qOpen); setQMsg(""); }}>{t.quick}</button>
            {!editing && <button type="button" className="ghost" onClick={() => showForm(false)}>{t.fold}</button>}
          </div>
        </div>
        {qOpen && (
          <div className="quick">
            <p>{t.quickHint}</p>
            <textarea ref={qRef} rows={7} value={qText} autoFocus placeholder={QUICK_TEMPLATE} onChange={(e) => setQText(e.target.value)} />
            <div className="quick-acts">
              <button type="button" className="btn" disabled={!qText.trim()} onClick={applyQuick}>{t.quickFill}</button>
              <button type="button" className="ghost" onClick={copyTemplate}>{copied ? t.quickCopied : t.quickCopy}</button>
              <button type="button" className="ghost" onClick={() => setQOpen(false)}>{t.quickClose}</button>
            </div>
          </div>
        )}
        {qMsg && <div className="qmsg" role="status">{qMsg}</div>}
        <Select className="a-ch" value={ch} onChange={setCh} options={CH} label={t.chLbl} />
        <Combobox className="a-name" bad={bad.n} placeholder={t.name} value={name} onChange={setName} options={custOpts} onPick={pickCustomer} />
        <input className={bad.ph ? "bad" : ""} type="tel" inputMode="tel" autoComplete="off" placeholder={t.phone}
          value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhone(formatVN(phone))} />
        <AddressBox value={addr} onChange={setAddr} past={pastAddrs} t={t} />
        <input className="a-map" type="url" inputMode="url" autoComplete="off" placeholder={t.mapPh} value={map}
          onChange={(e) => {
            // Read the link as soon as one is pasted (a big jump in length), not on every typed key
            const v = e.target.value, l = mapLinkIn(v);
            setMap(v);
            if (l && v.length - map.length > 8) readLink(l, !addr.trim());
          }}
          onBlur={() => {
            const l = mapLinkIn(map);
            setMap(l || map.trim());
            if (l && l !== linkRead.current) readLink(l, !addr.trim());
          }} />
        {(linkBusy || (linkAddr && linkAddr !== addr)) && (
          <div className="lsg" role="status">
            {linkBusy ? <span>⏳ {t.linkBusy}</span> : <>
              <span>🗺 {t.linkAddr} <b>{linkAddr}</b></span>
              <button type="button" className="ghost" onClick={() => { setAddr(linkAddr); setLinkAddr(""); }}>{t.linkUse}</button>
            </>}
          </div>
        )}
        <DatePicker className="dt" label={t.dDate} value={dDate} onChange={setDDate} t={t} clearable />
        <TimePicker className="dt" label={t.dTime} value={dTime} onChange={setDTime} t={t} />
        <div className="opts">
          <label className={`opt${steam ? " on" : ""}`}><input type="checkbox" checked={steam} onChange={(e) => setSteam(e.target.checked)} /> 🔥 {t.steam}</label>
          <label className={`opt${live ? " on" : ""}`}><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> 📺 {t.live}</label>
          {steam && <span className="optfee">{feeNum ? `${t.steamFee}: +${vnd(feeNum)}` : t.steamFree}</span>}
        </div>
        <div className="lines">
          {legacy && <div className="sg">{t.oldItems}{legacy}</div>}
          {lines.map((l) => (
            <div className="ln" key={l.key}>
              <Select className="lp" label={t.itemMiss} value={pidOf(l)} options={dishOpts(l)}
                onChange={(v) => setLine(l.key, { pid: v, snap: v === OLD ? l.snap : undefined })} />
              <label className={`u lq${bad.lines ? " bad" : ""}`}>
                <input type="number" min="0" step="any" inputMode="decimal"
                  placeholder={t.qty} value={l.q} onChange={(e) => setLine(l.key, { q: e.target.value })} />
                {/* Quantities are always in kg; older lines entered per piece keep their unit */}
                <span>{l.u === "kg" ? "kg" : t.piece}</span>
              </label>
              <button type="button" className="lx" aria-label={t.rm} title={t.rm}
                onClick={() => changeLines((ls) => ls.filter((x) => x.key !== l.key))}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="fbtns">
          <button type="button" className="ghost" onClick={() => changeLines((ls) => [...ls, newLine(s)])}>+ {t.addLine}</button>
          {noteOpen
            ? <button type="button" className="ghost" onClick={() => { setNote(""); setNoteOpen(false); }}>✕ {t.noteRm}</button>
            : <button type="button" className="ghost" onClick={() => setNoteOpen(true)}>{t.addNote}</button>}
        </div>
        {noteOpen && (
          <div className="notef">
            <textarea rows={2} placeholder={t.note} value={note} autoFocus={!note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}
        <Money value={amtShown} onChange={setAmt} placeholder={t.total} bad={bad.a} />
        <Money value={ship} onChange={setShip} placeholder={t.ship} />
        <button className="btn" type="submit">{editing ? t.saveEdit : t.add}</button>
        {editing && <button type="button" className="ghost" onClick={resetForm}>{t.cancel}</button>}
      </form>
      <div className="sg">
        {any ? t.sugg + vnd(suggested * 1000) + (est ? t.suggEst : "") : ""}
        {amtNum > 0 && <>{any && <br />}{t.dep}: {vnd(deposit(amtNum))} · {t.due}: {vnd(dueAfterDeposit(amtNum, shipNum, feeNum))}</>}
      </div>
      <div className="err" role="alert">{err}</div>
      </div>
      </div>

      <div className="calbar daybar">
        <h2>🗓 {focus === "" ? t.dayAllT : focus === "none" ? t.dayNone : `${t.dayOrders} ${fdw(t, focus)}`} <small>· {shown.length} {t.ords}</small></h2>
        <button className="ghost" aria-label={t.dayPrev} title={t.dayPrev} onClick={() => setFocus(shiftDay(dayOf, -1))}>←</button>
        <DatePicker className="daypk" value={dayOf} onChange={(v) => v && setFocus(v)} t={t} />
        <button className="ghost" aria-label={t.dayNext} title={t.dayNext} onClick={() => setFocus(shiftDay(dayOf, 1))}>→</button>
        <button className={`ghost${focus === day(0) ? " on" : ""}`} onClick={() => setFocus(day(0))}>{t.today}</button>
        <button className={`ghost${focus === "none" ? " on" : ""}`} onClick={() => setFocus("none")}>{t.dayNone} ({noDate})</button>
        <button className={`ghost${focus === "" ? " on" : ""}`} onClick={() => setFocus("")}>{t.dayAll}</button>
      </div>

      <div className="board">
        {t.st.map((st, k) => {
          const list = shown.filter((o) => o.stage === k).sort(byWhen);
          return (
            <div className="col" data-stage={k} key={k}>
              <h3><b>{IC[k]} {st}</b><span className="n">{list.length}</span></h3>
              {list.map((o) => (
                <div className={`card${o.id === popId ? " pop" : ""}${o.id === editId ? " editing" : ""}`} data-id={o.id} key={o.id}>
                  <span className="grip" aria-hidden="true">⠿</span>
                  <span className="ch">{o.ch}</span> <b>{o.name}</b>
                  {o.phone && <div className="ci">📞 <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>{o.phone}</a> <CopyBtn text={o.phone} label={t.copyPhone} /></div>}
                  {o.addr && <div className="ci">📍 {o.addr} <CopyBtn text={o.addr} label={t.copyAddr} /></div>}
                  {(o.addr || o.map) && (
                    <div className="ci">
                      🗺 <a href={mapUrl(o.map, o.addr || "")} target="_blank" rel="noopener noreferrer">{o.map ? t.mapOpen : t.mapFind}</a>
                      {o.map && <> <CopyBtn text={o.map} label={t.mapCopy} /></>}
                    </div>
                  )}
                  {o.note && <div className="onote">📝 {o.note}</div>}
                  <When o={o} t={t} />
                  <ItemsList o={o} t={t} />
                  <div className="m">{vnd(o.amt)}{o.steamFee ? ` + ${t.steamw} ${vnd(o.steamFee)}` : ""} + {t.shipw} {vnd(o.ship)}</div>
                  <div className="dep">
                    <div><span>{t.dep}</span><span>{vnd(deposit(o.amt))}</span></div>
                    <div><span>{t.due}</span><strong>{vnd(stillDue(o))}</strong></div>
                    {o.stage < DEPOSITED ? (
                      <div className="nodep">✗ {t.depNo}</div>
                    ) : o.stage < PAID ? (
                      <div className="paid">✓ {t.depGot}{vnd(o.dep || 0)}</div>
                    ) : <div className="paid">✓ {t.paidFull}</div>}
                  </div>
                  <div className="row">
                    {o.stage < DEPOSITED && <button className="ghost dp" onClick={() => move(o.id, DEPOSITED)}>{t.depMark}</button>}
                    <div className="acts">
                      <button className="ghost" onClick={() => startEdit(o)}>{t.edit}</button>
                      <button className="ghost" onClick={() => delOrder(o.id)}>{t.rm}</button>
                    </div>
                  </div>
                </div>
              ))}
              {!list.length && <div className="empty">{t.none}</div>}
            </div>
          );
        })}
      </div>
      <p className="sub" style={{ marginTop: 12 }}>{t.hint}</p>

      {trash.length > 0 && (
        <div className="trash">
          <button type="button" className="ghost" aria-expanded={trashOpen} onClick={() => setTrashOpen(!trashOpen)}>
            🗑 {t.trash} ({trash.length}) {trashOpen ? "▴" : "▾"}
          </button>
          {trashOpen && (
            <div className="trash-list">
              <p className="sub">{t.trashHint.replace("{n}", String(TRASH_DAYS))}</p>
              {trash.map((o) => {
                const left = Math.max(1, Math.ceil(TRASH_DAYS - (Date.now() - o.delAt!) / 864e5));
                return (
                  <div className="trash-row" key={o.id}>
                    <div className="trash-info">
                      <div>{orderLine(o)}</div>
                      <small>{t.trashLeft.replace("{n}", String(left))}</small>
                    </div>
                    <div className="trash-acts">
                      <button type="button" className="ghost" onClick={() => restore(o.id)}>↩ {t.restore}</button>
                      <button type="button" className="ghost" onClick={() => purge(o)}>{t.purge}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {undo && (
        <div className="toast" role="status" key={undo.id}>
          <span>🗑 {t.deleted.replace("{n}", undo.name)}</span>
          <button type="button" className="ghost" onClick={() => restore(undo.id)}>↩ {t.undo}</button>
          <i className="toast-bar" style={{ animationDuration: UNDO_MS + "ms" }} />
        </div>
      )}
    </>
  );
}
