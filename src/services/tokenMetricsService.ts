import { supabase } from '@/integrations/supabase/client';

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
    const MAX_RETRIES = 1; // Reduce retries to avoid prolonged delays
    const BASE_DELAY = 30000; // 30 seconds base delay
    
    if (!this.apiKey) {
      throw new Error('TokenMetrics API key not set');
    }
    
    if (symbols.length === 0) {
      return [];
    }
    
    // Limit to 25 symbols per request to be even more conservative
    const limitedSymbols = symbols.slice(0, 25);
    
    try {
      // Respect rate limit
      await this.respectRateLimit();
      
      // Fetch specific tokens by symbol - exactly as requested
      const symbolList = limitedSymbols.map(s => encodeURIComponent(s.toLowerCase())).join(',');
      const url = `https://api.tokenmetrics.com/v3/tokens?symbol=${symbolList}&limit=25&page=1`;
      
      console.log(`Fetching specific tokens from TokenMetrics API: ${symbolList}`);
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch tokens: ${response.status}`);
        
        if (response.status === 429) {
          console.error('Rate limit exceeded.');
          
          // If we've hit rate limit, implement exponential backoff
          if (retryCount < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
            console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            this.lastCallTime = Date.now() + delay;
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchTokensBySymbols(symbols, retryCount + 1);
          } else {
            console.error('Max retries reached for rate limit. Waiting 10 minutes before next attempt.');
            this.lastCallTime = Date.now() + 600000; // Wait 10 minutes
            return [];
          }
        }
        
        return [];
      }
      
      const data: any = await response.json();
      
      // Cache the raw JSON response for debugging and analysis
      try {
        localStorage.setItem(`tokenMetrics_raw_response_${Date.now()}`, JSON.stringify(data));
        console.log('Cached raw TokenMetrics response for debugging');
      } catch (cacheError) {
        console.warn('Failed to cache raw response:', cacheError);
      }
      
      // Extract price data from TokenMetrics response
      const prices: TokenMetricsPrice[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        // Process tokens
        data.data.forEach((token: TokenMetricsToken) => {
          const symbol = token.token_symbol?.toUpperCase();
          
          // Only include tokens with valid price and symbol
          const price = token.current_price || token.price || token.price_usd || 0;
          if (symbol && price > 0) {
            prices.push({
              symbol: symbol,
              price_usd: price,
              timestamp: Date.now()
            });
          }
        });
      }
      
      console.log(`Successfully fetched prices for ${prices.length} tokens`);
      return prices;
    } catch (error) {
      console.error('Error fetching TokenMetrics tokens:', error);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchTokensBySymbols(symbols, retryCount + 1);
      }
      
      return [];
    }
  }
  
  // Fetch all tokens from TokenMetrics API (limited to top 500 to reduce load)
  public async fetchAllTokens(retryCount = 0): Promise<TokenMetricsPrice[]> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 10000; // 10 seconds
    
    if (!this.apiKey) {
      throw new Error('TokenMetrics API key not set');
    }

    try {
      // Respect rate limit
      await this.respectRateLimit();
      
      // Fetch top 500 tokens by market cap (reduced from 1000)
      const url = `https://api.tokenmetrics.com/v3/tokens?limit=500&page=1`;
      
      console.log('Fetching tokens from TokenMetrics API...');
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch tokens: ${response.status}`);
        
        if (response.status === 429) {
          console.error('Rate limit exceeded.');
          
          // If we've hit rate limit, implement exponential backoff
          if (retryCount < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
            console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            this.lastCallTime = Date.now() + delay;
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.fetchAllTokens(retryCount + 1);
          } else {
            console.error('Max retries reached for rate limit. Waiting 2 minutes before next attempt.');
            this.lastCallTime = Date.now() + 120000; // Wait 2 minutes
            return [];
          }
        }
        
        return [];
      }
      
      const data: any = await response.json();
      
      // Extract price data from TokenMetrics response
      const prices: TokenMetricsPrice[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        // Process tokens and filter for main ones
        data.data.forEach((token: TokenMetricsToken) => {
          const symbol = token.token_symbol?.toUpperCase();
          
          // Only include tokens with valid price and symbol
          const price = token.current_price || token.price || token.price_usd || 0;
          if (symbol && price > 0) {
            prices.push({
              symbol: symbol,
              price_usd: price,
              timestamp: Date.now()
            });
          }
        });
      }
      
      console.log(`Successfully fetched prices for ${prices.length} tokens`);
      return prices;
    } catch (error) {
      console.error('Error fetching TokenMetrics tokens:', error);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchAllTokens(retryCount + 1);
      }
      
      return [];
    }
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
    if (!this.apiKey) return;
    
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      console.log('Token refresh already in progress, queuing request');
      return new Promise<void>((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }
    
    this.isRefreshing = true;
    
    try {
      let allPrices: TokenMetricsPrice[] = [];
      
      // If specific symbols are provided, fetch only those
      if (specificSymbols && specificSymbols.length > 0) {
        console.log(`Refreshing specific tokens from TokenMetrics API: ${specificSymbols.length} symbols`);
        // Process symbols in batches of 25 to avoid rate limits
        for (let i = 0; i < specificSymbols.length; i += 25) {
          const batch = specificSymbols.slice(i, i + 25);
          const batchPrices = await this.fetchTokensBySymbols(batch);
          allPrices = [...allPrices, ...batchPrices];
          
          // Add delay between batches
          if (i + 25 < specificSymbols.length) {
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      } else {
        // Otherwise fetch all tokens (only for manual testing)
        console.log('Refreshing all tokens from TokenMetrics API (manual test only)');
        allPrices = await this.fetchAllTokens();
      }
      
      if (allPrices.length > 0) {
        await this.savePricesToDatabase(allPrices);
        localStorage.setItem('tokenMetrics_lastRefresh', Date.now().toString());
        console.log(`Successfully refreshed ${allPrices.length} tokens`);
      } else {
        console.log('No tokens fetched, skipping database update');
      }
      
      // Process queued requests
      this.processQueue();
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      // Process queued requests even on error
      this.processQueue();
    } finally {
      this.isRefreshing = false;
    }
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
      // First, try to get prices from database (1 hour max age)
      let prices = await this.getPricesFromDatabase(symbols, 1);
      
      // Check if we have all requested symbols
      const missingSymbols = symbols.filter(symbol => !prices[symbol]);
      
      // If we're missing some symbols, try to refresh only those tokens
      if (missingSymbols.length > 0 && this.apiKey) {
        console.log(`Fetching ${missingSymbols.length} missing symbols from TokenMetrics`);
        await this.refreshAllTokens(missingSymbols);
        // Try to get prices from database again after refresh (1 hour max age)
        prices = await this.getPricesFromDatabase(symbols, 1);
        
        // If we still have missing symbols, try to get extended cache (up to 24 hours old)
        const stillMissing = symbols.filter(symbol => !prices[symbol]);
        if (stillMissing.length > 0) {
          console.log('Using extended cache for missing symbols');
          const extendedCache = await this.getPricesFromDatabase(stillMissing, 24);
          // Merge extended cache with current prices
          Object.assign(prices, extendedCache);
        }
      }
      
      // Only return prices for the symbols that were requested
      const filteredPrices: Record<string, number> = {};
      symbols.forEach(symbol => {
        if (prices[symbol]) {
          filteredPrices[symbol] = prices[symbol];
        }
      });
      
      return filteredPrices;
    } catch (error) {
      console.error('Error updating prices for symbols:', error);
      // Return what we have from database even if API call failed (24 hour max age)
      const prices = await this.getPricesFromDatabase(symbols, 24);
      // Only return prices for the symbols that were requested
      const filteredPrices: Record<string, number> = {};
      symbols.forEach(symbol => {
        if (prices[symbol]) {
          filteredPrices[symbol] = prices[symbol];
        }
      });
      return filteredPrices;
    }
  }
}

// Export a singleton instance
export const tokenMetricsService = TokenMetricsService.getInstance();
