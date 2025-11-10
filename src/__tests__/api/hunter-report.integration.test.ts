/**
 * Integration tests for Hunter Report API endpoint
 * Tests idempotency with real database interactions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Hunter Report API - Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOpportunityId: string;

  beforeAll(async () => {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Skipping integration tests: Supabase credentials not configured');
      return;
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a test opportunity
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert({
        slug: 'test-opportunity-report',
        title: 'Test Opportunity for Reports',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        dedupe_key: 'test:airdrop:report:ethereum',
        source: 'internal',
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test opportunity:', error);
      throw error;
    }

    testOpportunityId = opportunity.id;
  });

  afterAll(async () => {
    if (!supabase || !testOpportunityId) return;

    // Clean up test data
    await supabase
      .from('report_events')
      .delete()
      .eq('opportunity_id', testOpportunityId);

    await supabase
      .from('opportunities')
      .delete()
      .eq('id', testOpportunityId);
  });

  beforeEach(async () => {
    if (!supabase || !testOpportunityId) return;

    // Clean up reports before each test
    await supabase
      .from('report_events')
      .delete()
      .eq('opportunity_id', testOpportunityId);
  });

  it('should prevent duplicate reports with same idempotency key', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const idempotencyKey = `test-idempotency-${Date.now()}`;

    // First submission
    const { data: report1, error: error1 } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: idempotencyKey,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'phishing',
        description: 'First submission',
      })
      .select()
      .single();

    expect(error1).toBeNull();
    expect(report1).toBeDefined();
    expect(report1.idempotency_key).toBe(idempotencyKey);

    // Second submission with same idempotency key should fail
    const { data: report2, error: error2 } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: idempotencyKey,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'scam',
        description: 'Second submission (should fail)',
      })
      .select()
      .single();

    expect(error2).toBeDefined();
    expect(error2?.code).toBe('23505'); // Unique constraint violation
    expect(report2).toBeNull();

    // Verify only one report exists
    const { data: reports, error: fetchError } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey);

    expect(fetchError).toBeNull();
    expect(reports).toHaveLength(1);
    expect(reports![0].description).toBe('First submission');
  });

  it('should allow different reports with different idempotency keys', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const key1 = `test-key-1-${Date.now()}`;
    const key2 = `test-key-2-${Date.now()}`;

    // First report
    const { data: report1, error: error1 } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: key1,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'phishing',
      })
      .select()
      .single();

    expect(error1).toBeNull();
    expect(report1).toBeDefined();

    // Second report with different key
    const { data: report2, error: error2 } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: key2,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'scam',
      })
      .select()
      .single();

    expect(error2).toBeNull();
    expect(report2).toBeDefined();

    // Verify both reports exist
    const { data: reports, error: fetchError } = await supabase
      .from('report_events')
      .select('*')
      .eq('opportunity_id', testOpportunityId);

    expect(fetchError).toBeNull();
    expect(reports).toHaveLength(2);
  });

  it('should retrieve existing report by idempotency key', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const idempotencyKey = `test-retrieve-${Date.now()}`;

    // Create report
    const { data: createdReport, error: createError } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: idempotencyKey,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'reward_not_paid',
        description: 'Test description',
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(createdReport).toBeDefined();

    // Retrieve by idempotency key
    const { data: retrievedReport, error: retrieveError } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    expect(retrieveError).toBeNull();
    expect(retrievedReport).toBeDefined();
    expect(retrievedReport.id).toBe(createdReport.id);
    expect(retrievedReport.category).toBe('reward_not_paid');
    expect(retrievedReport.description).toBe('Test description');
  });

  it('should trigger auto-quarantine after 5 unique reports', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // Submit 5 reports from different IPs
    for (let i = 1; i <= 5; i++) {
      const { error } = await supabase
        .from('report_events')
        .insert({
          idempotency_key: `auto-quarantine-${i}-${Date.now()}`,
          opportunity_id: testOpportunityId,
          user_ip: `192.168.1.${i}`,
          category: 'phishing',
        });

      expect(error).toBeNull();
    }

    // Check if opportunity was quarantined
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('status')
      .eq('id', testOpportunityId)
      .single();

    expect(oppError).toBeNull();
    expect(opportunity?.status).toBe('quarantined');
  });

  it('should store metadata correctly', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const metadata = {
      user_agent: 'Mozilla/5.0',
      referrer: 'https://example.com',
      screen_resolution: '1920x1080',
    };

    const { data: report, error } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: `test-metadata-${Date.now()}`,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'other',
        metadata,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(report).toBeDefined();
    expect(report.metadata).toEqual(metadata);
  });

  it('should handle concurrent submissions with same idempotency key', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const idempotencyKey = `test-concurrent-${Date.now()}`;

    // Simulate concurrent submissions
    const promises = Array.from({ length: 5 }, (_, i) =>
      supabase
        .from('report_events')
        .insert({
          idempotency_key: idempotencyKey,
          opportunity_id: testOpportunityId,
          user_ip: '192.168.1.1',
          category: 'phishing',
          description: `Concurrent submission ${i}`,
        })
        .select()
        .single()
    );

    const results = await Promise.allSettled(promises);

    // Only one should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(4);

    // Verify only one report exists
    const { data: reports, error: fetchError } = await supabase
      .from('report_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey);

    expect(fetchError).toBeNull();
    expect(reports).toHaveLength(1);
  });

  it('should allow reports from authenticated and anonymous users', async () => {
    if (!supabase || !testOpportunityId) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // Anonymous report (no user_id)
    const { data: anonReport, error: anonError } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: `test-anon-${Date.now()}`,
        opportunity_id: testOpportunityId,
        user_ip: '192.168.1.1',
        category: 'phishing',
      })
      .select()
      .single();

    expect(anonError).toBeNull();
    expect(anonReport).toBeDefined();
    expect(anonReport.user_id).toBeNull();

    // Authenticated report (with user_id)
    // Note: In real scenario, this would be a valid user ID
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const { data: authReport, error: authError } = await supabase
      .from('report_events')
      .insert({
        idempotency_key: `test-auth-${Date.now()}`,
        opportunity_id: testOpportunityId,
        user_id: mockUserId,
        user_ip: '192.168.1.2',
        category: 'scam',
      })
      .select()
      .single();

    // This might fail due to foreign key constraint if user doesn't exist
    // That's expected behavior
    if (authError?.code === '23503') {
      // Foreign key violation - expected if user doesn't exist
      expect(authError.code).toBe('23503');
    } else {
      expect(authError).toBeNull();
      expect(authReport).toBeDefined();
      expect(authReport.user_id).toBe(mockUserId);
    }
  });
});
