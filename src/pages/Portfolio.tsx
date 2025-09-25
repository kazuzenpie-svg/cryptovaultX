
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/LoadingSpinner';
import { Navbar } from '@/components/navigation/Navbar';
import { DemoDataNotice } from '@/components/ui/demo-notice';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  RefreshCw,
  Eye,
  DollarSign,
  BarChart3,
  Users,
  Database
} from 'lucide-react';
import { format } from 'date-fns';

export default function Portfolio() {
  const { metrics, loading } = usePortfolioMetrics();
  const { entries, loading: entriesLoading } = useCombinedEntries();
  const { dataSources, getVisibleSources } = useDataVisibility();
  const { getAssetPrice, lastUpdated, updatePortfolioWithLivePrices } = useCryptoPrices();

  const isLoading = loading || entriesLoading;
  const visibleSources = getVisibleSources();
  const sharedEntries = entries.filter(e => e.isShared);

  // Calculate portfolio holdings
  const portfolio = useMemo(() => {
    const holdings = new Map<string, {
      quantity: number;
      avgPrice: number;
      totalCost: number;
      pnl: number;
    }>();

    entries.forEach(entry => {
      if (entry.type === 'spot' || entry.type === 'wallet') {
        const current = holdings.get(entry.asset) || { quantity: 0, avgPrice: 0, totalCost: 0, pnl: 0 };
        
        if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
          const quantity = entry.side === 'buy' ? entry.quantity : -entry.quantity;
          const cost = quantity * entry.price_usd;
          
          if (quantity > 0) {
            const newQuantity = current.quantity + quantity;
            const newTotalCost = current.totalCost + cost;
            current.avgPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;
            current.quantity = newQuantity;
            current.totalCost = newTotalCost;
          } else {
            current.quantity += quantity;
            current.totalCost += cost;
          }
        } else if (entry.type === 'wallet' && entry.quantity) {
          current.quantity += entry.quantity;
        }
        
        current.pnl += entry.pnl;
        holdings.set(entry.asset, current);
      }
    });

    return Array.from(holdings.entries())
      .filter(([_, holding]) => holding.quantity > 0)
      .map(([asset, holding]) => {
        const currentPrice = getAssetPrice(asset) || holding.avgPrice;
        const currentValue = holding.quantity * currentPrice;
        
        return {
          asset,
          total_quantity: holding.quantity,
          avg_entry_price: holding.avgPrice,
          current_price_usd: currentPrice,
          current_value_usd: currentValue,
          total_pnl: holding.pnl,
          price_last_updated: lastUpdated?.toISOString() || new Date().toISOString()
        };
      })
      .sort((a, b) => b.current_value_usd - a.current_value_usd);
  }, [entries, getAssetPrice, lastUpdated]);
  if (isLoading) {
    return (
      <>
        <Navbar />
        <PageLoading text="Loading your portfolio..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Demo Data Notice */}
          <DemoDataNotice />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Portfolio
                </h1>
              </div>
              <p className="text-muted-foreground">
                Real-time overview of your crypto holdings and performance
              </p>
              {entries.length > 0 && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Based on {entries.length} entries from {visibleSources.length} source{visibleSources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {sharedEntries.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-sm text-accent">
                        {sharedEntries.length} shared
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button onClick={() => updatePortfolioWithLivePrices()} variant="outline" className="hover-scale">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Prices
            </Button>
          </div>

          {/* Portfolio Stats - Mobile Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <Card className="glass-card fade-in">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Value</p>
                    <div className="text-lg sm:text-2xl font-bold">
                      ${metrics.totalValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center self-end sm:self-auto">
                    <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total P&L</p>
                    <div className={`text-lg sm:text-2xl font-bold flex items-center gap-1 ${
                      metrics.totalPnL >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {metrics.totalPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="text-sm sm:text-base">{metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center self-end sm:self-auto ${
                    metrics.totalPnL >= 0 ? 'bg-success/20' : 'bg-destructive/20'
                  }`}>
                    <DollarSign className={`w-4 h-4 sm:w-6 sm:h-6 ${
                      metrics.totalPnL >= 0 ? 'text-success' : 'text-destructive'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">P&L %</p>
                    <div className={`text-lg sm:text-2xl font-bold ${
                      metrics.totalPnLPercentage >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      <span className="text-sm sm:text-base">{metrics.totalPnLPercentage >= 0 ? '+' : ''}{metrics.totalPnLPercentage.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center self-end sm:self-auto ${
                    metrics.totalPnLPercentage >= 0 ? 'bg-success/20' : 'bg-destructive/20'
                  }`}>
                    <BarChart3 className={`w-4 h-4 sm:w-6 sm:h-6 ${
                      metrics.totalPnLPercentage >= 0 ? 'text-success' : 'text-destructive'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Assets</p>
                    <div className="text-lg sm:text-2xl font-bold">{metrics.assetCount}</div>
                  </div>
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/20 rounded-lg flex items-center justify-center self-end sm:self-auto">
                    <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Holdings */}
          {portfolio.length === 0 ? (
            <Card className="glass-card fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <PieChart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No holdings found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Your portfolio is empty. Start by adding some journal entries to track your crypto activities.
                </p>
                <Button onClick={() => window.location.href = '/journal'} className="hover-scale">
                  Add Journal Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card fade-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.map((asset, index) => {
                    const pnlPercentage = asset.avg_entry_price > 0 
                      ? ((asset.current_price_usd - asset.avg_entry_price) / asset.avg_entry_price) * 100 
                      : 0;
                    
                    return (
                      <div 
                        key={asset.asset} 
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors fade-in"
                        style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {asset.asset.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-lg">{asset.asset}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{asset.total_quantity?.toLocaleString()} tokens</span>
                              <span>Avg: ${asset.avg_entry_price?.toLocaleString()}</span>
                              <span>Current: ${asset.current_price_usd?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            ${asset.current_value_usd?.toLocaleString()}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className={`text-sm font-medium ${
                              asset.total_pnl >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {asset.total_pnl >= 0 ? '+' : ''}${asset.total_pnl?.toLocaleString()}
                            </div>
                            
                            <Badge className={
                              pnlPercentage >= 0 
                                ? 'bg-success/20 text-success hover:bg-success/30' 
                                : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                            }>
                              {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                            </Badge>
                          </div>
                          
                          {asset.price_last_updated && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Updated {format(new Date(asset.price_last_updated), 'MMM dd, HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}