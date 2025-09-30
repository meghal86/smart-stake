import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { ScenarioInputs } from './ScenarioForm';
import { useAnalytics } from '@/hooks/useAnalytics';
import { logPresetClick } from '@/lib/biEvents';

interface PresetScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  inputs: ScenarioInputs;
  tier: 'free' | 'pro' | 'premium';
}

const PRESETS: PresetScenario[] = [
  {
    id: 'cex-inflows',
    name: 'CEX Inflows Spike',
    description: 'Major exchange inflows during bull market',
    icon: <Zap className="h-4 w-4" />,
    inputs: {
      asset: 'ETH',
      timeframe: '6h',
      whaleCount: 5,
      txnSize: 500,
      direction: 'accumulation',
      marketCondition: 'bull',
      cexFlowBias: 1
    },
    tier: 'free'
  },
  {
    id: 'whale-accumulation',
    name: 'Whale Accumulation Cluster',
    description: 'Multiple whales accumulating simultaneously',
    icon: <TrendingUp className="h-4 w-4" />,
    inputs: {
      asset: 'ETH',
      timeframe: '24h',
      whaleCount: 8,
      txnSize: 200,
      direction: 'accumulation',
      marketCondition: 'neutral',
      cexFlowBias: 0
    },
    tier: 'pro'
  },
  {
    id: 'eth-btc-spillover',
    name: 'ETH→BTC Spillover',
    description: 'ETH distribution triggering BTC accumulation',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    inputs: {
      asset: 'BTC',
      timeframe: '24h',
      whaleCount: 3,
      txnSize: 50,
      direction: 'accumulation',
      marketCondition: 'neutral',
      cexFlowBias: -1
    },
    tier: 'premium'
  }
];

interface ScenarioPresetsProps {
  onSelectPreset: (inputs: ScenarioInputs) => void;
  userTier: string;
}

export function ScenarioPresets({ onSelectPreset, userTier }: ScenarioPresetsProps) {
  const { track } = useAnalytics();
  
  const canAccessPreset = (presetTier: string) => {
    const tierOrder = { free: 0, pro: 1, premium: 2, enterprise: 3 };
    return tierOrder[userTier as keyof typeof tierOrder] >= tierOrder[presetTier as keyof typeof tierOrder];
  };

  const handlePresetClick = (preset: any) => {
    // Analytics tracking
    track('preset_clicked', {
      preset_name: preset.name,
      asset: preset.inputs.asset,
      timeframe: preset.inputs.timeframe,
      tier_required: preset.tier
    });
    
    // BI attribution logging
    logPresetClick(preset.name, preset.inputs.asset);
    
    if (canAccessPreset(preset.tier)) {
      onSelectPreset(preset.inputs);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Start Presets</h3>
      
      <div className="grid gap-3">
        {PRESETS.map((preset) => {
          const canAccess = canAccessPreset(preset.tier);
          
          return (
            <div
              key={preset.id}
              className={`p-4 border rounded-lg transition-colors ${
                canAccess 
                  ? 'hover:bg-muted cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handlePresetClick(preset)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    {preset.icon}
                  </div>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={canAccess ? 'secondary' : 'outline'} className="text-xs">
                    {preset.tier.toUpperCase()}
                  </Badge>
                  {!canAccess && (
                    <Button size="sm" variant="outline">
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}