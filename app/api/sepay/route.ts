// SePay calls this when money comes into the shop's bank account (Webhook, authentication "API Key"). The key SePay
// sends is passed on to sepay_payment() in the database, which compares it with the one saved there (app_secrets), so
// the key lives only in SePay and in the database. The database records each transfer once (SePay retries), finds the
// order from the "CNE…" code in the transfer note and moves it to deposit paid / paid. SePay wants a 2xx within 5 s;
// any other answer makes it retry later, which is what we want when the database is briefly unreachable.
import { SB_KEY, SB_URL } from "@/lib/serverAuth";

const MAX_BODY = 8192;
// Wrong keys per address (per server instance), to slow down guessing
const WINDOW_MS = 10 * 60e3, MAX_BAD = 10;
const bad = new Map<string, number[]>();

const reply = (status: number, body: object) => Response.json(body, { status });

function blocked(ip: string, failed = false) {
  const now = Date.now(), list = (bad.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (failed) { if (bad.size > 5000) bad.clear(); list.push(now); }
  bad.set(ip, list);
  return list.length >= MAX_BAD;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function POST(req: Request) {
  if (!SB_URL || !SB_KEY) return reply(503, { success: false });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (blocked(ip)) return reply(429, { success: false });

  const key = /^Apikey\s+([A-Za-z0-9_-]{24,128})$/i.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!key) { blocked(ip, true); return reply(401, { success: false }); }
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return reply(415, { success: false });

  const text = await req.text();
  if (text.length > MAX_BODY) return reply(413, { success: false });
  let b: Record<string, unknown>;
  try {
    const v: unknown = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw 0;
    b = v as Record<string, unknown>;
  } catch { return reply(400, { success: false }); }

  // Only the fields we use, with their types checked; the database checks them again
  if (!Number.isSafeInteger(b.id) || !Number.isSafeInteger(b.transferAmount)) return reply(400, { success: false });
  const p = {
    id: b.id, transferAmount: b.transferAmount, transferType: str(b.transferType, 10),
    content: str(b.content, 500), code: str(b.code, 50), accountNumber: str(b.accountNumber, 30),
    gateway: str(b.gateway, 50), transactionDate: str(b.transactionDate, 30), referenceCode: str(b.referenceCode, 60),
  };

  try {
    const res = await fetch(`${SB_URL}/rest/v1/rpc/sepay_payment`, {
      method: "POST", cache: "no-store",
      headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ p, k: key }),
    });
    if (res.ok) return reply(200, { success: true, result: await res.json().catch(() => null) });
    const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? "";
    if (msg.includes("unauthorized")) { blocked(ip, true); return reply(401, { success: false }); }
    if (msg.includes("invalid")) return reply(400, { success: false });
    console.error("sepay_payment failed", res.status, msg);
    return reply(500, { success: false });
  } catch (e) {
    console.error("sepay_payment error", e);
    return reply(502, { success: false });
  }
}
