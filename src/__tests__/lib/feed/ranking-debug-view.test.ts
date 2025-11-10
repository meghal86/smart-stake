/**
 * Tests for vw_opportunity_rank_debug view
 * 
 * This test suite verifies that the debug view is accessible and provides
 * the necessary observability data for A/B testing and ranking analysis.
 * 
 * Requirements: 3.1-3.6 (Personalized Feed Ranking)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('vw_opportunity_rank_debug View', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  it('should be accessible to anonymous users', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should expose all ranking components', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        id,
        slug,
        title,
        type,
        trust_score,
        trust_level,
        difficulty,
        featured,
        sponsored,
        urgency,
        relevance_raw,
        relevance_weighted,
        trust_raw,
        trust_weighted,
        freshness_raw,
        freshness_weighted,
        rank_score
      `)
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      const row = data[0];
      
      // Verify all components are present
      expect(row).toHaveProperty('relevance_raw');
      expect(row).toHaveProperty('relevance_weighted');
      expect(row).toHaveProperty('trust_raw');
      expect(row).toHaveProperty('trust_weighted');
      expect(row).toHaveProperty('freshness_raw');
      expect(row).toHaveProperty('freshness_weighted');
      expect(row).toHaveProperty('rank_score');
    }
  });

  it('should show weighted components match the formula', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        relevance_raw,
        relevance_weighted,
        trust_raw,
        trust_weighted,
        freshness_raw,
        freshness_weighted,
        rank_score
      `)
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      data.forEach((row) => {
        // Verify weights are applied correctly
        expect(row.relevance_weighted).toBeCloseTo(row.relevance_raw * 0.60, 5);
        expect(row.trust_weighted).toBeCloseTo(row.trust_raw * 0.25, 5);
        expect(row.freshness_weighted).toBeCloseTo(row.freshness_raw * 0.15, 5);
        
        // Verify final score is sum of weighted components
        const expectedRankScore = 
          row.relevance_weighted + 
          row.trust_weighted + 
          row.freshness_weighted;
        
        expect(row.rank_score).toBeCloseTo(expectedRankScore, 5);
      });
    }
  });

  it('should include trending metrics for observability', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        id,
        trending_score,
        impressions,
        clicks,
        ctr
      `)
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      data.forEach((row) => {
        // Verify trending metrics are present (may be null)
        expect(row).toHaveProperty('trending_score');
        expect(row).toHaveProperty('impressions');
        expect(row).toHaveProperty('clicks');
        expect(row).toHaveProperty('ctr');
        
        // If impressions exist, verify CTR calculation
        if (row.impressions && row.impressions > 0) {
          const expectedCtr = row.clicks / row.impressions;
          expect(row.ctr).toBeCloseTo(expectedCtr, 5);
        }
      });
    }
  });

  it('should include age metrics for debugging', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        id,
        published_at,
        expires_at,
        age_hours,
        time_left_hours
      `)
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      data.forEach((row) => {
        // Verify age_hours is present and positive
        expect(row).toHaveProperty('age_hours');
        if (row.age_hours !== null) {
          expect(row.age_hours).toBeGreaterThanOrEqual(0);
        }
        
        // Verify time_left_hours is present (may be null if no expiry)
        expect(row).toHaveProperty('time_left_hours');
      });
    }
  });

  it('should support filtering for A/B analysis', async () => {
    // Test filtering by type
    const { data: airdropData, error: airdropError } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('id, type, rank_score')
      .eq('type', 'airdrop')
      .limit(5);

    expect(airdropError).toBeNull();
    expect(airdropData).toBeDefined();
    
    if (airdropData && airdropData.length > 0) {
      airdropData.forEach((row) => {
        expect(row.type).toBe('airdrop');
      });
    }

    // Test filtering by trust level
    const { data: greenData, error: greenError } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('id, trust_level, rank_score')
      .eq('trust_level', 'green')
      .limit(5);

    expect(greenError).toBeNull();
    expect(greenData).toBeDefined();
    
    if (greenData && greenData.length > 0) {
      greenData.forEach((row) => {
        expect(row.trust_level).toBe('green');
      });
    }
  });

  it('should support ordering by different components', async () => {
    // Order by relevance
    const { data: relevanceData, error: relevanceError } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('id, relevance_raw, rank_score')
      .order('relevance_raw', { ascending: false })
      .limit(5);

    expect(relevanceError).toBeNull();
    expect(relevanceData).toBeDefined();
    
    if (relevanceData && relevanceData.length > 1) {
      // Verify descending order
      for (let i = 0; i < relevanceData.length - 1; i++) {
        expect(relevanceData[i].relevance_raw).toBeGreaterThanOrEqual(
          relevanceData[i + 1].relevance_raw
        );
      }
    }

    // Order by trust
    const { data: trustData, error: trustError } = await supabase
      .from('vw_opportunity_rank_debug')
      .select('id, trust_raw, rank_score')
      .order('trust_raw', { ascending: false })
      .limit(5);

    expect(trustError).toBeNull();
    expect(trustData).toBeDefined();
    
    if (trustData && trustData.length > 1) {
      // Verify descending order
      for (let i = 0; i < trustData.length - 1; i++) {
        expect(trustData[i].trust_raw).toBeGreaterThanOrEqual(
          trustData[i + 1].trust_raw
        );
      }
    }
  });

  it('should enable comparison of different ranking formulas', async () => {
    // Fetch data with all components
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        id,
        slug,
        relevance_raw,
        trust_raw,
        freshness_raw,
        rank_score
      `)
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      // Simulate alternative ranking formula: 50% relevance, 30% trust, 20% freshness
      const alternativeRankings = data.map((row) => ({
        id: row.id,
        slug: row.slug,
        current_score: row.rank_score,
        alternative_score: 
          row.relevance_raw * 0.50 + 
          row.trust_raw * 0.30 + 
          row.freshness_raw * 0.20,
      }));

      // Verify we can compute alternative rankings
      alternativeRankings.forEach((ranking) => {
        expect(ranking.alternative_score).toBeGreaterThanOrEqual(0);
        expect(ranking.alternative_score).toBeLessThanOrEqual(1);
      });

      // Sort by alternative score
      const sortedByAlternative = [...alternativeRankings].sort(
        (a, b) => b.alternative_score - a.alternative_score
      );

      // Verify sorting works
      expect(sortedByAlternative.length).toBe(alternativeRankings.length);
    }
  });

  it('should show component ranges are valid', async () => {
    const { data, error } = await supabase
      .from('vw_opportunity_rank_debug')
      .select(`
        relevance_raw,
        trust_raw,
        freshness_raw,
        rank_score
      `)
      .limit(20);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      data.forEach((row) => {
        // All components should be between 0 and 1
        expect(row.relevance_raw).toBeGreaterThanOrEqual(0);
        expect(row.relevance_raw).toBeLessThanOrEqual(1);
        
        expect(row.trust_raw).toBeGreaterThanOrEqual(0);
        expect(row.trust_raw).toBeLessThanOrEqual(1);
        
        expect(row.freshness_raw).toBeGreaterThanOrEqual(0);
        expect(row.freshness_raw).toBeLessThanOrEqual(1);
        
        // Final rank score should also be between 0 and 1
        expect(row.rank_score).toBeGreaterThanOrEqual(0);
        expect(row.rank_score).toBeLessThanOrEqual(1);
      });
    }
  });
});
