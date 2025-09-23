import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Database } from '@/integrations/supabase/types';

type AccessGrant = Database['public']['Tables']['access_grants']['Row'] & {
  sharer_profile?: {
    username: string;
    avatar_url?: string;
  };
  viewer_profile?: {
    username: string;
    avatar_url?: string;
  };
};

type CreateAccessGrantData = {
  viewer_id: string;
  shared_types: Database['public']['Enums']['entry_type'][];
  expires_at?: string;
  date_from?: string;
  date_to?: string;
  min_pnl?: number;
  message?: string;
};

export function useAccessGrants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<AccessGrant[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrants = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch all grants where user is involved
      const { data, error } = await supabase
        .from('access_grants')
        .select(`
          *,
          sharer_profile:profiles!access_grants_sharer_id_fkey (
            username,
            avatar_url
          ),
          viewer_profile:profiles!access_grants_viewer_id_fkey (
            username,
            avatar_url
          )
        `)
        .or(`viewer_id.eq.${user.id},sharer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allGrants = data || [];
      setGrants(allGrants.filter(g => g.status === 'granted'));
      setIncomingRequests(allGrants.filter(g => g.sharer_id === user.id && g.status === 'pending'));
      setOutgoingRequests(allGrants.filter(g => g.viewer_id === user.id && g.status === 'pending'));
    } catch (error: any) {
      console.error('Error fetching access grants:', error);
      toast({
        title: "Error loading sharing data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (grantData: CreateAccessGrantData) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('🚀 requestAccess called with:', grantData);
      console.log('👤 Current user:', user.id);
    }

    try {
      setLoading(true);
      
      // Step 1: Validate input data
      if (!grantData.viewer_id?.trim()) {
        throw new Error('User ID is required');
      }
      
      if (!grantData.shared_types || grantData.shared_types.length === 0) {
        throw new Error('At least one entry type must be selected');
      }
      
      const viewerId = grantData.viewer_id.trim();
      if (import.meta.env.DEV) console.log('👤 Target user ID:', viewerId);
      
      // Step 2: Validate the user ID exists in profiles
      if (import.meta.env.DEV) console.log('🔍 Validating user ID...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', viewerId)
        .limit(1);

      if (profileError) {
        if (import.meta.env.DEV) console.log('❌ Profile lookup error:', profileError);
        throw new Error(`Error validating user: ${profileError.message}`);
      }

      // Step 3: Validate user exists
      if (!profiles || profiles.length === 0) {
        if (import.meta.env.DEV) console.log('❌ User not found with ID:', viewerId);
        throw new Error(`No user found with that ID. Please check the user ID or ask them to create an account.`);
      }
      
      const targetUser = profiles[0];
      if (import.meta.env.DEV) console.log('✅ User found:', targetUser);
      
      // Step 3.5: Prevent self-sharing
      if (viewerId === user.id) {
        if (import.meta.env.DEV) console.log('❌ Attempted self-sharing');
        throw new Error('You cannot send a sharing request to yourself. Please select a different user.');
      }
      
      // Step 4: Check for existing request
      if (import.meta.env.DEV) console.log('🔍 Checking for existing requests...');
      const { data: existingGrant, error: existingError } = await supabase
        .from('access_grants')
        .select('id, status')
        .eq('viewer_id', user.id)
        .eq('sharer_id', viewerId)
        .maybeSingle();
        
      if (existingError && existingError.code !== 'PGRST116') {
        if (import.meta.env.DEV) console.log('❌ Existing grant check error:', existingError);
        throw new Error(`Error checking existing requests: ${existingError.message}`);
      }
      
      if (existingGrant) {
        if (import.meta.env.DEV) console.log('❌ Existing grant found:', existingGrant);
        const statusMessage = existingGrant.status === 'pending' 
          ? `You already have a pending request with ${targetUser.username}`
          : `You already have a ${existingGrant.status} request with ${targetUser.username}`;
        throw new Error(statusMessage);
      }

      if (import.meta.env.DEV) console.log('✅ No existing grant found, proceeding...');

      // Step 5: Prepare insert data
      const insertData = {
        viewer_id: user.id,   // Current user (the one requesting access)
        sharer_id: viewerId,  // The user we're requesting access FROM
        shared_types: grantData.shared_types,
        expires_at: grantData.expires_at ? new Date(grantData.expires_at).toISOString() : null,
        date_from: grantData.date_from ? new Date(grantData.date_from).toISOString() : null,
        date_to: grantData.date_to ? new Date(grantData.date_to).toISOString() : null,
        min_pnl: grantData.min_pnl || null,
        message: grantData.message || null,
        status: 'pending' as const
      };

      if (import.meta.env.DEV) console.log('📝 Insert data prepared:', insertData);

      // Step 6: Insert the access grant
      if (import.meta.env.DEV) console.log('🚀 Inserting access grant...');
      const { data, error } = await supabase
        .from('access_grants')
        .insert([insertData])
        .select(`
          *,
          viewer_profile:profiles!access_grants_viewer_id_fkey (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) {
        if (import.meta.env.DEV) console.log('❌ Insert error:', error);
        
        // Provide specific error messages for different database errors
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`You already have a sharing request with ${targetUser.username}. Check your Outgoing requests tab.`);
        }
        if (error.code === '42501') { // Insufficient privilege
          throw new Error('Permission denied. Please ensure you are logged in and try again.');
        }
        if (error.code === '23503') { // Foreign key violation
          throw new Error('Invalid user reference. The selected user may no longer exist.');
        }
        if (error.code === '23514') { // Check constraint violation
          throw new Error('Invalid data provided. Please check your form inputs and try again.');
        }
        
        // Handle RLS policy violations
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          throw new Error('Access denied. Please ensure you have permission to create sharing requests.');
        }
        
        // Generic database error with more context
        throw new Error(`Unable to send sharing request: ${error.message}. Please try again or contact support if the issue persists.`);
      }
      
      if (!data) {
        if (import.meta.env.DEV) console.log('❌ No data returned from insert');
        throw new Error('Request was sent but no confirmation received. Please check your Outgoing requests tab.');
      }
      
      if (import.meta.env.DEV) console.log('✅ Access grant created successfully:', data);
      
      // Step 7: Update local state with the new request
      setOutgoingRequests(prev => [data, ...prev]);
      
      // Return success with user-friendly data
      return { 
        error: null, 
        data: {
          ...data,
          targetUser: targetUser.username,
          message: `Sharing request sent successfully to ${targetUser.username}!`
        }
      };
      
    } catch (error: any) {
      if (import.meta.env.DEV) console.log('🔥 requestAccess error:', error);
      // Return error without showing toast - let the component handle the UI feedback
      const errorMessage = error.message || 'An unexpected error occurred while sending the request';
      
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (grantId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_grants')
        .update({ status: 'granted' })
        .eq('id', grantId)
        .eq('sharer_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setIncomingRequests(prev => prev.filter(g => g.id !== grantId));
      setGrants(prev => [data, ...prev]);

      toast({
        title: "Access granted! ✅",
        description: "The user can now view your shared trading data.",
        className: "bg-success text-success-foreground",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const denyRequest = async (grantId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('access_grants')
        .update({ status: 'denied' })
        .eq('id', grantId)
        .eq('sharer_id', user.id);

      if (error) throw error;

      setIncomingRequests(prev => prev.filter(g => g.id !== grantId));

      toast({
        title: "Request denied",
        description: "The access request has been declined.",
        className: "bg-warning text-warning-foreground",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error denying request:', error);
      toast({
        title: "Error denying request",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (grantId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('access_grants')
        .update({ status: 'revoked' })
        .eq('id', grantId)
        .eq('sharer_id', user.id);

      if (error) throw error;

      setGrants(prev => prev.filter(g => g.id !== grantId));

      toast({
        title: "Access revoked! 🚫",
        description: "The user can no longer view your trading data.",
        className: "bg-warning text-warning-foreground",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error revoking access",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGrants();
    }
  }, [user]);

  return {
    grants,
    incomingRequests,
    outgoingRequests,
    loading,
    requestAccess,
    approveRequest,
    denyRequest,
    revokeAccess,
    refetch: fetchGrants
  };
}