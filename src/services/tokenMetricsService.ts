import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderPrices } from '@/lib/pricePlaceholders';

interface TokenMetricsPrice {
  symbol: string;
  price_usd: number;
  timestamp: number;
}

interface TokenMetricsToken {
  token_symbol: string;
  token_name: string;
  current_price: number;
  price: number;
  price_usd: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  price_change_percentage_24_h_in_currency: number;
  fully_diluted_valuation: number;
  slug: string;
}

export class TokenMetricsService {
  private static instance: TokenMetricsService;
  private apiKey: string | null = null;
  private lastCallTime: number = 0;
  private readonly RATE_LIMIT_MS = 30000; // 30 seconds between calls to be safe
  private isRefreshing: boolean = false; // Prevent concurrent refreshes
  private refreshQueue: Array<() => void> = []; // Queue for pending requests

  private constructor() {}

  public static getInstance(): TokenMetricsService {
    if (!TokenMetricsService.instance) {
      TokenMetricsService.instance = new TokenMetricsService();
    }
    return TokenMetricsService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - timeSinceLastCall;
      console.log(`Rate limit: waiting ${delay}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastCallTime = Date.now();
    console.log(`API call allowed at ${new Date(this.lastCallTime).toISOString()}`);
  }

  // Fetch specific tokens from TokenMetrics API
  public async fetchTokensBySymbols(symbols: string[], retryCount = 0): Promise<TokenMetricsPrice[]> {
    // Stubbed: no external API calls for crypto prices
    if (symbols.length === 0) return [];
    return [];
  }
  
  // Fetch all tokens from TokenMetrics API (limited to top 500 to reduce load)
  public async fetchAllTokens(retryCount = 0): Promise<TokenMetricsPrice[]> {
    // Stubbed: no external API calls for crypto prices
    return [];
  }

  public async fetchPrices(symbols: string[]): Promise<TokenMetricsPrice[]> {
    // For individual symbol requests, get from database first
    // If not in database or stale, we'll update all tokens periodically
    return [];
  }

  public async savePricesToDatabase(prices: TokenMetricsPrice[]): Promise<void> {
    if (prices.length === 0) return;

    try {
      // Convert TokenMetrics prices to database format
      const dbPrices = prices.map(price => ({
        asset_slug: price.symbol.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        price_usd: price.price_usd,
        updated_at: new Date().toISOString(),
        source: 'tokenmetrics.com'
      }));

      // Insert or update prices in the database
      const { error } = await supabase
        .from('crypto_prices')
        .upsert(dbPrices, {
          onConflict: 'asset_slug'
        });

      if (error) {
        console.error('Error saving prices to database:', error);
        throw error;
      }

      console.log(`Successfully saved ${prices.length} prices to database`);
    } catch (error) {
      console.error('Error in savePricesToDatabase:', error);
      throw error;
    }
  }

  public async getPricesFromDatabase(symbols: string[], maxAgeHours: number = 24): Promise<Record<string, number>> {
    if (symbols.length === 0) return {};

    try {
      // Normalize symbols for database lookup
      const normalizedSymbols = symbols.map(symbol => 
        symbol.toLowerCase().replace(/[^a-z0-9_-]/g, '')
      );
      
      // Calculate threshold based on max age
      const threshold = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000)).toISOString();

      const { data, error } = await supabase
        .from('crypto_prices')
        .select('asset_slug, price_usd')
        .in('asset_slug', normalizedSymbols)
        .gte('updated_at', threshold);

      if (error) {
        console.error('Error fetching prices from database:', error);
        return {};
      }

      // Convert to a map for easy lookup
      const priceMap: Record<string, number> = {};
      data.forEach(row => {
        priceMap[row.asset_slug.toUpperCase()] = Number(row.price_usd);
      });

      return priceMap;
    } catch (error) {
      console.error('Error in getPricesFromDatabase:', error);
      return {};
    }
  }

  // Check if we need to refresh all tokens (every 6 hours, with additional checks)
  private shouldRefreshAllTokens(): boolean {
    const lastRefresh = localStorage.getItem('tokenMetrics_lastRefresh');
    if (!lastRefresh) return true;
    
    const lastRefreshTime = parseInt(lastRefresh, 10);
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    
    // Additional check: don't refresh if last call was less than 2 hours ago
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    if (this.lastCallTime > twoHoursAgo) {
      console.log('Skipping refresh: last API call was less than 2 hours ago');
      return false;
    }
    
    return lastRefreshTime < sixHoursAgo;
  }

  // Update all tokens in database (only called manually)
  public async refreshAllTokens(specificSymbols?: string[]): Promise<void> {
    // Stubbed: do nothing; no external refresh
    return;
  }
  
  // Process queued refresh requests
  private processQueue(): void {
    console.log(`Processing ${this.refreshQueue.length} queued refresh requests`);
    while (this.refreshQueue.length > 0) {
      const resolve = this.refreshQueue.shift();
      if (resolve) {
        resolve();
      }
    }
  }

  // Get cached raw JSON response for UI/UX and calculation purposes
  public getCachedRawResponse(): any {
    try {
      // Get all cached responses and find the most recent one
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('tokenMetrics_raw_response_')
      );
      
      if (keys.length === 0) {
        return null;
      }
      
      // Sort by timestamp (newest first)
      keys.sort((a, b) => {
        const timeA = parseInt(a.split('_').pop() || '0', 10);
        const timeB = parseInt(b.split('_').pop() || '0', 10);
        return timeB - timeA;
      });
      
      const latestKey = keys[0];
      const cachedData = localStorage.getItem(latestKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Error getting cached raw response:', error);
    }
    
    return null;
  }
  
  // Get specific token data from cached response for UI/UX
  public getTokenDataFromCache(symbol: string): any {
    const cachedResponse = this.getCachedRawResponse();
    
    if (cachedResponse && cachedResponse.data && Array.isArray(cachedResponse.data)) {
      // Find token by symbol (case insensitive)
      return cachedResponse.data.find((token: any) => 
        token.token_symbol && token.token_symbol.toLowerCase() === symbol.toLowerCase()
      );
    }
    
    return null;
  }
  
  public async updatePricesForSymbols(symbols: string[]): Promise<Record<string, number>> {
    try {
      // Only use database cache; no external refresh
      const prices = await this.getPricesFromDatabase(symbols, 24);
      const filtered: Record<string, number> = {};
      symbols.forEach(sym => { if (prices[sym]) filtered[sym] = prices[sym]; });

      // Fill any missing symbols with deterministic placeholders
      const missing = symbols.filter(sym => filtered[sym] === undefined);
      if (missing.length > 0) {
        const placeholders = getPlaceholderPrices(missing);
        for (const k of Object.keys(placeholders)) {
          filtered[k] = placeholders[k];
        }
      }
      return filtered;
    } catch (error) {
      console.error('Error updating prices for symbols (stubbed):', error);
      return {};
    }
  }
}

// Export a singleton instance
export const tokenMetricsService = TokenMetricsService.getInstance();
