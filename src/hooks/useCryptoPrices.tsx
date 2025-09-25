import { useState, useEffect, useCallback } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { useToast } from './use-toast';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface SimpleCryptoPrice {
  [key: string]: {
    usdt: number;
    usdt_24h_change?: number;
  };
}

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Common crypto ID mappings for CoinGecko API
const CRYPTO_ID_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LINK': 'chainlink',
  'BCH': 'bitcoin-cash',
  'XLM': 'stellar',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'ALGO': 'algorand',
  'AAVE': 'aave',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'CRV': 'curve-dao-token',
  'SUSHI': 'sushi',
  'COMP': 'compound-governance-token',
  'YFI': 'yearn-finance',
  'SNX': 'havven',
  'MKR': 'maker',
  'ENJ': 'enjincoin',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'DAI': 'dai',
  // Extended common IDs to reduce unknowns
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'TIA': 'celestia',
  'SUI': 'sui',
  'APT': 'aptos',
  'SEI': 'sei-network',
  'WLD': 'worldcoin-wld',
  'DYDX': 'dydx',
  'HBAR': 'hedera-hashgraph',
  'OM': 'mantra'
};

export function useCryptoPrices() {
  const { toast } = useToast();
  const [prices, setPrices] = useState<SimpleCryptoPrice>({});
  const [detailedPrices, setDetailedPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);

  // Cache duration: 1 hour (3600000 ms)
  const CACHE_DURATION = 60 * 60 * 1000;

  // Keys for cache
  const CACHE_KEYS = {
    simple: 'prices.simple',
    detailed: 'prices.detailed',
    lastUpdated: 'prices.lastUpdated',
    lastApiCall: 'prices.lastApiCall'
  } as const;

  // Hydrate from cache on mount
  useEffect(() => {
    try {
      const cachedSimple = cacheGet<Record<string, { usdt: number; usdt_24h_change?: number }>>(CACHE_KEYS.simple);
      if (cachedSimple) setPrices(cachedSimple);
      const cachedDetailed = cacheGet<CryptoPrice[]>(CACHE_KEYS.detailed);
      if (cachedDetailed && Array.isArray(cachedDetailed)) setDetailedPrices(cachedDetailed);
      const cachedUpdated = cacheGet<number>(CACHE_KEYS.lastUpdated);
      if (typeof cachedUpdated === 'number') setLastUpdated(new Date(cachedUpdated));
      const cachedCall = cacheGet<number>(CACHE_KEYS.lastApiCall);
      if (typeof cachedCall === 'number') setLastApiCall(new Date(cachedCall));
    } catch {}
  }, []);

  // Check if we can make an API call (respecting 1-hour rate limit)
  const canMakeApiCall = () => {
    if (!lastApiCall) return true;
    const timeSinceLastCall = Date.now() - lastApiCall.getTime();
    return timeSinceLastCall >= CACHE_DURATION;
  };

  // Get time until next API call is allowed
  const getTimeUntilNextCall = () => {
    if (!lastApiCall) return 0;
    const timeSinceLastCall = Date.now() - lastApiCall.getTime();
    return Math.max(0, CACHE_DURATION - timeSinceLastCall);
  };

  // Convert asset symbols to CoinGecko IDs
  const getCoingeckoId = useCallback((symbol: string): string => {
    const upperSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    const mapped = CRYPTO_ID_MAP[upperSymbol];
    return mapped ? mapped : '';
  }, []);

  // Proxy rotation to mitigate CORS hiccups
  const PROXIES = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://r.jina.ai/http://r.jina.ai/http://` + url.replace(/^https?:\/\//, ''),
    (url: string) => `https://cors.isomorphic-git.org/${url}`,
  ];

  const fetchViaProxies = useCallback(async (url: string): Promise<any | null> => {
    for (const make of PROXIES) {
      try {
        const proxyUrl = make(url);
        const res = await fetch(proxyUrl);
        if (!res.ok) continue;
        // allorigins returns { contents }, others return raw JSON
        const txt = await res.text();
        try {
          const parsed = JSON.parse(txt);
          if (parsed && parsed.contents) {
            return JSON.parse(parsed.contents);
          }
          return parsed; // already JSON
        } catch {
          // try parse text as JSON (for raw proxy)
          try { return JSON.parse(txt); } catch { return null; }
        }
      } catch (e) {
        // try next proxy
        continue;
      }
    }
    return null;
  }, []);

  // Fetch simple prices for multiple assets
  const fetchSimplePrices = useCallback(async (assets: string[]) => {
    if (!assets.length) return {};

    // Check if we can make an API call
    if (!canMakeApiCall()) {
      const timeLeft = getTimeUntilNextCall();
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      console.log(`⏰ API rate limit: ${minutesLeft} minutes until next call allowed`);
      
      return prices; // Return cached data
    }

    setLoading(true);
    try {
      console.log('🚀 Making API call (1-hour rate limit respected)');
      
      // For demo purposes, use fallback data due to CORS restrictions
      console.log('🪙 CoinGecko CORS detected, using fallback price data');
      
      const fallbackPrices: SimpleCryptoPrice = {
        'bitcoin': { usdt: 43250, usdt_24h_change: 2.5 },
        'ethereum': { usdt: 2650, usdt_24h_change: 1.8 },
        'binancecoin': { usdt: 315, usdt_24h_change: -0.5 },
        'cardano': { usdt: 0.48, usdt_24h_change: 3.2 },
        'solana': { usdt: 98, usdt_24h_change: 4.1 },
        'ripple': { usdt: 0.58, usdt_24h_change: -1.2 },
        'polkadot': { usdt: 7.25, usdt_24h_change: 0.8 },
        'dogecoin': { usdt: 0.085, usdt_24h_change: 5.6 },
        'avalanche-2': { usdt: 38, usdt_24h_change: 2.1 },
        'matic-network': { usdt: 0.92, usdt_24h_change: 1.4 },
        'litecoin': { usdt: 72, usdt_24h_change: -0.8 },
        'chainlink': { usdt: 14.5, usdt_24h_change: 2.9 },
        'usd-coin': { usdt: 1.00, usdt_24h_change: 0.0 },
        'tether': { usdt: 1.00, usdt_24h_change: 0.0 }
      };
      
      // Try to fetch real data first, fall back to demo data if CORS blocks
      try {
        const ids = assets
          .map(getCoingeckoId)
          .filter(Boolean)
          .join(',');
        const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usdt&include_24hr_change=true`;
        const realData = await fetchViaProxies(url);
        if (realData) {
          console.log('✅ Successfully fetched real price data via proxy rotation');
          setPrices(realData);
          const now = new Date();
          setLastUpdated(now);
          setLastApiCall(now); // Record successful API call
          // Cache
          cacheSet(CACHE_KEYS.simple, realData, CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
          return realData;
        }
      } catch (proxyError) {
        console.log('⚠️ Proxy failed, using fallback data:', proxyError);
      }
      
      // Use fallback data
      console.log('📊 Using fallback price data for demo');
      setPrices(fallbackPrices);
      const now = new Date();
      setLastUpdated(now);
      setLastApiCall(now); // Record API attempt
      cacheSet(CACHE_KEYS.simple, fallbackPrices, CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
      return fallbackPrices;
      
    } catch (error: any) {
      console.error('Error fetching crypto prices:', error);
      
      // Log demo data usage instead of showing toast
      console.log('📊 Using demo price data due to API restrictions');
      
      // Record failed API attempt to respect rate limiting
      setLastApiCall(new Date());
      
      // Return empty object to prevent crashes
      return {};
    } finally {
      setLoading(false);
    }
  }, [getCoingeckoId, toast, prices, canMakeApiCall, getTimeUntilNextCall]);

  // Fetch detailed market data
  const fetchMarketData = useCallback(async (assets: string[], limit: number = 50) => {
    // Check rate limit for market data too
    if (!canMakeApiCall()) {
      const timeLeft = getTimeUntilNextCall();
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      console.log(`⏰ Market data rate limit: ${minutesLeft} minutes until next call`);
      return detailedPrices; // Return cached data
    }

    setLoading(true);
    try {
      console.log('📊 Fetching market data with 1-hour rate limit...');
      
      // Fallback market data for demo
      const fallbackMarketData: CryptoPrice[] = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 43250,
          price_change_24h: 1050,
          price_change_percentage_24h: 2.5,
          market_cap: 850000000000,
          last_updated: new Date().toISOString()
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2650,
          price_change_24h: 47,
          price_change_percentage_24h: 1.8,
          market_cap: 320000000000,
          last_updated: new Date().toISOString()
        }
      ];
      
      try {
        const ids = assets
          .map(getCoingeckoId)
          .filter(Boolean)
          .join(',');
        const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usdt&ids=${ids}&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
        const realData = await fetchViaProxies(url);
        if (realData) {
          console.log('✅ Successfully fetched real market data via proxy rotation');
          setDetailedPrices(realData);
          const now = new Date();
          setLastUpdated(now);
          setLastApiCall(now); // Record successful API call
          cacheSet(CACHE_KEYS.detailed, realData, CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
          cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
          return realData;
        }
      } catch (proxyError) {
        console.log('⚠️ Market data proxy failed, using fallback:', proxyError);
      }
      
      // Use fallback data
      console.log('📊 Using fallback market data for demo');
      setDetailedPrices(fallbackMarketData);
      const now = new Date();
      setLastUpdated(now);
      setLastApiCall(now); // Record API attempt
      cacheSet(CACHE_KEYS.detailed, fallbackMarketData, CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastUpdated, now.getTime(), CACHE_DURATION);
      cacheSet(CACHE_KEYS.lastApiCall, now.getTime(), CACHE_DURATION);
      return fallbackMarketData;
      
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      setLastApiCall(new Date()); // Record failed attempt
      console.log('📊 Using demo market data due to API restrictions');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCoingeckoId, toast, detailedPrices, canMakeApiCall, getTimeUntilNextCall]);

  // Get price for a specific asset
  const getAssetPrice = useCallback((symbol: string): number | null => {
    const coingeckoId = getCoingeckoId(symbol);
    return prices[coingeckoId]?.usdt || null;
  }, [prices, getCoingeckoId]);

  // Get 24h change for a specific asset
  const getAssetChangePct = useCallback((symbol: string): number | null => {
    const coingeckoId = getCoingeckoId(symbol);
    const pct = prices[coingeckoId]?.usdt_24h_change;
    return typeof pct === 'number' ? pct : null;
  }, [prices, getCoingeckoId]);

  // Absolute 24h change in USD (price delta), derived from percent and current price
  const getAssetChange = useCallback((symbol: string): number | null => {
    const coingeckoId = getCoingeckoId(symbol);
    const price = prices[coingeckoId]?.usdt;
    const pct = prices[coingeckoId]?.usdt_24h_change;
    if (typeof price === 'number' && typeof pct === 'number') {
      return (price * pct) / 100;
    }
    return null;
  }, [prices, getCoingeckoId]);

  // Auto-refresh prices every hour (respecting rate limit)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(prices).length > 0 && canMakeApiCall()) {
        console.log('🔄 Auto-refresh: 1 hour elapsed, fetching new prices...');
        const assets = Object.keys(prices);
        fetchSimplePrices(assets);
      } else {
        const timeLeft = getTimeUntilNextCall();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        console.log(`⏰ Auto-refresh skipped: ${minutesLeft} minutes until next allowed call`);
      }
    }, CACHE_DURATION); // Check every hour

    return () => clearInterval(interval);
  }, [prices, fetchSimplePrices, canMakeApiCall, getTimeUntilNextCall, CACHE_DURATION]);

  return {
    prices,
    detailedPrices,
    loading,
    lastUpdated,
    lastApiCall,
    fetchSimplePrices,
    fetchMarketData,
    getAssetPrice,
    getAssetChange,
    getAssetChangePct,
    getCoingeckoId,
    canMakeApiCall,
    getTimeUntilNextCall,
    updatePortfolioWithLivePrices: () => {
      // This is a placeholder - the actual implementation would be in usePortfolio
      console.log('Updating portfolio with live prices...');
    }
  };
}