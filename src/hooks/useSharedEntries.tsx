import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAccessGrants } from './useAccessGrants';
import type { Database } from '@/integrations/supabase/types';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'] & {
  platforms?: {
    name: string;
    slug: string;
  };
  sharer_profile?: {
    username: string;
    avatar_url?: string;
  };
  grant_id?: string; // ID of the grant that provides access to this entry
};

export function useSharedEntries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { grants } = useAccessGrants();
  const [sharedEntries, setSharedEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSharedEntries = async () => {
    if (!user || grants.length === 0) {
      setSharedEntries([]);
      return;
    }

    try {
      setLoading(true);
      const allSharedEntries: JournalEntry[] = [];

      // Fetch entries for each granted access
      for (const grant of grants) {
        if (grant.status !== 'granted') continue;

        // Build filters based on grant permissions
        let query = supabase
          .from('journal_entries')
          .select(`
            *,
            platforms (
              name,
              slug
            )
          `)
          .eq('user_id', grant.sharer_id)
          .in('type', grant.shared_types)
          .order('date', { ascending: false });

        // Apply date filters if specified
        if (grant.date_from) {
          query = query.gte('date', grant.date_from);
        }
        if (grant.date_to) {
          query = query.lte('date', grant.date_to);
        }

        // Apply PnL filter if specified
        if (grant.min_pnl !== null && grant.min_pnl !== undefined) {
          query = query.gte('pnl', grant.min_pnl);
        }

        // Check if grant has expired
        if (grant.expires_at) {
          const expiryDate = new Date(grant.expires_at);
          if (expiryDate < new Date()) {
            continue; // Skip expired grants
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching shared entries from ${grant.sharer_profile?.username}:`, error);
          continue; // Continue with other grants even if one fails
        }

        if (data && data.length > 0) {
          // Add sharer profile info and grant ID to each entry
          const entriesWithSharer = data.map(entry => ({
            ...entry,
            sharer_profile: grant.sharer_profile,
            grant_id: grant.id // Add grant ID for filtering
          }));
          allSharedEntries.push(...entriesWithSharer);
        }
      }

      // Sort all shared entries by date (newest first)
      allSharedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSharedEntries(allSharedEntries);
    } catch (error: any) {
      console.error('Error fetching shared entries:', error);
      toast({
        title: "Error loading shared data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && grants.length > 0) {
      fetchSharedEntries();
    } else {
      setSharedEntries([]);
    }
  }, [user?.id, grants.length]);

  return {
    sharedEntries,
    loading,
    refetch: fetchSharedEntries
  };
}