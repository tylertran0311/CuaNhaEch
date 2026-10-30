"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import { useStaffEntry } from "./useStaffEntry";

const NAV = [["#san-pham", "Bảng giá"], ["#chon-cua", "Chọn cua"], ["#thu-vien", "Thư viện"], ["#dat-hang", "Cách đặt"], ["#lien-he", "Liên hệ"]] as const;

/** The shop's logo (the same crab as on the dashboard) */
export function Mark() {
  return <Image className="lp-mark" src={logo} alt="" priority sizes="80px" />;
}

/**
 * Sticky header of the Bauhaus page; the hidden way into the dashboard comes from useStaffEntry.
 */
export default function LandingHeader() {
  const { staff, tapLogo } = useStaffEntry();
  const [menu, setMenu] = useState(false);

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
