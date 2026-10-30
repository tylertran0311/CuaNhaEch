// Vietnamese phone numbers. This checks the format only; it can't tell whether a number is in use.

// Mobile: 10 digits on current carrier prefixes (Viettel 03x/086/096-98, Vina 081-85/088/091/094,
// Mobi 070/076-79/089/090/093, Vietnamobile 052/056/058/092, Gmobile 059/099, Itel 087, Reddi 055)
const MOBILE = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/;
// Landline: 02 + area code, 11 digits in total (e.g. 028 3822 1234)
const LANDLINE = /^02\d{9}$/;

/** Drop spaces, dots, dashes and brackets, and turn +84 / 84 into a leading 0 */
function normalizeVN(s: string) {
  let d = s.replace(/[\s.\-()]/g, "");
  if (d.startsWith("+84")) d = "0" + d.slice(3);
  else if (/^84\d{9,10}$/.test(d)) d = "0" + d.slice(2);
  return d;
}

export function isVNPhone(s: string) {
  const d = normalizeVN(s);
  return MOBILE.test(d) || LANDLINE.test(d);
}

/** "0901 234 567" for mobiles, "028 3822 1234" for landlines; anything else is returned trimmed */
export function formatVN(s: string) {
  const d = normalizeVN(s);
  if (MOBILE.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (LANDLINE.test(d)) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
  return s.trim();
}
