import { useState, useEffect, useCallback } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { updatePrices, getCachedSimplePrices } from '@/lib/priceCache';

export interface SimpleCryptoPrice {
  [key: string]: {
    usdt: number;
    usdt_24h_change?: number;
  };
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  last_updated: string;
}

// Rate limiting: min 60 seconds between API calls for manual reloads
const API_MIN_INTERVAL_MS = 60000;

export function useCryptoPrices() {
  const [prices, setPrices] = useState<SimpleCryptoPrice>({});
  const [detailedPrices, setDetailedPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);

  // Cache duration: 1 hour (3600000 ms)
  const CACHE_DURATION = 60 * 60 * 1000;

  // Keys for cache
  const CACHE_KEYS = {
    simple: 'prices.simple',
    detailed: 'prices.detailed',
    lastUpdated: 'prices.lastUpdated',
    lastApiCall: 'prices.lastApiCall'
  } as const;

  // Hydrate from cache on mount
  useEffect(() => {
    try {
      const cachedSimple = cacheGet<Record<string, { usdt: number; usdt_24h_change?: number }>>(CACHE_KEYS.simple);
      if (cachedSimple) setPrices(cachedSimple);
      const cachedDetailed = cacheGet<CryptoPrice[]>(CACHE_KEYS.detailed);
      if (cachedDetailed && Array.isArray(cachedDetailed)) setDetailedPrices(cachedDetailed);
      const cachedUpdated = cacheGet<number>(CACHE_KEYS.lastUpdated);
      if (typeof cachedUpdated === 'number') setLastUpdated(new Date(cachedUpdated));
      const cachedCall = cacheGet<number>(CACHE_KEYS.lastApiCall);
      if (typeof cachedCall === 'number') setLastApiCall(new Date(cachedCall));
    } catch {}
  }, []);

  // Check if we can make an API call (respecting rate limit)
  const canMakeApiCall = () => {
    if (!lastApiCall) return true;
    const timeSinceLastCall = Date.now() - lastApiCall.getTime();
    return timeSinceLastCall >= API_MIN_INTERVAL_MS;
  };

  // Get time until next API call is allowed
  const getTimeUntilNextCall = () => {
    if (!lastApiCall) return 0;
    const timeSinceLastCall = Date.now() - lastApiCall.getTime();
    return Math.max(0, API_MIN_INTERVAL_MS - timeSinceLastCall);
  };

  // Fetch simple prices for multiple assets
  const fetchSimplePrices = useCallback(async (assets: string[]) => {
    if (!assets.length) return {};

    // Check if we can make an API call
    if (!canMakeApiCall()) {
      const timeLeft = getTimeUntilNextCall();
      const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
      console.log(`⏰ API rate limit: ${hoursLeft} hours until next call allowed`);
      
      return prices; // Return cached data
    }

    setLoading(true);
    try {
      console.log('🚀 Making TokenMetrics API call (3-hour rate limit respected)');
      
      // Normalize asset symbols
      const normalizedAssets = assets.map(asset => 
        asset.toUpperCase().replace(/\/USDT$|\/USD$/, '')
      );
      
      // Fetch prices using TokenMetrics integration
      const fetchedPrices = await updatePrices(normalizedAssets);
      
      if (Object.keys(fetchedPrices).length > 0) {
        console.log('✅ Successfully fetched price data from TokenMetrics');
        setPrices(fetchedPrices);
        const now = new Date();
        setLastUpdated(now);
        setLastApiCall(now); // Record successful API call
        // Cache
        cacheSet(CACHE_KEYS.simple, fetchedPrices, CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
        return fetchedPrices;
      } else {
        console.log('⚠️ No prices returned from TokenMetrics');
        return {};
      }
    } catch (error: any) {
      console.error('Error fetching crypto prices:', error);
      
      // Record failed API attempt to respect rate limiting
      setLastApiCall(new Date());
      
      // Return empty object to prevent crashes
      return {};
    } finally {
      setLoading(false);
    }
  }, [prices, canMakeApiCall, getTimeUntilNextCall]);

  // Fetch detailed market data (placeholder implementation)
  const fetchMarketData = useCallback(async (assets: string[], limit: number = 50) => {
    // For now, we'll just return an empty array since TokenMetrics doesn't provide
    // the same detailed market data as CoinGecko
    console.log('📊 TokenMetrics does not provide detailed market data, returning empty array');
    return [];
  }, []);

  // Get price for a specific asset
  const getAssetPrice = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    return prices[normalizedSymbol]?.usdt || null;
  }, [prices]);

  // Get 24h change for a specific asset (placeholder implementation)
  const getAssetChangePct = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    const pct = prices[normalizedSymbol]?.usdt_24h_change;
    return typeof pct === 'number' ? pct : null;
  }, [prices]);

  // Absolute 24h change in USD (price delta), derived from percent and current price
  const getAssetChange = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    const price = prices[normalizedSymbol]?.usdt;
    const pct = prices[normalizedSymbol]?.usdt_24h_change;
    if (typeof price === 'number' && typeof pct === 'number') {
      return (price * pct) / 100;
    }
    return null;
  }, [prices]);

  // Removed auto-refresh - manual reload only

  return {
    prices,
    detailedPrices,
    loading,
    lastUpdated,
    lastApiCall,
    fetchSimplePrices,
    fetchMarketData,
    getAssetPrice,
    getAssetChange,
    getAssetChangePct,
    canMakeApiCall,
    getTimeUntilNextCall,
    // Manual reload function with rate limit safety
    manualReload: async (assets: string[]) => {
      if (!canMakeApiCall()) {
        const timeLeft = getTimeUntilNextCall();
        const secondsLeft = Math.ceil(timeLeft / 1000);
        throw new Error(`Rate limit exceeded. Please wait ${secondsLeft} seconds before next reload.`);
      }
      return await fetchSimplePrices(assets);
    },
    updatePortfolioWithLivePrices: () => {
      // This is a placeholder - portfolio functionality has been removed
      console.log('Portfolio functionality has been removed');
    }
  };
}
