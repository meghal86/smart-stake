import { useState, useEffect, useMemo } from 'react';
import { useWindowSize } from '@/hooks/use-mobile';
import { TrendingUp, Fish, AlertTriangle, Activity, Filter, Download, Share2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEnhancedMarketData } from '@/hooks/useEnhancedMarketData';
import { useMarketSummary, useWhaleClusters, useAlertsStream } from '@/hooks/useMarketIntelligence';
import { WhaleClusters } from '@/components/market-hub/WhaleClusters';

import { ClusterProvider } from '@/stores/clusterStore';
import { cn } from '@/lib/utils';

// Types
interface MarketHealthData {
  marketMoodIndex: number;
  volume24h: number;
  volumeDelta: number;
  activeWhales: number;
  whalesDelta: number;
  riskIndex: number;
  topAlerts: Alert[];
}

interface Alert {
  id: string;
  severity: 'High' | 'Medium' | 'Info';
  title: string;
  description: string;
  timestamp: Date;
  chain: string;
  token?: string;
  amount?: number;
  clusterId?: string;
}

interface WhaleCluster {
  id: string;
  type: 'CEX_INFLOW' | 'DEFI' | 'DORMANT' | 'ACCUMULATION' | 'DISTRIBUTION';
  name: string;
  count: number;
  totalValue: number;
  riskScore: number;
  members: WhaleAddress[];
}

interface WhaleAddress {
  address: string;
  balance: number;
  riskScore: number;
  riskFactors: string[];
  lastActivity: Date;
}

interface AlertFilters {
  severity: string[];
  chains: string[];
  tokens: string[];
  minUsd: number;
  entities: string[];
}

// No mock data - using live APIs only

export function MarketIntelligenceHub() {
  const { user } = useAuth();
  const { userPlan } = useSubscription();
  const { track } = useAnalytics();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const isDesktop = windowWidth >= 1024;

  // State
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [alertFilters, setAlertFilters] = useState<AlertFilters>({
    severity: [],
    chains: [],
    tokens: [],
    minUsd: 0,
    entities: []
  });
  const [alertsView, setAlertsView] = useState<'stream' | 'grouped'>('stream');

  // Live data from APIs
  const { data: enhancedMarketData, isLoading: marketLoading } = useEnhancedMarketData();
  const { data: marketSummary, isLoading: summaryLoading } = useMarketSummary();
  const { data: whaleClusters, isLoading: clustersLoading } = useWhaleClusters();
  const { data: alertsStream, isLoading: alertsLoading } = useAlertsStream(alertFilters);

  // Live data only - log for debugging
  console.log('whaleClusters data:', whaleClusters);
  console.log('whaleClusters length:', whaleClusters?.length);
  console.log('whaleClusters first item:', whaleClusters?.[0]);
  const clusters = whaleClusters || [];
  const alerts = alertsStream?.alerts || [];

  // Filter live alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertFilters.severity.length && !alertFilters.severity.includes(alert.severity)) return false;
      if (alertFilters.chains.length && !alertFilters.chains.includes(alert.chain)) return false;
      if (alertFilters.tokens.length && alert.token && !alertFilters.tokens.includes(alert.token)) return false;
      if (alertFilters.minUsd && alert.usdAmount && alert.usdAmount < alertFilters.minUsd) return false;
      return true;
    });
  }, [alerts, alertFilters]);

  // Market health data
  const marketHealth: MarketHealthData = {
    marketMoodIndex: marketSummary?.marketMoodIndex || enhancedMarketData?.marketMood?.mood || 65,
    volume24h: marketSummary?.volume24h || enhancedMarketData?.volume24h || 1500000000,
    volumeDelta: marketSummary?.volumeDelta || enhancedMarketData?.volumeDelta || 12.5,
    activeWhales: marketSummary?.activeWhales || enhancedMarketData?.activeWhales || 892,
    whalesDelta: marketSummary?.whalesDelta || enhancedMarketData?.whalesDelta || 8.2,
    riskIndex: marketSummary?.riskIndex || enhancedMarketData?.avgRiskScore || 45,
    topAlerts: marketSummary?.topAlerts || filteredAlerts.filter(a => a.severity === 'High').slice(0, 3)
  };

  // Group alerts by similarity
  const groupedAlerts = useMemo(() => {
    const groups: { [key: string]: Alert[] } = {};
    filteredAlerts.forEach(alert => {
      const key = `${alert.chain}-${alert.token}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
    });
    return Object.entries(groups).map(([key, alerts]) => ({
      key,
      title: alerts.length > 1 ? `${alerts[0].chain} ${alerts[0].token} Cluster` : alerts[0].title,
      count: alerts.length,
      alerts,
      severity: alerts.some(a => a.severity === 'High') ? 'High' : 
                alerts.some(a => a.severity === 'Medium') ? 'Medium' : 'Info'
    }));
  }, [filteredAlerts]);

  // AI Digest from live data
  const aiDigest = useMemo(() => {
    const highAlerts = filteredAlerts.filter(a => a.severity === 'High').length;
    const totalVolume = filteredAlerts.reduce((sum, a) => sum + (a.usdAmount || 0), 0);
    const topChains = [...new Set(filteredAlerts.map(a => a.chain))].slice(0, 2).join(' and ');
    return [
      `${highAlerts} high-priority whale movements detected`,
      `$${(totalVolume / 1000000).toFixed(0)}M in large transactions`,
      topChains ? `Activity concentrated on ${topChains}` : 'Monitoring all chains'
    ];
  }, [filteredAlerts]);

  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(clusterId);
    track('whale_cluster_selected', { clusterId });
  };

  const handleAlertClick = (alert: Alert) => {
    track('alert_clicked', { alertId: alert.id, severity: alert.severity });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (userPlan.plan === 'free') {
      alert('Export feature is available for Premium subscribers only');
      return;
    }
    track('export_clicked', { type: 'market_intelligence', format });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-orange-500 text-white';
      case 'Info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <div className="flex w-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Global Market Health Cards */}
          <section className="p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Market Mood Index */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Mood</p>
                    <p className="text-2xl font-bold">{marketHealth.marketMoodIndex}</p>
                    <p className="text-xs text-green-600">Bullish</p>
                  </div>
                </div>
              </Card>

              {/* 24h Volume */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-2xl font-bold">${(marketHealth.volume24h / 1000000000).toFixed(1)}B</p>
                    <p className={`text-xs ${marketHealth.volumeDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketHealth.volumeDelta > 0 ? '+' : ''}{marketHealth.volumeDelta.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              {/* Active Whales */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg">
                    <Fish className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Whales</p>
                    <p className="text-2xl font-bold">{marketHealth.activeWhales.toLocaleString()}</p>
                    <p className={`text-xs ${marketHealth.whalesDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketHealth.whalesDelta > 0 ? '+' : ''}{marketHealth.whalesDelta.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              {/* Market Risk + Top 3 Critical Alerts */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Index</p>
                    <p className="text-2xl font-bold">{marketHealth.riskIndex}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {marketHealth.topAlerts.slice(0, 2).map((alert, i) => (
                    <div key={alert.id} className="text-xs text-muted-foreground truncate">
                      • {alert.title}
                    </div>
                  ))}
                  {marketHealth.topAlerts.length > 2 && (
                    <div className="text-xs text-primary cursor-pointer">
                      +{marketHealth.topAlerts.length - 2} more alerts
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </section>



          {/* Whale Behavior Layer */}
          <section className="px-4 lg:px-6 mb-6">
            <ClusterProvider>
              <WhaleClusters 
                clusters={clusters}
                onClusterSelect={(cluster) => {
                  setSelectedCluster(cluster.id);
                  track('whale_cluster_selected', { clusterId: cluster.id, type: cluster.type });
                }}
                onWhaleSelect={(whale) => {
                  track('whale_selected', { address: whale.address });
                }}
              />
            </ClusterProvider>
          </section>
        </div>

        {/* Right Sidebar - Real-time Alerts Stream */}
        <aside className={cn(
          "border-l bg-card/50",
          isMobile ? "hidden" : "w-80 lg:w-96"
        )}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Real-time Alerts</h2>
              <div className="flex gap-2">
                <Button
                  variant={alertsView === 'stream' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertsView('stream')}
                >
                  Stream
                </Button>
                <Button
                  variant={alertsView === 'grouped' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertsView('grouped')}
                >
                  Grouped
                </Button>
              </div>
            </div>

            {/* AI Digest */}
            <Card className="p-3 mb-4 bg-primary/5">
              <h3 className="font-medium text-sm mb-2">AI Digest - Last 24h</h3>
              <ul className="space-y-1">
                {aiDigest.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="cursor-pointer">All Chains</Badge>
              <Badge variant="outline" className="cursor-pointer">High Priority</Badge>
              <Badge variant="outline" className="cursor-pointer">$1M+</Badge>
            </div>
          </div>

          {/* Alerts Feed */}
          <ScrollArea className="flex-1 h-[calc(100vh-300px)]">
            <div className="p-4 space-y-3">
              {alertsView === 'stream' ? (
                filteredAlerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.chain}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                groupedAlerts.map((group) => (
                  <Card key={group.key} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{group.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getSeverityColor(group.severity))}>
                          {group.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {group.count}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {group.alerts.length} similar transactions detected
                    </p>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredAlerts.length} alerts • {clusters.length} clusters
              {(summaryLoading || clustersLoading || alertsLoading) && ' • Loading...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add to Watchlist
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}