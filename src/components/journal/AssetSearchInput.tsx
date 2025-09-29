import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoinGeckoSearch, CoinGeckoCoin } from '@/hooks/useCoinGeckoSearch';
import { Search, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (coin: CoinGeckoCoin) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showSymbol?: boolean;
}

export function AssetSearchInput({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder = "Search for token (e.g., BTC, ETH)...",
  className,
  disabled = false,
  required = false,
  showSymbol = false
}: AssetSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinGeckoCoin | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { searchCoins, clearResults, loading, error, results } = useCoinGeckoSearch();

  // Search when user types (removed automatic search)
  // useEffect(() => {
  //   if (value.length >= 2) {
  //     searchCoins(value);
  //     setIsOpen(true);
  //   } else {
  //     clearResults();
  //     setIsOpen(false);
  //   }
  // }, [value, searchCoins, clearResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCoin = (coin: CoinGeckoCoin) => {
    setSelectedCoin(coin);
    // Set asset to the CoinGecko ID for consistency and uniqueness
    onChange(coin.id);
    onSelect?.(coin);
    setIsOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSelectedCoin(null); // Clear selection when user types manually
    onChange(newValue);
  };

  const handleClearSelection = () => {
    setSelectedCoin(null);
    onChange('');
    onClear?.();
  };

  const handleSearchClick = async () => {
    if (value.length >= 2) {
      clearResults(); // Clear previous results
      await searchCoins(value);
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          className={cn(className)}
          disabled={disabled}
          required={required}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
        />

        {/* Search button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0"
          onClick={handleSearchClick}
          disabled={loading || value.length < 2}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>

        {/* Clear button */}
        {selectedCoin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-10 top-1 h-8 w-8 p-0"
            onClick={handleClearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Selected coin indicator */}
        {selectedCoin && (
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <img
              src={selectedCoin.thumb}
              alt={selectedCoin.name}
              className="w-4 h-4 rounded-full"
            />
            <Check className="h-3 w-3 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          )}

          {!loading && results.length === 0 && value.length >= 2 && (
            <div className="py-4 px-3 text-center text-sm text-muted-foreground">
              No tokens found for "{value}"
            </div>
          )}

          {!loading && results.map((coin) => (
            <button
              key={coin.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 transition-colors"
              onClick={() => handleSelectCoin(coin)}
            >
              <img
                src={coin.thumb}
                alt={coin.name}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{coin.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {coin.symbol.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  ID: {coin.id}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {!selectedCoin && !error && (
        <div className="mt-1 text-xs text-muted-foreground">
          Type at least 2 characters and click search to find tokens
        </div>
      )}

      {selectedCoin && (
        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
          ✓ Verified: {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
        </div>
      )}
    </div>
  );
}
