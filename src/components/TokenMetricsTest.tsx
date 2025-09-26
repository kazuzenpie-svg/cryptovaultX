import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { tokenMetricsService } from '@/services/tokenMetricsService';
import { RefreshCw, Play, Database } from 'lucide-react';

export function TokenMetricsTest() {
  const { prefs } = useUserPreferences();
  const [symbols, setSymbols] = useState('btc,eth,xrp');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set API key when component mounts
  if (prefs.tokenmetrics_api_key) {
    tokenMetricsService.setApiKey(prefs.tokenmetrics_api_key);
  }
  
  const handleTestSpecificSymbols = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const symbolArray = symbols.split(',').map(s => s.trim());
      console.log(`Testing TokenMetrics API with symbols: ${symbolArray.join(', ')}`);
      
      const result = await tokenMetricsService.fetchTokensBySymbols(symbolArray);
      setTestResult(result);
      console.log('Test result:', result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to test API';
      setError(errorMsg);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestAllTokens = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log('Testing TokenMetrics API with all tokens (limited to 10)');
      
      // Fetch limited number of tokens for testing
      const result = await tokenMetricsService.fetchAllTokens();
      
      // Limit results for display
      const limitedResult = result.slice(0, 10);
      setTestResult({
        totalFetched: result.length,
        displayed: limitedResult,
        message: `Showing first 10 of ${result.length} tokens`
      });
      console.log('Test result:', result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to test API';
      setError(errorMsg);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshDatabase = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const symbolArray = symbols.split(',').map(s => s.trim());
      console.log(`Refreshing database with symbols: ${symbolArray.join(', ')}`);
      
      await tokenMetricsService.refreshAllTokens(symbolArray);
      
      setTestResult({
        message: `Successfully refreshed ${symbolArray.length} symbols in database`,
        symbols: symbolArray
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh database';
      setError(errorMsg);
      console.error('Refresh error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          TokenMetrics API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Symbols (comma separated)</label>
          <Input
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            placeholder="btc,eth,xrp,om,wlfi"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter cryptocurrency symbols to test the API response
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleTestSpecificSymbols}
            disabled={loading || !prefs.tokenmetrics_api_key}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Test Specific Symbols
          </Button>
          
          <Button 
            onClick={handleTestAllTokens}
            disabled={loading || !prefs.tokenmetrics_api_key}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Test All Tokens (10)
          </Button>
          
          <Button 
            onClick={handleRefreshDatabase}
            disabled={loading || !prefs.tokenmetrics_api_key}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Refresh Database
          </Button>
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {testResult && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Result:</h3>
            <Textarea 
              value={JSON.stringify(testResult, null, 2)}
              readOnly
              className="font-mono text-xs h-40"
            />
          </div>
        )}
        
        {!prefs.tokenmetrics_api_key && (
          <div className="p-3 bg-warning/10 text-warning rounded-md">
            <p className="font-medium">API Key Required:</p>
            <p className="text-sm">Please set your TokenMetrics API key in Settings → API Keys</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
