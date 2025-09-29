import { useMemo } from 'react';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useBinanceAnalyticsPrices } from '@/hooks/useBinanceAnalyticsPrices';

export interface AssetSummary {
  asset: string;
  quantity: number;
  avgPrice: number;
  costBasis: number;
  currentPrice: number | null;
  marketValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  change24hPct: number | null;
}

export function useAssetSummaries() {
  const { entries } = useCombinedEntries();
  const symbols = Array.from(new Set(entries
    .filter(e => e.type === 'spot' || e.type === 'wallet')
    .map(e => (e.symbol || '').toUpperCase().replace(/\/(USDT|USD)$/,''))
  ));
  const { getAssetPrice, getAssetChangePct } = useBinanceAnalyticsPrices(symbols);

  const summaries = useMemo<AssetSummary[]>(() => {
    if (!entries.length) return [];

    // Aggregate holdings and realized PnL per asset
    const map = new Map<string, {
      quantity: number;
      avgPrice: number;
      totalCost: number;
      realizedPnL: number;
    }>();

    for (const e of entries) {
      if (e.type !== 'spot' && e.type !== 'wallet') {
        // Only spot and wallet affect holdings; still count realized PnL
        const current = map.get(e.symbol || e.asset) || { quantity: 0, avgPrice: 0, totalCost: 0, realizedPnL: 0 };
        current.realizedPnL += e.pnl || 0;
        map.set(e.symbol || e.asset, current);
        continue;
      }

      const current = map.get(e.symbol || e.asset) || { quantity: 0, avgPrice: 0, totalCost: 0, realizedPnL: 0 };

      if (e.type === 'spot' && e.quantity && e.price_usd) {
        const qty = e.side === 'buy' ? e.quantity : -e.quantity;
        const cost = qty * e.price_usd;
        if (qty > 0) {
          const newQty = current.quantity + qty;
          const newTotalCost = current.totalCost + cost;
          current.avgPrice = newQty > 0 ? newTotalCost / newQty : current.avgPrice;
          current.quantity = newQty;
          current.totalCost = newTotalCost;
        } else {
          current.quantity += qty; // reduce on sells
          current.totalCost += cost; // reduce cost basis
        }
      } else if (e.type === 'wallet' && e.quantity) {
        current.quantity += e.quantity;
      }

      current.realizedPnL += e.pnl || 0;
      map.set(e.symbol || e.asset, current);
    }

    const list: AssetSummary[] = [];
    for (const [asset, agg] of map.entries()) {
      const currentPrice = getAssetPrice(asset);
      const change24hPct = getAssetChangePct(asset);
      const costBasis = agg.quantity > 0 ? agg.quantity * agg.avgPrice : 0;
      const marketValue = agg.quantity > 0 && typeof currentPrice === 'number' ? agg.quantity * currentPrice : 0;
      const unrealizedPnL = marketValue - costBasis;
      const totalPnL = agg.realizedPnL + unrealizedPnL;

      list.push({
        asset,
        quantity: agg.quantity,
        avgPrice: agg.avgPrice || 0,
        costBasis,
        currentPrice: currentPrice ?? null,
        marketValue,
        realizedPnL: agg.realizedPnL,
        unrealizedPnL,
        totalPnL,
        change24hPct: change24hPct ?? null,
      });
    }

    // Sort by market value desc
    return list.sort((a, b) => b.marketValue - a.marketValue);
  }, [entries, getAssetPrice, getAssetChangePct]);

  return { summaries };
}
