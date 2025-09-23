import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export function AccessGrantsDebug() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetUserId, setTargetUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testInsert = async () => {
    if (!user || !targetUserId.trim()) {
      toast({
        title: "Missing data",
        description: "Please ensure you're logged in and enter a target user ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🔧 Testing access grant insertion...');
      console.log('Current user:', user.id);
      console.log('Target user ID:', targetUserId.trim());

      // STEP 1: Check if current user (viewer) has a profile
      console.log('👤 Checking viewer profile...');
      const { data: viewerProfile, error: viewerError } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .eq('id', user.id)
        .single();

      if (viewerError) {
        console.error('❌ Viewer profile error:', viewerError);
        setResult({
          success: false,
          step: 'viewer_profile_check',
          error: viewerError,
          errorCode: viewerError.code,
          errorMessage: `Viewer profile check failed: ${viewerError.message}`,
          recommendation: 'Current user needs to complete profile setup'
        });
        
        toast({
          title: "Profile not found",
          description: `Your profile doesn't exist in database. Error: ${viewerError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Viewer profile found:', viewerProfile);

      // STEP 2: Check if target user (sharer) has a profile
      console.log('🎯 Checking target user profile...');
      const { data: sharerProfile, error: sharerError } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .eq('id', targetUserId.trim())
        .single();

      if (sharerError) {
        console.error('❌ Target user profile error:', sharerError);
        setResult({
          success: false,
          step: 'sharer_profile_check',
          error: sharerError,
          errorCode: sharerError.code,
          errorMessage: `Target user profile check failed: ${sharerError.message}`,
          recommendation: 'Target user ID may be invalid or user has not completed profile setup'
        });
        
        toast({
          title: "Target user not found",
          description: `Target user profile doesn't exist. Error: ${sharerError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Target user profile found:', sharerProfile);

      // STEP 3: Proceed with access grant insertion
      const insertData: Database['public']['Tables']['access_grants']['Insert'] = {
        viewer_id: user.id,          // Current user (must exist in profiles)
        sharer_id: targetUserId.trim(), // Target user (must exist in profiles)
        shared_types: ['spot'],
        status: 'pending',
        message: 'Debug test request'
      };

      console.log('📝 Insert data:', insertData);
      console.log('👤 Viewer profile:', viewerProfile);
      console.log('🎯 Sharer profile:', sharerProfile);

      const { data, error } = await supabase
        .from('access_grants')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        setResult({
          success: false,
          step: 'access_grant_insert',
          error: error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          viewerProfile: viewerProfile,
          sharerProfile: sharerProfile,
          insertData: insertData
        });
        
        toast({
          title: "Insert failed",
          description: `${error.code}: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Insert successful:', data);
        setResult({
          success: true,
          step: 'completed',
          data: data,
          viewerProfile: viewerProfile,
          sharerProfile: sharerProfile,
          insertData: insertData
        });
        
        toast({
          title: "Insert successful!",
          description: "Access grant created successfully",
          className: "bg-green-50 text-green-900 border-green-200",
        });
      }
    } catch (error: any) {
      console.error('🔥 Unexpected error:', error);
      setResult({
        success: false,
        step: 'unexpected_error',
        error: error,
        errorMessage: error.message || 'Unexpected error'
      });
      
      toast({
        title: "Unexpected error",
        description: error.message || 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    const session = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    const authUser = await supabase.auth.getUser();
    console.log('Current auth user:', authUser);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Grants Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to test access grants insertion.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Grants Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-user">Current User ID</Label>
          <Input 
            id="current-user"
            value={user.id} 
            readOnly 
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-user">Target User ID (who you want access FROM)</Label>
          <Input
            id="target-user"
            placeholder="Enter target user ID..."
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testInsert} 
            disabled={loading || !targetUserId.trim()}
            className="flex-1"
          >
            {loading ? 'Testing...' : 'Test Insert'}
          </Button>
          <Button 
            onClick={checkAuth} 
            variant="outline"
          >
            Check Auth
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          <p><strong>RLS Policy Check:</strong></p>
          <p>• INSERT policy: WITH CHECK (auth.uid() = viewer_id)</p>
          <p>• Current user ID: {user.id}</p>
          <p>• Will be set as viewer_id: {user.id}</p>
          <p>• Should be allowed if RLS is working correctly</p>
        </div>
      </CardContent>
    </Card>
  );
}