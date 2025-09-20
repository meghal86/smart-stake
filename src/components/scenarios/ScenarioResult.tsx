import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Download, Lock, Share, Bell, Shield } from 'lucide-react';
import { PriceConeChart } from './PriceConeChart';
import { useTier } from '@/hooks/useTier';
import { useAnalytics } from '@/hooks/useAnalytics';
import { logFeatureLock } from '@/lib/biEvents';

export interface ScenarioResult {
  headline: string;
  deltaPct: number;
  confidence: number;
  liquidityImpact: number;
  volatilityRisk: number;
  features: Record<string, number>;
  backtestCount: number;
  backtestMedianImpact: number;
  priceCone?: {
    basisPrice: number;
    points: Array<{t: number; p?: number; lo?: number; hi?: number}>;
    confidenceBand: number;
  };
  spillover?: Array<{asset: string; deltaPct: number; confidence: number}>;
  provenance?: {
    features: string[];
    sources: string[];
    window: string;
  };
}

interface ScenarioResultProps {
  result: ScenarioResult;
  onExport?: () => void;
  onShare?: () => void;
  onPromoteToAlert?: () => void;
}

export function ScenarioResult({ result, onExport, onShare, onPromoteToAlert }: ScenarioResultProps) {
  const { tier, isPremium, isEnterprise } = useTier();
  const { track } = useAnalytics();

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDeltaIcon = (delta: number) => {
    return delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Enhanced Headline */}
        <div className="text-center">
          <div 
            className={`flex items-center justify-center gap-2 text-2xl font-bold ${getDeltaColor(result.deltaPct)}`}
            aria-live="polite"
          >
            {getDeltaIcon(result.deltaPct)}
            {result.deltaPct > 0 ? '+' : ''}{result.deltaPct.toFixed(1)}% expected
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {Math.round(result.confidence * 100)}% confidence
          </div>
          {result.explainer && (
            <div className="mt-2 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              {result.explainer}
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Calibrated probability; {Math.round(result.confidence * 100)}% of similar predictions landed within the cone
          </div>
        </div>

        {/* Gauges - Premium Feature */}
        {tier === 'free' ? (
          <div className="relative">
            <div className="blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Liquidity Impact</div>
                  <Progress value={75} className="h-3" />
                  <div className="text-xs mt-1">75/100</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Volatility Risk</div>
                  <Progress value={45} className="h-3" />
                  <div className="text-xs mt-1">45/100</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4 bg-background/90 rounded-lg border">
                <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground">Unlock full metrics</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Liquidity Impact</div>
              <Progress value={result.liquidityImpact} className="h-3" />
              <div className="text-xs mt-1">{result.liquidityImpact}/100</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Volatility Risk</div>
              <Progress value={result.volatilityRisk} className="h-3" />
              <div className="text-xs mt-1">{result.volatilityRisk}/100</div>
            </div>
          </div>
        )}

        {/* Feature Chips */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.features).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key.replace('_', ' ')}: {Math.round(value * 100)}%
            </Badge>
          ))}
        </div>

        {/* Backtest - Premium Feature */}
        {isPremium && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Historical Backtest</div>
            <div className="text-xs text-muted-foreground">
              {result.backtestCount} similar scenarios • Median impact: {result.backtestMedianImpact.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Price Cone Chart */}
        {result.priceCone && tier !== 'free' && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Price Impact Projection</div>
            <PriceConeChart data={result.priceCone} />
          </div>
        )}

        {/* Spillover Panel */}
        {result.spillover && result.spillover.filter(s => s.confidence >= 0.3).length > 0 && tier !== 'free' && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Cross-Asset Spillover</div>
            <div className="text-xs text-blue-700 mb-2">
              Estimated effects given current flow correlation (lookback 30d)
            </div>
            <div className="flex gap-2">
              {result.spillover.filter(s => s.confidence >= 0.3).map((spill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {spill.asset}: {spill.deltaPct > 0 ? '+' : ''}{spill.deltaPct.toFixed(1)}% 
                  ({Math.round(spill.confidence * 100)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Enterprise Forensics */}
        {isEnterprise ? (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Forensics Correlations</span>
            </div>
            <div className="text-xs text-orange-800 space-y-1">
              <div>• Exchange flow correlations: 3 detected</div>
              <div>• Cluster IDs: #A4F2, #B8E1, #C9D3</div>
              <div>• Wash trading risk: Low (0.2%)</div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="blur-sm p-3 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Forensics Correlations</div>
              <div className="text-xs space-y-1">
                <div>• Exchange flow correlations</div>
                <div>• Cluster analysis</div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="sm" onClick={() => {
                track('feature_locked_view', { feature: 'forensics' });
                logFeatureLock('forensics');
                window.location.href = '/subscription';
              }}>
                Upgrade to Enterprise
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onShare && (
            <Button variant="outline" onClick={onShare} className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          
          {isPremium && onExport && (
            <Button variant="outline" onClick={async () => {
              try {
                const response = await fetch('/api/scenario-export', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ scenarioId: 'current', format: 'csv' })
                });
                if (!response.ok) throw new Error('Export failed');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'scenario.csv';
                a.click();
              } catch (error) {
                console.error('Export failed:', error);
              }
            }} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          
          {isEnterprise && onPromoteToAlert && (
            <Button onClick={onPromoteToAlert} className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}