import { CONTACT, FEATURES, GALLERY, GUIDE, HERO, NOTES, PRODUCT_EXTRAS, STEPS, TICKER, type Tone } from "@/lib/landing";
import type { PublicMenu } from "@/lib/publicMenu";
import { defMenu, fd, vnd, type Kind, type MenuItem } from "@/lib/store";
import LandingHeader, { Mark } from "./LandingHeader";
import Gallery from "./Gallery";
import Pic from "./Pic";
import { CrabIcon, ShrimpIcon } from "./Icons";
import { ApronIcon, BadgeRing, DeliveryIcon, HeroCrab, PondIcon, SizeDots, SteamIcon } from "./Art";

const TONES: Tone[] = ["red", "blue", "yellow", "black"];
const KIND_WORD: Record<Kind, string> = { crab: "Cua", shrimp: "Tôm" };
const FEATURE_ICON = { pond: PondIcon, delivery: DeliveryIcon, steam: SteamIcon };
const tel = `tel:${CONTACT.phone.replace(/\s/g, "")}`;

interface Product { key: string; name: string; size: string; price?: number; tag?: string; img?: string; tone: Tone }
/** A menu item as a product card: "Gạch" → "Cua Gạch", with the extras set in lib/landing.ts */
function toProduct(i: MenuItem, n: number, withPrice: boolean): Product {
  const word = KIND_WORD[i.k], extra = PRODUCT_EXTRAS[i.name] || {};
  const name = i.name.toLowerCase().startsWith(word.toLowerCase()) ? i.name : `${word} ${i.name}`;
  return { key: i.id, name, size: i.sz, price: withPrice ? i.price : undefined, tag: extra.tag, img: extra.img, tone: TONES[n % TONES.length] };
}

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

/**
 * A row of half circles (the sea) joining two sections: `tone` is the color of the waves and of the section they
 * open into, `on` the color behind them; `flip` hangs them down from the section above.
 */
function Waves({ tone = "blue", on = "paper", flip }: { tone?: Tone; on?: "paper" | "black"; flip?: boolean }) {
  return <div className={`lp-waves tone-${tone} on-${on}${flip ? " flip" : ""}`} aria-hidden="true" />;
}

function ProductCard({ p, i }: { p: Product; i: number }) {
  return (
    <article className={`lp-prod tone-${p.tone}`}>
      <div className="lp-prod-pic"><Pic pic={{ img: p.img, alt: p.name, tone: p.tone }} seed={i + 1} sizes="(min-width: 900px) 25vw, 50vw" /></div>
      <div className="lp-prod-body">
        {p.tag && <span className="lp-tag">{p.tag}</span>}
        <h3>{p.name}</h3>
        <p className="lp-size"><SizeDots size={p.size} />{p.size}</p>
        <div className="lp-prod-foot">
          {p.price != null ? <p className="lp-price"><b>{vnd(p.price)}</b>/kg</p> : <p className="lp-price lp-price-ask">Nhắn để hỏi giá</p>}
          <a className="lp-buy" href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" aria-label={`Đặt ${p.name} qua Zalo`}>Đặt →</a>
        </div>
      </div>
    </article>
  );
}

/**
 * Public landing page: ticker, hero poster, highlights, products (live prices from the dashboard's menu),
 * crab guide, gallery, how to order, contact, poster footer, and a call/Zalo bar on phones.
 */
export default function LandingPage({ menu }: { menu: PublicMenu | null }) {
  const items = menu?.items ?? defMenu().items, live = !!menu;
  const all = items.map((it, n) => ({ it, p: toProduct(it, n, live) }));
  const crabs = all.filter((x) => x.it.k === "crab").map((x) => x.p), shrimps = all.filter((x) => x.it.k === "shrimp").map((x) => x.p);
  const tick = [...TICKER, ...TICKER];
  return (
    <div className="lp" id="top">
      {/* Running strip, like a fish market sign */}
      <div className="lp-ticker" aria-hidden="true">
        <div className="lp-ticker-in">
          {[0, 1].map((k) => (
            <span key={k}>{tick.map((t, i) => <span key={i} className="lp-tk"><CrabIcon className="lp-tk-ic" />{t}</span>)}</span>
          ))}
        </div>
      </div>
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-hero-txt">
              <p className="lp-kick"><span className="lp-dot-live" />{HERO.kicker}</p>
              <h1>
                <span>{HERO.title[0]}</span>
                <span className="lp-hl">{HERO.title[1]}</span>
                <span>{HERO.title[2]}</span>
              </h1>
              <p className="lp-lead">{HERO.text}</p>
              <div className="lp-ctas">
                <a className="lp-btn" href="#lien-he">Đặt hàng ngay</a>
                <a className="lp-btn lp-btn-ghost" href="#san-pham">Xem bảng giá</a>
              </div>
              <ul className="lp-proof">
                <li><b>100%</b>Năm Căn – Cà Mau</li>
                <li><b>30%</b>cọc giữ hàng</li>
                <li><b>0đ</b>hấp khi chốt live</li>
              </ul>
            </div>
            <div className="lp-hero-art">
              <span className="lp-sh lp-sh-sq" />
              <span className="lp-sh lp-sh-qc" />
              <span className="lp-sh lp-sh-bars"><i /><i /><i /></span>
              {HERO.pic.img
                ? <div className="lp-hero-pic"><Pic pic={HERO.pic} seed={0} sizes="(min-width: 900px) 40vw, 80vw" priority /></div>
                : <div className="lp-hero-poster"><HeroCrab /></div>}
              <span className="lp-sh lp-sh-tri" />
              <BadgeRing text="CUA CÀ MAU ✦ TƯƠI MỖI NGÀY ✦ " center="Ếch" />
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="lp-feats" aria-label="Điểm nổi bật">
          {FEATURES.map((f) => {
            const Icon = FEATURE_ICON[f.icon];
            return (
              <div key={f.title} className={`lp-feat tone-${f.tone}`}>
                <Icon />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </section>

        {/* Products */}
        <section className="lp-sec" id="san-pham">
          <div className="lp-wrap">
            <Head n="01" kicker={live ? "Bảng giá hôm nay" : "Sản phẩm"} title="Cua & tôm tuyển chọn" />
            {crabs.length > 0 && <>
              <h3 className="lp-group"><CrabIcon />Cua Cà Mau<small>bán theo kg</small></h3>
              <div className="lp-grid">{crabs.map((p, i) => <ProductCard key={p.key} p={p} i={i} />)}</div>
            </>}
            {shrimps.length > 0 && <>
              <h3 className="lp-group"><ShrimpIcon />Tôm<small>bán theo kg</small></h3>
              <div className="lp-grid">{shrimps.map((p, i) => <ProductCard key={p.key} p={p} i={i + crabs.length} />)}</div>
            </>}
            <p className="lp-note">
              <span className="lp-legend"><SizeDots size="3" /> ít chấm = con to</span>
              {live && menu.upd ? `Giá ngày ${fd(menu.upd)} · ` : ""}Giá thay đổi theo ngày — nhắn shop để chốt giá hôm nay.
            </p>
          </div>
        </section>

        <Waves tone="yellow" />
        {/* Crab guide */}
        <section className="lp-sec lp-sec-yellow" id="chon-cua">
          <div className="lp-wrap">
            <Head n="02" kicker="Bí kíp" title={GUIDE.title} />
            <div className="lp-guide">
              {GUIDE.kinds.map((g) => (
                <article key={g.kind} className={`lp-guide-card tone-${g.tone}`}>
                  <div className="lp-guide-art"><ApronIcon kind={g.kind} /></div>
                  <div>
                    <p className="lp-kick">{g.sub}</p>
                    <h3>{g.name}</h3>
                    <p>{g.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <ul className="lp-tips">
              {GUIDE.tips.map((t, i) => <li key={t}><span>{String(i + 1).padStart(2, "0")}</span>{t}</li>)}
            </ul>
          </div>
        </section>
        <Waves tone="yellow" on="black" flip />

        {/* Gallery */}
        <section className="lp-sec lp-sec-dark" id="thu-vien">
          <div className="lp-wrap">
            <Head n="03" kicker="Thư viện" title="Từ Cà Mau đến bàn ăn" light />
          </div>
          <Gallery slides={GALLERY} />
        </section>

        {/* How to order */}
        <section className="lp-sec" id="dat-hang">
          <div className="lp-wrap">
            <Head n="04" kicker="Cách đặt" title="Ba bước là có cua" />
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

        <Waves tone="blue" />
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
              <a className="lp-ch ph" href={tel}><span>{CONTACT.phone}</span><b>☎</b></a>
            </div>
          </div>
        </section>
      </main>

      {/* Slim footer: the contact section above already has every channel */}
      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <span className="lp-brand"><Mark /><span>Cua Nhà Ếch</span></span>
          <span>© {new Date().getFullYear()} Cua Nhà Ếch · Cua Cà Mau chính gốc</span>
        </div>
      </footer>

      {/* Phones: call / Zalo always at hand */}
      <div className="lp-dock">
        <a href={tel} className="lp-dock-call">☎ Gọi ngay</a>
        <a href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" className="lp-dock-zalo">Nhắn Zalo →</a>
      </div>
    </div>
  );
}
