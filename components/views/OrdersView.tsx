"use client";

import { useEffect, useState } from "react";
import { Button, DatePicker, Empty, Note, Toast, Toolbar, useConfirm } from "@/components/ui";
import OrderForm from "@/components/orders/OrderForm";
import OrderCard from "@/components/orders/OrderCard";
import Trash from "@/components/orders/Trash";
import { OrderLine } from "@/components/orders/bits";
import { useBoardDrag } from "@/components/orders/useBoardDrag";
import type { ViewProps } from "./types";
import { DEPOSITED, IC, TRASH_DAYS, byWhen, day, fd, fdw, isoDate, moveTo, type Order } from "@/lib/store";

/** "" shows every order, "none" the ones without a delivery date, otherwise one delivery day (YYYY-MM-DD) */
export type DayFilter = string;
const shiftDay = (d: string, n: number) => isoDate(new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8) + n));
const inDay = (f: DayFilter, o: { dDate?: string }) => (f === "" ? true : f === "none" ? !o.dDate : o.dDate === f);

/** Orders tab: the order form, the day bar, the board of stage columns, the trash */
export default function OrdersView({ s, trash, t, update, goMenu, focus, setFocus }: ViewProps & {
  trash: Order[]; goMenu: () => void; focus: DayFilter; setFocus: (f: DayFilter) => void;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  // Bumped to start the form over after saving or cancelling
  const [formKey, setFormKey] = useState(0);
  const [popId, setPopId] = useState<number | null>(null);
  // The order just deleted, offered back for a few seconds
  const [undo, setUndo] = useState<{ id: number; name: string } | null>(null);
  const [confirmNode, ask] = useConfirm();
  const editing = editId == null ? undefined : s.orders.find((o) => o.id === editId);

  useEffect(() => {
    if (popId == null) return;
    const id = setTimeout(() => setPopId(null), 600);
    return () => clearTimeout(id);
  }, [popId]);

  function closeForm() {
    setEditId(null);
    setFormKey((k) => k + 1);
  }
  function saved(id: number, dDate: string) {
    setPopId(id);
    // Keep the saved order in view when it's for a different delivery day than the one shown
    if (!inDay(focus, { dDate })) setFocus(dDate || "none");
    closeForm();
  }

  function move(id: number, stage: number) {
    update((d) => { const o = d.orders.find((x) => x.id === id); if (o) moveTo(o, stage); });
    setPopId(id);
  }
  useBoardDrag(move);

  async function delOrder(o: Order) {
    if (!(await ask({ title: t.cfDelT, body: <><OrderLine o={o} t={t} /><br />{t.cfDelB.replace("{n}", String(TRASH_DAYS))}</>, ok: t.cfDelOk, cancel: t.cfBack, danger: true }))) return;
    if (o.id === editId) closeForm();
    // Moved to the trash, not removed: undo right away, or restore from the trash for TRASH_DAYS
    update((d) => { const x = d.orders.find((y) => y.id === o.id); if (x) x.delAt = Date.now(); });
    setUndo({ id: o.id, name: o.name });
  }
  function restore(id: number) {
    update((d) => { const x = d.orders.find((y) => y.id === id); if (x) delete x.delAt; });
    setUndo((u) => (u?.id === id ? null : u));
    setPopId(id);
  }
  async function purge(o: Order) {
    if (!(await ask({ title: t.cfPurgeT, body: <><OrderLine o={o} t={t} /><br />{t.cfPurgeB}</>, ok: t.cfPurgeOk, cancel: t.cfBack, danger: true }))) return;
    update((d) => { d.orders = d.orders.filter((x) => x.id !== o.id); });
  }

  const shown = s.orders.filter((o) => inDay(focus, o));
  const noDate = s.orders.filter((o) => !o.dDate).length;
  // The day the arrows and date picker step from when showing all or undated orders
  const dayOf = focus === "" || focus === "none" ? day(0) : focus;

  return (
    <>
      {confirmNode}
      {s.menu.upd !== day(0) && (
        <Note>
          <span>{t.stale.replace("{d}", s.menu.upd ? fd(s.menu.upd) : "—")}</span>
          <Button onClick={goMenu}>{t.openMenu}</Button>
          <Button onClick={() => update((d) => { d.menu.upd = day(0); })}>{t.priceOk}</Button>
        </Note>
      )}

      <OrderForm key={editing ? "e" + editing.id : "n" + formKey} s={s} t={t} update={update} editing={editing} onSaved={saved} onCancel={closeForm} />

      <Toolbar className="daybar" title={<>🗓 {focus === "" ? t.dayAllT : focus === "none" ? t.dayNone : `${t.dayOrders} ${fdw(t, focus)}`}</>}
        meta={<>{shown.length} {t.ords}</>}>
        <Button aria-label={t.dayPrev} title={t.dayPrev} onClick={() => setFocus(shiftDay(dayOf, -1))}>←</Button>
        <DatePicker className="daypk" value={dayOf} onChange={(v) => v && setFocus(v)} t={t} />
        <Button aria-label={t.dayNext} title={t.dayNext} onClick={() => setFocus(shiftDay(dayOf, 1))}>→</Button>
        <Button on={focus === day(0)} onClick={() => setFocus(day(0))}>{t.today}</Button>
        <Button on={focus === "none"} onClick={() => setFocus("none")}>{t.dayNone} ({noDate})</Button>
        <Button on={focus === ""} onClick={() => setFocus("")}>{t.dayAll}</Button>
      </Toolbar>

      <div className="board">
        {t.st.map((st, k) => {
          const list = shown.filter((o) => o.stage === k).sort(byWhen);
          return (
            <div className="col" data-stage={k} key={k}>
              <h3><b>{IC[k]} {st}</b><span className="n">{list.length}</span></h3>
              {list.map((o) => (
                <OrderCard key={o.id} o={o} t={t} pop={o.id === popId} editing={o.id === editId}
                  onDeposit={() => move(o.id, DEPOSITED)} onEdit={() => setEditId(o.id)} onDelete={() => delOrder(o)} />
              ))}
              {!list.length && <Empty>{t.none}</Empty>}
            </div>
          );
        })}
      </div>
      <p className="sub mt-12">{t.hint}</p>

      <Trash items={trash} t={t} onRestore={restore} onPurge={purge} />

      {undo && (
        <Toast key={undo.id} action={<>↩ {t.undo}</>} onAction={() => restore(undo.id)} onDone={() => setUndo(null)}>
          🗑 {t.deleted.replace("{n}", undo.name)}
        </Toast>
      )}
    </>
  );
}
