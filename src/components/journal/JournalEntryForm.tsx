import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useJournalEntries, CreateJournalEntryData } from '@/hooks/useJournalEntries';
import { usePlatforms } from '@/hooks/usePlatforms';
import { Info } from 'lucide-react';
import { AssetSearchInput } from '@/components/journal/AssetSearchInput';
import { useToast } from '@/hooks/use-toast';

const entrySchema = z.object({
  type: z.enum(['spot', 'futures', 'wallet', 'dual_investment', 'liquidity_mining', 'liquidity_pool', 'other']),
  platform_id: z.string().optional(),
  date: z.string(),
  asset: z.string().min(1, 'Asset is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.number().optional(),
  price_usd: z.number().optional(),
  fees: z.number().optional(),
  pnl: z.number().optional(),
  side: z.enum(['buy', 'sell']).optional(),
  leverage: z.number().int().min(1).max(1000).optional(),
  currency: z.enum(['USD', 'PHP']).optional(),
  is_personal: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof entrySchema>;

interface JournalEntryFormProps {
  onClose: () => void;
  initialType?: FormData['type'];
  initialData?: any;
  onSubmit?: (data: any) => Promise<void>;
}

export function JournalEntryForm({ onClose, initialType = 'spot', initialData, onSubmit }: JournalEntryFormProps) {
  const { createEntry, loading } = useJournalEntries();
  const { platforms } = usePlatforms();
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: initialData ? {
      type: initialData.type,
      platform_id: initialData.platform_id || '',
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      asset: initialData.asset || '',
      symbol: initialData?.symbol || '',
      quantity: initialData.quantity && initialData.quantity > 0 ? initialData.quantity : undefined,
      price_usd: initialData.price_usd && initialData.price_usd > 0 ? initialData.price_usd : undefined,
      fees: initialData.fees || 0,
      pnl: initialData.pnl || 0,
      side: initialData.side,
      leverage: initialData.leverage || 1,
      currency: initialData.currency || 'USD',
      is_personal: initialData.is_personal || false,
      notes: initialData.notes || '',
    } : {
      type: initialType,
      currency: 'USD',
      is_personal: false,
      date: new Date().toISOString().split('T')[0],
      symbol: '',
      // leave optional numeric fields undefined by default to avoid DB CHECK violations
      quantity: undefined,
      price_usd: undefined,
      fees: 0,
      pnl: 0,
      leverage: 1,
    }
  });

  const watchedType = watch('type');

  const onSubmitForm = async (data: FormData) => {
    // Validate required fields based on entry type
    if (data.type === 'spot' && !data.side) {
      toast({
        title: "Missing required field",
        description: "Please select a side (Buy/Sell) for spot trades.",
        variant: "destructive",
      });
      return;
    }

    if (data.type === 'futures' && !data.leverage) {
      toast({
        title: "Missing required field", 
        description: "Please enter leverage for futures trades.",
        variant: "destructive",
      });
      return;
    }

    const toPositiveOrUndefined = (n?: number) => (typeof n === 'number' && n > 0 ? n : undefined);
    const nonNegativeOrUndefined = (n?: number) => (typeof n === 'number' && n >= 0 ? n : undefined);

    const entryData = {
      type: data.type!,
      asset: data.asset,
      symbol: data.symbol || selectedCoin?.symbol?.toUpperCase(),
      date: data.date,
      platform_id: data.platform_id,
      // Quantity and price_usd are optional and must be > 0 if provided
      quantity: toPositiveOrUndefined(data.quantity),
      price_usd: toPositiveOrUndefined(data.price_usd),
      // Fees can be 0; PnL can be 0
      fees: nonNegativeOrUndefined(data.fees) ?? 0,
      pnl: typeof data.pnl === 'number' ? data.pnl : 0,
      side: data.side,
      leverage: data.leverage,
      currency: data.currency || 'USD',
      is_personal: data.is_personal || false,
      notes: data.notes,
    };

    try {
      if (onSubmit) {
        // Edit mode
        await onSubmit(entryData);
      } else {
        // Create mode
        const { error } = await createEntry(entryData);
        if (error) return;
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getTypeSpecificFields = () => {
    switch (watchedType) {
      case 'spot':
        return (
          <>
            <div className="flex items-center gap-4">
              <Label htmlFor="side" className="w-24 text-sm font-medium text-right shrink-0">Side *</Label>
              <Select 
                value={watch('side') || initialData?.side || ''}
                onValueChange={(value) => setValue('side', value as 'buy' | 'sell')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              {errors.side && <p className="text-sm text-destructive ml-28">{errors.side.message}</p>}
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="quantity" className="w-24 text-sm font-medium text-right shrink-0">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                className="flex-1"
                {...register('quantity', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="price_usd" className="w-24 text-sm font-medium text-right shrink-0">Price (USD)</Label>
              <Input
                id="price_usd"
                type="number"
                step="any"
                min="0"
                className="flex-1"
                {...register('price_usd', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
              />
            </div>
          </>
        );
      case 'futures':
        return (
          <>
            <div className="flex items-center gap-4">
              <Label htmlFor="side" className="w-24 text-sm font-medium text-right shrink-0">Side</Label>
              <Select 
                value={watch('side') || initialData?.side || ''}
                onValueChange={(value) => setValue('side', value as 'buy' | 'sell')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Long</SelectItem>
                  <SelectItem value="sell">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="leverage" className="w-24 text-sm font-medium text-right shrink-0">Leverage *</Label>
              <Input
                id="leverage"
                type="number"
                min="1"
                max="1000"
                className="flex-1"
                {...register('leverage', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
              />
              {errors.leverage && <p className="text-sm text-destructive ml-28">{errors.leverage.message}</p>}
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="pnl" className="w-24 text-sm font-medium text-right shrink-0">P&L (USD)</Label>
              <Input
                id="pnl"
                type="number"
                step="any"
                className="flex-1"
                {...register('pnl', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
              />
            </div>
          </>
        );
      case 'wallet':
        return (
          <div className="flex items-center gap-4">
            <Label htmlFor="quantity" className="w-24 text-sm font-medium text-right shrink-0">Amount Added</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              className="flex-1"
              {...register('quantity', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-4">
            <Label htmlFor="quantity" className="w-24 text-sm font-medium text-right shrink-0">Quantity/Amount</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              defaultValue="0"
              className="flex-1"
              {...register('quantity', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
      {/* iPhone-style header */}
      <div className="flex items-center justify-center p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-center">
          Add Entry
        </h2>
      </div>
      
      {/* Form content */}
      <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-4 pb-6">
        {/* Entry Type Info */}
        <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Entry Types:</strong> Spot (buy/sell trades), Futures (leveraged positions), 
            Wallet (balance updates), and other investment activities.
          </AlertDescription>
        </Alert>

        <form id="journal-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="type" className="w-24 text-sm font-medium text-right shrink-0">Entry Type *</Label>
              <Select 
                value={watchedType} 
                onValueChange={(value) => {
                  setSelectedType(value as FormData['type']);
                  setValue('type', value as FormData['type']);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">Spot Trading</SelectItem>
                  <SelectItem value="futures">Futures Trading</SelectItem>
                  <SelectItem value="wallet">Wallet Transfer</SelectItem>
                  <SelectItem value="dual_investment">Dual Investment</SelectItem>
                  <SelectItem value="liquidity_mining">Liquidity Mining</SelectItem>
                  <SelectItem value="liquidity_pool">Liquidity Pool</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="platform_id" className="w-24 text-sm font-medium text-right shrink-0">Platform</Label>
              <Select 
                value={watch('platform_id') || initialData?.platform_id || ''}
                onValueChange={(value) => setValue('platform_id', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4">
              <Label htmlFor="asset" className="w-24 text-sm font-medium text-right shrink-0 pt-2">Asset *</Label>
              <div className="flex-1">
                <AssetSearchInput
                  value={watch('asset') || ''}
                  onChange={(value) => setValue('asset', value)}
                  onSelect={(coin) => {
                    setSelectedCoin(coin);
                    setValue('asset', coin.id); // Store CoinGecko ID as asset
                    setValue('symbol', coin.symbol.toUpperCase());
                  }}
                  onClear={() => {
                    setSelectedCoin(null);
                    setValue('symbol', '');
                  }}
                  className="mb-2"
                  placeholder="Search by token name (e.g., Bitcoin, Ethereum)..."
                  required
                />
                {selectedCoin && (
                  <div className="text-xs text-muted-foreground">
                    Symbol: {selectedCoin.symbol.toUpperCase()}
                  </div>
                )}
              </div>
              {errors.asset && <p className="text-sm text-destructive ml-28">{errors.asset.message}</p>}
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="symbol" className="w-24 text-sm font-medium text-right shrink-0">Symbol *</Label>
              <Input
                id="symbol"
                value={watch('symbol') || ''}
                onChange={(e) => setValue('symbol', e.target.value.toUpperCase())}
                className="flex-1"
                placeholder="BTC, ETH, USDT..."
                required
              />
              {selectedCoin && (
                <div className="text-xs text-muted-foreground">
                  Auto-filled from CoinGecko
                </div>
              )}
            </div>

            {errors.symbol && <p className="text-sm text-destructive ml-28">{errors.symbol.message}</p>}

            <div className="flex items-center gap-4">
              <Label htmlFor="date" className="w-24 text-sm font-medium text-right shrink-0">Date *</Label>
              <Input
                id="date"
                type="date"
                className="flex-1"
                {...register('date')}
              />
              {errors.date && <p className="text-sm text-destructive ml-28">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            {getTypeSpecificFields()}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="fees" className="w-24 text-sm font-medium text-right shrink-0">Fees (USD)</Label>
              <Input
                id="fees"
                type="number"
                step="any"
                min="0"
                className="flex-1"
                {...register('fees', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="currency" className="w-24 text-sm font-medium text-right shrink-0">Currency</Label>
              <Select
                value={watch('currency') || initialData?.currency || 'USD'}
                onValueChange={(value) => setValue('currency', value as 'USD' | 'PHP')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="PHP">PHP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Label htmlFor="notes" className="w-24 text-sm font-medium text-right shrink-0 pt-2">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this entry..."
              rows={3}
              className="flex-1"
              {...register('notes')}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 shrink-0"></div>
            <div className="flex items-center space-x-2 flex-1">
              <Switch
                id="is_personal"
                checked={watch('is_personal') || initialData?.is_personal || false}
                onCheckedChange={(checked) => setValue('is_personal', checked)}
              />
              <Label htmlFor="is_personal" className="text-sm">
                Mark as personal (won't be shared with connections)
              </Label>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}