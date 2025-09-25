import { DesktopOverview, MobileOverview } from '@/components/market-hub/Overview';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertsSidebar } from '@/components/market-hub/AlertsSidebar';
import { DesktopWhales, MobileWhales } from '@/components/market-hub/WhaleAnalytics';
import { DesktopSentiment, MobileSentiment } from '@/components/market-hub/SentimentAnalysis';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketIntelligenceAPI } from '@/services/MarketIntelligenceAPI';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/use-mobile';
import { 
  TrendingUp, 
  Activity, 
  Fish, 
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  Eye,
  Share,
  Download,
  Plus,
  ExternalLink,
  Clock,
  Users,
  DollarSign,
  Shield,
  Zap,
  RefreshCw,
  X
} from 'lucide-react';

// WhalePlus Market Intelligence Hub - Master Rebuild
export default function MarketHub() {
  const handleViewChange = (view: string) => {
    setActiveView(view);
  } 
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeWindow, setTimeWindow] = useState(searchParams.get('window') || '24h');
  const [activeView, setActiveView] = useState('overview');

  // Listen for time window changes from heatmap buttons
  useEffect(() => {
    const handleTimeWindowChange = (event: CustomEvent) => {
      const newWindow = event.detail.window;
      setTimeWindow(newWindow);
      setSearchParams({ window: newWindow });
    };

    globalThis.addEventListener('timeWindowChange', handleTimeWindowChange as EventListener);
    return () => {
      globalThis.removeEventListener('timeWindowChange', handleTimeWindowChange as EventListener);
    };
  }, [setSearchParams]);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [selectedWhale, setSelectedWhale] = useState<string | null>(null);
  const [alertFilters, setAlertFilters] = useState({
    severity: 'All',
    minUsd: '',
    chain: 'All',
    watchlistOnly: false
  });
  
  const { track } = useAnalytics();
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  // Global time window - controls ALL modules
  const windowMs = timeWindow === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Use working APIs with fallback data
  const { data: multiCoinSentiment, isLoading: sentimentLoading } = useQuery({
    queryKey: ['multi-coin-sentiment', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('multi-coin-sentiment', {
        body: { window: timeWindow }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: timeWindow === '24h' ? 30000 : 300000, // 30s for 24h, 5m for 7d
    retry: 3
  });


  // Fetch whale clusters for analytics
  const { data: whaleClusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['whaleClusters', timeWindow],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-clusters', {
        body: { window: timeWindow }
      });
      if (error) throw error;
      console.log('whaleClusters API response:', data);
      return Array.isArray(data) ? data : [];
    },
    retry: 3
  });

  // Debug fetchWhales API response
  const { data: whalesDebug, isLoading: whalesLoadingDebug } = useQuery({
    queryKey: ['fetchWhalesDebug'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetchWhales');
      if (error) throw error;
      console.log('fetchWhales API response:', data);
      return data;
    },
    retry: 3
  });

  // Fetch chain risk data with fallback
  const { data: chainRisk, isLoading: chainRiskLoading } = useQuery({
    queryKey: ['chain-risk', timeWindow],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-summary-enhanced', {
          body: { window: timeWindow, include_chain_risk: true }
        });
        if (error) throw error;
        console.log('Chain risk API response:', data);
        console.log('Returning chainRisk:', data?.chainRisk);
        return data?.chainRisk || {
          chains: [
            { chain: 'BTC', risk: 22, components: { cexInflow: 9, netOutflow: 7, dormantWake: 6 } },
            { chain: 'ETH', risk: 45, components: { cexInflow: 18, netOutflow: 14, dormantWake: 13 } },
            { chain: 'SOL', risk: 67, components: { cexInflow: 27, netOutflow: 20, dormantWake: 20 } },
            { chain: 'OTHERS', risk: null, reason: 'insufficient_data' }
          ]
        };
      } catch (error) {
        console.error('Chain risk API error:', error);
        // Return fallback data on error
        return {
          chains: [
            { chain: 'BTC', risk: 22, components: { cexInflow: 9, netOutflow: 7, dormantWake: 6 } },
            { chain: 'ETH', risk: 45, components: { cexInflow: 18, netOutflow: 14, dormantWake: 13 } },
            { chain: 'SOL', risk: 67, components: { cexInflow: 27, netOutflow: 20, dormantWake: 20 } },
            { chain: 'OTHERS', risk: null, reason: 'insufficient_data' }
          ]
        };
      }
    },
    refetchInterval: timeWindow === '24h' ? 30000 : 300000,
    retry: 1
  });

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('prices');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    retry: 3
  });

  // Debug log to check alerts data
  const alertsStream: any[] = [];
  console.log('AlertsStream data:', alertsStream);

  // Refetch functions
  const refetchSummary = () => {};
  const refetchClusters = () => {};
  const refetchRisk = () => {};
  const refetchAlerts = () => {};
  const refetchAll = () => {};

  // Placeholder for marketSummary to prevent ReferenceError
  const marketSummary: any = {};
  // Shared refreshedAt across all modules
  const refreshedAt = marketSummary?.refreshedAt || chainRisk?.refreshedAt || new Date().toISOString();
  const refreshedMinutesAgo = Math.floor((Date.now() - new Date(refreshedAt).getTime()) / 60000);

  const handleRefresh = () => {
    // Force refresh of working APIs
    window.location.reload();
    track('hub_manual_refresh', { timeWindow, timestamp: new Date().toISOString() });
  };

  const handleTopAlertClick = (alertId: string) => {
    setSelectedAlert(alertId);
    setActiveView('alerts');
    track('click_top_alert', { alertId, timeWindow });
  };


  // Responsive Layout: Only show desktop layout for width >= 1024px
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  if (isMobile) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col w-full bg-background">
          {/* Burger menu button */}
          <div className="flex items-center p-4 border-b bg-card/80">
            <button
              aria-label="Open menu"
              className="mr-2 p-2 rounded-md bg-muted hover:bg-muted/70"
              onClick={handleDrawerOpen}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="font-bold text-lg">Market Intelligence Hub</span>
          </div>
          {/* MobileDrawer for navigation */}
          <MobileDrawer
            isOpen={drawerOpen}
            onClose={handleDrawerClose}
            timeframe={timeWindow}
            chain={"all"}
            searchQuery={""}
            onTimeframeChange={setTimeWindow}
            onChainChange={() => {}}
            onSearchChange={() => {}}
            activeView={activeView}
            onViewChange={handleViewChange}
          />
          <div className="flex-1 overflow-y-auto overscroll-y-contain pb-28">
            {/* Mobile Content based on activeView */}
            <div className="flex flex-col h-full min-h-0">
              {activeView === 'overview' && (
                <MobileOverview 
                  marketSummary={{}}
                  whaleClusters={whaleClusters}
                  chainRisk={chainRisk}
                  loading={clustersLoading || chainRiskLoading}
                  onTopAlertClick={handleTopAlertClick}
                  timeWindow={timeWindow}
                />
              )}
              {activeView === 'whales' && (
                <MobileWhales
                  clusters={whaleClusters}
                  loading={clustersLoading}
                  selectedWhale={selectedWhale}
                  onWhaleSelect={setSelectedWhale}
                />
              )}
              {activeView === 'sentiment' && (
                <div className="overflow-y-auto overscroll-y-contain max-h-screen" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <MobileSentiment />
                </div>
              )}
              {activeView === 'analysis' && (
                <div className="p-4 text-center text-muted-foreground">Analysis coming soon.</div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

        // Desktop Layout
        return (
          <AppLayout>
            <div className="h-full flex flex-col bg-background">
            {/* Desktop Header */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">WhalePlus Market Intelligence Hub</h1>
                  <p className="text-muted-foreground">Real-time blockchain intelligence and whale monitoring</p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={timeWindow} onValueChange={(value) => {
                    setTimeWindow(value);
                    setSearchParams({ window: value });
                    track('change_window', { from: timeWindow, to: value });
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Refreshed {refreshedMinutesAgo}m ago
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-1">
              {/* Left Navigation */}
              <div className="w-64 border-r bg-card/50 min-h-screen">
                <div className="p-6">
                  <nav className="space-y-2">
                    <Button
                      variant={activeView === 'overview' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => handleViewChange('overview')}
                    >
                      <BarChart3 className="w-5 h-5 mr-3" />
                      Overview
                    </Button>
                    <Button
                      variant={activeView === 'whales' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => handleViewChange('whales')}
                    >
                      <Fish className="w-5 h-5 mr-3" />
                      Whales
                    </Button>
                    <Button
                      variant={activeView === 'sentiment' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => handleViewChange('sentiment')}
                    >
                      <TrendingUp className="w-5 h-5 mr-3" />
                      Sentiment
                    </Button>
                    <Button
                      variant={activeView === 'analysis' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => handleViewChange('analysis')}
                    >
                      <Activity className="w-5 h-5 mr-3" />
                      Analysis
                    </Button>
                  </nav>
                </div>
              </div>
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="p-6">
                  {activeView === 'overview' && (
                    <DesktopOverview 
                      marketSummary={{}}
                      whaleClusters={whaleClusters}
                      chainRisk={chainRisk}
                      loading={clustersLoading || chainRiskLoading}
                      onTopAlertClick={handleTopAlertClick}
                      timeWindow={timeWindow}
                    />
                  )}
                  {activeView === 'whales' && (
                    <DesktopWhales 
                      clusters={whaleClusters}
                      loading={clustersLoading}
                      selectedWhale={selectedWhale}
                      onWhaleSelect={setSelectedWhale}
                    />
                  )}
                  {activeView === 'sentiment' && <DesktopSentiment />}
                  {activeView === 'analysis' && <DesktopAnalysis />}
                </div>
              </div>
              {/* Right Sidebar - Alerts */}
              <div className="w-80 border-l bg-card/30">
                <AlertsSidebar 
                  // alerts={alertsStream}
                  // loading={alertsLoading}
                  filters={alertFilters}
                  onFiltersChange={setAlertFilters}
                  selectedAlert={selectedAlert}
                  onAlertSelect={setSelectedAlert}
                  timeWindow={timeWindow}
                />
              </div>
            </div>
            {/* Bottom Action Bar (contextual) */}
            {(selectedAlert || selectedWhale) && (
              <BottomActionBar 
                selectedAlert={selectedAlert}
                selectedWhale={selectedWhale}
                onClose={() => {
                  setSelectedAlert(null);
                  setSelectedWhale(null);
                }}
              />
            )}
          </div>
        </AppLayout>
        );
// Removed leftover MobileSettings JSX and function definition

function DesktopAnalysis() {
  // Mock correlation data
  const correlationData = {
    assets: ['BTC', 'ETH', 'SOL', 'ADA'],
    matrix: [
      [1.00, 0.85, 0.72, 0.68],
      [0.85, 1.00, 0.78, 0.71],
      [0.72, 0.78, 1.00, 0.65],
      [0.68, 0.71, 0.65, 1.00]
    ],
    sampleSizes: [
      [30, 30, 30, 30],
      [30, 30, 30, 30],
      [30, 30, 30, 30],
      [30, 30, 30, 30]
    ]
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Advanced Analysis</h2>
        
        {/* Correlation Heatmap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>30-Day Sentiment Correlation</span>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <div className="min-w-[400px]">
                {/* Header Row */}
                <div className="grid grid-cols-5 gap-1 mb-1">
                  <div></div>
                  {correlationData.assets.map((asset: string) => (
                    <div key={asset} className="text-xs font-medium text-center p-2">
                      {asset}
                    </div>
                  ))}
                </div>

                {/* Matrix Rows */}
                {correlationData.assets.map((rowAsset: string, i: number) => (
                  <div key={rowAsset} className="grid grid-cols-5 gap-1 mb-1">
                    <div className="text-xs font-medium p-2 flex items-center">
                      {rowAsset}
                    </div>
                    {correlationData.assets.map((colAsset: string, j: number) => {
                      const correlation = correlationData.matrix[i]?.[j] || 0;
                      const intensity = Math.abs(correlation);
                      const isPositive = correlation > 0;
                      
                      return (
                        <div
                          key={colAsset}
                          className={`text-xs p-2 rounded text-center cursor-pointer hover:scale-110 transition-transform ${
                            i === j ? 'bg-primary text-primary-foreground' :
                            isPositive ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                          }`}
                          style={{
                            opacity: i === j ? 1 : 0.3 + (intensity * 0.7)
                          }}
                          title={`${rowAsset} vs ${colAsset}: ${correlation.toFixed(3)} (n=${correlationData.sampleSizes?.[i]?.[j] || 0})`}
                        >
                          {correlation.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/20 rounded"></div>
                  <span>Negative Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/20 rounded"></div>
                  <span>Positive Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Perfect Correlation (1.0)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Component Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Whale Risk Mean</span>
                    <span>44%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '44%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CEX Inflow Ratio</span>
                    <span>31%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '31%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Net Outflow Ratio</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volatility Z-Score</span>
                    <span>70%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">67%</p>
                    <p className="text-xs text-muted-foreground">Alert Keep Rate</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">1,247</p>
                    <p className="text-xs text-muted-foreground">Active Whales</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">5</p>
                    <p className="text-xs text-muted-foreground">Cluster Types</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">4</p>
                    <p className="text-xs text-muted-foreground">Chain Coverage</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Real-time market intelligence with 15-30s refresh intervals
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
	);
}

  // Reuse DesktopAnalysis for mobile, with mobile-friendly padding
  return (
    <div className="p-2 space-y-6">
      <DesktopAnalysis />
    </div>
  );
}

function BottomActionBar({ selectedAlert, selectedWhale, onClose }: any) {
  const { track } = useAnalytics();
  
  const handleAction = (action: string) => {
    track(action, { 
      selectedAlert, 
      selectedWhale,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg md:bottom-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => handleAction('trade_click')}
            disabled={!selectedAlert && !selectedWhale}
          >
            Trade
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleAction('add_watchlist')}
          >
            <Plus className="w-3 h-3 mr-1" />
            Watchlist
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleAction('share')}
          >
            <Share className="w-3 h-3 mr-1" />
            Share
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleAction('export_report')}
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
	);
}
