import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertData {
  id: string;
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  token: string;
  chain: string;
  tx_hash: string;
  detected_at: string;
  whale_tags?: string[];
  direction?: string;
}

interface AlertCondition {
  type: 'amount' | 'chain' | 'token' | 'whale_tag' | 'direction' | 'time_window';
  operator: string;
  value: any;
  currency?: string;
  unit?: string;
}

interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  conditions: AlertCondition[];
  logic_operator: 'AND' | 'OR' | 'NOR';
  time_window_hours?: number;
  frequency_limit?: number;
  delivery_channels: any;
  webhook_url?: string;
  priority: number;
  times_triggered: number;
  last_triggered_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { alert }: { alert: AlertData } = await req.json()

    // Get all active alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) throw rulesError

    const matchedRules: { rule: AlertRule; matchedConditions: any }[] = []

    // Evaluate each rule against the alert data
    for (const rule of rules) {
      const conditionResults = rule.conditions.map((condition: AlertCondition) => 
        evaluateCondition(condition, alert)
      )

      let ruleMatches = false
      if (rule.logic_operator === 'AND') {
        ruleMatches = conditionResults.every(result => result)
      } else if (rule.logic_operator === 'OR') {
        ruleMatches = conditionResults.some(result => result)
      } else if (rule.logic_operator === 'NOR') {
        ruleMatches = !conditionResults.some(result => result)
      }

      // Check frequency limits
      if (ruleMatches && rule.frequency_limit) {
        const now = new Date()
        const windowStart = new Date(now.getTime() - (rule.time_window_hours || 24) * 60 * 60 * 1000)
        
        if (rule.last_triggered_at) {
          const lastTriggered = new Date(rule.last_triggered_at)
          if (lastTriggered > windowStart && rule.times_triggered >= rule.frequency_limit) {
            ruleMatches = false // Skip due to frequency limit
          }
        }
      }

      if (ruleMatches) {
        matchedRules.push({
          rule,
          matchedConditions: rule.conditions.filter((_, index) => conditionResults[index])
        })
      }
    }

    // Process matched rules
    for (const { rule, matchedConditions } of matchedRules) {
      // Update rule statistics
      await supabase
        .from('alert_rules')
        .update({
          times_triggered: rule.times_triggered + 1,
          last_triggered_at: new Date().toISOString()
        })
        .eq('id', rule.id)

      // Record in history
      await supabase
        .from('alert_rule_history')
        .insert({
          alert_rule_id: rule.id,
          user_id: rule.user_id,
          alert_id: alert.id,
          matched_conditions: matchedConditions,
          delivery_status: {},
          triggered_at: new Date().toISOString()
        })

      // Send notifications
      await sendNotifications(rule, alert, matchedConditions)
    }

    return new Response(
      JSON.stringify({ 
        processed: true, 
        matchedRules: matchedRules.length,
        rules: matchedRules.map(m => ({ id: m.rule.id, name: m.rule.name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Alert processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function evaluateCondition(condition: AlertCondition, alert: AlertData): boolean {
  switch (condition.type) {
    case 'amount':
      const amount = condition.currency === 'USD' ? alert.amount_usd : alert.amount_usd // Simplified
      switch (condition.operator) {
        case 'gte': return amount >= condition.value
        case 'lte': return amount <= condition.value
        case 'eq': return amount === condition.value
        default: return false
      }

    case 'chain':
      switch (condition.operator) {
        case 'eq': return alert.chain === condition.value
        case 'in': return Array.isArray(condition.value) && condition.value.includes(alert.chain)
        case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(alert.chain)
        default: return false
      }

    case 'token':
      switch (condition.operator) {
        case 'eq': return alert.token === condition.value
        case 'in': return Array.isArray(condition.value) && condition.value.includes(alert.token)
        case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(alert.token)
        default: return false
      }

    case 'whale_tag':
      const isWhale = alert.whale_tags && alert.whale_tags.length > 0
      return condition.operator === 'is_whale' ? isWhale : !isWhale

    case 'direction':
      return alert.direction === condition.value

    default:
      return false
  }
}

async function sendNotifications(rule: AlertRule, alert: AlertData, matchedConditions: any[]) {
  const deliveryStatus: any = {}

  // Send webhook notification
  if (rule.delivery_channels.webhook && rule.webhook_url) {
    try {
      const webhookPayload = {
        rule: {
          id: rule.id,
          name: rule.name
        },
        alert: {
          from_addr: alert.from_addr,
          to_addr: alert.to_addr,
          amount_usd: alert.amount_usd,
          token: alert.token,
          chain: alert.chain,
          tx_hash: alert.tx_hash
        },
        matchedConditions,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(rule.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhalePlus-Alert-System/1.0'
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      deliveryStatus.webhook = {
        success: response.ok,
        status: response.status,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      deliveryStatus.webhook = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Additional notification channels would be implemented here
  // (push notifications, email, SMS)

  return deliveryStatus
}