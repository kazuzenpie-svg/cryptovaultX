import { useState, useEffect, useCallback } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';

export interface CryptoIcon {
  id: string;
  symbol: string;
  image: {
    thumb: string;
    small: string;
    large: string;
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

export function useCryptoIcons() {
  const [icons, setIcons] = useState<Record<string, CryptoIcon>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache duration: 24 hours (86400000 ms)
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  const CACHE_KEY = 'crypto.icons';

  // Load cached icons on mount
  useEffect(() => {
    try {
      const cachedIcons = cacheGet<Record<string, CryptoIcon>>(CACHE_KEY);
      if (cachedIcons) {
        setIcons(cachedIcons);
      }
    } catch (error) {
      console.error('Error loading cached crypto icons:', error);
    }
  }, []);

  // Convert asset symbols to CoinGecko IDs
  const getCoingeckoId = useCallback((symbol: string): string => {
    const upperSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    const mapped = CRYPTO_ID_MAP[upperSymbol];
    return mapped ? mapped : '';
  }, []);

  // Get icon URL for a crypto symbol
  const getIconUrl = useCallback((symbol: string, size: 'thumb' | 'small' | 'large' = 'thumb'): string => {
    const coingeckoId = getCoingeckoId(symbol);
    const icon = icons[coingeckoId];

    if (icon && icon.image && icon.image[size]) {
      return icon.image[size];
    }

    // Return fallback icon if no icon found
    return '/coin-fallback.svg';
  }, [icons, getCoingeckoId]);

  // Check if icon exists for a symbol
  const hasIcon = useCallback((symbol: string): boolean => {
    const coingeckoId = getCoingeckoId(symbol);
    return !!icons[coingeckoId];
  }, [icons, getCoingeckoId]);

  // Fetch icons for multiple crypto symbols
  const fetchIcons = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return;

    // Check cache first
    const cachedIcons = cacheGet<Record<string, CryptoIcon>>(CACHE_KEY);
    if (cachedIcons) {
      setIcons(cachedIcons);
      return cachedIcons;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert symbols to CoinGecko IDs
      const coingeckoIds = symbols
        .map(getCoingeckoId)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
        .join(',');

      if (!coingeckoIds) {
        console.log('No valid CoinGecko IDs found for symbols:', symbols);
        return {};
      }

      // Fetch from CoinGecko API
      const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usdt&ids=${coingeckoIds}&per_page=100&page=1&sparkline=false`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as CryptoIcon[];

      // Convert array to object keyed by ID
      const iconsMap: Record<string, CryptoIcon> = {};
      data.forEach((icon) => {
        iconsMap[icon.id] = icon;
      });

      setIcons(iconsMap);

      // Cache the icons
      cacheSet(CACHE_KEY, iconsMap, CACHE_DURATION);

      console.log(`✅ Successfully fetched ${data.length} crypto icons`);
      return iconsMap;

    } catch (error: any) {
      console.error('Error fetching crypto icons:', error);
      setError(error.message || 'Failed to fetch crypto icons');

      // Return empty object on error
      return {};
    } finally {
      setLoading(false);
    }
  }, [getCoingeckoId]);

  // Preload common crypto icons
  useEffect(() => {
    const commonSymbols = Object.keys(CRYPTO_ID_MAP);
    fetchIcons(commonSymbols);
  }, [fetchIcons]);

  return {
    icons,
    loading,
    error,
    getIconUrl,
    hasIcon,
    fetchIcons,
    getCoingeckoId
  };
}
