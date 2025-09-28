import { useState, useEffect, useCallback } from 'react';
import { useTokenMetricsApi } from '@/hooks/useTokenMetricsApi';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export interface EnhancedPriceData {
  symbol: string;
  price_usd: number;
  change_24h?: number;
  last_updated: string;
  source: 'tokenmetrics' | 'cache' | 'fallback';
}

export function useEnhancedCryptoPrices() {
  const { prefs } = useUserPreferences();
  const { entries } = useCombinedEntries();
  const {
    prices: tmPrices,
    loading: tmLoading,
    error: tmError,
    rateLimitInfo,
    refreshPrices,
    getPrice,
    getTokenData
  } = useTokenMetricsApi();

  const [enhancedPrices, setEnhancedPrices] = useState<Record<string, EnhancedPriceData>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Extract unique symbols from entries
  const watchedSymbols = [...new Set(
    entries
      .filter(e => e.type === 'spot' || e.type === 'wallet')
      .map(e => e.asset.toUpperCase().replace(/\/(USDT|USD)$/, ''))
      .filter(Boolean)
  )];

  // Update enhanced prices when TokenMetrics data changes
  useEffect(() => {
    const enhanced: Record<string, EnhancedPriceData> = {};
    
    watchedSymbols.forEach(symbol => {
      const price = getPrice(symbol);
      const tokenData = getTokenData(symbol);
      
      if (price) {
        enhanced[symbol] = {
          symbol,
          price_usd: price,
          change_24h: tokenData?.price_change_percentage_24_h_in_currency,
          last_updated: new Date().toISOString(),
          source: 'tokenmetrics'
        };
      } else {
        // Fallback to static prices for common stablecoins
        if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(symbol)) {
          enhanced[symbol] = {
            symbol,
            price_usd: 1.0,
            change_24h: 0,
            last_updated: new Date().toISOString(),
            source: 'fallback'
          };
        }
      }
    });

    setEnhancedPrices(enhanced);
    if (Object.keys(enhanced).length > 0) {
      setLastUpdate(new Date());
    }
  }, [tmPrices, watchedSymbols, getPrice, getTokenData]);

  // Auto-refresh prices for watched symbols
  const autoRefreshPrices = useCallback(async () => {
    if (watchedSymbols.length === 0 || !prefs.tokenmetrics_api_key) return;
    
    try {
      await refreshPrices(watchedSymbols);
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
    }
  }, [watchedSymbols, prefs.tokenmetrics_api_key, refreshPrices]);

  // Manual refresh with user feedback
  const manualRefresh = useCallback(async (symbols?: string[]) => {
    const symbolsToRefresh = symbols || watchedSymbols;
    if (symbolsToRefresh.length === 0) return;

    if (!rateLimitInfo.canMakeCall) {
      const minutes = Math.ceil(rateLimitInfo.timeUntilNext / (1000 * 60));
      throw new Error(`Rate limit exceeded. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before refreshing.`);
    }

    await refreshPrices(symbolsToRefresh);
  }, [watchedSymbols, rateLimitInfo, refreshPrices]);

  // Get price for a symbol with fallbacks
  const getAssetPrice = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/(USDT|USD)$/, '');
    const enhanced = enhancedPrices[normalizedSymbol];
    
    if (enhanced) {
      return enhanced.price_usd;
    }

    // Fallback for stablecoins
    if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(normalizedSymbol)) {
      return 1.0;
    }

    return null;
  }, [enhancedPrices]);

  // Get 24h change for a symbol
  const getAssetChange = useCallback((symbol: string): number | null => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/(USDT|USD)$/, '');
    const enhanced = enhancedPrices[normalizedSymbol];
    return enhanced?.change_24h || null;
  }, [enhancedPrices]);

  // Get data freshness info
  const getDataFreshness = useCallback((symbol: string): {
    age: number;
    isStale: boolean;
    source: string;
  } => {
    const normalizedSymbol = symbol.toUpperCase().replace(/\/(USDT|USD)$/, '');
    const enhanced = enhancedPrices[normalizedSymbol];
    
    if (!enhanced) {
      return { age: 0, isStale: true, source: 'none' };
    }

    const age = Date.now() - new Date(enhanced.last_updated).getTime();
    const isStale = age > (3 * 60 * 60 * 1000); // 3 hours

    return {
      age,
      isStale,
      source: enhanced.source
    };
  }, [enhancedPrices]);

  return {
    // Data
    prices: enhancedPrices,
    watchedSymbols,
    lastUpdate,
    
    // State
    loading: tmLoading,
    error: tmError,
    rateLimitInfo,
    
    // Methods
    getAssetPrice,
    getAssetChange,
    getDataFreshness,
    manualRefresh,
    autoRefreshPrices,
    
    // TokenMetrics specific
    getTokenData,
    
    // Stats
    totalPrices: Object.keys(enhancedPrices).length,
    stalePrices: Object.values(enhancedPrices).filter(p => {
      const age = Date.now() - new Date(p.last_updated).getTime();
      return age > (3 * 60 * 60 * 1000);
    }).length
  };
}