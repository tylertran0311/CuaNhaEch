// Server-only: the shop's menu as anyone may see it (read with the public key; needs the "public read" policies
// in supabase/schema.sql). Cached under the "menu" tag: the dashboard clears it whenever the menu changes
// (POST /api/menu-changed), and it also refreshes on its own every few minutes.
import { SB_KEY, SB_URL } from "./serverAuth";
import type { MenuItem } from "./store";
import type { Stock } from "./stock";

export const MENU_TAG = "menu";
const REFRESH = 300;

export interface PublicMenu { items: MenuItem[]; upd: string; stock?: Stock }

/** The live menu, or null when the database isn't set up or can't be read publicly yet */
export async function getPublicMenu(): Promise<PublicMenu | null> {
  if (!SB_URL || !SB_KEY) return null;
  const init = { headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` }, next: { tags: [MENU_TAG], revalidate: REFRESH } };
  try {
    const [a, b] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/menu_items?select=id,data,position&order=position`, init),
      fetch(`${SB_URL}/rest/v1/meta?select=key,value&key=in.(menu_upd,stock)`, init),
    ]);
    if (!a.ok) return null;
    const rows = (await a.json()) as { id: string; data: MenuItem }[];
    // An empty list means the public policy isn't there yet (or the menu is empty): show the page without prices
    if (!rows.length) return null;
    const meta = b.ok ? ((await b.json()) as { key: string; value: unknown }[]) : [];
    const val = (k: string) => meta.find((m) => m.key === k)?.value;
    return { items: rows.map((r) => ({ ...r.data, id: String(r.id) })), upd: (val("menu_upd") as string) || "", stock: val("stock") as Stock | undefined };
  } catch {
    return null;
  }
}
