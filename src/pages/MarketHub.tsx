import { DesktopOverview, MobileOverview } from '@/components/market-hub/Overview';
import { DesktopOverview2, MobileOverview2 } from '@/components/market-hub/Overview2';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertsSidebar } from '@/components/market-hub/AlertsSidebar';
import { DesktopWhales, MobileWhales } from '@/components/market-hub/WhaleAnalytics';
import { DesktopSentiment, MobileSentiment } from '@/components/market-hub/SentimentAnalysis';
import { EnhancementSummary } from '@/components/market-hub/EnhancementSummary';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/use-mobile';
import { useClusterStore, ClusterProvider } from '@/stores/clusterStore';
import { TrendingUp, Activity, Fish, BarChart3, Clock, RefreshCw, X, Plus, Share, Download } from 'lucide-react';

function MarketHubContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState('overview');
  const { timeWindow, setTimeWindow, selectedAlert, applyDeepLink } = useClusterStore();
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

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  useEffect(() => {
    const urlWindow = searchParams.get('window');
    const urlCluster = searchParams.get('cluster');
    const urlAlert = searchParams.get('alert');
    
    if (urlWindow && urlWindow !== timeWindow) {
      setTimeWindow(urlWindow as any);
    }
    
    if (urlCluster || urlAlert) {
      applyDeepLink(urlCluster || undefined, urlAlert || undefined);
    }
  }, [searchParams, timeWindow, setTimeWindow, applyDeepLink]);

  const { data: whaleClusters, isLoading: clustersLoading } = useQuery({
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

  const { data: marketSummary, isLoading: marketSummaryLoading } = useQuery({
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

  const { data: chainRisk, isLoading: chainRiskLoading } = useQuery({
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
  const refreshedMinutesAgo = Math.floor((Date.now() - new Date(refreshedAt).getTime()) / 60000);

  const handleRefresh = () => {
    window.location.reload();
    track('hub_manual_refresh', { timeWindow, timestamp: new Date().toISOString() });
  };

  const handleTopAlertClick = (alertId: string) => {
    applyDeepLink(undefined, alertId);
    setActiveView('alerts');
    track('click_top_alert', { alertId, timeWindow });
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col w-full bg-background">
          {/* Mobile Header */}
          <div className="border-b bg-card/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">Market Hub</h1>
                <p className="text-xs text-muted-foreground">Real-time intelligence</p>
              </div>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            {activeView === 'overview' && (
              <MobileOverview 
                marketSummary={marketSummary}
                whaleClusters={whaleClusters}
                chainRisk={chainRisk}
                loading={marketSummaryLoading || clustersLoading || chainRiskLoading}
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
            {activeView === 'sentiment' && <MobileSentiment />}
            {activeView === 'analysis' && (
              <div className="p-4">
                <EnhancementSummary />
              </div>
            )}
          </div>
          
          {/* Bottom Navigation - Only for Market Hub */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg" style={{ zIndex: 100 }}>
            <div className="flex safe-area-inset-bottom">
              <button
                onClick={() => window.history.back()}
                className="flex flex-col items-center py-3 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-r"
                title="Back to main app"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={() => handleViewChange('overview')}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  activeView === 'overview' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-6 h-6 mb-1" />
                Overview
              </button>
              <button
                onClick={() => handleViewChange('whales')}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  activeView === 'whales' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Fish className="w-6 h-6 mb-1" />
                Whales
              </button>
              <button
                onClick={() => handleViewChange('sentiment')}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  activeView === 'sentiment' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-6 h-6 mb-1" />
                Sentiment
              </button>
              <button
                onClick={() => handleViewChange('analysis')}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                  activeView === 'analysis' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="w-6 h-6 mb-1" />
                Analysis
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        <div className="border-b bg-card/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Market Intelligence Hub
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Real-time blockchain intelligence and whale behavior analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                <Clock className="w-4 h-4" />
                Updated {refreshedMinutesAgo}m ago
              </Badge>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-1">
          <div className="w-16 border-r bg-card/30 hover:w-72 transition-all duration-300 group overflow-hidden">
            <div className="p-3 group-hover:p-6">
              <div className="mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Intelligence Views
                </h3>
              </div>
              <nav className="space-y-1">
                <Button
                  variant={activeView === 'overview' ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-left group-hover:h-11"
                  onClick={() => handleViewChange('overview')}
                  title="Overview 1"
                >
                  <BarChart3 className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="font-medium whitespace-nowrap">Overview 1</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Standard layout</div>
                  </div>
                </Button>
                <Button
                  variant={activeView === 'overview2' ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-left group-hover:h-11"
                  onClick={() => handleViewChange('overview2')}
                  title="Overview 2"
                >
                  <BarChart3 className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="font-medium whitespace-nowrap">Overview 2</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Terminal layout</div>
                  </div>
                </Button>
                <Button
                  variant={activeView === 'whales' ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-left group-hover:h-11"
                  onClick={() => handleViewChange('whales')}
                  title="Whales"
                >
                  <Fish className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="font-medium whitespace-nowrap">Whales</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Behavior analysis</div>
                  </div>
                </Button>
                <Button
                  variant={activeView === 'sentiment' ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-left group-hover:h-11"
                  onClick={() => handleViewChange('sentiment')}
                  title="Sentiment"
                >
                  <TrendingUp className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="font-medium whitespace-nowrap">Sentiment</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Market mood</div>
                  </div>
                </Button>
                <Button
                  variant={activeView === 'analysis' ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-left group-hover:h-11"
                  onClick={() => handleViewChange('analysis')}
                  title="Analysis"
                >
                  <Activity className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                    <div className="font-medium whitespace-nowrap">Analysis</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Deep insights</div>
                  </div>
                </Button>
              </nav>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 pb-32">
              {activeView === 'overview' && (
                <DesktopOverview 
                  marketSummary={marketSummary}
                  whaleClusters={whaleClusters}
                  chainRisk={chainRisk}
                  loading={marketSummaryLoading || clustersLoading || chainRiskLoading}
                  onTopAlertClick={handleTopAlertClick}
                  timeWindow={timeWindow}
                />
              )}
              {activeView === 'overview2' && (
                <DesktopOverview2 
                  marketSummary={marketSummary}
                  whaleClusters={whaleClusters}
                  chainRisk={chainRisk}
                  loading={marketSummaryLoading || clustersLoading || chainRiskLoading}
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
              {activeView === 'analysis' && (
                <EnhancementSummary />
              )}
            </div>
          </div>
          <div className="w-80 border-l bg-card/30">
            <AlertsSidebar 
              filters={alertFilters}
              onFiltersChange={setAlertFilters}
              timeWindow={timeWindow}
            />
          </div>
        </div>
        {(selectedAlert || selectedWhale) && (
          <div className="fixed bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm">Trade</Button>
                <Button size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Watchlist
                </Button>
                <Button size="sm" variant="outline">
                  <Share className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => {
                applyDeepLink();
                setSelectedWhale(null);
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function MarketHub() {
  return (
    <ClusterProvider>
      <MarketHubContent />
    </ClusterProvider>
  );
}