import { TrendingUp, TrendingDown, Shield, AlertTriangle, Activity, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PortfolioOverviewCardProps {
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  riskScore: number;
  riskChange: number;
  whaleActivity: number;
}

export function PortfolioOverviewCard({ 
  totalValue, 
  pnl24h, 
  pnlPercent, 
  riskScore, 
  riskChange,
  whaleActivity 
}: PortfolioOverviewCardProps) {
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500 bg-green-500/10';
    if (score >= 6) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 8) return 'Low Risk';
    if (score >= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Total Value */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Portfolio Value</h3>
            <Tooltip>
              <TooltipTrigger>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Real-time aggregated value across all monitored addresses</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{formatValue(totalValue)}</span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
              pnlPercent >= 0 ? 'text-green-600 bg-green-100 dark:bg-green-900/20' : 'text-red-600 bg-red-100 dark:bg-red-900/20'
            }`}>
              {pnlPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            24h Change: <span className={pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}>
              {pnl24h >= 0 ? '+' : ''}{formatValue(pnl24h)}
            </span>
          </div>
        </div>

        {/* Risk Score */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
            <Tooltip>
              <TooltipTrigger>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Composite risk based on whale activity, concentration, and market conditions</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{riskScore.toFixed(1)}</span>
            <Badge className={getRiskColor(riskScore)}>
              {getRiskLabel(riskScore)}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm">
            {riskChange >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={riskChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {riskChange >= 0 ? '+' : ''}{riskChange.toFixed(1)} vs yesterday
            </span>
          </div>
        </div>

        {/* Whale Activity */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Whale Activity</h3>
            <Tooltip>
              <TooltipTrigger>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recent whale interactions affecting your portfolio</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{whaleActivity}</span>
            <Badge variant={whaleActivity > 10 ? 'destructive' : whaleActivity > 5 ? 'default' : 'secondary'}>
              {whaleActivity > 10 ? 'High' : whaleActivity > 5 ? 'Medium' : 'Low'}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Last 24h interactions
          </div>
        </div>
      </div>
    </Card>
  );
}