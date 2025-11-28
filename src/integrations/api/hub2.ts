import { supabase } from '@/integrations/supabase/client';
import { 
  SummaryKpis, 
  AssetSentiment, 
  TimeWindow, 
  WatchItem, 
  WatchEntityType,
  EnhancedResponse,
  HealthStatus,
  AIDigest,
  AlertKPI
} from '@/types/hub2';

export async function fetchSummaryKpis(window: TimeWindow): Promise<SummaryKpis> {
  try {
    // Use existing Edge Functions like the main app
    const [whaleAlerts, summary] = await Promise.all([
      supabase.functions.invoke('whale-alerts', { 
        headers: { 'Content-Type': 'application/json' }
      }),
      supabase.functions.invoke('market-summary-enhanced', { 
        headers: { 'Content-Type': 'application/json' }
      }),
    ]);

    if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);
    if (summary.error) throw new Error(summary.error.message);

    // Calculate market sentiment from whale data (like main app)
    const whaleTransactions = whaleAlerts.data?.transactions || [];
    const avgSentiment = whaleTransactions.length > 0 ? 65 : 50; // Higher sentiment when whales are active

    return {
      window,
      refreshedAt: summary.data?.refreshedAt || new Date().toISOString(),
      marketSentiment: avgSentiment,
      whalePressure: {
        score: (summary.data?.whalesTrend?.at(-1) ?? 0) - (summary.data?.whalesOutflow?.at(-1) ?? 0),
        direction: (summary.data?.whalesTrend?.at(-1) ?? 0) > (summary.data?.whalesOutflow?.at(-1) ?? 0) ? 'inflow' : 'outflow',
        deltaVsPrev: summary.data?.pressureDelta || 0
      },
      marketRisk: {
        score: summary.data?.riskIndex || Math.min(100, Math.max(0, (whaleTransactions.length * 5) + 20)), // Calculate risk from whale activity
        deltaVsPrev: summary.data?.riskDelta || (whaleTransactions.length > 0 ? 5 : -2) // Risk increases with whale activity
      }
    };
  } catch (error) {
    console.error('Failed to fetch summary KPIs:', error);
    throw error;
  }
}

// Enhanced API functions for world-class crypto intelligence hub
export async function fetchEnhancedSummary(window: TimeWindow): Promise<EnhancedResponse> {
  try {
    const [whaleAlerts, summary] = await Promise.all([
      supabase.functions.invoke('whale-alerts', { 
        headers: { 'Content-Type': 'application/json' }
      }),
      supabase.functions.invoke('market-summary-enhanced', { 
        headers: { 'Content-Type': 'application/json' }
      }),
    ]);

    if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);
    if (summary.error) throw new Error(summary.error.message);

    const whaleTransactions = whaleAlerts.data?.transactions || [];
    const inflow = summary.data?.whalesTrend?.at(-1) ?? 0;
    const outflow = summary.data?.whalesOutflow?.at(-1) ?? 0;
    const net = inflow - outflow;

    // Calculate percentiles (simplified - in real implementation, this would use historical data)
    const inflowPercentile = Math.min(100, Math.max(0, (inflow / 10000000) * 100));
    const riskPercentile = Math.min(100, Math.max(0, (whaleTransactions.length / 50) * 100));

    // Extract top venues from whale transactions
    const venueMap = new Map<string, { inflow: number; outflow: number }>();
    whaleTransactions.forEach((tx: unknown) => {
      const fromVenue = tx.from?.owner_type || 'Unknown';
      const toVenue = tx.to?.owner_type || 'Unknown';
      
      if (fromVenue !== 'Unknown') {
        venueMap.set(fromVenue, {
          inflow: (venueMap.get(fromVenue)?.inflow || 0) + tx.amount_usd,
          outflow: (venueMap.get(fromVenue)?.outflow || 0)
        });
      }
      if (toVenue !== 'Unknown') {
        venueMap.set(toVenue, {
          inflow: (venueMap.get(toVenue)?.inflow || 0),
          outflow: (venueMap.get(toVenue)?.outflow || 0) + tx.amount_usd
        });
      }
    });

    const topVenues = Array.from(venueMap.entries())
      .map(([venue, data]) => ({ venue, ...data }))
      .sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow))
      .slice(0, 5);

    return {
      asOf: new Date().toISOString(),
      provenance: 'real',
      metrics: {
        sentiment: whaleTransactions.length > 0 ? 65 : 50,
        risk: summary.data?.riskIndex || Math.min(100, Math.max(0, (whaleTransactions.length * 5) + 20)),
        pressure: {
          inflow,
          outflow,
          net,
          unit: 'usd'
        }
      },
      percentile: {
        inflow: inflowPercentile,
        risk: riskPercentile
      },
      topVenues
    };
  } catch (error) {
    console.error('Failed to fetch enhanced summary:', error);
    throw error;
  }
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  try {
    // This would call the /healthz endpoint
    const response = await fetch('/api/healthz');
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch health status:', error);
    // Return degraded status if health check fails
    return {
      status: 'degraded',
      providers: {
        whaleAlerts: { status: 'degraded', latency: 0, errorRate: 10 },
        marketSummary: { status: 'degraded', latency: 0, errorRate: 10 },
        assetSentiment: { status: 'degraded', latency: 0, errorRate: 10 }
      },
      lastChecked: new Date().toISOString()
    };
  }
}

export async function fetchAIDigest(window: TimeWindow): Promise<AIDigest> {
  try {
    const whaleAlerts = await supabase.functions.invoke('whale-alerts', { 
      headers: { 'Content-Type': 'application/json' }
    });

    if (whaleAlerts.error) throw new Error(whaleAlerts.error.message);

    const transactions = whaleAlerts.data?.transactions || [];
    const totalVolume = transactions.reduce((sum: number, tx: unknown) => sum + tx.amount_usd, 0);
    const avgVolume = totalVolume / transactions.length || 0;

    // Generate AI narrative based on whale activity
    const narrative = transactions.length > 0 
      ? `Whale activity is ${transactions.length > 10 ? 'high' : 'moderate'} with ${transactions.length} transactions totaling $${(totalVolume / 1000000).toFixed(1)}M. ${transactions.length > 10 ? 'This suggests significant market movement.' : 'Market remains relatively calm.'}`
      : 'No significant whale activity detected in the current window.';

    return {
      narrative,
      percentile: {
        inflow: Math.min(100, Math.max(0, (transactions.length / 20) * 100)),
        risk: Math.min(100, Math.max(0, (transactions.length / 10) * 100))
      },
      venues: [], // Would be populated from venue analysis
      evidenceTx: transactions.slice(0, 5), // Top 5 transactions as evidence
      cta: {
        watchAll: 'Watch all entities',
        createAlert: 'Create alert',
        showTransactions: 'Show transactions'
      }
    };
  } catch (error) {
    console.error('Failed to fetch AI digest:', error);
    throw error;
  }
}

export async function fetchAlertKPIs(): Promise<AlertKPI> {
  try {
    // This would call the alerts endpoint to get KPI data
    const { data, error } = await supabase.functions.invoke('alerts', {
      body: { op: 'kpis' },
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) throw new Error(error.message);

    return data || {
      total: 0,
      active: 0,
      disabled: 0,
      avgTriggerLatency: 0
    };
  } catch (error) {
    console.error('Failed to fetch alert KPIs:', error);
    // Return default values if API fails
    return {
      total: 0,
      active: 0,
      disabled: 0,
      avgTriggerLatency: 0
    };
  }
}

export async function fetchAssetSentiment(symbol: string, window: TimeWindow): Promise<AssetSentiment> {
  try {
    // Use existing whale-alerts function to get sentiment for specific asset
    const { data, error } = await supabase.functions.invoke('whale-alerts', { 
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (error) throw error;
    
    // Calculate sentiment from whale data for specific symbol
    const whaleTransactions = data?.transactions || [];
    const assetTransactions = whaleTransactions.filter((tx: unknown) => 
      tx.symbol?.toLowerCase() === symbol.toLowerCase()
    );
    
    // Calculate sentiment based on whale activity
    const sentiment = assetTransactions.length > 0 ? 
      Math.min(100, Math.max(0, 50 + (assetTransactions.length * 10))) : 50;
    
    return {
      symbol,
      window,
      sentiment,
      label: sentiment >= 60 ? 'Positive' : sentiment >= 40 ? 'Neutral' : 'Negative',
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch asset sentiment:', error);
    throw error;
  }
}

// watchlist
export async function listWatchlist(): Promise<WatchItem[]> {
  try {
    // Try Edge Function first
    const { data, error } = await supabase.functions.invoke('watchlist', { 
      body: { op: 'list' },
      headers: { 'Content-Type': 'application/json' }
    });
    if (error) throw error;
    return data as WatchItem[];
  } catch (error) {
    // Fallback to localStorage if Edge Function doesn't exist
    console.warn('watchlist Edge Function not available, using localStorage');
    const stored = localStorage.getItem('hub2-watchlist');
    return stored ? JSON.parse(stored) : [];
  }
}

export async function addToWatchlist(entityType: WatchEntityType, entityId: string, label?: string) {
  try {
    // Try Edge Function first
    const { data, error } = await supabase.functions.invoke('watchlist', {
      body: { op: 'add', entityType, entityId, label },
      headers: { 'Content-Type': 'application/json' }
    });
    if (error) throw error;
    return data as WatchItem;
  } catch (error) {
    // Fallback to localStorage if Edge Function doesn't exist
    console.warn('watchlist Edge Function not available, using localStorage');
    const newItem: WatchItem = {
      id: `local-${Date.now()}`,
      entityType,
      entityId,
      label,
      createdAt: new Date().toISOString()
    };
    
    // Get existing items and add new one
    const existing = await listWatchlist();
    const updated = [...existing, newItem];
    localStorage.setItem('hub2-watchlist', JSON.stringify(updated));
    
    return newItem;
  }
}

export async function removeFromWatchlist(id: string) {
  try {
    // Try Edge Function first
    const { data, error } = await supabase.functions.invoke('watchlist', { 
      body: { op: 'remove', id },
      headers: { 'Content-Type': 'application/json' }
    });
    if (error) throw error;
    return data as { ok: true };
  } catch (error) {
    // Fallback to localStorage if Edge Function doesn't exist
    console.warn('watchlist Edge Function not available, using localStorage');
    const existing = await listWatchlist();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem('hub2-watchlist', JSON.stringify(updated));
    return { ok: true };
  }
}
