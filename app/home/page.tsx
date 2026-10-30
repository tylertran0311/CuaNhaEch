import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { getPublicMenu } from "@/lib/publicMenu";

export const metadata: Metadata = {
  title: "Cua Nhà Ếch – Cua Năm Căn, Cà Mau",
  description: "Cua Năm Căn – Cà Mau tươi, chắc thịt. Bảng giá hôm nay, hấp sẵn hoặc giao sống, giao hàng toàn quốc.",
};

// Prices come from the dashboard's menu: cached, refreshed when the menu changes (and every few minutes)
export default async function Page() {
  return <HomePage menu={await getPublicMenu()} />;
}
