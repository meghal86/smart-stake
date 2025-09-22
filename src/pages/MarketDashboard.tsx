import { useState, useEffect } from 'react';
import { TrendingUp, Fish, Briefcase, Download, FileText, BarChart3, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMarketSummary, useDataFreshness } from '@/hooks/useMarketData';
import { useRealtimeWhales } from '@/hooks/useRealtimeWhales';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useCompactView } from '@/contexts/CompactViewContext';
import { RealtimeIndicator } from '@/components/market/RealtimeIndicator';
import { WhaleClustering } from '@/components/market/WhaleClustering';
import { CounterpartyGraph } from '@/components/market/CounterpartyGraph';
import { PerformanceMonitor } from '@/components/market/PerformanceMonitor';
import { GuidedTour } from '@/components/market/GuidedTour';
import { SentimentCorrelationHeatmap } from '@/components/market/SentimentCorrelationHeatmap';
import { MobileActivityDrawer } from '@/components/market/MobileActivityDrawer';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPDF, prepareWhaleAnalyticsExport, preparePortfolioExport } from '@/utils/exportUtils';
import { formatTimestamp } from '@/utils/timeFormat';
import WhaleAnalytics from './WhaleAnalytics';
import MultiCoinSentiment from './MultiCoinSentiment';
import Portfolio from './Portfolio';
import { StickyToolbar } from '@/components/market/StickyToolbar';
import { KpiSummary } from '@/components/market/KpiSummary';
import { FreshnessBadge } from '@/components/market/FreshnessBadge';
import { RightActivityFeed } from '@/components/market/RightActivityFeed';
import { FloatingActionButton } from '@/components/market/FloatingActionButton';

export default function MarketDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { userPlan } = useSubscription();
  const { track } = useAnalytics();
  const { isCompact } = useCompactView();
  
  // Toolbar state
  const [timeframe, setTimeframe] = useState(searchParams.get('tf') || '24h');
  const [chain, setChain] = useState(searchParams.get('chain') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState(() => {
    const marketTab = searchParams.get('marketTab');
    const legacyTab = searchParams.get('tab');
    
    // Handle legacy direct navigation to individual pages
    if (legacyTab === 'whales' || legacyTab === 'sentiment' || legacyTab === 'portfolio') {
      return legacyTab;
    }
    
    return marketTab || 'whales';
  });
  
  // Real market data with React Query
  const { data: marketData, isLoading: marketLoading, error: marketError } = useMarketSummary();
  const dataFreshness = useDataFreshness(marketData?.data?.refreshed_at);
  
  // Realtime whale events
  const { events: realtimeEvents, isConnected: realtimeConnected, lastEventTime, eventCount } = useRealtimeWhales(20);
  
  // Portfolio data
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolioSummary();
  
  // P2 Features state
  const [clusteringEnabled, setClusteringEnabled] = useState(false);
  const [selectedWhaleForGraph, setSelectedWhaleForGraph] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [whaleTransactions, setWhaleTransactions] = useState<any[]>([]);
  const [sentimentCoins, setSentimentCoins] = useState<any[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<any[]>([]);
  
  // Performance metrics (mock data - would come from API headers)
  const performanceMetrics = {
    apiLatency: marketData ? 450 : 0,
    cacheHitRate: 85.2,
    dataAge: dataFreshness.ageSeconds,
    errorRate: marketError ? 2.1 : 0.3,
    lastUpdate: marketData?.data?.refreshed_at || new Date().toISOString(),
    provider: marketData?.meta?.source || 'loading'
  };
  
  // Transform market data for KPI component
  const kpiData = {
    volume24h: marketData?.data?.vol_24h || 0,
    activeWhales: marketData?.data?.whales_active_24h || 0,
    riskAlerts: marketData?.data?.risk_alerts_24h || 0,
    avgRiskScore: marketData?.data?.avg_risk_score || 0,
    loading: marketLoading,
    // Add trend data
    volumeDelta: marketData?.data?.vol_24h_delta || 0,
    whalesDelta: marketData?.data?.whales_delta || 0,
    riskAlertsDelta: marketData?.data?.risk_alerts_delta || 0,
    riskScoreDelta: marketData?.data?.risk_score_delta || 0
  };

  // Sync URL params (only for MarketDashboard internal state)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    // Keep the main tab as 'market'
    params.set('tab', 'market');
    
    // Add MarketDashboard specific params
    if (timeframe !== '24h') params.set('tf', timeframe);
    else params.delete('tf');
    
    if (chain !== 'all') params.set('chain', chain);
    else params.delete('chain');
    
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    
    if (activeTab !== 'whales') params.set('marketTab', activeTab);
    else params.delete('marketTab');
    
    setSearchParams(params, { replace: true });
  }, [timeframe, chain, searchQuery, activeTab, setSearchParams, searchParams]);

  // Handle initial load and legacy redirects
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    const marketTab = searchParams.get('marketTab');
    
    // If we're on a legacy individual page route, redirect to market dashboard
    if (currentTab === 'whales' || currentTab === 'sentiment' || currentTab === 'portfolio') {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'market');
      params.set('marketTab', currentTab);
      setSearchParams(params, { replace: true });
      setActiveTab(currentTab);
    }
  }, [searchParams, setSearchParams]);
  
  // Check if user has seen tour
  useEffect(() => {
    if (!user) return;
    
    const hasSeenTour = localStorage.getItem(`tour_completed_${user.id}`);
    
    if (!hasSeenTour) {
      // Show tour after a short delay
      setTimeout(() => setShowTour(true), 2000);
    }
  }, [user]);

  // Analytics tracking
  useEffect(() => {
    track('market_view_loaded', {
      tab: activeTab,
      timeframe,
      chain,
      plan: userPlan.plan
    });
  }, [activeTab, timeframe, chain, userPlan.plan, track]);

  const handleToolbarChange = (type: string, value: string) => {
    switch (type) {
      case 'timeframe':
        setTimeframe(value);
        break;
      case 'chain':
        setChain(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
    }
    
    track('toolbar_changed', { type, value, tab: activeTab });
  };

  const handleSavedViewSelect = async (viewId: string) => {
    if (viewId === 'manage') return;
    
    try {
      // Load saved view from database
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('id', viewId)
        .single();
      
      if (error) throw error;
      
      if (data?.url_state) {
        const state = data.url_state;
        setTimeframe(state.timeframe || '24h');
        setChain(state.chain || 'all');
        setSearchQuery(state.searchQuery || '');
        setActiveTab(state.activeTab || 'whales');
        
        track('saved_view_applied', { viewId, viewName: data.name });
      }
    } catch (error) {
      console.error('Failed to load saved view:', error);
    }
  };
  
  const handleSaveView = (name: string) => {
    track('saved_view_created', { 
      name, 
      state: { timeframe, chain, searchQuery, activeTab },
      plan: userPlan.plan 
    });
  };

  const handleActivityItemClick = (item: any) => {
    track('activity_opened', { type: item.type, id: item.id });
    
    // Navigate to relevant tab/context
    if (item.deepLink) {
      const url = new URL(item.deepLink, window.location.origin);
      const params = new URLSearchParams(url.search);
      
      if (params.get('tab')) setActiveTab(params.get('tab')!);
      if (params.get('highlight')) {
        // Highlight specific item
      }
    }
  };

  const handleWalletAdded = (wallet: any) => {
    track('wallet_added', { chain: wallet.chain, hasLabel: !!wallet.label });
    // Refresh portfolio data
  };

  const handleCreateAlert = (context: any) => {
    console.log('🔔 Create alert clicked:', context);
    track('alert_created', { 
      source: 'kpi_card', 
      type: context.type, 
      metric: context.metric,
      threshold: context.threshold 
    });
    
    // Show alert creation modal with prefilled context
    alert(`Create ${context.type} alert:\nMetric: ${context.metric}\nThreshold: ${context.threshold}\n\nThis would open the alert creation modal with prefilled values.`);
  };

  // Export handlers
  const handleExportWhales = (format: 'csv' | 'pdf') => {
    if (userPlan.plan === 'free') {
      alert('Export feature is available for Premium subscribers only');
      return;
    }
    
    const exportData = prepareWhaleAnalyticsExport(whaleTransactions);
    
    if (format === 'csv') {
      exportToCSV(exportData);
    } else {
      exportToPDF(exportData);
    }
    
    track('export_clicked', { type: 'whales', format, plan: userPlan.plan });
  };

  const handleExportPortfolio = (format: 'csv' | 'pdf') => {
    if (userPlan.plan === 'free') {
      alert('Export feature is available for Premium subscribers only');
      return;
    }
    
    const totalValue = portfolioData?.data?.total_value || 0;
    const exportData = preparePortfolioExport(portfolioAssets, totalValue);
    
    if (format === 'csv') {
      exportToCSV(exportData);
    } else {
      exportToPDF(exportData);
    }
    
    track('export_clicked', { type: 'portfolio', format, plan: userPlan.plan });
  };

  const handleKpiCardClick = (type: string) => {
    console.log('🎯 KPI Card clicked:', type);
    track('kpi_card_clicked', { type, currentTab: activeTab });
    
    // Navigate to relevant tab with filters
    switch (type) {
      case 'volume':
        console.log('📊 Switching to whales tab with volume filter');
        setActiveTab('whales');
        setSearchQuery('amount:>1000000');
        break;
      case 'whales':
        console.log('🐋 Switching to whales tab with 24h timeframe');
        setActiveTab('whales');
        setTimeframe('24h');
        break;
      case 'risk':
        console.log('⚠️ Switching to whales tab with risk filter');
        setActiveTab('whales');
        setSearchQuery('risk:high');
        break;
      case 'score':
        console.log('🎯 Switching to whales tab with score filter');
        setActiveTab('whales');
        setSearchQuery('risk:>50');
        break;
    }
  };
  
  const handleClusterSelect = (cluster: any) => {
    track('whale_cluster_selected', { 
      clusterId: cluster.id, 
      type: cluster.type, 
      addressCount: cluster.addresses.length 
    });
    
    // Filter to show only transactions from this cluster
    const addressList = cluster.addresses.slice(0, 5).join(',');
    setSearchQuery(`addr:${addressList}`);
  };
  
  const handleWhaleGraphOpen = (address: string) => {
    setSelectedWhaleForGraph(address);
    track('counterparty_graph_opened', { address });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sticky Toolbar */}
        <ErrorBoundary>
          <StickyToolbar
            timeframe={timeframe}
            chain={chain}
            searchQuery={searchQuery}
            activeTab={activeTab}
            onTimeframeChange={(value) => handleToolbarChange('timeframe', value)}
            onChainChange={(value) => handleToolbarChange('chain', value)}
            onSearchChange={(value) => handleToolbarChange('search', value)}
            onSavedViewSelect={handleSavedViewSelect}
            onSaveView={handleSaveView}
          />
        </ErrorBoundary>

        {/* Main Dashboard Content */}
        <div className="flex-1 p-4 space-y-6 pb-20">
          {/* Enhanced Header with KPIs */}
          <ErrorBoundary>
            <div className="space-y-4" data-tour="kpis">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Market Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Comprehensive market intelligence and analytics</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <FreshnessBadge
                      isLive={dataFreshness.isLive}
                      lastUpdate={marketData?.data?.refreshed_at || ''}
                      provider={marketData?.meta?.source || 'loading'}
                    />
                    <RealtimeIndicator
                      isConnected={realtimeConnected}
                      lastEventTime={lastEventTime}
                      eventCount={eventCount}
                      section="whale events"
                    />
                    {portfolioData && (
                      <RealtimeIndicator
                        isConnected={true}
                        lastEventTime={new Date(portfolioData.data.last_activity)}
                        eventCount={portfolioData.data.monitored_addresses}
                        section="portfolio"
                      />
                    )}
                  </div>
                  
                  {userPlan.plan !== 'free' && (
                    <PerformanceMonitor 
                      metrics={performanceMetrics}
                      isAdmin={user?.email?.includes('admin')}
                    />
                  )}
                </div>
              </div>

              <KpiSummary
                volume24h={kpiData.volume24h}
                activeWhales={kpiData.activeWhales}
                riskAlerts={kpiData.riskAlerts}
                avgRiskScore={kpiData.avgRiskScore}
                loading={kpiData.loading}
                volumeDelta={kpiData.volumeDelta}
                whalesDelta={kpiData.whalesDelta}
                riskAlertsDelta={kpiData.riskAlertsDelta}
                riskScoreDelta={kpiData.riskScoreDelta}
                onCreateAlert={handleCreateAlert}
                onCardClick={handleKpiCardClick}
              />
            </div>
          </ErrorBoundary>

          {/* Enhanced Tabs */}
          <ErrorBoundary>
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              track('market_tab_changed', { from: activeTab, to: value });
            }} className="w-full" data-tour="tabs">
              <TabsList className={`grid w-full ${activeTab === 'sentiment' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="whales" className="flex items-center gap-2">
                  <Fish className="h-4 w-4" />
                  Whale Analytics
                  {userPlan.plan === 'free' && <span className="text-xs opacity-60">(Limited)</span>}
                </TabsTrigger>
                <TabsTrigger value="sentiment" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sentiment
                  {userPlan.plan === 'free' && <span className="text-xs opacity-60">(Top 10)</span>}
                </TabsTrigger>
                {activeTab === 'sentiment' && (
                  <TabsTrigger value="correlation" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Correlation
                  </TabsTrigger>
                )}
                <TabsTrigger value="portfolio" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Portfolio
                  {userPlan.plan === 'free' && <span className="text-xs opacity-60">(1 Wallet)</span>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="whales" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {userPlan.plan !== 'free' && (
                        <WhaleClustering
                          transactions={whaleTransactions}
                          enabled={clusteringEnabled}
                          onToggle={() => setClusteringEnabled(!clusteringEnabled)}
                          onClusterSelect={handleClusterSelect}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportWhales('csv')}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportWhales('pdf')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <WhaleAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="sentiment" className="mt-6">
                <div className="space-y-4">
                  <MultiCoinSentiment />
                </div>
              </TabsContent>

              <TabsContent value="correlation" className="mt-6">
                <div className="space-y-4">
                  <SentimentCorrelationHeatmap coins={sentimentCoins} />
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPortfolio('csv')}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPortfolio('pdf')}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                  <Portfolio />
                </div>
              </TabsContent>
            </Tabs>
          </ErrorBoundary>
        </div>
      </div>

      {/* Right Activity Feed - Desktop */}
      <ErrorBoundary>
        <div className="hidden lg:block" data-tour="activity-feed">
          <RightActivityFeed onItemClick={handleActivityItemClick} />
        </div>
      </ErrorBoundary>

      {/* Mobile Activity Drawer */}
      <ErrorBoundary>
        <MobileActivityDrawer onItemClick={handleActivityItemClick} />
      </ErrorBoundary>

      {/* Floating Action Button (Portfolio tab only) */}
      <ErrorBoundary>
        <FloatingActionButton
          visible={activeTab === 'portfolio'}
          onWalletAdded={handleWalletAdded}
        />
      </ErrorBoundary>
      
      {/* Counterparty Graph Modal */}
      {selectedWhaleForGraph && (
        <CounterpartyGraph
          whaleAddress={selectedWhaleForGraph}
          transactions={whaleTransactions.filter(tx => 
            tx.fromAddress === selectedWhaleForGraph || tx.toAddress === selectedWhaleForGraph
          )}
          isOpen={!!selectedWhaleForGraph}
          onClose={() => setSelectedWhaleForGraph(null)}
        />
      )}
      
      {/* Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          track('guided_tour_completed', { userId: user?.id });
        }}
      />
    </div>
  );
}