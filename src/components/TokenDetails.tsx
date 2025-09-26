import { useTokenMetricsData } from '@/hooks/useTokenMetricsData';

interface TokenDetailsProps {
  symbol: string;
}

export function TokenDetails({ symbol }: TokenDetailsProps) {
  const { tokenData, loading, error, refreshData } = useTokenMetricsData(symbol);
  
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading {symbol} data...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-destructive">Error: {error}</div>;
  }
  
  if (!tokenData) {
    return <div className="text-sm text-muted-foreground">No data available for {symbol}</div>;
  }
  
  // Extract key metrics
  const price = tokenData.current_price || tokenData.price || tokenData.price_usd || 0;
  const change24h = tokenData.price_change_percentage_24_h_in_currency || 0;
  const marketCap = tokenData.market_cap || 0;
  const volume24h = tokenData.total_volume || 0;
  
  return (
    <div className="token-details p-4 bg-card rounded-lg border">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{tokenData.token_name} ({tokenData.token_symbol?.toUpperCase()})</h3>
          <p className="text-sm text-muted-foreground">{tokenData.slug}</p>
        </div>
        <button 
          onClick={refreshData}
          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="font-semibold">${price.toLocaleString()}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">24h Change</p>
          <p className={`font-semibold ${change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Market Cap</p>
          <p className="font-semibold">${marketCap.toLocaleString()}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">24h Volume</p>
          <p className="font-semibold">${volume24h.toLocaleString()}</p>
        </div>
      </div>
      
      {tokenData.app_link && (
        <div className="mt-3 pt-3 border-t">
          <a 
            href={tokenData.app_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View on TokenMetrics
          </a>
        </div>
      )}
    </div>
  );
}
