import Image from "next/image";
import { CONTACT, type Review } from "@/lib/landing";
import Head from "./Head";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function ReviewCard({ r }: { r: Review }) {
  const who = [r.name, r.place].filter(Boolean).join(" · ");
  return (
    <figure className="hm-rv">
      {r.img && (
        // The screenshot opens full size, so buyers can read the whole chat
        <a className="hm-rv-shot" href={r.img} {...ext} aria-label={`Xem ảnh feedback của ${r.name}`}>
          <Image src={r.img} alt={`Tin nhắn của ${r.name}`} fill sizes="(min-width: 900px) 30vw, 78vw" />
        </a>
      )}
      <figcaption>
        {r.text && <blockquote>{r.text}</blockquote>}
        <p className="hm-rv-who">{who}{r.item && <span>{r.item}</span>}</p>
      </figcaption>
    </figure>
  );
}

/**
 * What customers say, right after the prices (where buyers hesitate). Shows only the real feedback in REVIEWS;
 * swipeable on phones, a grid on desktop. With none yet, it points to the shop's channels where buyers can see for themselves.
 */
export default function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="hm-sec hm-sec-alt" id="danh-gia">
      <div className="hm-wrap">
        <Head kicker="Khách nói gì" title="Feedback từ khách đã ăn"
          note={reviews.length ? "Tin nhắn thật của khách sau khi nhận cua" : undefined} />
        {reviews.length > 0
          ? <div className="hm-rvs">{reviews.map((r, i) => <ReviewCard key={i} r={r} />)}</div>
          : (
            <div className="hm-help">
              <p>Xem video cua của shop và <b>bình luận của khách</b> trên TikTok, Facebook.</p>
              <div className="hm-channels">
                <a className="hm-btn" href={CONTACT.tiktok} {...ext}>TikTok</a>
                <a className="hm-btn hm-btn-outline" href={CONTACT.facebook} {...ext}>Facebook</a>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
