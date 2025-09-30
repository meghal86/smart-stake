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
      // Mock usage data since usage_metrics table doesn't exist
      const mockUsage = {
        predictions_used: Math.floor(Math.random() * 10),
        alerts_used: Math.floor(Math.random() * 5),
        last_reset: new Date().toISOString().split('T')[0]
      };
      setUsage(mockUsage);
    } catch (error) {
      // Fallback to default usage
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: 'predictions' | 'alerts') => {
    if (tier === 'guest') return false;

    const field = `${type}_used` as keyof QuotaUsage;
    const newValue = (usage[field] as number) + 1;

    try {
      // Mock increment - just update local state
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