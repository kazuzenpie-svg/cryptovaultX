import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { getCachedSimplePrices, updatePrices, type SimpleCryptoPrice as DBPrice } from '@/lib/priceCache';
import { tokenMetricsService } from '@/services/tokenMetricsService';

export interface SimpleCryptoPrice {
  [key: string]: {
    usdt: number;
    usdt_24h_change?: number;
  };
}

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
const CACHE_KEYS = {
  simple: 'prices.simple.proxy',
  lastUpdated: 'prices.lastUpdated.proxy',
  lastApiCall: 'prices.lastApiCall.proxy',
} as const;

export function useLivePricesProxy() {
  const [prices, setPrices] = useState<SimpleCryptoPrice>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);
  const refreshingRef = useRef(false);

  // Initialize with cached data only
  useEffect(() => {
    try {
      const cachedSimple = cacheGet<SimpleCryptoPrice>(CACHE_KEYS.simple);
      if (cachedSimple) setPrices(cachedSimple);
      const cachedUpdated = cacheGet<number>(CACHE_KEYS.lastUpdated);
      if (typeof cachedUpdated === 'number') setLastUpdated(new Date(cachedUpdated));
      const cachedCall = cacheGet<number>(CACHE_KEYS.lastApiCall);
      if (typeof cachedCall === 'number') setLastApiCall(new Date(cachedCall));
    } catch {}
  }, []);

  const canMakeApiCall = useCallback(() => {
    if (!lastApiCall) return true;
    const delta = Date.now() - lastApiCall.getTime();
    return delta >= CACHE_DURATION;
  }, [lastApiCall]);

  const getAssetPrice = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    return prices[normalizedSymbol]?.usdt ?? null;
  }, [prices]);

  const fetchPrices = useCallback(async (assets: string[]) => {
    if (!assets.length) return {} as SimpleCryptoPrice;
    if (refreshingRef.current) return prices;
    if (!canMakeApiCall()) return prices;

    refreshingRef.current = true;
    setLoading(true);
    try {
      // 0) Read fresh cached prices from Supabase DB to save API calls
      const allSymbols = assets.map(symbol => symbol.toUpperCase().replace(/\/USDT$|\/USD$/, ''));
      const MAX_DB_AGE_MS = 60 * 60 * 1000; // 1 hour freshness window
      const cachedDb = await getCachedSimplePrices(allSymbols, MAX_DB_AGE_MS);

      // Merge what we already have locally with DB cache
      let merged: SimpleCryptoPrice = { ...prices, ...cachedDb };

      // Determine which symbols are still missing after DB cache
      const missingSymbols = allSymbols.filter((symbol) => !merged[symbol]);

      // If nothing missing, update state from DB and return without hitting external API
      if (missingSymbols.length === 0) {
        setPrices(merged);
        const now = new Date();
        setLastUpdated(now);
        setLastApiCall(now);
        cacheSet(CACHE_KEYS.simple, merged, CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
        return merged;
      }

      // 1) Fetch only missing symbols from TokenMetrics API
      const fetched = await updatePrices(missingSymbols);
      merged = { ...merged, ...fetched };

      setPrices(merged);
      const now = new Date();
      setLastUpdated(now);
      setLastApiCall(now);
      cacheSet(CACHE_KEYS.simple, merged, CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
      return merged;
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [prices, canMakeApiCall]);

  const updatePortfolioWithLivePrices = useCallback(async (assets: string[]) => {
    return fetchPrices(assets);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    lastUpdated,
    getAssetPrice,
    updatePortfolioWithLivePrices,
    fetchPrices,
  };
}
