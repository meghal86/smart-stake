import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createMockRequest, createMockSupabaseClient, createMockStripe, mockDenoEnv } from '../_shared/test-utils.ts';

// Mock dependencies
mockDenoEnv();

const mockSupabase = createMockSupabaseClient();
const mockStripe = createMockStripe();

// Mock modules
jest.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('https://esm.sh/stripe@14.21.0', () => ({
  default: class MockStripe {
    constructor() {
      return mockStripe;
    }
  },
}));

Deno.test('create-checkout-session: successful checkout session creation', async () => {
  const request = createMockRequest('POST', {
    priceId: 'price_test_123',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  });

  // Import the function after mocks are set up
  const { default: handler } = await import('./index.ts');
  
  const response = await handler(request);
  const data = await response.json();

  assertEquals(response.status, 200);
  assertExists(data.sessionId);
  assertExists(data.url);
  assertEquals(data.sessionId, 'cs_test_123');
});

Deno.test('create-checkout-session: handles missing price ID', async () => {
  const request = createMockRequest('POST', {
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  });

  const { default: handler } = await import('./index.ts');
  
  const response = await handler(request);
  const data = await response.json();

  assertEquals(response.status, 400);
  assertEquals(data.error, 'Price ID is required');
});

Deno.test('create-checkout-session: handles unauthorized user', async () => {
  mockSupabase.auth.getUser.mockResolvedValueOnce({
    data: { user: null },
    error: { message: 'Invalid token' },
  });

  const request = createMockRequest('POST', {
    priceId: 'price_test_123',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  });

  const { default: handler } = await import('./index.ts');
  
  const response = await handler(request);
  const data = await response.json();

  assertEquals(response.status, 401);
  assertEquals(data.error, 'Unauthorized');
});

Deno.test('create-checkout-session: handles Stripe error', async () => {
  mockStripe.checkout.sessions.create.mockRejectedValueOnce(
    new Error('Stripe API error')
  );

  const request = createMockRequest('POST', {
    priceId: 'price_test_123',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  });

  const { default: handler } = await import('./index.ts');
  
  const response = await handler(request);
  const data = await response.json();

  assertEquals(response.status, 500);
  assertEquals(data.error, 'Failed to create checkout session');
});

Deno.test('create-checkout-session: handles CORS preflight', async () => {
  const request = createMockRequest('OPTIONS');

  const { default: handler } = await import('./index.ts');
  
  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
});

Deno.test('create-checkout-session: creates session with correct parameters', async () => {
  const request = createMockRequest('POST', {
    priceId: 'price_test_123',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  });

  const { default: handler } = await import('./index.ts');
  
  await handler(request);

  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_test_123',
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/cancel',
    customer_email: 'test@example.com',
    metadata: {
      userId: 'test-user-id',
    },
    subscription_data: {
      metadata: {
        userId: 'test-user-id',
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });
});