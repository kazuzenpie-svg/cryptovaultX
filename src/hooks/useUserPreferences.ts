import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserPreferences = {
  tokenmetrics_api_key?: string | null;
};

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!user) {
        setPrefs({});
        return;
      }
      const { data, error } = await supabase
        .from('user_api_prefs')
        .select('tokenmetrics_api_key')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setPrefs({ tokenmetrics_api_key: data?.tokenmetrics_api_key ?? null });
    } catch (e: any) {
      setError(e?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next: UserPreferences) => {
    setLoading(true);
    setError(undefined);
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!user) throw new Error('Not authenticated');
      const payload = {
        user_id: user.id,
        tokenmetrics_api_key: next.tokenmetrics_api_key ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_api_prefs')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      setPrefs({ tokenmetrics_api_key: next.tokenmetrics_api_key ?? null });
    } catch (e: any) {
      setError(e?.message || 'Failed to save preferences');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { prefs, loading, error, reload: load, save };
}
