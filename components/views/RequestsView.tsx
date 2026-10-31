"use client";

import { useState } from "react";
import { Button, Chip, Empty, Note, Panel, Toast, useConfirm } from "@/components/ui";
import type { ViewProps } from "./types";
import { day, fdw, newId, steamFeeFor, vnd, type Order } from "@/lib/store";
import { formatVN } from "@/lib/phone";
import { readMapsUrl } from "@/lib/maps";
import { MAPS_LINK, reqItems, type Req } from "@/lib/request";

/** Waiting tab: order requests customers sent from a product page; confirm one to turn it into a Confirmed order */
export default function RequestsView({ s, t, update, db }: ViewProps & { db: boolean }) {
  const [node, ask] = useConfirm();
  const [done, setDone] = useState<{ id: number; text: string } | null>(null);
  const reqs = s.reqs ?? [];

  // Each requested dish with today's menu entry (none when it left the menu since)
  const dishes = (r: Req) => reqItems(r).map((x) => ({ ...x, it: s.menu.items.find((i) => i.name === x.item) }));

  function confirm(r: Req) {
    const ds = dishes(r), lines = ds.flatMap(({ it, q }) => (it && q ? [{ k: it.k, name: it.name, q, u: "kg" as const, price: it.price }] : []));
    const o: Order = {
      id: newId(), name: r.name, ch: "Website", phone: formatVN(r.phone), map: r.map,
      addr: readMapsUrl(r.map).text || undefined, dDate: r.dDate, dTime: r.dTime, note: r.note || undefined,
      steam: !!r.steam, live: false, steamFee: steamFeeFor(!!r.steam, false),
      lines, amt: lines.reduce((n, l) => n + Math.round(l.price * l.q), 0), ship: 0, stage: 1, date: day(0),
    };
    update((d) => {
      d.reqs = (d.reqs ?? []).filter((x) => x.id !== r.id);
      d.orders.push(o);
    });
    setDone({ id: r.id, text: t.reqDone.replace("{n}", r.name) + (ds.every((d) => d.it) ? "" : " " + t.reqGone) });
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
              const ds = dishes(r);
              return (
                <li key={r.id} className="rq-card">
                  <div className="rq-head">
                    <b>{r.name}</b>
                    <a href={`tel:${r.phone}`}>{formatVN(r.phone)}</a>
                  </div>
                  <p className="rq-line"><b>{t.reqDeliver}{fdw(t, r.dDate)} · {r.dTime}</b></p>
                  {ds.map(({ item, q, it }) => (
                    <p key={item} className="rq-line">{item} · {String(q).replace(".", ",")} kg{it && q ? ` ≈ ${vnd(it.price * q)}` : ""}</p>
                  ))}
                  <p className="rq-line">
                    {r.steam ? <Chip kind="steam">🔥 {t.steam} +{vnd(steamFeeFor(true, false))}</Chip> : <Chip kind="raw">🦀 {t.raw}</Chip>}
                  </p>
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
