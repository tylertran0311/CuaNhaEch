"use client";

import { useState } from "react";
import { Money, useErrors, type ViewProps } from "./ui";
import { PAID, day, depIn, months, short, vnd } from "@/lib/store";

export default function MoneyView({ s, t, update }: ViewProps) {
  const [label, setLabel] = useState("");
  const [amt, setAmt] = useState("");
  const { bad, err, check } = useErrors();

  const paid = s.orders.filter((o) => o.stage >= PAID), pend = s.orders.filter((o) => o.stage < PAID);
  // Deposits on unpaid orders count as money in on the day they were received
  const deps = pend.reduce((a, o) => a + depIn(o), 0);
  const inn = paid.reduce((a, o) => a + o.amt, 0) + deps;
  const out = s.exp.reduce((a, e) => a + e.amt, 0);
  const pn = pend.reduce((a, o) => a + o.amt - depIn(o), 0);
  const ms = months();
  const mi = ms.map((m) =>
    paid.filter((o) => o.date.slice(0, 7) === m).reduce((a, o) => a + o.amt, 0) +
    pend.filter((o) => (o.depDate || o.date).slice(0, 7) === m).reduce((a, o) => a + depIn(o), 0));
  const mo = ms.map((m) => s.exp.filter((e) => e.date.slice(0, 7) === m).reduce((a, e) => a + e.amt, 0));
  const mx = Math.max(...mi, ...mo, 1);

  function addExp(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim(), a = +amt;
    const ok = check(t, [
      { key: "el", ok: !!l, label: t.what.split(" (")[0] },
      { key: "ea", ok: a > 0, label: t.amt },
    ]);
    if (!ok) return;
    update((d) => { d.exp.push({ id: d.next++, label: l, amt: Math.round(a * 1000), date: day(0) }); });
    setLabel(""); setAmt("");
  }

  const sorted = s.exp.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <div className="stats">
        <div className="stat"><small>{t.mIn}</small><div style={{ color: "var(--grn)" }}>{vnd(inn)}</div>{deps > 0 && <small>{t.inDep}{vnd(deps)}</small>}</div>
        <div className="stat"><small>{t.mOut}</small><div style={{ color: "var(--red)" }}>{vnd(out)}</div></div>
        <div className="stat"><small>{t.profit}</small><div>{vnd(inn - out)}</div></div>
        <div className="stat"><small>{t.wait}</small><div>{vnd(pn)}</div></div>
      </div>

      <div className="panel">
        <h2>{t.l6}</h2>
        <div className="bars">
          {ms.map((m, k) => (
            <div className="g" key={m}>
              <div className="p">
                <i style={{ height: (mi[k] / mx) * 100 + "%", background: "var(--grn)" }} title={vnd(mi[k])} />
                <i style={{ height: (mo[k] / mx) * 100 + "%", background: "var(--red)" }} title={vnd(mo[k])} />
              </div>
              {m.slice(5)}/{m.slice(2, 4)}<br />{short(mi[k] - mo[k])}
            </div>
          ))}
        </div>
        <div className="legend">
          <u style={{ background: "var(--grn)" }} />{t.lgIn}
          <u style={{ background: "var(--red)" }} />{t.lgOut}{t.lgNote}
        </div>
      </div>

      <div className="panel">
        <h2>{t.addExp}</h2>
        <form className="add" style={{ border: 0, padding: 0, margin: 0 }} onSubmit={addExp}>
          <input className={bad.el ? "bad" : ""} placeholder={t.what} value={label} onChange={(e) => setLabel(e.target.value)} />
          <Money value={amt} onChange={setAmt} placeholder={t.amt} bad={bad.ea} />
          <button className="btn" type="submit">{t.addExpB}</button>
        </form>
        <div className="err" role="alert" style={{ margin: "8px 0 0" }}>{err}</div>
      </div>

      <div className="panel">
        <h2>{t.exps}</h2>
        {sorted.length ? (
          <table>
            <thead><tr><th>{t.date}</th><th>{t.forc}</th><th className="r">{t.amt}</th><th /></tr></thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td><td>{e.label}</td><td className="r">{vnd(e.amt)}</td>
                  <td className="r"><button className="ghost" onClick={() => update((d) => { d.exp = d.exp.filter((x) => x.id !== e.id); })}>{t.rm}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">{t.noExp}</div>}
      </div>
    </>
  );
}
