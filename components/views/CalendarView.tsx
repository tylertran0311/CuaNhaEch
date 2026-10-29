"use client";

import { useState } from "react";
import { Button, Chip, Empty, Panel, Toolbar } from "@/components/ui";
import { OrderTags, itemsText } from "@/components/orders/bits";
import type { ViewProps } from "./types";
import type { Dict } from "@/lib/i18n";
import { IC, PAID, SHIPPED, byWhen, day, fd, isoDate, stillDue, vnd, type Order } from "@/lib/store";

/** One order in a day column */
function Ev({ o, t, showDate }: { o: Order; t: Dict; showDate?: boolean }) {
  return (
    <div className={`ev${o.stage >= SHIPPED ? " done" : ""}`} title={t.st[o.stage]}>
      <div className="evt">
        <span>{showDate && o.dDate ? fd(o.dDate) + " · " : ""}{o.dTime || t.noTime}</span>
        <span aria-label={t.st[o.stage]}>{IC[o.stage]}</span>
      </div>
      <div><Chip kind="channel">{o.ch}</Chip> <b>{o.name}</b> <OrderTags o={o} t={t} /></div>
      <div className="m">{itemsText(o, t)}</div>
      {o.phone && <div className="m">📞 {o.phone}</div>}
      {o.addr && <div className="m">📍 {o.addr}</div>}
      {o.note && <div className="m onote">📝 {o.note}</div>}
      {o.stage < PAID && <div className="due">{t.due}: {vnd(stillDue(o))}</div>}
    </div>
  );
}

/** Delivery calendar: the week Monday to Sunday, plus overdue and undated orders */
export default function CalendarView({ s, t, openDay }: ViewProps & { openDay: (d: string) => void }) {
  const [offset, setOffset] = useState(0);
  const today = day(0);

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
      <Toolbar title={<>🗓 {t.week} {fd(days[0])} – {fd(days[6])}</>} meta={<>{toDeliver} {t.calCount}</>}>
        <Button onClick={() => setOffset(offset - 1)}>{t.calPrev}</Button>
        <Button disabled={offset === 0} onClick={() => setOffset(0)}>{t.calThis}</Button>
        <Button onClick={() => setOffset(offset + 1)}>{t.calNext}</Button>
      </Toolbar>

      <div className="cal">
        {days.map((d, i) => {
          const list = inWeek.filter((o) => o.dDate === d);
          return (
            <div key={d} className={`day${d === today ? " today" : d < today ? " past" : ""}`}>
              <h3 title={t.dayOpen} onClick={() => openDay(d)}>
                <span>{t.wd[(i + 1) % 7]} {fd(d)}{d === today && <> · {t.today}</>}</span>
                <span className="n">{list.length}</span>
              </h3>
              {list.map((o) => <Ev key={o.id} o={o} t={t} />)}
              {!list.length && <Empty>{t.calEmpty}</Empty>}
            </div>
          );
        })}
      </div>

      {overdue.length > 0 && (
        <Panel className="mt-20" title={<>⚠️ {t.overdue} ({overdue.length})</>}>
          <div className="evs">{overdue.map((o) => <Ev key={o.id} o={o} t={t} showDate />)}</div>
        </Panel>
      )}
      <Panel className="mt-20" title={<>{t.noDate} ({undated.length})</>}>
        {undated.length
          ? <div className="evs">{undated.map((o) => <Ev key={o.id} o={o} t={t} />)}</div>
          : <Empty>{t.calEmpty}</Empty>}
      </Panel>
      <p className="sub">{t.calHint}</p>
    </>
  );
}
