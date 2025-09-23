import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCryptoPrices } from './useCryptoPrices';
import type { Database } from '@/integrations/supabase/types';

type PortfolioItem = Database['public']['Views']['portfolio_summary']['Row'];
type CashflowSummary = Database['public']['Views']['cashflow_summary']['Row'];

export function usePortfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchSimplePrices, getAssetPrice, prices, lastUpdated } = useCryptoPrices();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [cashflow, setCashflow] = useState<CashflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [livePortfolio, setLivePortfolio] = useState<any[]>([]);

  const fetchPortfolio = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('current_value_usd', { ascending: false });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error loading portfolio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCashflow = async (limit?: number) => {
    if (!user) return;

    try {
      let query = supabase
        .from('cashflow_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCashflow(data || []);
    } catch (error: any) {
      console.error('Error fetching cashflow:', error);
      toast({
        title: "Error loading cashflow data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPortfolioStats = () => {
    if (!livePortfolio.length) {
      return {
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        assetCount: 0,
        lastPriceUpdate: lastUpdated
      };
    }

    const totalValue = livePortfolio.reduce((sum, item) => sum + (item.current_value_usd || 0), 0);
    const totalPnL = livePortfolio.reduce((sum, item) => {
      const currentValue = item.current_value_usd || 0;
      const costBasis = (item.avg_entry_price || 0) * (item.total_quantity || 0);
      return sum + (currentValue - costBasis);
    }, 0);
    const totalCostBasis = livePortfolio.reduce((sum, item) => {
      return sum + ((item.avg_entry_price || 0) * (item.total_quantity || 0));
    }, 0);
    const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      assetCount: livePortfolio.length,
      lastPriceUpdate: lastUpdated
    };
  };

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchCashflow(30); // Last 30 entries
    }
  }, [user]);

  // Update portfolio with live prices
  const updatePortfolioWithLivePrices = async () => {
    if (!portfolio.length) return;

    try {
      // Extract unique assets from portfolio
      const assets = [...new Set(portfolio.map(item => item.asset))];
      
      // Fetch live prices for these assets
      await fetchSimplePrices(assets);
      
      // Update portfolio with live prices
      const updatedPortfolio = portfolio.map(item => {
        const livePrice = getAssetPrice(item.asset);
        const currentValue = livePrice ? livePrice * item.total_quantity : item.current_value_usd;
        
        return {
          ...item,
          current_price_usd: livePrice || item.current_price_usd,
          current_value_usd: currentValue,
          price_last_updated: lastUpdated?.toISOString() || new Date().toISOString()
        };
      });
      
      setLivePortfolio(updatedPortfolio);
    } catch (error: any) {
      console.error('Error updating portfolio with live prices:', error);
    }
  };

  // Auto-update prices every 5 minutes
  useEffect(() => {
    if (portfolio.length > 0) {
      updatePortfolioWithLivePrices();
      
      const interval = setInterval(() => {
        updatePortfolioWithLivePrices();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [portfolio, getAssetPrice]);

  useEffect(() => {
    setLivePortfolio(portfolio);
  }, [portfolio]);

  return {
    portfolio: livePortfolio,
    cashflow,
    loading,
    getPortfolioStats,
    updatePortfolioWithLivePrices,
    refetch: () => {
      fetchPortfolio();
      fetchCashflow(30);
    }
  };
}