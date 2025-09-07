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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or malformed Authorization header:', authHeader)
      return new Response(
        JSON.stringify({ error: 'Missing or malformed Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    const token = authHeader.replace('Bearer ', '')

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.json()
    const { action, subscriptionId, priceId } = body
    
    console.log('Received action:', action, 'for user:', user.id)

    // Get user's subscription from database
    const { data: userData, error: dbError } = await supabaseClient
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (dbError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (action) {
      case 'cancel':
        if (!userData.stripe_subscription_id) {
          return new Response(
            JSON.stringify({ error: 'No active subscription found' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Cancel subscription at period end
        const canceledSubscription = await stripe.subscriptions.update(
          userData.stripe_subscription_id,
          {
            cancel_at_period_end: true,
          }
        )

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: canceledSubscription,
            message: 'Subscription will be canceled at the end of the current billing period'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'reactivate':
        if (!userData.stripe_subscription_id) {
          return new Response(
            JSON.stringify({ error: 'No subscription found' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Reactivate subscription
        const reactivatedSubscription = await stripe.subscriptions.update(
          userData.stripe_subscription_id,
          {
            cancel_at_period_end: false,
          }
        )

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: reactivatedSubscription,
            message: 'Subscription has been reactivated'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'update':
        if (!userData.stripe_subscription_id || !priceId) {
          return new Response(
            JSON.stringify({ error: 'Subscription ID and Price ID are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get current subscription
        const currentSubscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id)
        
        // Update subscription to new price
        const updatedSubscription = await stripe.subscriptions.update(
          userData.stripe_subscription_id,
          {
            items: [{
              id: currentSubscription.items.data[0].id,
              price: priceId,
            }],
            proration_behavior: 'create_prorations',
          }
        )

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: updatedSubscription,
            message: 'Subscription has been updated'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'get_details':
        if (!userData.stripe_subscription_id) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              subscription: null,
              message: 'No active subscription found'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id, {
          expand: ['latest_invoice', 'customer', 'items.data.price']
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: subscription
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'get_invoices':
        if (!userData.stripe_customer_id) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              invoices: [],
              message: 'No customer found'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get customer invoices
        const invoices = await stripe.invoices.list({
          customer: userData.stripe_customer_id,
          limit: 10,
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            invoices: invoices.data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'create_portal_session':
        if (!userData.stripe_customer_id) {
          return new Response(
            JSON.stringify({ error: 'No customer found' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create customer portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: userData.stripe_customer_id,
          return_url: `${req.headers.get('origin')}/subscription`,
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            url: portalSession.url
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error managing subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to manage subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})