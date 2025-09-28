import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseTokenMetricsApiResult {
  connected: boolean; // last fetch succeeded recently
  lastUpdated?: number;
  getPrice: (symbol: string) => number | undefined;
  error?: string;
}

/**
 * Poll TokenMetrics REST API for latest token prices by symbol.
 * - symbols: symbols without suffix (e.g., ['BTC','XRP','OM'])
 * - apiKey: TokenMetrics API key
 * - intervalMs: polling interval (default 15000ms)
 */
export function useTokenMetricsApi(symbols: string[], apiKey?: string, intervalMs: number = 15000): UseTokenMetricsApiResult {
  const norm = useMemo(() => Array.from(new Set((symbols || [])
    .map(s => (s || '').toUpperCase().replace(/\/(USDT|USD)$/,'').trim())
    .filter(Boolean)
  )), [symbols]);

  const pricesRef = useRef<Map<string, number>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);

  const fetchAll = useCallback(async (abort?: AbortSignal) => {
    if (!apiKey || norm.length === 0) return;
    try {
      setError(undefined);
      // Fetch per symbol (TokenMetrics sample shows single symbol per call)
      const outEntries: Array<[string, number]> = [];
      await Promise.all(norm.map(async (sym) => {
        const url = `https://api.tokenmetrics.com/v3/tokens?symbol=${encodeURIComponent(sym)}&limit=1&page=1`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'accept': 'application/json', 'x-api-key': apiKey },
          signal: abort,
        });
        if (!res.ok) throw new Error(`${sym} ${res.status}`);
        const data = await res.json().catch(() => ({} as any));
        // Try to extract price field heuristically
        // Expected: data.data[0]?.price_usd or .price
        const item = (data?.data && Array.isArray(data.data) && data.data[0]) || undefined;
        const price = Number(item?.price_usd ?? item?.price ?? item?.last_price);
        if (Number.isFinite(price)) {
          outEntries.push([sym, price]);
        }
      }));
      if (outEntries.length > 0) {
        for (const [sym, px] of outEntries) pricesRef.current.set(sym + 'USDT', px);
        setConnected(true);
        setLastUpdated(Date.now());
      }
    } catch (e: any) {
      setConnected(false);
      setError(e?.message || 'TokenMetrics fetch failed');
    }
  }, [apiKey, norm]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAll(ctrl.signal);
    const t = setInterval(() => fetchAll(ctrl.signal), intervalMs) as unknown as number;
    return () => { try { ctrl.abort(); } catch {}; clearInterval(t); };
  }, [fetchAll, intervalMs]);

  const getPrice = useCallback((symbol: string) => {
    const key = (symbol || '').toUpperCase().replace(/\/(USDT|USD)$/,'') + 'USDT';
    return pricesRef.current.get(key);
  }, []);

  return { connected, lastUpdated, getPrice, error };
}