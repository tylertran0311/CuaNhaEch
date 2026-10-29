"use client";

import { useState } from "react";
import { Button, FormCard, FormError, Money, Panel, Select, TextInput, UnitInput, useErrors } from "@/components/ui";
import type { ViewProps } from "./types";
import { KINDS, day, fd, kl, newId, type Kind } from "@/lib/store";

/** Menu tab: today's prices by kind, adding items, deposit rules */
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
      <Panel title={t.menuT}>
        <p className="sub tight">{t.menuHint}</p>
        <p className="menu-upd"><b>{s.menu.upd ? t.updAt + fd(s.menu.upd) : t.notYet}</b></p>
        {KINDS.map((kind) => (
          <div key={kind}>
            <h3 className="mh">{kind === "crab" ? "🦀" : "🦐"} {kl(t, kind)}</h3>
            {s.menu.items.filter((i) => i.k === kind).map((i) => (
              <div className="mp" key={i.id}>
                <div className="mn"><b>{i.name}</b><span className="m">{i.sz}</span></div>
                {/* Uncontrolled: commit on blur/Enter like a native change event */}
                <UnitInput className="mu" suffix=".000 ₫/kg" inputKey={i.price} inputProps={{
                  defaultValue: i.price / 1000,
                  onBlur: (e) => setPrice(i.id, e.target.value),
                  onKeyDown: (e) => { if (e.key === "Enter") e.currentTarget.blur(); },
                }} />
                <Button onClick={() => update((d) => { d.menu.items = d.menu.items.filter((x) => x.id !== i.id); })}>{t.rm}</Button>
              </div>
            ))}
          </div>
        ))}
      </Panel>

      <Panel title={t.addItem}>
        <FormCard onSubmit={addItem}>
          <Select className="a-kind" value={k} onChange={(v) => setK(v as Kind)} options={KINDS.map((x) => ({ value: x, label: kl(t, x) }))} />
          <TextInput bad={bad.mnm} placeholder={t.itemName} value={nm} onChange={(e) => setNm(e.target.value)} />
          <TextInput placeholder={t.itemSize} value={sz} onChange={(e) => setSz(e.target.value)} />
          <Money value={pr} onChange={setPr} placeholder={t.price} bad={bad.mpr} />
          <Button variant="primary" type="submit">{t.addItemB}</Button>
        </FormCard>
        <FormError below>{err}</FormError>
      </Panel>

      <Panel title={t.rulesT}>
        <ul className="rules">{t.rules.map((r) => <li key={r}>{r}</li>)}</ul>
      </Panel>
    </>
  );
}
