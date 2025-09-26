import { useEffect, useState } from 'react';
import { tokenMetricsService } from '@/services/tokenMetricsService';

export function RateLimitTest() {
  const [status, setStatus] = useState('Not started');
  const [results, setResults] = useState<any[]>([]);
  
  const runTest = async () => {
    setStatus('Starting test...');
    setResults([]);
    
    // Set a test API key (this won't work but will trigger the rate limiting logic)
    tokenMetricsService.setApiKey('test-key');
    
    // Try to fetch tokens multiple times quickly
    for (let i = 0; i < 3; i++) {
      setStatus(`Fetching tokens - attempt ${i + 1}`);
      try {
        const startTime = Date.now();
        const prices = await tokenMetricsService.fetchAllTokens();
        const endTime = Date.now();
        
        setResults(prev => [...prev, {
          attempt: i + 1,
          duration: endTime - startTime,
          tokenCount: prices.length,
          timestamp: new Date().toISOString()
        }]);
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setResults(prev => [...prev, {
          attempt: i + 1,
          error: error.message,
          timestamp: new Date().toISOString()
        }]);
      }
    }
    
    setStatus('Test completed');
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Rate Limit Test</h2>
      <button 
        onClick={runTest}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Rate Limit Test
      </button>
      <div className="mt-4">
        <p>Status: {status}</p>
        <div className="mt-4">
          <h3 className="font-bold">Results:</h3>
          <pre className="bg-white p-2 rounded mt-2 overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
