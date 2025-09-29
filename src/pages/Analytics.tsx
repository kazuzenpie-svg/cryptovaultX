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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AssetSummaryList } from '@/components/analytics/AssetSummaryList';

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

  // Calculate cashflow-based totals (USD) from entries
  // Spot: buy = outflow (cash spent), sell = inflow (cash received)
  // Wallet: positive quantity = inflow, negative = outflow (requires price_usd)
  const cash = entries.reduce(
    (acc, e) => {
      // Spot trades
      if (e.type === 'spot' && e.quantity && e.price_usd && e.side) {
        const gross = e.quantity * e.price_usd;
        if (e.side === 'buy') acc.out += Math.abs(gross);
        else if (e.side === 'sell') acc.in += Math.abs(gross);
      }
      // Wallet transfers (if priced in USD)
      if (e.type === 'wallet' && e.quantity && e.price_usd) {
        const gross = e.quantity * e.price_usd;
        if (gross >= 0) acc.in += gross; else acc.out += Math.abs(gross);
      }
      return acc;
    },
    { in: 0, out: 0 }
  );

  const totalInflows = cash.in;
  const totalOutflows = cash.out;
  const netFlow = totalInflows - totalOutflows;

  // Group by type for analysis from entries
  const typeBreakdown = entries.reduce((acc, entry) => {
    const type = entry.type;
    if (!acc[type]) {
      acc[type] = { inflow: 0, outflow: 0, count: 0 };
    }
    // Prefer explicit P&L when provided
    const pnl = typeof entry.pnl === 'number' ? entry.pnl : 0;
    if (pnl > 0) {
      acc[type].inflow += pnl;
    } else if (pnl < 0) {
      acc[type].outflow += Math.abs(pnl);
    } else {
      // Fallback: if P&L is zero/undefined, approximate via cashflow for spot trades
      if (entry.type === 'spot' && entry.quantity && entry.price_usd && entry.side) {
        const cash = entry.quantity * entry.price_usd * (entry.side === 'sell' ? 1 : -1);
        if (cash > 0) acc[type].inflow += cash; else if (cash < 0) acc[type].outflow += Math.abs(cash);
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

          {/* Analytics Overview Tabs */}
          <Tabs defaultValue="performance" className="fade-in space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="pt-4">
              <PerformanceMetrics />
            </TabsContent>
            <TabsContent value="calendar" className="pt-4">
              <PnLCalendar />
            </TabsContent>
            <TabsContent value="heatmap" className="pt-4">
              <TradingHeatmap />
            </TabsContent>
          </Tabs>

          {/* Cashflow Summary - Mobile Grid */}
          <div className="fade-in overflow-x-auto md:grid-flow-col auto-cols-max grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 snap-x snap-mandatory" style={{ animationDelay: '0.3s' }}>
            <Card className="glass-card flex-shrink-0 min-w-[260px] snap-start">
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

            <Card className="glass-card flex-shrink-0 min-w-[260px] snap-start" style={{ animationDelay: '0.1s' }}>
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

            <Card className="glass-card flex-shrink-0 min-w-[260px] snap-start sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
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

          {/* Per-Asset Summaries */}
          <AssetSummaryList />

          {/* Activity Breakdown */}
          <Card className="glass-card fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                P&L Breakdown by Type
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Profit and loss summary grouped by entry type (positive = gains, negative = losses)
              </p>
            </CardHeader>
            <CardContent>
              {Object.keys(typeBreakdown).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No data available</h3>
                  <p className="text-muted-foreground mb-6">
                    Add some journal entries to see your P&L breakdown.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4 text-right">Entries</th>
                        <th className="py-2 pr-4 text-right">Gains</th>
                        <th className="py-2 pr-4 text-right">Losses</th>
                        <th className="py-2 pr-0 text-right">Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(typeBreakdown).map(([type, data], index) => {
                        const netAmount = data.inflow - data.outflow;
                        const typeLabel = entryTypeLabels[type as keyof typeof entryTypeLabels] || type;
                        const netColor = netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                        return (
                          <tr key={type} className="border-t">
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="capitalize">{typeLabel}</Badge>
                            </td>
                            <td className="py-3 pr-4 text-right tabular-nums">{data.count}</td>
                            <td className="py-3 pr-4 text-right tabular-nums text-success">${data.inflow.toLocaleString()}</td>
                            <td className="py-3 pr-4 text-right tabular-nums text-destructive">${data.outflow.toLocaleString()}</td>
                            <td className={`py-3 pr-0 text-right tabular-nums font-medium ${netColor}`}>
                              {netAmount >= 0 ? '+' : ''}${netAmount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}