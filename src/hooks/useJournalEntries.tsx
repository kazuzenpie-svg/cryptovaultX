import { useState, useEffect } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database } from '@/integrations/supabase/types';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'] & {
  platforms?: {
    name: string;
    slug: string;
  };
};

export interface CreateJournalEntryData {
  type: Database['public']['Enums']['entry_type'];
  platform_id?: string;
  date: string;
  asset: string;
  symbol?: string;
  quantity?: number;
  price_usd?: number;
  fees?: number;
  pnl?: number;
  side?: Database['public']['Enums']['trade_side'];
  leverage?: number;
  currency?: Database['public']['Enums']['currency_code'];
  extras?: Database['public']['Tables']['journal_entries']['Insert']['extras'];
  is_personal?: boolean;
  notes?: string;
}

export function useJournalEntries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchEntries = async (limit?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          platforms (
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      const list = data || [];
      setEntries(list);
      // cache per-user
      cacheSet(`journal.${user.id}.entries`, list, CACHE_TTL);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: "Error loading entries",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: CreateJournalEntryData) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: user.id,
          fees: 0,
          pnl: 0,
          currency: 'USD',
          is_personal: false,
          ...entryData,
        }])
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => {
        const next = [data, ...prev];
        cacheSet(`journal.${user.id}.entries`, next, CACHE_TTL);
        return next;
      });
      
      toast({
        title: "Entry added! 📝",
        description: `${entryData.type} entry for ${entryData.asset} has been logged.`,
        className: "bg-success text-success-foreground",
      });

      return { error: null, data };
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error adding entry",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => {
        const next = prev.map(entry => (entry.id === id ? data : entry));
        cacheSet(`journal.${user.id}.entries`, next, CACHE_TTL);
        return next;
      });

      toast({
        title: "Entry updated! ✨",
        description: "Your changes have been saved.",
        className: "bg-success text-success-foreground",
      });

      return { error: null, data };
    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      toast({
        title: "Error updating entry",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => {
        const next = prev.filter(entry => entry.id !== id);
        cacheSet(`journal.${user.id}.entries`, next, CACHE_TTL);
        return next;
      });

      toast({
        title: "Entry deleted! 🗑️",
        description: "The entry has been permanently removed.",
        className: "bg-warning text-warning-foreground",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "Error deleting entry",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Hydrate from cache immediately for current user
  useEffect(() => {
    if (!user) return;
    const cached = cacheGet<JournalEntry[]>(`journal.${user.id}.entries`);
    if (cached && Array.isArray(cached)) {
      setEntries(cached);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user?.id]);

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries
  };
}