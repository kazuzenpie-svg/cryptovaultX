import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTokenMetricsApi } from '@/hooks/useTokenMetricsApi';
import { CryptoIcon } from '@/components/CryptoIcon';
import { TrendingUp, TrendingDown, RefreshCw, Clock, TriangleAlert as AlertTriangle, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TokenMetricsWidgetProps {
  symbols: string[];
  title?: string;
  showRefreshButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function TokenMetricsWidget({ 
  symbols, 
  title = "Live Prices",
  showRefreshButton = true,
  compact = false,
  className = ""
}: TokenMetricsWidgetProps) {
  const {
    prices,
    loading,
    error,
    rateLimitInfo,
    cacheStats,
    refreshPrices,
    getTokenData
  } = useTokenMetricsApi();

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    if (symbols.length === 0) return;
    
    try {
      await refreshPrices(symbols);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Filter prices for requested symbols
  const filteredPrices = symbols.reduce((acc, symbol) => {
    const upperSymbol = symbol.toUpperCase();
    if (prices[upperSymbol]) {
      acc[upperSymbol] = prices[upperSymbol];
    }
    return acc;
  }, {} as Record<string, number>);

  const hasData = Object.keys(filteredPrices).length > 0;
  const canRefresh = rateLimitInfo.canMakeCall && !loading;

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          {showRefreshButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={!canRefresh}
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        {hasData ? (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(filteredPrices).slice(0, 4).map(([symbol, price]) => (
              <div key={symbol} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="font-medium text-xs">{symbol}</span>
                <span className="font-semibold text-xs">${price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No price data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          {showRefreshButton && (
            <div className="flex items-center gap-2">
              {cacheStats.lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(cacheStats.lastUpdate, { addSuffix: true })}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={!canRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!rateLimitInfo.canMakeCall && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Rate limited. Next refresh in {Math.ceil(rateLimitInfo.timeUntilNext / 1000)}s
            </span>
          </div>
        )}

        {hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(filteredPrices).map(([symbol, price]) => {
              const tokenData = getTokenData(symbol);
              const change24h = tokenData?.price_change_percentage_24_h_in_currency || 0;
              
              return (
                <div key={symbol} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <CryptoIcon symbol={symbol} size={32} />
                    <div>
                      <h3 className="font-semibold">{symbol}</h3>
                      {tokenData?.token_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {tokenData.token_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">${price.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <div className="flex items-center gap-1">
                        {change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                        <span className={`text-sm font-medium ${
                          change24h >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {tokenData?.market_cap && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Market Cap</span>
                        <span className="text-sm">${tokenData.market_cap.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Price Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {symbols.length === 0 
                ? 'No symbols provided to track'
                : 'Fetch data to see live prices for your symbols'
              }
            </p>
            {symbols.length > 0 && canRefresh && (
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Fetch Prices
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}