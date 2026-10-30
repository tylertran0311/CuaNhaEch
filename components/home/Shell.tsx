import { CONTACT, TEL } from "@/lib/landing";
import { Brand } from "./HomeHeader";
import FloatingActions from "./FloatingActions";

export const zaloLink = { href: CONTACT.zalo, target: "_blank", rel: "noopener noreferrer" } as const;

/** Bottom of every public page: footer, floating buttons, and on phones the call / Zalo bar */
export default function HomeFooter() {
  return (
    <>
      <footer className="hm-foot">
        <div className="hm-wrap hm-foot-in">
          <span className="hm-brand"><Brand /></span>
          <span>© {new Date().getFullYear()} Cua Nhà Ếch · Cua Năm Căn – Cà Mau</span>
        </div>
      </footer>

      <FloatingActions />

      {/* Phones: call / Zalo always at hand */}
      <div className="hm-dock">
        <a href={TEL}>Gọi ngay</a>
        <a {...zaloLink} className="hm-dock-main">Nhắn Zalo đặt cua</a>
      </div>
    </>
  );
}
