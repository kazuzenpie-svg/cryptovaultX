import { useState, useEffect, useMemo } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

interface CoinGeckoResponse {
  [key: string]: CoinGeckoToken;
}

// Rate limiting: one request per token every 1 minute
const RATE_LIMIT_MS = 60000;
const rateLimitMap = new Map<string, number>();

// Cache TTL: 24 hours for icons (not real-time)
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export function useCoinGeckoTokens(tokenIds: string[]) {
  const [tokens, setTokens] = useState<Map<string, CoinGeckoToken>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified: only fetch if we don't have the token data
  const tokensToFetch = useMemo(() => {
    return tokenIds.filter(tokenId => !tokens.has(tokenId));
  }, [tokenIds, tokens]);

  const fetchTokens = async (ids: string[]) => {
    if (ids.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch tokens one by one with 1-minute intervals to avoid rate limiting
      for (let i = 0; i < ids.length; i++) {
        const tokenId = ids[i];

        // Check if we already have this token in memory
        if (tokens.has(tokenId)) {
          continue;
        }

        try {
          const response = await fetch(
            `/cg/api/v3/coins/markets?vs_currency=usd&ids=${tokenId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json() as CoinGeckoToken[];
            if (data.length > 0) {
              processTokenData([data[0]]);
            }
          } else if (response.status === 429) {
            // Hit rate limit, wait 1 minute before trying again
            console.log(`Rate limited for ${tokenId}, waiting 1 minute...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            i--; // Retry this token
            continue;
          }
        } catch (err) {
          console.error(`Failed to fetch ${tokenId}:`, err);
        }

        // Wait 1 minute between requests (except for the last one)
        if (i < ids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token data');
      console.error('CoinGecko fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processTokenData = (data: CoinGeckoToken[]) => {
    setTokens(prev => {
      const newMap = new Map(prev);
      data.forEach(token => {
        newMap.set(token.id, token);
        // Update rate limit timestamp
        rateLimitMap.set(token.id, Date.now());
      });
      return newMap;
    });
  };

  // Fetch tokens that need updating (only when explicitly needed)
  useEffect(() => {
    if (tokensToFetch.length > 0) {
      fetchTokens(tokensToFetch);
    }
  }, [tokensToFetch]);

  const getTokenData = (tokenId: string): CoinGeckoToken | null => {
    return tokens.get(tokenId) || null;
  };

  const getTokenIcon = (tokenId: string): string | null => {
    const token = tokens.get(tokenId);
    return token?.image || null;
  };

  const getTokenPrice = (tokenId: string): number | null => {
    const token = tokens.get(tokenId);
    return token?.current_price || null;
  };

  const getTokenChange24h = (tokenId: string): number | null => {
    const token = tokens.get(tokenId);
    return token?.price_change_percentage_24h || null;
  };

  return {
    tokens: Array.from(tokens.values()),
    loading,
    error,
    getTokenData,
    getTokenIcon,
    getTokenPrice,
    getTokenChange24h,
    rateLimitInfo: {
      nextFetchIn: Math.max(0, RATE_LIMIT_MS - (Date.now() - Math.max(...Array.from(rateLimitMap.values())))),
      tokensToFetch: tokensToFetch.length
    }
  };
}
