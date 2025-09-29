import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBinancePrices } from '@/hooks/useBinancePrices';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export interface EnhancedPriceData {
  symbol: string;
  price_usd: number;
  change_24h?: number;
  last_updated: string;
  source: 'binance' | 'cache' | 'fallback';
}

export function useEnhancedCryptoPrices() {
  const { prefs } = useUserPreferences();
  const { entries } = useCombinedEntries();
  const watchedSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.type === 'spot' || e.type === 'wallet') {
        const sym = e.asset?.toUpperCase().replace(/\/(USDT|USD)$/,'');
        if (sym) set.add(sym);
      }
    }
    return Array.from(set);
  }, [entries]);

  const {
    prices: binancePrices,
    loading: binanceLoading,
    error: binanceError,
    manualReload,
    refreshStatus
  } = useBinancePrices(watchedSymbols);

  const [enhancedPrices, setEnhancedPrices] = useState<Record<string, EnhancedPriceData>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update enhanced prices when Binance data changes
  useEffect(() => {
    const enhanced: Record<string, EnhancedPriceData> = {};

    // Use keys from binancePrices to avoid depending on watchedSymbols identity
    Object.keys(binancePrices).forEach(symbol => {
      const price = binancePrices[symbol];

      if (price) {
        enhanced[symbol] = {
          symbol,
          price_usd: price,
          change_24h: 0, // Binance API doesn't provide 24h change in basic endpoint
          last_updated: new Date().toISOString(),
          source: 'binance'
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
  }, [binancePrices]);

  // Auto-refresh prices for watched symbols
  const autoRefreshPrices = useCallback(async () => {
    try {
      await manualReload();
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
    }
  }, [manualReload]);

  // Manual refresh with user feedback
  const manualRefresh = useCallback(async (symbols?: string[]) => {
    try {
      await manualReload();
    } catch (error) {
      console.warn('Manual refresh failed:', error);
    }
  }, [manualReload]);

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
    loading: binanceLoading,
    error: binanceError,
    rateLimitInfo: { canMakeCall: true, timeUntilNext: 0 }, // Binance doesn't have rate limits in basic usage

    // Methods
    getAssetPrice,
    getAssetChange,
    getDataFreshness,
    manualRefresh,
    autoRefreshPrices,

    // TokenMetrics specific (deprecated)
    getTokenData: () => null, // Placeholder for compatibility

    // Stats
    totalPrices: Object.keys(enhancedPrices).length,
    stalePrices: Object.values(enhancedPrices).filter(p => {
      const age = Date.now() - new Date(p.last_updated).getTime();
      return age > (3 * 60 * 60 * 1000);
    }).length
  };
}