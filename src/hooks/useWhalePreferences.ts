import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WhalePreferences {
  minAmountUsd: number;
  preferredChains: string[];
  excludeExchanges: boolean;
  notificationEnabled: boolean;
}

const defaultPreferences: WhalePreferences = {
  minAmountUsd: 1000000,
  preferredChains: ['ethereum'],
  excludeExchanges: false,
  notificationEnabled: true
};

export function useWhalePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<WhalePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          minAmountUsd: data.whale_min_amount || defaultPreferences.minAmountUsd,
          preferredChains: data.whale_chains || defaultPreferences.preferredChains,
          excludeExchanges: data.whale_exclude_exchanges || defaultPreferences.excludeExchanges,
          notificationEnabled: data.whale_notifications || defaultPreferences.notificationEnabled
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<WhalePreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          whale_min_amount: updatedPreferences.minAmountUsd,
          whale_chains: updatedPreferences.preferredChains,
          whale_exclude_exchanges: updatedPreferences.excludeExchanges,
          whale_notifications: updatedPreferences.notificationEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating preferences:', error);
        // Revert on error
        setPreferences(preferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoading
  };
}