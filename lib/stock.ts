// Today's crab stock. Each morning the shop enters, per crab on the menu, how many kg and how many pieces it has
// (what is left from yesterday plus what came in); every confirmed order (or further along) delivered that day takes
// its lines off, kg lines from the kg and "con" lines from the pieces. Orders for other days don't touch it.
// The dashboard saves what is left next to what was entered, and the public pages read it.
import type { MenuItem, Order } from "./store";

export interface Amount { kg: number; pcs: number }
export interface Stock {
  /** Day the stock was entered (YYYY-MM-DD); it only counts on that day */
  date: string;
  /** What was entered, by menu item id */
  items: Record<string, Amount>;
  /** What is left after that day's confirmed orders, by menu item id (kept up to date by the dashboard) */
  left?: Record<string, Amount>;
}
/** One crab's stock as shown to customers */
export interface StockView extends Amount { out: boolean }

/** Order stage from which an order holds its crabs ("Đã xác nhận" and every stage after it) */
const CONFIRMED = 1;
const round = (n: number) => Math.round(n * 100) / 100;

/** The day an order uses its crabs: its delivery day, or the day it was placed when it has none */
const orderDay = (o: Order) => o.dDate || o.date;

/** What is left of each entered crab after the confirmed orders delivered on the stock's day (trash excluded) */
export function stockLeft(stock: Stock, orders: Order[], items: MenuItem[]): Record<string, Amount> {
  const left: Record<string, Amount> = {};
  for (const [id, a] of Object.entries(stock.items)) left[id] = { ...a };
  const idOf = new Map(items.filter((i) => i.k === "crab").map((i) => [i.name, i.id]));
  for (const o of orders) {
    if (o.delAt || o.stage < CONFIRMED || orderDay(o) !== stock.date) continue;
    for (const l of o.lines || []) {
      const a = l.k === "crab" ? left[idOf.get(l.name) ?? ""] : undefined;
      if (!a) continue;
      if (l.u === "kg") a.kg = round(a.kg - l.q);
      else a.pcs = round(a.pcs - l.q);
    }
  }
  return left;
}

/**
 * A crab's stock for customers: sold out once any amount the shop entered is used up (or nothing was entered).
 * Only the amounts that were entered are shown; null when the crab isn't in today's stock.
 */
export function stockView(stock: Stock | null | undefined, id: string, today: string): StockView | null {
  const set = stock?.date === today ? stock.items[id] : undefined;
  if (!set) return null;
  const l = stock!.left?.[id] ?? set;
  const out = (set.kg <= 0 && set.pcs <= 0) || (set.kg > 0 && l.kg <= 0) || (set.pcs > 0 && l.pcs <= 0);
  return { kg: set.kg > 0 ? Math.max(0, l.kg) : 0, pcs: set.pcs > 0 ? Math.max(0, l.pcs) : 0, out };
}

/** "12 kg · 40 con" (only the amounts that were entered) */
export const amountText = (a: Amount, pcs = "con") =>
  [a.kg > 0 && `${a.kg.toLocaleString("vi-VN")} kg`, a.pcs > 0 && `${a.pcs.toLocaleString("vi-VN")} ${pcs}`].filter(Boolean).join(" · ");

/** Today's date in Vietnam (YYYY-MM-DD), the shop's day, wherever the page is rendered */
export const vnToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
