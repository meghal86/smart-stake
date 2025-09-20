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
  minAmountUsd: 500000,
  preferredChains: [],
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
      // Try to load from localStorage first as fallback
      const stored = localStorage.getItem(`whale_prefs_${user?.id}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
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
    console.log('Updating preferences from:', preferences, 'to:', updatedPreferences);
    setPreferences(updatedPreferences);

    try {
      // Store in localStorage as fallback
      localStorage.setItem(`whale_prefs_${user.id}`, JSON.stringify(updatedPreferences));
      console.log('Preferences stored in localStorage');
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