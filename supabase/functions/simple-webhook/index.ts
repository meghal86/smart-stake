import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const PRICE_TO_PLAN = {
  'price_1S0HB3JwuQyqUsks8bKNUt6M': 'pro',
  'price_1S0HBOJwuQyqUsksDCs7SbPB': 'premium'
}

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  const event = stripe.webhooks.constructEvent(
    body, 
    signature, 
    Deno.env.get('STRIPE_WEBHOOK_SECRET')
  )

  const updateUserPlan = async (subscription, status = 'active') => {
    const userId = subscription.metadata?.user_id
    if (!userId) return

    let plan = 'free'
    if (status === 'active' && subscription.items?.data?.[0]) {
      plan = PRICE_TO_PLAN[subscription.items.data[0].price.id] || 'free'
    }

    await supabase
      .from('users')
      .update({ plan })
      .eq('user_id', userId)
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        await updateUserPlan(subscription)
      }
      break

    case 'customer.subscription.updated':
      await updateUserPlan(event.data.object)
      break

    case 'customer.subscription.deleted':
      await updateUserPlan(event.data.object, 'canceled')
      break
  }

  return new Response(JSON.stringify({ received: true }))
})