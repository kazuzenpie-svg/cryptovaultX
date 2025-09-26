import { useAllTokenMetricsData } from '@/hooks/useTokenMetricsData';

interface TokenMetricsDataDisplayProps {
  symbol?: string;
}

export function TokenMetricsDataDisplay({ symbol }: TokenMetricsDataDisplayProps) {
  const { data, loading } = useAllTokenMetricsData();
  
  if (loading) {
    return <div>Loading TokenMetrics data...</div>;
  }
  
  if (!data) {
    return <div>No TokenMetrics data available</div>;
  }
  
  // Filter data for specific symbol if provided
  let filteredData = data;
  if (symbol && data.data && Array.isArray(data.data)) {
    const symbolLower = symbol.toLowerCase();
    filteredData = {
      ...data,
      data: data.data.filter((token: any) => 
        token.token_symbol && token.token_symbol.toLowerCase() === symbolLower
      )
    };
  }
  
  return (
    <div className="token-metrics-data p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">TokenMetrics Data</h3>
      <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-96">
        {JSON.stringify(filteredData, null, 2)}
      </pre>
    </div>
  );
}
