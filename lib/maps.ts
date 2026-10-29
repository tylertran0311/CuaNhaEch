// Reading a Google Maps link: the place text Google puts in the URL, and/or the pin's coordinates.

/** Hosts a Maps share link may use; anything else is refused (the server only follows these) */
export const isMapsHost = (u: URL) =>
  /^(maps\.app\.goo\.gl|goo\.gl|maps\.google\.[a-z.]+|(www\.)?google\.[a-z.]+)$/i.test(u.hostname)
  && (u.hostname.includes("maps") || u.hostname === "goo.gl" ? true : u.pathname.startsWith("/maps"));

const COORD = /(-?\d{1,2}\.\d+),\s*\+?(-?\d{1,3}\.\d+)/;

/** Drops the country and postal code Google adds: "…, Hồ Chí Minh 700000, Việt Nam" → "…, Hồ Chí Minh" */
const tidy = (s: string) => s.replace(/,?\s*(Việt Nam|Vietnam|Viet Nam)\s*$/i, "").replace(/\s+\d{5,6}(?=\s*$|,)/g, "").replace(/\s+/g, " ").trim();

/**
 * "https://www.google.com/maps/place/47+Đường+75,+Tân+Quy,+Quận+7/@10.74,106.70,17z/data=!3d10.744!4d106.702"
 * → { text: "47 Đường 75, Tân Quy, Quận 7", lat: 10.744, lng: 106.702 }
 */
export function readMapsUrl(raw: string): { text: string; lat?: number; lng?: number } {
  let u: URL;
  try { u = new URL(raw); } catch { return { text: "" }; }
  const dec = (s: string) => { try { return decodeURIComponent(s.replace(/\+/g, " ")); } catch { return s; } };
  const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("daddr") || "";
  const place = u.pathname.match(/\/maps\/(?:place|search|dir\/[^/]*)\/([^/@]+)/)?.[1];
  let text = place ? dec(place) : q;
  // The exact pin (!3d…!4d…) beats the map's centre (@…)
  const pin = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const c = pin ? [pin[1], pin[2]] : (text.match(COORD) || u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || u.searchParams.get("ll")?.match(COORD))?.slice(1, 3);
  // A place text that is only coordinates is no address: "10.744, 106.702" or a dropped pin's "10°44'38.8"N 106°42'07.6"E"
  if (COORD.test(text) && text.replace(COORD, "").replace(/[\s,+]/g, "") === "") text = "";
  if (/^\s*\d+°\s*\d+'\s*[\d.]+"?\s*[NS]\b/i.test(text)) text = "";
  return { text: tidy(text), ...(c ? { lat: +c[0], lng: +c[1] } : {}) };
}
