import { supabase } from '@/integrations/supabase/client';
import { tokenMetricsService } from '@/services/tokenMetricsService';

export type SimpleCryptoPrice = {
  [key: string]: {
    usdt: number;
    usdt_24h_change?: number;
  };
};

export interface PriceRow {
  id: string; // coingecko id key we use in the app (e.g., 'bitcoin')
  symbol?: string; // optional uppercase ticker (e.g., 'BTC')
  usdt: number;
  usdt_24h_change?: number;
  updated_at: string;
};

// Get cached prices from the crypto_prices table
export async function getCachedSimplePrices(symbols: string[], maxAgeMs: number): Promise<SimpleCryptoPrice> {
  const out: SimpleCryptoPrice = {};
  if (!symbols.length) return out;
  
  try {
    const threshold = new Date(Date.now() - maxAgeMs).toISOString();
    
    // Normalize symbols for database lookup
    const normalizedSymbols = symbols.map(symbol => 
      symbol.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    );
    
    const { data, error } = await supabase
      .from('crypto_prices')
      .select('asset_slug, price_usd, updated_at')
      .in('asset_slug', normalizedSymbols)
      .gte('updated_at', threshold);

    if (error || !data) return out;

    for (const row of data) {
      // Convert back to uppercase symbol for the app
      const symbol = row.asset_slug.toUpperCase();
      out[symbol] = {
        usdt: Number(row.price_usd),
      };
    }
  } catch (error) {
    console.error('Error fetching cached prices:', error);
  }
  
  return out;
}

// Update prices using TokenMetrics API and save to crypto_prices table
// This now uses the 3-hour refresh cycle approach
export async function updatePrices(symbols: string[]): Promise<SimpleCryptoPrice> {
  const out: SimpleCryptoPrice = {};
  if (!symbols.length) return out;
  
  try {
    // Get prices from TokenMetrics service (uses database with 3-hour refresh)
    const prices = await tokenMetricsService.updatePricesForSymbols(symbols);
    
    // Convert to SimpleCryptoPrice format
    Object.keys(prices).forEach(symbol => {
      out[symbol] = {
        usdt: prices[symbol],
      };
    });
    
    // Also cache the raw TokenMetrics response for UI/UX purposes
    try {
      const rawResponse = tokenMetricsService.getCachedRawResponse();
      if (rawResponse) {
        // Store in a separate cache entry
        localStorage.setItem('tokenMetrics_latest_raw_data', JSON.stringify({
          data: rawResponse,
          timestamp: Date.now(),
          symbols: symbols
        }));
      }
    } catch (cacheError) {
      console.warn('Failed to cache raw TokenMetrics response:', cacheError);
    }
    
    return out;
  } catch (error) {
    console.error('Error updating prices:', error);
    // Return cached prices if API fails
    return await getCachedSimplePrices(symbols, 24 * 60 * 60 * 1000); // 24 hours
  }
}

// Get cached raw TokenMetrics response
export function getCachedRawTokenMetricsData(): any {
  try {
    const cachedData = localStorage.getItem('tokenMetrics_latest_raw_data');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Check if data is still fresh (less than 1 hour old)
      if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Error getting cached raw TokenMetrics data:', error);
  }
  
  return null;
}

// Get specific token data from cached response
export function getCachedTokenData(symbol: string): any {
  const cachedResponse = getCachedRawTokenMetricsData();
  
  if (cachedResponse && cachedResponse.data && Array.isArray(cachedResponse.data)) {
    // Find token by symbol (case insensitive)
    return cachedResponse.data.find((token: any) => 
      token.token_symbol && token.token_symbol.toLowerCase() === symbol.toLowerCase()
    );
  }
  
  return null;
}
