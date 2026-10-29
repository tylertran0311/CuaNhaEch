"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Dict } from "@/lib/i18n";
import { TRASH_DAYS, type Order } from "@/lib/store";
import { OrderLine } from "./bits";

/** Deleted orders (kept TRASH_DAYS days): a folded list with restore / delete for good */
export default function Trash({ items, t, onRestore, onPurge }: {
  items: Order[]; t: Dict; onRestore: (id: number) => void; onPurge: (o: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="trash">
      <Button aria-expanded={open} onClick={() => setOpen(!open)}>
        🗑 {t.trash} ({items.length}) {open ? "▴" : "▾"}
      </Button>
      {open && (
        <div className="trash-list">
          <p className="sub">{t.trashHint.replace("{n}", String(TRASH_DAYS))}</p>
          {items.map((o) => {
            const left = Math.max(1, Math.ceil(TRASH_DAYS - (Date.now() - o.delAt!) / 864e5));
            return (
              <div className="trash-row" key={o.id}>
                <div className="trash-info">
                  <div><OrderLine o={o} t={t} /></div>
                  <small>{t.trashLeft.replace("{n}", String(left))}</small>
                </div>
                <div className="trash-acts">
                  <Button onClick={() => onRestore(o.id)}>↩ {t.restore}</Button>
                  <Button onClick={() => onPurge(o)}>{t.purge}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
