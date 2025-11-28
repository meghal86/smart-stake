/**
 * Integration tests for GET /api/hunter/opportunities endpoint
 * 
 * Tests the full request/response cycle with real dependencies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('GET /api/hunter/opportunities - Integration', () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip tests if Supabase credentials are not available
  const skipTests = !supabaseUrl || !supabaseKey;

  if (skipTests) {
    it.skip('Skipping integration tests - Supabase credentials not available', () => {});
    return;
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!);
  let testOpportunityId: string;

  beforeAll(async () => {
    // Create a test opportunity for integration tests
    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        slug: 'test-integration-opportunity',
        title: 'Test Integration Opportunity',
        protocol_name: 'Test Protocol',
        protocol_logo: 'https://example.com/logo.png',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        reward_confidence: 'estimated',
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        dedupe_key: 'test-protocol:airdrop:test-campaign:ethereum',
        source: 'internal',
        status: 'published',
        trust_score: 85,
        trust_level: 'green',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test opportunity:', error);
    } else {
      testOpportunityId = data.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testOpportunityId) {
      await supabase
        .from('opportunities')
        .delete()
        .eq('id', testOpportunityId);
    }
  });

  it('should return opportunities from database', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('cursor');
    expect(data).toHaveProperty('ts');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('should respect trust_min filter', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities?trust_min=90`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // All items should have trust_score >= 90
    data.items.forEach((item: unknown) => {
      expect(item.trust.score).toBeGreaterThanOrEqual(90);
    });
  });

  it('should handle cursor pagination', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // First page
    const response1 = await fetch(`${baseUrl}/api/hunter/opportunities`);
    const data1 = await response1.json();
    
    if (data1.cursor) {
      // Second page
      const response2 = await fetch(`${baseUrl}/api/hunter/opportunities?cursor=${data1.cursor}`);
      const data2 = await response2.json();
      
      expect(response2.status).toBe(200);
      expect(data2).toHaveProperty('items');
      
      // Items should be different
      const ids1 = data1.items.map((item: unknown) => item.id);
      const ids2 = data2.items.map((item: unknown) => item.id);
      
      // No duplicates across pages
      const intersection = ids1.filter((id: string) => ids2.includes(id));
      expect(intersection).toHaveLength(0);
    }
  });

  it('should return 304 for matching ETag', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // First request
    const response1 = await fetch(`${baseUrl}/api/hunter/opportunities`);
    const etag = response1.headers.get('ETag');
    
    expect(etag).toBeTruthy();
    
    // Second request with If-None-Match
    const response2 = await fetch(`${baseUrl}/api/hunter/opportunities`, {
      headers: {
        'If-None-Match': etag!,
      },
    });
    
    expect(response2.status).toBe(304);
  });

  it('should include proper headers', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities`);
    
    expect(response.headers.get('X-API-Version')).toBeTruthy();
    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('Cache-Control')).toBeTruthy();
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('should handle type filter', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities?type=airdrop`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // All items should be airdrops
    data.items.forEach((item: unknown) => {
      expect(item.type).toBe('airdrop');
    });
  });

  it('should handle chain filter', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities?chains=ethereum`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // All items should include ethereum chain
    data.items.forEach((item: unknown) => {
      expect(item.chains).toContain('ethereum');
    });
  });

  it('should handle search query', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities?q=test`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('items');
  });

  it('should return 400 for invalid parameters', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hunter/opportunities?trust_min=invalid`);
    
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('BAD_FILTER');
  });
});
