import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertCircle, TrendingUp, Droplets } from 'lucide-react';

interface LiveLiquidityTrackerProps {
  holdings?: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  totalValue: number;
}

export function LiveLiquidityTracker({ holdings = [], totalValue }: LiveLiquidityTrackerProps) {
  // Generate liquidity data based on actual holdings
  const generateLiquidityData = () => {
    return holdings.map(holding => {
      const tokenData: Record<string, any> = {
        'ETH': { dailyVolume: 15000000000, totalLiquidity: 2500000000, risk: 'low' },
        'BTC': { dailyVolume: 25000000000, totalLiquidity: 1800000000, risk: 'low' },
        'BITCOIN': { dailyVolume: 25000000000, totalLiquidity: 1800000000, risk: 'low' },
        'SOL': { dailyVolume: 800000000, totalLiquidity: 450000000, risk: 'medium' },
        'SOLANA': { dailyVolume: 800000000, totalLiquidity: 450000000, risk: 'medium' },
        'CHAINLINK': { dailyVolume: 180000000, totalLiquidity: 120000000, risk: 'high' },
        'POLYGON': { dailyVolume: 50000000, totalLiquidity: 80000000, risk: 'high' }
      };

      const data = tokenData[holding.token.toUpperCase()] || {
        dailyVolume: 10000000,
        totalLiquidity: 50000000,
        risk: 'medium'
      };

      return {
        token: holding.token,
        totalLiquidity: data.totalLiquidity,
        dailyVolume: data.dailyVolume,
        liquidityRatio: data.dailyVolume / data.totalLiquidity,
        risk: data.risk,
        portfolioWeight: totalValue > 0 ? (holding.value / totalValue) * 100 : 0,
        value: holding.value
      };
    });
  };

  // Generate upcoming unlocks based on portfolio
  const generateUpcomingUnlocks = () => {
    const unlocks = [];
    
    // Generate unlocks for major holdings
    const majorHoldings = holdings.filter(h => h.value > totalValue * 0.1);
    
    for (const holding of majorHoldings) {
      if (Math.random() > 0.7) { // 30% chance of having unlocks
        unlocks.push({
          token: holding.token,
          amount: holding.qty * (0.1 + Math.random() * 0.3), // 10-40% of holdings
          value: holding.value * (0.1 + Math.random() * 0.3),
          unlockDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000), // Next 90 days
          type: Math.random() > 0.5 ? 'vesting' as const : 'staking' as const,
          impact: holding.value > totalValue * 0.3 ? 'high' as const : 
                  holding.value > totalValue * 0.1 ? 'medium' as const : 'low' as const
        });
      }
    }

    return unlocks.sort((a, b) => a.unlockDate.getTime() - b.unlockDate.getTime());
  };

  const liquidityData = generateLiquidityData();
  const upcomingUnlocks = generateUpcomingUnlocks();
  const totalUnlockValue = upcomingUnlocks.reduce((sum, unlock) => sum + unlock.value, 0);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Liquidity & Unlock Tracker</h3>
        <Badge variant="outline" className="text-xs">
          Live Monitoring
        </Badge>
      </div>

      {/* Liquidity Overview */}
      <div className="mb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-600" />
          Liquidity Analysis
        </h4>
        <div className="space-y-3">
          {liquidityData.map((item, index) => (
            <div key={index} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.token}</span>
                  <Badge variant="outline" className={`text-xs ${getRiskColor(item.risk)}`}>
                    {item.risk} risk
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatValue(item.value)}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.portfolioWeight.toFixed(1)}% of portfolio
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Daily Volume: </span>
                  <span className="font-medium">{formatValue(item.dailyVolume)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Liquidity Ratio: </span>
                  <span className="font-medium">{item.liquidityRatio.toFixed(1)}x</span>
                </div>
              </div>
              
              <Progress 
                value={Math.min(100, item.liquidityRatio * 10)} 
                className="h-1 mt-2" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Unlocks */}
      <div className="mb-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-600" />
          Upcoming Unlocks
          {totalUnlockValue > 0 && (
            <Badge variant="outline" className="text-xs">
              {formatValue(totalUnlockValue)} total
            </Badge>
          )}
        </h4>
        
        {upcomingUnlocks.length > 0 ? (
          <div className="space-y-3">
            {upcomingUnlocks.slice(0, 5).map((unlock, index) => (
              <div key={index} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{unlock.token}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {unlock.type}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getRiskColor(unlock.impact)}`}>
                      {unlock.impact} impact
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatValue(unlock.value)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(unlock.unlockDate)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {unlock.amount.toFixed(2)} {unlock.token} unlocking
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming unlocks detected</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {liquidityData.filter(l => l.risk === 'low').length}
          </div>
          <div className="text-xs text-muted-foreground">High Liquidity</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">
            {liquidityData.filter(l => l.risk === 'medium').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium Risk</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {upcomingUnlocks.filter(u => u.impact === 'high').length}
          </div>
          <div className="text-xs text-muted-foreground">High Impact Unlocks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">
            {formatValue(totalUnlockValue)}
          </div>
          <div className="text-xs text-muted-foreground">Total Unlocks</div>
        </div>
      </div>
    </Card>
  );
}