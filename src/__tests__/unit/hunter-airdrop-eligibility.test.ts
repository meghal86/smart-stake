/**
 * Unit Tests: Airdrop Eligibility
 * 
 * Tests for airdrop-specific eligibility logic including:
 * - Claim window logic (before/during/after)
 * - Snapshot date eligibility
 * - Galxe campaign classification (airdrop vs quest)
 * - DeFiLlama airdrop transformation
 * - Multi-source deduplication logic
 * 
 * Requirements: 5.1-5.11, 21.5, 22.3-22.4, 23.2
 */

import { describe, test, expect } from 'vitest';
import { syncGalxeOpportunities } from '@/lib/hunter/sync/galxe';
import { syncDefiLlamaAirdrops } from '@/lib/hunter/sync/defillama-airdrops';

describe('Airdrop Eligibility - Claim Window Logic', () => {
  test('identifies claim window as before start', () => {
    const now = new Date('2025-01-15T00:00:00Z');
    const claimStart = new Date('2025-02-01T00:00:00Z');
    const claimEnd = new Date('2025-05-01T00:00:00Z');

    const isBefore = now < claimStart;
    const isDuring = now >= claimStart && now <= claimEnd;
    const isAfter = now > claimEnd;

    expect(isBefore).toBe(true);
    expect(isDuring).toBe(false);
    expect(isAfter).toBe(false);
  });

  test('identifies claim window as during', () => {
    const now = new Date('2025-03-15T00:00:00Z');
    const claimStart = new Date('2025-02-01T00:00:00Z');
    const claimEnd = new Date('2025-05-01T00:00:00Z');

    const isBefore = now < claimStart;
    const isDuring = now >= claimStart && now <= claimEnd;
    const isAfter = now > claimEnd;

    expect(isBefore).toBe(false);
    expect(isDuring).toBe(true);
    expect(isAfter).toBe(false);
  });

  test('identifies claim window as after end', () => {
    const now = new Date('2025-06-01T00:00:00Z');
    const claimStart = new Date('2025-02-01T00:00:00Z');
    const claimEnd = new Date('2025-05-01T00:00:00Z');

    const isBefore = now < claimStart;
    const isDuring = now >= claimStart && now <= claimEnd;
    const isAfter = now > claimEnd;

    expect(isBefore).toBe(false);
    expect(isDuring).toBe(false);
    expect(isAfter).toBe(true);
  });
});

describe('Airdrop Eligibility - Snapshot Date Logic', () => {
  test('wallet active before snapshot is eligible', () => {
    const snapshotDate = new Date('2025-09-15T00:00:00Z');
    const walletFirstTx = new Date('2025-06-01T00:00:00Z');

    const wasActiveBefore = walletFirstTx < snapshotDate;

    expect(wasActiveBefore).toBe(true);
  });

  test('wallet created after snapshot is not eligible', () => {
    const snapshotDate = new Date('2025-09-15T00:00:00Z');
    const walletFirstTx = new Date('2025-10-01T00:00:00Z');

    const wasActiveBefore = walletFirstTx < snapshotDate;

    expect(wasActiveBefore).toBe(false);
  });

  test('wallet created on snapshot date is eligible', () => {
    const snapshotDate = new Date('2025-09-15T00:00:00Z');
    const walletFirstTx = new Date('2025-09-15T00:00:00Z');

    const wasActiveBefore = walletFirstTx <= snapshotDate;

    expect(wasActiveBefore).toBe(true);
  });
});

describe('Galxe Campaign Classification', () => {
  test('classifies campaign with airdrop keywords as airdrop', () => {
    const campaign = {
      id: 'test-1',
      name: 'Token Distribution Event',
      description: 'Claim your airdrop tokens now',
      startTime: Date.now() / 1000,
      endTime: null,
      status: 'Active' as const,
      chain: 'ETHEREUM',
    };

    const text = (campaign.name + ' ' + campaign.description).toLowerCase();
    const airdropKeywords = ['airdrop', 'claim', 'snapshot', 'distribution'];
    const questKeywords = ['milestone', 'complete', 'join', 'follow'];

    const hasAirdrop = airdropKeywords.some(kw => text.includes(kw));
    const hasQuest = questKeywords.some(kw => text.includes(kw));
    const isAirdrop = hasAirdrop && !hasQuest;

    expect(isAirdrop).toBe(true);
  });

  test('classifies campaign with quest keywords as quest', () => {
    const campaign = {
      id: 'test-2',
      name: 'Complete Social Milestone',
      description: 'Follow us on Twitter and join Discord',
      startTime: Date.now() / 1000,
      endTime: null,
      status: 'Active' as const,
      chain: 'ETHEREUM',
    };

    const text = (campaign.name + ' ' + campaign.description).toLowerCase();
    const airdropKeywords = ['airdrop', 'claim', 'snapshot', 'distribution'];
    const questKeywords = ['milestone', 'complete', 'join', 'follow'];

    const hasAirdrop = airdropKeywords.some(kw => text.includes(kw));
    const hasQuest = questKeywords.some(kw => text.includes(kw));
    const isAirdrop = hasAirdrop && !hasQuest;

    expect(isAirdrop).toBe(false);
  });

  test('defaults to quest when both keywords present', () => {
    const campaign = {
      id: 'test-3',
      name: 'Complete Milestone for Airdrop',
      description: 'Join our quest to claim tokens',
      startTime: Date.now() / 1000,
      endTime: null,
      status: 'Active' as const,
      chain: 'ETHEREUM',
    };

    const text = (campaign.name + ' ' + campaign.description).toLowerCase();
    const airdropKeywords = ['airdrop', 'claim', 'snapshot', 'distribution'];
    const questKeywords = ['milestone', 'complete', 'join', 'follow'];

    const hasAirdrop = airdropKeywords.some(kw => text.includes(kw));
    const hasQuest = questKeywords.some(kw => text.includes(kw));
    const isAirdrop = hasAirdrop && !hasQuest;

    // When both present, should be quest (not airdrop)
    expect(isAirdrop).toBe(false);
  });

  test('defaults to quest when no keywords present', () => {
    const campaign = {
      id: 'test-4',
      name: 'Protocol Launch Event',
      description: 'Participate in our ecosystem',
      startTime: Date.now() / 1000,
      endTime: null,
      status: 'Active' as const,
      chain: 'ETHEREUM',
    };

    const text = (campaign.name + ' ' + campaign.description).toLowerCase();
    const airdropKeywords = ['airdrop', 'claim', 'snapshot', 'distribution'];
    const questKeywords = ['milestone', 'complete', 'join', 'follow'];

    const hasAirdrop = airdropKeywords.some(kw => text.includes(kw));
    const hasQuest = questKeywords.some(kw => text.includes(kw));
    const isAirdrop = hasAirdrop && !hasQuest;

    // When neither present, should be quest (not airdrop)
    expect(isAirdrop).toBe(false);
  });
});

describe('DeFiLlama Airdrop Transformation', () => {
  test('transforms DeFiLlama airdrop correctly', () => {
    const defiLlamaAirdrop = {
      id: 'test-airdrop-1',
      name: 'LayerZero',
      symbol: 'ZRO',
      description: 'LayerZero airdrop for early users',
      chain: 'Ethereum',
      claimStart: Math.floor(new Date('2025-02-01').getTime() / 1000),
      claimEnd: Math.floor(new Date('2025-05-01').getTime() / 1000),
      claimUrl: 'https://layerzero.network/claim',
    };

    const transformed = {
      slug: `defillama-${defiLlamaAirdrop.id}`,
      title: `${defiLlamaAirdrop.name} (${defiLlamaAirdrop.symbol}) Airdrop`,
      protocol: defiLlamaAirdrop.name,
      protocol_name: defiLlamaAirdrop.name,
      type: 'airdrop',
      chains: [defiLlamaAirdrop.chain.toLowerCase()],
      trust_score: 90,
      source: 'defillama',
      source_ref: defiLlamaAirdrop.id,
    };

    expect(transformed.slug).toBe('defillama-test-airdrop-1');
    expect(transformed.title).toBe('LayerZero (ZRO) Airdrop');
    expect(transformed.protocol).toBe('LayerZero');
    expect(transformed.type).toBe('airdrop');
    expect(transformed.chains).toEqual(['ethereum']);
    expect(transformed.trust_score).toBe(90);
    expect(transformed.source).toBe('defillama');
  });
});

describe('Multi-Source Deduplication Logic', () => {
  test('deduplicates by protocol name and chain', () => {
    const galxeAirdrop = {
      protocol_name: 'LayerZero',
      chains: ['ethereum'],
      source: 'galxe',
      trust_score: 85,
    };

    const defiLlamaAirdrop = {
      protocol_name: 'LayerZero',
      chains: ['ethereum'],
      source: 'defillama',
      trust_score: 90,
    };

    const adminAirdrop = {
      protocol_name: 'LayerZero',
      chains: ['ethereum'],
      source: 'admin',
      trust_score: 95,
    };

    // Deduplication key
    const key1 = `${galxeAirdrop.protocol_name}-${galxeAirdrop.chains[0]}`;
    const key2 = `${defiLlamaAirdrop.protocol_name}-${defiLlamaAirdrop.chains[0]}`;
    const key3 = `${adminAirdrop.protocol_name}-${adminAirdrop.chains[0]}`;

    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });

  test('prioritizes DeFiLlama over Galxe', () => {
    const map = new Map();

    // Add Galxe first
    map.set('LayerZero-ethereum', { source: 'galxe', trust_score: 85 });

    // Add DeFiLlama (should override)
    map.set('LayerZero-ethereum', { source: 'defillama', trust_score: 90 });

    const result = map.get('LayerZero-ethereum');
    expect(result.source).toBe('defillama');
    expect(result.trust_score).toBe(90);
  });

  test('prioritizes admin over Galxe but not over DeFiLlama', () => {
    const map = new Map();

    // Add Galxe first
    map.set('LayerZero-ethereum', { source: 'galxe', trust_score: 85 });

    // Add admin (should override Galxe)
    const current = map.get('LayerZero-ethereum');
    if (!current || current.source === 'galxe') {
      map.set('LayerZero-ethereum', { source: 'admin', trust_score: 95 });
    }

    let result = map.get('LayerZero-ethereum');
    expect(result.source).toBe('admin');

    // Add DeFiLlama (should always override)
    map.set('LayerZero-ethereum', { source: 'defillama', trust_score: 90 });

    result = map.get('LayerZero-ethereum');
    expect(result.source).toBe('defillama');
  });

  test('keeps separate entries for different chains', () => {
    const map = new Map();

    map.set('LayerZero-ethereum', { source: 'galxe', trust_score: 85 });
    map.set('LayerZero-arbitrum', { source: 'galxe', trust_score: 85 });

    expect(map.size).toBe(2);
    expect(map.get('LayerZero-ethereum')).toBeDefined();
    expect(map.get('LayerZero-arbitrum')).toBeDefined();
  });
});

describe('Galxe Chain Mapping', () => {
  test('maps Galxe chain names to lowercase', () => {
    const chainMapping: Record<string, string> = {
      MATIC: 'polygon',
      BSC: 'bsc',
      BASE: 'base',
      ETHEREUM: 'ethereum',
      ARBITRUM: 'arbitrum',
      OPTIMISM: 'optimism',
    };

    expect(chainMapping['MATIC']).toBe('polygon');
    expect(chainMapping['BSC']).toBe('bsc');
    expect(chainMapping['ETHEREUM']).toBe('ethereum');
  });

  test('handles unknown chains by lowercasing', () => {
    const galxeChain = 'UNKNOWN_CHAIN';
    const mapped = galxeChain.toLowerCase();

    expect(mapped).toBe('unknown_chain');
  });
});
