import type { Dict, Lang } from "./i18n";
import type { Address } from "./address";

export type Kind = "crab" | "shrimp";
export type Unit = "kg" | "con";

export interface MenuItem { id: string; k: Kind; name: string; price: number; w: number; sz: string }
export interface Line { k: Kind; name: string; q: number; u: Unit; price: number }
export interface Order {
  id: number; name: string; ch: string; amt: number; ship: number; stage: number; date: string;
  // addr is the full one-line address shown on cards; ad holds its parts (missing on older orders)
  phone?: string; addr?: string; ad?: Address;
  // Delivery day (YYYY-MM-DD) and time (HH:MM)
  dDate?: string; dTime?: string;
  lines?: Line[];
  // Deposit actually received and the day it came in (unset = not received yet)
  dep?: number; depDate?: string;
  // Legacy free-text fields from older saved data
  crab?: string; shrimp?: string; item?: string;
}
export interface Expense { id: number; label: string; amt: number; date: string }
export interface State { orders: Order[]; exp: Expense[]; next: number; v: number; menu: { upd: string; items: MenuItem[] } }

export const KEY = "cne-dashboard-v1";
export const LK = "cne-lang";
export const DEPOSITED = 2;
export const PAID = 3;
export const CH = ["Facebook", "Zalo", "TikTok"];
export const IC = ["⏳", "✅", "💸", "💖", "🍳", "🚚"];
export const KINDS: Kind[] = ["crab", "shrimp"];

const p2 = (n: number) => ("0" + n).slice(-2);
export const isoDate = (d: Date) => d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
export function day(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}
/** Sort key: earliest delivery first, no time after timed ones that day, no date last */
export const whenKey = (o: Order) => (o.dDate ? o.dDate + " " + (o.dTime || "99:99") : "~");
export const byWhen = (a: Order, b: Order) => (whenKey(a) < whenKey(b) ? -1 : whenKey(a) > whenKey(b) ? 1 : 0);
export const SHIPPED = 5;
export const fd = (d: string) => d.slice(8) + "/" + d.slice(5, 7);
/** "T4 29/10" — weekday plus day/month */
export const fdw = (t: Dict, d: string) => t.wd[new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8)).getDay()] + " " + fd(d);
export const vnd = (n: number) => Math.round(n).toLocaleString("vi-VN") + " ₫";
export const short = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : Math.round(n / 1e3) + "k");
export const DEP = 0.3;
/** 30% deposit on the goods total (not shipping), rounded to the nearest 1,000 ₫ */
export const deposit = (amt: number) => Math.round((amt * DEP) / 1000) * 1000;
/** What is left to collect after the deposit: rest of the goods plus shipping */
export const dueAfterDeposit = (amt: number, ship: number) => amt - deposit(amt) + ship;
/** Deposit counted as money in: only while the order hasn't reached Paid (after that the full total counts) */
export const depIn = (o: Order) => (o.stage < PAID ? o.dep || 0 : 0);
/** What the customer still owes, including shipping */
export const stillDue = (o: Order) => (o.stage >= PAID ? 0 : o.amt + o.ship - (o.dep || 0));

/** Move an order to a column; reaching the deposit column records the 30% deposit as received */
export function moveTo(o: Order, stage: number) {
  o.stage = stage;
  if (stage >= DEPOSITED && !o.dep) { o.dep = deposit(o.amt); o.depDate = day(0); }
  if (stage < DEPOSITED) { delete o.dep; delete o.depDate; }
}
export const kl =(t: Dict, k: Kind) => (k === "crab" ? t.kCrab : t.kShrimp);

export function months() {
  const a: string[] = [], d = new Date();
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    a.push(x.getFullYear() + "-" + p2(x.getMonth() + 1));
  }
  return a;
}

function defMenu(): State["menu"] {
  return {
    upd: "",
    items: [
      { id: "c1", k: "crab", name: "Thịt Tứ", price: 360000, w: 225, sz: "4-5 con/kg" },
      { id: "c2", k: "crab", name: "Yếm Vuông", price: 370000, w: 215, sz: "5-6 con/kg" },
      { id: "c3", k: "crab", name: "Thịt Y", price: 450000, w: 375, sz: "2-3 con/kg" },
      { id: "c4", k: "crab", name: "Gạch", price: 650000, w: 350, sz: "2-3 con/kg" },
      { id: "s1", k: "shrimp", name: "Bạc", price: 90000, w: 10, sz: ">100 con/kg" },
      { id: "s2", k: "shrimp", name: "Thẻ mix sú", price: 185000, w: 22, sz: "40-50 con/kg" },
      { id: "s3", k: "shrimp", name: "Sú 20 con", price: 320000, w: 50, sz: "19-21 con/kg" },
    ],
  };
}

function sample(): State {
  return {
    orders: [
      { id: 1, name: "Chị Lan", ch: "Facebook", crab: "2kg", shrimp: "", amt: 980000, ship: 40000, stage: 5, date: day(40) },
      { id: 2, name: "Anh Minh", ch: "Zalo", crab: "3kg", shrimp: "1kg", amt: 1750000, ship: 55000, stage: 5, date: day(22) },
      { id: 3, name: "Chị Lan", ch: "TikTok", crab: "1kg", shrimp: "", amt: 520000, ship: 30000, stage: 4, date: day(6) },
      { id: 4, name: "Cô Hạnh", ch: "Zalo", crab: "5kg", shrimp: "", amt: 2300000, ship: 90000, stage: 2, date: day(2), dep: 690000, depDate: day(1) },
      { id: 5, name: "Anh Tuấn", ch: "Facebook", crab: "", shrimp: "2kg", amt: 690000, ship: 45000, stage: 0, date: day(0) },
    ],
    exp: [
      { id: 1, label: "Crab from farm", amt: 1100000, date: day(40) },
      { id: 2, label: "Crab from farm", amt: 1200000, date: day(22) },
      { id: 3, label: "Foam boxes and ice", amt: 180000, date: day(8) },
    ],
    next: 10,
    v: 3,
    menu: defMenu(),
  };
}

export function load(): State {
  let s: State | null = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { s = null; }
  if (!s || !s.orders) s = sample();
  if (!s.menu) s.menu = defMenu();
  if (!s.v) {
    s.orders.forEach((o) => { o.stage = [1, 2, 2, 3, 4, 5][o.stage] || 0; });
    s.v = 2;
  }
  // v3: column 2 changed from "fee checked" to "deposit paid", which now drives the deposit
  if (s.v < 3) {
    s.orders.forEach((o) => {
      if (o.stage === DEPOSITED && !o.dep) o.stage = 1;
      else if (o.stage < DEPOSITED && o.dep) o.stage = DEPOSITED;
    });
    s.v = 3;
  }
  return s;
}

export function save(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function loadLang(): Lang {
  try {
    const l = localStorage.getItem(LK);
    if (l === "vi" || l === "en") return l;
  } catch {}
  return "vi";
}

export function saveLang(l: Lang) {
  try { localStorage.setItem(LK, l); } catch {}
}
