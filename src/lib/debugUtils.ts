// Debug utilities for testing sharing functionality
import { supabase } from '@/integrations/supabase/client';

// Create a test profile for debugging sharing functionality
export const createTestProfile = async (username: string) => {
  try {
    console.log('📤 Creating test profile:', username);
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      return { success: true, profile: existingProfile };
    }
    
    // For debugging, we need a real user ID from auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, message: 'No authenticated user to create test profile' };
    }
    
    console.log('⚠️ Note: Cannot create test profiles with different user IDs due to RLS.');
    console.log('⚠️ To test sharing, you need another real user account.');
    
    return { 
      success: false, 
      message: 'Test profile creation requires manual user signup for security' 
    };
  } catch (error) {
    console.error('❌ Error with test profile:', error);
    return { success: false, error };
  }
};

// Debug function to check current auth state
export const debugAuthState = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔐 Current auth state:', {
      session: session ? {
        user_id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      } : null,
      error
    });
    
    if (session?.user) {
      // Also check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      console.log('👤 Current profile:', { profile, profileError });
    }
    
    return session;
  } catch (error) {
    console.error('❌ Error checking auth state:', error);
    return null;
  }
};

// Debug function to check database connectivity
export const debugDatabaseConnection = async () => {
  try {
    console.log('🗄️ Testing database connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    console.log('✅ Database connection test:', { data, error });
    return !error;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Debug function to list all profiles (for testing)
export const debugListProfiles = async () => {
  try {
    console.log('👥 Fetching all profiles for debugging...');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    console.log('👥 Available profiles:', profiles);
    return profiles || [];
  } catch (error) {
    console.error('❌ Error fetching profiles:', error);
    return [];
  }
};

// Make debug functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  (window as any).debugDB = debugDatabaseConnection;
  (window as any).debugProfiles = debugListProfiles;
  (window as any).createTestProfile = createTestProfile;
  
  console.log('🛠️ Debug utilities loaded. Available commands:');
  console.log('- debugAuth() - Check current authentication state');
  console.log('- debugDB() - Test database connection');
  console.log('- debugProfiles() - List available profiles');
  console.log('- createTestProfile(username) - Create test profile');
}