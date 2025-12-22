import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Badge } from '@/components/ui/badge';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { Lock, Eye, Zap, Crown } from 'lucide-react';
import { useTier } from '@/hooks/useTier';
import { useQuota } from '@/hooks/useQuota';

interface TieredPredictionCardProps {
  children: ReactNode;
  prediction: {
    id: string;
    asset: string;
    confidence: number;
    prediction_type: string;
    explanation: string;
    features: Record<string, unknown>;
  };
}

export function TieredPredictionCard({ children, prediction }: TieredPredictionCardProps) {
  const { tier, isGuest, isFree, getUpgradeTarget } = useTier();
  const { canUsePredictions, incrementUsage } = useQuota();

  const handlePredictionView = () => {
    if (!isGuest && canUsePredictions()) {
      incrementUsage('predictions');
    }
  };

  const getBlurredContent = (content: ReactNode, feature: string) => {
    // Business logic: Free → Premium, Premium/Pro → Enterprise
    const targetTier = tier === 'free' ? 'premium' : 'enterprise';
    
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{content}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Upgrade to unlock {feature}</p>
            <Button size="sm" className="mt-2" onClick={() => window.location.href = '/subscription'}>
              Upgrade to {targetTier.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderGuestView = () => (
    <Card className="p-6 relative" onClick={handlePredictionView}>
      {/* Basic Info - Always Visible */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{prediction.asset}</Badge>
          <Badge className="bg-yellow-500 text-white">
            Impact: {prediction.confidence >= 0.8 ? 'High' : 'Medium'}
          </Badge>
        </div>
        <Badge variant="secondary">{Math.round(prediction.confidence * 100)}%</Badge>
      </div>

      {/* Blurred Advanced Metrics */}
      {getBlurredContent(
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded">Volume: 85%</div>
            <div className="p-2 bg-muted rounded">Clustering: 72%</div>
          </div>
        </div>,
        'advanced metrics'
      )}

      {/* CTA Banner */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Join free → Unlock 50 predictions/day</p>
            <p className="text-xs text-muted-foreground">Get alerts, export data, and more</p>
          </div>
          <Button size="sm" onClick={() => window.location.href = '/signup'}>
            Sign Up Free
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderFreeView = () => (
    <Card className="p-5" onClick={handlePredictionView}>
      {/* Compact Header Layout */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7">{prediction.asset}</Badge>
          <StandardBadge type="impact" value="Medium" level="medium" />
          <StandardBadge type="confidence" value={Math.round(prediction.confidence * 100)} />
        </div>
        <DisabledTooltipButton 
          size="sm" 
          variant="outline" 
          disabled={!canUsePredictions()}
          disabledTooltip={!canUsePredictions() ? "Upgrade to access prediction alerts" : undefined}
        >
          <Eye className="h-4 w-4 mr-1" />
          {canUsePredictions() ? 'Create Alert' : 'Quota Exceeded'}
        </DisabledTooltipButton>
      </div>

      {/* Basic Features */}
      <div className="space-y-3 mb-4">
        <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
        <p className="text-sm text-muted-foreground">{prediction.explanation}</p>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(prediction.features).slice(0, 4).map(([key, value]) => (
            <div key={key} className="p-2 bg-muted rounded text-xs">
              <div className="capitalize">{key.replace('_', ' ')}</div>
              <div className="font-medium">{Math.round((value as unknown)?.score * 100 || 50)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blurred Premium Features */}
      {getBlurredContent(
        <div className="space-y-2">
          <div className="text-sm font-medium">AI Explanation & Risk Scoring</div>
          <div className="text-xs text-muted-foreground">Advanced analytics and export options</div>
        </div>,
        'Premium features'
      )}
    </Card>
  );

  const renderProView = () => (
    <Card className="p-6" onClick={handlePredictionView}>
      {/* Full Content */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{prediction.asset}</Badge>
          <Badge className="bg-green-500 text-white">$4,475 • CG</Badge>
          <Badge className="bg-red-500 text-white">Impact: High</Badge>
          <Badge variant="secondary">{Math.round(prediction.confidence * 100)}%</Badge>
        </div>
        <Button size="sm">
          <Zap className="h-4 w-4 mr-1" />
          Set Alert
        </Button>
      </div>

      {/* Full Features */}
      <div className="space-y-4">
        <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
        <p className="text-sm text-muted-foreground">{prediction.explanation}</p>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(prediction.features).map(([key, value]) => (
            <div key={key} className="p-2 bg-muted rounded text-xs">
              <div className="capitalize">{key.replace('_', ' ')}</div>
              <div className="font-medium">{Math.round((value as unknown)?.score * 100 || 50)}%</div>
            </div>
          ))}
        </div>

        {/* Scenario Builder Access */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Scenario Builder Unlocked</span>
          </div>
          <p className="text-xs text-blue-700">Create custom what-if scenarios</p>
        </div>
      </div>

      {/* Blurred Enterprise Features */}
      {getBlurredContent(
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">Enterprise Forensics</div>
          <div className="text-xs text-muted-foreground">Collusion detection, workflow automation, custom API</div>
        </div>,
        'Enterprise forensics'
      )}
    </Card>
  );

  const renderPremiumView = () => (
    <Card className="p-6" onClick={handlePredictionView}>
      {/* Full Premium Content */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{prediction.asset}</Badge>
          <Badge className="bg-green-500 text-white">$4,475 • CG</Badge>
          <Badge className="bg-red-500 text-white">Impact: High</Badge>
          <Badge variant="secondary">{Math.round(prediction.confidence * 100)}%</Badge>
          <Badge className="bg-purple-500 text-white">Risk: 3.2/10</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Export CSV</Button>
          <Button size="sm">Set Alert</Button>
        </div>
      </div>

      {/* Full Features + AI */}
      <div className="space-y-4">
        <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
        
        {/* AI Explanation */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-900">AI Explanation</span>
          </div>
          <p className="text-sm text-purple-800">{prediction.explanation}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(prediction.features).map(([key, value]) => (
            <div key={key} className="p-2 bg-muted rounded text-xs">
              <div className="capitalize">{key.replace('_', ' ')}</div>
              <div className="font-medium">{Math.round((value as unknown)?.score * 100 || 50)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blurred Enterprise Features */}
      {getBlurredContent(
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">Enterprise Forensics</div>
          <div className="text-xs text-muted-foreground">Collusion detection, workflow automation, custom API</div>
        </div>,
        'Enterprise forensics'
      )}
    </Card>
  );

  const renderEnterpriseView = () => (
    <Card className="p-6 border-2 border-gradient-to-r from-yellow-400 to-orange-500" onClick={handlePredictionView}>
      {/* Full Enterprise Content */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{prediction.asset}</Badge>
          <Badge className="bg-green-500 text-white">$4,475 • CG</Badge>
          <Badge className="bg-red-500 text-white">Impact: High</Badge>
          <Badge variant="secondary">{Math.round(prediction.confidence * 100)}%</Badge>
          <Badge className="bg-purple-500 text-white">Risk: 3.2/10</Badge>
          <Badge className="bg-orange-500 text-white">Forensics: Clean</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">API Access</Button>
          <Button size="sm" variant="outline">Export</Button>
          <Button size="sm">Alert</Button>
        </div>
      </div>

      {/* Full Enterprise Features */}
      <div className="space-y-4">
        <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
        
        {/* Enterprise Analytics */}
        <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-900">Enterprise Forensics</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>Collusion: None detected</div>
            <div>Wash trading: 0.1%</div>
            <div>Manipulation: Low risk</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(prediction.features).map(([key, value]) => (
            <div key={key} className="p-2 bg-muted rounded text-xs">
              <div className="capitalize">{key.replace('_', ' ')}</div>
              <div className="font-medium">{Math.round((value as unknown)?.score * 100 || 50)}%</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  // Render based on tier
  switch (tier) {
    case 'guest': return renderGuestView();
    case 'free': return renderFreeView();
    case 'pro': return renderProView();
    case 'premium': return renderPremiumView();
    case 'enterprise': return renderEnterpriseView();
    default: return renderGuestView();
  }
}