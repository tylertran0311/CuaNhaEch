"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Ticker from "./layout/Ticker";
import Loader from "./layout/Loader";
import Header from "./layout/Header";
import TabBar from "./layout/TabBar";
import { Button, Note } from "./ui";
import OrdersView, { type DayFilter } from "./views/OrdersView";
import MenuView from "./views/MenuView";
import CalendarView from "./views/CalendarView";
import MoneyView from "./views/MoneyView";
import CustomersView from "./views/CustomersView";
import Login from "./views/Login";
import type { Update } from "./views/types";
import { T, type Lang } from "@/lib/i18n";
import { day, load, loadLang, loadLocalRaw, save, saveLang, trashExpired, type State } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { errMsg, isMember, loadCloud, subscribe, syncDiff } from "@/lib/cloud";
import { readLS, writeLS } from "@/lib/storage";

type Tab = "orders" | "cal" | "menu" | "money" | "cust";
const TABS: Tab[] = ["orders", "cal", "menu", "money", "cust"];
const IMPORTED = "cne-imported";

export default function Dashboard() {
  const [s, setS] = useState<State | null>(null);
  const sRef = useRef<State | null>(null);
  const [lang, setLang] = useState<Lang>("vi");
  const [tab, setTab] = useState<Tab>("orders");
  // Delivery day shown on the Orders board; the calendar can jump to a day
  const [focus, setFocus] = useState<DayFilter>(() => day(0));
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
        const old = loadLocalRaw();
        setLocal(!readLS(IMPORTED) && old && (old.orders.length || old.exp.length) ? old : null);
        off = subscribe(sb, (fn) => { if (sRef.current) put(fn(sRef.current)); });
      } catch (e) {
        if (alive) setLoadErr(errMsg(e));
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
      const sb = supabase;
      // Menu or prices changed: once saved, tell the public page (/home) to show them on its next visit
      const menuChanged = JSON.stringify(prev.menu) !== JSON.stringify(next.menu);
      syncDiff(sb, prev, next).then(
        () => {
          setSyncErr("");
          if (menuChanged) sb.auth.getSession().then(({ data }) => {
            const tok = data.session?.access_token;
            if (tok) fetch("/api/menu-changed", { method: "POST", headers: { authorization: "Bearer " + tok } }).catch(() => {});
          });
        },
        (e) => setSyncErr(errMsg(e)),
      );
    } else save(next);
  }, [put]);

  function changeLang(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  function dismissImport() {
    writeLS(IMPORTED, "1");
    setLocal(null);
  }

  // Add this browser's older orders and expenses to the database (records already there are kept)
  async function importLocal() {
    const cur = sRef.current;
    if (!supabase || !cur || !local) return;
    setImporting(true);
    const oIds = new Set(cur.orders.map((o) => o.id)), eIds = new Set(cur.exp.map((x) => x.id));
    const empty = !cur.orders.length && !cur.exp.length;
    const next: State = {
      ...cur,
      orders: [...cur.orders, ...local.orders.filter((o) => !oIds.has(o.id))],
      exp: [...cur.exp, ...local.exp.filter((x) => !eIds.has(x.id))],
      // A fresh database only has the default menu, so take this browser's menu and prices too
      menu: empty ? local.menu : cur.menu,
    };
    try {
      await syncDiff(supabase, cur, next);
      put(next);
      dismissImport();
    } catch (e) {
      setSyncErr(errMsg(e));
    }
    setImporting(false);
  }

  // Orders in the trash are hidden from every tab; the Orders tab lists them separately
  const view = useMemo(() => s && { ...s, orders: s.orders.filter((o) => !o.delAt) }, [s]);
  const trash = useMemo(() => (s ? s.orders.filter((o) => o.delAt).sort((a, b) => b.delAt! - a.delAt!) : []), [s]);
  // Once the data is loaded, orders past their time in the trash are removed for good
  const purged = useRef(false);
  useEffect(() => {
    if (!s || purged.current) return;
    purged.current = true;
    if (s.orders.some((o) => trashExpired(o))) update((d) => { d.orders = d.orders.filter((o) => !trashExpired(o)); });
  }, [s, update]);

  const needLogin = !!supabase && session === null;

  return (
    <>
      <Ticker />
      <Loader text={t.loading} done={!!s || needLogin || denied || !!loadErr} />
      <div className="wrap">
        <Header t={t} lang={lang} onLang={changeLang} email={supabase && session ? userEmail : undefined}
          onLogout={() => supabase?.auth.signOut()} />

        {needLogin && <Login sb={supabase!} t={t} />}
        {denied && <Note>{t.notMember.replace("{e}", userEmail)}</Note>}
        {loadErr && <Note>{t.loadErr}{loadErr}<Button onClick={() => location.reload()}>{t.reload}</Button></Note>}

        {s && view && (
          <>
            {syncErr && <Note bad>{t.syncErr}{syncErr}<Button onClick={() => location.reload()}>{t.reload}</Button></Note>}
            {local && (
              <Note>
                <span>{t.importNote.replace("{n}", String(local.orders.length)).replace("{m}", String(local.exp.length))}</span>
                <Button disabled={importing} onClick={importLocal}>{importing ? t.importing : t.importB}</Button>
                <Button onClick={dismissImport}>{t.dismiss}</Button>
              </Note>
            )}
            <TabBar tabs={TABS} labels={t.tabs} value={tab} onChange={setTab} />
            <div id="view" className="in" key={tab}>
              {tab === "orders" && <OrdersView s={view} trash={trash} t={t} update={update} goMenu={() => setTab("menu")} focus={focus} setFocus={setFocus} />}
              {tab === "cal" && <CalendarView s={view} t={t} update={update} openDay={(d) => { setFocus(d); setTab("orders"); }} />}
              {tab === "menu" && <MenuView s={view} t={t} update={update} />}
              {tab === "money" && <MoneyView s={view} t={t} update={update} />}
              {tab === "cust" && <CustomersView s={view} t={t} update={update} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
