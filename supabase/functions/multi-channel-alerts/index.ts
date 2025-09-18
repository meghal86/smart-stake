import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { alert, user_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's alert channels
    const { data: channels } = await supabase
      .from('alert_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    // Get user subscription tier
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('user_id', user_id)
      .single()

    const userTier = user?.plan || 'free'
    const deliveries = []

    for (const channel of channels || []) {
      // Check subscription tier access
      if (!canAccessChannel(userTier, channel.subscription_tier_required)) {
        if (userTier === 'free') {
          await sendSampleNotification(channel, alert)
        }
        continue
      }

      // Check rate limits
      if (await isRateLimited(supabase, channel.id)) {
        await logDelivery(supabase, channel.id, alert.id, 'rate_limited')
        continue
      }

      // Send alert based on channel type
      const delivery = await sendAlert(channel, alert)
      deliveries.push(delivery)
      
      await logDelivery(supabase, channel.id, alert.id, delivery.status, delivery.error)
    }

    return new Response(JSON.stringify({
      success: true,
      deliveries_attempted: deliveries.length,
      deliveries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function canAccessChannel(userTier: string, requiredTier: string): boolean {
  const tiers = { free: 0, premium: 1, enterprise: 2 }
  return tiers[userTier] >= tiers[requiredTier]
}

async function sendAlert(channel: any, alert: any) {
  switch (channel.channel_type) {
    case 'email':
      return await sendEmailAlert(channel, alert)
    case 'webhook':
      return await sendWebhookAlert(channel, alert)
    default:
      return { status: 'failed', error: 'Unsupported channel type' }
  }
}

async function sendEmailAlert(channel: any, alert: any) {
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
  if (!sendgridKey) {
    return { status: 'failed', error: 'SendGrid not configured' }
  }
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: channel.endpoint }],
        subject: `🐋 Whale Alert: ${alert.token} $${alert.amount_usd?.toLocaleString()}`
      }],
      from: { email: 'alerts@whaleplus.io', name: 'WhalePlus Alerts' },
      content: [{
        type: 'text/html',
        value: generateEmailTemplate(alert)
      }]
    })
  })

  return {
    status: response.ok ? 'sent' : 'failed',
    error: response.ok ? null : await response.text()
  }
}

async function sendWebhookAlert(channel: any, alert: any) {
  const response = await fetch(channel.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'whale_alert',
      data: alert,
      timestamp: new Date().toISOString()
    })
  })

  return {
    status: response.ok ? 'sent' : 'failed',
    error: response.ok ? null : `HTTP ${response.status}`
  }
}

async function sendSampleNotification(channel: any, alert: any) {
  console.log(`Sample notification for ${channel.channel_type}: Whale Alert - ${alert.token} $${alert.amount_usd}`)
}

async function isRateLimited(supabase: any, channelId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('alert_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId)
    .gte('created_at', oneHourAgo)

  return (count || 0) > 10 // Max 10 alerts per hour
}

async function logDelivery(supabase: any, channelId: string, alertId: string, status: string, error?: string) {
  await supabase.from('alert_deliveries').insert({
    alert_id: alertId,
    channel_id: channelId,
    status,
    error_message: error,
    sent_at: status === 'sent' ? new Date().toISOString() : null
  })
}

function generateEmailTemplate(alert: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">🐋 Whale Transaction Detected</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <p><strong>Amount:</strong> $${alert.amount_usd?.toLocaleString()}</p>
        <p><strong>Token:</strong> ${alert.token}</p>
        <p><strong>Chain:</strong> ${alert.chain}</p>
        <p><strong>From:</strong> ${alert.from_addr}</p>
        <p><strong>To:</strong> ${alert.to_addr}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="https://whaleplus.io/scanner?address=${alert.from_addr}" 
           style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Analyze Wallet
        </a>
      </p>
    </div>
  `
}