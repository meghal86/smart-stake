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

    // Log webhook event
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: event.type,
        event_id: event.id,
        status: 'processing',
        created_at: new Date().toISOString()
      })
      .catch(err => console.log('Could not log webhook event:', err));

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

    // Update webhook log as successful
    await supabaseClient
      .from('webhook_logs')
      .update({ status: 'success' })
      .eq('event_id', event.id)
      .catch(err => console.log('Could not update webhook log:', err));

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    
    // Log error
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_type: 'error',
        status: 'failed',
        error_message: error.message,
        created_at: new Date().toISOString()
      })
      .catch(err => console.log('Could not log webhook error:', err));

    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleCheckoutSessionCompleted(session, supabaseClient, stripe) {
  console.log('Handling checkout session completed:', session.id);
  
  const userId = session.metadata?.user_id;
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
    plan = 'pro'; // Pro plan
  } else if (priceId === 'price_1S0HBOJwuQyqUsksDCs7SbPB') {
    plan = 'premium'; // Premium plan
  }

  console.log('Determined plan:', plan, 'for price ID:', priceId);

  // Update subscription in database (using correct column names from schema)
  const { error: subscriptionError } = await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      product_id: subscription.items.data[0].price.product,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
  } else {
    console.log('Subscription updated successfully');
  }

  // Update user's plan (using correct column name from schema)
  const { error: userError } = await supabaseClient
    .from('users')
    .update({
      plan: plan, // This matches the schema
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (userError) {
    console.error('Error updating user plan:', userError);
  } else {
    console.log('User plan updated to:', plan);
  }

  // Update users_metadata with subscription info
  const { error: metadataError } = await supabaseClient
    .from('users_metadata')
    .upsert({
      user_id: userId,
      metadata: {
        subscription: {
          plan: plan,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
        }
      },
      updated_at: new Date().toISOString()
    });

  if (metadataError) {
    console.error('Error updating user metadata:', metadataError);
  } else {
    console.log('User metadata updated with plan:', plan);
  }
}

async function handleInvoicePaymentSucceeded(invoice, supabaseClient, stripe) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.user_id;
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
  const userId = subscription.metadata?.user_id;
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
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata for subscription.updated');
    return;
  }

  console.log('Handling subscription updated for user:', userId);

  // Determine plan based on price
  let plan = 'free';
  if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    
    // Map price IDs to plans
    if (priceId === 'price_1S0HB3JwuQyqUsks8bKNUt6M') {
      plan = 'pro'; // Pro plan
    } else if (priceId === 'price_1S0HBOJwuQyqUsksDCs7SbPB') {
      plan = 'premium'; // Premium plan
    }
  }

  console.log('Determined plan from subscription update:', plan);

  // Update subscription details
  const { error: subscriptionError } = await supabaseClient
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
  }

  // Update user's plan
  const { error: userError } = await supabaseClient
    .from('users')
    .update({
      plan: plan,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (userError) {
    console.error('Error updating user plan:', userError);
  } else {
    console.log('User plan updated to:', plan);
  }

  // Update users_metadata
  const { error: metadataError } = await supabaseClient
    .from('users_metadata')
    .upsert({
      user_id: userId,
      metadata: {
        subscription: {
          plan: plan,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
        }
      },
      updated_at: new Date().toISOString()
    });

  if (metadataError) {
    console.error('Error updating user metadata:', metadataError);
  } else {
    console.log('User metadata updated with plan:', plan);
  }
}

async function handleSubscriptionDeleted(subscription, supabaseClient) {
  const userId = subscription.metadata?.user_id;
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
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}