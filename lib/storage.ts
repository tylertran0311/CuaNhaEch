// This browser's storage, without the try/catch at every call: reading gives null and writing does nothing when
// storage is blocked (private windows, strict settings) or missing (server render).
export function readLS(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeLS(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
