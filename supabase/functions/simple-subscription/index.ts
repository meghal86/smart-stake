import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_TO_PLAN = {
  'price_1S0HB3JwuQyqUsks8bKNUt6M': 'pro',
  'price_1S0HBOJwuQyqUsksDCs7SbPB': 'premium'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, priceId, userId, sessionId } = await req.json()

    if (action === 'create-checkout') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription/cancel`,
        metadata: { user_id: userId }
      })

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'verify-payment') {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        if (session.payment_status !== 'paid') {
          return new Response(JSON.stringify({ error: 'Payment not completed', status: session.payment_status }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (!session.subscription) {
          return new Response(JSON.stringify({ error: 'No subscription found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const plan = PRICE_TO_PLAN[subscription.items.data[0].price.id] || 'free'

        const { error: dbError } = await supabase
          .from('users')
          .update({ plan })
          .eq('user_id', userId)

        if (dbError) {
          return new Response(JSON.stringify({ error: 'Database update failed', details: dbError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ success: true, plan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (stripeError) {
        return new Response(JSON.stringify({ error: 'Stripe error', details: stripeError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response('Invalid action', { status: 400 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})