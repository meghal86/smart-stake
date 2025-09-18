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