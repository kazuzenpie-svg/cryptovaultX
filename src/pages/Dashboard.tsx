import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { PageLoading } from '@/components/LoadingSpinner';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Navbar } from '@/components/navigation/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { Wallet, TrendingUp, ChartBar as BarChart3, DollarSign } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { TokenMetricsWidget } from '@/components/tokenmetrics/TokenMetricsWidget';
import { useEnhancedCryptoPrices } from '@/hooks/useEnhancedCryptoPrices';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { metrics, loading: metricsLoading } = usePortfolioMetrics();
  const { entries } = useCombinedEntries();
  const navigate = useNavigate();
  const {
    prices,
    watchedSymbols,
    lastUpdate,
    loading: pricesLoading,
    getAssetPrice,
    manualRefresh
  } = useEnhancedCryptoPrices();

  useEffect(() => {
  }, [user, loading, navigate]);

  const handlePriceRefresh = async () => {
    try {
      await manualRefresh();
    } catch (error: any) {
      console.error('Price refresh failed:', error);
    }
  };

  if (loading || metricsLoading) {
    return <PageLoading text="Loading dashboard..." />;
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
          {/* TokenMetrics Pricing Only */}
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
            {lastUpdate && (
              <div className="flex items-center justify-center py-1 fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">
                    Prices updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                  </span>
                  <span className="sm:hidden">
                    Prices live
                  </span>
                </div>
              </div>
            )}
            
            {/* Current Prices for Held Assets */}
            {watchedSymbols.length > 0 && (
              <div className="fade-in" style={{ animationDelay: '0.55s' }}>
                <TokenMetricsWidget 
                  symbols={watchedSymbols}
                  title="Portfolio Prices"
                  compact={false}
                />
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