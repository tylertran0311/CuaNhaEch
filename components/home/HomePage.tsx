import { Fragment } from "react";
import { CONTACT, GALLERY, GUIDE, HOME, REVIEWS, STEPS, TEL as tel, menuProducts } from "@/lib/landing";
import type { PublicMenu } from "@/lib/publicMenu";
import { fd } from "@/lib/store";
import { mapUrl } from "@/lib/text";
import HomeHeader from "./HomeHeader";
import HeroSlider from "./HeroSlider";
import Head from "./Head";
import Reviews from "./Reviews";
import ProductCard from "./ProductCard";
import HomeFooter, { zaloLink as zalo } from "./Shell";
import { LineApron, LineBox, LineCrab, LinePond, LineShrimp, LineSteam } from "./LineArt";

const PROMISE_ICON = { pond: LinePond, box: LineBox, steam: LineSteam };

/**
 * Public home page, minimal and refined, laid out along the buyer's path: see the crabs (photos) → see the price
 * → see what other buyers say → know how to order → feel safe (rules, FAQ) → learn to choose → contact. Prices come live from the dashboard's menu.
 * The Bauhaus version is at /bauhaus.
 */
export default function HomePage({ menu }: { menu: PublicMenu | null }) {
  const { live, upd, crabs, shrimps } = menuProducts(menu);
  const prices = crabs.map((p) => p.price).filter((n): n is number => n != null);
  const from = live && prices.length ? { price: Math.min(...prices), upd } : undefined;
  return (
    <div className="hm" id="top">
      <p className="hm-strip">{HOME.strip.map((s, i) => <span key={s}>{i > 0 && <i aria-hidden="true">·</i>}{s}</span>)}</p>
      <HomeHeader />

      <main>
        <HeroSlider slides={GALLERY} from={from} />

        {/* Promises */}
        <section className="hm-promise" aria-label="Cam kết của shop">
          <div className="hm-wrap hm-promise-in">
            {HOME.promises.map((p) => {
              const Icon = PROMISE_ICON[p.icon];
              return (
                <div key={p.title} className="hm-pr">
                  <Icon className="hm-pr-ic" />
                  <div><h3>{p.title}</h3><p>{p.text}</p></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Products and prices */}
        <section className="hm-sec" id="bang-gia">
          <div className="hm-wrap">
            <Head kicker={live ? "Bảng giá hôm nay" : "Sản phẩm"} title="Cua & tôm tuyển chọn"
              note={live && upd ? `Cập nhật ngày ${fd(upd)} · giá thay đổi theo ngày` : "Giá thay đổi theo ngày — nhắn shop để có giá hôm nay"} />
            {crabs.length > 0 && <>
              <h3 className="hm-group"><LineCrab className="hm-group-ic" />Cua Năm Căn<small>bán theo kg</small></h3>
              <div className="hm-grid">{crabs.map((p) => <ProductCard key={p.key} p={p} />)}</div>
            </>}
            {shrimps.length > 0 && <>
              <h3 className="hm-group"><LineShrimp className="hm-group-ic" />Tôm<small>bán theo kg</small></h3>
              <div className="hm-grid">{shrimps.map((p) => <ProductCard key={p.key} p={p} />)}</div>
            </>}
            <div className="hm-help">
              <p>Chưa biết chọn loại nào, bao nhiêu ký? <b>Nhắn shop tư vấn theo số người ăn.</b></p>
              <a className="hm-btn" {...zalo}>Nhắn Zalo tư vấn</a>
            </div>
          </div>
        </section>

        <Reviews reviews={REVIEWS} />

        {/* How to order + peace of mind */}
        <section className="hm-sec" id="dat-hang">
          <div className="hm-wrap">
            <Head kicker="Cách đặt" title="Ba bước là có cua" />
            <ol className="hm-steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="hm-step-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="hm-policies" aria-label="Đặt hàng yên tâm">
              {HOME.policies.map((p) => (
                <div key={p.title} className="hm-policy">
                  <b>{p.big}</b>
                  <div><h3>{p.title}</h3><p>{p.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ: the questions that stop people ordering, answered before they ask */}
        <section className="hm-sec hm-sec-alt" id="hoi-dap">
          <div className="hm-wrap hm-faq-in">
            <Head kicker="Hỏi đáp" title="Trước khi đặt cua" />
            <div className="hm-faq">
              {HOME.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Crab guide */}
        <section className="hm-sec" id="chon-cua">
          <div className="hm-wrap">
            <Head kicker="Bí kíp" title={GUIDE.title} />
            <div className="hm-guide">
              {GUIDE.kinds.map((g) => (
                <article key={g.kind} className="hm-guide-card">
                  <LineApron kind={g.kind} className="hm-apron" />
                  <div>
                    <p className="hm-kick">{g.sub}</p>
                    <h3>{g.name}</h3>
                    <p>{g.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <ol className="hm-tips">{GUIDE.tips.map((t) => <li key={t}>{t}</li>)}</ol>
          </div>
        </section>

        {/* Contact: title on the left, the details as a short list on the right */}
        <section className="hm-contact" id="lien-he">
          <div className="hm-wrap hm-contact-in">
            <div className="hm-contact-head">
              <p className="hm-kick">Liên hệ</p>
              <h2>Đặt cua Năm Căn hôm nay</h2>
              <p className="hm-contact-sub">{CONTACT.area}. Đặt trước 2 ngày để chọn được con đẹp nhất.</p>
            </div>
            <dl className="hm-info">
              <div>
                <dt>Điện thoại</dt>
                <dd><a className="hm-phone" href={tel}>{CONTACT.phone}</a></dd>
              </div>
              <div>
                <dt>Địa chỉ</dt>
                <dd>
                  {/* Each part (street, ward, district, city) stays on one line; lines break only between parts */}
                  <span className="hm-addr">
                    {CONTACT.address.split(", ").map((part, i, all) => (
                      <Fragment key={part}><span>{part}{i < all.length - 1 ? "," : ""}</span>{i < all.length - 1 ? " " : ""}</Fragment>
                    ))}
                  </span>
                  <a className="hm-link" href={mapUrl(undefined, CONTACT.address)} target="_blank" rel="noopener noreferrer">
                    Xem bản đồ <span aria-hidden="true">→</span>
                  </a>
                </dd>
              </div>
              <div>
                <dt>Nhắn tin</dt>
                <dd className="hm-channels">
                  <a className="hm-btn hm-btn-sm" {...zalo}>Zalo</a>
                  <a className="hm-btn hm-btn-sm hm-btn-outline" href={CONTACT.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                  <a className="hm-btn hm-btn-sm hm-btn-outline" href={CONTACT.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
                </dd>
              </div>
              <div>
                <dt>Xem cua thật</dt>
                <dd>
                  <span>Xem video cua của shop trên TikTok trước khi đặt.</span>
                  <a className="hm-link" href={CONTACT.tiktok} target="_blank" rel="noopener noreferrer">Mở TikTok <span aria-hidden="true">→</span></a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
