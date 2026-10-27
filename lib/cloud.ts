import type { RealtimePostgresChangesPayload, SupabaseClient } from "@supabase/supabase-js";
import { defMenu, type Expense, type MenuItem, type Order, type State } from "./store";

// Each record is a row { id, data } in its own table; the menu's "prices confirmed" day lives in meta.
const MENU_UPD = "menu_upd";

type Row = { id: string | number; data: unknown; position?: number };

function rowsToState(orders: Row[], exp: Row[], items: Row[], meta: { key: string; value: unknown }[]): State {
  return {
    orders: orders.map((r) => ({ ...(r.data as Order), id: Number(r.id) })),
    exp: exp.map((r) => ({ ...(r.data as Expense), id: Number(r.id) })),
    menu: {
      upd: (meta.find((m) => m.key === MENU_UPD)?.value as string) || "",
      items: items.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((r) => ({ ...(r.data as MenuItem), id: String(r.id) })),
    },
    next: 1,
    v: 3,
  };
}

/** Is the signed-in user listed in members? (Non-members can't see that table at all.) */
export async function isMember(sb: SupabaseClient, email: string) {
  const { data, error } = await sb.from("members").select("email").ilike("email", email).limit(1);
  if (error) throw error;
  return !!data?.length;
}

export async function loadCloud(sb: SupabaseClient): Promise<State> {
  const [o, e, m, k] = await Promise.all([
    sb.from("orders").select("id,data"),
    sb.from("expenses").select("id,data"),
    sb.from("menu_items").select("id,data,position"),
    sb.from("meta").select("key,value"),
  ]);
  for (const r of [o, e, m, k]) if (r.error) throw r.error;
  const s = rowsToState(o.data!, e.data!, m.data!, k.data!);
  // Brand-new database: start with the default menu (no sample orders)
  if (!m.data!.length && !k.data!.length) {
    const fresh = { ...s, menu: defMenu() };
    await syncDiff(sb, s, fresh);
    return fresh;
  }
  return s;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Write only what changed between two states: upsert changed/new records, delete removed ones */
export async function syncDiff(sb: SupabaseClient, prev: State, next: State) {
  const now = new Date().toISOString();
  const jobs: PromiseLike<{ error: unknown }>[] = [];

  function diff<T extends { id: string | number }>(table: string, a: T[], b: T[], withPos = false) {
    const before = new Map(a.map((x, i) => [x.id, { x, i }]));
    const after = new Set(b.map((x) => x.id));
    const up = b
      .map((x, i) => ({ x, i, old: before.get(x.id) }))
      .filter(({ x, i, old }) => !old || !same(old.x, x) || (withPos && old.i !== i))
      .map(({ x, i }) => ({ id: x.id, data: x, updated_at: now, ...(withPos ? { position: i } : {}) }));
    const del = a.filter((x) => !after.has(x.id)).map((x) => x.id);
    if (up.length) jobs.push(sb.from(table).upsert(up));
    if (del.length) jobs.push(sb.from(table).delete().in("id", del));
  }

  diff("orders", prev.orders, next.orders);
  diff("expenses", prev.exp, next.exp);
  diff("menu_items", prev.menu.items, next.menu.items, true);
  if (prev.menu.upd !== next.menu.upd)
    jobs.push(sb.from("meta").upsert({ key: MENU_UPD, value: next.menu.upd, updated_at: now }));

  const results = await Promise.all(jobs);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

/** Apply one realtime change (from anyone, including our own writes) to a state copy */
function applyChange(s: State, table: string, p: RealtimePostgresChangesPayload<Record<string, unknown>>): State {
  const n = structuredClone(s);
  const row = p.new as Row & { key?: string; value?: unknown };
  const oldId = (p.old as { id?: string | number; key?: string })?.id;
  const upsertInto = <T extends { id: string | number }>(list: T[], item: T) => {
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item; else list.push(item);
  };
  if (table === "orders") {
    if (p.eventType === "DELETE") n.orders = n.orders.filter((x) => x.id !== Number(oldId));
    else upsertInto(n.orders, { ...(row.data as Order), id: Number(row.id) });
  } else if (table === "expenses") {
    if (p.eventType === "DELETE") n.exp = n.exp.filter((x) => x.id !== Number(oldId));
    else upsertInto(n.exp, { ...(row.data as Expense), id: Number(row.id) });
  } else if (table === "menu_items") {
    if (p.eventType === "DELETE") n.menu.items = n.menu.items.filter((x) => x.id !== String(oldId));
    else {
      const items = n.menu.items.filter((x) => x.id !== String(row.id));
      items.splice(Math.min(row.position ?? items.length, items.length), 0, { ...(row.data as MenuItem), id: String(row.id) });
      n.menu.items = items;
    }
  } else if (table === "meta" && p.eventType !== "DELETE" && row.key === MENU_UPD) {
    n.menu.upd = (row.value as string) || "";
  }
  return n;
}

/** Listen for changes made on other devices; returns an unsubscribe function */
export function subscribe(sb: SupabaseClient, apply: (fn: (s: State) => State) => void) {
  const ch = sb.channel("shop-data");
  for (const table of ["orders", "expenses", "menu_items", "meta"])
    ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) => apply((s) => applyChange(s, table, p)));
  ch.subscribe();
  return () => { sb.removeChannel(ch); };
}
