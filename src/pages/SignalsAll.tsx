/**
 * Signals All - World-class all signals view with tighter spacing
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnifiedSignalCard } from '@/components/signals/UnifiedSignalCard';
import { HeaderDigest } from '@/components/signals/HeaderDigest';
import { ExplainModal } from '@/components/signals/ExplainModal';
import { NewItemsBadge } from '@/components/signals/NewItemsBadge';
import { PinnedFilters } from '@/components/signals/PinnedFilters';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/telemetry';
import { Activity } from 'lucide-react';
import type { Signal } from '@/types/signal';

export default function SignalsAll() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [pinnedFilter, setPinnedFilter] = useState('all');
  const [newItemsCount, setNewItemsCount] = useState(0);

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
            return;
          }
        } catch (apiError) {
          console.log('Live API failed, using cached data...');
        }
        
        const { data: digestData, error: digestError } = await supabase
          .from('whale_digest')
          .select('*')
          .order('event_time', { ascending: false })
          .limit(100);
        
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
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 120000);
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedSignals = useMemo(() => {
    let filtered = signals.filter(signal => {
      // Pinned filter
      if (pinnedFilter !== 'all') {
        if (pinnedFilter === 'exchanges' && signal.direction !== 'outflow') return false;
        if (pinnedFilter !== 'exchanges' && signal.asset !== pinnedFilter) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          signal.asset.toLowerCase().includes(query) ||
          signal.direction.toLowerCase().includes(query) ||
          signal.source.toLowerCase().includes(query)
        );
      }

      return true;
    });

    switch (sortBy) {
      case 'volume':
        return filtered.sort((a, b) => b.amountUsd - a.amountUsd);
      case 'confidence':
        return filtered.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
      case 'time':
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      default:
        return filtered;
    }
  }, [signals, searchQuery, sortBy, pinnedFilter]);

  const handleSignalClick = (signal: Signal) => {
    setSelectedSignal(signal);
    setExplainModalOpen(true);
    trackEvent('explain_modal_opened', { 
      id: signal.id, 
      source: 'signals_all'
    });
  };

  const handleCreateAlert = (signal: Signal) => {
    trackEvent('alert_created', {
      id: signal.id,
      asset: signal.asset,
      source: 'signals_all'
    });
  };

  const handleViewNewItems = () => {
    setNewItemsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const signalCounts = {
    all: signals.length,
    BTC: signals.filter(s => s.asset === 'BTC').length,
    USDT: signals.filter(s => s.asset === 'USDT').length,
    XRP: signals.filter(s => s.asset === 'XRP').length,
    exchanges: signals.filter(s => s.direction === 'outflow').length,
  };

  const totalVolume = filteredAndSortedSignals.reduce((sum, s) => sum + s.amountUsd, 0);
  const uniqueAssets = new Set(filteredAndSortedSignals.map(s => s.asset)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <NewItemsBadge count={newItemsCount} onViewNew={handleViewNewItems} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <HeaderDigest
          signals={signals}
          timeWindow={60}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={(sort) => {
            setSortBy(sort);
            trackEvent('sort_applied', { sortBy: sort, view: 'all' });
          }}
        />

        <PinnedFilters 
          activeFilter={pinnedFilter}
          onFilterChange={setPinnedFilter}
          signalCounts={signalCounts}
        />

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
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading signals...</span>
            </motion.div>
          ) : filteredAndSortedSignals.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800">
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">No Signals</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No whale movements match your filters
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      setPinnedFilter('all');
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-0 mt-6"
            >
              {filteredAndSortedSignals.map((signal, index) => (
                <div key={signal.id} className={index > 0 && index % 5 === 0 ? 'border-t border-slate-200/40 dark:border-slate-800 pt-4 mt-4' : ''}>
                  <UnifiedSignalCard
                    signal={signal}
                    variant="all"
                    index={index}
                    onExplain={handleSignalClick}
                    onCreateAlert={handleCreateAlert}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Summary */}
        <div className="mt-8 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl border border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center justify-center gap-6 text-sm tabular-nums">
            <span className="text-slate-700 dark:text-slate-300">
              {filteredAndSortedSignals.length} signals
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              ${(totalVolume / 1e6).toFixed(1)}M moved
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              {uniqueAssets} assets
            </span>
          </div>
        </div>
      </div>

      <ExplainModal
        signal={selectedSignal}
        open={explainModalOpen}
        onOpenChange={setExplainModalOpen}
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
}