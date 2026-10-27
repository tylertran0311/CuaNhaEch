"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Background from "./Background";
import Orders from "./Orders";
import MenuView from "./MenuView";
import CalendarView from "./CalendarView";
import MoneyView from "./MoneyView";
import Customers from "./Customers";
import type { Update } from "./ui";
import { LANGS, T, type Lang } from "@/lib/i18n";
import { load, loadLang, save, saveLang, type State } from "@/lib/store";

export type Tab = "orders" | "cal" | "menu" | "money" | "cust";
const TABS: Tab[] = ["orders", "cal", "menu", "money", "cust"];

export default function Dashboard() {
  const [s, setS] = useState<State | null>(null);
  const [lang, setLang] = useState<Lang>("vi");
  const [tab, setTab] = useState<Tab>("orders");
  const t = T[lang];

  // Data lives in localStorage, so load it only on the client
  useEffect(() => {
    setS(load());
    setLang(loadLang());
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const update: Update = useCallback((fn) => {
    setS((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      save(next);
      return next;
    });
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  return (
    <>
      <Background />
      <div className="wrap">
        <div className="top">
          <div className="brand">
            <Image className="logo" src="/logo.png" alt="Cua nhà Ếch" width={185} height={120} priority />
            <div>
              <h1>Cua Nhà <b>Ếch</b></h1>
              <p className="sub">{t.sub}</p>
            </div>
          </div>
          <div className="lang">
            {LANGS.map((l) => (
              <button key={l} className={l === lang ? "on" : ""} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <nav>
          {TABS.map((k, i) => (
            <button key={k} className={k === tab ? "on" : ""} onClick={() => setTab(k)}>{t.tabs[i]}</button>
          ))}
        </nav>
        {s && (
          <div id="view" className="in" key={tab}>
            {tab === "orders" && <Orders s={s} t={t} update={update} goMenu={() => setTab("menu")} />}
            {tab === "cal" && <CalendarView s={s} t={t} update={update} />}
            {tab === "menu" &&<MenuView s={s} t={t} update={update} />}
            {tab === "money" && <MoneyView s={s} t={t} update={update} />}
            {tab === "cust" && <Customers s={s} t={t} update={update} />}
          </div>
        )}
      </div>
    </>
  );
}
