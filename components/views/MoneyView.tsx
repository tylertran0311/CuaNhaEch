"use client";

import { useState } from "react";
import { Button, Empty, FormCard, FormError, Money, Panel, Stat, Stats, TextInput, useErrors } from "@/components/ui";
import type { ViewProps } from "./types";
import { PAID, day, depIn, months, newId, orderTotal, short, vnd } from "@/lib/store";

/** Money tab: totals, the last 6 months in/out, expenses */
export default function MoneyView({ s, t, update }: ViewProps) {
  const [label, setLabel] = useState("");
  const [amt, setAmt] = useState("");
  const { bad, err, check } = useErrors();

  const paid = s.orders.filter((o) => o.stage >= PAID), pend = s.orders.filter((o) => o.stage < PAID);
  // Deposits on unpaid orders count as money in on the day they were received
  const deps = pend.reduce((a, o) => a + depIn(o), 0);
  const inn = paid.reduce((a, o) => a + orderTotal(o), 0) + deps;
  const out = s.exp.reduce((a, e) => a + e.amt, 0);
  const pn = pend.reduce((a, o) => a + orderTotal(o) - depIn(o), 0);
  const ms = months();
  const mi = ms.map((m) =>
    paid.filter((o) => o.date.slice(0, 7) === m).reduce((a, o) => a + orderTotal(o), 0) +
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
    update((d) => { d.exp.push({ id: newId(), label: l, amt: Math.round(a * 1000), date: day(0) }); });
    setLabel(""); setAmt("");
  }

  const sorted = s.exp.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <Stats>
        <Stat label={t.mIn} value={vnd(inn)} tone="in" sub={deps > 0 && <>{t.inDep}{vnd(deps)}</>} />
        <Stat label={t.mOut} value={vnd(out)} tone="out" />
        <Stat label={t.profit} value={vnd(inn - out)} />
        <Stat label={t.wait} value={vnd(pn)} />
      </Stats>

      <Panel title={t.l6}>
        <div className="bars">
          {ms.map((m, k) => (
            <div className="g" key={m}>
              <div className="p">
                <i className="in" style={{ height: (mi[k] / mx) * 100 + "%" }} title={vnd(mi[k])} />
                <i className="out" style={{ height: (mo[k] / mx) * 100 + "%" }} title={vnd(mo[k])} />
              </div>
              {m.slice(5)}/{m.slice(2, 4)}<br />{short(mi[k] - mo[k])}
            </div>
          ))}
        </div>
        <div className="legend">
          <u className="in" />{t.lgIn}
          <u className="out" />{t.lgOut}{t.lgNote}
        </div>
      </Panel>

      <Panel title={t.addExp}>
        <FormCard onSubmit={addExp}>
          <TextInput bad={bad.el} placeholder={t.what} value={label} onChange={(e) => setLabel(e.target.value)} />
          <Money value={amt} onChange={setAmt} placeholder={t.amt} bad={bad.ea} />
          <Button variant="primary" type="submit">{t.addExpB}</Button>
        </FormCard>
        <FormError below>{err}</FormError>
      </Panel>

      <Panel title={t.exps}>
        {sorted.length ? (
          <table>
            <thead><tr><th>{t.date}</th><th>{t.forc}</th><th className="r">{t.amt}</th><th /></tr></thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td><td>{e.label}</td><td className="r">{vnd(e.amt)}</td>
                  <td className="r"><Button onClick={() => update((d) => { d.exp = d.exp.filter((x) => x.id !== e.id); })}>{t.rm}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>{t.noExp}</Empty>}
      </Panel>
    </>
  );
}
