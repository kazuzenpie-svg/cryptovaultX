import { useMemo } from 'react';
import { useJournalEntries } from './useJournalEntries';
import { useSharedEntries } from './useSharedEntries';
import { useDataVisibility } from './useDataVisibility';
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
  isShared?: boolean; // Flag to identify shared vs own entries
  sourceId?: string; // ID of the data source
  grant_id?: string; // ID of the grant (for shared entries)
  symbol?: string; // Trading symbol (e.g., BTC, ETH)
};

export function useCombinedEntries() {
  const { entries: ownEntries, loading: ownLoading, ...ownMethods } = useJournalEntries();
  const { sharedEntries, loading: sharedLoading } = useSharedEntries();
  const { isSourceVisible, getVisibleSourceIds } = useDataVisibility();

  // Combine and filter entries based on individual source visibility
  const combinedEntries = useMemo(() => {
    const result: JournalEntry[] = [];
    const visibleSourceIds = getVisibleSourceIds();

    // Add own entries if visible
    if (isSourceVisible('own')) {
      const ownWithFlag = ownEntries.map(entry => ({
        ...entry,
        isShared: false,
        sourceId: 'own'
      }));
      result.push(...ownWithFlag);
    }

    // Add shared entries from visible sources only
    const visibleGrantIds = getVisibleSourceIds().filter(id => id !== 'own');
    const visibleSharedEntries = sharedEntries.filter(entry => {
      // Check if this entry's grant is visible
      return entry.grant_id && visibleGrantIds.includes(entry.grant_id);
    });

    const sharedWithFlag = visibleSharedEntries.map(entry => ({
      ...entry,
      isShared: true,
      sourceId: entry.grant_id // Use grant ID as source identifier
    }));
    result.push(...sharedWithFlag);

    // Sort by date (newest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ownEntries, sharedEntries, isSourceVisible, getVisibleSourceIds]);

  const loading = ownLoading || sharedLoading;

  // Only expose methods for own entries (shared entries are read-only)
  return {
    entries: combinedEntries,
    ownEntries,
    sharedEntries,
    loading,
    // Own entry methods (only work on user's own data)
    createEntry: ownMethods.createEntry,
    updateEntry: ownMethods.updateEntry,
    deleteEntry: ownMethods.deleteEntry,
    refetch: ownMethods.refetch
  };
}