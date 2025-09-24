import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { 
  MarketSummary, 
  WhaleCluster, 
  Alert, 
  AlertFilters, 
  AlertStream,
  WatchlistItem,
  ExportRequest 
} from '@/types/market-intelligence';

// Market Summary Hook
export function useMarketSummary() {
  return useQuery({
    queryKey: ['market', 'summary'],
    queryFn: async (): Promise<MarketSummary> => {
      const { data, error } = await supabase.functions.invoke('market-summary');
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// Whale Clusters Hook
export function useWhaleClusters(chain?: string, window = '24h') {
  return useQuery({
    queryKey: ['whales', 'clusters', chain, window],
    queryFn: async (): Promise<WhaleCluster[]> => {
      const { data, error } = await supabase.functions.invoke('whale-clusters');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Whale Cluster Details Hook
export function useWhaleClusterDetails(clusterId: string) {
  return useQuery({
    queryKey: ['whales', 'cluster', clusterId],
    queryFn: async (): Promise<WhaleCluster> => {
      const { data, error } = await supabase.functions.invoke(`whale-cluster/${clusterId}`);
      if (error) throw error;
      return data;
    },
    enabled: !!clusterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Alerts Stream Hook - using real alert_events table
export function useAlertsStream(filters?: AlertFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['alerts', 'stream', filters],
    queryFn: async (): Promise<AlertStream> => {
      let query = supabase
        .from('alert_events')
        .select(`
          id,
          created_at,
          trigger_data,
          is_read,
          alert_config!inner(
            trigger_type,
            threshold
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data: alertEvents, error } = await query;
      if (error) throw error;

      const alerts = alertEvents?.map(event => ({
        id: event.id,
        timestamp: event.created_at,
        chain: event.trigger_data?.chain || 'ETH',
        token: event.trigger_data?.token || 'USDT',
        usdAmount: event.trigger_data?.amount || 0,
        fromEntity: event.trigger_data?.from || 'Unknown',
        toEntity: event.trigger_data?.to || 'Unknown',
        severity: event.trigger_data?.severity || 'Info',
        score: event.trigger_data?.score || 0,
        reasons: event.trigger_data?.reasons || [],
        clusterId: event.trigger_data?.clusterId,
        isRead: event.is_read
      })) || [];

      return {
        alerts,
        cursor: alerts.length > 0 ? alerts[alerts.length - 1].timestamp : null,
        hasMore: alerts.length === 50,
        totalCount: alerts.length
      };
    },
    enabled: !!user,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// Alert Ranking Hook
export function useAlertRanking() {
  const { track } = useAnalytics();
  
  return useMutation({
    mutationFn: async ({ alertId, score, reasons }: { 
      alertId: string; 
      score: number; 
      reasons: string[] 
    }) => {
      const { data, error } = await supabase.functions.invoke('alert-rank', {
        body: { alertId, score, reasons }
      });
      if (error) throw error;
      
      track('alert_ranked', { alertId, score, reasons });
      return data;
    },
  });
}

// Watchlist Hook
export function useWatchlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  const watchlistQuery = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async (): Promise<WatchlistItem[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addToWatchlist = useMutation({
    mutationFn: async ({ entityType, entityId, label }: {
      entityType: 'address' | 'token' | 'cluster';
      entityId: string;
      label?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          label
        })
        .select()
        .single();
      
      if (error) throw error;
      
      track('watchlist_item_added', { entityType, entityId, label });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      track('watchlist_item_removed', { itemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });

  return {
    watchlist: watchlistQuery.data || [],
    isLoading: watchlistQuery.isLoading,
    addToWatchlist,
    removeFromWatchlist,
  };
}

// Export Hook
export function useExport() {
  const { user } = useAuth();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async (request: ExportRequest) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: { ...request, userId: user.id }
      });
      
      if (error) throw error;
      
      track('data_exported', { 
        type: request.type, 
        format: request.format,
        hasFilters: !!request.filters 
      });
      
      return data;
    },
  });
}

// Real-time Alerts Hook
export function useRealtimeAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate alerts query to fetch new data
          queryClient.invalidateQueries({ queryKey: ['alerts', 'stream'] });
          
          // Show notification for high-priority alerts
          if (payload.new.severity === 'High') {
            // Trigger browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('High Priority Alert', {
                body: payload.new.title || 'New whale activity detected',
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

// Trading Actions Hook (stub for future implementation)
export function useTradingActions() {
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async ({ action, symbol, amount }: {
      action: 'buy' | 'sell' | 'hedge';
      symbol: string;
      amount: number;
    }) => {
      // Stub implementation - would integrate with exchange APIs
      track('trading_action_initiated', { action, symbol, amount });
      
      // For now, just return success
      return { success: true, orderId: `order_${Date.now()}` };
    },
  });
}