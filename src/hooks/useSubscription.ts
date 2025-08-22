import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserPlan {
  plan: 'free' | 'pro' | 'premium';
  subscribed: boolean;
  subscription_end?: string;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>({ plan: 'free', subscribed: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    fetchUserPlan();
  }, [user, authLoading]);

  const fetchUserPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user plan from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('plan')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user plan:', error);
        setUserPlan({ plan: 'free', subscribed: false });
        return;
      }

      // Map plan names to match Stripe pricing
      let mappedPlan: 'free' | 'pro' | 'premium' = 'free';
      if (userData.plan === 'premium-monthly' || userData.plan === 'pro') {
        mappedPlan = 'pro';
      } else if (userData.plan === 'premium-yearly' || userData.plan === 'premium') {
        mappedPlan = 'premium';
      }

      setUserPlan({
        plan: mappedPlan,
        subscribed: mappedPlan !== 'free',
      });
    } catch (error) {
      console.error('Error in fetchUserPlan:', error);
      setUserPlan({ plan: 'free', subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const canAccessFeature = (feature: 'whaleAlerts' | 'yields' | 'riskScanner' | 'advancedFiltering') => {
    switch (feature) {
      case 'whaleAlerts':
        return userPlan.plan === 'free' ? 'limited' : 'unlimited'; // Free: 50/day, Pro/Premium: unlimited
      case 'yields':
        return userPlan.plan !== 'free' ? 'full' : 'none'; // Only Pro/Premium can access
      case 'riskScanner':
        return userPlan.plan === 'premium' ? 'full' : 'none'; // Only Premium can access
      case 'advancedFiltering':
        return userPlan.plan !== 'free' ? 'full' : 'none'; // Pro/Premium can access
      default:
        return 'none';
    }
  };

  const getUpgradeMessage = (feature: string) => {
    switch (feature) {
      case 'yields':
        return 'Upgrade to Pro to access yield farming insights and portfolio tracking.';
      case 'riskScanner':
        return 'Upgrade to Premium to access AI-powered risk scanner and smart contract analysis.';
      case 'advancedFiltering':
        return 'Upgrade to Pro to access advanced filtering and search capabilities.';
      default:
        return 'Upgrade your plan to access this feature.';
    }
  };

  return {
    userPlan,
    loading,
    canAccessFeature,
    getUpgradeMessage,
    refetch: fetchUserPlan
  };
};