/**
 * Real-Time Signal Feed with Infinite Scroll
 */

'use client';

import { useCallback, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import ExistingSignalCard from './SignalCard';
import type { Signal } from '@/types/signal';
import type { SignalEvent } from '@/types/hub2';

// Adapter to convert Signal to SignalEvent
const SignalCard = ({ signal, delay }: { signal: Signal; delay?: number }) => {
  const signalEvent: SignalEvent = {
    id: signal.id,
    ts: signal.timestamp,
    type: signal.direction === 'outflow' ? 'cex_outflow' : 'cex_inflow',
    entity: {
      name: signal.asset,
      symbol: signal.assetSymbol || signal.asset,
      type: 'token'
    },
    impactUsd: signal.amountUsd,
    delta: signal.direction === 'outflow' ? -5 : 5,
    confidence: signal.risk === 'high' ? 'high' : signal.risk === 'low' ? 'low' : 'med',
    reasonCodes: signal.reason ? [signal.reason] : [],
    source: signal.source
  };
  
  return <ExistingSignalCard signal={signalEvent} />;
};
import { useSignalFeed } from '@/hooks/useSignalFeed';
import type { Signal } from '@/types/signal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SignalFeedProps {
  enableRealtime?: boolean;
  pageSize?: number;
}

export function SignalFeed({ enableRealtime = true, pageSize = 50 }: SignalFeedProps) {
  const {
    signals,
    isLoading,
    isConnected,
    isPaused,
    pendingCount,
    hasMore,
    error,
    loadMore,
    resume,
    refresh,
  } = useSignalFeed({ enableRealtime, pageSize });

  const virtuosoRef = useRef<unknown>(null);

  const loadMoreCallback = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const handleResume = useCallback(() => {
    resume();
    virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'smooth' });
  }, [resume]);

  if (error && signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load signals</h3>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  }

  if (signals.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No whale moves yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create an alert to get notified when whales move
          </p>
          <Button>Create Alert</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Connection Status */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Wifi className="h-3 w-3" />
            <span>Live</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Pause Banner */}
      {isPaused && pendingCount > 0 && (
        <div className="sticky top-0 z-20 bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              New signals ({pendingCount}) — tap to load
            </p>
            <Button size="sm" onClick={handleResume}>
              Load New
            </Button>
          </div>
        </div>
      )}

      {/* Virtualized List */}
      <Virtuoso
        ref={virtuosoRef}
        data={signals}
        endReached={loadMoreCallback}
        overscan={200}
        itemContent={(index, signal) => (
          <div className="px-4 py-2">
            <SignalCard signal={signal} />
          </div>
        )}
        components={{
          Footer: () => {
            if (isLoading) {
              return (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              );
            }
            if (!hasMore) {
              return (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No more signals
                </div>
              );
            }
            return null;
          },
        }}
        style={{ height: '100%' }}
      />

      {/* Accessibility: Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {pendingCount > 0 && `${pendingCount} new signals available`}
      </div>
    </div>
  );
}
