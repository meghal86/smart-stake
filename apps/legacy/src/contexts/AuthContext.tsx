import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createUserIfNotExists } from '@/utils/databaseTest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create user record if it doesn't exist (non-blocking)
        if (event === 'SIGNED_IN' && session?.user) {
          createUserRecord(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createUserRecord = async (user: User) => {
    // Run this in the background without blocking the auth flow
    setTimeout(async () => {
      try {
        // Use the simpler utility function
        const result = await createUserIfNotExists(user.id, user.email || '');
        
        if (!result.success) {
          console.error('Failed to create user record:', result.error);
        }

        // Try to create metadata record (optional) - but don't override existing subscription data
        try {
          // First check if metadata already exists
          const { data: existingMetadata } = await supabase
            .from('users_metadata')
            .select('subscription')
            .eq('user_id', user.id)
            .single();

          // Only set default subscription if no existing data
          const subscriptionData = existingMetadata?.subscription || {
            plan: 'free',
            status: 'free',
          };

          await supabase
            .from('users_metadata')
            .upsert({
              user_id: user.id,
              profile: {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                avatar_url: user.user_metadata?.avatar_url || null,
              },
              preferences: {
                notifications: true,
                email_updates: true,
                marketing: false,
                favorite_chains: [],
                favorite_tokens: [],
                min_whale_threshold: 1000000,
              },
              subscription: subscriptionData,
            }, {
              onConflict: 'user_id'
            });
        } catch (metadataError) {
          console.error('Metadata creation error (non-critical):', metadataError);
        }
      } catch (error) {
        console.error('Background user creation error:', error);
        // This is non-blocking, so we just log the error
      }
    }, 500); // Slightly longer delay to ensure auth is fully complete
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};