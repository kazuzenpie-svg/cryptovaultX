import { useCallback, useMemo } from 'react';

export interface UseTokenMetricsApiResult {
  connected: boolean; // last fetch succeeded recently
  lastUpdated?: number;
  getPrice: (symbol: string) => number | undefined;
  error?: string;
}

/**
 * Poll TokenMetrics REST API for latest token prices by symbol.
 * - symbols: symbols without suffix (e.g., ['BTC','XRP','OM'])
 * - apiKey: TokenMetrics API key
 * - intervalMs: polling interval (default 15000ms)
 */
export function useTokenMetricsApi(symbols: string[], _apiKey?: string, _intervalMs: number = 15000): UseTokenMetricsApiResult {
  // Maintain stable memoized normalized list (unused in stub, keeps API shape consistent)
  useMemo(() => Array.from(new Set((symbols || [])
    .map(s => (s || '').toUpperCase().replace(/\/(USDT|USD)$/,'').trim())
    .filter(Boolean)
  )), [symbols]);

  // Stubbed: no network. Always disconnected, no error, no updates.
  const getPrice = useCallback((symbol: string) => {
    // Placeholder: no live price, return undefined to indicate absence
    return undefined;
  }, []);

  return { connected: false, lastUpdated: undefined, getPrice, error: undefined };
}
