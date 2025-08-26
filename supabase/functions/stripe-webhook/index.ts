import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle the events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabaseClient, stripe);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabaseClient, stripe);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabaseClient, stripe);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabaseClient);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabaseClient);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleCheckoutSessionCompleted(session, supabaseClient, stripe) {
  console.log('Handling checkout session completed:', session.id);
  
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  console.log('User ID from metadata:', userId);

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  console.log('Subscription retrieved:', subscription.id);

  // Determine plan based on price
  let plan = 'free';
  const priceId = subscription.items.data[0].price.id;
  
  // Map price IDs to plans
  if (priceId === 'price_1S0HB3JwuQyqUsks8bKNUt6M') {
    plan = 'pro';
  } else if (priceId === 'price_1S0HBOJwuQyqUsksDCs7SbPB') {
    plan = 'premium';
  }

  console.log('Determined plan:', plan, 'for price ID:', priceId);

  // Update user's subscription in Supabase
  const { error: subscriptionError } = await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      product_id: subscription.items.data[0].price.product,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
  } else {
    console.log('Subscription updated successfully');
  }

  // Update user's plan
  const { error: userError } = await supabaseClient
    .from('users')
    .upsert({
      user_id: userId,
      plan: plan,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });

  if (userError) {
    console.error('Error updating user:', userError);
  } else {
    console.log('User plan updated to:', plan);
  }
}

async function handleInvoicePaymentSucceeded(invoice, supabaseClient, stripe) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription status
  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

async function handleInvoicePaymentFailed(invoice, supabaseClient, stripe) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription status
  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

async function handleSubscriptionUpdated(subscription, supabaseClient) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription details
  await supabaseClient
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

async function handleSubscriptionDeleted(subscription, supabaseClient) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription status and user plan
  await supabaseClient
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await supabaseClient
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}