import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';

export interface SimpleCryptoPrice {
  [key: string]: {
    usdt: number;
    usdt_24h_change?: number;
  };
}

// Minimal map for IDs we support frequently
const CRYPTO_ID_MAP: { [key: string]: string } = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  ADA: 'cardano',
  SOL: 'solana',
  XRP: 'ripple',
  DOT: 'polkadot',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LTC: 'litecoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  VET: 'vechain',
  FIL: 'filecoin',
  TRX: 'tron',
  ETC: 'ethereum-classic',
  AAVE: 'aave',
  USDT: 'tether',
  USDC: 'usd-coin',
  BUSD: 'binance-usd',
  DAI: 'dai',
  ARB: 'arbitrum',
  OP: 'optimism',
  TIA: 'celestia',
  SUI: 'sui',
  APT: 'aptos',
  SEI: 'sei-network',
  WLD: 'worldcoin-wld',
  DYDX: 'dydx',
  HBAR: 'hedera-hashgraph',
  OM: 'mantra'
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const CACHE_KEYS = {
  simple: 'prices.simple.proxy',
  lastUpdated: 'prices.lastUpdated.proxy',
  lastApiCall: 'prices.lastApiCall.proxy',
} as const;

export function useLivePricesProxy() {
  const [prices, setPrices] = useState<SimpleCryptoPrice>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    try {
      const cachedSimple = cacheGet<SimpleCryptoPrice>(CACHE_KEYS.simple);
      if (cachedSimple) setPrices(cachedSimple);
      const cachedUpdated = cacheGet<number>(CACHE_KEYS.lastUpdated);
      if (typeof cachedUpdated === 'number') setLastUpdated(new Date(cachedUpdated));
      const cachedCall = cacheGet<number>(CACHE_KEYS.lastApiCall);
      if (typeof cachedCall === 'number') setLastApiCall(new Date(cachedCall));
    } catch {}
  }, []);

  const canMakeApiCall = useCallback(() => {
    if (!lastApiCall) return true;
    const delta = Date.now() - lastApiCall.getTime();
    return delta >= CACHE_DURATION;
  }, [lastApiCall]);

  const getCoingeckoId = useCallback((symbol: string): string => {
    const upper = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    return CRYPTO_ID_MAP[upper] || '';
  }, []);

  const getAssetPrice = useCallback((symbol: string): number | null => {
    const id = getCoingeckoId(symbol) || symbol.toLowerCase();
    return prices[id]?.usdt ?? null;
  }, [prices, getCoingeckoId]);

  const fetchPrices = useCallback(async (assets: string[]) => {
    if (!assets.length) return {} as SimpleCryptoPrice;
    if (refreshingRef.current) return prices;
    if (!canMakeApiCall()) return prices;

    refreshingRef.current = true;
    setLoading(true);
    try {
      // Try CoinGecko via Vite dev proxy (/cg)
      const ids = assets.map(getCoingeckoId).filter(Boolean).join(',');
      if (ids.length > 0) {
        const res = await fetch(`/cg/api/v3/simple/price?ids=${ids}&vs_currencies=usdt&include_24hr_change=true`);
        if (res.ok) {
          const data = await res.json();
          setPrices(data);
          const now = new Date();
          setLastUpdated(now);
          setLastApiCall(now);
          cacheSet(CACHE_KEYS.simple, data, CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
          return data as SimpleCryptoPrice;
        }
      }

      // Binance fallback via Vite dev proxy (/binance)
      const uniq = Array.from(new Set(assets.map(a => a.toUpperCase().replace(/\/USDT$|\/USD$/, ''))));
      const toBinance = (s: string) => `${s}USDT`;
      const out: SimpleCryptoPrice = {};
      await Promise.all(uniq.map(async sym => {
        try {
          const r = await fetch(`/binance/api/v3/ticker/price?symbol=${toBinance(sym)}`);
          if (!r.ok) return;
          const { price } = await r.json();
          const id = getCoingeckoId(sym) || sym.toLowerCase();
          const p = parseFloat(price);
          if (Number.isFinite(p)) out[id] = { usdt: p };
        } catch {}
      }));

      if (Object.keys(out).length > 0) {
        setPrices(out);
        const now = new Date();
        setLastUpdated(now);
        setLastApiCall(now);
        cacheSet(CACHE_KEYS.simple, out, CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
        cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
        return out;
      }

      // Final static demo fallback to avoid blank UI
      const demo: SimpleCryptoPrice = {
        bitcoin: { usdt: 43250, usdt_24h_change: 2.5 },
        ethereum: { usdt: 2650, usdt_24h_change: 1.8 },
        'binancecoin': { usdt: 315 },
      };
      setPrices(demo);
      const now = new Date();
      setLastUpdated(now);
      setLastApiCall(now);
      cacheSet(CACHE_KEYS.simple, demo, CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
      return demo;
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [prices, canMakeApiCall, getCoingeckoId]);

  const updatePortfolioWithLivePrices = useCallback(async (assets: string[]) => {
    return fetchPrices(assets);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    lastUpdated,
    getAssetPrice,
    getCoingeckoId,
    updatePortfolioWithLivePrices,
    fetchPrices,
  };
}
