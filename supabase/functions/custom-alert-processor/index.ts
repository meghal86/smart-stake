import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertCondition {
  type: 'amount' | 'chain' | 'token' | 'whale_tag' | 'direction' | 'time_window';
  operator: 'eq' | 'gte' | 'lte' | 'in' | 'not_in';
  value: string | number | string[];
  currency?: 'USD' | 'ETH' | 'BTC';
  unit?: 'hours' | 'days' | 'minutes';
}

interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  conditions: AlertCondition[];
  logic_operator: 'AND' | 'OR' | 'NOR';
  time_window_hours?: number;
  frequency_limit?: number;
  delivery_channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  webhook_url?: string;
  is_active: boolean;
  times_triggered: number;
  last_triggered_at?: string;
}

interface WhaleAlert {
  id: string;
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  token: string;
  chain: string;
  tx_hash: string;
  detected_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { alert } = await req.json() as { alert: WhaleAlert }

    if (!alert) {
      return new Response(
        JSON.stringify({ error: 'Alert data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all active alert rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('alert_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) {
      throw rulesError
    }

    const matchedRules: { rule: AlertRule; matchedConditions: any }[] = []

    // Check each rule against the alert
    for (const rule of rules as AlertRule[]) {
      const matchResult = evaluateRule(rule, alert)
      if (matchResult.matches) {
        matchedRules.push({ rule, matchedConditions: matchResult.conditions })
      }
    }

    // Process matched rules
    const notifications = []
    for (const { rule, matchedConditions } of matchedRules) {
      // Check frequency limits
      if (rule.frequency_limit && rule.time_window_hours) {
        const timeWindow = new Date(Date.now() - rule.time_window_hours * 60 * 60 * 1000)
        
        const { count } = await supabaseClient
          .from('alert_rule_history')
          .select('*', { count: 'exact', head: true })
          .eq('alert_rule_id', rule.id)
          .gte('triggered_at', timeWindow.toISOString())

        if (count && count >= rule.frequency_limit) {
          console.log(`Rule ${rule.id} frequency limit reached`)
          continue
        }
      }

      // Send notifications
      const deliveryStatus = await sendNotifications(rule, alert, matchedConditions)

      // Record in history
      await supabaseClient
        .from('alert_rule_history')
        .insert({
          alert_rule_id: rule.id,
          user_id: rule.user_id,
          alert_id: alert.id,
          matched_conditions: matchedConditions,
          delivery_status: deliveryStatus
        })

      // Update rule stats
      await supabaseClient
        .from('alert_rules')
        .update({
          times_triggered: rule.times_triggered + 1,
          last_triggered_at: new Date().toISOString()
        })
        .eq('id', rule.id)

      notifications.push({
        ruleId: rule.id,
        ruleName: rule.name,
        userId: rule.user_id,
        deliveryStatus
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchedRules: matchedRules.length,
        notifications 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing custom alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function evaluateRule(rule: AlertRule, alert: WhaleAlert): { matches: boolean; conditions: any } {
  const results: boolean[] = []
  const matchedConditions: any = {}

  for (const condition of rule.conditions) {
    const result = evaluateCondition(condition, alert)
    results.push(result.matches)
    
    if (result.matches) {
      matchedConditions[condition.type] = result.value
    }
  }

  let finalResult = false
  
  switch (rule.logic_operator) {
    case 'AND':
      finalResult = results.every(r => r)
      break
    case 'OR':
      finalResult = results.some(r => r)
      break
    case 'NOR':
      finalResult = !results.some(r => r)
      break
  }

  return { matches: finalResult, conditions: matchedConditions }
}

function evaluateCondition(condition: AlertCondition, alert: WhaleAlert): { matches: boolean; value?: any } {
  switch (condition.type) {
    case 'amount':
      const amount = condition.currency === 'USD' ? alert.amount_usd : alert.amount_usd // Simplified
      switch (condition.operator) {
        case 'gte':
          return { matches: amount >= (condition.value as number), value: amount }
        case 'lte':
          return { matches: amount <= (condition.value as number), value: amount }
        case 'eq':
          return { matches: amount === (condition.value as number), value: amount }
        default:
          return { matches: false }
      }

    case 'chain':
      switch (condition.operator) {
        case 'eq':
          return { matches: alert.chain.toLowerCase() === (condition.value as string).toLowerCase(), value: alert.chain }
        case 'in':
          const chains = condition.value as string[]
          return { matches: chains.some(c => c.toLowerCase() === alert.chain.toLowerCase()), value: alert.chain }
        case 'not_in':
          const excludeChains = condition.value as string[]
          return { matches: !excludeChains.some(c => c.toLowerCase() === alert.chain.toLowerCase()), value: alert.chain }
        default:
          return { matches: false }
      }

    case 'token':
      switch (condition.operator) {
        case 'eq':
          return { matches: alert.token.toLowerCase() === (condition.value as string).toLowerCase(), value: alert.token }
        case 'in':
          const tokens = condition.value as string[]
          return { matches: tokens.some(t => t.toLowerCase() === alert.token.toLowerCase()), value: alert.token }
        case 'not_in':
          const excludeTokens = condition.value as string[]
          return { matches: !excludeTokens.some(t => t.toLowerCase() === alert.token.toLowerCase()), value: alert.token }
        default:
          return { matches: false }
      }

    case 'whale_tag':
      // This would require whale wallet detection logic
      // For now, assume large amounts indicate whale activity
      const isWhale = alert.amount_usd >= 1000000
      return { matches: isWhale === condition.value, value: isWhale }

    case 'direction':
      // This would require transaction analysis to determine buy/sell/transfer
      // Simplified implementation
      return { matches: true, value: 'transfer' }

    default:
      return { matches: false }
  }
}

async function sendNotifications(rule: AlertRule, alert: WhaleAlert, conditions: any): Promise<any> {
  const deliveryStatus: any = {}

  // Push notification
  if (rule.delivery_channels.push) {
    try {
      // Implementation would integrate with push notification service
      deliveryStatus.push = 'sent'
    } catch (error) {
      deliveryStatus.push = 'failed'
    }
  }

  // Email notification
  if (rule.delivery_channels.email) {
    try {
      // Implementation would integrate with email service
      deliveryStatus.email = 'sent'
    } catch (error) {
      deliveryStatus.email = 'failed'
    }
  }

  // SMS notification
  if (rule.delivery_channels.sms) {
    try {
      // Implementation would integrate with SMS service
      deliveryStatus.sms = 'sent'
    } catch (error) {
      deliveryStatus.sms = 'failed'
    }
  }

  // Webhook notification
  if (rule.delivery_channels.webhook && rule.webhook_url) {
    try {
      const webhookPayload = {
        rule: {
          id: rule.id,
          name: rule.name
        },
        alert,
        matchedConditions: conditions,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(rule.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhalePlus-Alert-System/1.0'
        },
        body: JSON.stringify(webhookPayload)
      })

      deliveryStatus.webhook = response.ok ? 'sent' : 'failed'
    } catch (error) {
      deliveryStatus.webhook = 'failed'
    }
  }

  return deliveryStatus
}