import { TokenMetricsTest } from '@/components/TokenMetricsTest';
import { Navbar } from '@/components/navigation/Navbar';

export default function TokenMetricsTestPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TokenMetrics Test
              </h1>
            </div>
            <p className="text-muted-foreground">
              Test the TokenMetrics API integration manually
            </p>
          </div>
          
          <TokenMetricsTest />
          
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">How to use:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Enter cryptocurrency symbols separated by commas</li>
              <li>• Click "Test Specific Symbols" to fetch prices for those symbols</li>
              <li>• Click "Test All Tokens" to fetch a sample of all tokens</li>
              <li>• Click "Refresh Database" to update the local database</li>
              <li>• Results will be displayed in the text area below</li>
            </ul>
          </div>
        </div>
      </div>
    </>  
  );
}
