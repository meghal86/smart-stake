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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get recent alerts data
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('alerts')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (alertsError) throw alertsError;

    let syncedCount = 0;

    for (const alert of alerts || []) {
      // Convert alert to whale_transfer format
      const transfer = {
        from_address: alert.from_address || 'unknown',
        to_address: alert.to_address || 'unknown', 
        amount_usd: alert.amount_usd || 0,
        token: alert.token || 'UNKNOWN',
        chain: alert.chain || 'ETH',
        timestamp: alert.created_at,
        from_entity: extractEntity(alert.from_address),
        to_entity: extractEntity(alert.to_address),
        tags: extractTags(alert),
        counterparty_type: extractCounterpartyType(alert)
      };

      // Insert into whale_transfers
      const { error: insertError } = await supabaseClient
        .from('whale_transfers')
        .insert(transfer);

      if (!insertError) {
        syncedCount++;
        
        // Update whale_balances and whale_signals
        await updateWhaleMetadata(supabaseClient, alert);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount,
        message: `Synced ${syncedCount} whale transactions from alerts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractEntity(address: string): string | null {
  if (!address) return null;
  
  // Simple entity detection based on known patterns
  const entities = {
    'binance': ['1a1ec25dc08e98e5e93f1104b5e5cd870f42fda6', '28c6c06298d514db089934071355e5743bf21d60'],
    'coinbase': ['71660c4005ba85c37ccec55d0c4493e66fe775d3', 'a9d1e08c7793af67e9d92fe308d5697fb81d3e43'],
    'okx': ['98ec059dc3adfbdd63429454aeb0c990fdf4949c', '6cc5f688a315f3dc28a7781717a9a798a59fda7b']
  };
  
  for (const [entity, addresses] of Object.entries(entities)) {
    if (addresses.some(addr => address.toLowerCase().includes(addr))) {
      return entity;
    }
  }
  
  return null;
}

function extractTags(alert: any): string[] {
  const tags = [];
  
  if (alert.description?.toLowerCase().includes('swap')) tags.push('swap');
  if (alert.description?.toLowerCase().includes('lend')) tags.push('lend');
  if (alert.description?.toLowerCase().includes('stake')) tags.push('stake');
  if (alert.description?.toLowerCase().includes('bridge')) tags.push('bridge');
  if (alert.description?.toLowerCase().includes('defi')) tags.push('defi');
  
  return tags;
}

function extractCounterpartyType(alert: any): string | null {
  if (alert.description?.toLowerCase().includes('uniswap')) return 'amm';
  if (alert.description?.toLowerCase().includes('aave')) return 'lending';
  if (alert.description?.toLowerCase().includes('compound')) return 'lending';
  return null;
}

async function updateWhaleMetadata(supabaseClient: any, alert: any) {
  // Update whale_balances
  if (alert.from_address) {
    await supabaseClient
      .from('whale_balances')
      .upsert({
        address: alert.from_address,
        chain: alert.chain || 'ETH',
        balance_usd: alert.amount_usd || 0,
        dormant_days: 0,
        last_activity_ts: alert.created_at
      }, { onConflict: 'address,chain' });
  }

  // Update whale_signals
  if (alert.from_address) {
    await supabaseClient
      .from('whale_signals')
      .upsert({
        address: alert.from_address,
        chain: alert.chain || 'ETH',
        risk_score: Math.min(100, (alert.amount_usd || 0) / 10000),
        reason_codes: ['large_transfer'],
        net_flow_24h: -(alert.amount_usd || 0),
        to_cex_ratio: extractEntity(alert.to_address) ? 1.0 : 0.0,
        unique_recipients_24h: 1
      }, { onConflict: 'address,chain' });
  }
}