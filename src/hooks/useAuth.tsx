import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events and create profile if needed
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if profile exists, create if not
          setTimeout(() => {
            ensureUserProfile(session.user);
          }, 0);
          
          // Only show welcome toast for new logins, not on every page reload
          const hasSeenWelcomeToast = localStorage.getItem(`cryptovault_welcome_shown_${session.user.id}`);
          if (!hasSeenWelcomeToast) {
            toast({
              title: "Welcome to CryptoVault! 🚀",
              description: "Successfully signed in to your crypto journal.",
              className: "bg-success text-success-foreground",
            });
            
            // Mark that user has seen the welcome toast
            localStorage.setItem(`cryptovault_welcome_shown_${session.user.id}`, 'true');
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear welcome toast flag when user signs out
          // This allows the same user to see welcome toast on next login
          if (session?.user?.id) {
            localStorage.removeItem(`cryptovault_welcome_shown_${session.user.id}`);
          }
          
          toast({
            title: "Signed out",
            description: "Come back soon to track your crypto journey!",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If no profile exists, create one
      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            bio: null,
            avatar_url: null,
            preferred_currency: 'USD',
            privacy_sharing: 'connections_only',
            trading_focus: null
          }]);

        if (error) {
          console.error('Error creating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: { message: "This email is already registered. Try signing in instead!" } };
        }
        return { error };
      }

      toast({
        title: "Welcome aboard! 🎉",
        description: "Please check your email to verify your account.",
        className: "bg-success text-success-foreground",
      });

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: "Incorrect email or password. Please try again!" } };
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}