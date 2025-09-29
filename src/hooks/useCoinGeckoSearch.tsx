import { useState, useCallback } from 'react';

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  large: string;
}

export interface CoinGeckoSearchResult {
  coins: CoinGeckoCoin[];
}

export function useCoinGeckoSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CoinGeckoCoin[]>([]);

  const searchCoins = useCallback(async (query: string): Promise<CoinGeckoCoin[]> => {
    if (!query || query.length < 2) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json() as CoinGeckoSearchResult;
      const coins = data.coins.slice(0, 10); // Limit to top 10 results
      setResults(coins);
      return coins;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search coins';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    searchCoins,
    clearResults,
    loading,
    error,
    results
  };
}
