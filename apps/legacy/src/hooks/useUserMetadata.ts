import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  avatar_url?: string;
}

interface UserPreferences {
  notifications: boolean;
  email_updates: boolean;
  marketing: boolean;
  favorite_chains: string[];
  favorite_tokens: string[];
  min_whale_threshold: number;
}

interface UserOnboarding {
  completed: boolean;
  steps_completed: string[];
}

interface UserSubscription {
  plan: string;
  status?: string;
  current_period_end?: string;
}

interface UserMetadata {
  profile: UserProfile;
  preferences: UserPreferences;
  onboarding: UserOnboarding;
  subscription?: UserSubscription;
  created_at: string;
  updated_at: string;
}

export const useUserMetadata = () => {
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMetadata(null);
      setLoading(false);
      return;
    }

    fetchUserMetadata();
  }, [user]);

  const fetchUserMetadata = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Metadata fetch timeout')), 3000)
      );

      // Fetch user subscription info first
      const userDataPromise = supabase
        .from('users')
        .select('plan, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: userData, error: userError } = await Promise.race([
        userDataPromise,
        timeoutPromise
      ]) as any;

      if (userError) {
        console.error('User data error:', userError);
      }

      // If no user data exists, try to create it
      if (!userData && !userError) {
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'free',
            onboarding_completed: false,
          });

        if (createUserError && !createUserError.message.includes('duplicate key')) {
          console.error('Error creating user record:', createUserError);
        }
      }

      // Fetch user metadata with timeout
      const metadataPromise = supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: metadataData, error: metadataError } = await Promise.race([
        metadataPromise,
        timeoutPromise
      ]) as any;

      let metadata: any = {};
      
      if (metadataError) {
        console.error('Metadata error:', metadataError);
      }

      if (!metadataData && !metadataError) {
        // Create default metadata if it doesn't exist
        const defaultProfile = {
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
        };

        const defaultPreferences = {
          notifications: true,
          email_updates: true,
          marketing: false,
          favorite_chains: [],
          favorite_tokens: [],
          min_whale_threshold: 1000000,
        };

        const defaultSubscription = {
          plan: 'free',
          status: 'free',
        };

        // Try to create the metadata record with new structure
        const { error: createError } = await supabase
          .from('users_metadata')
          .insert({
            user_id: user.id,
            profile: defaultProfile,
            preferences: defaultPreferences,
            subscription: defaultSubscription,
          });

        if (createError && !createError.message.includes('duplicate key')) {
          console.error('Error creating metadata:', createError);
        }

        metadata = {
          profile: defaultProfile,
          preferences: defaultPreferences,
          onboarding: {
            completed: false,
            steps_completed: [],
          },
        };
      } else if (metadataData) {
        // Use the new column structure
        metadata = {
          profile: metadataData.profile || {
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
          },
          preferences: metadataData.preferences || {
            notifications: true,
            email_updates: true,
            marketing: false,
            favorite_chains: [],
            favorite_tokens: [],
            min_whale_threshold: 1000000,
          },
          onboarding: {
            completed: false,
            steps_completed: [],
          },
        };
      } else {
        // Use fallback metadata
        metadata = {
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
          onboarding: {
            completed: false,
            steps_completed: [],
          },
        };
      }

      // Fetch subscription details with timeout
      const subscriptionPromise = supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: subscriptionData } = await Promise.race([
        subscriptionPromise,
        timeoutPromise
      ]) as any;

      const combinedMetadata: UserMetadata = {
        ...metadata,
        subscription: {
          plan: userData?.plan || 'free',
          status: subscriptionData?.status,
          current_period_end: subscriptionData?.current_period_end,
        },
        created_at: userData?.created_at || new Date().toISOString(),
        updated_at: metadataData?.updated_at || new Date().toISOString(),
      };

      setMetadata(combinedMetadata);
    } catch (err) {
      console.error('Error fetching user metadata:', err);
      
      // Provide fallback metadata
      const fallbackMetadata: UserMetadata = {
        profile: {
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
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
        onboarding: {
          completed: false,
          steps_completed: [],
        },
        subscription: {
          plan: 'free',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setMetadata(fallbackMetadata);
      setError('Using default profile data. Please refresh to sync with database.');
    } finally {
      setLoading(false);
    }
  };

  return { metadata, loading, error, refetch: fetchUserMetadata };
};

export const updateUserMetadata = async (userId: string, updates: Partial<UserMetadata>) => {
  try {
    const { error } = await supabase
      .from('users_metadata')
      .update({
        metadata: updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return { success: false, error };
  }
};