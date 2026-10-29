import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { getPublicMenu } from "@/lib/publicMenu";

export const metadata: Metadata = {
  title: "Cua Nhà Ếch – Cua Cà Mau chính gốc",
  description: "Cua, tôm tuyển chọn từ Cà Mau, giao tận nhà. Hấp sẵn hoặc giao sống, đặt qua Facebook, Zalo, TikTok.",
};

// Prices come from the dashboard's menu: cached, refreshed when the menu changes (and every few minutes)
export default async function HomePage() {
  return <LandingPage menu={await getPublicMenu()} />;
}
