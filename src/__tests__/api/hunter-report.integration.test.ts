/**
 * Integration tests for Hunter Report API
 * 
 * Tests report functionality with flood control and auto-quarantine.
 * 
 * Requirements:
 * - 11.9: Report submission with idempotency
 * - 11.10: Auto-quarantine (≥5 unique reporters in 1h)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Hunter Report API Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  const testUserIds: string[] = [];
  let testOpportunityId: string;
  const authTokens: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create 6 test users for auto-quarantine testing
    for (let i = 0; i < 6; i++) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: `test-report-${Date.now()}-${i}@example.com`,
        password: 'test-password-123',
        email_confirm: true,
      });

      if (userError || !userData.user) {
        throw new Error(`Failed to create test user ${i}`);
      }

      testUserIds.push(userData.user.id);

      // Sign in to get auth token
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email!,
        password: 'test-password-123',
      });

      if (signInError || !signInData.session) {
        throw new Error(`Failed to sign in test user ${i}`);
      }

      authTokens.push(signInData.session.access_token);
    }

    // Create test opportunity
    const { data: oppData, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        slug: `test-report-opp-${Date.now()}`,
        title: 'Test Report Opportunity',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        dedupe_key: `test-report-${Date.now()}`,
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
    for (const userId of testUserIds) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });

  beforeEach(async () => {
    // Clear report events before each test
    await supabase
      .from('report_events')
      .delete()
      .eq('opportunity_id', testOpportunityId);

    // Reset opportunity status
    await supabase
      .from('opportunities')
      .update({ status: 'published' })
      .eq('id', testOpportunityId);
  });

  it('should submit report successfully', async () => {
    const idempotencyKey = `test-report-${Date.now()}`;

    const response = await fetch(`http://localhost:3000/api/hunter/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens[0]}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        opportunity_id: testOpportunityId,
        category: 'phishing',
        description: 'This looks like a phishing attempt',
      }),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify in database
    const { data: report, error } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    expect(error).toBeNull();
    expect(report).toBeTruthy();
    expect(report.category).toBe('phishing');
  });

  it('should enforce idempotency', async () => {
    const idempotencyKey = `test-report-idempotent-${Date.now()}`;

    // Submit same report twice with same idempotency key
    const response1 = await fetch(`http://localhost:3000/api/hunter/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens[0]}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        opportunity_id: testOpportunityId,
        category: 'phishing',
      }),
    });

    const response2 = await fetch(`http://localhost:3000/api/hunter/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens[0]}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        opportunity_id: testOpportunityId,
        category: 'phishing',
      }),
    });

    expect(response1.ok).toBe(true);
    expect(response2.ok).toBe(true);

    // Verify only one entry in database
    const { data: reports, error } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey);

    expect(error).toBeNull();
    expect(reports).toHaveLength(1);
  });

  it('should enforce per-opportunity rate limiting', async () => {
    // Make 4 rapid reports from same user
    const requests = Array.from({ length: 4 }, (_, i) =>
      fetch(`http://localhost:3000/api/hunter/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens[0]}`,
          'Idempotency-Key': `test-report-rate-${Date.now()}-${i}`,
        },
        body: JSON.stringify({
          opportunity_id: testOpportunityId,
          category: 'phishing',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    // Should have at least one rate limited response (3/min limit)
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should auto-quarantine opportunity after 5 unique reports', async () => {
    // Submit reports from 5 different users
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`http://localhost:3000/api/hunter/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens[i]}`,
          'Idempotency-Key': `test-report-quarantine-${Date.now()}-${i}`,
        },
        body: JSON.stringify({
          opportunity_id: testOpportunityId,
          category: 'phishing',
        }),
      });

      expect(response.ok).toBe(true);
    }

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify opportunity is quarantined
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('status')
      .eq('id', testOpportunityId)
      .single();

    expect(error).toBeNull();
    expect(opportunity?.status).toBe('quarantined');
  });

  it('should not auto-quarantine with reports from same user', async () => {
    // Submit 5 reports from same user (should be rate limited)
    for (let i = 0; i < 5; i++) {
      await fetch(`http://localhost:3000/api/hunter/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens[0]}`,
          'Idempotency-Key': `test-report-same-user-${Date.now()}-${i}`,
        },
        body: JSON.stringify({
          opportunity_id: testOpportunityId,
          category: 'phishing',
        }),
      });

      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Verify opportunity is NOT quarantined
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('status')
      .eq('id', testOpportunityId)
      .single();

    expect(error).toBeNull();
    expect(opportunity?.status).toBe('published');
  });

  it('should enforce per-account cooldown', async () => {
    // Submit first report
    const response1 = await fetch(`http://localhost:3000/api/hunter/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens[0]}`,
        'Idempotency-Key': `test-report-cooldown-1-${Date.now()}`,
      },
      body: JSON.stringify({
        opportunity_id: testOpportunityId,
        category: 'phishing',
      }),
    });

    expect(response1.ok).toBe(true);

    // Immediately submit second report (should be rate limited)
    const response2 = await fetch(`http://localhost:3000/api/hunter/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens[0]}`,
        'Idempotency-Key': `test-report-cooldown-2-${Date.now()}`,
      },
      body: JSON.stringify({
        opportunity_id: testOpportunityId,
        category: 'scam',
      }),
    });

    expect(response2.status).toBe(429);
  });
});
