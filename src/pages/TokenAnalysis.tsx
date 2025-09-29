import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useBinancePrices } from '@/hooks/useBinancePrices';
import { Navbar } from '@/components/navigation/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetIcon } from '@/components/analytics/AssetIcon';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  RefreshCw,
  Eye,
  Users,
  Zap,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface TokenAnalytics {
  symbol: string;
  totalQuantity: number;
  totalInvested: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  avgBuyPrice: number;
  currentPrice: number | null;
  winRate: number;
  totalTrades: number;
  firstTradeDate: Date | null;
  lastTradeDate: Date | null;
  priceChange24h: number | null;
  coinGeckoId: string; // CoinGecko ID for API calls
}

export default function TokenAnalysis() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries } = useCombinedEntries();
  const [priceLoading, setPriceLoading] = useState(false);

  // Get current price for this token
  const { prices: binancePrices, loading: pricesLoading, error: priceError, manualReload } = useBinancePrices([symbol || '']);

  const tokenAnalytics = useMemo((): TokenAnalytics | null => {
    if (!symbol || !entries.length) return null;

    const tokenEntries = entries.filter(entry =>
      (entry.symbol || '').toUpperCase() === symbol.toUpperCase() ||
      (entry.asset || '').toUpperCase() === symbol.toUpperCase()
    );

    if (tokenEntries.length === 0) return null;

    // Get the CoinGecko ID from the first entry
    const coinGeckoId = tokenEntries[0]?.asset || symbol.toLowerCase();

    // Calculate holdings and metrics
    let totalQuantity = 0;
    let totalInvested = 0;
    let realizedPnL = 0;
    let totalTrades = 0;
    let profitableTrades = 0;
    let firstTradeDate: Date | null = null;
    let lastTradeDate: Date | null = null;

    // Process each entry for this token
    tokenEntries.forEach(entry => {
      if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
        const quantity = entry.side === 'buy' ? entry.quantity : -entry.quantity;
        const cost = quantity * entry.price_usd;

        if (quantity > 0) {
          totalQuantity += quantity;
          totalInvested += cost;
        } else {
          totalQuantity += quantity; // reduce on sells
          totalInvested += cost; // reduce cost basis
        }
      } else if (entry.type === 'wallet' && entry.quantity) {
        totalQuantity += entry.quantity;
      }

      realizedPnL += entry.pnl || 0;
      totalTrades++;

      if (entry.pnl > 0) profitableTrades++;

      const entryDate = new Date(entry.date);
      if (!firstTradeDate || entryDate < firstTradeDate) {
        firstTradeDate = entryDate;
      }
      if (!lastTradeDate || entryDate > lastTradeDate) {
        lastTradeDate = entryDate;
      }
    });

    const avgBuyPrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
    const currentPrice = binancePrices[symbol.toUpperCase()] || null;
    const currentValue = totalQuantity > 0 && currentPrice ? totalQuantity * currentPrice : 0;
    const unrealizedPnL = currentValue - totalInvested;
    const totalPnL = realizedPnL + unrealizedPnL;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      totalQuantity,
      totalInvested,
      currentValue,
      realizedPnL,
      unrealizedPnL,
      totalPnL,
      avgBuyPrice,
      currentPrice,
      winRate,
      totalTrades,
      firstTradeDate,
      lastTradeDate,
      priceChange24h: null, // Would need additional API call for this
      coinGeckoId // Add coinGeckoId to the return object
    };
  }, [symbol, entries, binancePrices]);

  const handleRefreshPrices = async () => {
    setPriceLoading(true);
    try {
      await manualReload();
    } finally {
      setPriceLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <Navbar />
        <div className="container mx-auto p-4 text-center">
          <div className="mt-20 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
            <div className="text-slate-600 dark:text-slate-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!tokenAnalytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <Navbar />
        <div className="container mx-auto p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/analytics')}
              className="mb-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800 dark:text-slate-200">Token Not Found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                  No trading data found for <span className="font-semibold text-slate-800 dark:text-slate-200">{symbol?.toUpperCase()}</span>
                </p>
                <Button
                  onClick={() => navigate('/analytics')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Return to Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const isPositive = (value: number) => value >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative mb-6">
            {/* Navigation buttons cramped at top right */}
            <div className="absolute top-0 right-0 z-10">
              <div className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/analytics')}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full px-3 py-1 text-sm h-8"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefreshPrices}
                  disabled={priceLoading}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm rounded-full px-3 py-1 text-sm h-8 justify-start"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${priceLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Token information centered on left */}
            <div className="flex items-center justify-start pr-32">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <AssetIcon symbol={tokenAnalytics.symbol} asset={tokenAnalytics.coinGeckoId} size={48} />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                    {tokenAnalytics.symbol}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Token Analysis & Performance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards - Compact Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Price</p>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {tokenAnalytics.currentPrice ? formatCurrency(tokenAnalytics.currentPrice) : '—'}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Holdings</p>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {tokenAnalytics.totalQuantity.toFixed(4)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatCurrency(tokenAnalytics.currentValue)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total P&L</p>
                    <div className={`text-xl font-bold mt-1 ${
                      isPositive(tokenAnalytics.totalPnL) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(tokenAnalytics.totalPnL)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatPercentage((tokenAnalytics.totalPnL / Math.max(tokenAnalytics.totalInvested, 1)) * 100)}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPositive(tokenAnalytics.totalPnL)
                      ? 'bg-gradient-to-br from-green-500/20 to-green-600/20'
                      : 'bg-gradient-to-br from-red-500/20 to-red-600/20'
                  }`}>
                    {isPositive(tokenAnalytics.totalPnL) ?
                      <TrendingUp className="w-5 h-5 text-green-600" /> :
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Win Rate</p>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {tokenAnalytics.winRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tokenAnalytics.totalTrades} trades
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics - Compact Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Holdings & Trading Summary */}
            <div className="xl:col-span-2 space-y-6">
              <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Holdings & Trading Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Quantity</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tokenAnalytics.totalQuantity.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Avg Buy Price</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(tokenAnalytics.avgBuyPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Invested</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(tokenAnalytics.totalInvested)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Current Value</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(tokenAnalytics.currentValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Realized P&L</span>
                        <span className={`font-semibold ${
                          isPositive(tokenAnalytics.realizedPnL) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(tokenAnalytics.realizedPnL)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Unrealized P&L</span>
                        <span className={`font-semibold ${
                          isPositive(tokenAnalytics.unrealizedPnL) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(tokenAnalytics.unrealizedPnL)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading History - Compact */}
              <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Recent Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {entries
                      .filter(entry =>
                        (entry.symbol || '').toUpperCase() === symbol?.toUpperCase() ||
                        (entry.asset || '').toUpperCase() === symbol?.toUpperCase()
                      )
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={entry.side === 'buy' ? 'default' : 'destructive'}
                              className={entry.side === 'buy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                            >
                              {entry.side?.toUpperCase()}
                            </Badge>
                            <div>
                              <div className="font-medium text-sm">
                                {entry.quantity} {tokenAnalytics.symbol}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {format(new Date(entry.date), 'MMM dd, HH:mm')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {formatCurrency((entry.quantity || 0) * (entry.price_usd || 0))}
                            </div>
                            {entry.pnl !== 0 && (
                              <div className={`text-xs ${
                                entry.pnl > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {entry.pnl > 0 ? '+' : ''}{formatCurrency(entry.pnl)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics - Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/90 dark:bg-slate-800/90 border-0 shadow-lg backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Return</span>
                      <span className={`font-semibold text-sm ${
                        isPositive(tokenAnalytics.totalPnL) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage((tokenAnalytics.totalPnL / Math.max(tokenAnalytics.totalInvested, 1)) * 100)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Best Trade</span>
                      <span className="font-semibold text-green-600 text-sm">
                        {formatCurrency(Math.max(...entries
                          .filter(e => (e.symbol || '').toUpperCase() === symbol?.toUpperCase() ||
                                      (e.asset || '').toUpperCase() === symbol?.toUpperCase())
                          .map(e => e.pnl || 0)
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Worst Trade</span>
                      <span className="font-semibold text-red-600 text-sm">
                        {formatCurrency(Math.min(...entries
                          .filter(e => (e.symbol || '').toUpperCase() === symbol?.toUpperCase() ||
                                      (e.asset || '').toUpperCase() === symbol?.toUpperCase())
                          .map(e => e.pnl || 0)
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Avg Trade Size</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {formatCurrency(tokenAnalytics.totalInvested / Math.max(tokenAnalytics.totalTrades, 1))}
                      </span>
                    </div>
                  </div>

                  {tokenAnalytics.firstTradeDate && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Trading Period
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-200">
                        {format(tokenAnalytics.firstTradeDate, 'MMM dd, yyyy')} - {format(tokenAnalytics.lastTradeDate!, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {tokenAnalytics.totalTrades}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Trades
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
