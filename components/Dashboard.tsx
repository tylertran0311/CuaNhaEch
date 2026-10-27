"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Background from "./Background";
// Static import so the logo URL picks up the GitHub Pages base path
import logo from "@/public/logo.png";
import Orders from "./Orders";
import MenuView from "./MenuView";
import CalendarView from "./CalendarView";
import MoneyView from "./MoneyView";
import Customers from "./Customers";
import Login from "./Login";
import type { Update } from "./ui";
import { LANGS, T, type Lang } from "@/lib/i18n";
import { load, loadLang, loadLocalRaw, save, saveLang, type State } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { isMember, loadCloud, subscribe, syncDiff } from "@/lib/cloud";

export type Tab = "orders" | "cal" | "menu" | "money" | "cust";
const TABS: Tab[] = ["orders", "cal", "menu", "money", "cust"];
const IMPORTED = "cne-imported";

export default function Dashboard() {
  const [s, setS] = useState<State | null>(null);
  const sRef = useRef<State | null>(null);
  const [lang, setLang] = useState<Lang>("vi");
  const [tab, setTab] = useState<Tab>("orders");
  // undefined = still checking; only used when the database is configured
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [denied, setDenied] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [syncErr, setSyncErr] = useState("");
  const [local, setLocal] = useState<State | null>(null);
  const [importing, setImporting] = useState(false);
  const t = T[lang];

  const put = useCallback((next: State | null) => { sRef.current = next; setS(next); }, []);

  useEffect(() => { setLang(loadLang()); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // No database configured: keep using this browser's storage
  useEffect(() => { if (!supabase) put(load()); }, [put]);

  // Database: follow the sign-in state
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => data.subscription.unsubscribe();
  }, []);

  // Signed in: check access, load the shop's data and listen for changes from other devices
  const userEmail = session?.user.email || "";
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    if (!userEmail) { put(null); setDenied(false); setLocal(null); return; }
    let off: (() => void) | undefined, alive = true;
    (async () => {
      try {
        setLoadErr("");
        if (!(await isMember(sb, userEmail))) { if (alive) setDenied(true); return; }
        const data = await loadCloud(sb);
        if (!alive) return;
        put(data);
        let flag = null;
        try { flag = localStorage.getItem(IMPORTED); } catch {}
        const old = loadLocalRaw();
        setLocal(!flag && old && (old.orders.length || old.exp.length) ? old : null);
        off = subscribe(sb, (fn) => { if (sRef.current) put(fn(sRef.current)); });
      } catch (e) {
        if (alive) setLoadErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { alive = false; off?.(); };
  }, [userEmail, put]);

  const update: Update = useCallback((fn) => {
    const prev = sRef.current;
    if (!prev) return;
    const next = structuredClone(prev);
    fn(next);
    put(next);
    if (supabase) {
      syncDiff(supabase, prev, next).then(
        () => setSyncErr(""),
        (e) => setSyncErr(e instanceof Error ? e.message : String(e?.message ?? e)),
      );
    } else save(next);
  }, [put]);

  function changeLang(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  function dismissImport() {
    try { localStorage.setItem(IMPORTED, "1"); } catch {}
    setLocal(null);
  }

  // Add this browser's older orders and expenses to the database (records already there are kept)
  async function importLocal() {
    const cur = sRef.current;
    if (!supabase || !cur || !local) return;
    setImporting(true);
    const has = (ids: Set<number>, id: number) => ids.has(id);
    const oIds = new Set(cur.orders.map((o) => o.id)), eIds = new Set(cur.exp.map((x) => x.id));
    const empty = !cur.orders.length && !cur.exp.length;
    const next: State = {
      ...cur,
      orders: [...cur.orders, ...local.orders.filter((o) => !has(oIds, o.id))],
      exp: [...cur.exp, ...local.exp.filter((x) => !has(eIds, x.id))],
      // A fresh database only has the default menu, so take this browser's menu and prices too
      menu: empty ? local.menu : cur.menu,
    };
    try {
      await syncDiff(supabase, cur, next);
      put(next);
      dismissImport();
    } catch (e) {
      setSyncErr(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
    }
    setImporting(false);
  }

  const needLogin = !!supabase && session === null;

  return (
    <>
      <Background />
      <div className="wrap">
        <div className="top">
          <div className="brand">
            <Image className="logo" src={logo} alt="Cua nhà Ếch" priority />
            <div>
              <h1>Cua Nhà <b>Ếch</b></h1>
              <p className="sub">{t.sub}</p>
            </div>
          </div>
          <div className="topr">
            <div className="lang">
              {LANGS.map((l) => (
                <button key={l} className={l === lang ? "on" : ""} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            {supabase && session && (
              <div className="who">
                <span>{userEmail}</span>
                <button className="ghost" onClick={() => supabase!.auth.signOut()}>{t.logout}</button>
              </div>
            )}
          </div>
        </div>

        {needLogin && <Login sb={supabase!} t={t} />}
        {denied && <div className="note">{t.notMember.replace("{e}", userEmail)}</div>}
        {loadErr && (
          <div className="note">{t.loadErr}{loadErr}<button className="ghost" onClick={() => location.reload()}>{t.reload}</button></div>
        )}
        {supabase && session && !s && !denied && !loadErr && <p className="sub">{t.loading}</p>}

        {s && (
          <>
            {syncErr && (
              <div className="note bad-note">{t.syncErr}{syncErr}<button className="ghost" onClick={() => location.reload()}>{t.reload}</button></div>
            )}
            {local && (
              <div className="note">
                <span>{t.importNote.replace("{n}", String(local.orders.length)).replace("{m}", String(local.exp.length))}</span>
                <button className="ghost" disabled={importing} onClick={importLocal}>{importing ? t.importing : t.importB}</button>
                <button className="ghost" onClick={dismissImport}>{t.dismiss}</button>
              </div>
            )}
            <nav>
              {TABS.map((k, i) => (
                <button key={k} className={k === tab ? "on" : ""} onClick={() => setTab(k)}>{t.tabs[i]}</button>
              ))}
            </nav>
            <div id="view" className="in" key={tab}>
              {tab === "orders" && <Orders s={s} t={t} update={update} goMenu={() => setTab("menu")} />}
              {tab === "cal" && <CalendarView s={s} t={t} update={update} />}
              {tab === "menu" && <MenuView s={s} t={t} update={update} />}
              {tab === "money" && <MoneyView s={s} t={t} update={update} />}
              {tab === "cust" && <Customers s={s} t={t} update={update} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
