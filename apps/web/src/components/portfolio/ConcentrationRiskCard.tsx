import { AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TokenConcentration {
  symbol: string;
  percentage: number;
  value: number;
  risk: 'low' | 'medium' | 'high';
}

interface ConcentrationRiskCardProps {
  topTokens: TokenConcentration[];
  concentrationScore: number;
  diversificationTrend: number;
}

export function ConcentrationRiskCard({ 
  topTokens, 
  concentrationScore, 
  diversificationTrend 
}: ConcentrationRiskCardProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const getConcentrationRisk = (score: number) => {
    if (score > 70) return { level: 'High', color: 'destructive' };
    if (score > 50) return { level: 'Medium', color: 'default' };
    return { level: 'Low', color: 'secondary' };
  };

  const risk = getConcentrationRisk(concentrationScore);
  const top3Concentration = topTokens.slice(0, 3).reduce((sum, token) => sum + token.percentage, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Token Concentration Risk</h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Measures portfolio diversification risk based on token allocation</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Badge variant={risk.color as any}>{risk.level} Risk</Badge>
      </div>

      {/* Concentration Alert */}
      {concentrationScore > 70 && (
        <Alert className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Top 3 tokens represent {top3Concentration.toFixed(1)}% of your portfolio. 
            Consider diversifying to reduce concentration risk.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Concentration Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Concentration Score</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{concentrationScore.toFixed(1)}%</span>
            <div className="flex items-center gap-1">
              {diversificationTrend >= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${diversificationTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(diversificationTrend).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <Progress value={concentrationScore} className="h-2" />

        {/* Top Token Holdings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Top Holdings</h4>
          {topTokens.slice(0, 5).map((token, index) => (
            <div key={token.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                <div>
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-sm text-muted-foreground">{formatValue(token.value)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.percentage.toFixed(1)}%</span>
                <Badge className={getRiskColor(token.risk)} variant="outline">
                  {token.risk}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Diversification Recommendation */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Recommendation:</strong> {
              concentrationScore > 70 
                ? "Consider rebalancing to reduce concentration in top holdings"
                : concentrationScore > 50
                ? "Portfolio shows moderate concentration - monitor closely"
                : "Well-diversified portfolio with balanced token allocation"
            }
          </p>
        </div>
      </div>
    </Card>
  );
}