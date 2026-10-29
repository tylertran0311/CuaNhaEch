"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button, Combobox, DatePicker, FormCard, FormError, IconButton, Money, Select, TextArea, TextInput, TimePicker, ToggleChip,
  UnitInput, useConfirm, useErrors,
} from "@/components/ui";
import type { ViewProps } from "@/components/views/types";
import { AddressBox, addrFromLink } from "./AddressBox";
import { OrderLine } from "./bits";
import { formatVN, isVNPhone } from "@/lib/phone";
import { QUICK_TEMPLATE, parseDate, parseTime, splitReply } from "@/lib/quick";
import { fold, mapLinkIn } from "@/lib/text";
import { CH, KINDS, day, deposit, dueAfterDeposit, kl, newId, short, steamFeeFor, vnd, type Kind, type Line, type Order, type State, type Unit } from "@/lib/store";

// When editing, a line starts on its saved snapshot (pid === OLD) so the order keeps the price it was placed at
interface FormLine { key: number; pid: string; q: string; u: Unit; snap?: { k: Kind; name: string; price: number } }
const OLD = "__old";
const FORM_OPEN = "cne-form-open";

let lineKey = 0;
const newLine = (s: State): FormLine => {
  const first = KINDS.flatMap((k) => s.menu.items.filter((i) => i.k === k))[0];
  return { key: ++lineKey, pid: first ? first.id : "", q: "", u: "kg" };
};
// New orders start on today at the current hour (minutes left at :00)
const thisHour = () => String(new Date().getHours()).padStart(2, "0") + ":00";

/**
 * Add / edit an order. It starts from `editing` (or empty) when mounted, so the parent gives it a new `key`
 * to start over (after saving, cancelling, or picking another order to edit).
 */
export default function OrderForm({ s, t, update, editing, onSaved, onCancel }: ViewProps & {
  editing?: Order; onSaved: (id: number, dDate: string) => void; onCancel: () => void;
}) {
  const e0 = editing;
  const [name, setName] = useState(e0?.name ?? "");
  const [ch, setCh] = useState(e0?.ch ?? CH[0]);
  const [phone, setPhone] = useState(e0?.phone ?? "");
  const [addr, setAddr] = useState(e0?.addr ?? "");
  const [map, setMap] = useState(e0?.map ?? "");
  const [dDate, setDDate] = useState(() => (e0 ? e0.dDate || "" : day(0)));
  const [dTime, setDTime] = useState(() => (e0 ? e0.dTime || "" : thisHour()));
  const [steam, setSteam] = useState(!!e0?.steam);
  const [live, setLive] = useState(!!e0?.live);
  const [note, setNote] = useState(e0?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(!!e0?.note);
  const [lines, setLines] = useState<FormLine[]>(() => e0
    ? (e0.lines || []).map((l) => ({ key: ++lineKey, pid: OLD, q: String(l.q), u: l.u, snap: { k: l.k, name: l.name, price: l.price } }))
    : [newLine(s)]);
  const [amt, setAmt] = useState(e0 ? String(e0.amt / 1000) : "");
  const [ship, setShip] = useState(e0?.ship ? String(e0.ship / 1000) : "");
  const formRef = useRef<HTMLFormElement>(null);
  const { bad, err, check } = useErrors();
  const [confirmNode, ask] = useConfirm();
  // Old orders saved as free text (no lines) can still be edited; their items are kept unless replaced
  const legacy = e0 && !e0.lines?.length
    ? [e0.crab && kl(t, "crab") + " " + e0.crab, e0.shrimp && kl(t, "shrimp") + " " + e0.shrimp, e0.item].filter(Boolean).join(", ")
    : "";

  // The form can be folded away to leave more room for the board; remembered on this device. Editing always opens it.
  const [open, setOpen] = useState(() => { if (e0) return true; try { return localStorage.getItem(FORM_OPEN) !== "0"; } catch { return true; } });
  // While the height animates the content is clipped; once it settles it stops clipping so focus rings and shadows show
  const [settled, setSettled] = useState(open);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setSettled(false);
    const id = setTimeout(() => setSettled(true), 420);
    return () => clearTimeout(id);
  }, [open]);
  function showForm(v: boolean) {
    setOpen(v);
    try { localStorage.setItem(FORM_OPEN, v ? "1" : "0"); } catch {}
  }
  // Scroll to the form when it opens for an edit (only then: the order object changes with every data update)
  const editId = e0?.id;
  useEffect(() => {
    if (editId == null) return;
    try { localStorage.setItem(FORM_OPEN, "1"); } catch {}
    // Wait a frame so the form is laid out before scrolling to it
    const id = setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    return () => clearTimeout(id);
  }, [editId]);

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

  // Past customers, newest order first, with the phone and address they last used
  const custs = useMemo(() => {
    const m = new Map<string, Order>();
    [...s.orders].sort((a, b) => b.id - a.id).forEach((o) => { const k = fold(o.name.trim()); if (k && !m.has(k)) m.set(k, o); });
    return m;
  }, [s.orders]);
  // Addresses already delivered to, newest first: suggested for free before asking Goong
  const pastAddrs = useMemo(() => [...new Set([...s.orders].sort((a, b) => b.id - a.id).map((o) => o.addr?.trim() || "").filter(Boolean))], [s.orders]);
  const custOpts = useMemo(() => [...custs.values()].map((o) => ({ value: o.name, hint: o.phone || t.pastCust })), [custs, t]);
  function pickCustomer(o: { value: string }) {
    const c = custs.get(fold(o.value.trim()));
    if (!c) return;
    if (c.phone) setPhone(c.phone);
    setCh(c.ch);
    // Fill the address too, unless something was already typed there
    if (!addr.trim()) { setAddr(c.addr || ""); setMap(c.map || ""); }
  }

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

  // Changing items or quantities drops any typed total so it's recalculated from the lines
  function changeLines(fn: (ls: FormLine[]) => FormLine[]) {
    setLines(fn);
    setAmt("");
  }
  const setLine = (key: number, patch: Partial<FormLine>) => changeLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const n = name.trim(), contact = { phone: formatVN(phone), addr: addr.trim(), map: map.trim() || undefined, dDate, dTime, steam, live, steamFee: feeNum, note: note.trim() || undefined };
    const ok = check(t, [
      { key: "n", ok: !!n, label: t.name },
      { key: "ph", ok: !contact.phone || isVNPhone(contact.phone), label: t.phone, msg: t.phoneBad },
      { key: "lines", ok: valid.length > 0 || !!legacy, label: t.itemMiss },
      { key: "a", ok: amtNum > 0, label: t.total },
    ]);
    if (!ok) return;
    if (e0) {
      const id = e0.id;
      if (!(await ask({ title: t.cfEditT, body: <>{t.cfEditB}<br /><OrderLine o={{ name: n, dDate, dTime, amt: amtNum }} t={t} /></>, ok: t.cfEditOk, cancel: t.cfBack }))) return;
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
      onSaved(id, dDate);
    } else {
      const id = newId();
      update((d) => {
        d.orders.push({ id, name: n, ch, ...contact, lines: valid, amt: amtNum, ship: shipNum, stage: 0, date: day(0) });
      });
      onSaved(id, dDate);
    }
  }

  return (
    <>
      {confirmNode}
      {/* The folded bar and the form swap with a height animation; both stay mounted so it can run both ways */}
      <div className={`fold${open ? "" : " on"}${!open && settled ? " done" : ""}`} inert={open}>
        <div>
          <button type="button" className="add foldbar" onClick={() => showForm(true)}>
            {/* Looks like a ghost button, but a span: buttons can't be nested */}
            <b>📝 {t.newOrder}</b><span className="ghost">{t.unfold}</span>
          </button>
        </div>
      </div>
      <div className={`fold${open ? " on" : ""}${open && settled ? " done" : ""}`} inert={!open}>
        <div>
          <FormCard ref={formRef} className={e0 ? "editing" : undefined} onSubmit={submit}>
            <div className="fhead">
              {e0 ? <div className="edh">✎ {t.editing}<b>{e0.name}</b></div> : <b>📝 {t.newOrder}</b>}
              <div className="fhead-acts">
                <Button on={qOpen} aria-expanded={qOpen} onClick={() => { setQOpen(!qOpen); setQMsg(""); }}>{t.quick}</Button>
                {!e0 && <Button onClick={() => showForm(false)}>{t.fold}</Button>}
              </div>
            </div>
            {qOpen && (
              <div className="quick">
                <p>{t.quickHint}</p>
                <TextArea ref={qRef} rows={7} value={qText} autoFocus placeholder={QUICK_TEMPLATE} onChange={(e) => setQText(e.target.value)} />
                <div className="quick-acts">
                  <Button variant="primary" disabled={!qText.trim()} onClick={applyQuick}>{t.quickFill}</Button>
                  <Button onClick={copyTemplate}>{copied ? t.quickCopied : t.quickCopy}</Button>
                  <Button onClick={() => setQOpen(false)}>{t.quickClose}</Button>
                </div>
              </div>
            )}
            {qMsg && <div className="qmsg" role="status">{qMsg}</div>}
            <Select className="a-ch" value={ch} onChange={setCh} options={CH} label={t.chLbl} />
            <Combobox className="a-name" bad={bad.n} placeholder={t.name} value={name} onChange={setName} options={custOpts} onPick={pickCustomer} />
            <TextInput bad={bad.ph} type="tel" inputMode="tel" autoComplete="off" placeholder={t.phone}
              value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhone(formatVN(phone))} />
            <AddressBox value={addr} onChange={setAddr} past={pastAddrs} t={t} />
            <TextInput className="a-map" type="url" inputMode="url" autoComplete="off" placeholder={t.mapPh} value={map}
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
                  <Button onClick={() => { setAddr(linkAddr); setLinkAddr(""); }}>{t.linkUse}</Button>
                </>}
              </div>
            )}
            <DatePicker className="dt" label={t.dDate} value={dDate} onChange={setDDate} t={t} clearable />
            <TimePicker className="dt" label={t.dTime} value={dTime} onChange={setDTime} t={t} />
            <div className="opts">
              <ToggleChip checked={steam} onChange={setSteam}>🔥 {t.steam}</ToggleChip>
              <ToggleChip checked={live} onChange={setLive}>📺 {t.live}</ToggleChip>
              {steam && <span className="optfee">{feeNum ? `${t.steamFee}: +${vnd(feeNum)}` : t.steamFree}</span>}
            </div>
            <div className="lines">
              {legacy && <div className="sg">{t.oldItems}{legacy}</div>}
              {lines.map((l) => (
                <div className="ln" key={l.key}>
                  <Select className="lp" label={t.itemMiss} value={pidOf(l)} options={dishOpts(l)}
                    onChange={(v) => setLine(l.key, { pid: v, snap: v === OLD ? l.snap : undefined })} />
                  {/* Quantities are always in kg; older lines entered per piece keep their unit */}
                  <UnitInput className="lq" bad={bad.lines} placeholder={t.qty} value={l.q} onChange={(v) => setLine(l.key, { q: v })}
                    suffix={l.u === "kg" ? "kg" : t.piece} />
                  <IconButton label={t.rm} onClick={() => changeLines((ls) => ls.filter((x) => x.key !== l.key))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </IconButton>
                </div>
              ))}
            </div>
            <div className="fbtns">
              <Button onClick={() => changeLines((ls) => [...ls, newLine(s)])}>+ {t.addLine}</Button>
              {noteOpen
                ? <Button onClick={() => { setNote(""); setNoteOpen(false); }}>✕ {t.noteRm}</Button>
                : <Button onClick={() => setNoteOpen(true)}>{t.addNote}</Button>}
            </div>
            {noteOpen && (
              <div className="notef">
                <TextArea rows={2} placeholder={t.note} value={note} autoFocus={!note} onChange={(e) => setNote(e.target.value)} />
              </div>
            )}
            <Money value={amtShown} onChange={setAmt} placeholder={t.total} bad={bad.a} />
            <Money value={ship} onChange={setShip} placeholder={t.ship} />
            <Button variant="primary" type="submit">{e0 ? t.saveEdit : t.add}</Button>
            {e0 && <Button onClick={onCancel}>{t.cancel}</Button>}
          </FormCard>
          <div className="sg">
            {any ? t.sugg + vnd(suggested * 1000) + (est ? t.suggEst : "") : ""}
            {amtNum > 0 && <>{any && <br />}{t.dep}: {vnd(deposit(amtNum))} · {t.due}: {vnd(dueAfterDeposit(amtNum, shipNum, feeNum))}</>}
          </div>
          <FormError>{err}</FormError>
        </div>
      </div>
    </>
  );
}
