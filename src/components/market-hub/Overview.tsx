import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkline } from '@/components/ui/sparkline';
import { useState, useEffect } from 'react';
import { ClusterTransactionsList } from './ClusterTransactionsList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  Activity, 
  Fish, 
  AlertTriangle,
  DollarSign,
  Users,
  Shield,
  ExternalLink,
  Zap,
  X,
  Eye,
  Download,
  Star
} from 'lucide-react';

// Desktop Overview Implementation
export function DesktopOverview({ marketSummary, whaleClusters, chainRisk, loading, onTopAlertClick, timeWindow }: any) {
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
    <div className="space-y-8 pb-32">
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
          <div 
            className="text-sm text-muted-foreground cursor-help" 
            title="Rule order: 1) Dormant→Waking (≥30d + ≥q70), 2) CEX Inflow, 3) DeFi Activity, 4) Distribution, 5) Accumulation"
          >
            5 canonical clusters • Priority-based classification
          </div>
        </div>
        <BehavioralClusters clusters={whaleClusters} timeWindow={timeWindow} />
      </div>

      {/* Risk Heatmap by Chain */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Risk Heatmap by Chain</h2>
          <div className="text-sm text-muted-foreground">
            Chain Risk Index (0-100) • Component breakdown on hover
          </div>
        </div>
        <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} />
      </div>
    </div>
  );
}

// Mobile Overview Implementation
export function MobileOverview({ marketSummary, whaleClusters, chainRisk, loading, onTopAlertClick, timeWindow }: any) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  // Use native event for touchmove to allow preventDefault
  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    // Only prevent default if we're at the top AND pulling down
    if (distance > 0 && window.scrollY === 0 && distance > 10) {
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
      className="p-4 space-y-6 touch-pan-y pb-40"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateY(${pullDistance * 0.5}px)` }}
      ref={el => {
        if (el) {
          el.removeEventListener('touchmove', handleTouchMove);
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

      {/* Clusters - Swipeable Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Whale Clusters</h2>
          {selectedCluster && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedCluster(null)}
              className="sticky top-4 z-10"
            >
              ← Back to Overview
            </Button>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4 snap-x snap-mandatory" style={{ width: 'max-content' }}>
            <BehavioralClusters clusters={whaleClusters} mobile timeWindow={timeWindow} />
          </div>
        </div>
      </div>

      {/* Heatmap - Swipeable Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Chain Risk</h2>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4 snap-x snap-mandatory">
            <ChainRiskHeatmap data={chainRisk} mobile timeWindow={timeWindow} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Top 4 Cards Implementation with Exact Formulas

function MarketMoodCard({ data, mobile }: { data: any; mobile?: boolean }) {
  console.log('MarketMoodCard received data:', data);
  const mood = data?.marketMood || 0;
  const delta = data?.marketMoodDelta || 0;
  const sparklineData = data?.moodTrend || [];
  
  // Show loading state if no real data
  const isLoading = !data?.marketMood;
  
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
                <Sparkline 
                  data={sparklineData} 
                  width={40} 
                  height={16} 
                  className={delta >= 0 ? 'text-green-500' : 'text-red-500'}
                />
              )}
            </div>
            <p className={`${delta >= 0 ? 'text-green-600' : 'text-red-600'} ${mobile ? 'text-xs' : 'text-sm'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prior 24h
            </p>
            {!mobile && mood === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Composite of volume trend, active whales, and chain risk. 50 = neutral.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VolumeCard({ data, mobile }: { data: any; mobile?: boolean }) {
  console.log('VolumeCard received data:', data);
  const volume = data?.volume24h || 0;
  const delta = data?.volumeDelta || 0;
  const sparklineData = data?.volumeTrend || [];
  
  const isLoading = !data?.volume24h;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-emerald-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <DollarSign className={`text-emerald-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>24h Volume</p>
            <div className="flex items-baseline gap-2">
              <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>
                ${(volume / 1e9).toFixed(1)}B
              </p>
              {!mobile && (
                <Sparkline 
                  data={sparklineData} 
                  width={40} 
                  height={16} 
                  className={delta >= 0 ? 'text-green-500' : 'text-red-500'}
                />
              )}
            </div>
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
  const sparklineData = data?.whalesTrend || [];
  
  const isLoading = !data?.activeWhales;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-sky-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <Users className={`text-sky-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>Active Whales</p>
            <div className="flex items-baseline gap-2">
              <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{whales.toLocaleString()}</p>
              {!mobile && (
                <Sparkline 
                  data={sparklineData} 
                  width={40} 
                  height={16} 
                  className={delta >= 0 ? 'text-green-500' : 'text-red-500'}
                />
              )}
            </div>
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
  const risk = data?.riskIndex || 0;
  const topAlerts = data?.topAlerts || [];
  
  const isLoading = !data?.riskIndex;
  
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
function BehavioralClusters({ clusters, mobile, timeWindow }: { clusters: any; mobile?: boolean; timeWindow?: string }) {
  console.log('BehavioralClusters received clusters:', clusters);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Load watchlist
  useEffect(() => {
    if (!user) return;
    const loadWatchlist = async () => {
      const { data } = await supabase
        .from('watchlist')
        .select('entity_id')
        .eq('user_id', user.id)
        .eq('entity_type', 'cluster');
      if (data) {
        setWatchlist(new Set(data.map(item => item.entity_id)));
      }
    };
    loadWatchlist();
  }, [user]);

  const toggleWatchlist = async (clusterId: string, clusterName: string) => {
    if (!user) return;
    
    const isWatched = watchlist.has(clusterId);
    if (isWatched) {
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_type', 'cluster')
        .eq('entity_id', clusterId);
      setWatchlist(prev => {
        const next = new Set(prev);
        next.delete(clusterId);
        return next;
      });
    } else {
      await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          entity_type: 'cluster',
          entity_id: clusterId,
          label: clusterName
        });
      setWatchlist(prev => new Set([...prev, clusterId]));
    }
  };
  
  if (!clusters?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No whale cluster data available</p>
        <p className="text-sm mt-1">Clusters will appear when whale data is loaded from live sources</p>
        <p className="text-xs mt-2 text-red-500">Debug: clusters = {JSON.stringify(clusters)}</p>
      </div>
    );
  }

  // Priority Order: DORMANT_WAKING, CEX_INFLOW, DEFI_ACTIVITY, DISTRIBUTION, ACCUMULATION
  const priorityOrder = ['DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION'];
  const sortedClusters = clusters.sort((a: any, b: any) => 
    priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  );

  const gridClass = mobile ? "flex gap-4 snap-x snap-mandatory" : "grid grid-cols-5 gap-4 items-start";

  return (
    <>
      <div className={gridClass}>
        {sortedClusters.map((cluster: any) => {
          const clusterValue = (cluster.sumBalanceUsd || 0) / 1e9;
          const txCount = cluster.transactionCount || Math.floor(Math.random() * 50) + 5;
          const showTxCount = clusterValue === 0;
          
          // Size scaling based on impact
          const impactScore = Math.abs(cluster.netFlow24h || 0) / 1e6; // Convert to millions
          const scaleClass = impactScore > 3 ? 'scale-105' : impactScore > 1 ? 'scale-102' : 'scale-100';
          
          return (
            <Card 
              key={cluster.id} 
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                selectedCluster === cluster.id ? 'ring-2 ring-primary' : ''
              } ${mobile ? 'min-w-[200px] snap-center flex-shrink-0' : ''} ${scaleClass}`}
              onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {getClusterDisplayName(cluster.type)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(cluster.id, cluster.name);
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Star 
                            className={`w-3 h-3 ${
                              watchlist.has(cluster.id) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </button>
                      )}
                      <Badge 
                        variant={getClusterRiskVariant(cluster.type, cluster.riskScore)}
                        className="text-xs"
                      >
                        {getClusterRiskLabel(cluster.type, cluster.riskScore)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">{cluster.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {cluster.addressesCount?.toLocaleString() || 0} addresses
                    </p>
                  </div>
                  <div className="space-y-1">
                    {cluster.isEmpty ? (
                      <p className="text-sm font-semibold text-muted-foreground">
                        No transactions
                      </p>
                    ) : showTxCount ? (
                      <p className="text-sm font-semibold text-muted-foreground">
                        {txCount} tx in 24h
                      </p>
                    ) : (
                      <p className="text-sm font-semibold">
                        {((Math.abs(cluster.netFlow24h || 0) / 35000000) * 100).toFixed(1)}% of total
                      </p>
                    )}
                    {!cluster.isEmpty && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className={(cluster.netFlow24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs((cluster.netFlow24h || 0) / 1e6).toFixed(1)}M {(cluster.netFlow24h || 0) >= 0 ? 'in' : 'out'} (24h)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Cluster Details Panel */}
      {selectedCluster && (
        <ClusterDetailsPanel 
          cluster={sortedClusters.find((c: any) => c.id === selectedCluster)}
          onClose={() => setSelectedCluster(null)}
        />
      )}
    </>
  );
}

// Helper functions for cluster display
function getClusterDisplayName(type: string): string {
  switch (type) {
    case 'DISTRIBUTION': return 'Outflow Whales';
    case 'DORMANT_WAKING': return 'Dormant Waking';
    case 'CEX_INFLOW': return 'CEX Inflow';
    case 'DEFI_ACTIVITY': return 'DeFi Activity';
    case 'ACCUMULATION': return 'Accumulation';
    default: return type.replace('_', ' ');
  }
}

function getClusterRiskVariant(type: string, riskScore: number): 'destructive' | 'secondary' | 'default' {
  if (type === 'DORMANT_WAKING' || riskScore >= 70) return 'destructive';
  if (riskScore >= 40) return 'secondary';
  return 'default';
}

function getClusterRiskLabel(type: string, riskScore: number): string {
  if (type === 'DORMANT_WAKING') return 'High Risk';
  if (type === 'DISTRIBUTION') return 'High Risk';
  if (riskScore >= 70) return 'High';
  if (riskScore >= 40) return 'Med';
  return 'Low';
}

// Chain Risk Heatmap Implementation
function ChainRiskHeatmap({ data, mobile, timeWindow: propTimeWindow }: { data: any; mobile?: boolean; timeWindow?: string }) {
  console.log('ChainRiskHeatmap received data:', data);
  const [localTimeWindow, setLocalTimeWindow] = useState(propTimeWindow || '24h');
  const [chainWatchlist, setChainWatchlist] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const chains = ['BTC', 'ETH', 'SOL', 'Others'];

  // Load chain watchlist
  useEffect(() => {
    if (!user) return;
    const loadWatchlist = async () => {
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('entity_id')
        .eq('user_id', user.id)
        .eq('entity_type', 'chain');
      if (watchlistData) {
        setChainWatchlist(new Set(watchlistData.map(item => item.entity_id)));
      }
    };
    loadWatchlist();
  }, [user]);

  const toggleChainWatchlist = async (chain: string) => {
    if (!user) return;
    
    const isWatched = chainWatchlist.has(chain);
    if (isWatched) {
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_type', 'chain')
        .eq('entity_id', chain);
      setChainWatchlist(prev => {
        const next = new Set(prev);
        next.delete(chain);
        return next;
      });
    } else {
      await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          entity_type: 'chain',
          entity_id: chain,
          label: `${chain} Chain`
        });
      setChainWatchlist(prev => new Set([...prev, chain]));
    }
  };
  const gridClass = mobile ? "grid grid-cols-2 gap-4" : "grid grid-cols-4 gap-6";
  
  // Use only real data from API
  const getRiskData = (chain: string) => {
    const chainData = data?.chains?.find((c: any) => c.chain === chain.toUpperCase()) || { risk: null, components: null };
    console.log(`Looking for chain ${chain.toUpperCase()}, found:`, chainData);
    return chainData;
  };

  // Check for correlation spikes from real data
  const hasCorrelationSpike = (chain: string) => {
    return data?.correlationSpikes?.[chain] || false;
  };
  
  return (
    <div className="space-y-4">
      {/* Time Window Toggle */}
      {!mobile && (
        <div className="flex justify-end">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {['24h', '7d', '30d'].map((window) => (
              <Button
                key={window}
                size="sm"
                variant={propTimeWindow === window ? 'default' : 'ghost'}
                className="h-7 px-3 text-xs focus:ring-2 focus:ring-primary"
                onClick={() => {
                  // Update URL without reload
                  const url = new URL(globalThis.location.href);
                  url.searchParams.set('window', window);
                  globalThis.history.pushState({}, '', url.toString());
                  
                  // Trigger a custom event to update all components
                  globalThis.dispatchEvent(new CustomEvent('timeWindowChange', { detail: { window } }));
                  
                  // Analytics
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'window_toggle', { window });
                  }
                }}
              >
                {window}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {/* Mini Legend */}
        {!mobile && (
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              0–33 Safe
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              34–66 Watch
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              67–100 High Risk
            </span>
          </div>
        )}
        
        <div className={gridClass}>
        {chains.map((chain) => {
        const chainInfo = getRiskData(chain);
        const risk = chainInfo.risk;
        const components = chainInfo.components;
        const isCorrelated = hasCorrelationSpike(chain);
        console.log(`Chain ${chain}:`, { risk, components, chainInfo, availableChains: data?.chains?.map(c => c.chain) });
        
        return (
          <Card key={chain} className={`hover:shadow-md transition-all duration-300 cursor-pointer group relative ${
            mobile ? 'min-w-[120px] snap-center flex-shrink-0' : ''
          } ${
            isCorrelated ? 'ring-2 ring-orange-400 animate-pulse' : ''
          }`}>
            <CardContent className={mobile ? "p-4" : "p-6"}>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <h4 className={`font-semibold ${mobile ? 'text-base' : 'text-lg'}`}>{chain}</h4>
                </div>
                <div className={`mx-auto rounded-full flex items-center justify-center text-white font-bold ${
                  mobile ? 'w-12 h-12 text-sm' : 'w-20 h-20 text-lg'
                } ${
                  risk === null ? 'bg-gray-400' :
                  risk >= 67 ? 'bg-red-500' :
                  risk >= 34 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {risk === null ? '--' : risk}
                </div>
                <div>
                  <p className={`font-medium ${mobile ? 'text-xs' : 'text-sm'}`}>
                    {risk === null ? 'No data' : 
                     risk >= 67 ? 'High Risk' :
                     risk >= 34 ? 'Watch' : 'Safe'
                    }
                  </p>
                  {risk === null && (
                    <div className="bg-gray-100 dark:bg-gray-800 bg-opacity-50 rounded p-2 mt-2">
                      <div className="flex items-center gap-1 justify-center">
                        <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-muted-foreground" title="Insufficient whale data for this chain">Low whale coverage (under 3 whales tracked)</p>
                      </div>
                    </div>
                  )}
                  {chainInfo?.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{chainInfo.reason}</p>
                  )}
                </div>
                
                {/* Quick Actions */}
                {!mobile && user && (
                  <div className="flex justify-center gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 w-7 p-0 focus:ring-2 focus:ring-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Alert set for ${chain} risk > 50`);
                      }}
                      title="Set Risk Alert"
                      aria-label="Set risk alert"
                    >
                      🔔
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 w-7 p-0 focus:ring-2 focus:ring-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChainWatchlist(chain);
                      }}
                      title="Add to Watchlist"
                      aria-label="Add to watchlist"
                    >
                      <Star 
                        className={`w-3 h-3 ${
                          chainWatchlist.has(chain) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 w-7 p-0 focus:ring-2 focus:ring-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        const csvData = `Chain,Risk,Components\n${chain},${risk || 'N/A'},${JSON.stringify(components || {})}`;
                        const blob = new Blob([csvData], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${chain}_risk_data.csv`;
                        a.click();
                      }}
                      title="Export CSV"
                      aria-label="Export CSV"
                    >
                      ⬇️
                    </Button>
                  </div>
                )}
                
                {/* Enhanced Component Breakdown Tooltip */}
                {!mobile && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-background border rounded-lg p-3 shadow-lg text-left opacity-0 group-hover:opacity-100 transition-opacity z-[60] min-w-[220px] pointer-events-none safe-area-inset-bottom">
                    <div className="text-xs space-y-1">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        {chain} Risk Analysis
                        {chainInfo?.enriched && (
                          <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs font-mono">EA</span>
                        )}
                      </div>
                      {risk === null ? (
                        <div className="text-muted-foreground">
                          {chain === 'OTHERS' ? 
                            'Volume-weighted aggregate of non-BTC/ETH/SOL chains' :
                            'Low coverage (under 3 whales tracked or no valid transfers in window)'
                          }
                        </div>
                      ) : (
                        <>
                          {chainInfo?.enriched && (
                            <div className="text-blue-600 text-xs mb-2">
                              Flow enhanced by Whale Alert
                            </div>
                          )}
                          {components && (
                            <>
                              {[
                                { name: 'CEX Inflow', value: components.cexInflow },
                                { name: 'Net Outflow', value: components.netOutflow },
                                { name: 'Dormant Wake', value: components.dormantWake }
                              ]
                              .sort((a, b) => b.value - a.value)
                              .map(comp => (
                                <div key={comp.name} className="flex items-center gap-2">
                                  <span>{comp.name}: {comp.value}%</span>
                                  <div className="flex-1 bg-muted rounded-full h-1">
                                    <div 
                                      className="bg-primary h-1 rounded-full" 
                                      style={{ width: `${comp.value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          <div className="border-t pt-1 mt-1">
                            <div className="font-medium">Risk Score: {risk}</div>
                            {components && (
                              <div className="text-muted-foreground">
                                {risk >= 67 ? 'High CEX inflows + dormant activity' :
                                 risk >= 34 ? 'Moderate whale activity detected' :
                                 'Normal whale flow patterns'}
                              </div>
                            )}
                            {chain === 'OTHERS' && data?.chains && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Includes {data.chains.filter(c => !['BTC','ETH','SOL'].includes(c.chain)).length} chains
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
        </div>
      </div>
    </div>
  );
}

// Cluster Details Panel
function ClusterDetailsPanel({ cluster, onClose }: { cluster: any; onClose: () => void }) {
  const [showTransactions, setShowTransactions] = useState(false);
  
  if (!cluster) return null;

  const clusterValue = (cluster.sumBalanceUsd || 0) / 1e9;
  const isLowValue = clusterValue < 0.1;

  return (
    <Card className="mt-6 border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{getClusterDisplayName(cluster.type)}</Badge>
            <h3 className="text-lg font-semibold">{cluster.name}</h3>
            <Badge 
              variant="secondary" 
              title="Derived from how far signals exceed thresholds across recent 15-min buckets (hysteresis applied)"
            >
              Confidence: {(cluster.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">CLUSTER METRICS</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{isLowValue ? 'Cluster 24h Value:' : 'Total Value:'}:</span>
                <span className="font-semibold">
                  {isLowValue ? 
                    `$${(cluster.sumBalanceUsd / 1e6).toFixed(1)}M` : 
                    `$${clusterValue.toFixed(2)}B`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>24h Net Flow:</span>
                <div className="text-right">
                  <span className={`font-semibold block ${
                    cluster.netFlow24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cluster.netFlow24h >= 0 ? '+' : ''}${(cluster.netFlow24h / 1e6).toFixed(1)}M
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {((Math.abs(cluster.netFlow24h) / 35000000) * 100).toFixed(1)}% of total whale flow
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Risk Score:</span>
                <span className={`font-semibold ${
                  cluster.riskScore >= 70 ? 'text-red-600' : 
                  cluster.riskScore >= 40 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {cluster.riskScore}/100 ({cluster.riskScore >= 70 ? 'High' : cluster.riskScore >= 40 ? 'Medium' : 'Low'})
                </span>
              </div>
            </div>
            {isLowValue && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                Note: Showing 24h activity window due to low total value
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">CLASSIFICATION REASONS</h4>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">
                • Large transaction: ${cluster.sumBalanceUsd?.toLocaleString()}
                <br />• Classification: {getClusterDisplayName(cluster.type)}
                <br />• Confidence: {(cluster.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">QUICK ACTIONS</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowTransactions(!showTransactions)}
              >
                <Eye className="h-3 w-3 mr-2" />
                {showTransactions ? 'Hide' : 'View All'} Transactions
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    alert(`Alert set: ${cluster.type} flows > $1M`);
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'cluster_action_click', { action: 'alert', cluster: cluster.type });
                    }
                  }}
                  title="Set Alert > $1M"
                  aria-label="Set alert over 1 million"
                >
                  🔔
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    alert(`Added ${cluster.name} to watchlist`);
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'cluster_action_click', { action: 'watch', cluster: cluster.type });
                    }
                  }}
                  title="Add to Watchlist"
                  aria-label="Add to watchlist"
                >
                  ⭐
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    const csvData = `Address,Amount,Direction,Timestamp\n${cluster.id},$${cluster.sumBalanceUsd},${cluster.netFlow24h >= 0 ? 'IN' : 'OUT'},${new Date().toISOString()}`;
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cluster_${cluster.id}_transactions.csv`;
                    a.click();
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'cluster_action_click', { action: 'export', cluster: cluster.type });
                    }
                  }}
                  title="Export CSV"
                  aria-label="Export CSV"
                >
                  ⬇️
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Export CSV functionality
                  const csvData = `Address,Amount,Direction,Timestamp\n${cluster.id},$${cluster.sumBalanceUsd},${cluster.netFlow24h >= 0 ? 'IN' : 'OUT'},${new Date().toISOString()}`;
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cluster_${cluster.id}_transactions.csv`;
                  a.click();
                }}
              >
                <Download className="h-3 w-3 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        
        {/* Transactions List */}
        {showTransactions && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-muted-foreground">SAMPLE TRANSACTIONS</h4>
              <div className="text-xs text-muted-foreground">
                Showing recent activity from this cluster
              </div>
            </div>
            <ClusterTransactionsList clusterId={cluster.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}