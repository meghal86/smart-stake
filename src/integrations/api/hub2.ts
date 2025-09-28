import { supabase } from '@/integrations/supabase/client';
import { SummaryKpis, AssetSentiment, TimeWindow, WatchItem, WatchEntityType } from '@/types/hub2';

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

export async function fetchAssetSentiment(symbol: string, window: TimeWindow): Promise<AssetSentiment> {
  try {
    // Use existing whale-alerts function to get sentiment for specific asset
    const { data, error } = await supabase.functions.invoke('whale-alerts', { 
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (error) throw error;
    
    // Calculate sentiment from whale data for specific symbol
    const whaleTransactions = data?.transactions || [];
    const assetTransactions = whaleTransactions.filter((tx: any) => 
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
