"use client";

import { useState } from "react";
import type { ViewProps } from "./ui";
import { OrderTags } from "./Orders";
import type { Dict } from "@/lib/i18n";
import { IC, PAID, SHIPPED, byWhen, day, fd, isoDate, kl, stillDue, vnd, type Order } from "@/lib/store";

function itemsText(o: Order, t: Dict) {
  if (o.lines && o.lines.length) return o.lines.map((l) => `${l.name} ${l.q}${l.u === "kg" ? "kg" : " " + t.piece}`).join(", ");
  return [o.crab && kl(t, "crab") + " " + o.crab, o.shrimp && kl(t, "shrimp") + " " + o.shrimp, o.item].filter(Boolean).join(", ");
}

function Ev({ o, t, showDate }: { o: Order; t: Dict; showDate?: boolean }) {
  return (
    <div className={`ev${o.stage >= SHIPPED ? " done" : ""}`} title={t.st[o.stage]}>
      <div className="evt">
        <span>{showDate && o.dDate ? fd(o.dDate) + " · " : ""}{o.dTime || t.noTime}</span>
        <span aria-label={t.st[o.stage]}>{IC[o.stage]}</span>
      </div>
      <div><span className="ch">{o.ch}</span> <b>{o.name}</b> <OrderTags o={o} t={t} /></div>
      <div className="m">{itemsText(o, t)}</div>
      {o.phone && <div className="m">📞 {o.phone}</div>}
      {o.addr && <div className="m">📍 {o.addr}</div>}
      {o.stage < PAID && <div className="due">{t.due}: {vnd(stillDue(o))}</div>}
    </div>
  );
}

export default function CalendarView({ s, t }: ViewProps) {
  const [offset, setOffset] = useState(0);
  const today = day(0);

  // Week runs Monday to Sunday
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => isoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));

  const dated = s.orders.filter((o) => o.dDate).sort(byWhen);
  const inWeek = dated.filter((o) => o.dDate! >= days[0] && o.dDate! <= days[6]);
  const overdue = dated.filter((o) => o.dDate! < today && o.stage < SHIPPED);
  const undated = s.orders.filter((o) => !o.dDate && o.stage < SHIPPED);
  const toDeliver = inWeek.filter((o) => o.stage < SHIPPED).length;

  return (
    <>
      <div className="calbar">
        <h2>🗓 {t.week} {fd(days[0])} – {fd(days[6])} <small>· {toDeliver} {t.calCount}</small></h2>
        <button className="ghost" onClick={() => setOffset(offset - 1)}>{t.calPrev}</button>
        <button className="ghost" disabled={offset === 0} onClick={() => setOffset(0)}>{t.calThis}</button>
        <button className="ghost" onClick={() => setOffset(offset + 1)}>{t.calNext}</button>
      </div>

      <div className="cal">
        {days.map((d, i) => {
          const list = inWeek.filter((o) => o.dDate === d);
          return (
            <div key={d} className={`day${d === today ? " today" : d < today ? " past" : ""}`}>
              <h3>
                <span>{t.wd[(i + 1) % 7]} {fd(d)}{d === today && <> · {t.today}</>}</span>
                <span className="n">{list.length}</span>
              </h3>
              {list.map((o) => <Ev key={o.id} o={o} t={t} />)}
              {!list.length && <div className="empty">{t.calEmpty}</div>}
            </div>
          );
        })}
      </div>

      {overdue.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h2>⚠️ {t.overdue} ({overdue.length})</h2>
          <div className="evs">{overdue.map((o) => <Ev key={o.id} o={o} t={t} showDate />)}</div>
        </div>
      )}
      <div className="panel" style={{ marginTop: 20 }}>
        <h2>{t.noDate} ({undated.length})</h2>
        {undated.length
          ? <div className="evs">{undated.map((o) => <Ev key={o.id} o={o} t={t} />)}</div>
          : <div className="empty">{t.calEmpty}</div>}
      </div>
      <p className="sub">{t.calHint}</p>
    </>
  );
}
