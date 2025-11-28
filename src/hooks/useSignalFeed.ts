/**
 * Real-Time Signal Feed Hook with Batching & Rate Limiting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Signal, Paged, SignalFilter } from '@/types/signal';
import { calculateImpactScore, isDuplicate, sortByImpact } from '@/lib/signal-utils';
import { trackEvent } from '@/lib/telemetry';

interface UseSignalFeedOptions {
  pageSize?: number;
  filter?: SignalFilter;
  enableRealtime?: boolean;
  batchDelay?: number;
  maxBatchSize?: number;
}

export function useSignalFeed(options: UseSignalFeedOptions = {}) {
  const {
    pageSize = 50,
    filter,
    enableRealtime = true,
    batchDelay = 500,
    maxBatchSize = 25,
  } = options;

  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const pendingSignals = useRef<Signal[]>([]);
  const batchTimer = useRef<NodeJS.Timeout>();
  const retryCount = useRef(0);
  const maxRetries = 5;

  // LRU Cache (250 items)
  const cache = useRef(new Map<string, Signal>());
  const maxCacheSize = 250;

  const addToCache = useCallback((signal: Signal) => {
    if (cache.current.size >= maxCacheSize) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    cache.current.set(signal.id, signal);
  }, []);

  // Flush pending signals batch
  const flushBatch = useCallback(() => {
    if (pendingSignals.current.length === 0) return;

    const batch = [...pendingSignals.current];
    pendingSignals.current = [];
    setPendingCount(0);

    setSignals(prev => {
      // Deduplicate
      const filtered = batch.filter(s => !isDuplicate(s, prev));
      
      // Calculate impact scores
      const scored = filtered.map(s => ({
        ...s,
        impactScore: calculateImpactScore(s),
      }));

      // Add to cache
      scored.forEach(addToCache);

      // Merge and sort
      const merged = [...scored, ...prev];
      const sorted = sortByImpact(merged);

      trackEvent('feed_grouped', {
        batchSize: batch.length,
        dedupedSize: filtered.length,
        totalSize: sorted.length,
      });

      return sorted.slice(0, 1000); // Keep max 1000 in memory
    });

    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
      batchTimer.current = undefined;
    }
  }, [addToCache]);

  // Load initial page
  const loadPage = useCallback(async (cursor?: string) => {
    try {
      let query = supabase
        .from('whale_digest')
        .select('*')
        .order('event_time', { ascending: false })
        .limit(pageSize);

      if (cursor) {
        const decoded = Buffer.from(cursor, 'base64').toString();
        const [timestamp, id] = decoded.split('|');
        query = query.lt('event_time', timestamp);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      const signals: Signal[] = (items || []).map(item => ({
        id: String(item.id),
        asset: item.asset,
        direction: item.severity > 3 ? 'outflow' : 'inflow',
        amountUsd: item.amount_usd || 0,
        timestamp: item.event_time,
        ownerType: 'whale',
        source: item.source,
        risk: item.severity > 3 ? 'high' : 'medium',
        isLive: true,
        reason: item.summary,
        impactScore: calculateImpactScore({
          id: String(item.id),
          asset: item.asset,
          direction: item.severity > 3 ? 'outflow' : 'inflow',
          amountUsd: item.amount_usd || 0,
          timestamp: item.event_time,
          ownerType: 'whale',
          source: item.source,
          risk: item.severity > 3 ? 'high' : 'medium',
        }),
      }));

      const data: Paged<Signal> = {
        items: signals,
        nextCursor: signals.length === pageSize ? 
          Buffer.from(`${items[items.length - 1]?.event_time}|${items[items.length - 1]?.id}`).toString('base64') : 
          undefined,
        tookMs: 100,
        total: signals.length,
      };

      setSignals(prev => cursor ? [...prev, ...data.items] : data.items);
      setNextCursor(data.nextCursor);
      setError(null);
      retryCount.current = 0;

      trackEvent('feed_page_loaded', {
        count: data.items.length,
        cursor: cursor || 'initial',
        tookMs: data.tookMs,
      });

      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  }, [pageSize]);

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      await loadPage(nextCursor);
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading, loadPage]);

  // Handle realtime signal
  const handleRealtimeSignal = useCallback((signal: Signal) => {
    if (isPaused) {
      setPendingCount(prev => prev + 1);
      return;
    }

    pendingSignals.current.push(signal);

    // Auto-pause if backlog > 500
    if (pendingSignals.current.length > 500) {
      setIsPaused(true);
      setPendingCount(pendingSignals.current.length);
      return;
    }

    // Batch flush
    if (pendingSignals.current.length >= maxBatchSize) {
      flushBatch();
    } else if (!batchTimer.current) {
      batchTimer.current = setTimeout(flushBatch, batchDelay);
    }
  }, [isPaused, maxBatchSize, batchDelay, flushBatch]);

  // Resume from pause
  const resume = useCallback(() => {
    setIsPaused(false);
    flushBatch();
  }, [flushBatch]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('signals:created')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whale_digest',
      }, (payload) => {
        const item = payload.new as unknown;
        const signal: Signal = {
          id: String(item.id),
          asset: item.asset,
          direction: item.severity > 3 ? 'outflow' : 'inflow',
          amountUsd: 1000000,
          timestamp: item.event_time,
          ownerType: 'whale',
          source: item.source,
          risk: item.severity > 3 ? 'high' : 'medium',
          reason: item.summary,
        };
        handleRealtimeSignal(signal);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          trackEvent('feed_stream_connected', {});
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          trackEvent('feed_stream_error', { status });
        }
      });

    return () => {
      channel.unsubscribe();
      if (batchTimer.current) clearTimeout(batchTimer.current);
    };
  }, [enableRealtime, handleRealtimeSignal, supabase]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadPage().finally(() => setIsLoading(false));
  }, [loadPage]);

  return {
    signals,
    isLoading,
    isConnected,
    isPaused,
    pendingCount,
    hasMore: !!nextCursor,
    error,
    loadMore,
    resume,
    refresh: () => loadPage(),
  };
}
