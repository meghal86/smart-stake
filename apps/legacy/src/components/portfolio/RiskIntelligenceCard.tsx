import { Shield, AlertTriangle, TrendingUp, TrendingDown, Activity, Eye, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskFactor {
  name: string;
  score: number;
  change: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

interface RiskIntelligenceCardProps {
  overallRiskScore: number;
  riskTrend: number;
  riskFactors: RiskFactor[];
  whaleInfluence: number;
  marketCorrelation: number;
  liquidityRisk: number;
}

export function RiskIntelligenceCard({
  overallRiskScore,
  riskTrend,
  riskFactors,
  whaleInfluence,
  marketCorrelation,
  liquidityRisk
}: RiskIntelligenceCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 8) return { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Low Risk' };
    if (score >= 6) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium Risk' };
    return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'High Risk' };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const risk = getRiskColor(overallRiskScore);
  const primaryRiskFactor = riskFactors.find(f => f.impact === 'high') || riskFactors[0];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Risk Intelligence</h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>AI-powered risk analysis based on whale activity, market conditions, and portfolio composition</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Badge className={risk.color} variant="outline">
          {risk.label}
        </Badge>
      </div>

      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Risk Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${risk.color}`}>{overallRiskScore.toFixed(1)}</span>
            <div className="flex items-center gap-1">
              {riskTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${riskTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(riskTrend).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <Progress value={(overallRiskScore / 10) * 100} className="h-2" />
      </div>

      {/* Risk Explanation */}
      {primaryRiskFactor && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Primary Risk Factor:</strong> {primaryRiskFactor.description}
            {primaryRiskFactor.change !== 0 && (
              <span className={`ml-2 ${primaryRiskFactor.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ({primaryRiskFactor.change > 0 ? '+' : ''}{primaryRiskFactor.change.toFixed(1)}% change)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Whale Influence</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{whaleInfluence.toFixed(1)}%</span>
            <Badge variant={whaleInfluence > 30 ? 'destructive' : whaleInfluence > 15 ? 'default' : 'secondary'}>
              {whaleInfluence > 30 ? 'High' : whaleInfluence > 15 ? 'Medium' : 'Low'}
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Market Correlation</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{(marketCorrelation * 100).toFixed(0)}%</span>
            <Badge variant={marketCorrelation > 0.8 ? 'destructive' : marketCorrelation > 0.6 ? 'default' : 'secondary'}>
              {marketCorrelation > 0.8 ? 'High' : marketCorrelation > 0.6 ? 'Medium' : 'Low'}
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Liquidity Risk</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{liquidityRisk.toFixed(1)}</span>
            <Badge variant={liquidityRisk > 7 ? 'destructive' : liquidityRisk > 4 ? 'default' : 'secondary'}>
              {liquidityRisk > 7 ? 'High' : liquidityRisk > 4 ? 'Medium' : 'Low'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Risk Factors</h4>
        {riskFactors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{factor.name}</span>
                <Badge variant={getImpactColor(factor.impact) as any} className="text-xs">
                  {factor.impact}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{factor.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="font-medium">{factor.score.toFixed(1)}</span>
              {factor.change !== 0 && (
                <div className="flex items-center gap-1">
                  {factor.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${factor.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(factor.change).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}