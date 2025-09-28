import { useState, useEffect, useMemo } from 'react';
import { useCombinedEntries } from './useCombinedEntries';
import { useBinanceAnalyticsPrices } from '@/hooks/useBinanceAnalyticsPrices';
import { useAuth } from './useAuth';

export interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number; // realized + unrealized
  totalPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  dayPnL: number;
  weekPnL: number;
  monthPnL: number;
  assetCount: number;
  totalTrades: number;
  winRate: number;
  avgTradeSize: number;
  bestPerformer: { asset: string; pnl: number } | null;
  worstPerformer: { asset: string; pnl: number } | null;
  lastUpdated: Date | null;
}

export function usePortfolioMetrics() {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useCombinedEntries();
  // Compute the list of symbols we need pricing for
  const symbols = Array.from(new Set(entries
    .filter(e => e.type === 'spot' || e.type === 'wallet')
    .map(e => (e.asset || '').toUpperCase().replace(/\/(USDT|USD)$/,''))
  ));
  const { getAssetPrice, getAssetChangePct } = useBinanceAnalyticsPrices(symbols);
  const [loading, setLoading] = useState(true);

  const metrics = useMemo((): PortfolioMetrics => {
    if (!entries.length) {
      return {
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        dayPnL: 0,
        weekPnL: 0,
        monthPnL: 0,
        assetCount: 0,
        totalTrades: 0,
        winRate: 0,
        avgTradeSize: 0,
        bestPerformer: null,
        worstPerformer: null,
        lastUpdated: null
      };
    }

    // Calculate portfolio holding from spot and wallet entries
    const holding = new Map<string, {
      quantity: number;
      avgPrice: number;
      totalCost: number;
      pnl: number;
    }>();

    entries.forEach(entry => {
      if (entry.type === 'spot' || entry.type === 'wallet') {
        const current = holding.get(entry.asset) || { quantity: 0, avgPrice: 0, totalCost: 0, pnl: 0 };
        
        if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
          const quantity = entry.side === 'buy' ? entry.quantity : -entry.quantity;
          const cost = quantity * entry.price_usd;
          
          if (quantity > 0) {
            // Buying - update average price
            const newQuantity = current.quantity + quantity;
            const newTotalCost = current.totalCost + cost;
            current.avgPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;
            current.quantity = newQuantity;
            current.totalCost = newTotalCost;
          } else {
            // Selling - reduce quantity but keep avg price
            current.quantity += quantity; // quantity is negative for sells
            current.totalCost += cost; // cost is negative for sells
          }
        } else if (entry.type === 'wallet' && entry.quantity) {
          current.quantity += entry.quantity;
        }
        
        current.pnl += entry.pnl;
        holding.set(entry.asset, current);
      }
    });

    // Calculate current portfolio value
    let totalValue = 0;
    let totalCostBasis = 0;
    let unrealizedPnL = 0;
    
    holding.forEach((holding, asset) => {
      if (holding.quantity > 0) {
        const currentPrice = getAssetPrice(asset) || holding.avgPrice;
        const currentValue = holding.quantity * currentPrice;
        const costBasis = holding.quantity * holding.avgPrice;
        
        totalValue += currentValue;
        totalCostBasis += costBasis;
        unrealizedPnL += currentValue - costBasis;
      }
    });

    // Realized PnL from entries
    const realizedPnL = entries.reduce((sum, e) => sum + (e.pnl || 0), 0);

    // Total PnL = realized + unrealized
    const totalPnL = realizedPnL + unrealizedPnL;

    // Estimate invested capital as net spot cash flow to compute a percentage
    const netInvested = entries.reduce((sum, e) => {
      if (e.type === 'spot' && e.quantity && e.price_usd) {
        const flow = e.quantity * e.price_usd * (e.side === 'buy' ? 1 : -1);
        return sum + flow;
      }
      return sum;
    }, 0);
    const denom = Math.max(Math.abs(netInvested), totalCostBasis, 1);
    const totalPnLPercentage = denom > 0 ? (totalPnL / denom) * 100 : 0;

    // Calculate time-based P&L
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Day PnL = realized entries in last 24h + approximation of unrealized using 24h price change
    const realizedDay = entries
      .filter(e => new Date(e.date) >= dayAgo)
      .reduce((sum, e) => sum + (e.pnl || 0), 0);
    const unrealizedDay = Array.from(holding.entries())
      .reduce((sum, [asset, holding]) => {
        const price = getAssetPrice(asset) || 0;
        const pct = getAssetChangePct(asset) || 0; // percent over 24h
        const delta = price * (pct / 100);
        return sum + (delta * holding.quantity);
      }, 0);
    const dayPnL = realizedDay + unrealizedDay;

    // Week/Month PnL = realized within window (no historical price available for unrealized change)
    const weekPnL = entries
      .filter(e => new Date(e.date) >= weekAgo)
      .reduce((sum, e) => sum + (e.pnl || 0), 0);
    const monthPnL = entries
      .filter(e => new Date(e.date) >= monthAgo)
      .reduce((sum, e) => sum + (e.pnl || 0), 0);

    // Calculate trading metrics
    const trades = entries.filter(e => e.type === 'spot' || e.type === 'futures');
    const profitableTrades = trades.filter(e => e.pnl > 0);
    const winRate = trades.length > 0 ? (profitableTrades.length / trades.length) * 100 : 0;
    
    const totalTradeValue = trades.reduce((sum, e) => {
      if (e.quantity && e.price_usd) {
        return sum + (e.quantity * e.price_usd);
      }
      return sum;
    }, 0);
    const avgTradeSize = trades.length > 0 ? totalTradeValue / trades.length : 0;

    // Find best and worst performers by asset
    const assetPnL = new Map<string, number>();
    entries.forEach(entry => {
      const current = assetPnL.get(entry.asset) || 0;
      assetPnL.set(entry.asset, current + entry.pnl);
    });

    let bestPerformer: { asset: string; pnl: number } | null = null;
    let worstPerformer: { asset: string; pnl: number } | null = null;

    assetPnL.forEach((pnl, asset) => {
      if (!bestPerformer || pnl > bestPerformer.pnl) {
        bestPerformer = { asset, pnl };
      }
      if (!worstPerformer || pnl < worstPerformer.pnl) {
        worstPerformer = { asset, pnl };
      }
    });

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      realizedPnL,
      unrealizedPnL,
      dayPnL,
      weekPnL,
      monthPnL,
      assetCount: holding.size,
      totalTrades: trades.length,
      winRate,
      avgTradeSize,
      bestPerformer,
      worstPerformer,
      lastUpdated: null
    };
  }, [entries, getAssetPrice, getAssetChangePct]);

  useEffect(() => {
    setLoading(entriesLoading);
  }, [entriesLoading]);

  return {
    metrics,
    loading
  };
}