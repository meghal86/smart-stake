import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get session_id from URL params
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price.product'],
    })

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract subscription details
    const subscription = session.subscription as Stripe.Subscription
    const product = subscription.items.data[0].price.product as Stripe.Product

    // Update user's subscription in Supabase
    const userId = session.metadata?.userId
    if (userId) {
      // Update subscriptions table
      const { error: subError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: userId,
          product_id: product.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (subError) {
        console.error('Error updating subscription:', subError)
      }

      // Update users table
      const { error: userError } = await supabaseClient
        .from('users')
        .upsert({
          user_id: userId,
          plan: 'premium',
          updated_at: new Date().toISOString(),
        })

      if (userError) {
        console.error('Error updating user plan:', userError)
      }
    }

    return new Response(
      JSON.stringify({
        session_id: session.id,
        customer_id: session.customer,
        subscription_id: subscription.id,
        product_id: product.id,
        amount_total: session.amount_total,
        currency: session.currency,
        current_period_end: subscription.current_period_end,
        interval: subscription.items.data[0].price.recurring?.interval,
        status: subscription.status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error verifying session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to verify session' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})