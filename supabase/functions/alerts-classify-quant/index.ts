import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CEX_ENTITIES = new Set(['binance', 'okx', 'coinbase', 'kraken', 'bybit', 'kucoin']);
const DEFI_TAGS = new Set(['swap', 'lend', 'stake', 'bridge', 'yield', 'liquidity', 'perps']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transactions, window = '24h' } = await req.json();

    if (!transactions?.length) {
      return new Response(
        JSON.stringify({ error: 'No transactions provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get classification rules
    const { data: rules } = await supabase
      .from('alert_classification_rules')
      .select('*')
      .order('priority', { ascending: true });

    const classifiedAlerts = [];
    
    for (const tx of transactions) {
      const classification = await classifyTransaction(tx, rules || [], supabase);
      if (classification) {
        classifiedAlerts.push({
          ...tx,
          ...classification,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Group into clusters
    const clusters = groupIntoClusters(classifiedAlerts);
    
    // Update database with new clusters
    await updateClustersInDatabase(supabase, clusters);

    return new Response(
      JSON.stringify({
        classifiedAlerts,
        clusters,
        processedCount: transactions.length,
        classifiedCount: classifiedAlerts.length,
        keepRate: Math.round((classifiedAlerts.length / transactions.length) * 100)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Alert classification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function classifyTransaction(tx: any, rules: any[], supabase: any) {
  // Skip if below minimum threshold
  if (tx.amount_usd < 50000) return null;

  // Check each rule in priority order
  for (const rule of rules) {
    const conditions = rule.conditions;
    let matches = true;

    // Rule 1: Dormant Waking
    if (rule.cluster_type === 'DORMANT_WAKING') {
      const isDormantWake = await checkDormantWallet(tx.from_address, supabase);
      matches = tx.amount_usd >= conditions.min_amount_usd && isDormantWake;
    }
    
    // Rule 2: CEX Inflow
    else if (rule.cluster_type === 'CEX_INFLOW') {
      const toCex = tx.to_entity && CEX_ENTITIES.has(tx.to_entity.toLowerCase());
      matches = tx.amount_usd >= conditions.min_amount_usd && toCex;
    }
    
    // Rule 3: DeFi Activity
    else if (rule.cluster_type === 'DEFI_ACTIVITY') {
      const hasDefiTags = tx.tags?.some((tag: string) => DEFI_TAGS.has(tag.toLowerCase()));
      matches = tx.amount_usd >= conditions.min_amount_usd && hasDefiTags;
    }
    
    // Rule 4: Distribution
    else if (rule.cluster_type === 'DISTRIBUTION') {
      const isDistribution = !tx.to_entity && await checkDistributionPattern(tx, supabase);
      matches = tx.amount_usd >= conditions.min_amount_usd && isDistribution;
    }
    
    // Rule 5: Accumulation (default)
    else if (rule.cluster_type === 'ACCUMULATION') {
      matches = tx.amount_usd >= conditions.min_amount_usd;
    }

    if (matches) {
      return {
        cluster: rule.cluster_type,
        severity: rule.severity,
        confidence: rule.confidence_score,
        reasons: [`${rule.rule_name}: $${tx.amount_usd.toLocaleString()}`],
        thread_key: generateThreadKey(tx, rule.cluster_type)
      };
    }
  }

  return null;
}

async function checkDormantWallet(address: string, supabase: any): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('whale_transfers')
      .select('timestamp')
      .eq('from_address', address)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);
    
    return !data?.length; // No activity in 30 days = dormant
  } catch {
    return false;
  }
}

async function checkDistributionPattern(tx: any, supabase: any): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('whale_transfers')
      .select('to_address')
      .eq('from_address', tx.from_address)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const uniqueRecipients = new Set(data?.map(t => t.to_address)).size;
    return uniqueRecipients >= 5; // Distribution to 5+ addresses
  } catch {
    return false;
  }
}

function generateThreadKey(tx: any, clusterType: string): string {
  const bucket15m = Math.floor(new Date(tx.timestamp).getTime() / (15 * 60 * 1000));
  const entity = tx.from_entity || tx.to_entity || 'unknown';
  const direction = tx.to_entity ? 'out' : 'in';
  
  return `${clusterType}:${tx.token}:${direction}:${bucket15m}:${entity}`;
}

function groupIntoClusters(classifiedAlerts: any[]) {
  const clusterGroups = new Map();

  for (const alert of classifiedAlerts) {
    const key = alert.cluster;
    
    if (!clusterGroups.has(key)) {
      clusterGroups.set(key, {
        id: `cluster_${key.toLowerCase()}`,
        type: alert.cluster,
        name: formatClusterName(alert.cluster),
        members_count: 0,
        sum_balance_usd: 0,
        net_flow_24h: 0,
        risk_score: 0,
        confidence: 0,
        classification_reasons: [],
        alerts: []
      });
    }

    const cluster = clusterGroups.get(key);
    cluster.alerts.push(alert);
    cluster.sum_balance_usd += alert.amount_usd;
    cluster.confidence = Math.max(cluster.confidence, alert.confidence);
    cluster.classification_reasons = [...new Set([...cluster.classification_reasons, ...alert.reasons])];
    
    // Calculate net flow (positive for accumulation, negative for outflow)
    cluster.net_flow_24h += alert.cluster === 'ACCUMULATION' ? alert.amount_usd : -alert.amount_usd;
    
    // Count unique addresses
    const addresses = new Set([
      ...cluster.alerts.map((a: any) => a.from_address),
      ...cluster.alerts.map((a: any) => a.to_address)
    ]);
    cluster.members_count = addresses.size;
  }

  // Calculate risk scores
  for (const cluster of clusterGroups.values()) {
    cluster.risk_score = Math.min(100, Math.max(0, 
      cluster.confidence * 100 + (cluster.alerts.length > 10 ? 20 : 0)
    ));
  }

  return Array.from(clusterGroups.values())
    .sort((a, b) => b.sum_balance_usd - a.sum_balance_usd);
}

async function updateClustersInDatabase(supabase: any, clusters: any[]) {
  for (const cluster of clusters) {
    await supabase
      .from('whale_clusters_enhanced')
      .upsert({
        id: cluster.id,
        cluster_type: cluster.type,
        chain: 'ETH', // Default chain
        name: cluster.name,
        members_count: cluster.members_count,
        sum_balance_usd: cluster.sum_balance_usd,
        net_flow_24h: cluster.net_flow_24h,
        risk_score: cluster.risk_score,
        confidence: cluster.confidence,
        classification_reasons: cluster.classification_reasons,
        updated_at: new Date().toISOString()
      });
  }
}

function formatClusterName(clusterType: string): string {
  switch (clusterType) {
    case 'DORMANT_WAKING': return 'Dormant Wallets Awakening';
    case 'CEX_INFLOW': return 'Exchange Inflows';
    case 'DEFI_ACTIVITY': return 'DeFi Interactions';
    case 'DISTRIBUTION': return 'Token Distribution';
    case 'ACCUMULATION': return 'Accumulation Pattern';
    default: return clusterType.replace('_', ' ');
  }
}