import { useEffect, useMemo, useRef, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { useCryptoPrices } from './useCryptoPrices';

export type LivePrices = Record<string, number>; // key: SYMBOL (BTC), value: last price in USDT

export function useLivePrices(watchedSymbols: string[]) {
  const symbols = useMemo(() => {
    // De-dup and normalize to base symbols like BTC, ETH
    const set = new Set(
      watchedSymbols
        .filter(Boolean)
        .map(s => s.toUpperCase().replace(/\/(USDT|USD)$/i, ''))
    );
    return Array.from(set);
  }, [watchedSymbols]);
  const [prices, setPrices] = useState<LivePrices>({});
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { getCoingeckoId } = useCryptoPrices();

  // Cache keys and TTL (60s align with polling)
  const CACHE_KEY = 'live.prices.simple';
  const CACHE_TTL = 60_000; // 60 seconds

  // Simple proxy rotation to mitigate CORS failures
  const PROXIES = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors.isomorphic-git.org/${url}`,
  ];

  const fetchViaProxies = async (url: string): Promise<Record<string, { usdt: number }> | null> => {
    for (const make of PROXIES) {
      try {
        const proxyUrl = make(url);
        const res = await fetch(proxyUrl);
        if (!res.ok) continue;
        const txt = await res.text();
        try {
          const parsed = JSON.parse(txt);
          if (parsed && parsed.contents) {
            return JSON.parse(parsed.contents);
          }
          return parsed;
        } catch {
          try { return JSON.parse(txt); } catch { return null; }
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  // Hydrate from cache once
  useEffect(() => {
    const cached = cacheGet<LivePrices>(CACHE_KEY);
    if (cached && typeof cached === 'object') {
      setPrices(cached);
    }
  }, []);

  

  // Poll CoinGecko every 60s for watched symbols
  useEffect(() => {
    const fetchCoinGecko = async () => {
      if (!symbols.length) return;

      // Map to CoinGecko ids and filter empties
      const idsList = symbols.map(sym => getCoingeckoId(sym)).filter(Boolean);
      if (!idsList.length) return;
      const ids = idsList.join(',');

      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usdt`;
        const realData = await fetchViaProxies(url);
        clearTimeout(id);
        if (!realData) return;
        const updates: LivePrices = {};
        for (const sym of symbols) {
          const cgId = getCoingeckoId(sym);
          const p = realData[cgId]?.usdt;
          if (typeof p === 'number' && !isNaN(p)) updates[sym] = p;
        }
        if (Object.keys(updates).length) {
          setPrices(prev => {
            const merged = { ...prev, ...updates };
            cacheSet(CACHE_KEY, merged, CACHE_TTL);
            return merged;
          });
        }
      } catch {
        // ignore network errors
      }
    };

    // Initial fetch and then interval every 60s
    fetchCoinGecko();
    pollTimer.current = globalThis.setInterval(fetchCoinGecko, 60_000);
    return () => {
      if (pollTimer.current != null) {
        globalThis.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [symbols.join(',')]);

  const getPrice = (symbol: string): number | null => {
    const base = symbol.toUpperCase().replace(/\/(USDT|USD)$/i, '');
    const val = prices[base];
    if (typeof val === 'number') return val;
    // Stablecoins ~1.0
    if (base === 'USDT' || base === 'USDC' || base === 'DAI') return 1.0;
    return null;
  };

  return { prices, getPrice };
}
