import { useEffect, useMemo, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { PageLoading } from '@/components/LoadingSpinner';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
// Removed: QuickActions, RecentActivity (not used on this page render)
import { Navbar } from '@/components/navigation/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { 
  Wallet, 
  TrendingUp,
  BarChart3, 
  DollarSign
} from 'lucide-react';
// Removed: useUserPreferences (prefs not used here)
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useBinancePrices } from '@/hooks/useBinancePrices';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { metrics, loading: metricsLoading } = usePortfolioMetrics();
  const { entries } = useCombinedEntries();
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number | null>(null);
  // No navigation side-effects

  // Get symbols from entries
  const watchedSymbols = useMemo(() => ([...new Set(
    entries
      .filter((e: any) => e.type === 'spot' || e.type === 'wallet')
      .map((e: any) => (e.symbol || '').toUpperCase().replace(/\/(USDT|USD)$/,''))
  )]), [entries]);
  const { prices: binancePrices, loading: priceLoading, error: priceError, missingCreds, manualReload, refreshStatus } = useBinancePrices(watchedSymbols as string[]);

  // No automatic fetching - manual reload only
  useEffect(() => {
    // Prices will be loaded from cache or fetched manually
  }, []);

  // When prices land first time, record timestamp to drive the live indicator
  useEffect(() => {
    if (!priceLoading && binancePrices && Object.keys(binancePrices).length > 0) {
      setLastPriceUpdate(prev => (prev ?? Date.now()));
    }
  }, [priceLoading, binancePrices]);

  // Ensure credentials status is rechecked after auth session is available (run when user id becomes available)
  const refreshRef = useRef(refreshStatus);
  useEffect(() => { refreshRef.current = refreshStatus; }, [refreshStatus]);
  useEffect(() => {
    if (user?.id) {
      refreshRef.current();
    }
  }, [user?.id]);

  if (loading || metricsLoading) {
    return <PageLoading text="Loading dashboard..." />;
  }

  if (!user) {
    return <PageLoading text="Redirecting to login..." />;
  }

  // const recentEntries = entries.slice(0, 5);

  // Precompute unique symbols for rendering
  const uniqueSymbols: string[] = Array.from(new Set(
    entries
      .filter((e: any) => e.type === 'spot' || e.type === 'wallet')
      .map((e: any) => (e.symbol || '').toUpperCase().replace(/\/(USDT|USD)$/,''))
  ));

  const stats = [
    {
      title: 'Total Portfolio',
      value: metrics.totalValue > 0 ? `$${metrics.totalValue.toLocaleString()}` : '$0.00',
      change: metrics.totalPnL !== 0 
        ? `${metrics.totalPnL > 0 ? '+' : ''}${metrics.totalPnLPercentage.toFixed(1)}% (${metrics.totalPnL > 0 ? '+' : ''}$${Math.abs(metrics.totalPnL).toLocaleString()})`
        : 'No change',
      changeType: metrics.totalPnL > 0 ? 'positive' as const : metrics.totalPnL < 0 ? 'negative' as const : 'neutral' as const,
      icon: Wallet,
      description: `${metrics.assetCount} assets tracked`
    },
    {
      title: 'Today\'s P&L',
      value: metrics.dayPnL !== 0 ? `${metrics.dayPnL > 0 ? '+' : ''}$${Math.abs(metrics.dayPnL).toLocaleString()}` : '$0.00',
      change: `Week: ${metrics.weekPnL >= 0 ? '+' : ''}$${metrics.weekPnL.toLocaleString()}`,
      changeType: metrics.dayPnL > 0 ? 'positive' as const : metrics.dayPnL < 0 ? 'negative' as const : 'neutral' as const,
      icon: TrendingUp,
      description: 'Since market open'
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: `${metrics.totalTrades} total trades`,
      changeType: metrics.winRate >= 50 ? 'positive' as const : 'neutral' as const,
      icon: BarChart3,
      description: 'Trading success rate'
    },
    {
      title: 'Month P&L',
      value: `${metrics.monthPnL >= 0 ? '+' : ''}$${metrics.monthPnL.toLocaleString()}`,
      change: `Avg trade: $${metrics.avgTradeSize.toLocaleString()}`,
      changeType: metrics.monthPnL >= 0 ? 'positive' as const : metrics.monthPnL < 0 ? 'negative' as const : 'neutral' as const,
      icon: DollarSign,
      description: 'Last 30 days'
    }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Binance Pricing */}
          {/* Welcome Header - Compact on mobile */}
          <div className="fade-in">
            <WelcomeHeader />
          </div>
          {/* Missing Binance credentials banner */}
          {missingCreds === true && (
            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Binance API credentials not set. Add them in Settings → API Key Management to enable live prices.
              </AlertDescription>
            </Alert>
          )}
          {priceError && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                {priceError}
              </AlertDescription>
            </Alert>
          )}
          {/* Mobile-optimized layout */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Grid - 2x2 on mobile, responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <StatsCard {...stat} />
                </div>
              ))}
            </div>

            {/* Live Price Update Indicator - only after we have a timestamp */}
            {lastPriceUpdate !== null && (
              <div className="flex items-center justify-center py-1 fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">
                    {`Prices updated ${formatDistanceToNow(new Date(lastPriceUpdate), { addSuffix: true })}`}
                  </span>
                  <span className="sm:hidden">
                    Prices live
                  </span>
                </div>
              </div>
            )}
            
            {/* Current Prices for Held Assets */}
            {entries.length > 0 && (
              <div className="fade-in" style={{ animationDelay: '0.55s' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Current Prices</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">USD (USDT)</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={priceLoading || missingCreds === true}
                      onClick={async () => { await manualReload(); setLastPriceUpdate(Date.now()); }}
                    >
                      <RefreshCw className={`w-4 h-4 ${priceLoading ? 'animate-spin' : ''}`} />
                      {priceLoading ? 'Reloading...' : 'Reload Prices'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {uniqueSymbols.map((symbol: string) => {
                    const price = binancePrices[symbol];
                    return (
                      <div key={symbol} className="glass-card p-3 sm:p-4">
                        <div className="flex items-baseline justify-between">
                          <div className="font-medium">{symbol}</div>
                        </div>
                        <div className="mt-1 text-sm sm:text-base font-semibold">
                          {typeof price === 'number' ? `$${price.toLocaleString()}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Footer Credit */}
            <footer className="text-center py-8">
              <div className="text-xs sm:text-sm text-muted-foreground">
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}