import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

        // Create user record if it doesn't exist
        if (event === 'SIGNED_IN' && session?.user) {
          await createUserRecord(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createUserRecord = async (user: User) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User creation timeout')), 5000)
      );

      // Check if user record exists
      const checkUserPromise = supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: existingUser, error: checkUserError } = await Promise.race([
        checkUserPromise,
        timeoutPromise
      ]) as any;

      if (checkUserError) {
        console.error('Error checking user record:', checkUserError);
        return;
      }

      if (!existingUser) {
        // Create user record with timeout
        const createUserPromise = supabase
          .from('users')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'free',
            onboarding_completed: false,
          });

        const { error: userError } = await Promise.race([
          createUserPromise,
          timeoutPromise
        ]) as any;

        if (userError && !userError.message.includes('duplicate key') && !userError.message.includes('timeout')) {
          console.error('Error creating user record:', userError);
        }
      }

      // Check if user metadata exists with timeout
      const checkMetadataPromise = supabase
        .from('users_metadata')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: existingMetadata, error: checkMetadataError } = await Promise.race([
        checkMetadataPromise,
        timeoutPromise
      ]) as any;

      if (checkMetadataError) {
        console.error('Error checking user metadata:', checkMetadataError);
        return;
      }

      if (!existingMetadata) {
        // Create user metadata record with timeout
        const createMetadataPromise = supabase
          .from('users_metadata')
          .insert({
            user_id: user.id,
            profile: {
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url,
            },
            preferences: {
              notifications: true,
              email_updates: true,
              marketing: false,
              favorite_chains: [],
              favorite_tokens: [],
              min_whale_threshold: 1000000,
            },
            subscription: {
              plan: 'free',
              status: 'free',
            },
          });

        const { error: metadataError } = await Promise.race([
          createMetadataPromise,
          timeoutPromise
        ]) as any;

        if (metadataError && !metadataError.message.includes('duplicate key') && !metadataError.message.includes('timeout')) {
          console.error('Error creating user metadata:', metadataError);
        }
      }
    } catch (error) {
      console.error('Error in createUserRecord:', error);
      // Don't let user creation errors block login
    }
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