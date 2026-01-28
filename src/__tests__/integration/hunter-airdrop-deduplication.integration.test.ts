/**
 * Integration Tests: Airdrop Deduplication
 * 
 * Tests the complete deduplication flow across multiple sources:
 * - Galxe airdrops
 * - DeFiLlama airdrops
 * - Admin-seeded airdrops
 * 
 * Validates:
 * - Deduplication key generation (protocol_name + chain)
 * - Priority ordering (DeFiLlama > Admin > Galxe)
 * - Correct source selection when duplicates exist
 * - Trust score preservation from highest priority source
 * 
 * Requirements: 2.2, 21.1-21.10, 23.1-23.6
 */

import { describe, test, expect } from 'vitest';
import type { SyncOpportunity } from '../../lib/hunter/sync/galxe';

/**
 * Deduplication function (copied from airdrops.ts for testing)
 */
function deduplicateAirdrops(
  galxe: SyncOpportunity[],
  defillama: SyncOpportunity[],
  admin: SyncOpportunity[]
): SyncOpportunity[] {
  const map = new Map<string, SyncOpportunity>();

  // Process in reverse priority order (lowest to highest)
  
  // 1. Galxe (lowest priority)
  for (const opp of galxe) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    map.set(key, opp);
  }

  // 2. Admin (medium priority - curated but may overlap)
  for (const opp of admin) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    // Only override if Galxe or not exists
    if (!map.has(key) || map.get(key)!.source === 'galxe') {
      map.set(key, opp);
    }
  }

  // 3. DeFiLlama (highest priority - most trusted)
  for (const opp of defillama) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    // Always use DeFiLlama if exists (highest trust)
    map.set(key, opp);
  }

  return Array.from(map.values());
}

describe('Airdrop Deduplication Integration', () => {
  test('deduplicates identical airdrops from all three sources', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'layerzero-airdrop-galxe',
        title: 'LayerZero Airdrop',
        description: 'Claim your LayerZero tokens',
        protocol_name: 'LayerZero',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZRO',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-layerzero-123',
        requirements: {},
        tags: ['airdrop', 'defi'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [
      {
        slug: 'layerzero-airdrop-defillama',
        title: 'LayerZero (ZRO) Airdrop',
        description: 'Official LayerZero token distribution',
        protocol_name: 'LayerZero',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZRO',
        trust_score: 90,
        source: 'defillama',
        source_ref: 'defillama-layerzero-456',
        requirements: {},
        tags: ['airdrop', 'verified'],
        featured: true,
        status: 'published',
      },
    ];

    const adminAirdrops: SyncOpportunity[] = [
      {
        slug: 'layerzero-airdrop-admin',
        title: 'LayerZero Airdrop (Curated)',
        description: 'Curated LayerZero airdrop opportunity',
        protocol_name: 'LayerZero',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZRO',
        trust_score: 95,
        source: 'admin',
        source_ref: 'admin-layerzero-789',
        requirements: {},
        tags: ['airdrop', 'curated'],
        featured: true,
        status: 'published',
      },
    ];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return only 1 airdrop (DeFiLlama has highest priority)
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('defillama');
    expect(result[0].trust_score).toBe(90);
    expect(result[0].source_ref).toBe('defillama-layerzero-456');
  });

  test('keeps all airdrops when no duplicates exist', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'arbitrum-airdrop',
        title: 'Arbitrum Airdrop',
        description: 'Claim ARB tokens',
        protocol_name: 'Arbitrum',
        type: 'airdrop',
        chains: ['arbitrum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ARB',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-arbitrum-123',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [
      {
        slug: 'optimism-airdrop',
        title: 'Optimism Airdrop',
        description: 'Claim OP tokens',
        protocol_name: 'Optimism',
        type: 'airdrop',
        chains: ['optimism'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'OP',
        trust_score: 90,
        source: 'defillama',
        source_ref: 'defillama-optimism-456',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const adminAirdrops: SyncOpportunity[] = [
      {
        slug: 'base-airdrop',
        title: 'Base Airdrop',
        description: 'Claim BASE tokens',
        protocol_name: 'Base',
        type: 'airdrop',
        chains: ['base'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'BASE',
        trust_score: 95,
        source: 'admin',
        source_ref: 'admin-base-789',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return all 3 airdrops (no duplicates)
    expect(result).toHaveLength(3);
    expect(result.map(r => r.source).sort()).toEqual(['admin', 'defillama', 'galxe']);
  });

  test('admin overrides galxe but not defillama', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'starknet-airdrop-galxe',
        title: 'Starknet Airdrop',
        description: 'Claim STRK tokens',
        protocol_name: 'Starknet',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'STRK',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-starknet-123',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [];

    const adminAirdrops: SyncOpportunity[] = [
      {
        slug: 'starknet-airdrop-admin',
        title: 'Starknet Airdrop (Curated)',
        description: 'Official Starknet token distribution',
        protocol_name: 'Starknet',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'STRK',
        trust_score: 95,
        source: 'admin',
        source_ref: 'admin-starknet-789',
        requirements: {},
        tags: ['airdrop', 'curated'],
        featured: true,
        status: 'published',
      },
    ];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return admin version (overrides Galxe)
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('admin');
    expect(result[0].trust_score).toBe(95);
  });

  test('defillama always wins when present', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'zksync-airdrop-galxe',
        title: 'zkSync Airdrop',
        description: 'Claim ZK tokens',
        protocol_name: 'zkSync',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZK',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-zksync-123',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [
      {
        slug: 'zksync-airdrop-defillama',
        title: 'zkSync (ZK) Airdrop',
        description: 'Official zkSync token distribution',
        protocol_name: 'zkSync',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZK',
        trust_score: 90,
        source: 'defillama',
        source_ref: 'defillama-zksync-456',
        requirements: {},
        tags: ['airdrop', 'verified'],
        featured: true,
        status: 'published',
      },
    ];

    const adminAirdrops: SyncOpportunity[] = [
      {
        slug: 'zksync-airdrop-admin',
        title: 'zkSync Airdrop (Curated)',
        description: 'Curated zkSync airdrop',
        protocol_name: 'zkSync',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'ZK',
        trust_score: 95,
        source: 'admin',
        source_ref: 'admin-zksync-789',
        requirements: {},
        tags: ['airdrop', 'curated'],
        featured: true,
        status: 'published',
      },
    ];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return DeFiLlama version (highest priority)
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('defillama');
    expect(result[0].trust_score).toBe(90);
  });

  test('handles multiple duplicates across different chains', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'uniswap-airdrop-eth',
        title: 'Uniswap Airdrop (Ethereum)',
        description: 'Claim UNI on Ethereum',
        protocol_name: 'Uniswap',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'UNI',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-uniswap-eth',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
      {
        slug: 'uniswap-airdrop-arb',
        title: 'Uniswap Airdrop (Arbitrum)',
        description: 'Claim UNI on Arbitrum',
        protocol_name: 'Uniswap',
        type: 'airdrop',
        chains: ['arbitrum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'UNI',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-uniswap-arb',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [
      {
        slug: 'uniswap-airdrop-eth-defillama',
        title: 'Uniswap (UNI) Airdrop',
        description: 'Official Uniswap distribution',
        protocol_name: 'Uniswap',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'UNI',
        trust_score: 90,
        source: 'defillama',
        source_ref: 'defillama-uniswap-eth',
        requirements: {},
        tags: ['airdrop', 'verified'],
        featured: true,
        status: 'published',
      },
    ];

    const adminAirdrops: SyncOpportunity[] = [];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return 2 airdrops:
    // - Uniswap-ethereum from DeFiLlama (overrides Galxe)
    // - Uniswap-arbitrum from Galxe (no duplicate)
    expect(result).toHaveLength(2);
    
    const ethAirdrop = result.find(r => r.chains[0] === 'ethereum');
    const arbAirdrop = result.find(r => r.chains[0] === 'arbitrum');

    expect(ethAirdrop?.source).toBe('defillama');
    expect(arbAirdrop?.source).toBe('galxe');
  });

  test('handles empty source arrays', () => {
    const galxeAirdrops: SyncOpportunity[] = [];
    const defiLlamaAirdrops: SyncOpportunity[] = [];
    const adminAirdrops: SyncOpportunity[] = [];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    expect(result).toHaveLength(0);
  });

  test('handles single source with multiple airdrops', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'airdrop-1',
        title: 'Airdrop 1',
        description: 'First airdrop',
        protocol_name: 'Protocol1',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'TOKEN1',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-1',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
      {
        slug: 'airdrop-2',
        title: 'Airdrop 2',
        description: 'Second airdrop',
        protocol_name: 'Protocol2',
        type: 'airdrop',
        chains: ['base'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'TOKEN2',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-2',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
      {
        slug: 'airdrop-3',
        title: 'Airdrop 3',
        description: 'Third airdrop',
        protocol_name: 'Protocol3',
        type: 'airdrop',
        chains: ['arbitrum'],
        reward_min: null,
        reward_max: null,
        reward_currency: 'TOKEN3',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-3',
        requirements: {},
        tags: ['airdrop'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [];
    const adminAirdrops: SyncOpportunity[] = [];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return all 3 airdrops (no duplicates)
    expect(result).toHaveLength(3);
    expect(result.every(r => r.source === 'galxe')).toBe(true);
  });

  test('preserves all fields from winning source', () => {
    const galxeAirdrops: SyncOpportunity[] = [
      {
        slug: 'test-airdrop-galxe',
        title: 'Test Airdrop (Galxe)',
        description: 'Galxe description',
        protocol_name: 'TestProtocol',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 100,
        reward_max: 1000,
        reward_currency: 'TEST',
        trust_score: 85,
        source: 'galxe',
        source_ref: 'galxe-test',
        requirements: { min_wallet_age_days: 30 },
        tags: ['airdrop', 'galxe'],
        featured: false,
        status: 'published',
      },
    ];

    const defiLlamaAirdrops: SyncOpportunity[] = [
      {
        slug: 'test-airdrop-defillama',
        title: 'Test Airdrop (DeFiLlama)',
        description: 'DeFiLlama description',
        protocol_name: 'TestProtocol',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 200,
        reward_max: 2000,
        reward_currency: 'TEST',
        trust_score: 90,
        source: 'defillama',
        source_ref: 'defillama-test',
        requirements: { min_wallet_age_days: 60 },
        tags: ['airdrop', 'verified'],
        featured: true,
        status: 'published',
      },
    ];

    const adminAirdrops: SyncOpportunity[] = [];

    const result = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

    // Should return DeFiLlama version with all its fields
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(defiLlamaAirdrops[0]);
    expect(result[0].title).toBe('Test Airdrop (DeFiLlama)');
    expect(result[0].description).toBe('DeFiLlama description');
    expect(result[0].reward_min).toBe(200);
    expect(result[0].reward_max).toBe(2000);
    expect(result[0].featured).toBe(true);
    expect(result[0].requirements).toEqual({ min_wallet_age_days: 60 });
  });
});
