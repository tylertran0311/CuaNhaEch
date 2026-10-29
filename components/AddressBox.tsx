"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Combobox, type Opt } from "./Pickers";
import type { Dict } from "@/lib/i18n";
import { fold } from "@/lib/text";
import { supabase } from "@/lib/supabase";

// Goong is paid per lookup, so lookups are saved on this device and only made when they're likely to help:
// after the typing pauses, once the text is long enough, and not when an address already used for an order matches.
const CACHE = "cne-addr-cache-v2";
const MIN = 6, WAIT = 550, KEEP = 150;
const mem = new Map<string, string[]>(readCache());
// Turned off for the rest of the visit when the server has no key or the daily cap is reached
let off = "";

function readCache(): [string, string[]][] {
  try { return JSON.parse(localStorage.getItem(CACHE) || "[]"); } catch { return []; }
}
function remember(q: string, items: string[]) {
  mem.delete(q);
  mem.set(q, items);
  while (mem.size > KEEP) mem.delete(mem.keys().next().value!);
  try { localStorage.setItem(CACHE, JSON.stringify([...mem])); } catch {}
}
/** GET /api/address with the signed-in user's token */
async function ask(params: string) {
  const tok = (await supabase?.auth.getSession())?.data.session?.access_token;
  return fetch("/api/address?" + params, { headers: tok ? { authorization: "Bearer " + tok } : {} });
}

/** Address of a Google Maps share link ("" when it can't be read) */
export async function addrFromLink(link: string): Promise<string> {
  const k = "link:" + link.trim();
  const hit = mem.get(k);
  if (hit) return hit[0] || "";
  try {
    const r = await ask("link=" + encodeURIComponent(link.trim()));
    const j = (await r.json()) as { addr?: string };
    if (!r.ok) return "";
    remember(k, [j.addr || ""]);
    return j.addr || "";
  } catch { return ""; }
}

const key = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

/** One address field: suggestions from addresses used before (free) and from Goong as you type */
export function AddressBox({ value, onChange, past, t, bad }: {
  value: string; onChange: (v: string) => void; past: string[]; t: Dict; bad?: boolean;
}) {
  // Only text typed here is looked up, not an address filled in from a past customer or the quick entry
  const [typed, setTyped] = useState("");
  const [remote, setRemote] = useState<string[]>([]);
  const [state, setState] = useState<"" | "busy" | "err">("");
  const seq = useRef(0);

  const q = key(typed);
  const local = useMemo(() => {
    const f = fold(q);
    return f ? past.filter((a) => fold(a).includes(f)).slice(0, 5) : [];
  }, [past, q]);

  useEffect(() => {
    const id = ++seq.current;
    if (q.length < MIN || local.length || off) { setRemote([]); setState(""); return; }
    const hit = mem.get(q);
    if (hit) { setRemote(hit); setState(""); return; }
    setState("busy");
    const timer = setTimeout(async () => {
      try {
        const r = await ask("q=" + encodeURIComponent(q));
        const j = (await r.json()) as { items?: string[]; error?: string };
        if (id !== seq.current) return;
        if (j.error === "no-key" || j.error === "limit") off = j.error;
        if (!r.ok) { setRemote([]); setState("err"); return; }
        remember(q, j.items || []);
        setRemote(j.items || []);
        setState("");
      } catch {
        if (id === seq.current) { setRemote([]); setState("err"); }
      }
    }, WAIT);
    return () => clearTimeout(timer);
  }, [q, local.length]);

  const options: Opt[] = [
    ...local.map((a) => ({ value: a, hint: t.addrUsed })),
    ...remote.filter((a) => !local.includes(a)).map((a) => ({ value: a })),
  ];
  const msg = state === "busy" ? t.addrBusy : off === "limit" ? t.addrLimit : state === "err" || off ? t.addrOff
    : q.length >= MIN ? t.addrNone : "";

  return (
    <Combobox className="a-addr" bad={bad} placeholder={t.addrPh} value={value} options={options} filter={false} noMatch={msg}
      onChange={(v) => { onChange(v); setTyped(v); }} onPick={() => setTyped("")} />
  );
}
