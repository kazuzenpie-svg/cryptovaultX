import { useState, useEffect } from 'react';
import { tokenMetricsService } from '@/services/tokenMetricsService';

interface TokenMetricsData {
  tokenData: any;
  loading: boolean;
  error: string | null;
}

export function useTokenMetricsData(symbol: string) {
  const [data, setData] = useState<TokenMetricsData>({
    tokenData: null,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    if (!symbol) {
      setData({
        tokenData: null,
        loading: false,
        error: 'No symbol provided'
      });
      return;
    }
    
    try {
      // Get token data from cached response
      const tokenData = tokenMetricsService.getTokenDataFromCache(symbol);
      
      if (tokenData) {
        setData({
          tokenData,
          loading: false,
          error: null
        });
      } else {
        setData({
          tokenData: null,
          loading: false,
          error: 'Token data not found in cache'
        });
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
      setData({
        tokenData: null,
        loading: false,
        error: 'Failed to fetch token data'
      });
    }
  }, [symbol]);
  
  // Method to refresh the cached data
  const refreshData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Refresh the specific token
      await tokenMetricsService.refreshAllTokens([symbol]);
      
      // Get updated data
      const tokenData = tokenMetricsService.getTokenDataFromCache(symbol);
      
      if (tokenData) {
        setData({
          tokenData,
          loading: false,
          error: null
        });
      } else {
        setData({
          tokenData: null,
          loading: false,
          error: 'Token data not found after refresh'
        });
      }
    } catch (error) {
      console.error('Error refreshing token data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to refresh token data'
      }));
    }
  };
  
  return {
    ...data,
    refreshData
  };
}

// Hook to get all cached TokenMetrics data
export function useAllTokenMetricsData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const cachedData = tokenMetricsService.getCachedRawResponse();
      setData(cachedData);
    } catch (error) {
      console.error('Error fetching cached data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    data,
    loading
  };
}
