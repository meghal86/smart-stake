/**
 * Integration Tests for Portfolio Actions API
 * 
 * Tests the GET /api/v1/portfolio/actions endpoint
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: () => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  }),
}));

describe('GET /api/v1/portfolio/actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns actions with correct structure', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890'
    );

    const response = await GET(request);
    const data = await response.json();

    // Check response structure
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('apiVersion', 'v1');
    expect(data).toHaveProperty('ts');

    // Check data structure
    expect(data.data).toHaveProperty('items');
    expect(data.data).toHaveProperty('freshness');
    expect(Array.isArray(data.data.items)).toBe(true);

    // Check action structure
    if (data.data.items.length > 0) {
      const action = data.data.items[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('title');
      expect(action).toHaveProperty('severity');
      expect(action).toHaveProperty('why');
      expect(action).toHaveProperty('impactPreview');
      expect(action).toHaveProperty('actionScore');
      expect(action).toHaveProperty('cta');
      expect(action).toHaveProperty('walletScope');

      // Check severity values
      expect(['critical', 'high', 'medium', 'low']).toContain(action.severity);

      // Check impact preview structure
      expect(action.impactPreview).toHaveProperty('riskDelta');
      expect(action.impactPreview).toHaveProperty('preventedLossP50Usd');
      expect(action.impactPreview).toHaveProperty('expectedGainUsd');
      expect(action.impactPreview).toHaveProperty('gasEstimateUsd');
      expect(action.impactPreview).toHaveProperty('timeEstimateSec');
      expect(action.impactPreview).toHaveProperty('confidence');

      // Check CTA structure
      expect(action.cta).toHaveProperty('label');
      expect(action.cta).toHaveProperty('intent');
      expect(action.cta).toHaveProperty('params');
    }
  });

  test('returns actions sorted by ActionScore', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const actions = data.data.items;

    // Check that actions are sorted by actionScore descending
    for (let i = 0; i < actions.length - 1; i++) {
      expect(actions[i].actionScore).toBeGreaterThanOrEqual(actions[i + 1].actionScore);
    }
  });

  test('validates scope parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=invalid_scope'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_SCOPE');
  });

  test('requires wallet for active_wallet scope', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('MISSING_WALLET');
  });

  test('supports all_wallets scope', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=all_wallets'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.items).toBeDefined();
  });

  test('supports cursor pagination', async () => {
    // First request
    const request1 = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890&limit=2'
    );

    const response1 = await GET(request1);
    const data1 = await response1.json();

    expect(response1.status).toBe(200);
    expect(data1.data.items.length).toBeLessThanOrEqual(2);

    // If there's a nextCursor, test pagination
    if (data1.data.nextCursor) {
      const request2 = new NextRequest(
        `http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890&cursor=${data1.data.nextCursor}&limit=2`
      );

      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      
      // Ensure different results
      if (data2.data.items.length > 0 && data1.data.items.length > 0) {
        expect(data2.data.items[0].id).not.toBe(data1.data.items[0].id);
      }
    }
  });

  test('includes freshness metadata', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.freshness).toBeDefined();
    expect(data.data.freshness).toHaveProperty('freshnessSec');
    expect(data.data.freshness).toHaveProperty('confidence');
    expect(data.data.freshness).toHaveProperty('confidenceThreshold');
    expect(data.data.freshness).toHaveProperty('degraded');

    // Validate confidence range
    expect(data.data.freshness.confidence).toBeGreaterThanOrEqual(0.5);
    expect(data.data.freshness.confidence).toBeLessThanOrEqual(1.0);
  });

  test('includes validation headers', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Action-Types-Complete')).toBeDefined();
    expect(response.headers.get('X-Total-Actions')).toBeDefined();
  });

  test('respects limit parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890&limit=3'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.items.length).toBeLessThanOrEqual(3);
  });

  test('enforces maximum limit', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/portfolio/actions?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890&limit=100'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.items.length).toBeLessThanOrEqual(20); // Max limit is 20
  });
});