"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/public/logo.png";
import { supabase } from "@/lib/supabase";

const NAV = [["#san-pham", "Bảng giá"], ["#chon-cua", "Chọn cua"], ["#thu-vien", "Thư viện"], ["#dat-hang", "Cách đặt"], ["#lien-he", "Liên hệ"]] as const;

/** The shop's logo (the same crab as on the dashboard) */
export function Mark() {
  return <Image className="lp-mark" src={logo} alt="" priority sizes="80px" />;
}

/**
 * Sticky header. The shop's own way in: a "Quản lý" link appears only in a browser already signed in to the
 * dashboard, and tapping the logo 5 times in a row opens /admin (where the sign-in is). Customers see neither.
 */
export default function LandingHeader() {
  const router = useRouter();
  const [staff, setStaff] = useState(false);
  const [menu, setMenu] = useState(false);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    // Reads the session saved in this browser; no network call, nothing shown when signed out
    supabase?.auth.getSession().then(({ data }) => setStaff(!!data.session));
  }, []);

  function tapLogo() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) { taps.current = []; router.push("/admin"); }
  }

  return (
    <header className="lp-head">
      <div className="lp-head-in">
        <a href="#top" className="lp-brand" onClick={tapLogo} aria-label="Cua Nhà Ếch">
          <Mark /><span>Cua Nhà Ếch</span>
        </a>
        <nav className={`lp-nav${menu ? " open" : ""}`} aria-label="Mục lục">
          {NAV.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}
          {staff && <a className="lp-staff" href="/admin">Quản lý ↗</a>}
        </nav>
        <a className="lp-btn lp-btn-sm" href="#lien-he">Đặt hàng</a>
        <button type="button" className="lp-burger" aria-label="Mở mục lục" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <i /><i /><i />
        </button>
      </div>
    </header>
  );
}
