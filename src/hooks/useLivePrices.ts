import { useEffect, useMemo, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { updatePrices } from '@/lib/priceCache';

export type LivePrices = Record<string, number>; // key: SYMBOL (BTC), value: last price in USDT

export function useLivePrices(watchedSymbols: string[]) {
  const symbols = useMemo(() => {
    // De-dup and normalize to base symbols like BTC, ETH
    const set = new Set(
      watchedSymbols
        .filter(Boolean)
        .map(s => s.toUpperCase().replace(/\/USDT$|\/USD$/i, ''))
    );
    return Array.from(set);
  }, [watchedSymbols]);
  const [prices, setPrices] = useState<LivePrices>({});

  // Cache keys and TTL (3 hours)
  const CACHE_KEY = 'live.prices.simple';
  const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

  // Hydrate from cache once
  useEffect(() => {
    const cached = cacheGet<LivePrices>(CACHE_KEY);
    if (cached && typeof cached === 'object') {
      setPrices(cached);
    }
  }, []);

  // No automatic fetching - manual reload only
  // Initialize with cached data only
  useEffect(() => {
    // Data will be loaded from cache only
  }, []);

  const getPrice = (symbol: string): number | null => {
    const base = symbol.toUpperCase().replace(/\/USDT$|\/USD$/i, '');
    const val = prices[base];
    if (typeof val === 'number') return val;
    // Stablecoins ~1.0
    if (base === 'USDT' || base === 'USDC' || base === 'DAI') return 1.0;
    return null;
  };

  // Manual reload function with rate limit safety
  const manualReload = async () => {
    if (!symbols.length) return;
    
    try {
      // Fetch prices from TokenMetrics and update database
      const priceData = await updatePrices(symbols);
      
      // Convert to LivePrices format
      const updates: LivePrices = {};
      Object.keys(priceData).forEach(symbol => {
        updates[symbol] = priceData[symbol].usdt;
      });
      
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

  return { prices, getPrice, manualReload };
}
