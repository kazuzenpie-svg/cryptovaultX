import { useEffect, useState } from 'react';
import { tokenMetricsService } from '@/services/tokenMetricsService';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface TokenMetricsFetcherProps {
  symbols: string[];
  onPricesUpdate: (prices: Record<string, number>) => void;
}

export function TokenMetricsFetcher({ symbols, onPricesUpdate }: TokenMetricsFetcherProps) {
  const { prefs } = useUserPreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set API key for TokenMetrics service
  useEffect(() => {
    if (prefs.tokenmetrics_api_key) {
      tokenMetricsService.setApiKey(prefs.tokenmetrics_api_key);
    }
  }, [prefs.tokenmetrics_api_key]);

  // Fetch prices for specific symbols (will use database and refresh only missing tokens)
  const fetchPrices = async () => {
    if (!prefs.tokenmetrics_api_key || symbols.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`TokenMetricsFetcher: Fetching prices for ${symbols.length} symbols`);
      const prices = await tokenMetricsService.updatePricesForSymbols(symbols);
      console.log(`TokenMetricsFetcher: Received prices for ${Object.keys(prices).length} symbols`);
      onPricesUpdate(prices);
      
      // Also cache the raw response for UI/UX purposes
      const rawResponse = tokenMetricsService.getCachedRawResponse();
      if (rawResponse) {
        console.log('TokenMetricsFetcher: Raw response cached for UI/UX');
      }
    } catch (err) {
      console.error('TokenMetricsFetcher: Error fetching TokenMetrics prices:', err);
      setError('Failed to fetch prices from TokenMetrics');
    } finally {
      setLoading(false);
    }
  };
  
  // Get raw TokenMetrics data for UI/UX and calculation
  const getRawTokenMetricsData = () => {
    return tokenMetricsService.getCachedRawResponse();
  };
  
  // Get specific token data for UI/UX
  const getTokenData = (symbol: string) => {
    return tokenMetricsService.getTokenDataFromCache(symbol);
  };
  
  // Refresh specific tokens and get updated data
  const refreshAndGetData = async (specificSymbols: string[]) => {
    try {
      await tokenMetricsService.refreshAllTokens(specificSymbols);
      const updatedData = tokenMetricsService.getCachedRawResponse();
      return updatedData;
    } catch (err) {
      console.error('TokenMetricsFetcher: Error refreshing data:', err);
      return null;
    }
  };
  
  // Expose methods for parent components to use
  useEffect(() => {
    // Make methods available to parent components if needed
    // This could be done through a context or ref callback
  }, []);
  
  // Add a method to manually trigger refresh for specific symbols
  const refreshSpecificPrices = async (specificSymbols: string[]) => {
    if (!prefs.tokenmetrics_api_key || specificSymbols.length === 0) {
      return {};
    }
    
    try {
      console.log(`TokenMetricsFetcher: Refreshing specific prices for ${specificSymbols.length} symbols`);
      // Use the targeted refresh method
      await tokenMetricsService.refreshAllTokens(specificSymbols);
      // Get updated prices from database
      const prices = await tokenMetricsService.getPricesFromDatabase(specificSymbols, 1);
      return prices;
    } catch (err) {
      console.error('TokenMetricsFetcher: Error refreshing specific prices:', err);
      return {};
    }
  };

  // No automatic fetching - manual reload only
  useEffect(() => {
    // Prices will be loaded from cache or fetched manually
  }, []);
  
  // Removed auto-refresh - manual reload only
  useEffect(() => {
    // No automatic refresh
  }, []);

  return null; // This component doesn't render anything, it just fetches data
}
