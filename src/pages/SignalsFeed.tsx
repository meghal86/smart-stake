/**
 * Pro Signals - Phase C: Narrative & Grouping Implementation
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignalInsightSheet } from '@/components/signals/SignalInsightSheet';
import { SignalFilterBar } from '@/components/signals/SignalFilterBar';
import { SignalRow } from '@/components/signals/SignalRow';
import { SignalsHeaderBar } from '@/components/signals/SignalsHeaderBar';
import { SignalsTabsBar } from '@/components/signals/SignalsTabsBar';
import { WorldClassNarrativeHeader } from '@/components/signals/WorldClassNarrativeHeader';
import { ExpandableSignalCard } from '@/components/signals/ExpandableSignalCard';
import { ExplainModal } from '@/components/signals/ExplainModal';
import { PatternModal } from '@/components/signals/PatternModal';
import { CreateAlertModal } from '@/components/signals/CreateAlertModal';
import { WorldClassFiltersBar } from '@/components/signals/WorldClassFiltersBar';
import { WorldClassNewItemsBadge } from '@/components/signals/WorldClassNewItemsBadge';
import { MicroTicker } from '@/components/signals/MicroTicker';
import { HeartbeatDot } from '@/components/signals/HeartbeatDot';
import { AdvancedRawTable } from '@/components/signals/AdvancedRawTable';
import { RawViewFooter } from '@/components/signals/RawViewFooter';
import { groupSignals, shouldGroup } from '@/lib/signalGrouping';
import type { Signal, SignalFilter } from '@/types/signal';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/telemetry';
import { Activity } from 'lucide-react';
import LiteGlobalHeader from '@/components/navigation/LiteGlobalHeader';
import QuickActionsBar from '@/components/lite/QuickActionsBar';


export default function SignalsPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'top';
  
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [patternSignal, setPatternSignal] = useState<Signal | null>(null);
  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [alertSignal, setAlertSignal] = useState<Signal | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pinnedFilter, setPinnedFilter] = useState('all');
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeWallets] = useState(Math.floor(Math.random() * 50) + 20);
  const [failedFeeds] = useState(Math.floor(Math.random() * 3));
  const [filter, setFilter] = useState<SignalFilter>({
    mutedWallets: [],
    mutedExchanges: [],
    mutedAssets: [],
  });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced fetch with caching
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setIsLoading(true);
        
        try {
          const { data, error } = await supabase.functions.invoke('whale-alerts');
          
          if (!error && data?.transactions) {
            const transformedSignals: Signal[] = data.transactions.map((tx: any, index: number) => ({
              id: tx.hash || `signal_${index}_${Date.now()}`,
              asset: (tx.symbol || 'ETH').toUpperCase(),
              direction: tx.from?.owner_type === 'exchange' ? 'outflow' : 'inflow',
              amountUsd: Number(tx.amount_usd || tx.amount) || 0,
              timestamp: new Date(tx.timestamp * 1000 || Date.now() - Math.random() * 3600000).toISOString(),
              ownerType: 'whale',
              source: 'whale_alert',
              risk: tx.amount_usd > 10000000 ? 'high' : tx.amount_usd > 5000000 ? 'medium' : 'low',
              isLive: true,
              reason: `Large ${(tx.symbol || 'ETH').toUpperCase()} movement detected`,
              impactScore: Math.log(tx.amount_usd || 1000000) * (tx.amount_usd > 10000000 ? 1.5 : 1.0),
            }));
            
            setSignals(transformedSignals);
            setIsConnected(true);
            setLastUpdate(new Date());
            return;
          }
        } catch (apiError) {
          console.log('Live API failed, using cached data...');
        }
        
        const { data: digestData, error: digestError } = await supabase
          .from('whale_digest')
          .select('*')
          .order('event_time', { ascending: false })
          .limit(50);
        
        if (!digestError && digestData) {
          const transformedSignals: Signal[] = digestData.map((item: any) => ({
            id: String(item.id),
            asset: item.asset,
            direction: item.severity > 3 ? 'outflow' : 'inflow',
            amountUsd: item.amount_usd || 0,
            timestamp: item.event_time,
            ownerType: 'whale',
            source: item.source,
            risk: item.severity > 3 ? 'high' : 'medium',
            isLive: false,
            reason: item.summary,
            impactScore: Math.log(item.amount_usd || 1000000) * (item.severity > 3 ? 1.5 : 1.0),
          }));
          
          setSignals(transformedSignals);
          setIsConnected(false);
          setLastUpdate(new Date());
        } else {
          setError('No data available');
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
        setError('Failed to load signals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleSignalClick = (signal: Signal) => {
    setSelectedSignal(signal);
    setExplainModalOpen(true);
    trackEvent('explain_modal_opened', { 
      id: signal.id, 
      type: signal.direction,
      source: 'signals_feed'
    });
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    trackEvent('tab_switch', { 
      from: activeTab,
      to: tab,
      signalCount: signals.length
    });
  };

  const handleBackToDashboard = () => {
    navigate('/');
    trackEvent('nav_back_to_dashboard', { source: 'signals_feed' });
  };

  const handleCreateAlert = (signal: Signal) => {
    trackEvent('alert_created', {
      id: signal.id,
      asset: signal.asset,
      direction: signal.direction,
      amountUsd: signal.amountUsd,
      source: 'signals_feed'
    });
  };

  const handleViewNewItems = () => {
    setNewItemsCount(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enhanced signal processing with filtering
  const filteredSignals = signals.filter(signal => {
    if (pinnedFilter === 'all') return true;
    if (pinnedFilter === 'exchanges') return signal.direction === 'outflow';
    if (pinnedFilter === 'large') return signal.amountUsd > 10000000; // $10M+
    return signal.asset === pinnedFilter;
  });

  const topSignals = filteredSignals
    .filter(s => s.impactScore && s.impactScore > 0)
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, 20);

  const signalGroups = groupSignals(filteredSignals);
  const groupedSignals = signalGroups.filter(g => shouldGroup(g.signals));
  const ungroupedSignals = signalGroups.filter(g => !shouldGroup(g.signals)).flatMap(g => g.signals);

  // Enhanced stats
  const criticalSignals = filteredSignals.filter(s => s.risk === 'high').length;
  const totalVolume = filteredSignals.reduce((sum, s) => sum + s.amountUsd, 0);
  const uniqueAssets = new Set(filteredSignals.map(s => s.asset)).size;

  // Signal counts for pinned filters
  const signalCounts = {
    all: signals.length,
    BTC: signals.filter(s => s.asset === 'BTC').length,
    USDT: signals.filter(s => s.asset === 'USDT').length,
    XRP: signals.filter(s => s.asset === 'XRP').length,
    exchanges: signals.filter(s => s.direction === 'outflow').length,
    large: signals.filter(s => s.amountUsd > 10000000).length,
  };

  // Calculate bias for narrative
  const totalInflows = filteredSignals.filter(s => s.direction === 'inflow').reduce((sum, s) => sum + s.amountUsd, 0);
  const totalOutflows = filteredSignals.filter(s => s.direction === 'outflow').reduce((sum, s) => sum + s.amountUsd, 0);
  const netFlow = totalInflows - totalOutflows;
  const bias = {
    side: netFlow > 0 ? 'buy' as const : 'sell' as const,
    deltaPct: Math.round(Math.abs(netFlow) / (totalInflows + totalOutflows) * 100) || 0
  };

  const stats = {
    signals: filteredSignals.length,
    inflowsUsd: totalInflows,
    outflowsUsd: totalOutflows
  };

  // Top flows for Phase D
  const topInflows = filteredSignals
    .filter(s => s.direction === 'inflow')
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, 3);

  const topOutflows = filteredSignals
    .filter(s => s.direction === 'outflow')
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, 3);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-28"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
      >
        <LiteGlobalHeader />
        
        {/* Phase D: MicroTicker */}
        <MicroTicker 
          lastUpdate={lastUpdate}
          activeWallets={activeWallets}
          failedFeeds={failedFeeds}
        />
        
        {/* Enhanced Signals Chrome */}
        <SignalsHeaderBar
          onBack={handleBackToDashboard}
          onCreateAlert={() => trackEvent('fab_create_alert_clicked', { source: 'header' })}
          liveStatus={isConnected ? 'connected' : 'paused'}
        />
        
        {/* Phase D: Enhanced Tab Bar with Heartbeat - Mobile Responsive */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/40 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="py-3 space-y-3">
              {/* Tab Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => handleTabChange('top')}
                  className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                    activeTab === 'top' 
                      ? 'bg-[var(--brand-teal,#14B8A6)] text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="hidden xs:inline">Top Flows</span>
                  <span className="xs:hidden">Top</span>
                </button>
                <button
                  onClick={() => handleTabChange('all')}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap text-sm ${
                    activeTab === 'all' 
                      ? 'bg-[var(--brand-teal,#14B8A6)] text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="hidden xs:inline">All {signals.length}</span>
                  <span className="xs:hidden">{signals.length}</span>
                  <HeartbeatDot isLive={isConnected} size="sm" />
                </button>
                <button
                  onClick={() => handleTabChange('raw')}
                  className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                    activeTab === 'raw' 
                      ? 'bg-[var(--brand-teal,#14B8A6)] text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="hidden xs:inline">Raw Data</span>
                  <span className="xs:hidden">Raw</span>
                </button>
              </div>
              
              {/* Stats Row - Mobile Responsive */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums overflow-x-auto scrollbar-hide">
                <span className="whitespace-nowrap">{criticalSignals} critical</span>
                <span>•</span>
                <span className="whitespace-nowrap">${(totalVolume / 1e6).toFixed(1)}M</span>
                <span>•</span>
                <span className="whitespace-nowrap">{uniqueAssets} assets</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <SignalFilterBar filter={filter} onChange={setFilter} />
          
          <WorldClassNewItemsBadge count={newItemsCount} onViewNew={handleViewNewItems} />

          <div className="mx-auto max-w-7xl px-4 space-y-4">
            <TabsContent value="top" className="mt-6 space-y-6 pb-24">
            {/* Phase D: World-Class Narrative */}
            {!isLoading && signals.length > 0 && (
              <WorldClassNarrativeHeader
                bias={bias}
                stats={stats}
                refreshedAt={lastUpdate}
                onRefresh={() => window.location.reload()}
              />
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading top signals...</span>
              </div>
            ) : topSignals.length === 0 ? (
              <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800">
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">No Top Signals</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No high-impact whale movements detected
                  </p>
                  <Button 
                    onClick={() => handleTabChange('all')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    View All Signals
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Top Inflows */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Top Inflows (Accumulation)
                  </h3>
                  <div className="space-y-4">
                    {topInflows.map((signal, index) => (
                      <ExpandableSignalCard
                        key={signal.id}
                        signal={signal}
                        rank={index + 1}
                        isTopFlow={true}
                        onExplain={() => {
                          setSelectedSignal(signal);
                          setExplainModalOpen(true);
                        }}
                        onCreateAlert={() => {
                          setAlertSignal(signal);
                          setIsAlertOpen(true);
                        }}
                        onViewPattern={() => {
                          setPatternSignal(signal);
                          setIsPatternOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Top Outflows */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Top Outflows (Distribution)
                  </h3>
                  <div className="space-y-4">
                    {topOutflows.map((signal, index) => (
                      <ExpandableSignalCard
                        key={signal.id}
                        signal={signal}
                        rank={index + 1}
                        isTopFlow={true}
                        onExplain={() => {
                          setSelectedSignal(signal);
                          setExplainModalOpen(true);
                        }}
                        onCreateAlert={() => {
                          setAlertSignal(signal);
                          setIsAlertOpen(true);
                        }}
                        onViewPattern={() => {
                          setPatternSignal(signal);
                          setIsPatternOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-5 pb-24">
            <WorldClassFiltersBar 
              activeFilter={pinnedFilter}
              onFilterChange={setPinnedFilter}
              counts={signalCounts}
            />
            
            {!isLoading && filteredSignals.length > 0 && (
              <WorldClassNarrativeHeader
                bias={bias}
                stats={stats}
                refreshedAt={lastUpdate}
                onRefresh={() => window.location.reload()}
              />
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading signals...</span>
              </div>
            ) : filteredSignals.length === 0 ? (
              <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800">
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">No Signals</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">No whale movements detected</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Phase D: All signals as expandable cards */}
                {filteredSignals
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((signal, index) => (
                    <div key={signal.id} className={index > 0 && index % 5 === 0 ? 'border-t border-slate-200/40 dark:border-slate-800 pt-4 mt-4' : ''}>
                      <ExpandableSignalCard
                        signal={signal}
                        onExplain={() => {
                          setSelectedSignal(signal);
                          setExplainModalOpen(true);
                        }}
                        onCreateAlert={() => {
                          setAlertSignal(signal);
                          setIsAlertOpen(true);
                        }}
                        onViewPattern={() => {
                          setPatternSignal(signal);
                          setIsPatternOpen(true);
                        }}
                      />
                    </div>
                  ))
                }
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-6 pb-24 relative">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-b-slate-200/40 dark:border-slate-800 p-4 mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Advanced Raw Data Analysis</h3>
            </div>
            <AdvancedRawTable 
              signals={filteredSignals} 
              onExport={(exportSignals) => {
                console.log('Exporting filtered signals:', exportSignals.length);
                // TODO: Integrate with ExportModal
              }}
            />
          </TabsContent>
        </div>
      </Tabs>



      {/* Modals */}
      <ExplainModal
        signal={selectedSignal}
        isOpen={explainModalOpen}
        onClose={() => {
          setExplainModalOpen(false);
          setSelectedSignal(null);
        }}
        onCreateAlert={() => {
          setExplainModalOpen(false);
          setAlertSignal(selectedSignal);
          setIsAlertOpen(true);
        }}
      />
      
      <PatternModal
        signal={patternSignal}
        isOpen={isPatternOpen}
        onClose={() => {
          setIsPatternOpen(false);
          setPatternSignal(null);
        }}
        onCreateAlert={() => {
          setIsPatternOpen(false);
          setAlertSignal(patternSignal);
          setIsAlertOpen(true);
        }}
      />
      
      <CreateAlertModal
        signal={alertSignal}
        isOpen={isAlertOpen}
        onClose={() => {
          setIsAlertOpen(false);
          setAlertSignal(null);
        }}
        onSuccess={() => {
          console.log('Alert created successfully');
        }}
      />

      <SignalInsightSheet
        signal={selectedSignal}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>

    {/* Quick Actions Bar */}
    <QuickActionsBar />
  </div>
  );
}
