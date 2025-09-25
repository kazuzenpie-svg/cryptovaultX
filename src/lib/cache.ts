export type TTL = number; // milliseconds

interface CacheEntry<T> {
  v: T;
  e: number; // expiresAt epoch ms
}

const prefix = 'cvx:';

export function cacheSet<T>(key: string, value: T, ttlMs: TTL) {
  try {
    const expires = Date.now() + Math.max(0, ttlMs);
    const entry: CacheEntry<T> = { v: value, e: expires };
    localStorage.setItem(prefix + key, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(prefix + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T> | null;
    if (!parsed || typeof parsed.e !== 'number') return null;
    if (Date.now() > parsed.e) {
      localStorage.removeItem(prefix + key);
      return null;
    }
    return parsed.v as T;
  } catch {
    return null;
  }
}

export function cacheDel(key: string) {
  try { localStorage.removeItem(prefix + key); } catch {}
}

export function cacheHas(key: string) {
  return cacheGet(key) !== null;
}
