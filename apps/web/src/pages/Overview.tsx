import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/use-mobile';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeaderSticky } from '@/components/layout/HeaderSticky';
import { WindowChips } from '@/components/controls/WindowChips';
import { AlertsDigest } from '@/components/digest/AlertsDigest';
import { WatchlistCarousel } from '@/components/watchlist/WatchlistCarousel';
import { ClusterCard } from '@/components/clusters/ClusterCard';
import { ClusterDetail } from '@/components/clusters/ClusterDetail';
import { ChainRiskHeatmap } from '@/components/heatmap/ChainRiskHeatmap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Shield, Fish } from 'lucide-react';

export default function Overview() {
  const [timeWindow, setTimeWindow] = useState('24h');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [digestItems, setDigestItems] = useState([]);
  
  const { track } = useAnalytics();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Data queries
  const { data: marketSummary, isLoading: marketSummaryLoading, refetch: refetchMarketSummary } = useQuery({
    queryKey: ['market-summary-quant', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-summary-enhanced', {
        body: { window: timeWindow, include_chain_risk: false }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: timeWindow === '24h' ? 30000 : 300000,
    retry: 3
  });

  const { data: whaleClusters, isLoading: clustersLoading, refetch: refetchClusters } = useQuery({
    queryKey: ['whaleClusters', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-clusters', {
        body: { window: timeWindow }
      });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    retry: 3
  });

  const { data: chainRisk, isLoading: chainRiskLoading, refetch: refetchChainRisk } = useQuery({
    queryKey: ['chain-risk-quant', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-chain-risk-quant', {
        body: { window: timeWindow }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: timeWindow === '24h' ? 30000 : 300000,
    retry: 2
  });

  const refreshedAt = marketSummary?.refreshedAt || chainRisk?.refreshedAt || new Date().toISOString();
  const loading = marketSummaryLoading || clustersLoading || chainRiskLoading;

  // Mock digest items
  useEffect(() => {
    if (marketSummary?.topAlerts) {
      const items = marketSummary.topAlerts.slice(0, 5).map((alert: any, i: number) => ({
        id: `alert-${i}`,
        title: alert.title || `High volume ${alert.chain || 'ETH'} activity`,
        severity: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low',
        clusterId: whaleClusters?.[i]?.id,
        description: `Large whale movement detected on ${alert.chain || 'ETH'}`,
        timestamp: new Date().toISOString()
      }));
      setDigestItems(items);
    }
  }, [marketSummary, whaleClusters]);

  // Mock watchlist items
  useEffect(() => {
    if (whaleClusters?.length) {
      const items = whaleClusters.slice(0, 3).map((cluster: any) => ({
        id: cluster.id,
        type: 'cluster',
        name: cluster.name,
        value: `$${(Math.abs(cluster.netFlow24h || 0) / 1e6).toFixed(1)}M`,
        change: Math.random() * 20 - 10,
        isAlerted: Math.random() > 0.5
      }));
      setWatchlistItems(items);
    }
  }, [whaleClusters]);

  const handleTimeWindowChange = (newWindow: string) => {
    setTimeWindow(newWindow);
    track('window_change', { value: newWindow });
  };

  const refetchAll = () => {
    refetchMarketSummary();
    refetchClusters();
    refetchChainRisk();
    track('hub_manual_refresh', { timeWindow, timestamp: new Date().toISOString() });
  };

  const handleDigestViewCluster = (clusterId: string) => {
    setSelectedCluster(clusterId);
    const element = document.querySelector(`[data-cluster-id="${clusterId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDigestCreateRule = (item: any) => {
    alert(`Creating alert rule for: ${item.title}`);
  };

  if (isMobile) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col bg-background">
          <HeaderSticky onRefresh={refetchAll} lastUpdated={refreshedAt}>
            <WindowChips 
              value={timeWindow}
              onChange={handleTimeWindowChange}
              aria-label="Time window"
            />
          </HeaderSticky>

          <div className="flex-1 overflow-y-auto">
            {/* Mobile Content Order */}
            <div className="p-4 space-y-6">
              {/* Top Metrics Strip */}
              <div className="grid grid-cols-2 gap-4">
                <MarketMoodCard data={marketSummary} mobile />
                <VolumeCard data={marketSummary} mobile />
                <CriticalAlertsCard data={marketSummary} mobile />
              </div>

              {/* Watchlist Carousel */}
              {watchlistItems.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Your Watchlist</h2>
                  <WatchlistCarousel items={watchlistItems} />
                </div>
              )}

              {/* Whale Behavior Clusters */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Whale Clusters</h2>
                <div className="grid grid-cols-2 gap-4">
                  {whaleClusters?.slice(0, 4).map((cluster: any) => (
                    <ClusterCard
                      key={cluster.id}
                      cluster={cluster}
                      isSelected={selectedCluster === cluster.id}
                      onSelect={() => setSelectedCluster(cluster.id)}
                      mobile
                    />
                  ))}
                </div>
              </div>

              {/* Risk Heatmap */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Chain Risk</h2>
                <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} mobile />
              </div>

              {/* Selected Cluster Detail */}
              {selectedCluster && (
                <ClusterDetail
                  cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
                  onClose={() => setSelectedCluster(null)}
                />
              )}
            </div>
          </div>

          {/* AI Digest Bottom Sheet */}
          <AlertsDigest 
            items={digestItems}
            onViewCluster={handleDigestViewCluster}
            onCreateRule={handleDigestCreateRule}
            mobile
          />
        </div>
      </AppLayout>
    );
  }

  // Desktop Layout
  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        <HeaderSticky onRefresh={refetchAll} lastUpdated={refreshedAt}>
          <WindowChips 
            value={timeWindow}
            onChange={handleTimeWindowChange}
            aria-label="Time window"
          />
        </HeaderSticky>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Column - Clusters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Top Metrics */}
            <div className="grid grid-cols-4 gap-6">
              <MarketMoodCard data={marketSummary} />
              <VolumeCard data={marketSummary} />
              <ActiveWhalesCard data={marketSummary} />
              <CriticalAlertsCard data={marketSummary} />
            </div>

            {/* Watchlist */}
            {watchlistItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Your Watchlist</h2>
                <WatchlistCarousel items={watchlistItems} />
              </div>
            )}

            {/* Behavioral Clusters */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Whale Behavior Clusters</h2>
                <div className="text-sm text-muted-foreground cursor-help" 
                     title="Priority-based classification with confidence scoring">
                  5 canonical clusters • Real-time classification
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {whaleClusters?.map((cluster: any) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    isSelected={selectedCluster === cluster.id}
                    onSelect={() => setSelectedCluster(cluster.id)}
                  />
                ))}
              </div>
              {selectedCluster && (
                <ClusterDetail
                  cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
                  onClose={() => setSelectedCluster(null)}
                />
              )}
            </div>
          </div>

          {/* Middle Column - Chain Risk */}
          <div className="w-80 border-l border-r overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Chain Risk</h2>
                <div className="text-sm text-muted-foreground">
                  Risk Index (0-100)
                </div>
              </div>
              <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} />
            </div>
          </div>

          {/* Right Column - Alerts */}
          <div className="w-80 overflow-y-auto p-6">
            <AlertsDigest 
              items={digestItems}
              onViewCluster={handleDigestViewCluster}
              onCreateRule={handleDigestCreateRule}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Metric Cards Components
function MarketMoodCard({ data, mobile }: { data: any; mobile?: boolean }) {
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
            <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{mood}</p>
            <p className={`${delta >= 0 ? 'text-green-600' : 'text-red-600'} ${mobile ? 'text-xs' : 'text-sm'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prior 24h
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

function CriticalAlertsCard({ data, mobile }: { data: any; mobile?: boolean }) {
  const alerts = data?.criticalAlerts || 0;
  
  return (
    <Card className={mobile ? "p-3" : "p-6"}>
      <CardContent className={mobile ? "p-0" : "p-0"}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-red-500/10 rounded-lg ${mobile ? 'p-2' : 'p-3'}`}>
            <Shield className={`text-red-600 ${mobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>Critical Alerts</p>
            <p className={`font-bold ${mobile ? 'text-xl' : 'text-3xl'}`}>{alerts}</p>
            <p className={`text-muted-foreground ${mobile ? 'text-xs' : 'text-sm'}`}>
              Last 24h
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}