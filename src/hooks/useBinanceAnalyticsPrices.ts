import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBinancePrices } from '@/hooks/useBinancePrices';

export interface Ticker24h {
  symbol: string;        // e.g., BTCUSDT
  lastPrice: string;     // last price
  priceChangePercent: string; // 24h change % as string
}

function norm(sym: string) {
  return (sym || '').toUpperCase().replace(/\/(USDT|USD)$/,'');
}

export function useBinanceAnalyticsPrices(symbolsInput: string[]) {
  const symbols = useMemo(() => Array.from(new Set((symbolsInput || []).map(norm).filter(Boolean))), [symbolsInput]);

  const { prices, missingCreds, loading, error, manualReload, refreshStatus } = useBinancePrices(symbols);
  const [pctMap, setPctMap] = useState<Record<string, number>>({});
  const loadingPctRef = useRef(false);
  const fetchedKeyRef = useRef<string>('');

  const fetch24h = useCallback(async () => {
    if (!symbols.length) return;
    if (missingCreds === true) return;
    if (loadingPctRef.current) return;
    const key = symbols.join(',');
    if (fetchedKeyRef.current === key) return; // already fetched for this set

    loadingPctRef.current = true;
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!res.ok) throw new Error(`Binance 24hr error ${res.status}`);
      const raw: any = await res.json();
      const arr: Ticker24h[] = Array.isArray(raw) ? raw : [];
      const out: Record<string, number> = {};
      for (const row of arr) {
        if (!row || typeof row.symbol !== 'string') continue;
        const s = row.symbol.toUpperCase();
        if (!s.endsWith('USDT')) continue;
        const base = s.replace(/USDT$/,'');
        if (!symbols.includes(base)) continue;
        const pct = Number(row.priceChangePercent);
        if (Number.isFinite(pct)) out[base] = pct;
      }
      setPctMap(prev => {
        const changed = Object.keys(out).some(k => prev[k] !== out[k]) || Object.keys(prev).length !== Object.keys(out).length;
        return changed ? out : prev;
      });
      fetchedKeyRef.current = key;
    } catch (e) {
      // swallow; percent is optional
    } finally {
      loadingPctRef.current = false;
    }
  }, [symbols, missingCreds]);

  useEffect(() => { fetch24h(); }, [fetch24h]);
  useEffect(() => { if (missingCreds === null) refreshStatus(); }, [missingCreds, refreshStatus]);

  const getAssetPrice = useCallback((symbol: string): number | null => {
    const base = norm(symbol);
    const v = prices[base];
    return typeof v === 'number' ? v : null;
  }, [prices]);

  const getAssetChangePct = useCallback((symbol: string): number | null => {
    const base = norm(symbol);
    const v = pctMap[base];
    return typeof v === 'number' ? v : null;
  }, [pctMap]);

  return { getAssetPrice, getAssetChangePct, loading: !!loading, error: error || null, missingCreds, manualReload };
}
