
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { PageLoading } from '@/components/LoadingSpinner';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Navbar } from '@/components/navigation/Navbar';
import { ApiRateLimitStatus } from '@/components/ui/api-rate-limit-status';
import { formatDistanceToNow } from 'date-fns';
import { 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  DollarSign
} from 'lucide-react';
import { useLivePrices } from '@/hooks/useLivePrices';


export default function Dashboard() {
  const { user, loading } = useAuth();
  const { metrics, loading: metricsLoading } = usePortfolioMetrics();
  const { entries } = useCombinedEntries();
  const { lastUpdated, lastApiCall, getTimeUntilNextCall, canMakeApiCall, fetchSimplePrices, getAssetPrice, getAssetChangePct } = useCryptoPrices();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Auto-refresh prices for dashboard
  useEffect(() => {
    if (entries.length > 0 && canMakeApiCall()) {
      const assets = [...new Set(entries
        .filter(e => e.type === 'spot' || e.type === 'wallet')
        .map(e => e.asset)
      )];
      if (assets.length > 0) {
        fetchSimplePrices(assets);
      }
    }
  }, [entries, canMakeApiCall, fetchSimplePrices]);

  // Live prices via Binance WS with REST fallback
  const watchedSymbols = [...new Set(entries
    .filter(e => e.type === 'spot' || e.type === 'wallet')
    .map(e => (e.asset || '').toUpperCase().replace(/\/(USDT|USD)$/,'') )
  )];
  const { getPrice: getLivePrice } = useLivePrices(watchedSymbols);

  if (loading || metricsLoading) {
    return <PageLoading text="Loading your dashboard..." />;
  }

  if (!user) {
    return <PageLoading text="Redirecting to login..." />;
  }

  const recentEntries = entries.slice(0, 5);

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
          {/* API Status Information */}
          <div className="fade-in">
            <ApiRateLimitStatus 
              lastApiCall={lastApiCall}
              canMakeApiCall={canMakeApiCall()}
              getTimeUntilNextCall={getTimeUntilNextCall}
              className="mb-4"
            />
          </div>
          
          {/* Welcome Header - Compact on mobile */}
          <div className="fade-in">
            <WelcomeHeader />
          </div>

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

            {/* Live Price Update Indicator - Compact */}
            {lastUpdated && (
              <div className="flex items-center justify-center py-1 fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">
                    Prices updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                    {!canMakeApiCall() && lastApiCall && (
                      <span className="text-muted-foreground ml-2">
                        • Next update in {Math.ceil(getTimeUntilNextCall() / (1000 * 60))}min
                      </span>
                    )}
                  </span>
                  <span className="sm:hidden">
                    {canMakeApiCall() ? 'Live prices' : `Next: ${Math.ceil(getTimeUntilNextCall() / (1000 * 60))}m`}
                  </span>
                </div>
              </div>
            )}

            {/* Current Prices for Held Assets */}
            {entries.length > 0 && (
              <div className="fade-in" style={{ animationDelay: '0.55s' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Current Prices</h3>
                  <span className="text-xs text-muted-foreground">USD (USDT)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {Array.from(new Set(
                    entries
                      .filter(e => e.type === 'spot' || e.type === 'wallet')
                      .map(e => (e.asset || '').toUpperCase().replace(/\/(USDT|USD)$/,'') )
                  )).map((symbol) => {
                    const live = getLivePrice(symbol);
                    const price = (typeof live === 'number') ? live : getAssetPrice(symbol);
                    const changePct = getAssetChangePct(symbol);
                    const changeColor = typeof changePct === 'number'
                      ? (changePct >= 0 ? 'text-green-500' : 'text-red-500')
                      : 'text-muted-foreground';
                    return (
                      <div key={symbol} className="glass-card p-3 sm:p-4">
                        <div className="flex items-baseline justify-between">
                          <div className="font-medium">{symbol}</div>
                          <div className={`text-xs ${changeColor}`}>
                            {typeof changePct === 'number' ? `${changePct.toFixed(2)}%` : '—'}
                          </div>
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

            {/* Quick Actions and Recent Activity - Stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="fade-in" style={{ animationDelay: '0.6s' }}>
                <QuickActions />
              </div>
              <div className="fade-in" style={{ animationDelay: '0.7s' }}>
                <RecentActivity />
              </div>
            </div>

            {/* Footer Credit */}
            <footer className="text-center py-8">
              <div className="text-xs sm:text-sm text-muted-foreground">
                © {new Date().getFullYear()} <span className="font-semibold">kent asna</span> — Software Dev
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}