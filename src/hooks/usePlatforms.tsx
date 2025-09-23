import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
}

export function usePlatforms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('is_custom', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error: any) {
      console.error('Error fetching platforms:', error);
      toast({
        title: "Error loading platforms",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomPlatform = async (platformData: {
    name: string;
    description?: string;
    logo_url?: string;
  }) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const slug = platformData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const { data, error } = await supabase
        .from('platforms')
        .insert([{
          ...platformData,
          slug,
          is_custom: true,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setPlatforms(prev => [...prev, data]);
      
      toast({
        title: "Custom platform created! 🚀",
        description: `${platformData.name} has been added to your platforms.`,
        className: "bg-success text-success-foreground",
      });

      return { error: null, data };
    } catch (error: any) {
      console.error('Error creating custom platform:', error);
      toast({
        title: "Error creating platform",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  return {
    platforms,
    loading,
    createCustomPlatform,
    refetch: fetchPlatforms
  };
}