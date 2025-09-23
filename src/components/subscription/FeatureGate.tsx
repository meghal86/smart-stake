import React from 'react';
import { Lock, Crown, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { SubscriptionTier } from '@/types/subscription';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPreview?: boolean;
  className?: string;
}

const TIER_ICONS = {
  free: '🆓',
  pro: <Zap className="h-4 w-4" />,
  premium: '👑',
  institutional: <Building2 className="h-4 w-4" />
};

const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  premium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  institutional: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
};

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showPreview = true, 
  className = '' 
}: FeatureGateProps) {
  const { hasFeatureAccess, getUpgradeUrl } = useSubscription();
  const navigate = useNavigate();
  
  const access = hasFeatureAccess(feature);

  if (access.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showPreview) {
    return null;
  }

  const requiredTier = access.upgradeRequired!;
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <div className={`relative ${className}`}>
      {/* Blurred Preview */}
      <div className="filter blur-sm pointer-events-none opacity-60">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-muted-foreground/30">
        <Card className="p-6 max-w-sm mx-4 text-center shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${TIER_COLORS[requiredTier]}`}>
              <Lock className="h-6 w-6" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {tierName} Feature
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to {tierName} to unlock this feature and get access to advanced portfolio intelligence.
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className={TIER_COLORS[requiredTier]}>
              {TIER_ICONS[requiredTier]}
              <span className="ml-1">{tierName}</span>
            </Badge>
          </div>
          
          <Button 
            onClick={() => navigate(getUpgradeUrl(requiredTier))}
            className="w-full"
            size="sm"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to {tierName}
          </Button>
        </Card>
      </div>
    </div>
  );
}

// Convenience components for specific tiers
export function ProFeature({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="portfolio.enhanced" {...props}>{children}</FeatureGate>;
}

export function InstitutionalFeature({ children, ...props }: Omit<FeatureGateProps, 'feature'>) {
  return <FeatureGate feature="portfolio.stress_testing" {...props}>{children}</FeatureGate>;
}