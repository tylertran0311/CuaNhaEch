"use client";

import { useState } from "react";
import { Money, useErrors, type ViewProps } from "./ui";
import { KINDS, day, fd, kl, newId, type Kind } from "@/lib/store";

export default function MenuView({ s, t, update }: ViewProps) {
  const [k, setK] = useState<Kind>("crab");
  const [nm, setNm] = useState("");
  const [sz, setSz] = useState("");
  const [pr, setPr] = useState("");
  const { bad, err, check } = useErrors();

  function setPrice(id: string, v: string) {
    if (!(+v > 0)) return;
    update((d) => {
      const it = d.menu.items.find((i) => i.id === id);
      if (!it) return;
      it.price = Math.round(+v * 1000);
      d.menu.upd = day(0);
    });
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const name = nm.trim(), price = +pr;
    const ok = check(t, [
      { key: "mnm", ok: !!name, label: t.itemName.split(" (")[0] },
      { key: "mpr", ok: price > 0, label: t.price },
    ]);
    if (!ok) return;
    update((d) => {
      d.menu.items.push({ id: "u" + newId().toString(36), k, name, price: Math.round(price * 1000), w: k === "crab" ? 250 : 30, sz: sz.trim() });
      d.menu.upd = day(0);
    });
    setNm(""); setSz(""); setPr("");
  }

  return (
    <>
      <div className="panel">
        <h2>{t.menuT}</h2>
        <p className="sub" style={{ margin: "0 0 6px" }}>{t.menuHint}</p>
        <p style={{ margin: "0 0 6px" }}><b>{s.menu.upd ? t.updAt + fd(s.menu.upd) : t.notYet}</b></p>
        {KINDS.map((kind) => (
          <div key={kind}>
            <h3 className="mh">{kind === "crab" ? "🦀" : "🦐"} {kl(t, kind)}</h3>
            {s.menu.items.filter((i) => i.k === kind).map((i) => (
              <div className="mp" key={i.id}>
                <div className="mn"><b>{i.name}</b><span className="m">{i.sz}</span></div>
                <label className="u mu">
                  {/* Uncontrolled: commit on blur/Enter like a native change event */}
                  <input key={i.price} type="number" min="0" step="any" inputMode="decimal" defaultValue={i.price / 1000}
                    onBlur={(e) => setPrice(i.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                  <span>.000 ₫/kg</span>
                </label>
                <button className="ghost" onClick={() => update((d) => { d.menu.items = d.menu.items.filter((x) => x.id !== i.id); })}>{t.rm}</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>{t.addItem}</h2>
        <form className="add" style={{ border: 0, padding: 0, margin: 0 }} onSubmit={addItem}>
          <select value={k} onChange={(e) => setK(e.target.value as Kind)}>
            {KINDS.map((x) => <option key={x} value={x}>{kl(t, x)}</option>)}
          </select>
          <input className={bad.mnm ? "bad" : ""} placeholder={t.itemName} value={nm} onChange={(e) => setNm(e.target.value)} />
          <input placeholder={t.itemSize} value={sz} onChange={(e) => setSz(e.target.value)} />
          <Money value={pr} onChange={setPr} placeholder={t.price} bad={bad.mpr} />
          <button className="btn" type="submit">{t.addItemB}</button>
        </form>
        <div className="err" role="alert" style={{ margin: "8px 0 0" }}>{err}</div>
      </div>

      <div className="panel">
        <h2>{t.rulesT}</h2>
        <ul className="rules">{t.rules.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
    </>
  );
}
