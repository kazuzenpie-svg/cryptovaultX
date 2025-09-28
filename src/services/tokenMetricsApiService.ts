import { supabase } from '@/integrations/supabase/client';

export interface TokenMetricsToken {
  token_symbol: string;
  token_name: string;
  current_price?: number;
  price?: number;
  price_usd?: number;
  market_cap?: number;
  total_volume?: number;
  price_change_percentage_24_h_in_currency?: number;
  slug?: string;
  app_link?: string;
  [key: string]: any;
}

export interface TokenMetricsResponse {
  data: TokenMetricsToken[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PriceData {
  symbol: string;
  price_usd: number;
  change_24h?: number;
  last_updated: string;
}

export interface RateLimitInfo {
  canMakeCall: boolean;
  timeUntilNext: number;
  callsRemaining: number;
  resetTime: Date;
}

export class TokenMetricsApiService {
  private static instance: TokenMetricsApiService;
  private apiKey: string | null = null;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private resetTime: number = 0;
  private isRefreshing: boolean = false;
  private refreshQueue: Array<{ resolve: Function; reject: Function }> = [];
  
  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    CALLS_PER_HOUR: 100, // Conservative limit
    MIN_INTERVAL_MS: 30000, // 30 seconds between calls
    DAILY_LIMIT: 1000, // Daily API call limit
    BURST_LIMIT: 5, // Max burst calls
    BURST_WINDOW_MS: 300000 // 5 minutes burst window
  };

  // Cache configuration
  private readonly CACHE_CONFIG = {
    PRICE_TTL: 3 * 60 * 60 * 1000, // 3 hours for prices
    TOKEN_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours for token metadata
    ERROR_CACHE_TTL: 5 * 60 * 1000, // 5 minutes for errors
    MAX_CACHE_SIZE: 1000 // Max cached items
  };

  private constructor() {
    this.loadRateLimitState();
  }

  public static getInstance(): TokenMetricsApiService {
    if (!TokenMetricsApiService.instance) {
      TokenMetricsApiService.instance = new TokenMetricsApiService();
    }
    return TokenMetricsApiService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey?.trim() || null;
    console.log('TokenMetrics API key updated:', this.apiKey ? 'Set' : 'Cleared');
  }

  public hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Load rate limit state from localStorage
  private loadRateLimitState(): void {
    try {
      const saved = localStorage.getItem('tokenmetrics_rate_limit_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.lastCallTime = state.lastCallTime || 0;
        this.callCount = state.callCount || 0;
        this.resetTime = state.resetTime || 0;
        
        // Reset counters if reset time has passed
        if (Date.now() > this.resetTime) {
          this.callCount = 0;
          this.resetTime = Date.now() + (60 * 60 * 1000); // Next hour
        }
      }
    } catch (error) {
      console.warn('Failed to load rate limit state:', error);
    }
  }

  // Save rate limit state to localStorage
  private saveRateLimitState(): void {
    try {
      const state = {
        lastCallTime: this.lastCallTime,
        callCount: this.callCount,
        resetTime: this.resetTime
      };
      localStorage.setItem('tokenmetrics_rate_limit_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save rate limit state:', error);
    }
  }

  // Check rate limit status
  public getRateLimitInfo(): RateLimitInfo {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    const timeUntilReset = Math.max(0, this.resetTime - now);
    
    // Reset counters if reset time has passed
    if (now > this.resetTime) {
      this.callCount = 0;
      this.resetTime = now + (60 * 60 * 1000); // Next hour
      this.saveRateLimitState();
    }

    const canMakeCall = 
      timeSinceLastCall >= this.RATE_LIMITS.MIN_INTERVAL_MS &&
      this.callCount < this.RATE_LIMITS.CALLS_PER_HOUR &&
      !this.isRefreshing;

    const timeUntilNext = canMakeCall ? 0 : Math.max(
      this.RATE_LIMITS.MIN_INTERVAL_MS - timeSinceLastCall,
      timeUntilReset
    );

    return {
      canMakeCall,
      timeUntilNext,
      callsRemaining: Math.max(0, this.RATE_LIMITS.CALLS_PER_HOUR - this.callCount),
      resetTime: new Date(this.resetTime)
    };
  }

  // Respect rate limits before making API calls
  private async respectRateLimit(): Promise<void> {
    const rateLimitInfo = this.getRateLimitInfo();
    
    if (!rateLimitInfo.canMakeCall) {
      const waitTime = rateLimitInfo.timeUntilNext;
      const minutes = Math.ceil(waitTime / (1000 * 60));
      
      throw new Error(
        `Rate limit exceeded. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before making another request. ` +
        `Calls remaining: ${rateLimitInfo.callsRemaining}`
      );
    }

    // Update rate limit counters
    this.lastCallTime = Date.now();
    this.callCount++;
    
    // Set reset time if not set
    if (this.resetTime === 0) {
      this.resetTime = Date.now() + (60 * 60 * 1000);
    }
    
    this.saveRateLimitState();
  }

  // Cache management
  private getCacheKey(type: 'price' | 'token' | 'error', identifier: string): string {
    return `tokenmetrics_${type}_${identifier.toLowerCase()}`;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    try {
      const cacheItem = {
        data,
        expires: Date.now() + ttl,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  private getCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      if (Date.now() > cacheItem.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return null;
    }
  }

  // Get cached prices for symbols
  public getCachedPrices(symbols: string[]): Record<string, PriceData> {
    const prices: Record<string, PriceData> = {};
    
    symbols.forEach(symbol => {
      const cacheKey = this.getCacheKey('price', symbol);
      const cached = this.getCache<PriceData>(cacheKey);
      if (cached) {
        prices[symbol.toUpperCase()] = cached;
      }
    });

    return prices;
  }

  // Fetch tokens from TokenMetrics API with enhanced error handling
  public async fetchTokens(symbols?: string[], limit: number = 100): Promise<TokenMetricsResponse> {
    if (!this.apiKey) {
      throw new Error('TokenMetrics API key is required. Please set it in Settings → API Keys.');
    }

    // Check if already refreshing
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    try {
      this.isRefreshing = true;
      
      // Respect rate limits
      await this.respectRateLimit();

      // Build API URL
      let url = `https://api.tokenmetrics.com/v3/tokens?limit=${Math.min(limit, 500)}&page=1`;
      
      if (symbols && symbols.length > 0) {
        const symbolList = symbols
          .map(s => s.toLowerCase().trim())
          .filter(Boolean)
          .slice(0, 50) // Limit to 50 symbols per request
          .join(',');
        url += `&symbol=${encodeURIComponent(symbolList)}`;
      }

      console.log(`🚀 TokenMetrics API call: ${symbols ? `${symbols.length} symbols` : 'all tokens'}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-api-key': this.apiKey
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your TokenMetrics API key in Settings.');
        } else if (response.status === 429) {
          // Update rate limit info from headers if available
          const resetHeader = response.headers.get('X-RateLimit-Reset');
          if (resetHeader) {
            this.resetTime = parseInt(resetHeader) * 1000;
            this.saveRateLimitState();
          }
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.');
        } else if (response.status >= 500) {
          throw new Error('TokenMetrics service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`API request failed (${response.status}): ${errorText}`);
        }
      }

      const data: TokenMetricsResponse = await response.json();
      
      // Validate response structure
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from TokenMetrics API');
      }

      // Cache the response
      this.cacheTokenData(data);
      
      // Process queued requests
      this.processQueue(data);
      
      console.log(`✅ Successfully fetched ${data.data.length} tokens from TokenMetrics`);
      return data;

    } catch (error: any) {
      console.error('TokenMetrics API error:', error);
      
      // Cache error to prevent immediate retries
      const errorKey = this.getCacheKey('error', 'last_error');
      this.setCache(errorKey, error.message, this.CACHE_CONFIG.ERROR_CACHE_TTL);
      
      // Reject queued requests
      this.processQueue(null, error);
      
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Process queued requests
  private processQueue(data: TokenMetricsResponse | null, error?: Error): void {
    while (this.refreshQueue.length > 0) {
      const { resolve, reject } = this.refreshQueue.shift()!;
      if (error) {
        reject(error);
      } else if (data) {
        resolve(data);
      } else {
        reject(new Error('No data available'));
      }
    }
  }

  // Cache token data with intelligent storage
  private cacheTokenData(response: TokenMetricsResponse): void {
    try {
      const timestamp = Date.now();
      
      // Cache individual token prices
      response.data.forEach(token => {
        if (token.token_symbol) {
          const symbol = token.token_symbol.toUpperCase();
          const price = token.current_price || token.price || token.price_usd || 0;
          
          if (price > 0) {
            const priceData: PriceData = {
              symbol,
              price_usd: price,
              change_24h: token.price_change_percentage_24_h_in_currency,
              last_updated: new Date().toISOString()
            };
            
            const priceKey = this.getCacheKey('price', symbol);
            this.setCache(priceKey, priceData, this.CACHE_CONFIG.PRICE_TTL);
          }

          // Cache full token metadata
          const tokenKey = this.getCacheKey('token', symbol);
          this.setCache(tokenKey, token, this.CACHE_CONFIG.TOKEN_DATA_TTL);
        }
      });

      // Cache full response for debugging
      const responseKey = 'tokenmetrics_latest_response';
      this.setCache(responseKey, {
        ...response,
        cached_at: timestamp
      }, this.CACHE_CONFIG.TOKEN_DATA_TTL);

      console.log(`📦 Cached ${response.data.length} tokens`);
    } catch (error) {
      console.warn('Failed to cache token data:', error);
    }
  }

  // Get price for a specific symbol
  public getPrice(symbol: string): number | null {
    const cacheKey = this.getCacheKey('price', symbol);
    const cached = this.getCache<PriceData>(cacheKey);
    return cached?.price_usd || null;
  }

  // Get token metadata
  public getTokenData(symbol: string): TokenMetricsToken | null {
    const cacheKey = this.getCacheKey('token', symbol);
    return this.getCache<TokenMetricsToken>(cacheKey);
  }

  // Get prices for multiple symbols with smart caching
  public async getPrices(symbols: string[]): Promise<Record<string, number>> {
    if (!symbols.length) return {};

    const prices: Record<string, number> = {};
    const missingSymbols: string[] = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = this.getCachedPrices([symbol]);
      if (cached[symbol.toUpperCase()]) {
        prices[symbol.toUpperCase()] = cached[symbol.toUpperCase()].price_usd;
      } else {
        missingSymbols.push(symbol);
      }
    });

    // Fetch missing symbols if any
    if (missingSymbols.length > 0 && this.hasApiKey()) {
      try {
        const response = await this.fetchTokens(missingSymbols);
        
        response.data.forEach(token => {
          if (token.token_symbol) {
            const symbol = token.token_symbol.toUpperCase();
            const price = token.current_price || token.price || token.price_usd || 0;
            if (price > 0) {
              prices[symbol] = price;
            }
          }
        });
      } catch (error) {
        console.warn('Failed to fetch missing prices:', error);
        // Continue with cached prices only
      }
    }

    return prices;
  }

  // Update prices in Supabase database
  public async updateDatabasePrices(symbols: string[]): Promise<void> {
    if (!symbols.length) return;

    try {
      const prices = await this.getPrices(symbols);
      const dbUpdates = Object.entries(prices).map(([symbol, price]) => ({
        asset_slug: symbol.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        price_usd: price,
        updated_at: new Date().toISOString(),
        source: 'tokenmetrics.com'
      }));

      if (dbUpdates.length > 0) {
        const { error } = await supabase
          .from('crypto_prices')
          .upsert(dbUpdates, { onConflict: 'asset_slug' });

        if (error) {
          console.error('Failed to update database prices:', error);
          throw error;
        }

        console.log(`💾 Updated ${dbUpdates.length} prices in database`);
      }
    } catch (error) {
      console.error('Error updating database prices:', error);
      throw error;
    }
  }

  // Get cached response for UI display
  public getCachedResponse(): TokenMetricsResponse | null {
    return this.getCache<TokenMetricsResponse>('tokenmetrics_latest_response');
  }

  // Clear all cache
  public clearCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('tokenmetrics_')
      );
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🧹 TokenMetrics cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get cache statistics
  public getCacheStats(): {
    priceCount: number;
    tokenCount: number;
    totalSize: number;
    lastUpdate: Date | null;
  } {
    let priceCount = 0;
    let tokenCount = 0;
    let totalSize = 0;
    let lastUpdate: Date | null = null;

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tokenmetrics_')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            
            if (key.includes('_price_')) priceCount++;
            if (key.includes('_token_')) tokenCount++;
            
            try {
              const parsed = JSON.parse(value);
              if (parsed.timestamp && (!lastUpdate || parsed.timestamp > lastUpdate.getTime())) {
                lastUpdate = new Date(parsed.timestamp);
              }
            } catch {}
          }
        }
      });
    } catch (error) {
      console.warn('Failed to calculate cache stats:', error);
    }

    return {
      priceCount,
      tokenCount,
      totalSize,
      lastUpdate
    };
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: any;
  }> {
    try {
      if (!this.hasApiKey()) {
        return {
          status: 'unhealthy',
          message: 'API key not configured',
          details: { hasApiKey: false }
        };
      }

      const rateLimitInfo = this.getRateLimitInfo();
      const cacheStats = this.getCacheStats();

      if (!rateLimitInfo.canMakeCall) {
        return {
          status: 'degraded',
          message: 'Rate limited',
          details: { rateLimitInfo, cacheStats }
        };
      }

      // Try a minimal API call to test connectivity
      try {
        await this.fetchTokens(['btc'], 1);
        return {
          status: 'healthy',
          message: 'API is responsive',
          details: { rateLimitInfo, cacheStats }
        };
      } catch (error: any) {
        return {
          status: 'degraded',
          message: `API error: ${error.message}`,
          details: { rateLimitInfo, cacheStats, error: error.message }
        };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const tokenMetricsApi = TokenMetricsApiService.getInstance();