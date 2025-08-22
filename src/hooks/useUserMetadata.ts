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

      // Fetch user subscription info first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

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

      // Fetch user metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let metadata: any = {};
      
      if (metadataError) {
        console.error('Metadata error:', metadataError);
      }

      if (!metadataData && !metadataError) {
        // Create default metadata if it doesn't exist
        const defaultMetadata = {
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

        // Try to create the metadata record
        const { error: createError } = await supabase
          .from('users_metadata')
          .insert({
            user_id: user.id,
            metadata: defaultMetadata,
          });

        if (createError && !createError.message.includes('duplicate key')) {
          console.error('Error creating metadata:', createError);
        }

        metadata = defaultMetadata;
      } else if (metadataData) {
        metadata = metadataData.metadata;
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

      // Fetch subscription details
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .single();

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