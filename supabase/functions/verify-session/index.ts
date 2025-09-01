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

    // Get the authorization header and session data
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { sessionId } = await req.json();

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

    console.log('Verifying session for user:', user.id);

    // Get subscription details  
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('Subscription retrieved:', subscription.id);

    // Determine plan based on price
    let plan = 'free';
    const priceId = subscription.items.data[0].price.id;
    
    if (priceId === 'price_1S0HB3JwuQyqUsks8bKNUt6M') {
      plan = 'pro';
    } else if (priceId === 'price_1S0HBOJwuQyqUsksDCs7SbPB') {
      plan = 'premium';
    }

    console.log('Determined plan:', plan, 'for price ID:', priceId);

    // Update user's plan and subscription data
    const { error: userUpdateError } = await supabaseClient
      .from('users')
      .update({
        plan: plan,
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError);
      throw userUpdateError;
    }

    // Update subscription table
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        product_id: subscription.items.data[0].price.product,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
    }

    console.log('Successfully updated user plan to:', plan);

    return new Response(
      JSON.stringify({
        success: true,
        plan: plan,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
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