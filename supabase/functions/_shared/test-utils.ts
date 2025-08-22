// Test utilities for Supabase Edge Functions

export const createMockRequest = (
  method: string = 'POST',
  body?: any,
  headers: Record<string, string> = {}
): Request => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token',
    ...headers,
  };

  return new Request('https://example.com', {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
};

export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
});

export const createMockSession = () => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser(),
});

export const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: createMockUser() },
      error: null,
    }),
  },
  from: jest.fn(() => ({
    upsert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
});

export const createMockStripe = () => ({
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        subscription: 'sub_test_123',
        metadata: { userId: 'test-user-id' },
        amount_total: 999,
        currency: 'usd',
        customer: 'cus_test_123',
      }),
    },
  },
  subscriptions: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'sub_test_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
      items: {
        data: [{
          price: {
            product: 'prod_test_123',
            recurring: { interval: 'month' },
          },
        }],
      },
      metadata: { userId: 'test-user-id' },
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          subscription: 'sub_test_123',
          metadata: { userId: 'test-user-id' },
        },
      },
    }),
  },
});

export const mockEnv = {
  'STRIPE_SECRET_KEY': 'sk_test_mock',
  'STRIPE_WEBHOOK_SECRET': 'whsec_mock',
  'SUPABASE_URL': 'https://mock.supabase.co',
  'SUPABASE_SERVICE_ROLE_KEY': 'mock-service-role-key',
};

// Mock Deno.env.get
export const mockDenoEnv = () => {
  (global as any).Deno = {
    env: {
      get: (key: string) => mockEnv[key as keyof typeof mockEnv],
    },
  };
};