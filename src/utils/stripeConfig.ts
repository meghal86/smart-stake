// Stripe configuration and validation
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  priceIds: {
    premium: 'price_1S0HBOJwuQyqUsksDCs7SbPB', // $19.99/month
    pro: 'price_1S0HB3JwuQyqUsks8bKNUt6M', // $9.99/month (hidden from signup)
  }
};

export const validateStripeConfig = () => {
  if (!STRIPE_CONFIG.publishableKey) {
    console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
    return false;
  }
  
  if (!STRIPE_CONFIG.publishableKey.startsWith('pk_')) {
    console.error('Invalid Stripe publishable key format');
    return false;
  }
  
  return true;
};

export const isStripeConfigured = validateStripeConfig();