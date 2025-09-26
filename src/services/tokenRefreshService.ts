import { tokenMetricsService } from '@/services/tokenMetricsService';

// Background service to refresh all tokens every 3 hours
export class TokenRefreshService {
  private static instance: TokenRefreshService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  private constructor() {}

  public static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }

  public start(apiKey: string): void {
    if (this.refreshInterval) {
      this.stop();
    }

    tokenMetricsService.setApiKey(apiKey);
    
    // No automatic refreshes - only manual calls
    console.log('Token refresh service started - manual refresh only');
  }
  
  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Token refresh service stopped');
    }
  }

  // Manual refresh method for testing
  public async manualRefresh(): Promise<void> {
    try {
      console.log('Manual token refresh triggered...');
      await tokenMetricsService.refreshAllTokens();
      console.log('Manual token refresh completed');
    } catch (error) {
      console.error('Error during manual token refresh:', error);
    }
  }
}

// Export a singleton instance
export const tokenRefreshService = TokenRefreshService.getInstance();
