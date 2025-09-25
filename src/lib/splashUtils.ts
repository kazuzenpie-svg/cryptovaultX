/**
 * Utility functions for managing splash screen state
 */

const SPLASH_STORAGE_KEY = 'cryptovault_has_seen_splash';

export const splashUtils = {
  /**
   * Check if user has seen the splash screen before
   */
  hasSeenSplash(): boolean {
    try {
      return localStorage.getItem(SPLASH_STORAGE_KEY) === 'true';
    } catch {
      // Handle cases where localStorage is not available
      return true; // Default to not showing splash if storage unavailable
    }
  },

  /**
   * Mark that user has seen the splash screen
   */
  markAsSeen(): void {
    try {
      localStorage.setItem(SPLASH_STORAGE_KEY, 'true');
    } catch {
      // Silently fail if localStorage is not available
      console.warn('Unable to store splash screen state');
    }
  },

  /**
   * Reset splash screen state (useful for testing or new user flows)
   */
  reset(): void {
    try {
      localStorage.removeItem(SPLASH_STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
      console.warn('Unable to reset splash screen state');
    }
  },

  /**
   * Check if splash should be shown for current user state
   * @param isLoggedIn - Whether user is currently logged in
   * @param isLoading - Whether auth state is still loading
   */
  shouldShowSplash(isLoggedIn: boolean, isLoading: boolean): boolean {
    // Don't show splash if:
    // - Still loading auth state
    // - User is already logged in
    // - User has seen splash before
    if (isLoading || isLoggedIn || this.hasSeenSplash()) {
      return false;
    }
    
    return true;
  }
};

// Expose splash utils to window for debugging purposes (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).splashUtils = splashUtils;
  console.log('🐛 Dev Mode: splashUtils available in console (try: splashUtils.reset())');
}