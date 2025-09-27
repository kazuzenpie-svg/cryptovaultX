import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useTokenMetricsApi } from '@/hooks/useTokenMetricsApi';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  Trash2,
  Activity,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function TokenMetricsPanel() {
  const { prefs } = useUserPreferences();
  const {
    tokens,
    prices,
    loading,
    error,
    rateLimitInfo,
    cacheStats,
    fetchTokens,
    refreshPrices,
    getPrice,
    getTokenData,
    clearCache,
    healthCheck
  } = useTokenMetricsApi();

  const [testSymbols, setTestSymbols] = useState('btc,eth,xrp,om');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const handleFetchAll = async () => {
    await fetchTokens();
  };

  const handleFetchSpecific = async () => {
    const symbols = testSymbols.split(',').map(s => s.trim()).filter(Boolean);
    if (symbols.length === 0) return;
    
    await fetchTokens(symbols);
  };

  const handleRefreshPrices = async () => {
    const symbols = testSymbols.split(',').map(s => s.trim()).filter(Boolean);
    if (symbols.length === 0) return;
    
    await refreshPrices(symbols);
  };

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const status = await healthCheck();
      setHealthStatus(status);
    } catch (error) {
      setHealthStatus({
        status: 'unhealthy',
        message: 'Health check failed',
        details: { error: error.message }
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'unhealthy': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'unhealthy': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* API Key Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            TokenMetrics API Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!prefs.tokenmetrics_api_key ? (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground">
                <strong>API Key Required:</strong> Please set your TokenMetrics API key in Settings → API Keys to enable price fetching.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                <strong>API Key Configured:</strong> TokenMetrics integration is ready.
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Rate Limit</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Calls Remaining</span>
                  <span className="font-semibold">{rateLimitInfo.callsRemaining}</span>
                </div>
                <Progress 
                  value={(rateLimitInfo.callsRemaining / 100) * 100} 
                  className="h-2"
                />
                {rateLimitInfo.timeUntilNext > 0 && (
                  <p className="text-xs text-warning">
                    Next call in {Math.ceil(rateLimitInfo.timeUntilNext / 1000)}s
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-accent" />
                <span className="font-medium text-sm">Cache</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Prices Cached</span>
                  <span className="font-semibold">{cacheStats.priceCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cache Size</span>
                  <span className="font-semibold">{formatBytes(cacheStats.totalSize)}</span>
                </div>
                {cacheStats.lastUpdate && (
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(cacheStats.lastUpdate, { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-success" />
                <span className="font-medium text-sm">Data</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tokens</span>
                  <span className="font-semibold">{tokens.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Prices</span>
                  <span className="font-semibold">{Object.keys(prices).length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Tabs defaultValue="fetch" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fetch">Fetch Data</TabsTrigger>
          <TabsTrigger value="prices">Price Lookup</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
        </TabsList>

        <TabsContent value="fetch" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Fetch Token Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-symbols">Test Symbols (comma separated)</Label>
                <Input
                  id="test-symbols"
                  value={testSymbols}
                  onChange={(e) => setTestSymbols(e.target.value)}
                  placeholder="btc,eth,xrp,om,wlfi"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter cryptocurrency symbols to test the API response
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleFetchSpecific}
                  disabled={loading || !rateLimitInfo.canMakeCall || !prefs.tokenmetrics_api_key}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Fetch Specific
                </Button>
                
                <Button 
                  onClick={handleFetchAll}
                  disabled={loading || !rateLimitInfo.canMakeCall || !prefs.tokenmetrics_api_key}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Fetch All (Top 100)
                </Button>
                
                <Button 
                  onClick={handleRefreshPrices}
                  disabled={loading || !rateLimitInfo.canMakeCall || !prefs.tokenmetrics_api_key}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Refresh Prices
                </Button>
              </div>

              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-primary font-medium">Fetching data from TokenMetrics...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Price Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(prices).length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Prices Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fetch some token data to see prices here
                  </p>
                  <Button onClick={handleFetchSpecific} variant="outline" size="sm">
                    Fetch Sample Data
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(prices).slice(0, 12).map(([symbol, price]) => {
                    const tokenData = getTokenData(symbol);
                    const change24h = tokenData?.price_change_percentage_24_h_in_currency || 0;
                    
                    return (
                      <div key={symbol} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{symbol}</h3>
                          <Badge variant={change24h >= 0 ? 'default' : 'destructive'}>
                            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">
                            ${price.toLocaleString()}
                          </div>
                          {tokenData?.token_name && (
                            <p className="text-xs text-muted-foreground">
                              {tokenData.token_name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleHealthCheck}
                  disabled={healthLoading}
                  className="flex items-center gap-2"
                >
                  <Activity className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                  Run Health Check
                </Button>
                
                <Button 
                  onClick={clearCache}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cache
                </Button>
              </div>

              {healthStatus && (
                <Alert className={`border-${healthStatus.status === 'healthy' ? 'success' : healthStatus.status === 'degraded' ? 'warning' : 'destructive'}/50 bg-${healthStatus.status === 'healthy' ? 'success' : healthStatus.status === 'degraded' ? 'warning' : 'destructive'}/10`}>
                  {(() => {
                    const Icon = getStatusIcon(healthStatus.status);
                    return <Icon className={`h-4 w-4 ${getStatusColor(healthStatus.status)}`} />;
                  })()}
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Status:</strong> {healthStatus.status.toUpperCase()} - {healthStatus.message}
                      </div>
                      {healthStatus.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium">View Details</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(healthStatus.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* System Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{rateLimitInfo.callsRemaining}</div>
                  <div className="text-xs text-muted-foreground">API Calls Left</div>
                </div>
                
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{cacheStats.priceCount}</div>
                  <div className="text-xs text-muted-foreground">Cached Prices</div>
                </div>
                
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{tokens.length}</div>
                  <div className="text-xs text-muted-foreground">Tokens Loaded</div>
                </div>
                
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{formatBytes(cacheStats.totalSize)}</div>
                  <div className="text-xs text-muted-foreground">Cache Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}