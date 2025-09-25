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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, alertConfig } = await req.json();

    switch (action) {
      case 'create':
        return await createWatchlistAlert(supabase, user.id, alertConfig);
      case 'list':
        return await listWatchlistAlerts(supabase, user.id);
      case 'update':
        return await updateWatchlistAlert(supabase, user.id, alertConfig);
      case 'delete':
        return await deleteWatchlistAlert(supabase, user.id, alertConfig.id);
      case 'check':
        return await checkWatchlistAlerts(supabase, user.id);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Watchlist alerts error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createWatchlistAlert(supabase: any, userId: string, config: any) {
  // Validate alert configuration
  const validatedConfig = validateAlertConfig(config);
  if (!validatedConfig.valid) {
    return new Response(
      JSON.stringify({ error: validatedConfig.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create alert configuration
  const { data: alertConfig, error } = await supabase
    .from('alert_config')
    .insert({
      user_id: userId,
      trigger_type: config.triggerType,
      threshold: config.threshold,
      conditions: {
        entityType: config.entityType,
        entityId: config.entityId,
        operator: config.operator,
        value: config.value,
        timeWindow: config.timeWindow || '24h'
      },
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, alertConfig }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listWatchlistAlerts(supabase: any, userId: string) {
  const { data: alerts, error } = await supabase
    .from('alert_config')
    .select(`
      id,
      trigger_type,
      threshold,
      conditions,
      is_active,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch alerts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ alerts: alerts || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateWatchlistAlert(supabase: any, userId: string, config: any) {
  const { data: alert, error } = await supabase
    .from('alert_config')
    .update({
      threshold: config.threshold,
      conditions: config.conditions,
      is_active: config.isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, alert }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteWatchlistAlert(supabase: any, userId: string, alertId: string) {
  const { error } = await supabase
    .from('alert_config')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete alert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkWatchlistAlerts(supabase: any, userId: string) {
  // Get user's active alerts
  const { data: alerts } = await supabase
    .from('alert_config')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!alerts?.length) {
    return new Response(
      JSON.stringify({ triggeredAlerts: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const triggeredAlerts = [];

  for (const alert of alerts) {
    const isTriggered = await evaluateAlert(supabase, alert);
    if (isTriggered) {
      triggeredAlerts.push({
        alertId: alert.id,
        triggerType: alert.trigger_type,
        conditions: alert.conditions,
        threshold: alert.threshold,
        triggeredAt: new Date().toISOString()
      });

      // Create alert event
      await supabase
        .from('alert_events')
        .insert({
          user_id: userId,
          alert_config_id: alert.id,
          trigger_data: {
            entityType: alert.conditions.entityType,
            entityId: alert.conditions.entityId,
            actualValue: isTriggered.actualValue,
            threshold: alert.threshold,
            operator: alert.conditions.operator
          },
          created_at: new Date().toISOString()
        });
    }
  }

  return new Response(
    JSON.stringify({ 
      triggeredAlerts,
      checkedCount: alerts.length,
      triggeredCount: triggeredAlerts.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function evaluateAlert(supabase: any, alert: any) {
  const { conditions, threshold } = alert;
  const { entityType, entityId, operator, timeWindow } = conditions;

  let actualValue = 0;

  try {
    switch (entityType) {
      case 'chain':
        actualValue = await getChainRiskValue(supabase, entityId);
        break;
      case 'cluster':
        actualValue = await getClusterNetFlow(supabase, entityId, timeWindow);
        break;
      case 'address':
        actualValue = await getAddressBalance(supabase, entityId);
        break;
      default:
        return false;
    }

    // Evaluate condition
    switch (operator) {
      case 'greater_than':
        return actualValue > threshold ? { actualValue } : false;
      case 'less_than':
        return actualValue < threshold ? { actualValue } : false;
      case 'equals':
        return actualValue === threshold ? { actualValue } : false;
      case 'change_percent':
        const previousValue = await getPreviousValue(supabase, entityType, entityId, timeWindow);
        const changePercent = previousValue ? ((actualValue - previousValue) / previousValue) * 100 : 0;
        return Math.abs(changePercent) > threshold ? { actualValue: changePercent } : false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Alert evaluation error:', error);
    return false;
  }
}

async function getChainRiskValue(supabase: any, chain: string) {
  const { data } = await supabase
    .from('chain_risk_normalized')
    .select('risk_score')
    .eq('chain', chain)
    .eq('snapshot_date', new Date().toISOString().split('T')[0])
    .single();

  return data?.risk_score || 0;
}

async function getClusterNetFlow(supabase: any, clusterId: string, timeWindow: string) {
  const { data } = await supabase
    .from('whale_clusters_enhanced')
    .select('net_flow_24h')
    .eq('id', clusterId)
    .single();

  return Math.abs(data?.net_flow_24h || 0);
}

async function getAddressBalance(supabase: any, address: string) {
  const { data } = await supabase
    .from('whale_balances')
    .select('balance_usd')
    .eq('wallet_address', address)
    .single();

  return data?.balance_usd || 0;
}

async function getPreviousValue(supabase: any, entityType: string, entityId: string, timeWindow: string) {
  const hoursBack = timeWindow === '24h' ? 48 : 168; // Get previous period
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  switch (entityType) {
    case 'chain':
      const { data: chainData } = await supabase
        .from('chain_risk_history')
        .select('risk_score')
        .eq('chain', entityId)
        .gte('snapshot_date', since)
        .order('snapshot_date', { ascending: true })
        .limit(1);
      return chainData?.[0]?.risk_score || 0;

    case 'cluster':
      // For clusters, we'd need historical data - simplified for now
      return 0;

    case 'address':
      // For addresses, we'd need historical balance data - simplified for now
      return 0;

    default:
      return 0;
  }
}

function validateAlertConfig(config: any) {
  if (!config.triggerType) {
    return { valid: false, error: 'Trigger type is required' };
  }

  if (!config.entityType || !config.entityId) {
    return { valid: false, error: 'Entity type and ID are required' };
  }

  if (typeof config.threshold !== 'number') {
    return { valid: false, error: 'Threshold must be a number' };
  }

  if (!config.operator) {
    return { valid: false, error: 'Operator is required' };
  }

  const validOperators = ['greater_than', 'less_than', 'equals', 'change_percent'];
  if (!validOperators.includes(config.operator)) {
    return { valid: false, error: 'Invalid operator' };
  }

  return { valid: true };
}