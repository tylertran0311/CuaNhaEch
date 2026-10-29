/** Lowercase without Vietnamese accents, for searching ("tan phong" finds "Tân Phong") */
export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();

/** A Google Maps link (full, short goo.gl or maps.app link) found anywhere in the text, or "" */
export const mapLinkIn = (s: string) =>
  s.match(/https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\S*/i)?.[0] ?? "";

/** Link that opens the order's place: the customer's own Maps link, otherwise a Maps search for the address */
export const mapUrl = (map: string | undefined, addr: string) =>
  map || (addr ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr) : "");
