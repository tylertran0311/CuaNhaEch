// The public pages' cart: kept in this browser only (localStorage), so a customer can pick several kinds of crab and
// send them as one order (Zalo message or the order request form). Prices are today's and only an estimate; the
// shop confirms the total when it calls back.
import { useSyncExternalStore } from "react";
import { readLS, writeLS } from "./storage";

/** One kind of crab in the cart: `item` is the dish's name on the menu, `name` what the page calls it */
export interface CartLine { item: string; name: string; slug: string; size: string; price?: number; kg: number }

const KEY = "cne.cart";
const EVENT = "cne-cart";
export const CART_MAX = 10;
export const KG = { step: 0.5, min: 0.5, max: 20 };

export const kgText = (kg: number) => String(kg).replace(".", ",") + " kg";
const clampKg = (kg: number) => Math.min(KG.max, Math.max(KG.min, Math.round(kg / KG.step) * KG.step));

// Parsed once per change: useSyncExternalStore needs the same array back while nothing changed
let raw: string | null = null, cached: CartLine[] = [];
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  const s = readLS(KEY);
  if (s === raw) return cached;
  raw = s;
  try {
    const v: unknown = s ? JSON.parse(s) : [];
    cached = Array.isArray(v)
      ? v.filter((l): l is CartLine => !!l && typeof l.item === "string" && typeof l.name === "string" && typeof l.kg === "number")
        .map((l) => ({ ...l, kg: clampKg(l.kg) })).slice(0, CART_MAX)
      : [];
  } catch { cached = []; }
  return cached;
}

function write(lines: CartLine[]) {
  writeLS(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn); // another tab changed it
  return () => { window.removeEventListener(EVENT, fn); window.removeEventListener("storage", fn); };
}

/** The cart, live across components and tabs (empty while rendering on the server) */
export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Add kilos of a crab (adds to the line already there); false when the cart already holds CART_MAX kinds */
export function addToCart(line: CartLine) {
  const lines = read(), i = lines.findIndex((l) => l.item === line.item);
  if (i < 0 && lines.length >= CART_MAX) return false;
  write(i < 0 ? [...lines, { ...line, kg: clampKg(line.kg) }]
    : lines.map((l, n) => (n === i ? { ...line, kg: clampKg(l.kg + line.kg) } : l)));
  return true;
}

export const setKg = (item: string, kg: number) => write(read().map((l) => (l.item === item ? { ...l, kg: clampKg(kg) } : l)));
export const removeFromCart = (item: string) => write(read().filter((l) => l.item !== item));
export const clearCart = () => write([]);

/** Estimated goods total; `known` is false when some line has no price today */
export function cartTotal(lines: CartLine[]) {
  return { total: lines.reduce((n, l) => n + Math.round((l.price ?? 0) * l.kg), 0), known: lines.every((l) => l.price != null) };
}

/** The order as a Zalo message, one line per crab */
export const cartMessage = (lines: CartLine[]) =>
  ["Shop ơi, mình muốn đặt:", ...lines.map((l) => `- ${kgText(l.kg)} ${l.name} (${l.size})`)].join("\n");

/** Ask the header's cart to open (from "Thêm vào giỏ") */
export const openCart = () => window.dispatchEvent(new Event("cne-cart-open"));
