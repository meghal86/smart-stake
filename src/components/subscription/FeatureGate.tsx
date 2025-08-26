import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FeatureGateProps {
  feature: 'whaleAlerts' | 'yields' | 'riskScanner' | 'advancedFiltering';
  requiredPlan: 'pro' | 'premium';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredPlan,
  children,
  fallback
}) => {
  const { userPlan, loading, canAccessFeature, getUpgradeMessage } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const access = canAccessFeature(feature);
  
  // If user has full access to the feature
  if (access === 'full' || access === 'unlimited') {
    return <>{children}</>;
  }

  // If user has limited access (like free tier whale alerts)
  if (access === 'limited') {
    return <>{children}</>;
  }

  // If user doesn't have access, show upgrade prompt or fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      feature={feature}
      message={getUpgradeMessage(feature)}
      requiredPlan={requiredPlan}
    />
  );
};