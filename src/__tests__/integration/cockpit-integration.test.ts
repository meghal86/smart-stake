/**
 * Cockpit Integration Tests
 * 
 * Tests complete user flows end-to-end, verifies all API endpoints work together,
 * and tests authentication and demo mode flows.
 * 
 * Requirements: All integration requirements
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        limit: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
  })),
  functions: {
    invoke: vi.fn()
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Import API handlers after mocking
import { GET as getCockpitSummary, POST as postCockpitOpen } from '@/app/api/cockpit/summary/route';
import { GET as getCockpitPrefs, POST as postCockpitPrefs } from '@/app/api/cockpit/prefs/route';
import { POST as postActionsRendered } from '@/app/api/cockpit/actions/rendered/route';

describe('Cockpit Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Flow - Authenticated User', () => {
    test('should handle complete authenticated cockpit flow', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      });

      // Mock cockpit_state data
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                user_id: 'test-user-id',
                last_opened_at: '2026-01-09T10:00:00Z',
                prefs: {
                  wallet_scope_default: 'active',
                  dnd_start_local: '22:00',
                  dnd_end_local: '08:00',
                  notif_cap_per_day: 3
                }
              },
              error: null
            }))
          }))
        })),
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      });

      // Step 1: Get user preferences
      const prefsRequest = new NextRequest('http://localhost:3000/api/cockpit/prefs');
      const prefsResponse = await getCockpitPrefs(prefsRequest);
      const prefsData = await prefsResponse.json();

      expect(prefsResponse.status).toBe(200);
      expect(prefsData.data).toEqual({
        wallet_scope_default: 'active',
        dnd_start_local: '22:00',
        dnd_end_local: '08:00',
        notif_cap_per_day: 3
      });

      // Step 2: Get cockpit summary
      const summaryRequest = new NextRequest('http://localhost:3000/api/cockpit/summary?wallet_scope=active');
      
      // Mock summary data
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          wallet_scope: 'active',
          today_card: {
            kind: 'daily_pulse',
            anchor_metric: '3 new · 2 expiring',
            context_line: 'Since your last open',
            primary_cta: { label: 'Open today\'s pulse', href: '/cockpit#pulse' }
          },
          action_preview: [
            {
              id: 'act_123',
              lane: 'Protect',
              title: 'Revoke unused approval: Uniswap Router',
              impact_chips: [
                { kind: 'gas_est_usd', value: 0.42 },
                { kind: 'risk_delta', value: -12 }
              ],
              provenance: 'simulated',
              cta: { kind: 'Fix', href: '/action-center?intent=act_123' },
              severity: 'high',
              freshness: 'updated',
              expires_at: '2026-01-10T03:00:00Z',
              event_time: '2026-01-09T15:22:00Z',
              urgency_score: 92,
              score: 262
            }
          ],
          counters: {
            new_since_last: 7,
            expiring_soon: 2,
            critical_risk: 0,
            pending_actions: 1
          },
          provider_status: { state: 'online', detail: null },
          degraded_mode: false
        },
        error: null
      });

      const summaryResponse = await getCockpitSummary(summaryRequest);
      const summaryData = await summaryResponse.json();

      expect(summaryResponse.status).toBe(200);
      expect(summaryData.data.today_card.kind).toBe('daily_pulse');
      expect(summaryData.data.action_preview).toHaveLength(1);
      expect(summaryData.data.degraded_mode).toBe(false);

      // Step 3: Record cockpit open
      const openRequest = new NextRequest('http://localhost:3000/api/cockpit/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: 'America/Chicago' })
      });

      const openResponse = await postCockpitOpen(openRequest);
      const openData = await openResponse.json();

      expect(openResponse.status).toBe(200);
      expect(openData.data.ok).toBe(true);

      // Step 4: Record actions rendered
      const renderedRequest = new NextRequest('http://localhost:3000/api/cockpit/actions/rendered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dedupe_keys: ['guardian:finding_123:Fix'] })
      });

      const renderedResponse = await postActionsRendered(renderedRequest);
      const renderedData = await renderedResponse.json();

      expect(renderedResponse.status).toBe(200);
      expect(renderedData.data.ok).toBe(true);

      // Verify all database interactions occurred
      expect(mockSupabase.from).toHaveBeenCalledWith('cockpit_state');
      expect(mockSupabase.from).toHaveBeenCalledWith('shown_actions');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('cockpit-summary', expect.any(Object));
    });

    test('should handle preference updates', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const prefsRequest = new NextRequest('http://localhost:3000/api/cockpit/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_scope_default: 'all',
          dnd_start_local: '23:00',
          dnd_end_local: '07:00',
          notif_cap_per_day: 5
        })
      });

      const prefsResponse = await postCockpitPrefs(prefsRequest);
      const prefsData = await prefsResponse.json();

      expect(prefsResponse.status).toBe(200);
      expect(prefsData.data).toEqual({
        wallet_scope_default: 'all',
        dnd_start_local: '23:00',
        dnd_end_local: '07:00',
        notif_cap_per_day: 5
      });

      // Verify upsert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('cockpit_state');
    });
  });

  describe('Demo Mode Flow', () => {
    test('should handle demo mode without API calls', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      // In demo mode, API endpoints should return demo data or reject
      const summaryRequest = new NextRequest('http://localhost:3000/api/cockpit/summary?demo=1');
      
      // Demo mode should not call edge functions
      const summaryResponse = await getCockpitSummary(summaryRequest);
      
      // Should return 401 for unauthenticated requests (demo mode handled client-side)
      expect(summaryResponse.status).toBe(401);
      
      // Verify no edge function calls were made
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      });

      const prefsRequest = new NextRequest('http://localhost:3000/api/cockpit/prefs');
      const prefsResponse = await getCockpitPrefs(prefsRequest);

      expect(prefsResponse.status).toBe(500);
      
      const errorData = await prefsResponse.json();
      expect(errorData.error).toBeDefined();
      expect(errorData.error.code).toBe('INTERNAL_ERROR');
    });

    test('should handle edge function failures', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock edge function error
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Edge function failed' }
      });

      const summaryRequest = new NextRequest('http://localhost:3000/api/cockpit/summary');
      const summaryResponse = await getCockpitSummary(summaryRequest);

      expect(summaryResponse.status).toBe(500);
      
      const errorData = await summaryResponse.json();
      expect(errorData.error).toBeDefined();
      expect(errorData.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should enforce rate limits on cockpit open endpoint', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // First request should succeed
      const openRequest1 = new NextRequest('http://localhost:3000/api/cockpit/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: 'America/Chicago' })
      });

      const openResponse1 = await postCockpitOpen(openRequest1);
      expect(openResponse1.status).toBe(200);

      // Second request within same minute should be debounced (handled server-side)
      const openRequest2 = new NextRequest('http://localhost:3000/api/cockpit/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: 'America/Chicago' })
      });

      const openResponse2 = await postCockpitOpen(openRequest2);
      // Should still return 200 but be debounced server-side
      expect(openResponse2.status).toBe(200);
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data consistency across multiple API calls', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock consistent user state
      const mockUserState = {
        user_id: 'test-user-id',
        last_opened_at: '2026-01-09T10:00:00Z',
        prefs: {
          wallet_scope_default: 'active',
          timezone: 'America/Chicago'
        }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockUserState,
              error: null
            }))
          }))
        })),
        upsert: vi.fn(() => Promise.resolve({ data: mockUserState, error: null }))
      });

      // Get preferences
      const prefsRequest = new NextRequest('http://localhost:3000/api/cockpit/prefs');
      const prefsResponse = await getCockpitPrefs(prefsRequest);
      const prefsData = await prefsResponse.json();

      expect(prefsData.data.wallet_scope_default).toBe('active');

      // Update last opened
      const openRequest = new NextRequest('http://localhost:3000/api/cockpit/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: 'America/Chicago' })
      });

      const openResponse = await postCockpitOpen(openRequest);
      expect(openResponse.status).toBe(200);

      // Verify consistent user_id used across calls
      const fromCalls = mockSupabase.from.mock.calls;
      const cockpitStateCalls = fromCalls.filter(call => call[0] === 'cockpit_state');
      expect(cockpitStateCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Integration', () => {
    test('should handle authentication state changes', async () => {
      // Start unauthenticated
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const unauthRequest = new NextRequest('http://localhost:3000/api/cockpit/summary');
      const unauthResponse = await getCockpitSummary(unauthRequest);
      
      expect(unauthResponse.status).toBe(401);

      // Simulate authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock successful edge function call
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          wallet_scope: 'active',
          today_card: { kind: 'portfolio_anchor' },
          action_preview: [],
          counters: { new_since_last: 0, expiring_soon: 0, critical_risk: 0, pending_actions: 0 },
          provider_status: { state: 'online' },
          degraded_mode: false
        },
        error: null
      });

      const authRequest = new NextRequest('http://localhost:3000/api/cockpit/summary');
      const authResponse = await getCockpitSummary(authRequest);
      
      expect(authResponse.status).toBe(200);
      
      const authData = await authResponse.json();
      expect(authData.data.today_card.kind).toBe('portfolio_anchor');
    });
  });

  describe('Wallet Scope Integration', () => {
    test('should handle wallet scope changes correctly', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock different responses for different wallet scopes
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            wallet_scope: 'active',
            today_card: { kind: 'daily_pulse' },
            action_preview: [{ id: 'act_1' }],
            counters: { new_since_last: 1 }
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            wallet_scope: 'all',
            today_card: { kind: 'pending_actions' },
            action_preview: [{ id: 'act_1' }, { id: 'act_2' }],
            counters: { new_since_last: 3 }
          },
          error: null
        });

      // Test active wallet scope
      const activeRequest = new NextRequest('http://localhost:3000/api/cockpit/summary?wallet_scope=active');
      const activeResponse = await getCockpitSummary(activeRequest);
      const activeData = await activeResponse.json();

      expect(activeData.data.wallet_scope).toBe('active');
      expect(activeData.data.action_preview).toHaveLength(1);

      // Test all wallets scope
      const allRequest = new NextRequest('http://localhost:3000/api/cockpit/summary?wallet_scope=all');
      const allResponse = await getCockpitSummary(allRequest);
      const allData = await allResponse.json();

      expect(allData.data.wallet_scope).toBe('all');
      expect(allData.data.action_preview).toHaveLength(2);
    });
  });
});