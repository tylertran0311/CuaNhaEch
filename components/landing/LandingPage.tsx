import { CONTACT, FEATURES, GALLERY, HERO, NOTES, PRODUCTS, STEPS, type Product } from "@/lib/landing";
import LandingHeader, { Mark } from "./LandingHeader";
import Gallery from "./Gallery";
import Pic from "./Pic";

/** Section title: number block + kicker + big heading */
function Head({ n, kicker, title, light }: { n: string; kicker: string; title: string; light?: boolean }) {
  return (
    <div className={`lp-h${light ? " light" : ""}`}>
      <span className="lp-h-n">{n}</span>
      <div>
        <p className="lp-kick">{kicker}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function ProductCard({ p, i }: { p: Product; i: number }) {
  return (
    <article className={`lp-prod tone-${p.pic.tone}`}>
      <div className="lp-prod-pic"><Pic pic={p.pic} seed={i + 1} sizes="(min-width: 900px) 25vw, 50vw" /></div>
      <div className="lp-prod-body">
        {p.tag && <span className="lp-tag">{p.tag}</span>}
        <h3>{p.name}</h3>
        <p>{p.size}</p>
      </div>
    </article>
  );
}

/** Public landing page: hero, features, products, gallery, how to order, contact */
export default function LandingPage() {
  const crabs = PRODUCTS.filter((p) => p.kind === "crab"), shrimps = PRODUCTS.filter((p) => p.kind === "shrimp");
  return (
    <div className="lp" id="top">
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-hero-txt">
              <p className="lp-kick">{HERO.kicker}</p>
              <h1>
                <span>{HERO.title[0]}</span>
                <span className="lp-hl">{HERO.title[1]}</span>
                <span>{HERO.title[2]}</span>
              </h1>
              <p className="lp-lead">{HERO.text}</p>
              <div className="lp-ctas">
                <a className="lp-btn" href="#lien-he">Đặt hàng ngay</a>
                <a className="lp-btn lp-btn-ghost" href="#san-pham">Xem sản phẩm</a>
              </div>
            </div>
            <div className="lp-hero-art" aria-hidden="false">
              <span className="lp-sh lp-sh-sq" />
              <span className="lp-sh lp-sh-qc" />
              <span className="lp-sh lp-sh-bars"><i /><i /><i /></span>
              <div className="lp-hero-pic"><Pic pic={HERO.pic} seed={0} sizes="(min-width: 900px) 40vw, 80vw" priority /></div>
              <span className="lp-sh lp-sh-tri" />
              <span className="lp-badge">Tươi<br />mỗi ngày</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-feats" aria-label="Điểm nổi bật">
          {FEATURES.map((f) => (
            <div key={f.title} className={`lp-feat tone-${f.tone}`}>
              <span className={`lp-shape ${f.shape}`} aria-hidden="true" />
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </section>

        {/* Products */}
        <section className="lp-sec" id="san-pham">
          <div className="lp-wrap">
            <Head n="01" kicker="Sản phẩm" title="Cua & tôm tuyển chọn" />
            <h3 className="lp-group"><span className="lp-shape circle" aria-hidden="true" />Cua Cà Mau</h3>
            <div className="lp-grid">{crabs.map((p, i) => <ProductCard key={p.name} p={p} i={i} />)}</div>
            <h3 className="lp-group"><span className="lp-shape triangle" aria-hidden="true" />Tôm</h3>
            <div className="lp-grid">{shrimps.map((p, i) => <ProductCard key={p.name} p={p} i={i + crabs.length} />)}</div>
            <p className="lp-note">Giá thay đổi theo ngày — nhắn shop để nhận giá hôm nay.</p>
          </div>
        </section>

        {/* Gallery */}
        <section className="lp-sec lp-sec-dark" id="thu-vien">
          <div className="lp-wrap">
            <Head n="02" kicker="Thư viện" title="Từ Cà Mau đến bàn ăn" light />
          </div>
          <Gallery slides={GALLERY} />
        </section>

        {/* How to order */}
        <section className="lp-sec" id="dat-hang">
          <div className="lp-wrap">
            <Head n="03" kicker="Cách đặt" title="Ba bước là có cua" />
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`tone-${(["red", "blue", "yellow"] as const)[i]}`}>
                  <span className="lp-step-n">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <ul className="lp-notes">{NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </section>

        {/* Contact */}
        <section className="lp-contact" id="lien-he">
          <div className="lp-wrap lp-contact-in">
            <div>
              <p className="lp-kick">Liên hệ</p>
              <h2>Nhắn shop để đặt cua hôm nay</h2>
              <p className="lp-lead">{CONTACT.area}. Đặt trước 2 ngày để chọn được cua đẹp nhất.</p>
            </div>
            <div className="lp-channels">
              <a className="lp-ch fb" href={CONTACT.facebook} target="_blank" rel="noopener noreferrer"><span>Facebook</span><b>→</b></a>
              <a className="lp-ch zl" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer"><span>Zalo</span><b>→</b></a>
              <a className="lp-ch tt" href={CONTACT.tiktok} target="_blank" rel="noopener noreferrer"><span>TikTok</span><b>→</b></a>
              <a className="lp-ch ph" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}><span>{CONTACT.phone}</span><b>☎</b></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <span className="lp-brand"><Mark /><span>Cua Nhà Ếch</span></span>
          <span>© {new Date().getFullYear()} Cua Nhà Ếch · Cua Cà Mau chính gốc</span>
        </div>
      </footer>
    </div>
  );
}
