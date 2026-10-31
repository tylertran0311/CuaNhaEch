// The public product page's "đặt giao ngày khác" form posts here. Only requests from this site, of a small size,
// sent by a person (a hidden field bots fill in, and a minimum time on the form) and not too often from one address
// get through; every field is checked (lib/request.ts), the dish must be on the menu, and the database checks it all
// again in submit_request(). Errors say only what the customer can fix.
import { SB_KEY, SB_URL } from "@/lib/serverAuth";
import { getPublicMenu } from "@/lib/publicMenu";
import { checkRequest, vnNow } from "@/lib/request";

const MAX_BODY = 4096;
const MIN_FILL_MS = 3000;
const WINDOW_MS = 10 * 60e3, PER_WINDOW = 5;
// Recent requests per address (per server instance; the database also limits per phone and per hour)
const hits = new Map<string, number[]>();

const fail = (status: number, error: string, errors?: object) => Response.json({ ok: false, error, errors }, { status });

function tooOften(ip: string) {
  const now = Date.now(), list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, [...list, now]);
  return list.length >= PER_WINDOW;
}

export async function POST(req: Request) {
  if (!SB_URL || !SB_KEY) return fail(503, "Shop chưa mở đặt online, bạn nhắn Zalo giúp shop nhé.");

  // Same site only: browsers always send Origin on a POST from a page
  const origin = req.headers.get("origin"), host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let sameSite = false;
  try { sameSite = !!origin && !!host && new URL(origin).host === host; } catch {}
  if (!sameSite) return fail(403, "Yêu cầu không hợp lệ.");
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return fail(415, "Yêu cầu không hợp lệ.");

  const text = await req.text();
  if (text.length > MAX_BODY) return fail(413, "Yêu cầu quá dài.");
  let body: Record<string, unknown>;
  try {
    const v: unknown = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw 0;
    body = v as Record<string, unknown>;
  } catch { return fail(400, "Yêu cầu không hợp lệ."); }

  // Bots fill the hidden field or send the form instantly: pretend it worked, store nothing
  const started = typeof body.t === "number" ? body.t : 0;
  if (body.website || !started || Date.now() - started < MIN_FILL_MS) return Response.json({ ok: true });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (tooOften(ip)) return fail(429, "Bạn gửi hơi nhiều yêu cầu, thử lại sau ít phút hoặc nhắn Zalo cho shop nhé.");

  const { today, now } = vnNow();
  const r = checkRequest(body, today, now);
  if (!r.ok) return fail(400, "Bạn kiểm tra lại các ô được đánh dấu nhé.", r.errors);

  const menu = await getPublicMenu();
  const gone = r.data.items.find((x) => !menu?.items.some((i) => i.name === x.item));
  if (gone) return fail(400, `${gone.item} hiện không có trong menu.`, { items: "Bỏ món này khỏi giỏ rồi gửi lại." });

  try {
    const res = await fetch(`${SB_URL}/rest/v1/rpc/submit_request`, {
      method: "POST", cache: "no-store",
      headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ p: r.data }),
    });
    if (res.ok) return Response.json({ ok: true });
    const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? "";
    if (msg.includes("too many")) return fail(429, "Số này đã gửi nhiều yêu cầu hôm nay, bạn nhắn Zalo cho shop nhé.");
    console.error("submit_request failed", res.status, msg);
    return fail(400, "Shop chưa nhận được yêu cầu, bạn kiểm tra lại hoặc nhắn Zalo nhé.");
  } catch (e) {
    console.error("submit_request error", e);
    return fail(502, "Không gửi được yêu cầu, bạn thử lại hoặc nhắn Zalo cho shop nhé.");
  }
}
