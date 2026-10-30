import { useState } from "react";
import { Button, Chip, CopyBtn } from "@/components/ui";
import type { Dict } from "@/lib/i18n";
import { mapUrl } from "@/lib/text";
import { DEPOSITED, PAID, deposit, stillDue, vnd, type Order } from "@/lib/store";
import { bankReady, paidByBank } from "@/lib/pay";
import { ItemsList, When } from "./bits";
import PayQR from "./PayQR";

/** One order on the board: contact, delivery, items, money and actions. Dragged by the ⠿ grip (see useBoardDrag). */
export default function OrderCard({ o, t, pop, editing, onDeposit, onEdit, onDelete }: {
  o: Order; t: Dict; pop?: boolean; editing?: boolean; onDeposit: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [qr, setQr] = useState(false);
  const bank = paidByBank(o), times = o.pays?.length || 0;
  return (
    <div className={`card${pop ? " pop" : ""}${editing ? " editing" : ""}`} data-id={o.id}>
      <span className="grip" aria-hidden="true">⠿</span>
      <Chip kind="channel">{o.ch}</Chip> <b>{o.name}</b>
      {o.phone && <div className="ci">📞 <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>{o.phone}</a> <CopyBtn text={o.phone} label={t.copyPhone} /></div>}
      {o.addr && <div className="ci">📍 {o.addr} <CopyBtn text={o.addr} label={t.copyAddr} /></div>}
      {(o.addr || o.map) && (
        <div className="ci">
          🗺 <a href={mapUrl(o.map, o.addr || "")} target="_blank" rel="noopener noreferrer">{o.map ? t.mapOpen : t.mapFind}</a>
          {o.map && <> <CopyBtn text={o.map} label={t.mapCopy} /></>}
        </div>
      )}
      {o.note && <div className="onote">📝 {o.note}</div>}
      <When o={o} t={t} />
      <ItemsList o={o} t={t} />
      <div className="m">{vnd(o.amt)}{o.steamFee ? ` + ${t.steamw} ${vnd(o.steamFee)}` : ""} + {t.shipw} {vnd(o.ship)}</div>
      <div className="dep">
        <div><span>{t.dep}</span><span>{vnd(deposit(o.amt))}</span></div>
        <div><span>{t.due}</span><strong>{vnd(stillDue(o))}</strong></div>
        {o.stage < DEPOSITED ? (
          <div className="nodep">✗ {t.depNo}</div>
        ) : o.stage < PAID ? (
          <div className="paid">✓ {t.depGot}{vnd(o.dep || 0)}</div>
        ) : <div className="paid">✓ {t.paidFull}</div>}
        {o.stage < DEPOSITED && !!o.part && <div className="part">{t.payPart}{vnd(o.part)}</div>}
        {bank > 0 && o.stage >= DEPOSITED && <div className="bank">💳 {t.payGot}{vnd(bank)}{times > 1 ? t.payTimes.replace("{n}", String(times)) : ""}</div>}
      </div>
      {qr && <PayQR o={o} t={t} />}
      <div className="row">
        {o.stage < DEPOSITED && <Button className="dp" onClick={onDeposit}>{t.depMark}</Button>}
        {bankReady && o.stage < PAID && <Button on={qr} aria-expanded={qr} onClick={() => setQr(!qr)}>{qr ? t.payQrHide : t.payQr}</Button>}
        <div className="acts">
          <Button onClick={onEdit}>{t.edit}</Button>
          <Button onClick={onDelete}>{t.rm}</Button>
        </div>
      </div>
    </div>
  );
}
