import { useState, useEffect, useCallback } from 'react';
import { tokenMetricsApi, type TokenMetricsToken, type RateLimitInfo } from '@/services/tokenMetricsApiService';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';

export interface UseTokenMetricsApiResult {
  // Data
  tokens: TokenMetricsToken[];
  prices: Record<string, number>;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Rate limiting
  rateLimitInfo: RateLimitInfo;
  
  // Cache info
  cacheStats: {
    priceCount: number;
    tokenCount: number;
    totalSize: number;
    lastUpdate: Date | null;
  };
  
  // Methods
  fetchTokens: (symbols?: string[]) => Promise<void>;
  refreshPrices: (symbols: string[]) => Promise<void>;
  getPrice: (symbol: string) => number | null;
  getTokenData: (symbol: string) => TokenMetricsToken | null;
  clearCache: () => void;
  healthCheck: () => Promise<any>;
}

export function useTokenMetricsApi(autoFetch: boolean = false): UseTokenMetricsApiResult {
  const { prefs } = useUserPreferences();
  const { toast } = useToast();
  
  const [tokens, setTokens] = useState<TokenMetricsToken[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({
    canMakeCall: true,
    timeUntilNext: 0,
    callsRemaining: 100,
    resetTime: new Date()
  });
  const [cacheStats, setCacheStats] = useState({
    priceCount: 0,
    tokenCount: 0,
    totalSize: 0,
    lastUpdate: null as Date | null
  });

  // Update API key when preferences change
  useEffect(() => {
    if (prefs.tokenmetrics_api_key) {
      tokenMetricsApi.setApiKey(prefs.tokenmetrics_api_key);
    }
  }, [prefs.tokenmetrics_api_key]);

  // Update rate limit info and cache stats
  const updateStatus = useCallback(() => {
    setRateLimitInfo(tokenMetricsApi.getRateLimitInfo());
    setCacheStats(tokenMetricsApi.getCacheStats());
  }, []);

  // Update status on mount and periodically
  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [updateStatus]);

  // Fetch tokens with error handling
  const fetchTokens = useCallback(async (symbols?: string[]) => {
    if (!prefs.tokenmetrics_api_key) {
      setError('API key not configured. Please set your TokenMetrics API key in Settings.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await tokenMetricsApi.fetchTokens(symbols);
      setTokens(response.data);
      
      // Update prices from response
      const newPrices: Record<string, number> = {};
      response.data.forEach(token => {
        if (token.token_symbol) {
          const symbol = token.token_symbol.toUpperCase();
          const price = token.current_price || token.price || token.price_usd || 0;
          if (price > 0) {
            newPrices[symbol] = price;
          }
        }
      });
      setPrices(newPrices);
      
      // Update database
      if (Object.keys(newPrices).length > 0) {
        await tokenMetricsApi.updateDatabasePrices(Object.keys(newPrices));
      }
      
      updateStatus();
      
      toast({
        title: "Prices Updated! 📈",
        description: `Successfully fetched ${response.data.length} token prices.`,
        className: "bg-success text-success-foreground",
      });
      
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      setError(error.message);
      
      toast({
        title: "Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      updateStatus();
    }
  }, [prefs.tokenmetrics_api_key, toast, updateStatus]);

  // Refresh prices for specific symbols
  const refreshPrices = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newPrices = await tokenMetricsApi.getPrices(symbols);
      setPrices(prev => ({ ...prev, ...newPrices }));
      
      // Update database
      await tokenMetricsApi.updateDatabasePrices(symbols);
      
      updateStatus();
      
      toast({
        title: "Prices Refreshed! 🔄",
        description: `Updated prices for ${Object.keys(newPrices).length} symbols.`,
        className: "bg-success text-success-foreground",
      });
      
    } catch (error: any) {
      console.error('Error refreshing prices:', error);
      setError(error.message);
      
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      updateStatus();
    }
  }, [toast, updateStatus]);

  // Get price for symbol
  const getPrice = useCallback((symbol: string): number | null => {
    return tokenMetricsApi.getPrice(symbol);
  }, []);

  // Get token data
  const getTokenData = useCallback((symbol: string): TokenMetricsToken | null => {
    return tokenMetricsApi.getTokenData(symbol);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    tokenMetricsApi.clearCache();
    setTokens([]);
    setPrices({});
    updateStatus();
    
    toast({
      title: "Cache Cleared! 🧹",
      description: "All TokenMetrics cache data has been removed.",
      className: "bg-warning text-warning-foreground",
    });
  }, [toast, updateStatus]);

  // Health check
  const healthCheck = useCallback(async () => {
    return await tokenMetricsApi.healthCheck();
  }, []);

  // Load cached data on mount
  useEffect(() => {
    const cached = tokenMetricsApi.getCachedResponse();
    if (cached?.data) {
      setTokens(cached.data);
      
      // Extract prices from cached data
      const cachedPrices: Record<string, number> = {};
      cached.data.forEach((token: TokenMetricsToken) => {
        if (token.token_symbol) {
          const symbol = token.token_symbol.toUpperCase();
          const price = token.current_price || token.price || token.price_usd || 0;
          if (price > 0) {
            cachedPrices[symbol] = price;
          }
        }
      });
      setPrices(cachedPrices);
    }
    updateStatus();
  }, [updateStatus]);

  // Auto-fetch if enabled and API key is available
  useEffect(() => {
    if (autoFetch && prefs.tokenmetrics_api_key && rateLimitInfo.canMakeCall) {
      fetchTokens();
    }
  }, [autoFetch, prefs.tokenmetrics_api_key, fetchTokens]);

  return {
    tokens,
    prices,
    loading,
    error,
    rateLimitInfo,
    cacheStats,
    fetchTokens,
    refreshPrices,
    getPrice,
    getTokenData,
    clearCache,
    healthCheck
  };
}