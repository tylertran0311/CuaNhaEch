"use client";

import Image from "next/image";
import logo from "@/public/logo.png";
import { Button, Segmented } from "@/components/ui";
import { LANGS, type Dict, type Lang } from "@/lib/i18n";

/** Logo and title, the language switch and (when signed in) the account with a sign-out button */
export default function Header({ t, lang, onLang, email, onLogout }: {
  t: Dict; lang: Lang; onLang: (l: Lang) => void; email?: string; onLogout?: () => void;
}) {
  return (
    <div className="top">
      <div className="brand">
        <Image className="logo" src={logo} alt="Cua nhà Ếch" priority />
        <div>
          <h1>Cua Nhà <b>Ếch</b></h1>
          <p className="sub">{t.sub}</p>
        </div>
      </div>
      <div className="topr">
        <Segmented options={LANGS} value={lang} onChange={onLang} label={(l) => l.toUpperCase()} />
        {email && (
          <div className="who">
            <span>{email}</span>
            <Button onClick={onLogout}>{t.logout}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
