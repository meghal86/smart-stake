import { Calendar, Clock, AlertTriangle, Droplets, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UnlockEvent {
  token: string;
  amount: number;
  value: number;
  unlockDate: Date;
  type: 'vesting' | 'staking' | 'lock';
  impact: 'high' | 'medium' | 'low';
}

interface LiquidityData {
  token: string;
  totalLiquidity: number;
  dailyVolume: number;
  liquidityRatio: number;
  risk: 'high' | 'medium' | 'low';
}

interface LiquidityUnlockTrackerProps {
  upcomingUnlocks: UnlockEvent[];
  liquidityData: LiquidityData[];
  totalUnlockValue: number;
}

export function LiquidityUnlockTracker({ 
  upcomingUnlocks, 
  liquidityData, 
  totalUnlockValue 
}: LiquidityUnlockTrackerProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past due';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const criticalUnlocks = upcomingUnlocks.filter(unlock => 
    unlock.impact === 'high' && 
    (unlock.unlockDate.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Liquidity & Unlock Tracker</h3>
          <Badge variant="outline">{upcomingUnlocks.length} events</Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Unlock Value</p>
          <p className="text-lg font-bold">{formatValue(totalUnlockValue)}</p>
        </div>
      </div>

      {/* Critical Unlocks Alert */}
      {criticalUnlocks.length > 0 && (
        <Alert className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalUnlocks.length} high-impact unlock{criticalUnlocks.length > 1 ? 's' : ''} 
            {' '}coming within 7 days. Total value: {formatValue(
              criticalUnlocks.reduce((sum, unlock) => sum + unlock.value, 0)
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Unlocks */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Unlocks
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {upcomingUnlocks.slice(0, 8).map((unlock, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{unlock.token}</span>
                    <Badge variant={getImpactColor(unlock.impact) as any} className="text-xs">
                      {unlock.impact}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {unlock.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{unlock.amount.toLocaleString()} tokens</span>
                    <span>{formatValue(unlock.value)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(unlock.unlockDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liquidity Analysis */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Liquidity Analysis
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liquidityData.map((token, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{token.token}</span>
                  <Badge className={getRiskColor(token.risk)} variant="outline">
                    {token.risk} risk
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span>{formatValue(token.totalLiquidity)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span>{formatValue(token.dailyVolume)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Liquidity Ratio</span>
                    <span className="font-medium">{token.liquidityRatio.toFixed(2)}x</span>
                  </div>
                  
                  <Progress 
                    value={Math.min(token.liquidityRatio * 10, 100)} 
                    className="h-1" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Liquidity Insights
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {liquidityData.filter(t => t.risk === 'high').length > 0 
                ? `${liquidityData.filter(t => t.risk === 'high').length} token(s) have low liquidity. Consider position sizing carefully.`
                : upcomingUnlocks.length > 0
                ? `Next major unlock in ${formatDate(upcomingUnlocks[0]?.unlockDate)}. Monitor for potential price impact.`
                : "Portfolio shows healthy liquidity across all positions."
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}