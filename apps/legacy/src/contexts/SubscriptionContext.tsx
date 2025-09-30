import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionTier, 
  UserSubscription, 
  FeatureAccess, 
  FEATURE_CONFIG,
  SUBSCRIPTION_PLANS 
} from '@/types/subscription';

interface SubscriptionContextType {
  subscription: UserSubscription;
  loading: boolean;
  hasFeatureAccess: (feature: string) => FeatureAccess;
  upgradeToTier: (tier: SubscriptionTier) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getUpgradeUrl: (tier: SubscriptionTier) => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: 'free',
    isActive: true,
    trialActive: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription({
        tier: 'premium',
        isActive: true,
        trialActive: false
      });
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan, stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        // Default to free plan
        setSubscription({
          tier: 'premium',
          isActive: true,
          trialActive: false
        });
      } else if (data) {
        setSubscription({
          tier: (data.plan as SubscriptionTier) || 'premium',
          isActive: true,
          trialActive: false,
          stripeSubscriptionId: data.stripe_subscription_id
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({
        tier: 'free',
        isActive: true,
        trialActive: false
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (feature: string): FeatureAccess => {
    const featureConfig = FEATURE_CONFIG[feature as keyof typeof FEATURE_CONFIG];
    
    if (!featureConfig) {
      return {
        hasAccess: true,
        tier: subscription.tier,
        feature
      };
    }

    const requiredTier = featureConfig.requiredTier;
    const tierHierarchy: SubscriptionTier[] = ['free', 'pro', 'premium', 'institutional'];
    const userTierIndex = tierHierarchy.indexOf(subscription.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    const hasAccess = userTierIndex >= requiredTierIndex || subscription.trialActive;

    return {
      hasAccess,
      tier: subscription.tier,
      feature,
      upgradeRequired: hasAccess ? undefined : requiredTier
    };
  };

  const upgradeToTier = async (tier: SubscriptionTier) => {
    // Mock upgrade - in production, this would integrate with Stripe
    console.log(`Upgrading to ${tier} plan...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local state (in production, this would be handled by webhook)
    setSubscription(prev => ({
      ...prev,
      tier,
      isActive: true
    }));

    // Update database
    if (user) {
      await supabase
        .from('users')
        .update({ plan: tier })
        .eq('user_id', user.id);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const getUpgradeUrl = (tier: SubscriptionTier) => {
    return `/plans?upgrade=${tier}`;
  };

  const value: SubscriptionContextType = {
    subscription,
    loading,
    hasFeatureAccess,
    upgradeToTier,
    refreshSubscription,
    getUpgradeUrl
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}