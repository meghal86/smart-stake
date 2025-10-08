/**
 * Whale Signals Phase D - Energy & Emotion Implementation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExpandableSignalCard } from '@/components/signals/ExpandableSignalCard';
import { MicroTicker } from '@/components/signals/MicroTicker';
import { HeartbeatDot } from '@/components/signals/HeartbeatDot';
import { WorldClassNarrativeHeader } from '@/components/signals/WorldClassNarrativeHeader';
import { WorldClassFiltersBar } from '@/components/signals/WorldClassFiltersBar';
import { EnhancedRawTable } from '@/components/signals/EnhancedRawTable';
import { ExplainModal } from '@/components/signals/ExplainModal';
import { PatternModal } from '@/components/signals/PatternModal';
import { CreateAlertModal } from '@/components/signals/CreateAlertModal';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/telemetry';
import { PhaseDTelemetry } from '@/lib/phase-d-telemetry';
import { Activity } from 'lucide-react';
import type { Signal } from '@/types/signal';

export default function WhaleSignalsPhaseD() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeWallets] = useState(Math.floor(Math.random() * 50) + 20);
  const [failedFeeds] = useState(Math.floor(Math.random() * 3));
  const [isPaused, setIsPaused] = useState(false);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [reducedMotion] = useState(() => 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [shouldVirtualize, setShouldVirtualize] = useState(false);
  const [explainSignal, setExplainSignal] = useState<Signal | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [patternSignal, setPatternSignal] = useState<Signal | null>(null);
  const [isPatternOpen, setIsPatternOpen] = useState(false);
  const [alertSignal, setAlertSignal] = useState<Signal | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    PhaseDTelemetry.trackMotionPreference(reducedMotion);
  }, [reducedMotion]);

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
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(() => {
      if (!isPaused) {
        fetchSignals();
      } else {
        setNewItemsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackEvent('tab_switch', { 
      from: activeTab, 
      to: tab,
      signalCount: signals.length
    });
  };

  const handleInteraction = () => {
    setIsPaused(true);
    PhaseDTelemetry.trackInteractionPause(10000);
    setTimeout(() => setIsPaused(false), 10000); // Resume after 10s
  };

  const handleResumeUpdates = () => {
    setIsPaused(false);
    setNewItemsCount(0);
    window.location.reload();
  };

  // Filter and sort signals
  const filteredSignals = signals.filter(signal => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'exchanges') return signal.direction === 'outflow';
    return signal.asset === activeFilter;
  });

  const topInflows = filteredSignals
    .filter(s => s.direction === 'inflow')
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, 3);

  const topOutflows = filteredSignals
    .filter(s => s.direction === 'outflow')
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, 3);

  const allSignals = filteredSignals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  useEffect(() => {
    setShouldVirtualize(allSignals.length > 100);
  }, [allSignals.length]);

  // Calculate bias
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

  const signalCounts = {
    all: signals.length,
    BTC: signals.filter(s => s.asset === 'BTC').length,
    USDT: signals.filter(s => s.asset === 'USDT').length,
    XRP: signals.filter(s => s.asset === 'XRP').length,
    exchanges: signals.filter(s => s.direction === 'outflow').length,
    large: signals.filter(s => s.amountUsd > 10000000).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-x-hidden touch-manipulation" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      {/* Micro Ticker */}
      <MicroTicker 
        lastUpdate={lastUpdate}
        activeWallets={activeWallets}
        failedFeeds={failedFeeds}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 touch-manipulation" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
        {/* Narrative Header */}
        <WorldClassNarrativeHeader
          bias={bias}
          stats={stats}
          refreshedAt={lastUpdate}
          onRefresh={() => window.location.reload()}
        />

        {/* Test Modal Buttons */}
        <div className="flex gap-2 mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded border">
          <span className="text-sm font-medium">Test Modals:</span>
          <Button size="sm" onClick={() => {
            console.log('Test Explain Modal');
            setExplainSignal(signals[0] || { id: 'test', asset: 'BTC', direction: 'inflow', amountUsd: 1000000, timestamp: new Date().toISOString(), ownerType: 'whale', source: 'test', risk: 'medium', isLive: true, reason: 'Test signal', impactScore: 5 });
            setIsExplainOpen(true);
          }}>Test Explain</Button>
          <Button size="sm" onClick={() => {
            console.log('Test Pattern Modal');
            setPatternSignal(signals[0] || { id: 'test', asset: 'BTC', direction: 'inflow', amountUsd: 1000000, timestamp: new Date().toISOString(), ownerType: 'whale', source: 'test', risk: 'medium', isLive: true, reason: 'Test signal', impactScore: 5 });
            setIsPatternOpen(true);
          }}>Test Pattern</Button>
          <Button size="sm" onClick={() => {
            console.log('Test Alert Modal');
            setAlertSignal(signals[0] || { id: 'test', asset: 'BTC', direction: 'inflow', amountUsd: 1000000, timestamp: new Date().toISOString(), ownerType: 'whale', source: 'test', risk: 'medium', isLive: true, reason: 'Test signal', impactScore: 5 });
            setIsAlertOpen(true);
          }}>Test Alert</Button>
        </div>

        {/* New Items Badge */}
        {newItemsCount > 0 && (
          <motion.div
            initial={!reducedMotion ? { opacity: 0, y: -20 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={!reducedMotion ? { duration: 0.25 } : { duration: 0 }}
            className="flex justify-center mb-4"
          >
            <Button
              onClick={handleResumeUpdates}
              className="bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white shadow-lg"
            >
              New items ({newItemsCount}) • Resume updates
            </Button>
          </motion.div>
        )}

        {/* Tabs with Heartbeat */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="top">Top Flows</TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All {signals.length}
              <HeartbeatDot isLive={!isPaused} size="sm" />
            </TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          {/* Sticky Filters Bar */}
          {(activeTab === 'all' || activeTab === 'top') && (
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/40 dark:border-slate-800 py-2 -mx-6 px-6">
              <WorldClassFiltersBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={signalCounts}
              />
            </div>
          )}

          <TabsContent value="top" className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                  <span className="ml-3 text-slate-600 dark:text-slate-400">Loading top flows...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
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
                            console.log('Explain clicked for signal:', signal.id);
                            setExplainSignal(signal);
                            setIsExplainOpen(true);
                          }}
                          onCreateAlert={() => {
                            console.log('Create Alert clicked for signal:', signal.id);
                            setAlertSignal(signal);
                            setIsAlertOpen(true);
                          }}
                          onViewPattern={() => {
                            console.log('View Pattern clicked for signal:', signal.id);
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
                            setExplainSignal(signal);
                            setIsExplainOpen(true);
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
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                  <span className="ml-3 text-slate-600 dark:text-slate-400">Loading all signals...</span>
                </motion.div>
              ) : allSignals.length === 0 ? (
                <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">No Signals</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      No whale movements match your filters
                    </p>
                    <Button onClick={() => setActiveFilter('all')}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  key="signals"
                  initial={!reducedMotion ? { opacity: 0 } : { opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={!reducedMotion ? { opacity: 0 } : {}}
                  className={shouldVirtualize ? "h-[600px] overflow-y-auto" : "space-y-4"}
                  onMouseEnter={handleInteraction}
                  onTouchStart={handleInteraction}
                >
                  {shouldVirtualize ? (
                    <div className="space-y-4 p-2">
                      {allSignals.slice(0, 50).map((signal, index) => (
                        <ExpandableSignalCard
                          key={signal.id}
                          signal={signal}
                          onExplain={() => {
                            setExplainSignal(signal);
                            setIsExplainOpen(true);
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
                      {allSignals.length > 50 && (
                        <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                          Showing first 50 of {allSignals.length} signals
                        </div>
                      )}
                    </div>
                  ) : (
                    allSignals.map((signal, index) => (
                      <ExpandableSignalCard
                        key={signal.id}
                        signal={signal}
                        onExplain={() => {
                          setExplainSignal(signal);
                          setIsExplainOpen(true);
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
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="raw">
            <EnhancedRawTable signals={filteredSignals} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ExplainModal
        signal={explainSignal}
        isOpen={isExplainOpen}
        onClose={() => {
          setIsExplainOpen(false);
          setExplainSignal(null);
        }}
        onCreateAlert={() => {
          setIsExplainOpen(false);
          setAlertSignal(explainSignal);
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
    </div>
  );
}