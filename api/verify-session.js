// Stripe Session Verification API
// This endpoint verifies the checkout session and returns subscription details

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'subscription.items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Extract subscription details
    const subscription = session.subscription;
    const product = subscription.items.data[0].price.product;

    res.status(200).json({
      session_id: session.id,
      customer_id: session.customer,
      subscription_id: subscription.id,
      product_id: product.id,
      amount_total: session.amount_total,
      currency: session.currency,
      current_period_end: subscription.current_period_end,
      interval: subscription.items.data[0].price.recurring.interval,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
}