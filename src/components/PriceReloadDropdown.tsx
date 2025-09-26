import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface PriceReloadDropdownProps {
  symbols: string[];
  onReloadSuccess?: () => void;
  onReloadError?: (error: string) => void;
}

export function PriceReloadDropdown({ symbols, onReloadSuccess, onReloadError }: PriceReloadDropdownProps) {
  const { manualReload, canMakeApiCall, getTimeUntilNextCall, loading } = useCryptoPrices();
  const [error, setError] = useState<string | null>(null);
  
  const handleReload = async () => {
    setError(null);
    
    try {
      if (!canMakeApiCall()) {
        const timeLeft = getTimeUntilNextCall();
        const secondsLeft = Math.ceil(timeLeft / 1000);
        const errorMsg = `Rate limit exceeded. Please wait ${secondsLeft} seconds before next reload.`;
        setError(errorMsg);
        onReloadError?.(errorMsg);
        return;
      }
      
      if (symbols.length === 0) {
        const errorMsg = 'No symbols to reload';
        setError(errorMsg);
        onReloadError?.(errorMsg);
        return;
      }
      
      await manualReload(symbols);
      onReloadSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reload prices. Please try again later.';
      setError(errorMsg);
      onReloadError?.(errorMsg);
      console.error('Price reload error:', err);
    }
  };
  
  // Check if we can make an API call without actually making one
  const canReload = canMakeApiCall();
  
  const handleReloadSpecific = async (specificSymbols: string[]) => {
    setError(null);
    
    try {
      if (!canMakeApiCall()) {
        const timeLeft = getTimeUntilNextCall();
        const secondsLeft = Math.ceil(timeLeft / 1000);
        const errorMsg = `Rate limit exceeded. Please wait ${secondsLeft} seconds before next reload.`;
        setError(errorMsg);
        onReloadError?.(errorMsg);
        return;
      }
      
      await manualReload(specificSymbols);
      onReloadSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reload prices';
      setError(errorMsg);
      onReloadError?.(errorMsg);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={loading || !canReload}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Reloading...' : !canReload ? 'Rate Limited' : 'Reload Prices'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReload}>
                    Reload All Prices ({symbols.length} symbols)
                  </DropdownMenuItem>
                  {symbols.slice(0, 5).map((symbol) => (
                    <DropdownMenuItem 
                      key={symbol}
                      onClick={() => handleReloadSpecific([symbol])}
                    >
                      Reload {symbol}
                    </DropdownMenuItem>
                  ))}
                  {symbols.length > 5 && (
                    <DropdownMenuItem disabled>
                      ...and {symbols.length - 5} more
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {!canReload ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Rate limit exceeded. Please wait before reloading.</span>
              </div>
            ) : (
              <span>Reload cryptocurrency prices</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
