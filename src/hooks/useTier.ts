import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserTier = 'guest' | 'free' | 'pro' | 'premium' | 'enterprise';

interface TierFeatures {
  predictions_per_day: number;
  alerts_limit: number;
  chains: string[];
  scenario_builder: boolean;
  advanced_analytics: boolean;
  exports: boolean;
  forensics: boolean;
  api_access: boolean;
}

const TIER_FEATURES: Record<UserTier, TierFeatures> = {
  guest: {
    predictions_per_day: 0,
    alerts_limit: 0,
    chains: ['ETH', 'BTC'],
    scenario_builder: false,
    advanced_analytics: false,
    exports: false,
    forensics: false,
    api_access: false
  },
  free: {
    predictions_per_day: 50,
    alerts_limit: 3,
    chains: ['ETH', 'BTC', 'SOL'],
    scenario_builder: false,
    advanced_analytics: false,
    exports: false,
    forensics: false,
    api_access: false
  },
  pro: {
    predictions_per_day: -1, // unlimited
    alerts_limit: -1,
    chains: ['ETH', 'BTC', 'SOL'],
    scenario_builder: true,
    advanced_analytics: false,
    exports: false,
    forensics: false,
    api_access: false
  },
  premium: {
    predictions_per_day: -1,
    alerts_limit: -1,
    chains: ['ETH', 'BTC', 'SOL', 'AVAX'],
    scenario_builder: true,
    advanced_analytics: true,
    exports: true,
    forensics: false,
    api_access: false
  },
  enterprise: {
    predictions_per_day: -1,
    alerts_limit: -1,
    chains: ['ETH', 'BTC', 'SOL', 'AVAX', 'MATIC'],
    scenario_builder: true,
    advanced_analytics: true,
    exports: true,
    forensics: true,
    api_access: true
  }
};

export function useTier() {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier>('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier('guest');
      setLoading(false);
      return;
    }

    fetchUserTier();
  }, [user]);

  const fetchUserTier = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('plan')
        .eq('user_id', user?.id)
        .single();

      const plan = data?.plan || 'free';
      setTier(plan as UserTier);
    } catch (error) {
      setTier('free');
    } finally {
      setLoading(false);
    }
  };

  const features = TIER_FEATURES[tier];
  
  const canAccess = (feature: keyof TierFeatures) => {
    return features[feature];
  };

  const getUpgradeTarget = (): UserTier => {
    switch (tier) {
      case 'guest': return 'free';
      case 'free': return 'pro';
      case 'pro': return 'premium';
      case 'premium': return 'enterprise';
      default: return 'enterprise';
    }
  };

  return {
    tier,
    features,
    canAccess,
    getUpgradeTarget,
    loading,
    isGuest: tier === 'guest',
    isFree: tier === 'free',
    isPro: tier === 'pro',
    isPremium: tier === 'premium',
    isEnterprise: tier === 'enterprise'
  };
}