
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { PageLoading } from '@/components/LoadingSpinner';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Navbar } from '@/components/navigation/Navbar';
import { DemoDataNotice } from '@/components/ui/demo-notice';
import { ApiRateLimitStatus } from '@/components/ui/api-rate-limit-status';
import { formatDistanceToNow } from 'date-fns';
import { 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  DollarSign
} from 'lucide-react';


export default function Dashboard() {
  const { user, loading } = useAuth();
  const { portfolio, getPortfolioStats, loading: portfolioLoading } = usePortfolio();
  const { entries } = useCombinedEntries();
  const { lastUpdated, lastApiCall, getTimeUntilNextCall, canMakeApiCall } = useCryptoPrices();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || portfolioLoading) {
    return <PageLoading text="Loading your dashboard..." />;
  }

  if (!user) {
    return <PageLoading text="Redirecting to login..." />;
  }

  // Get real data from hooks
  const portfolioStats = getPortfolioStats();
  const recentEntries = entries.slice(0, 5);
  const todaysPnL = entries
    .filter(entry => {
      const today = new Date();
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === today.toDateString();
    })
    .reduce((sum, entry) => sum + entry.pnl, 0);

  const stats = [
    {
      title: 'Total Portfolio',
      value: portfolioStats.totalValue > 0 ? `$${portfolioStats.totalValue.toLocaleString()}` : '$0.00',
      change: portfolioStats.totalPnL !== 0 
        ? `${portfolioStats.totalPnL > 0 ? '+' : ''}${portfolioStats.totalPnLPercentage.toFixed(1)}% (${portfolioStats.totalPnL > 0 ? '+' : ''}$${Math.abs(portfolioStats.totalPnL).toLocaleString()})`
        : 'No change',
      changeType: portfolioStats.totalPnL > 0 ? 'positive' as const : portfolioStats.totalPnL < 0 ? 'negative' as const : 'neutral' as const,
      icon: Wallet,
      description: 'Across all platforms'
    },
    {
      title: 'Today\'s P&L',
      value: todaysPnL !== 0 ? `${todaysPnL > 0 ? '+' : ''}$${Math.abs(todaysPnL).toLocaleString()}` : '$0.00',
      change: todaysPnL !== 0 ? `${entries.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length} trades today` : 'No trades today',
      changeType: todaysPnL > 0 ? 'positive' as const : todaysPnL < 0 ? 'negative' as const : 'neutral' as const,
      icon: TrendingUp,
      description: 'Since market open'
    },
    {
      title: 'Active Assets',
      value: portfolioStats.assetCount.toString(),
      change: `${entries.length} total entries`,
      changeType: 'neutral' as const,
      icon: BarChart3,
      description: 'Unique cryptocurrencies'
    },
    {
      title: 'Monthly Activity',
      value: entries.filter(entry => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(entry.date) >= monthAgo;
      }).length.toString(),
      change: recentEntries.length > 0 ? `Latest: ${recentEntries[0].asset}` : 'No entries yet',
      changeType: 'neutral' as const,
      icon: DollarSign,
      description: 'Last 30 days'
    }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Demo Data Notice */}
          <DemoDataNotice />
          
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

            {/* Quick Actions and Recent Activity - Stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="fade-in" style={{ animationDelay: '0.6s' }}>
                <QuickActions />
              </div>
              <div className="fade-in" style={{ animationDelay: '0.7s' }}>
                <RecentActivity />
              </div>
            </div>

            {/* Coming Soon Section - Compact on mobile */}
            <div className="text-center py-6 sm:py-8 lg:py-12 fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="glass-card p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  More Features Coming Soon! 🚀
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                  We're working hard to bring you advanced portfolio analytics, automated price tracking, 
                  sharing features, and much more. Stay tuned!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Real-time Prices', 'Advanced Charts', 'CSV Import', 'Mobile App', 'API Access'].map((feature, index) => (
                    <span 
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-primary/20 text-primary rounded-full text-xs sm:text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}