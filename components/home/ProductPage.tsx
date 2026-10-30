import Link from "next/link";
import { HOME, type Product, type menuProducts } from "@/lib/landing";
import { fd, vnd } from "@/lib/store";
import HomeHeader from "./HomeHeader";
import Head from "./Head";
import Photo from "./Photo";
import ProductCard, { perCrab } from "./ProductCard";
import OrderBox from "./OrderBox";
import HomeFooter from "./Shell";

/** Short reassurances next to the order box: the shop's real rules only */
const POINTS = [
  "Đặt trước 2 ngày để chọn được con đẹp",
  "Cọc 30%, hủy trước 2 ngày hoàn 100% cọc",
  "Giao toàn quốc, đóng thùng giữ tươi",
  "Cua ốp, chết, gạch xanh: shop đền (quay video lúc khui thùng và lúc mở cua sau khi nấu)",
];

/**
 * One product's page (/san-pham/…), opened from "Đặt món này": big photo, today's price, the note about it, an
 * order box that works out the total for the kilos wanted, then the shop's rules and the other products.
 */
export default function ProductPage({ product: p, products }: { product: Product; products: ReturnType<typeof menuProducts> }) {
  const each = perCrab(p);
  // Others of the same kind first (crab → crabs), at most four
  const more = [...products.all.filter((o) => o.kind === p.kind), ...products.all.filter((o) => o.kind !== p.kind)]
    .filter((o) => o.key !== p.key).slice(0, 4);
  return (
    <div className="hm">
      <HomeHeader base="/home" />

      <main>
        <section className="hm-pd">
          <div className="hm-wrap">
            <nav className="hm-crumbs" aria-label="Đang xem">
              <Link href="/home">Trang chủ</Link><span aria-hidden="true">/</span>
              <Link href="/home#bang-gia">Bảng giá</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{p.name}</span>
            </nav>

            <div className="hm-pd-grid">
              <div className="hm-pd-pic">
                <div className="hm-prod-shot"><Photo img={p.img} alt={p.name} art={p.kind} priority sizes="(min-width: 900px) 50vw, 100vw" /></div>
                {p.tag && <span className="hm-tag">{p.tag}</span>}
              </div>

              <div className="hm-pd-info">
                <p className="hm-kick">{p.info.sub}</p>
                <h1>{p.name}</h1>
                <p className="hm-pd-size">{p.size} · bán theo kg</p>
                {p.price != null
                  ? <p className="hm-pd-price">{vnd(p.price)}<small>/kg</small>{each && <span>{each}</span>}</p>
                  : <p className="hm-pd-price hm-price-ask">Nhắn shop để có giá hôm nay</p>}
                {p.price != null && products.upd && <p className="hm-pd-upd">Giá ngày {fd(products.upd)} · thay đổi theo ngày</p>}

                <p className="hm-pd-text">{p.info.text}</p>
                <div className="hm-pd-cook">
                  <span>Hợp món</span>
                  <ul>{p.info.cook.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>

                <OrderBox name={p.name} size={p.size} price={p.price} />

                <ul className="hm-pd-points">{POINTS.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        {/* The rules as big numbers, same as on the home page */}
        <section className="hm-sec hm-sec-alt">
          <div className="hm-wrap">
            <Head kicker="Đặt yên tâm" title="Mua cua online, không lo" />
            <div className="hm-policies hm-policies-flush">
              {HOME.policies.map((r) => (
                <div key={r.title} className="hm-policy">
                  <b>{r.big}</b>
                  <div><h3>{r.title}</h3><p>{r.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {more.length > 0 && (
          <section className="hm-sec">
            <div className="hm-wrap">
              <Head kicker="Xem thêm" title="Món khác của shop" />
              <div className="hm-grid">{more.map((o) => <ProductCard key={o.key} p={o} />)}</div>
            </div>
          </section>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
