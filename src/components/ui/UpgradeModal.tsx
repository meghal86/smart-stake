import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentTier: string;
  targetTier: string;
}

export function UpgradeModal({ isOpen, onClose, feature, currentTier, targetTier }: UpgradeModalProps) {
  const getFeatureBenefits = (feature: string, tier: string) => {
    const benefits: Record<string, string[]> = {
      'advanced_analytics': [
        'AI-powered explanations for every prediction',
        'Risk scoring and sentiment analysis'
      ],
      'exports': [
        'Export predictions to CSV/PDF format',
        'Historical data downloads'
      ],
      'scenario_builder': [
        'Create custom what-if scenarios',
        'Compare multiple prediction outcomes'
      ],
      'forensics': [
        'Detect wash trading and manipulation',
        'Advanced collusion analysis'
      ]
    };
    
    return benefits[feature] || [
      `Unlock ${feature.replace('_', ' ')} features`,
      'Get full access to premium tools'
    ];
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Zap className="h-5 w-5 text-blue-500" />;
      case 'premium': return <Crown className="h-5 w-5 text-purple-500" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-orange-500" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const benefits = getFeatureBenefits(feature, targetTier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTierIcon(targetTier)}
            Upgrade to {targetTier.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            You're currently on the <Badge variant="outline">{currentTier.toUpperCase()}</Badge> plan
          </div>
          
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button 
              onClick={() => window.location.href = '/subscription'} 
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              Upgrade to {targetTier.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}