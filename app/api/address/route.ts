// Address help from Goong, kept cheap:
// - only signed-in shop members can call it, and short or junk queries are refused
// - the same query or link is answered from cache for 30 days (shared across Vercel instances)
// - only Autocomplete is used for typing; a Maps link costs nothing when Google's URL already holds the address,
//   and one reverse-geocode call when it only holds a pin
// - each server instance stops after a daily cap of real Goong calls
//   ?q=<text>     → { items: string[] }  suggestions
//   ?link=<url>   → { addr: string }     address of a Google Maps share link
import { unstable_cache } from "next/cache";
import { isMapsHost, readMapsUrl } from "@/lib/maps";
import { fold } from "@/lib/text";

const KEY = process.env.GOONG_API_KEY?.trim();
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const DAILY_MAX = Number(process.env.GOONG_DAILY_MAX) || 300;
// Results near the shop come first (default: central Hồ Chí Minh City)
const NEAR = process.env.GOONG_LOCATION?.trim() || "10.7769,106.7009";
const MONTH = 30 * 24 * 3600;

/** Same text however it was typed: "47  Đường 75 " and "47 đường 75" share one cache entry */
const norm = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Goong matches far better without commas and unit words:
 * "47 đường 75, p.tân hưng, q.7" → "47 đường 75 tân hưng q7". Numbered wards ("p.7", "phường 7") keep their word.
 */
const clean = (q: string) => q
  .replace(/[,;]+/g, " ")
  .replace(/(^|\s)(phường|phuong|p\.|p(?=\s)|xã|x\.|thị trấn|tt\.)\s*(?=\p{L})/gu, " ")
  .replace(/(^|\s)(quận|quan|q\.?)\s*(\d{1,2})(?=\s|$)/gu, " q$3")
  .replace(/(^|\s)đ\.\s*/gu, " đường ")
  .replace(/\s+/g, " ").trim();

let today = "", used = 0;
// Only real Goong calls count toward the cap; cached answers are free
function spend() {
  const d = new Date().toISOString().slice(0, 10);
  if (d !== today) { today = d; used = 0; }
  if (++used > DAILY_MAX) throw new Error("limit");
}

async function goong<T>(path: string, params: Record<string, string>): Promise<T> {
  spend();
  const u = new URL("https://rsapi.goong.io" + path);
  for (const [k, v] of Object.entries({ api_key: KEY!, ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { cache: "no-store" });
  const j = (await r.json().catch(() => null)) as (T & { error?: { code?: string } }) | null;
  // Throwing keeps failures out of the cache
  if (!r.ok || !j || j.error) throw new Error(j?.error?.code || `goong ${r.status}`);
  return j;
}

const suggest = unstable_cache(async (q: string): Promise<string[]> => {
  const j = await goong<{ predictions?: { description?: string }[] }>("/v2/place/autocomplete",
    { input: q, limit: "5", location: NEAR, radius: "50" });
  return (j.predictions || []).map((p) => p.description || "").filter(Boolean);
}, ["goong-ac-v2"], { revalidate: MONTH });

/** Follows a share link's redirects (Google hosts only) to the full Maps URL */
async function expand(link: string) {
  let url = link;
  for (let i = 0; i < 4; i++) {
    const u = new URL(url);
    if (!isMapsHost(u)) return "";
    if (u.pathname.startsWith("/maps") || /^maps\.google\./i.test(u.hostname)) return url;
    const r = await fetch(url, { redirect: "manual", cache: "no-store" });
    const next = r.headers.get("location");
    if (!next) return url;
    url = new URL(next, url).toString();
  }
  return url;
}

const fromLink = unstable_cache(async (link: string): Promise<string> => {
  const full = await expand(link);
  if (!full) return "";
  const { text, lat, lng } = readMapsUrl(full);
  // Google's own text is used as is when it already reads like an address (house number or several parts)
  if (text && (/^\d/.test(text) || text.includes(",") || lat == null)) return text;
  if (lat == null || lng == null) return "";
  const j = await goong<{ results?: { formatted_address?: string }[] }>("/v2/geocode", { latlng: `${lat},${lng}` });
  // Full address of the nearest known place ("1154 Đường Lê Văn Lương, Tân Hưng, Hồ Chí Minh");
  // a named place from Google's link stays in front unless Goong already starts with it
  const a = j.results?.[0]?.formatted_address || "";
  // Names compared without accents, spaces or dots: "Co.op Xtra" is already in "Co.opXtra Tân Phong, …"
  const bare = (s: string) => fold(s).replace(/[^a-z0-9]/g, "");
  return text && a && !bare(a).startsWith(bare(text)) ? `${text}, ${a}` : a;
}, ["maps-link-v1"], { revalidate: MONTH });

// Tokens already checked against Supabase, so typing doesn't add an auth round trip per keystroke
const okTokens = new Map<string, number>();
async function member(req: Request) {
  if (!SB_URL || !SB_KEY) return process.env.NODE_ENV !== "production";
  const tok = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!tok) return false;
  if ((okTokens.get(tok) ?? 0) > Date.now()) return true;
  const h = { apikey: SB_KEY, authorization: `Bearer ${tok}` };
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: h, cache: "no-store" });
  const email = r.ok ? ((await r.json()) as { email?: string }).email : "";
  if (!email) return false;
  // Signed in is not enough: the email must be on the shop's members list (same check as the app)
  const m = await fetch(`${SB_URL}/rest/v1/members?select=email&limit=1&email=ilike.${encodeURIComponent(email)}`, { headers: h, cache: "no-store" });
  if (!m.ok || !((await m.json()) as unknown[]).length) return false;
  if (okTokens.size > 200) okTokens.clear();
  okTokens.set(tok, Date.now() + 10 * 60e3);
  return true;
}

const fail = (e: unknown) => {
  const msg = (e as Error).message;
  return Response.json({ items: [], addr: "", error: msg }, { status: msg === "limit" ? 429 : 502 });
};

export async function GET(req: Request) {
  if (!KEY) return Response.json({ items: [], addr: "", error: "no-key" }, { status: 503 });
  const p = new URL(req.url).searchParams;
  const link = p.get("link")?.trim() || "";
  const q = clean(norm(p.get("q") || ""));
  // Too short to be worth a paid lookup, or not an address at all
  if (!link && (q.length < 5 || q.length > 120 || !/\p{L}/u.test(q))) return Response.json({ items: [] });
  if (link) { try { if (!isMapsHost(new URL(link))) return Response.json({ addr: "" }); } catch { return Response.json({ addr: "" }); } }
  if (!(await member(req))) return Response.json({ items: [], addr: "", error: "auth" }, { status: 401 });

  const cache = { "cache-control": "private, max-age=86400" };
  try {
    if (link) return Response.json({ addr: await fromLink(link) }, { headers: cache });
    return Response.json({ items: await suggest(q) }, { headers: cache });
  } catch (e) {
    return fail(e);
  }
}
