import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Fish, 
  AlertTriangle,
  DollarSign,
  Users,
  Shield,
  ExternalLink,
  Zap
} from 'lucide-react';

// Desktop Overview Implementation
export function DesktopOverview({ marketSummary, whaleClusters, chainRisk, loading, onTopAlertClick }: any) {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top 4 Cards - Exact Implementation */}
      <div className="grid grid-cols-4 gap-6">
        <MarketMoodCard data={marketSummary} />
        <VolumeCard data={marketSummary} />
        <ActiveWhalesCard data={marketSummary} />
        <MarketRiskCard data={marketSummary} onTopAlertClick={onTopAlertClick} />
      </div>

      {/* Behavioral Clusters - 5 Canonical */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Whale Behavior Clusters</h2>
          <div className="text-sm text-muted-foreground">
            5 canonical clusters • Priority-based classification
          </div>
        </div>
        <BehavioralClusters clusters={whaleClusters} />
      </div>

      {/* Risk Heatmap by Chain */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Risk Heatmap by Chain</h2>
          <div className="text-sm text-muted-foreground">
            Chain Risk Index (0-100) • Component breakdown on hover
          </div>
        </div>
        <ChainRiskHeatmap data={chainRisk} />
      </div>
    </div>
  );
}

// Mobile Overview Implementation
export function MobileOverview({ marketSummary, whaleClusters, chainRisk, loading, onTopAlertClick }: any) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  // Use native event for touchmove to allow preventDefault
  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100));
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        window.location.reload();
      }, 1000);
    }
    setPullDistance(0);
    setStartY(0);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Attach native event listeners for touchmove
  // ...existing code...
  return (
    <div 
      className="p-4 space-y-6 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateY(${pullDistance * 0.5}px)` }}
      ref={el => {
        if (el) {
          el.ontouchmove = null;
          el.addEventListener('touchmove', handleTouchMove, { passive: false });
        }
      }}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex justify-center py-2">
          <div className={`transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}>
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="ml-2 text-sm text-muted-foreground">
            {isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}
      {/* Top Cards - Stacked for Mobile */}
      <div className="grid grid-cols-2 gap-4">
        <MarketMoodCard data={marketSummary} mobile />
        <VolumeCard data={marketSummary} mobile />
        <ActiveWhalesCard data={marketSummary} mobile />
        <MarketRiskCard data={marketSummary} onTopAlertClick={onTopAlertClick} mobile />
      </div>

      {/* Clusters - Horizontal Carousel */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Whale Clusters</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            <BehavioralClusters clusters={whaleClusters} mobile />
          </div>
        </div>
      </div>

      {/* Heatmap - 2x2 Bubbles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Chain Risk</h2>
        <ChainRiskHeatmap data={chainRisk} mobile />
      </div>
    </div>
  );
}

// Top 4 Cards Implementation with Exact Formulas

function MarketMoodCard({ data, mobile }: { data: any; mobile?: boolean }) {
  // Market Mood Formula:
  // raw = 0.35 * z(volume_24h vs 30d) + 0.35 * z(active_whales_24h vs 30d) - 0.30 * z(chain_risk_index_weighted vs 30d)
  // mood = clamp(50 + 10*raw, 0, 100)
  
  const mood = data?.marketMood || 0;
  const delta = data?.marketMoodDelta || 0;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-primary/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <TrendingUp className={`text-primary ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>Market Mood</p>
            <div className="flex items-baseline gap-2">
              <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{mood}</p>
              {!mobile && (
                <div className="w-8 h-4 bg-muted rounded-sm flex items-center justify-center">
                  <div className="w-6 h-2 bg-primary/30 rounded-xs"></div>
                </div>
              )}
            </div>
            <p className={`${delta >= 0 ? 'text-green-600' : 'text-red-600'} ${mobile ? 'text-xs' : 'text-sm'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VolumeCard({ data, mobile }: { data: any; mobile?: boolean }) {
  const volume = data?.volume24h || 0;
  const delta = data?.volumeDelta || 0;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-emerald-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <DollarSign className={`text-emerald-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>24h Volume</p>
            <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>
              ${(volume / 1e9).toFixed(1)}B
            </p>
            <p className={`${delta >= 0 ? 'text-green-600' : 'text-red-600'} ${mobile ? 'text-xs' : 'text-sm'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prior 24h
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveWhalesCard({ data, mobile }: { data: any; mobile?: boolean }) {
  const whales = data?.activeWhales || 0;
  const delta = data?.whalesDelta || 0;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-sky-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <Users className={`text-sky-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>Active Whales</p>
            <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{whales.toLocaleString()}</p>
            <p className={`${delta >= 0 ? 'text-green-600' : 'text-red-600'} ${mobile ? 'text-xs' : 'text-sm'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prior 24h
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketRiskCard({ data, onTopAlertClick, mobile }: { data: any; onTopAlertClick: (id: string) => void; mobile?: boolean }) {
  // Market Risk Index Formula:
  // weight by 24h flow share per chain: risk = Σ_chain (chain_risk_index_0_100 * flow_share_chain)
  
  const risk = data?.riskIndex || 0;
  const topAlerts = data?.topAlerts || [];
  
  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${mobile ? "p-3" : "p-6"}`}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-amber-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <Shield className={`text-amber-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>Market Risk Index</p>
            <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{risk}</p>
            {!mobile && (
              <div className="space-y-1 mt-2">
                <p className="text-xs font-medium text-muted-foreground">Top 3 Critical Alerts:</p>
                {topAlerts.slice(0, 3).map((alert: any, i: number) => (
                  <div 
                    key={i} 
                    className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground"
                    onClick={() => onTopAlertClick(alert.id)}
                  >
                    • {alert.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Behavioral Clusters Implementation
function BehavioralClusters({ clusters, mobile }: { clusters: any; mobile?: boolean }) {
  if (!clusters?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No whale cluster data available</p>
        <p className="text-sm mt-1">Clusters will appear when whale data is loaded from live sources</p>
      </div>
    );
  }

  // Priority Order: DORMANT_WAKING, CEX_INFLOW, DEFI_ACTIVITY, DISTRIBUTION, ACCUMULATION
  const priorityOrder = ['DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION'];
  const sortedClusters = clusters.sort((a: any, b: any) => 
    priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  );

  const gridClass = mobile ? "flex gap-4" : "grid grid-cols-5 gap-4";

  return (
    <div className={gridClass}>
      {sortedClusters.map((cluster: any) => (
        <Card 
          key={cluster.id} 
          className={`cursor-pointer hover:shadow-md transition-shadow ${mobile ? 'min-w-[200px]' : ''}`}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {cluster.type.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant={cluster.riskSkew >= 25 ? 'destructive' : cluster.riskSkew >= 15 ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {Math.round(cluster.riskSkew || 0)}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">{cluster.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {cluster.addressesCount?.toLocaleString() || 0} addresses
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  ${((cluster.sumBalanceUsd || 0) / 1e9).toFixed(1)}B
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <span className={(cluster.netFlow24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {(cluster.netFlow24h || 0) >= 0 ? '+' : ''}${Math.abs((cluster.netFlow24h || 0) / 1e6).toFixed(0)}M 24h
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Chain Risk Heatmap Implementation
function ChainRiskHeatmap({ data, mobile }: { data: any; mobile?: boolean }) {
  const chains = ['BTC', 'ETH', 'SOL', 'Others'];
  const gridClass = mobile ? "grid grid-cols-2 gap-4" : "grid grid-cols-4 gap-6";
  
  return (
    <div className={gridClass}>
      {chains.map((chain) => {
        const chainData = data?.chains?.find((c: any) => c.chain === chain);
        const risk = chainData?.risk;
        const components = chainData?.components;
        
        return (
          <Card key={chain} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className={mobile ? "p-4" : "p-6"}>
              <div className="text-center space-y-4">
                <h4 className={`font-semibold ${mobile ? 'text-base' : 'text-lg'}`}>{chain}</h4>
                <div className={`mx-auto rounded-full flex items-center justify-center text-white font-bold ${
                  mobile ? 'w-12 h-12 text-sm' : 'w-20 h-20 text-lg'
                } ${
                  risk === null ? 'bg-gray-400' :
                  risk >= 80 ? 'bg-red-500' :
                  risk >= 60 ? 'bg-orange-500' :
                  risk >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {risk === null ? '--' : risk}
                </div>
                <div>
                  <p className={`font-medium ${mobile ? 'text-xs' : 'text-sm'}`}>
                    {risk === null ? 'No data' : 
                     risk >= 80 ? 'High risk' :
                     risk >= 60 ? 'Elevated' :
                     risk >= 30 ? 'Watch' : 'Safe'
                    }
                  </p>
                  {chainData?.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{chainData.reason}</p>
                  )}
                </div>
                
                {/* Component Breakdown on Hover (Desktop) */}
                {!mobile && components && (
                  <div className="hidden group-hover:block absolute z-10 bg-background border rounded-lg p-3 shadow-lg text-left">
                    <div className="text-xs space-y-1">
                      <div>Whale Risk: {components.whaleRiskMean?.toFixed(1)}</div>
                      <div>CEX Inflow: {(components.cexInflowRatio * 100)?.toFixed(1)}%</div>
                      <div>Net Outflow: {(components.netOutflowRatio * 100)?.toFixed(1)}%</div>
                      <div>Volatility Z: {components.volatilityZ?.toFixed(2)}</div>
                      <div>Large TX: {(components.largeTxShare * 100)?.toFixed(1)}%</div>
                      <div>Dormant Wakeups: {(components.dormantWakeupsRate * 100)?.toFixed(1)}%</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}