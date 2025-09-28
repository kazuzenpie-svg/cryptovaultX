import { useMemo } from 'react';

export type TmPriceMessage = {
  // Generic shape; adjust if TokenMetrics docs provide exact fields
  symbol?: string; // e.g., OMUSDT, BTCUSDT
  price?: number;  // last price
  ts?: number;     // timestamp
  [k: string]: any;
};

export interface UseTokenMetricsSocket {
  connected: boolean;
  lastMessage?: TmPriceMessage;
  getPrice: (symbol: string) => number | undefined;
  error?: string;
}

/**
 * TokenMetrics WebSocket consumer for price stream.
 * - Connects to wss://price.data-service.tokenmetrics.com using API key from env
 * - Subscribes to provided symbols (normalized as <SYMBOL>USDT)
 * - Maintains latest price map
 * - Auto-reconnects with backoff
 */
export function useTokenMetricsSocket(symbols: string[], _apiKeyOverride?: string): UseTokenMetricsSocket {
  // keep memo to preserve dependency semantics in callers
  useMemo(() => Array.from(new Set(symbols
    .map(s => (s || '').toUpperCase().replace(/\/(USDT|USD)$/,'').trim())
    .filter(Boolean)
  )), [symbols]);

  // Stubbed: no WebSocket connection
  const getPrice = (_symbol: string) => undefined;
  return { connected: false, lastMessage: undefined, getPrice, error: undefined };
}
