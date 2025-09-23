import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface LiveConcentrationRiskProps {
  holdings?: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  totalValue: number;
}

export function LiveConcentrationRisk({ holdings = [], totalValue }: LiveConcentrationRiskProps) {
  // Calculate top tokens by value
  const topTokens = holdings
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(token => ({
      symbol: token.token,
      percentage: totalValue > 0 ? (token.value / totalValue) * 100 : 0,
      value: token.value,
      source: token.source,
      risk: token.value / totalValue > 0.5 ? 'high' as const : 
            token.value / totalValue > 0.3 ? 'medium' as const : 'low' as const
    }));

  // Calculate concentration score (HHI - Herfindahl-Hirschman Index)
  const concentrationScore = holdings.reduce((hhi, token) => {
    const share = totalValue > 0 ? token.value / totalValue : 0;
    return hhi + (share * share);
  }, 0) * 100; // Convert to 0-100 scale

  // Calculate diversification trend (mock for now)
  const diversificationTrend = concentrationScore > 50 ? -1.2 : 
                              concentrationScore > 30 ? 0.5 : 2.1;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-green-600 bg-green-100 dark:bg-green-900';
    }
  };

  const getConcentrationLevel = () => {
    if (concentrationScore > 50) return { level: 'High', color: 'text-red-600', icon: AlertTriangle };
    if (concentrationScore > 30) return { level: 'Medium', color: 'text-yellow-600', icon: TrendingUp };
    return { level: 'Low', color: 'text-green-600', icon: CheckCircle };
  };

  const concentrationLevel = getConcentrationLevel();
  const ConcentrationIcon = concentrationLevel.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Token Concentration Risk</h3>
        <Badge variant="outline" className="text-xs">
          Live Analysis
        </Badge>
      </div>

      {/* Concentration Score */}
      <div className="mb-6 p-4 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ConcentrationIcon className={`h-5 w-5 ${concentrationLevel.color}`} />
            <span className="font-medium">Concentration Level</span>
          </div>
          <div className="text-right">
            <div className={`font-bold ${concentrationLevel.color}`}>
              {concentrationLevel.level}
            </div>
            <div className="text-xs text-muted-foreground">
              Score: {concentrationScore.toFixed(1)}
            </div>
          </div>
        </div>
        
        <Progress value={concentrationScore} className="h-2 mb-2" />
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Diversified</span>
          <span className="text-muted-foreground">Concentrated</span>
        </div>
      </div>

      {/* Diversification Trend */}
      <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <span className="text-sm font-medium">Diversification Trend</span>
        <div className="flex items-center gap-1">
          {diversificationTrend >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-bold ${diversificationTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diversificationTrend >= 0 ? '+' : ''}{diversificationTrend.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Top Holdings */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Top Holdings</h4>
        {topTokens.map((token, index) => (
          <div key={`${token.symbol}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.symbol}</span>
                <Badge 
                  variant={token.source === 'real' ? 'default' : 'secondary'} 
                  className="text-xs px-1 py-0"
                >
                  {token.source === 'real' ? (
                    <><CheckCircle className="h-2 w-2 mr-1" />Real</>
                  ) : (
                    <><Zap className="h-2 w-2 mr-1" />Sim</>
                  )}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${getRiskColor(token.risk)}`}
                >
                  {token.risk}
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-medium">${token.value.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">
                  {token.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            <Progress value={token.percentage} className="h-1" />
          </div>
        ))}
      </div>

      {/* Risk Assessment */}
      <div className="mt-6 pt-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          {concentrationScore > 50 && (
            <p className="text-red-600">⚠️ High concentration risk - Consider diversifying</p>
          )}
          {concentrationScore <= 30 && (
            <p className="text-green-600">✅ Well diversified portfolio</p>
          )}
          {concentrationScore > 30 && concentrationScore <= 50 && (
            <p className="text-yellow-600">⚡ Moderate concentration - Monitor closely</p>
          )}
        </div>
      </div>
    </Card>
  );
}