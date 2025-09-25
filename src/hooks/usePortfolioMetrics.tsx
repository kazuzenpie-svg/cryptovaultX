import { useState, useEffect, useMemo } from 'react';
import { useCombinedEntries } from './useCombinedEntries';
import { useCryptoPrices } from './useCryptoPrices';
import { useAuth } from './useAuth';

export interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
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
  const { getAssetPrice, lastUpdated } = useCryptoPrices();
  const [loading, setLoading] = useState(true);

  const metrics = useMemo((): PortfolioMetrics => {
    if (!entries.length) {
      return {
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        dayPnL: 0,
        weekPnL: 0,
        monthPnL: 0,
        assetCount: 0,
        totalTrades: 0,
        winRate: 0,
        avgTradeSize: 0,
        bestPerformer: null,
        worstPerformer: null,
        lastUpdated: lastUpdated
      };
    }

    // Calculate portfolio holdings from spot and wallet entries
    const holdings = new Map<string, {
      quantity: number;
      avgPrice: number;
      totalCost: number;
      pnl: number;
    }>();

    entries.forEach(entry => {
      if (entry.type === 'spot' || entry.type === 'wallet') {
        const current = holdings.get(entry.asset) || { quantity: 0, avgPrice: 0, totalCost: 0, pnl: 0 };
        
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
        holdings.set(entry.asset, current);
      }
    });

    // Calculate current portfolio value
    let totalValue = 0;
    let totalCostBasis = 0;
    
    holdings.forEach((holding, asset) => {
      if (holding.quantity > 0) {
        const currentPrice = getAssetPrice(asset) || holding.avgPrice;
        const currentValue = holding.quantity * currentPrice;
        const costBasis = holding.quantity * holding.avgPrice;
        
        totalValue += currentValue;
        totalCostBasis += costBasis;
      }
    });

    const totalPnL = totalValue - totalCostBasis;
    const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    // Calculate time-based P&L
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dayPnL = entries
      .filter(e => new Date(e.date) >= dayAgo)
      .reduce((sum, e) => sum + e.pnl, 0);

    const weekPnL = entries
      .filter(e => new Date(e.date) >= weekAgo)
      .reduce((sum, e) => sum + e.pnl, 0);

    const monthPnL = entries
      .filter(e => new Date(e.date) >= monthAgo)
      .reduce((sum, e) => sum + e.pnl, 0);

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
      dayPnL,
      weekPnL,
      monthPnL,
      assetCount: holdings.size,
      totalTrades: trades.length,
      winRate,
      avgTradeSize,
      bestPerformer,
      worstPerformer,
      lastUpdated
    };
  }, [entries, getAssetPrice, lastUpdated]);

  useEffect(() => {
    setLoading(entriesLoading);
  }, [entriesLoading]);

  return {
    metrics,
    loading
  };
}