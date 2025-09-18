import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const service = url.searchParams.get('service') || 'all'

  try {
    const startTime = Date.now()
    let result = { healthy: false, message: '', responseTime: 0 }

    switch (service) {
      case 'database':
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { error } = await supabase.from('users').select('count').limit(1)
        result = {
          healthy: !error,
          message: error ? error.message : 'Database connection successful',
          responseTime: Date.now() - startTime
        }
        break

      case 'stripe':
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (!stripeKey) {
          result = { healthy: false, message: 'Stripe key not configured', responseTime: Date.now() - startTime }
        } else {
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
          try {
            await stripe.products.list({ limit: 1 })
            result = { healthy: true, message: 'Stripe API accessible', responseTime: Date.now() - startTime }
          } catch (error) {
            result = { healthy: false, message: error.message, responseTime: Date.now() - startTime }
          }
        }
        break

      case 'email':
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (!resendKey) {
          result = { healthy: false, message: 'Resend key not configured', responseTime: Date.now() - startTime }
        } else {
          const emailResponse = await fetch('https://api.resend.com/domains', {
            headers: { 'Authorization': `Bearer ${resendKey}` }
          })
          result = {
            healthy: emailResponse.ok,
            message: emailResponse.ok ? 'Resend API accessible' : 'Resend API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'whale-alert':
        const whaleKey = Deno.env.get('WHALE_ALERT_API_KEY')
        if (!whaleKey) {
          result = { healthy: false, message: 'Whale Alert key not configured', responseTime: Date.now() - startTime }
        } else {
          const whaleResponse = await fetch(`https://api.whale-alert.io/v1/status?api_key=${whaleKey}`)
          result = {
            healthy: whaleResponse.ok,
            message: whaleResponse.ok ? 'Whale Alert API accessible' : 'Whale Alert API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'alchemy':
        const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
        if (!alchemyKey) {
          result = { healthy: false, message: 'Alchemy key not configured', responseTime: Date.now() - startTime }
        } else {
          const alchemyResponse = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
          })
          result = {
            healthy: alchemyResponse.ok,
            message: alchemyResponse.ok ? 'Alchemy API accessible' : 'Alchemy API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'moralis':
        const moralisKey = Deno.env.get('MORALIS_API_KEY')
        if (!moralisKey) {
          result = { healthy: false, message: 'Moralis key not configured', responseTime: Date.now() - startTime }
        } else {
          const moralisResponse = await fetch('https://deep-index.moralis.io/api/v2/dateToBlock?chain=eth&date=2021-01-01T00%3A00%3A00%2B00%3A00', {
            headers: { 'X-API-Key': moralisKey }
          })
          result = {
            healthy: moralisResponse.ok,
            message: moralisResponse.ok ? 'Moralis API accessible' : 'Moralis API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'etherscan':
        const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY')
        if (!etherscanKey) {
          result = { healthy: false, message: 'Etherscan key not configured', responseTime: Date.now() - startTime }
        } else {
          const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${etherscanKey}`)
          result = {
            healthy: etherscanResponse.ok,
            message: etherscanResponse.ok ? 'Etherscan API accessible' : 'Etherscan API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'openai':
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) {
          result = { healthy: false, message: 'OpenAI key not configured', responseTime: Date.now() - startTime }
        } else {
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${openaiKey}` }
          })
          result = {
            healthy: openaiResponse.ok,
            message: openaiResponse.ok ? 'OpenAI API accessible' : 'OpenAI API error',
            responseTime: Date.now() - startTime
          }
        }
        break

      case 'risk-scanner':
        const riskSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { error: riskError } = await riskSupabase.from('risk_scores').select('count').limit(1)
        result = {
          healthy: !riskError,
          message: riskError ? 'Risk scanner table not accessible' : 'Risk scanner operational',
          responseTime: Date.now() - startTime
        }
        break

      case 'notifications':
        const notifSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { error: notifError } = await notifSupabase.from('notification_logs').select('count').limit(1)
        result = {
          healthy: !notifError,
          message: notifError ? 'Notification system not accessible' : 'Notification system operational',
          responseTime: Date.now() - startTime
        }
        break

      default:
        result = { healthy: true, message: 'Health check service operational', responseTime: Date.now() - startTime }
    }

    return new Response(JSON.stringify(result), {
      status: result.healthy ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      healthy: false,
      message: error.message,
      responseTime: Date.now()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})