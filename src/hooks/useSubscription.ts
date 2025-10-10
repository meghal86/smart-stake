import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserPlan {
  plan: 'free' | 'pro' | 'premium' | 'enterprise' | 'guest';
  subscribed: boolean;
  subscription_end?: string;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>({ plan: 'free', subscribed: false });
  const [loading, setLoading] = useState(true);

  const fetchUserPlan = useCallback(async () => {
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

      console.log('Current user plan from database:', userData.plan);

      // Map plan names to match Stripe pricing
      let mappedPlan: 'free' | 'pro' | 'premium' | 'enterprise' | 'guest' = 'free';
      if (userData.plan === 'premium-monthly' || userData.plan === 'pro') {
        mappedPlan = 'pro';
      } else if (userData.plan === 'premium-yearly' || userData.plan === 'premium' || userData.plan === 'premier-plus') {
        mappedPlan = 'premium';
      } else if (userData.plan === 'enterprise' || userData.plan === 'enterprise-yearly') {
        mappedPlan = 'enterprise';
      }

      console.log('Mapped plan:', mappedPlan);

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
  }, [user]);

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    fetchUserPlan();

    // Listen for storage events to refetch when plan updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_plan_updated') {
        console.log('Plan updated via storage event, refetching...');
        setTimeout(() => {
          fetchUserPlan();
        }, 100); // Small delay to ensure database is updated
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, authLoading, fetchUserPlan]);

  const getPlanLimits = () => {
    const plan = user ? userPlan.plan : 'free';
    const limits = {
      free: { whaleAlertsPerDay: 50, whaleAnalyticsLimit: 10, walletScansPerDay: 1, watchlistLimit: 3, yieldsLimit: 20, realTimeAlerts: false, exportData: false, apiAccess: false, advancedFilters: false },
      guest: { whaleAlertsPerDay: 10, whaleAnalyticsLimit: 5, walletScansPerDay: 0, watchlistLimit: 0, yieldsLimit: 5, realTimeAlerts: false, exportData: false, apiAccess: false, advancedFilters: false },
      pro: { whaleAlertsPerDay: 500, whaleAnalyticsLimit: -1, walletScansPerDay: -1, watchlistLimit: -1, yieldsLimit: -1, realTimeAlerts: true, exportData: true, apiAccess: false, advancedFilters: true },
      premium: { whaleAlertsPerDay: -1, whaleAnalyticsLimit: -1, walletScansPerDay: -1, watchlistLimit: -1, yieldsLimit: -1, realTimeAlerts: true, exportData: true, apiAccess: true, advancedFilters: true },
      enterprise: { whaleAlertsPerDay: -1, whaleAnalyticsLimit: -1, walletScansPerDay: -1, watchlistLimit: -1, yieldsLimit: -1, realTimeAlerts: true, exportData: true, apiAccess: true, advancedFilters: true }
    };
    return limits[plan];
  };

  const canAccessFeature = (feature: string): 'full' | 'limited' | 'none' => {
    const limits = getPlanLimits();
    switch (feature) {
      case 'whaleAlerts': return limits.whaleAlertsPerDay > 0 ? 'limited' : 'none';
      case 'whaleAnalytics': return limits.whaleAnalyticsLimit === -1 ? 'full' : 'limited';
      case 'yields': return limits.yieldsLimit === -1 ? 'full' : 'limited';
      case 'scanner': return limits.walletScansPerDay === -1 ? 'full' : 'limited';
      case 'alerts': return limits.realTimeAlerts ? 'full' : 'none';
      case 'export': return limits.exportData ? 'full' : 'none';
      case 'api': return limits.apiAccess ? 'full' : 'none';
      case 'advancedFilters': return limits.advancedFilters ? 'full' : 'none';
      case 'whalePredictions': return userPlan.plan === 'free' ? 'none' : 'full';
      case 'scannerCompliance': return userPlan.plan === 'premium' || userPlan.plan === 'enterprise' ? 'full' : 'none';
      default: return 'limited';
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
      case 'whalePredictions':
        return 'Upgrade to Pro to access AI-powered whale predictions and scenarios.';
      case 'scannerCompliance':
        return 'Upgrade to Premium to access advanced scanning and compliance tools.';
      default:
        return 'Upgrade your plan to access this feature.';
    }
  };

  return {
    userPlan,
    loading,
    planLimits: getPlanLimits(),
    canAccessFeature,
    getUpgradeMessage,
    refetch: fetchUserPlan
  };
};