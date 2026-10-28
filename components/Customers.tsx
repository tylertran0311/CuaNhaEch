"use client";

import type { ViewProps } from "./ui";
import { day, orderTotal, vnd } from "@/lib/store";

interface Cust { name: string; n: number; sum: number; last: string; phone: string }

export default function Customers({ s, t }: ViewProps) {
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
      <div className="stats">
        <div className="stat"><small>{t.cust}</small><div>{A.length}</div></div>
        <div className="stat"><small>{t.rep}</small><div>{rep}</div></div>
        <div className="stat"><small>{t.avg}</small><div>{vnd(s.orders.length ? tot / s.orders.length : 0)}</div></div>
      </div>
      <div className="two">
        <div className="panel">
          <h2>{t.byCh}</h2>
          {Object.keys(ch).map((k) => {
            const q = (ch[k] / s.orders.length) * 100;
            return (
              <div key={k}>
                <div>{k} · {ch[k]} {t.ords} ({Math.round(q)}%)</div>
                <div className="hb"><i style={{ width: q + "%" }} /></div>
              </div>
            );
          })}
          {!s.orders.length && <div className="empty">{t.seeCh}</div>}
        </div>
        <div className="panel">
          <h2>{t.best}</h2>
          {A.length ? (
            <table>
              <thead><tr><th>{t.nm}</th><th className="r">{t.oc}</th><th className="r">{t.sp}</th></tr></thead>
              <tbody>
                {A.slice(0, 8).map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td className="r">{c.n}</td><td className="r">{vnd(c.sum)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">{t.noC}</div>}
        </div>
      </div>
      <div className="panel">
        <h2>{t.again}</h2>
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
        ) : <div className="empty">{t.every}</div>}
      </div>
    </>
  );
}
