// Feature: hunter-demand-side, Property 21: Opportunity Serialization Round Trip
// Validates: Requirements 12.5

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Opportunity type matching database schema
 */
interface Opportunity {
  id: string;
  slug: string;
  title: string;
  protocol: string;
  type: 'airdrop' | 'quest' | 'staking' | 'yield' | 'points' | 'rwa' | 'strategy';
  chains: string[];
  
  // Rewards
  reward_min: number | null;
  reward_max: number | null;
  reward_currency: 'USD' | 'ETH' | 'POINTS';
  reward_confidence: 'confirmed' | 'estimated' | 'speculative';
  
  // Difficulty & time
  difficulty: 'easy' | 'medium' | 'hard';
  time_required: string | null;
  
  // Safety
  trust_score: number;
  is_verified: boolean;
  audited: boolean;
  
  // Timeline
  start_date: string;
  end_date: string | null;
  urgency: 'high' | 'medium' | 'low';
  
  // Requirements
  requirements: Record<string, any>;
  
  // Steps
  steps: any[];
  
  // Categorization
  category: string[];
  tags: string[];
  featured: boolean;
  
  // Live stats
  participants: number | null;
  apr: number | null;
  apy: number | null;
  tvl_usd: number | null;
  
  // Media
  thumbnail: string | null;
  banner: string | null;
  protocol_logo: string | null;
  
  // Source metadata
  source: string | null;
  source_ref: string | null;
  protocol_address: string | null;
  last_synced_at: string | null;
  
  // Module-specific fields
  underlying_assets: string[] | null;
  lockup_days: number | null;
  snapshot_date: string | null;
  claim_start: string | null;
  claim_end: string | null;
  airdrop_category: string | null;
  quest_steps: any | null;
  quest_difficulty: 'easy' | 'medium' | 'hard' | null;
  xp_reward: number | null;
  quest_type: string | null;
  points_program_name: string | null;
  conversion_hint: string | null;
  points_estimate_formula: string | null;
  issuer_name: string | null;
  jurisdiction: string | null;
  kyc_required: boolean | null;
  min_investment: number | null;
  liquidity_term_days: number | null;
  rwa_type: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Generator for valid opportunity objects
 */
const opportunityGenerator = fc.record({
  id: fc.uuid(),
  slug: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  protocol: fc.string({ minLength: 3, maxLength: 50 }),
  type: fc.constantFrom('airdrop', 'quest', 'staking', 'yield', 'points', 'rwa', 'strategy'),
  chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum', 'optimism', 'polygon'), { minLength: 1, maxLength: 5 }),
  
  // Rewards
  reward_min: fc.option(fc.float({ min: 0, max: 100000 }).filter(n => !isNaN(n))),
  reward_max: fc.option(fc.float({ min: 0, max: 100000 }).filter(n => !isNaN(n))),
  reward_currency: fc.constantFrom('USD', 'ETH', 'POINTS'),
  reward_confidence: fc.constantFrom('confirmed', 'estimated', 'speculative'),
  
  // Difficulty & time
  difficulty: fc.constantFrom('easy', 'medium', 'hard'),
  time_required: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
  
  // Safety
  trust_score: fc.integer({ min: 0, max: 100 }),
  is_verified: fc.boolean(),
  audited: fc.boolean(),
  
  // Timeline
  start_date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  end_date: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())),
  urgency: fc.constantFrom('high', 'medium', 'low'),
  
  // Requirements
  requirements: fc.record({
    chains: fc.option(fc.array(fc.string())),
    min_wallet_age_days: fc.option(fc.integer({ min: 0, max: 365 })),
    min_tx_count: fc.option(fc.integer({ min: 0, max: 1000 })),
    required_tokens: fc.option(fc.array(fc.string()))
  }),
  
  // Steps
  steps: fc.array(fc.record({
    step: fc.integer({ min: 1, max: 10 }),
    description: fc.string()
  })),
  
  // Categorization
  category: fc.array(fc.string(), { maxLength: 5 }),
  tags: fc.array(fc.string(), { maxLength: 10 }),
  featured: fc.boolean(),
  
  // Live stats
  participants: fc.option(fc.integer({ min: 0, max: 1000000 })),
  apr: fc.option(fc.float({ min: 0, max: 100 }).filter(n => !isNaN(n))),
  apy: fc.option(fc.float({ min: 0, max: 100 }).filter(n => !isNaN(n))),
  tvl_usd: fc.option(fc.float({ min: 0, max: 1000000000 }).filter(n => !isNaN(n))),
  
  // Media
  thumbnail: fc.option(fc.webUrl()),
  banner: fc.option(fc.webUrl()),
  protocol_logo: fc.option(fc.webUrl()),
  
  // Source metadata
  source: fc.option(fc.constantFrom('defillama', 'layer3', 'galxe', 'admin')),
  source_ref: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
  protocol_address: fc.option(fc.constant('0x' + 'a'.repeat(40))),
  last_synced_at: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())),
  
  // Module-specific fields
  underlying_assets: fc.option(fc.array(fc.string(), { maxLength: 5 })),
  lockup_days: fc.option(fc.integer({ min: 0, max: 365 })),
  snapshot_date: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())),
  claim_start: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())),
  claim_end: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())),
  airdrop_category: fc.option(fc.string()),
  quest_steps: fc.option(fc.jsonValue()),
  quest_difficulty: fc.option(fc.constantFrom('easy', 'medium', 'hard')),
  xp_reward: fc.option(fc.integer({ min: 0, max: 10000 })),
  quest_type: fc.option(fc.string()),
  points_program_name: fc.option(fc.string()),
  conversion_hint: fc.option(fc.string()),
  points_estimate_formula: fc.option(fc.string()),
  issuer_name: fc.option(fc.string()),
  jurisdiction: fc.option(fc.string()),
  kyc_required: fc.option(fc.boolean()),
  min_investment: fc.option(fc.float({ min: 0, max: 1000000 }).filter(n => !isNaN(n))),
  liquidity_term_days: fc.option(fc.integer({ min: 0, max: 365 })),
  rwa_type: fc.option(fc.string()),
  
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString())
});

/**
 * Serialize opportunity to JSON string
 */
function serializeOpportunity(opp: Opportunity): string {
  return JSON.stringify(opp);
}

/**
 * Deserialize JSON string to opportunity object
 */
function deserializeOpportunity(json: string): Opportunity {
  return JSON.parse(json);
}

/**
 * Deep equality check for opportunities
 */
function opportunitiesEqual(opp1: Opportunity, opp2: Opportunity): boolean {
  // Compare all fields
  const keys = Object.keys(opp1) as (keyof Opportunity)[];
  
  for (const key of keys) {
    const val1 = opp1[key];
    const val2 = opp2[key];
    
    // Handle null/undefined
    if (val1 === null && val2 === null) continue;
    if (val1 === undefined && val2 === undefined) continue;
    if (val1 === null || val2 === null) return false;
    if (val1 === undefined || val2 === undefined) return false;
    
    // Handle NaN values (JSON.stringify converts NaN to null)
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      if (isNaN(val1) && isNaN(val2)) continue;
      if (isNaN(val1) || isNaN(val2)) return false;
    }
    
    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      if (JSON.stringify(val1) !== JSON.stringify(val2)) return false;
      continue;
    }
    
    // Handle objects
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (JSON.stringify(val1) !== JSON.stringify(val2)) return false;
      continue;
    }
    
    // Handle primitives
    if (val1 !== val2) return false;
  }
  
  return true;
}

describe('Hunter Demand-Side: Opportunity Serialization', () => {
  test('Property 21: Opportunity Serialization Round Trip - parsing then printing then parsing produces equivalent object', () => {
    fc.assert(
      fc.property(
        opportunityGenerator,
        (opportunity) => {
          // Serialize to JSON
          const serialized = serializeOpportunity(opportunity);
          
          // Deserialize back to object
          const deserialized = deserializeOpportunity(serialized);
          
          // Verify round-trip produces equivalent object
          expect(opportunitiesEqual(opportunity, deserialized)).toBe(true);
          
          // Verify all required fields are preserved
          expect(deserialized.id).toBe(opportunity.id);
          expect(deserialized.slug).toBe(opportunity.slug);
          expect(deserialized.title).toBe(opportunity.title);
          expect(deserialized.protocol).toBe(opportunity.protocol);
          expect(deserialized.type).toBe(opportunity.type);
          expect(deserialized.trust_score).toBe(opportunity.trust_score);
          
          // Verify arrays are preserved
          expect(deserialized.chains).toEqual(opportunity.chains);
          expect(deserialized.category).toEqual(opportunity.category);
          expect(deserialized.tags).toEqual(opportunity.tags);
          expect(deserialized.steps).toEqual(opportunity.steps);
          
          // Verify JSONB fields are preserved
          expect(deserialized.requirements).toEqual(opportunity.requirements);
          
          // Verify optional fields are preserved
          if (opportunity.source !== null) {
            expect(deserialized.source).toBe(opportunity.source);
          }
          if (opportunity.source_ref !== null) {
            expect(deserialized.source_ref).toBe(opportunity.source_ref);
          }
          if (opportunity.last_synced_at !== null) {
            expect(deserialized.last_synced_at).toBe(opportunity.last_synced_at);
          }
          
          // Verify module-specific fields are preserved
          if (opportunity.apy !== null) {
            expect(deserialized.apy).toBe(opportunity.apy);
          }
          if (opportunity.tvl_usd !== null) {
            expect(deserialized.tvl_usd).toBe(opportunity.tvl_usd);
          }
          if (opportunity.underlying_assets !== null) {
            expect(deserialized.underlying_assets).toEqual(opportunity.underlying_assets);
          }
          if (opportunity.lockup_days !== null) {
            expect(deserialized.lockup_days).toBe(opportunity.lockup_days);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 21 (edge case): Empty arrays and null values are preserved', () => {
    const opportunity: Opportunity = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'test-opportunity',
      title: 'Test Opportunity',
      protocol: 'Test Protocol',
      type: 'yield',
      chains: [],
      reward_min: null,
      reward_max: null,
      reward_currency: 'USD',
      reward_confidence: 'estimated',
      difficulty: 'medium',
      time_required: null,
      trust_score: 80,
      is_verified: false,
      audited: false,
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: null,
      urgency: 'low',
      requirements: {},
      steps: [],
      category: [],
      tags: [],
      featured: false,
      participants: null,
      apr: null,
      apy: null,
      tvl_usd: null,
      thumbnail: null,
      banner: null,
      protocol_logo: null,
      source: null,
      source_ref: null,
      protocol_address: null,
      last_synced_at: null,
      underlying_assets: null,
      lockup_days: null,
      snapshot_date: null,
      claim_start: null,
      claim_end: null,
      airdrop_category: null,
      quest_steps: null,
      quest_difficulty: null,
      xp_reward: null,
      quest_type: null,
      points_program_name: null,
      conversion_hint: null,
      points_estimate_formula: null,
      issuer_name: null,
      jurisdiction: null,
      kyc_required: null,
      min_investment: null,
      liquidity_term_days: null,
      rwa_type: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    
    const serialized = serializeOpportunity(opportunity);
    const deserialized = deserializeOpportunity(serialized);
    
    expect(opportunitiesEqual(opportunity, deserialized)).toBe(true);
    expect(deserialized.chains).toEqual([]);
    expect(deserialized.steps).toEqual([]);
    expect(deserialized.reward_min).toBeNull();
    expect(deserialized.source).toBeNull();
  });
  
  test('Property 21 (edge case): Complex nested JSONB structures are preserved', () => {
    const opportunity: Opportunity = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'complex-opportunity',
      title: 'Complex Opportunity',
      protocol: 'Complex Protocol',
      type: 'quest',
      chains: ['ethereum', 'base'],
      reward_min: 100,
      reward_max: 500,
      reward_currency: 'USD',
      reward_confidence: 'confirmed',
      difficulty: 'hard',
      time_required: '2 hours',
      trust_score: 95,
      is_verified: true,
      audited: true,
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-12-31T23:59:59.999Z',
      urgency: 'high',
      requirements: {
        chains: ['ethereum', 'base'],
        min_wallet_age_days: 90,
        min_tx_count: 50,
        required_tokens: ['ETH', 'USDC'],
        nested: {
          deep: {
            value: 'test'
          }
        }
      },
      steps: [
        { step: 1, description: 'Connect wallet', metadata: { required: true } },
        { step: 2, description: 'Complete transaction', metadata: { required: true, gas_estimate: 0.001 } }
      ],
      category: ['defi', 'yield'],
      tags: ['high-apy', 'audited', 'verified'],
      featured: true,
      participants: 10000,
      apr: 12.5,
      apy: 13.2,
      tvl_usd: 5000000,
      thumbnail: 'https://example.com/thumb.png',
      banner: 'https://example.com/banner.png',
      protocol_logo: 'https://example.com/logo.png',
      source: 'defillama',
      source_ref: 'aave-eth-usdc',
      protocol_address: '0x' + 'a'.repeat(40),
      last_synced_at: '2024-01-15T12:00:00.000Z',
      underlying_assets: ['ETH', 'USDC'],
      lockup_days: 30,
      snapshot_date: null,
      claim_start: null,
      claim_end: null,
      airdrop_category: null,
      quest_steps: {
        total: 5,
        completed: 2,
        steps: [
          { id: 1, name: 'Step 1', completed: true },
          { id: 2, name: 'Step 2', completed: true },
          { id: 3, name: 'Step 3', completed: false }
        ]
      },
      quest_difficulty: 'hard',
      xp_reward: 1000,
      quest_type: 'multi-step',
      points_program_name: null,
      conversion_hint: null,
      points_estimate_formula: null,
      issuer_name: null,
      jurisdiction: null,
      kyc_required: null,
      min_investment: null,
      liquidity_term_days: null,
      rwa_type: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-15T12:00:00.000Z'
    };
    
    const serialized = serializeOpportunity(opportunity);
    const deserialized = deserializeOpportunity(serialized);
    
    expect(opportunitiesEqual(opportunity, deserialized)).toBe(true);
    expect(deserialized.requirements).toEqual(opportunity.requirements);
    expect(deserialized.steps).toEqual(opportunity.steps);
    expect(deserialized.quest_steps).toEqual(opportunity.quest_steps);
  });
});
