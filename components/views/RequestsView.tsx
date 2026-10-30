"use client";

import { useState } from "react";
import { Button, Empty, Note, Panel, Toast, useConfirm } from "@/components/ui";
import type { ViewProps } from "./types";
import { day, fdw, newId, vnd, type Order } from "@/lib/store";
import { formatVN } from "@/lib/phone";
import { readMapsUrl } from "@/lib/maps";
import { MAPS_LINK, type Req } from "@/lib/request";

/** Waiting tab: order requests customers sent from a product page; confirm one to turn it into a Confirmed order */
export default function RequestsView({ s, t, update, db }: ViewProps & { db: boolean }) {
  const [node, ask] = useConfirm();
  const [done, setDone] = useState<{ id: number; text: string } | null>(null);
  const reqs = s.reqs ?? [];

  function confirm(r: Req) {
    const it = s.menu.items.find((i) => i.name === r.item);
    const q = r.q ?? 0;
    const o: Order = {
      id: newId(), name: r.name, ch: "Website", phone: formatVN(r.phone), map: r.map,
      addr: readMapsUrl(r.map).text || undefined, dDate: r.dDate, dTime: r.dTime, note: r.note || undefined,
      lines: it && q ? [{ k: it.k, name: it.name, q, u: "kg", price: it.price }] : [],
      amt: it && q ? Math.round(it.price * q) : 0, ship: 0, stage: 1, date: day(0),
    };
    update((d) => {
      d.reqs = (d.reqs ?? []).filter((x) => x.id !== r.id);
      d.orders.push(o);
    });
    setDone({ id: r.id, text: t.reqDone.replace("{n}", r.name) + (it ? "" : " " + t.reqGone) });
  }

  async function decline(r: Req) {
    if (!(await ask({ title: t.reqNoT, body: <>{r.name} · {formatVN(r.phone)}<br />{t.reqNoB}</>, ok: t.reqNo, cancel: t.cfBack, danger: true }))) return;
    update((d) => { d.reqs = (d.reqs ?? []).filter((x) => x.id !== r.id); });
  }

  return (
    <>
      <Panel title={`${t.reqT} (${reqs.length})`}>
        <p className="sub tight">{t.reqHint}</p>
        {reqs.length ? null : !db ? <Note>{t.reqNoDb}</Note> : !s.reqs ? <Note>{t.reqNoTable}</Note> : <Empty>{t.reqNone}</Empty>}
        {reqs.length > 0 && (
          <ul className="rq-list">
            {reqs.map((r) => {
              const it = s.menu.items.find((i) => i.name === r.item);
              return (
                <li key={r.id} className="rq-card">
                  <div className="rq-head">
                    <b>{r.name}</b>
                    <a href={`tel:${r.phone}`}>{formatVN(r.phone)}</a>
                  </div>
                  <p className="rq-line"><b>{t.reqDeliver}{fdw(t, r.dDate)} · {r.dTime}</b></p>
                  {r.item && <p className="rq-line">{r.item} · {String(r.q ?? 0).replace(".", ",")} kg{it && r.q ? ` ≈ ${vnd(it.price * r.q)}` : ""}</p>}
                  {r.note && <p className="rq-line rq-note">{r.note}</p>}
                  <p className="rq-line sub tight">
                    {/* Only Google Maps links are stored; checked again so nothing else ever becomes a link */}
                    {MAPS_LINK.test(r.map) && <a href={r.map} target="_blank" rel="noopener noreferrer nofollow">{t.reqMap}</a>}
                    {r.at && <> · {t.reqAt}{new Date(r.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</>}
                  </p>
                  <div className="rq-acts">
                    <Button variant="primary" onClick={() => confirm(r)}>{t.reqOk}</Button>
                    <Button onClick={() => decline(r)}>{t.reqNo}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {node}
      {done && <Toast key={done.id} onDone={() => setDone(null)}>{done.text}</Toast>}
    </>
  );
}
