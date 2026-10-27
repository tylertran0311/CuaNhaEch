"use client";

import { useEffect, useRef, useState } from "react";
import { Money, useErrors, type ViewProps } from "./ui";
import type { Dict } from "@/lib/i18n";
import { formatVN, isVNPhone } from "@/lib/phone";
import { EMPTY_ADDR, PROVINCES, composeAddr, type Address } from "@/lib/address";
import { CH, DEPOSITED, IC, KINDS, PAID, SHIPPED, byWhen, day, deposit, dueAfterDeposit, moveTo, stillDue, fd, fdw, kl, short, vnd, type Kind, type Line, type Order, type State, type Unit } from "@/lib/store";

// When editing, a line starts on its saved snapshot (pid === OLD) so the order keeps the price it was placed at
interface FormLine { key: number; pid: string; q: string; u: Unit; snap?: { k: Kind; name: string; price: number } }
const OLD = "__old";

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

/** Delivery day/time, flagged when it's today, tomorrow or overdue (until the order is shipped) */
function When({ o, t }: { o: Order; t: Dict }) {
  if (!o.dDate && !o.dTime) return null;
  const today = day(0);
  const flag = !o.dDate || o.stage >= SHIPPED ? null
    : o.dDate < today ? <span className="wn late">{t.late}</span>
    : o.dDate === today ? <span className="wn now">{t.today}</span>
    : o.dDate === day(-1) ? <span className="wn soon">{t.tomorrow}</span> : null;
  return (
    <div className="ci">🗓 {t.deliver}: <b className="wt">{[o.dDate && fdw(t, o.dDate), o.dTime].filter(Boolean).join(" · ")}</b> {flag}</div>
  );
}

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

export default function Orders({ s, t, update, goMenu }: ViewProps & { goMenu: () => void }) {
  const [name, setName] = useState("");
  const [ch, setCh] = useState(CH[0]);
  const [phone, setPhone] = useState("");
  const [ad, setAd] = useState<Address>(EMPTY_ADDR);
  const [dDate, setDDate] = useState("");
  const [dTime, setDTime] = useState("");
  const [lines, setLines] = useState<FormLine[]>(() => [newLine(s)]);
  const [amt, setAmt] = useState("");
  const [ship, setShip] = useState("");
  const [popId, setPopId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { bad, err, check, clear } = useErrors();
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

  function move(id: number, stage: number) {
    update((d) => { const o = d.orders.find((x) => x.id === id); if (o) moveTo(o, stage); });
    setPopId(id);
  }

  useBoardDrag(move);

  const item = (id: string) => s.menu.items.find((i) => i.id === id);
  const resolve = (l: FormLine) => {
    if (l.pid === OLD && l.snap) {
      const m = s.menu.items.find((i) => i.k === l.snap!.k && i.name === l.snap!.name);
      return { ...l.snap, w: m ? m.w : l.snap.k === "crab" ? 250 : 30 };
    }
    return item(l.pid);
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

  const setLine = (key: number, patch: Partial<FormLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function resetForm() {
    setEditId(null); setName(""); setCh(CH[0]); setPhone(""); setAd(EMPTY_ADDR); setDDate(""); setDTime(""); setLines([newLine(s)]); setAmt(""); setShip(""); clear();
  }

  function startEdit(o: Order) {
    setEditId(o.id);
    setName(o.name);
    setCh(o.ch);
    setPhone(o.phone || "");
    // Older orders only have the one-line address: put it in the street field so nothing is lost
    setAd(o.ad ? { ...EMPTY_ADDR, ...o.ad } : { ...EMPTY_ADDR, street: o.addr || "" });
    setDDate(o.dDate || "");
    setDTime(o.dTime || "");
    setLines((o.lines || []).map((l) => ({ key: ++lineKey, pid: OLD, q: String(l.q), u: l.u, snap: { k: l.k, name: l.name, price: l.price } })));
    setAmt(String(o.amt / 1000));
    setShip(o.ship ? String(o.ship / 1000) : "");
    clear();
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(), contact = { phone: formatVN(phone), addr: composeAddr(ad), ad: { ...ad }, dDate, dTime };
    const ok = check(t, [
      { key: "n", ok: !!n, label: t.name },
      { key: "ph", ok: !contact.phone || isVNPhone(contact.phone), label: t.phone, msg: t.phoneBad },
      { key: "lines", ok: valid.length > 0 || !!legacy, label: t.itemMiss },
      { key: "a", ok: amtNum > 0, label: t.total },
    ]);
    if (!ok) return;
    if (editing) {
      const id = editing.id;
      update((d) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o) return;
        Object.assign(o, { name: n, ch, ...contact, amt: amtNum, ship: shipNum });
        if (valid.length) {
          o.lines = valid;
          delete o.crab; delete o.shrimp; delete o.item;
        }
      });
      setPopId(id);
    } else {
      const id = s.next;
      update((d) => {
        d.orders.push({ id: d.next++, name: n, ch, ...contact, lines: valid, amt: amtNum, ship: shipNum, stage: 0, date: day(0) });
      });
      setPopId(id);
    }
    resetForm();
  }

  function delOrder(id: number) {
    if (id === editId) resetForm();
    update((d) => { d.orders = d.orders.filter((x) => x.id !== id); });
  }

  return (
    <>
      {s.menu.upd !== day(0) && (
        <div className="note">
          <span>{t.stale.replace("{d}", s.menu.upd ? fd(s.menu.upd) : "—")}</span>
          <button className="ghost" onClick={goMenu}>{t.openMenu}</button>
          <button className="ghost" onClick={() => update((d) => { d.menu.upd = day(0); })}>{t.priceOk}</button>
        </div>
      )}

      <form ref={formRef} className={`add${editing ? " editing" : ""}`} onSubmit={submit}>
        {editing && <div className="edh">✎ {t.editing}<b>{editing.name}</b></div>}
        <select value={ch} onChange={(e) => setCh(e.target.value)}>
          {CH.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className={bad.n ? "bad" : ""} placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={bad.ph ? "bad" : ""} type="tel" inputMode="tel" autoComplete="off" placeholder={t.phone}
          value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhone(formatVN(phone))} />
        <fieldset className="adr">
          <legend>📍 {t.addr}</legend>
          {([["no", t.adNo], ["street", t.adStreet], ["ward", t.adWard], ["dist", t.adDist], ["city", t.adCity]] as const).map(([k, ph]) => (
            <input key={k} className={`a-${k}`} autoComplete="off" placeholder={ph} value={ad[k]}
              list={k === "city" ? "provinces" : undefined}
              onChange={(e) => setAd((a) => ({ ...a, [k]: e.target.value }))} />
          ))}
          <datalist id="provinces">{PROVINCES.map((p) => <option key={p} value={p} />)}</datalist>
        </fieldset>
        <label className="u dt"><span>{t.dDate}</span><input type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} /></label>
        <label className="u dt"><span>{t.dTime}</span><input type="time" value={dTime} onChange={(e) => setDTime(e.target.value)} /></label>
        <div className="lines">
          {legacy && <div className="sg">{t.oldItems}{legacy}</div>}
          {lines.map((l) => (
            <div className="ln" key={l.key}>
              <select className="lp" value={l.pid} onChange={(e) => setLine(l.key, { pid: e.target.value, snap: e.target.value === OLD ? l.snap : undefined })}>
                {l.snap && <option value={OLD}>{l.snap.name} — {short(l.snap.price)}/kg · {t.atOrder}</option>}
                {KINDS.map((k) => (
                  <optgroup key={k} label={kl(t, k)}>
                    {s.menu.items.filter((i) => i.k === k).map((i) => (
                      <option key={i.id} value={i.id}>{i.name} — {short(i.price)}/kg</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input className={`lq${bad.lines ? " bad" : ""}`} type="number" min="0" step="any" inputMode="decimal"
                placeholder={t.qty} value={l.q} onChange={(e) => setLine(l.key, { q: e.target.value })} />
              <select className="lu" value={l.u} onChange={(e) => setLine(l.key, { u: e.target.value as Unit })}>
                <option value="kg">kg</option>
                <option value="con">{t.piece}</option>
              </select>
              <button type="button" className="ghost x" aria-label={t.rm}
                onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="ghost al" onClick={() => setLines((ls) => [...ls, newLine(s)])}>+ {t.addLine}</button>
        <Money value={amtShown} onChange={setAmt} placeholder={t.total} bad={bad.a} />
        <Money value={ship} onChange={setShip} placeholder={t.ship} />
        <button className="btn" type="submit">{editing ? t.saveEdit : t.add}</button>
        {editing && <button type="button" className="ghost" onClick={resetForm}>{t.cancel}</button>}
      </form>
      <div className="sg">
        {any ? t.sugg + vnd(suggested * 1000) + (est ? t.suggEst : "") : ""}
        {amtNum > 0 && <>{any && <br />}{t.dep}: {vnd(deposit(amtNum))} · {t.due}: {vnd(dueAfterDeposit(amtNum, shipNum))}</>}
      </div>
      <div className="err" role="alert">{err}</div>

      <div className="board">
        {t.st.map((st, k) => {
          const list = s.orders.filter((o) => o.stage === k).sort(byWhen);
          return (
            <div className="col" data-stage={k} key={k}>
              <h3><b>{IC[k]} {st}</b><span className="n">{list.length}</span></h3>
              {list.map((o) => (
                <div className={`card${o.id === popId ? " pop" : ""}${o.id === editId ? " editing" : ""}`} data-id={o.id} key={o.id}>
                  <span className="grip" aria-hidden="true">⠿</span>
                  <span className="ch">{o.ch}</span> <b>{o.name}</b>
                  {o.phone && <div className="ci">📞 <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>{o.phone}</a></div>}
                  {o.addr && <div className="ci">📍 {o.addr}</div>}
                  <When o={o} t={t} />
                  <ItemsList o={o} t={t} />
                  <div className="m">{vnd(o.amt)} + {t.shipw} {vnd(o.ship)}</div>
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
    </>
  );
}
