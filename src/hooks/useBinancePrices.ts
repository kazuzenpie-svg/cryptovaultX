import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BinancePrices = Record<string, number>; // key: BASE symbol (BTC), value: USDT price

export interface BinanceDebugInfo {
  statusCheckedAt?: number;
  hasCredentials?: boolean | null;
  lastFetchStartedAt?: number;
  lastFetchEndedAt?: number;
  lastRequestUrl?: string;
  httpStatus?: number;
  fetchedRows?: number;
  matchedSymbols?: number;
  errorMessage?: string | null;
}

function normalize(sym: string) {
  return (sym || '').toUpperCase().replace(/\/(USDT|USD)$/,'');
}

export function useBinancePrices(inputSymbols: string[]) {
  const symbols = useMemo(() => Array.from(new Set((inputSymbols || [])
    .map(normalize)
    .filter(Boolean)
  )), [inputSymbols]);

  const [prices, setPrices] = useState<BinancePrices>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingCreds, setMissingCreds] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [debugInfo, setDebugInfo] = useState<BinanceDebugInfo>({});
  const debugEnabled = useMemo(() => {
    try { return localStorage.getItem('binance.debug') === '1'; } catch { return false; }
  }, []);
  const statusCheckingRef = useRef(false);
  const fetchingRef = useRef(false);
  const fetchedOnceRef = useRef(false);
  const lastSymbolsKeyRef = useRef<string>('');

  const fetchStatus = useCallback(async () => {
    if (statusCheckingRef.current) return;
    statusCheckingRef.current = true;
    try {
      const rpc: any = await (supabase as any).rpc('get_binance_credentials_status');
      if (rpc?.error) throw rpc.error;
      const raw = rpc?.data as unknown;
      const first: any = Array.isArray(raw) ? raw[0] : raw;
      const hasCreds = !!(first && first.has_credentials);
      // Avoid redundant updates that can cause loops
      setMissingCreds(prev => (prev === !hasCreds ? prev : !hasCreds));
      setDebugInfo(prev => ({
        ...prev,
        statusCheckedAt: Date.now(),
        hasCredentials: hasCreds,
      }));
      if (debugEnabled) console.debug('[Binance] creds status', first);
    } catch (e: any) {
      const msg = e?.message || 'Failed to check Binance credentials';
      setError(prev => (prev === msg ? prev : msg));
      setDebugInfo(prev => ({ ...prev, statusCheckedAt: Date.now(), errorMessage: msg }));
      if (debugEnabled) console.debug('[Binance] creds status error', e);
      setMissingCreds(prev => (prev === true ? prev : true));
    }
    finally {
      statusCheckingRef.current = false;
    }
  }, []);

  // Ungated fetch used by refreshStatus to avoid relying on state flips
  const fetchPricesUnsafe = useCallback(async () => {
    if (!symbols.length) return;
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(prev => (prev ? prev : true));
    setError(null); // clear any previous error on a new attempt
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // Public endpoint: get all tickers and filter locally
      const url = 'https://api.binance.com/api/v3/ticker/price';
      setDebugInfo(prev => ({ ...prev, lastFetchStartedAt: Date.now(), lastRequestUrl: url, errorMessage: null }));
      if (debugEnabled) console.debug('[Binance] fetch start', { url, symbols });
      const res = await fetch(url, { signal: ctrl.signal });
      setDebugInfo(prev => ({ ...prev, httpStatus: res.status }));
      if (!res.ok) throw new Error(`Binance error ${res.status}`);
      const raw = await res.json();
      const data: Array<{ symbol: string; price: string }> = Array.isArray(raw) ? raw : [];
      const map = new Map<string, number>();
      for (const row of data) {
        if (row && typeof row.symbol === 'string' && typeof row.price === 'string') {
          const num = Number(row.price);
          if (Number.isFinite(num)) {
            map.set(row.symbol.toUpperCase(), num);
          }
        }
      }
      const out: BinancePrices = {};
      for (const base of symbols) {
        if (base === 'USDT' || base === 'USDC' || base === 'DAI') {
          out[base] = 1.0;
          continue;
        }
        const pair = `${base}USDT`;
        const px = map.get(pair);
        if (typeof px === 'number' && Number.isFinite(px)) {
          out[base] = px;
        }
      }
      setPrices(prev => {
        // Only update if changed
        const keys = Object.keys(out);
        if (keys.length === Object.keys(prev).length && keys.every(k => prev[k] === out[k])) {
          return prev;
        }
        return out;
      });
      setDebugInfo(prev => ({
        ...prev,
        lastFetchEndedAt: Date.now(),
        fetchedRows: Array.isArray(data) ? data.length : undefined,
        matchedSymbols: Object.keys(out).length,
        errorMessage: null,
      }));
      fetchedOnceRef.current = true;
      if (debugEnabled) console.debug('[Binance] fetch ok', { rows: Array.isArray(data) ? data.length : 0, matched: Object.keys(out).length });
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const msg = e?.message || 'Failed to fetch Binance prices';
        setError(prev => (prev === msg ? prev : msg));
        setDebugInfo(prev => ({ ...prev, lastFetchEndedAt: Date.now(), errorMessage: msg }));
        if (debugEnabled) console.debug('[Binance] fetch error', e);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [symbols]);

  // Gated fetch used automatically when missingCreds becomes false
  const fetchPrices = useCallback(async () => {
    if (missingCreds === true) return;
    await fetchPricesUnsafe();
  }, [missingCreds, fetchPricesUnsafe]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (missingCreds === false) {
      // Only auto-fetch once per symbols set to prevent UI flicker
      const key = symbols.join(',');
      if (lastSymbolsKeyRef.current !== key) {
        lastSymbolsKeyRef.current = key;
        fetchedOnceRef.current = false;
      }
      if (!fetchedOnceRef.current) {
        fetchPrices();
      }
    }
  }, [missingCreds, fetchPrices, symbols]);

  const manualReload = useCallback(async () => {
    await fetchPrices();
  }, [fetchPrices]);

  const getPrice = useCallback((symbol: string): number | null => {
    const base = normalize(symbol);
    const v = prices[base];
    return typeof v === 'number' ? v : null;
  }, [prices]);

  const refreshStatus = useCallback(async () => {
    // Run status check directly and then fetch without relying on stale state
    await fetchStatus();
    await fetchPricesUnsafe();
  }, [fetchStatus, fetchPricesUnsafe]);

  return { prices, loading, error, missingCreds, manualReload, getPrice, debugInfo, refreshStatus };
}
