import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { PnLCalendar } from '@/components/analytics/PnLCalendar';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { TradingHeatmap } from '@/components/analytics/TradingHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/LoadingSpinner';
import { Navbar } from '@/components/navigation/Navbar';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
  Database
} from 'lucide-react';
import { format } from 'date-fns';

export default function Analytics() {
  const { metrics, loading } = usePortfolioMetrics();
  const { entries, loading: entriesLoading } = useCombinedEntries();
  const { dataSources, getVisibleSources } = useDataVisibility();

  const isLoading = loading || entriesLoading;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <PageLoading text="Loading analytics..." />
      </>
    );
  }

  const visibleSources = getVisibleSources();
  const ownEntries = entries.filter(e => !e.isShared);
  const sharedEntries = entries.filter(e => e.isShared);

  // Calculate summary stats from entries
  const totalInflows = entries
    .filter(e => e.pnl > 0 || (e.type === 'spot' && e.side === 'sell'))
    .reduce((sum, e) => sum + Math.abs(e.pnl) + (e.quantity && e.price_usd && e.side === 'sell' ? e.quantity * e.price_usd : 0), 0);
  
  const totalOutflows = entries
    .filter(e => e.pnl < 0 || (e.type === 'spot' && e.side === 'buy'))
    .reduce((sum, e) => sum + Math.abs(e.pnl) + (e.quantity && e.price_usd && e.side === 'buy' ? e.quantity * e.price_usd : 0), 0);
  
  const netFlow = totalInflows - totalOutflows;

  // Group by type for analysis from entries
  const typeBreakdown = entries.reduce((acc, entry) => {
    const type = entry.type;
    if (!acc[type]) {
      acc[type] = { inflow: 0, outflow: 0, count: 0 };
    }
    
    // Calculate inflow/outflow based on entry type and P&L
    if (entry.pnl > 0 || (entry.type === 'spot' && entry.side === 'sell')) {
      acc[type].inflow += Math.abs(entry.pnl);
      if (entry.quantity && entry.price_usd && entry.side === 'sell') {
        acc[type].inflow += entry.quantity * entry.price_usd;
      }
    } else if (entry.pnl < 0 || (entry.type === 'spot' && entry.side === 'buy')) {
      acc[type].outflow += Math.abs(entry.pnl);
      if (entry.quantity && entry.price_usd && entry.side === 'buy') {
        acc[type].outflow += entry.quantity * entry.price_usd;
      }
    }
    
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { inflow: number; outflow: number; count: number }>);

  const entryTypeLabels = {
    spot: 'Spot Trading',
    futures: 'Futures',
    wallet: 'Wallet',
    dual_investment: 'Dual Investment',
    liquidity_mining: 'Liquidity Mining',
    liquidity_pool: 'Liquidity Pool',
    other: 'Other'
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Analytics
                </h1>
              </div>
              <p className="text-muted-foreground">
                Analyze your trading patterns and financial performance
              </p>
              {entries.length > 0 && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {visibleSources.length} source{visibleSources.length !== 1 ? 's' : ''} visible
                    </span>
                  </div>
                  {sharedEntries.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-sm text-accent">
                        Including {sharedEntries.length} shared entries
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="fade-in">
            <PerformanceMetrics />
          </div>

          {/* P&L Calendar */}
          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <PnLCalendar />
          </div>

          {/* Trading Heatmap */}
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <TradingHeatmap />
          </div>

          {/* Cashflow Summary - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 fade-in" style={{ animationDelay: '0.3s' }}>
            <Card className="glass-card fade-in">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Inflows</p>
                    <div className="text-lg sm:text-2xl font-bold text-success flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">${totalInflows.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Outflows</p>
                    <div className="text-lg sm:text-2xl font-bold text-destructive flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">${totalOutflows.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/20 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card fade-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Flow</p>
                    <div className={`text-lg sm:text-2xl font-bold ${
                      netFlow >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      <span className="text-sm sm:text-base">{netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    netFlow >= 0 ? 'bg-success/20' : 'bg-destructive/20'
                  }`}>
                    <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      netFlow >= 0 ? 'text-success' : 'text-destructive'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Sources Overview */}
          {visibleSources.length > 1 && (
            <Card className="glass-card fade-in" style={{ animationDelay: '0.25s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Data Sources Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleSources.map((source, index) => {
                    const sourceEntries = source.sourceType === 'own' 
                      ? ownEntries 
                      : entries.filter(e => e.grant_id === source.sourceId);
                    
                    return (
                      <div 
                        key={source.sourceId}
                        className="p-4 rounded-lg border bg-muted/30 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {source.sourceType === 'own' ? (
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-accent" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{source.sourceName}</span>
                          <Badge 
                            variant={source.sourceType === 'own' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {source.sourceType === 'own' ? 'My Data' : 'Shared'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sourceEntries.length} {sourceEntries.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Breakdown */}
          <Card className="glass-card fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(typeBreakdown).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No data available</h3>
                  <p className="text-muted-foreground mb-6">
                    Add some journal entries to see your activity breakdown.
                  </p>
                  <Button onClick={() => window.location.href = '/journal'} className="hover-scale">
                    Add Journal Entry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(typeBreakdown).map(([type, data], index) => {
                    const netAmount = data.inflow - data.outflow;
                    const typeLabel = entryTypeLabels[type as keyof typeof entryTypeLabels] || type;
                    
                    return (
                      <div 
                        key={type}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors fade-in"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {typeLabel}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {data.count} {data.count === 1 ? 'entry' : 'entries'}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-success">
                            In: ${data.inflow.toLocaleString()}
                          </div>
                          <div className="text-destructive">
                            Out: ${data.outflow.toLocaleString()}
                          </div>
                          <div className={`font-medium ${
                            netAmount >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            Net: {netAmount >= 0 ? '+' : ''}${netAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}