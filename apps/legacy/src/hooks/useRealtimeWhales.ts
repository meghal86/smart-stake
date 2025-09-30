import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WhaleEvent {
  id: string;
  asset: string;
  usd_amount: number;
  risk_level: number;
  whale_address: string;
  occurred_at: string;
  tx_hash: string;
  chain: string;
}

interface RealtimeState {
  events: WhaleEvent[];
  isConnected: boolean;
  lastEventTime: Date | null;
  eventCount: number;
}

export function useRealtimeWhales(maxEvents = 50) {
  const [state, setState] = useState<RealtimeState>({
    events: [],
    isConnected: false,
    lastEventTime: null,
    eventCount: 0
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectRealtime = () => {
      // Clean up existing connection
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // Create new channel for whale events
      channelRef.current = supabase
        .channel('whale-events')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_events'
        }, (payload) => {
          const newEvent = payload.new as WhaleEvent;
          
          setState(prev => ({
            ...prev,
            events: [newEvent, ...prev.events].slice(0, maxEvents),
            lastEventTime: new Date(),
            eventCount: prev.eventCount + 1
          }));
          
          // Show notification for high-value events
          if (newEvent.usd_amount > 10000000) {
            console.log('🐋 Mega whale alert:', newEvent);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          setState(prev => ({ ...prev, isConnected: true }));
        })
        .on('presence', { event: 'leave' }, () => {
          setState(prev => ({ ...prev, isConnected: false }));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setState(prev => ({ ...prev, isConnected: true }));
          } else if (status === 'CLOSED') {
            setState(prev => ({ ...prev, isConnected: false }));
            
            // Auto-reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(connectRealtime, 5000);
          }
        });
    };

    connectRealtime();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [maxEvents]);

  // Manual reconnect function
  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setState(prev => ({ ...prev, isConnected: false }));
    
    setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      // Trigger reconnection
    }, 1000);
  };

  return {
    ...state,
    reconnect
  };
}