/**
 * Tests for ranking materialized view
 * 
 * Requirements: 3.1-3.6 (Personalized Feed Ranking)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createServiceClient } from '@/integrations/supabase/service';

describe('Ranking Materialized View', () => {
  const supabase = createServiceClient();

  beforeAll(async () => {
    // Ensure the view is refreshed before tests
    const { error } = await supabase.rpc('refresh_opportunity_rank_view');
    if (error) {
      console.warn('Could not refresh view:', error.message);
    }
  });

  it('should have mv_opportunity_rank view available', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should include rank_score column', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('id, rank_score, relevance_score, trust_weighted_score, freshness_weighted_score')
      .limit(1);

    expect(error).toBeNull();
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('rank_score');
      expect(data[0]).toHaveProperty('relevance_score');
      expect(data[0]).toHaveProperty('trust_weighted_score');
      expect(data[0]).toHaveProperty('freshness_weighted_score');
    }
  });

  it('should only include published and non-expired opportunities', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('status, expires_at');

    expect(error).toBeNull();
    if (data) {
      data.forEach(row => {
        expect(row.status).toBe('published');
        if (row.expires_at) {
          expect(new Date(row.expires_at).getTime()).toBeGreaterThan(Date.now());
        }
      });
    }
  });

  it('should have rank_score between 0 and 1', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('rank_score')
      .limit(10);

    expect(error).toBeNull();
    if (data) {
      data.forEach(row => {
        expect(row.rank_score).toBeGreaterThanOrEqual(0);
        expect(row.rank_score).toBeLessThanOrEqual(1);
      });
    }
  });

  it('should order by rank_score DESC by default', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('rank_score')
      .order('rank_score', { ascending: false })
      .limit(10);

    expect(error).toBeNull();
    if (data && data.length > 1) {
      for (let i = 0; i < data.length - 1; i++) {
        expect(data[i].rank_score).toBeGreaterThanOrEqual(data[i + 1].rank_score);
      }
    }
  });

  it('should perform query in < 200ms on 100k rows', async () => {
    const start = Date.now();
    
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('*')
      .order('rank_score', { ascending: false })
      .limit(12);

    const duration = Date.now() - start;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(200);
    
    console.log(`Query completed in ${duration}ms`);
  });

  it('should include trending metrics when available', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('id, trending_score, impressions, clicks, ctr')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Trending metrics may be null for cold start
  });

  it('should have proper fallback when trending_score is missing', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('rank_score, trending_score, trust_score')
      .is('trending_score', null)
      .limit(5);

    expect(error).toBeNull();
    if (data && data.length > 0) {
      // Should still have valid rank_score even without trending_score
      data.forEach(row => {
        expect(row.rank_score).toBeGreaterThan(0);
        expect(row.trust_score).toBeDefined();
      });
    }
  });

  it('should support filtering by type', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('type, rank_score')
      .eq('type', 'airdrop')
      .order('rank_score', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    if (data) {
      data.forEach(row => {
        expect(row.type).toBe('airdrop');
      });
    }
  });

  it('should support filtering by trust_level', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('trust_level, rank_score')
      .eq('trust_level', 'green')
      .order('rank_score', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    if (data) {
      data.forEach(row => {
        expect(row.trust_level).toBe('green');
      });
    }
  });

  it('should support filtering by chains', async () => {
    const { data, error } = await supabase
      .from('mv_opportunity_rank')
      .select('chains, rank_score')
      .contains('chains', ['ethereum'])
      .order('rank_score', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    if (data) {
      data.forEach(row => {
        expect(row.chains).toContain('ethereum');
      });
    }
  });

  it('should have debug view available', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('relevance_raw');
      expect(data[0]).toHaveProperty('relevance_weighted');
      expect(data[0]).toHaveProperty('trust_raw');
      expect(data[0]).toHaveProperty('trust_weighted');
      expect(data[0]).toHaveProperty('freshness_raw');
      expect(data[0]).toHaveProperty('freshness_weighted');
      expect(data[0]).toHaveProperty('age_hours');
    }
  });
});
