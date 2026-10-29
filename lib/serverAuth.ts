// Server-only helpers for API routes: who is calling (a signed-in shop member?) and the database's public address.

export const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
export const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Tokens already checked against Supabase, so repeated calls don't add an auth round trip each time
const okTokens = new Map<string, number>();

/** True when the request carries the token of a signed-in user whose email is on the shop's members list */
export async function isMemberRequest(req: Request) {
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
