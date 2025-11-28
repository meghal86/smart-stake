import { useQuery, useMutation } from "@tanstack/react-query";
import { toEntitySummary, toSignalEvent } from "@/adapters/hub2";
import { AlertRule, BacktestResult, EntitySummary, SignalEvent, PulseData, ExploreData, EntityDetail } from "@/types/hub2";
import { supabase } from "@/integrations/supabase/client";

// Direct Edge Function calls
const API = {
  pulse: async (window: string) => {
    try {
      // Call whale-alerts and market summary (like main app whale page)
      const [whaleAlerts, summary] = await Promise.all([
        supabase.functions.invoke('whale-alerts', { 
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        supabase.functions.invoke('market-summary-enhanced', { 
          headers: {
            'Content-Type': 'application/json'
          }
        }),
      ]);

      if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);
      if (summary.error) throw new Error(summary.error.message);

      // Calculate market sentiment from whale data (like main app)
      const whaleTransactions = whaleAlerts.data?.transactions || [];
      const avgSentiment = whaleTransactions.length > 0 ? 65 : 50; // Higher sentiment when whales are active

      const kpis = {
        marketSentiment: avgSentiment,
        whalePressure: (summary.data?.whalesTrend?.at(-1) ?? 0) - (summary.data?.whalesOutflow?.at(-1) ?? 0),
        risk: summary.data.riskIndex || 0,
        deltas: {
          sentiment: summary.data.sentimentDelta || 0,
          pressure: summary.data.pressureDelta || 0,
          risk: summary.data.riskDelta || 0
        },
        ts: summary.data.refreshedAt || new Date().toISOString()
      };

      // Build top signals from whale-alerts data (like main app whale page)
      const topWhaleSignals = whaleTransactions
        .sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0))
        .slice(0, 6)
        .map((tx) => ({
          id: tx.hash || `whale-${tx.from?.address || tx.from}`,
          kind: 'whale',
          symbol: tx.symbol || 'UNKNOWN',
          name: `${tx.symbol || 'Unknown'} Whale Movement`,
          price_usd: tx.amount_usd || 0,
          change_24h: 0,
          is_real: true,
          metrics: {
            sentiment: 50, // neutral for whale movements
            risk: Math.min(10, (tx.amount_usd || 0) / 1000000), // risk based on amount
            whale_in: tx.to?.owner_type === 'exchange' ? 1 : 0,
            whale_out: tx.from?.owner_type === 'exchange' ? 1 : 0,
            source: 'whale-alert.io',
            updated_at: new Date(tx.timestamp * 1000).toISOString()
          },
          lastEvents: [{
            id: tx.hash,
            ts: new Date(tx.timestamp * 1000).toISOString(),
            type: tx.to?.owner_type === 'exchange' ? 'cex_inflow' : 'cex_outflow',
            entity: { kind: 'asset', id: tx.symbol?.toLowerCase() || 'unknown', symbol: tx.symbol, name: tx.symbol },
            impactUsd: tx.amount_usd,
            delta: tx.to?.owner_type === 'exchange' ? 1 : -1,
            confidence: 'high',
            source: 'whale-alert.io',
            reasonCodes: [`${tx.amount_usd ? (tx.amount_usd / 1000000).toFixed(1) : 0}M transfer`]
          }]
        }))
        .map(toEntitySummary);

      return { kpis, topSignals: topWhaleSignals, ts: new Date().toISOString() };
    } catch (error) {
      console.error('[Hub2] Edge Functions failed:', error);
      throw error;
    }
  },
  
      explore: async (queryString: string) => {
        try {
          const params = new URLSearchParams(queryString);
          const window = params.get('window') || '24h';
          const sentiment_min = Number(params.get('sentiment_min') || 0);
          const sort = params.get('sort') || 'sentiment';

          // Get whale alerts data (like main app whale page)
          const whaleAlerts = await supabase.functions.invoke('whale-alerts', {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);

          // Build whale entities from whale alerts (like main app)
          const whaleTransactions = whaleAlerts.data?.transactions || [];
          const whaleMap = new Map<string, {
            id: string;
            kind: string;
            symbol: string;
            name: string;
            price_usd: number;
            change_24h: number;
            is_real: boolean;
            metrics: Record<string, unknown>;
            events: Array<Record<string, unknown>>;
          }>();
          
          whaleTransactions.forEach((tx: Record<string, unknown>) => {
            const symbol = tx.symbol?.toUpperCase() || 'UNKNOWN';
            if (!whaleMap.has(symbol)) {
              whaleMap.set(symbol, {
                id: symbol.toLowerCase(),
                kind: 'asset',
                symbol: symbol,
                name: symbol,
                price_usd: tx.amount_usd || 0,
                change_24h: 0,
                is_real: true,
                metrics: {
                  sentiment: 50, // neutral for whale movements
                  risk: Math.min(10, (tx.amount_usd || 0) / 1000000),
                  whale_in: tx.to?.owner_type === 'exchange' ? 1 : 0,
                  whale_out: tx.from?.owner_type === 'exchange' ? 1 : 0,
                  source: 'whale-alert.io',
                  updated_at: new Date(tx.timestamp * 1000).toISOString()
                },
                events: [{
                  id: tx.hash,
                  ts: new Date(tx.timestamp * 1000).toISOString(),
                  type: tx.to?.owner_type === 'exchange' ? 'cex_inflow' : 'cex_outflow',
                  entity: { kind: 'asset', id: symbol.toLowerCase(), symbol: symbol, name: symbol },
                  impactUsd: tx.amount_usd,
                  delta: tx.to?.owner_type === 'exchange' ? 1 : -1,
                  confidence: 'high',
                  source: 'whale-alert.io',
                  reasonCodes: [`${tx.amount_usd ? (tx.amount_usd / 1000000).toFixed(1) : 0}M transfer`]
                }]
              });
            } else {
              // Add more events to existing whale
              const existing = whaleMap.get(symbol);
              existing.events.push({
                id: tx.hash,
                ts: new Date(tx.timestamp * 1000).toISOString(),
                type: tx.to?.owner_type === 'exchange' ? 'cex_inflow' : 'cex_outflow',
                entity: { kind: 'asset', id: symbol.toLowerCase(), symbol: symbol, name: symbol },
                impactUsd: tx.amount_usd,
                delta: tx.to?.owner_type === 'exchange' ? 1 : -1,
                confidence: 'high',
                source: 'whale-alert.io',
                reasonCodes: [`${tx.amount_usd ? (tx.amount_usd / 1000000).toFixed(1) : 0}M transfer`]
              });
            }
          });

          // Convert to EntitySummary array
          let items = Array.from(whaleMap.values()).map(toEntitySummary);

      // Filter/sort
      items = items.filter(i => i.gauges.sentiment >= sentiment_min);
      items.sort((a,b)=> {
        const aVal = (b.gauges as Record<string, number>)[sort] || 0;
        const bVal = (a.gauges as Record<string, number>)[sort] || 0;
        return aVal - bVal;
      });

      return { items, total: items.length, hasMore: false };
    } catch (error) {
      console.error('[Hub2] Edge Functions failed:', error);
      throw error;
    }
  },
  
      entity: async (id: string) => {
        try {
          // Get whale alerts data (like main app whale page)
          const whaleAlerts = await supabase.functions.invoke('whale-alerts', {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);

          // Find whale transactions for this entity
          const whaleTransactions = whaleAlerts.data?.transactions || [];
          const entityTransactions = whaleTransactions.filter((tx: Record<string, unknown>) => 
            tx.symbol?.toUpperCase() === id.toUpperCase()
          );
          
          // Create entity from whale data
          const totalAmount = entityTransactions.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
          const avgAmount = entityTransactions.length > 0 ? totalAmount / entityTransactions.length : 0;
          
          const row = {
            id: id.toLowerCase(),
            name: id.charAt(0).toUpperCase() + id.slice(1),
            sentimentScore: entityTransactions.length > 0 ? 65 : 50, // Higher sentiment when whales are active
            price: avgAmount,
            change24h: 0
          };

      const metrics = { 
        sentiment: row.sentimentScore, 
        risk: Math.min(10, totalAmount / 1000000), // Risk based on total whale amount
        whale_in: entityTransactions.filter(tx => tx.to?.owner_type === 'exchange').length,
        whale_out: entityTransactions.filter(tx => tx.from?.owner_type === 'exchange').length,
        source: 'whale-alert.io', 
        updated_at: new Date().toISOString()
      };
      const summary = toEntitySummary({ 
        id, 
        kind:'asset', 
        symbol:id, 
        name: row.name, 
        price_usd: row.price, 
        change_24h: row.change24h, 
        is_real:true, 
        metrics 
      });

          const timeline = entityTransactions.map((t: Record<string, unknown>)=> toSignalEvent({
          id: t.hash, 
          type: t.to?.owner_type === 'exchange' ? 'cex_inflow' : 'cex_outflow', 
          ts: new Date(t.timestamp*1000).toISOString(),
          impactUsd: t.amount_usd, 
          entity: { kind:'asset', id, symbol:id, name: row.name },
          delta: t.to?.owner_type === 'exchange' ? 1 : -1,
          confidence:'high',
          source:'whale-alert.io',
          reasonCodes: [`${t.amount_usd ? (t.amount_usd / 1000000).toFixed(1) : 0}M transfer`]
        }));

      return { 
        summary, 
        events: timeline,
        timeline: timeline, 
        ai: { 
          soWhat: `Analysis shows ${id} with ${summary.gauges.sentiment}% sentiment and ${summary.gauges.risk}/10 risk level.`, 
          next: ['Monitor for breakout', 'Watch whale activity', 'Set stop-loss'] 
        } 
      };
    } catch (error) {
      console.error('[Hub2] Edge Functions failed:', error);
      throw error;
    }
  },
  
  backtest: async (rule: Partial<AlertRule>) => {
    // TODO: Implement real backtest Edge Function
    throw new Error('Backtest functionality not yet implemented');
  },
  
      alerts: async () => {
        try {
          // Get real whale alerts data
          const whaleAlerts = await supabase.functions.invoke('whale-alerts', {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);

          // Convert whale transactions to alert rules
          const whaleTransactions = whaleAlerts.data?.transactions || [];
          const alertMap = new Map<string, any>();
          
          whaleTransactions.forEach((tx: Record<string, unknown>, index: number) => {
            const symbol = tx.symbol?.toUpperCase() || 'UNKNOWN';
            const alertId = `whale-${symbol}-${index}`;
            
            if (!alertMap.has(symbol)) {
              alertMap.set(symbol, {
                id: alertId,
                name: `${symbol} Whale Alert`,
                predicate: { 
                  type: 'whale_movement', 
                  threshold: tx.amount_usd || 1000000 
                },
                scope: { kind: 'asset', ids: [symbol.toLowerCase()] },
                threshold: { amount: tx.amount_usd || 1000000 },
                window: '1h',
                channels: ['inapp', 'push'],
                enabled: true,
                lastTriggered: new Date(tx.timestamp * 1000).toISOString(),
                symbol: symbol,
                amount: tx.amount_usd,
                hash: tx.hash,
                from: tx.from?.address,
                to: tx.to?.address,
                ownerType: tx.to?.owner_type || tx.from?.owner_type
              });
            }
          });

          // Convert to array and limit to 50 alerts
          const realAlerts = Array.from(alertMap.values()).slice(0, 50);
          
          return realAlerts;
        } catch (error) {
          console.error('[Hub2] Alerts failed:', error);
          throw error;
        }
      },
  
  createAlert: async (rule: Partial<AlertRule>) => {
    try {
      // Try Edge Function first
      const { data, error } = await supabase.functions.invoke('create-alert', {
        body: {
          name: rule.name || 'New Alert',
          predicate: rule.predicate || { type: 'price_change', threshold: 5 },
          scope: rule.scope || { kind: 'asset', ids: ['bitcoin'] },
          threshold: rule.threshold || { percentage: 5 },
          window: rule.window || '24h',
          channels: rule.channels || ['inapp'],
          enabled: true
        },
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (error) throw error;
      return { success: true, id: data.id, alert: data };
    } catch (error) {
      // Fallback to localStorage if Edge Function doesn't exist
      console.warn('create-alert Edge Function not available, using localStorage');
      const newAlert = {
        id: `alert-${Date.now()}`,
        name: rule.name || 'New Alert',
        predicate: rule.predicate || { type: 'price_change', threshold: 5 },
        scope: rule.scope || { kind: 'asset', ids: ['bitcoin'] },
        threshold: rule.threshold || { percentage: 5 },
        window: rule.window || '24h',
        channels: rule.channels || ['inapp'],
        enabled: true,
        lastTriggered: null
      };
      
      // Store in localStorage
      const existing = JSON.parse(localStorage.getItem('hub2-alerts') || '[]');
      existing.push(newAlert);
      localStorage.setItem('hub2-alerts', JSON.stringify(existing));
      
      return { success: true, id: newAlert.id, alert: newAlert };
    }
  }
};

export function usePulse(window: '24h'|'7d'|'30d') {
  return useQuery({
    queryKey: ['hub2','pulse',window],
    queryFn: async () => {
      const data = await API.pulse(window);
      return data as PulseData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useExplore(qs: string) {
  return useQuery({
    queryKey: ['hub2','explore',qs],
    queryFn: async () => {
      const data = await API.explore(qs);
      return data as ExploreData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: ['hub2','entity',id],
    queryFn: async () => {
      const data = await API.entity(id);
      return data as EntityDetail;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useBacktest() {
  return useMutation({
    mutationFn: async (rule: Partial<AlertRule>) => {
      const data = await API.backtest(rule);
      return data as BacktestResult;
    }
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['hub2','alerts'],
    queryFn: async () => {
      const data = await API.alerts();
      return data as AlertRule[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useCreateAlert() {
  return useMutation({
    mutationFn: async (rule: Omit<AlertRule, 'id'>) => {
      const data = await API.createAlert(rule);
      return data;
    }
  });
}
