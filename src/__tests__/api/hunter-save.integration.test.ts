/**
 * Integration tests for Hunter Save API
 * 
 * Tests save functionality with real database operations.
 * 
 * Requirements:
 * - 5.8: Save persists across sessions
 * - 11.4: Rate limiting prevents abuse
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Hunter Save API Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let testOpportunityId: string;
  let authToken: string;

  beforeAll(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-save-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = userData.user.id;

    // Sign in to get auth token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email!,
      password: 'test-password-123',
    });

    if (signInError || !signInData.session) {
      throw new Error('Failed to sign in test user');
    }

    authToken = signInData.session.access_token;

    // Create test opportunity
    const { data: oppData, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        slug: `test-save-opp-${Date.now()}`,
        title: 'Test Save Opportunity',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        dedupe_key: `test-save-${Date.now()}`,
        source: 'internal',
        status: 'published',
      })
      .select()
      .single();

    if (oppError || !oppData) {
      throw new Error('Failed to create test opportunity');
    }

    testOpportunityId = oppData.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testOpportunityId) {
      await supabase.from('opportunities').delete().eq('id', testOpportunityId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clear saved opportunities before each test
    await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', testUserId);
  });

  it('should save opportunity successfully', async () => {
    const response = await fetch(`http://localhost:3000/api/hunter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ opportunity_id: testOpportunityId }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.opportunity.id).toBe(testOpportunityId);

    // Verify in database
    const { data: saved, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .eq('user_id', testUserId)
      .eq('opportunity_id', testOpportunityId)
      .single();

    expect(error).toBeNull();
    expect(saved).toBeTruthy();
  });

  it('should persist saved opportunity across sessions', async () => {
    // Save opportunity
    await fetch(`http://localhost:3000/api/hunter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ opportunity_id: testOpportunityId }),
    });

    // Simulate new session by querying database directly
    const { data: saved, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .eq('user_id', testUserId)
      .eq('opportunity_id', testOpportunityId)
      .single();

    expect(error).toBeNull();
    expect(saved).toBeTruthy();
    expect(saved.opportunity_id).toBe(testOpportunityId);
  });

  it('should unsave opportunity successfully', async () => {
    // First save
    await fetch(`http://localhost:3000/api/hunter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ opportunity_id: testOpportunityId }),
    });

    // Then unsave
    const response = await fetch(`http://localhost:3000/api/hunter/save?opportunity_id=${testOpportunityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify removed from database
    const { data: saved, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .eq('user_id', testUserId)
      .eq('opportunity_id', testOpportunityId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(saved).toBeNull();
  });

  it('should handle duplicate saves gracefully', async () => {
    // Save twice
    const response1 = await fetch(`http://localhost:3000/api/hunter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ opportunity_id: testOpportunityId }),
    });

    const response2 = await fetch(`http://localhost:3000/api/hunter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ opportunity_id: testOpportunityId }),
    });

    expect(response1.ok).toBe(true);
    expect(response2.ok).toBe(true);

    // Verify only one entry in database
    const { data: saved, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .eq('user_id', testUserId)
      .eq('opportunity_id', testOpportunityId);

    expect(error).toBeNull();
    expect(saved).toHaveLength(1);
  });

  it('should enforce rate limiting', async () => {
    // Make multiple rapid requests
    const requests = Array.from({ length: 65 }, () =>
      fetch(`http://localhost:3000/api/hunter/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ opportunity_id: testOpportunityId }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    // Should have at least one rate limited response
    expect(rateLimited.length).toBeGreaterThan(0);

    // Rate limited response should have Retry-After header
    const rateLimitedResponse = rateLimited[0];
    expect(rateLimitedResponse.headers.get('Retry-After')).toBeTruthy();
  });
});
