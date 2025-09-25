import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is Pro tier
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.plan_type !== 'pro') {
      return new Response(
        JSON.stringify({ error: 'Pro subscription required for CSV exports' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { exportType, window = '24h', filters = {} } = await req.json();

    let csvData = '';
    let filename = '';

    switch (exportType) {
      case 'chain_risk':
        ({ csvData, filename } = await exportChainRisk(supabase, window));
        break;
      case 'whale_clusters':
        ({ csvData, filename } = await exportWhaleClusters(supabase, window, filters));
        break;
      case 'alerts':
        ({ csvData, filename } = await exportAlerts(supabase, window, filters));
        break;
      case 'correlation_analysis':
        ({ csvData, filename } = await exportCorrelationAnalysis(supabase, window));
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid export type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function exportChainRisk(supabase: any, window: string) {
  const { data: chainRiskData } = await supabase
    .from('chain_risk_normalized')
    .select(`
      chain,
      risk_score,
      concentration_risk,
      flow_risk,
      activity_risk,
      reason,
      whale_count,
      tx_count,
      volume_24h,
      snapshot_date
    `)
    .gte('snapshot_date', new Date(Date.now() - (window === '30d' ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString())
    .order('snapshot_date', { ascending: false });

  const headers = [
    'Chain',
    'Date',
    'Risk Score (0-100)',
    'Concentration Risk',
    'Flow Risk', 
    'Activity Risk',
    'Whale Count',
    'Transaction Count',
    'Volume 24h USD',
    'Status'
  ];

  const rows = chainRiskData?.map(row => [
    row.chain,
    row.snapshot_date,
    row.risk_score || 'N/A',
    row.concentration_risk || 'N/A',
    row.flow_risk || 'N/A',
    row.activity_risk || 'N/A',
    row.whale_count,
    row.tx_count,
    row.volume_24h,
    row.reason || 'Normal'
  ]) || [];

  const csvData = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csvData,
    filename: `chain_risk_${window}_${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportWhaleClusters(supabase: any, window: string, filters: any) {
  const { data: clustersData } = await supabase
    .from('whale_clusters_enhanced')
    .select('*')
    .gte('updated_at', new Date(Date.now() - (window === '24h' ? 24 : 168) * 60 * 60 * 1000).toISOString())
    .order('sum_balance_usd', { ascending: false });

  const headers = [
    'Cluster ID',
    'Type',
    'Name',
    'Chain',
    'Members Count',
    'Total Balance USD',
    'Net Flow 24h USD',
    'Risk Score',
    'Confidence',
    'Classification Reasons',
    'Last Updated'
  ];

  const rows = clustersData?.map(row => [
    row.id,
    row.cluster_type,
    row.name,
    row.chain,
    row.members_count,
    row.sum_balance_usd,
    row.net_flow_24h,
    row.risk_score,
    row.confidence,
    row.classification_reasons?.join('; ') || '',
    row.updated_at
  ]) || [];

  const csvData = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csvData,
    filename: `whale_clusters_${window}_${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportAlerts(supabase: any, window: string, filters: any) {
  const windowHours = window === '24h' ? 24 : window === '7d' ? 168 : 720;
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('alert_events')
    .select(`
      id,
      created_at,
      trigger_data,
      alert_config!inner(trigger_type, threshold)
    `)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (filters.severity && filters.severity !== 'All') {
    query = query.eq('trigger_data->>severity', filters.severity);
  }

  if (filters.chain && filters.chain !== 'All') {
    query = query.eq('trigger_data->>chain', filters.chain);
  }

  const { data: alertsData } = await query.limit(1000);

  const headers = [
    'Alert ID',
    'Timestamp',
    'Chain',
    'Token',
    'Amount USD',
    'From Address',
    'To Address',
    'Severity',
    'Trigger Type',
    'Description'
  ];

  const rows = alertsData?.map(row => [
    row.id,
    row.created_at,
    row.trigger_data?.chain || 'Unknown',
    row.trigger_data?.token || 'Unknown',
    row.trigger_data?.amount_usd || 0,
    row.trigger_data?.from_address || 'Unknown',
    row.trigger_data?.to_address || 'Unknown',
    row.trigger_data?.severity || 'Medium',
    row.alert_config?.trigger_type || 'Unknown',
    row.trigger_data?.description || ''
  ]) || [];

  const csvData = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csvData,
    filename: `alerts_${window}_${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportCorrelationAnalysis(supabase: any, window: string) {
  const hoursBack = window === '24h' ? 24 : window === '7d' ? 168 : 720;
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  const { data: correlationData } = await supabase
    .from('cluster_chain_correlation_hourly')
    .select('*')
    .gte('hour', since)
    .order('hour', { ascending: false });

  const headers = [
    'Chain',
    'Cluster Type',
    'Hour',
    'Chain Flow USD',
    'Transaction Count',
    'Average Transaction Size USD'
  ];

  const rows = correlationData?.map(row => [
    row.chain,
    row.cluster_type,
    row.hour,
    row.chain_flow,
    row.tx_count,
    row.avg_tx_size
  ]) || [];

  const csvData = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csvData,
    filename: `correlation_analysis_${window}_${new Date().toISOString().split('T')[0]}.csv`
  };
}