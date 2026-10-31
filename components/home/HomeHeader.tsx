"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import { useStaffEntry } from "@/components/landing/useStaffEntry";
import CartButton from "./CartButton";

const NAV = [["#bang-gia", "Bảng giá"], ["#danh-gia", "Feedback"], ["#dat-hang", "Cách đặt"], ["#hoi-dap", "Hỏi đáp"], ["#chon-cua", "Chọn cua"], ["#lien-he", "Liên hệ"]] as const;

/** The shop's logo next to its name in serif */
export function Brand() {
  return (
    <>
      <Image className="hm-logo" src={logo} alt="" priority sizes="72px" />
      <span className="hm-word">Cua Nhà Ếch</span>
    </>
  );
}

/**
 * Light sticky header. Hidden way into the dashboard (useStaffEntry): a "Quản lý" link only in a browser signed in
 * to it, and 5 taps on the logo open /admin. On other pages (`base="/home"`) the links lead back to the home page's sections.
 */
export default function HomeHeader({ base = "" }: { base?: string }) {
  const { staff, tapLogo } = useStaffEntry();
  const [menu, setMenu] = useState(false);
  return (
    <header className="hm-head">
      <div className="hm-head-in">
        <a href={base || "#top"} className="hm-brand" onClick={tapLogo} aria-label="Cua Nhà Ếch"><Brand /></a>
        <nav className={`hm-nav${menu ? " open" : ""}`} aria-label="Mục lục">
          {NAV.map(([href, label]) => <a key={href} href={base + href} onClick={() => setMenu(false)}>{label}</a>)}
          {staff && <a className="hm-staff" href="/admin">Quản lý ↗</a>}
        </nav>
        <CartButton />
        <a className="hm-btn hm-btn-sm" href={base + "#lien-he"}>Đặt hàng</a>
        <button type="button" className="hm-burger" aria-label="Mở mục lục" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <i /><i />
        </button>
      </div>
    </header>
  );
}
