import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketSummaryResponse {
  marketMoodIndex: number;
  volume24h: number;
  volumeDelta: number;
  activeWhales: number;
  whalesDelta: number;
  riskIndex: number;
  topAlerts: any[];
  refreshedAt: string;
}

interface WhaleCluster {
  id: string;
  type: string;
  name: string;
  membersCount: number;
  sumBalanceUsd: number;
  riskScore: number;
  stats: any;
  members?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'summary':
        return await handleMarketSummary(supabaseClient);
      
      case 'clusters':
        return await handleWhaleClusters(supabaseClient, req);
      
      case 'alerts':
        return await handleAlertsStream(supabaseClient, req);
      
      case 'rank-alert':
        return await handleAlertRanking(supabaseClient, req);
      
      case 'export':
        return await handleExport(supabaseClient, req);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Market Intelligence Hub error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleMarketSummary(supabaseClient: any): Promise<Response> {
  try {
    // Get market data from various sources
    const [volumeData, whaleData, alertData] = await Promise.all([
      getVolumeData(supabaseClient),
      getWhaleData(supabaseClient),
      getAlertData(supabaseClient)
    ]);

    // Calculate market mood index
    const marketMoodIndex = calculateMarketMood(volumeData, whaleData, alertData);

    const summary: MarketSummaryResponse = {
      marketMoodIndex,
      volume24h: volumeData.volume24h || 1500000000,
      volumeDelta: volumeData.delta || 12.5,
      activeWhales: whaleData.activeCount || 892,
      whalesDelta: whaleData.delta || 8.2,
      riskIndex: alertData.avgRiskScore || 45,
      topAlerts: alertData.highPriorityAlerts || [],
      refreshedAt: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Market summary error: ${error.message}`);
  }
}

async function handleWhaleClusters(supabaseClient: any, req: Request): Promise<Response> {
  try {
    const { chain, window } = await req.json().catch(() => ({}));
    
    // Query whale clusters from database
    let query = supabaseClient
      .from('whale_clusters')
      .select(`
        id,
        cluster_type,
        name,
        members_count,
        sum_balance_usd,
        risk_score,
        stats,
        created_at,
        updated_at
      `)
      .order('sum_balance_usd', { ascending: false });

    if (chain && chain !== 'all') {
      query = query.eq('chain', chain);
    }

    const { data: clusters, error } = await query;
    if (error) throw error;

    // Transform data
    const transformedClusters: WhaleCluster[] = clusters?.map(cluster => ({
      id: cluster.id,
      type: cluster.cluster_type,
      name: cluster.name,
      membersCount: cluster.members_count,
      sumBalanceUsd: cluster.sum_balance_usd,
      riskScore: cluster.risk_score,
      stats: cluster.stats || {
        avgBalance: cluster.sum_balance_usd / cluster.members_count,
        medianBalance: cluster.sum_balance_usd / cluster.members_count * 0.8,
        totalTransactions24h: Math.floor(Math.random() * 100),
        netFlow24h: (Math.random() - 0.5) * 10000000
      }
    })) || [];

    return new Response(
      JSON.stringify(transformedClusters),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Whale clusters error: ${error.message}`);
  }
}

async function handleAlertsStream(supabaseClient: any, req: Request): Promise<Response> {
  try {
    const { filters, cursor, userId } = await req.json().catch(() => ({}));
    
    let query = supabaseClient
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

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply filters
    if (filters?.severity?.length) {
      // Filter by severity in trigger_data
      query = query.in('trigger_data->severity', filters.severity);
    }

    if (filters?.minUsd) {
      query = query.gte('trigger_data->amount', filters.minUsd);
    }

    const { data: alertEvents, error } = await query;
    if (error) throw error;

    // Transform to Alert format
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

    const response = {
      alerts,
      cursor: alerts.length > 0 ? alerts[alerts.length - 1].timestamp : null,
      hasMore: alerts.length === 50,
      totalCount: alerts.length
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Alerts stream error: ${error.message}`);
  }
}

async function handleAlertRanking(supabaseClient: any, req: Request): Promise<Response> {
  try {
    const { alertId, score, reasons } = await req.json();
    
    // Calculate severity based on score
    let severity: 'High' | 'Medium' | 'Info' = 'Info';
    if (score >= 0.85) severity = 'High';
    else if (score >= 0.55) severity = 'Medium';

    // Update alert with ranking
    const { error } = await supabaseClient
      .from('alert_events')
      .update({
        trigger_data: {
          score,
          severity,
          reasons,
          ranked_at: new Date().toISOString()
        }
      })
      .eq('id', alertId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, severity, score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Alert ranking error: ${error.message}`);
  }
}

async function handleExport(supabaseClient: any, req: Request): Promise<Response> {
  try {
    const { type, format, filters, userId } = await req.json();
    
    // Check user permissions
    const { data: userMetadata } = await supabaseClient
      .from('users_metadata')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (userMetadata?.plan === 'free') {
      return new Response(
        JSON.stringify({ error: 'Export feature requires premium subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate export data based on type
    let exportData: any[] = [];
    
    switch (type) {
      case 'alerts':
        const { data: alerts } = await supabaseClient
          .from('alert_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1000);
        exportData = alerts || [];
        break;
        
      case 'clusters':
        const { data: clusters } = await supabaseClient
          .from('whale_clusters')
          .select('*')
          .order('sum_balance_usd', { ascending: false });
        exportData = clusters || [];
        break;
        
      case 'whales':
        const { data: whales } = await supabaseClient
          .from('whale_addresses')
          .select('*')
          .order('balance_usd', { ascending: false })
          .limit(1000);
        exportData = whales || [];
        break;
    }

    // For now, return the data (in production, would generate actual CSV/PDF)
    return new Response(
      JSON.stringify({
        success: true,
        data: exportData,
        format,
        type,
        exportedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Export error: ${error.message}`);
  }
}

// Helper functions
async function getVolumeData(supabaseClient: any) {
  // Mock implementation - would fetch from price/volume APIs
  return {
    volume24h: 1500000000 + Math.random() * 500000000,
    delta: (Math.random() - 0.5) * 30
  };
}

async function getWhaleData(supabaseClient: any) {
  const { data } = await supabaseClient
    .from('whale_addresses')
    .select('id')
    .gte('last_activity_ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
  return {
    activeCount: data?.length || 892,
    delta: (Math.random() - 0.5) * 20
  };
}

async function getAlertData(supabaseClient: any) {
  const { data } = await supabaseClient
    .from('alert_events')
    .select('trigger_data')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  const highPriorityAlerts = data?.filter(alert => 
    alert.trigger_data?.severity === 'High'
  ).slice(0, 3) || [];

  const avgRiskScore = data?.reduce((sum, alert) => 
    sum + (alert.trigger_data?.score || 0), 0
  ) / (data?.length || 1) * 100;

  return {
    highPriorityAlerts,
    avgRiskScore: avgRiskScore || 45
  };
}

function calculateMarketMood(volumeData: any, whaleData: any, alertData: any): number {
  // Simple market mood calculation
  const volumeScore = volumeData.delta > 0 ? 60 : 40;
  const whaleScore = whaleData.delta > 0 ? 60 : 40;
  const riskScore = 100 - (alertData.avgRiskScore || 45);
  
  return Math.round((volumeScore + whaleScore + riskScore) / 3);
}