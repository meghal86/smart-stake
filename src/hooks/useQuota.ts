import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from './useTier';
import { supabase } from '@/integrations/supabase/client';

interface QuotaUsage {
  predictions_used: number;
  alerts_used: number;
  last_reset: string;
}

export function useQuota() {
  const { user } = useAuth();
  const { tier, features } = useTier();
  const [usage, setUsage] = useState<QuotaUsage>({
    predictions_used: 0,
    alerts_used: 0,
    last_reset: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && tier !== 'guest') {
      fetchUsage();
    } else {
      setLoading(false);
    }
  }, [user, tier]);

  const fetchUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single();

      if (data) {
        setUsage({
          predictions_used: data.predictions_used || 0,
          alerts_used: data.alerts_used || 0,
          last_reset: data.date
        });
      }
    } catch (error) {
      // No usage record for today, start fresh
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: 'predictions' | 'alerts') => {
    if (tier === 'guest') return false;

    const today = new Date().toISOString().split('T')[0];
    const field = `${type}_used`;
    const newValue = usage[field] + 1;

    try {
      await supabase
        .from('usage_metrics')
        .upsert({
          user_id: user?.id,
          date: today,
          [field]: newValue
        }, { onConflict: 'user_id,date' });

      setUsage(prev => ({ ...prev, [field]: newValue }));
      return true;
    } catch (error) {
      return false;
    }
  };

  const canUsePredictions = () => {
    if (features.predictions_per_day === -1) return true;
    return usage.predictions_used < features.predictions_per_day;
  };

  const canCreateAlert = () => {
    if (features.alerts_limit === -1) return true;
    return usage.alerts_used < features.alerts_limit;
  };

  const getPredictionsProgress = () => {
    if (features.predictions_per_day === -1) return 0;
    return (usage.predictions_used / features.predictions_per_day) * 100;
  };

  const getAlertsProgress = () => {
    if (features.alerts_limit === -1) return 0;
    return (usage.alerts_used / features.alerts_limit) * 100;
  };

  return {
    usage,
    loading,
    canUsePredictions,
    canCreateAlert,
    incrementUsage,
    getPredictionsProgress,
    getAlertsProgress,
    predictionsRemaining: features.predictions_per_day === -1 ? -1 : features.predictions_per_day - usage.predictions_used,
    alertsRemaining: features.alerts_limit === -1 ? -1 : features.alerts_limit - usage.alerts_used
  };
}