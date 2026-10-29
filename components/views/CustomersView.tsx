"use client";

import { Empty, Panel, Stat, Stats, TwoCols } from "@/components/ui";
import type { ViewProps } from "./types";
import { day, orderTotal, vnd } from "@/lib/store";

interface Cust { name: string; n: number; sum: number; last: string; phone: string }

/** Customers tab: counts, orders by channel, best customers, who to message again */
export default function CustomersView({ s, t }: ViewProps) {
  const m: Record<string, Cust> = {};
  s.orders.forEach((o) => {
    const k = o.name.toLowerCase();
    const c = m[k] || (m[k] = { name: o.name, n: 0, sum: 0, last: "", phone: "" });
    c.n++;
    c.sum += orderTotal(o);
    // Keep the phone number from the most recent order that has one
    if (o.phone && (!c.phone || o.date >= c.last)) c.phone = o.phone;
    if (o.date > c.last) c.last = o.date;
  });
  const A = Object.values(m).sort((a, b) => b.sum - a.sum);
  const rep = A.filter((c) => c.n > 1).length;
  const tot = s.orders.reduce((a, o) => a + orderTotal(o), 0);
  const ch: Record<string, number> = {};
  s.orders.forEach((o) => { ch[o.ch] = (ch[o.ch] || 0) + 1; });
  const today = new Date(day(0)).getTime();
  const due = A.filter((c) => (today - new Date(c.last).getTime()) / 864e5 >= 21).slice(0, 6);

  return (
    <>
      <Stats>
        <Stat label={t.cust} value={A.length} />
        <Stat label={t.rep} value={rep} />
        <Stat label={t.avg} value={vnd(s.orders.length ? tot / s.orders.length : 0)} />
      </Stats>
      <TwoCols>
        <Panel title={t.byCh}>
          {Object.keys(ch).map((k) => {
            const q = (ch[k] / s.orders.length) * 100;
            return (
              <div key={k}>
                <div>{k} · {ch[k]} {t.ords} ({Math.round(q)}%)</div>
                <div className="hb"><i style={{ width: q + "%" }} /></div>
              </div>
            );
          })}
          {!s.orders.length && <Empty>{t.seeCh}</Empty>}
        </Panel>
        <Panel title={t.best}>
          {A.length ? (
            <table>
              <thead><tr><th>{t.nm}</th><th className="r">{t.oc}</th><th className="r">{t.sp}</th></tr></thead>
              <tbody>
                {A.slice(0, 8).map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td className="r">{c.n}</td><td className="r">{vnd(c.sum)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <Empty>{t.noC}</Empty>}
        </Panel>
      </TwoCols>
      <Panel title={t.again}>
        {due.length ? (
          <table>
            <thead><tr><th>{t.nm}</th><th>{t.phoneCol}</th><th>{t.lastO}</th><th className="r">{t.oc}</th></tr></thead>
            <tbody>
              {due.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.phone ? <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>{c.phone}</a> : "—"}</td>
                  <td>{c.last}</td><td className="r">{c.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>{t.every}</Empty>}
      </Panel>
    </>
  );
}
