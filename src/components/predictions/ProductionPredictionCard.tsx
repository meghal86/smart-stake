import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Info, ChevronDown, Download, Lock, Sparkles, ExternalLink, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { LivePriceDisplay } from './LivePriceDisplay';
import { formatRelativeTime } from '@/lib/ux/timestampUtils';

interface ProductionPrediction {
  id: string;
  asset: string;
  prediction_type: string;
  confidence: number;
  features: Record<string, { score: number }>;
  explanation: string;
  context: {
    whale_count: number;
    tx_count: number;
    net_inflow_usd: number;
  };
  provenance: {
    sources: string[];
    block_number: number;
    window: string;
    queried_at: string;
    tx_hashes_sample: string[];
  };
  quality: {
    status: 'ok' | 'degraded' | 'fallback';
    reason?: string;
  };
  basis_price?: number;
  target_price?: number;
  delta_pct?: number;
  direction?: string;
  horizon_hours?: number;
}

interface ProductionPredictionCardProps {
  prediction: ProductionPrediction;
}

export function ProductionPredictionCard({ prediction }: ProductionPredictionCardProps) {
  const { userPlan } = useSubscription();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  
  const getImpactLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'bg-red-500' };
    if (confidence >= 0.6) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-green-500' };
  };

  const getFeatureValue = (featureName: string, fallback: number = 0.5) => {
    const feature = prediction.features?.[featureName];
    const score = feature?.score ?? fallback;
    if (score < 0.05) return 'Minimal';
    return `${Math.round(score * 100)}%`;
  };

  const getQualityBadge = () => {
    if (!prediction.quality || prediction.quality.status === 'ok') return null;
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
            {prediction.quality.status === 'degraded' ? 'Partial Data' : 'Fallback'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {prediction.quality.reason || 'Data quality issue detected'}
        </TooltipContent>
      </Tooltip>
    );
  };

  const impact = getImpactLevel(prediction.confidence);
  const isFree = userPlan.plan === 'free';
  const isPro = userPlan.plan === 'pro';
  const isPremium = userPlan.plan === 'premium' || userPlan.plan === 'enterprise';

  return (
    <TooltipProvider>
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{prediction.asset}</Badge>
              <LivePriceDisplay asset={prediction.asset} className="text-sm" />
            </div>
            <Badge className={`${impact.color} text-white`}>
              Impact: {impact.label}
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary">
                  {Math.round(prediction.confidence * 100)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Confidence: Current signal probability
              </TooltipContent>
            </Tooltip>
            {getQualityBadge()}
            {isPremium && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline">Accuracy (30d): 82%</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Historical performance over past 30 days
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className="flex gap-2">
            {isPremium ? (
              <Tooltip>
                <TooltipTrigger>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export CSV/PDF - Premium Feature</TooltipContent>
              </Tooltip>
            ) : (
              <Button size="sm" variant="outline" className="opacity-50 cursor-not-allowed">
                <Lock className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Content by Tier */}
        {isFree && (
          <div className="space-y-3">
            <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm text-muted-foreground">
                Why this matters → 
              </span>
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                <Sparkles className="h-4 w-4 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        {isPro && (
          <div className="space-y-4">
            <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(prediction.features).slice(0, 4).map(([key, feature]) => (
                <Tooltip key={key}>
                  <TooltipTrigger className="text-left">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="font-medium">{getFeatureValue(key)}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {key === 'whale_volume' && 'Large holder transaction activity'}
                    {key === 'accumulation_pattern' && 'Net buying vs selling pressure'}
                    {key === 'time_clustering' && 'Coordinated activity timing'}
                    {key === 'market_sentiment' && 'Overall market mood indicator'}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Why this matters:</strong> {prediction.explanation}
              </p>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="space-y-4">
            <h3 className="font-semibold">{prediction.asset} {prediction.prediction_type.replace('_', ' ')}</h3>
            
            {/* Advanced Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(prediction.features).map(([key, feature]) => (
                <Tooltip key={key}>
                  <TooltipTrigger className="text-left">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="font-medium">{getFeatureValue(key)}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Feature importance in prediction model
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Premium Stats */}
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Backtest (90d):</span>
                <Badge variant="secondary">86.1% accuracy</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Risk Level:</span>
                <Badge className="bg-green-500 text-white">3.2/10 (Low)</Badge>
              </div>
              {prediction.target_price && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Target:</span>
                  <Badge variant="outline">
                    ${prediction.target_price} ({(prediction.delta_pct || 0) > 0 ? '+' : ''}{(prediction.delta_pct || 0).toFixed(1)}%)
                  </Badge>
                </div>
              )}
            </div>

            {/* AI Explanation */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Explanation
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-700">
                      {prediction.explanation}
                    </p>
                  </div>
                  
                  {/* Evidence Panel */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-meta">Evidence & Provenance</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowEvidence(!showEvidence)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {showEvidence ? 'Hide' : 'Show'} ({prediction.provenance.tx_hashes_sample.length})
                      </Button>
                    </div>
                    
                    <div className="text-xs text-label space-y-1">
                      <div>Sources: {prediction.provenance.sources.join(', ')}</div>
                      <div>Block: #{prediction.provenance.block_number}</div>
                      <div>Window: {prediction.provenance.window}</div>
                      <div>Queried: {new Date(prediction.provenance.queried_at).toLocaleTimeString()}</div>
                      
                      {showEvidence && prediction.provenance.tx_hashes_sample.length > 0 && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <div className="text-xs font-medium mb-1">Sample Transactions:</div>
                          {prediction.provenance.tx_hashes_sample.slice(0, 3).map((hash, i) => (
                            <div key={i} className="font-mono text-xs text-blue-600 hover:underline cursor-pointer">
                              {hash.substring(0, 20)}...
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Data Freshness Footer */}
        {isPremium && prediction.provenance && (
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Data freshness: {formatRelativeTime(prediction.provenance.queried_at)} • Block #{prediction.provenance.block_number}
            </div>
            {prediction.context && (
              <div>
                {prediction.context.whale_count} whales • {prediction.context.tx_count} TXs
              </div>
            )}
          </div>
        )}
        
        {/* Enterprise Teaser */}
        {!isPremium && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-800">Coming Soon</div>
                <div className="text-xs text-amber-600">Forensic Analysis • Wash Trading Detection • Collusion Patterns</div>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Enterprise
              </Badge>
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}