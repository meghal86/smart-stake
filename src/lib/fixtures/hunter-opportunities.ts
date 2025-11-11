/**
 * Test Fixtures for Hunter Screen Opportunities
 * 
 * Provides deterministic test data for E2E testing
 * 
 * Requirements:
 * - 15.1: Deterministic dataset for testing
 * - 15.2: All opportunity types included
 * - 15.3: Various trust levels and eligibility states
 * - 15.4: Edge cases (Red trust, geo-gated, expired, zero-reward, sponsored, duplicates)
 */

import { Opportunity } from '@/types/hunter';

/**
 * Generate deterministic fixture opportunities
 * Returns the same data on every call for consistent E2E testing
 */
export function getFixtureOpportunities(): Opportunity[] {
  const baseTimestamp = new Date('2025-01-15T00:00:00Z');
  
  return [
    // 1. Standard Airdrop - Green Trust, Likely Eligible
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      slug: 'fixture-airdrop-green',
      title: 'Test Airdrop - Green Trust',
      description: 'A standard airdrop opportunity with green trust score',
      protocol: {
        name: 'TestProtocol',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['ethereum', 'base'],
      reward: {
        min: 100,
        max: 500,
        currency: 'USD',
        confidence: 'confirmed',
      },
      trust: {
        score: 95,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 2 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      eligibility_preview: {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet active on Ethereum', 'Sufficient transaction history'],
      },
      featured: true,
      sponsored: false,
      time_left_sec: 604800, // 7 days
      external_url: 'https://example.com/airdrop1',
      badges: [{ type: 'featured', label: 'Featured' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 604800000).toISOString(),
    },

    // 2. Quest - Amber Trust, Maybe Eligible
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      slug: 'fixture-quest-amber',
      title: 'Test Quest - Amber Trust',
      description: 'A quest with amber trust level',
      protocol: {
        name: 'QuestDAO',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'quest',
      chains: ['arbitrum'],
      reward: {
        min: 50,
        max: 200,
        currency: 'POINTS',
        confidence: 'estimated',
      },
      trust: {
        score: 72,
        level: 'amber',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 5 * 3600000).toISOString(),
        issues: ['Unverified smart contract', 'Limited audit history'],
      },
      difficulty: 'medium',
      eligibility_preview: {
        status: 'maybe',
        score: 0.55,
        reasons: ['Wallet not active on Arbitrum', 'Moderate transaction count'],
      },
      featured: false,
      sponsored: false,
      time_left_sec: 172800, // 2 days
      external_url: 'https://example.com/quest1',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 172800000).toISOString(),
      urgency: 'ending_soon',
    },

    // 3. RED TRUST - Hidden by default, requires consent
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      slug: 'fixture-airdrop-red',
      title: 'Test Airdrop - Red Trust (Risky)',
      description: 'A risky opportunity with red trust score',
      protocol: {
        name: 'SuspiciousProtocol',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['ethereum'],
      reward: {
        min: 1000,
        max: 5000,
        currency: 'USD',
        confidence: 'estimated',
      },
      trust: {
        score: 35,
        level: 'red',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 1 * 3600000).toISOString(),
        issues: [
          'Unverified contract',
          'Suspicious token permissions',
          'No audit available',
          'Recent security incidents',
        ],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: false,
      time_left_sec: 86400, // 1 day
      external_url: 'https://example.com/risky',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 86400000).toISOString(),
    },

    // 4. Staking/Yield - APY reward
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      slug: 'fixture-staking-apy',
      title: 'Test Staking Pool - High APY',
      description: 'Staking opportunity with APY rewards',
      protocol: {
        name: 'YieldFarm',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'staking',
      chains: ['ethereum', 'polygon'],
      reward: {
        min: 12.5,
        max: 18.3,
        currency: 'APY',
        confidence: 'confirmed',
      },
      apr: 15.2,
      trust: {
        score: 88,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 3 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'medium',
      featured: false,
      sponsored: false,
      external_url: 'https://example.com/staking',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
    },

    // 5. SPONSORED - First sponsored item
    {
      id: 'f1000000-0000-0000-0000-000000000005',
      slug: 'fixture-sponsored-1',
      title: 'Sponsored Opportunity #1',
      description: 'A sponsored listing',
      protocol: {
        name: 'SponsorCorp',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['base'],
      reward: {
        min: 200,
        max: 800,
        currency: 'TOKEN',
        confidence: 'confirmed',
      },
      trust: {
        score: 90,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 1 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: true,
      time_left_sec: 259200, // 3 days
      external_url: 'https://example.com/sponsored1',
      badges: [{ type: 'sponsored', label: 'Sponsored' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 259200000).toISOString(),
    },

    // 6. Points/Loyalty program
    {
      id: 'f1000000-0000-0000-0000-000000000006',
      slug: 'fixture-points-program',
      title: 'Test Points Program',
      description: 'Earn loyalty points',
      protocol: {
        name: 'PointsDAO',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'points',
      chains: ['optimism'],
      reward: {
        min: 1000,
        max: 5000,
        currency: 'POINTS',
        confidence: 'confirmed',
      },
      trust: {
        score: 82,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 4 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: false,
      time_left_sec: 1209600, // 14 days
      external_url: 'https://example.com/points',
      badges: [{ type: 'season_bonus', label: 'Season Bonus' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 1209600000).toISOString(),
      urgency: 'new',
    },

    // 7. EXPIRED opportunity
    {
      id: 'f1000000-0000-0000-0000-000000000007',
      slug: 'fixture-expired',
      title: 'Test Expired Opportunity',
      description: 'This opportunity has already expired',
      protocol: {
        name: 'ExpiredProtocol',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['ethereum'],
      reward: {
        min: 50,
        max: 150,
        currency: 'USD',
        confidence: 'confirmed',
      },
      trust: {
        score: 85,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 48 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: false,
      time_left_sec: 0,
      external_url: 'https://example.com/expired',
      badges: [],
      status: 'expired',
      created_at: new Date(baseTimestamp.getTime() - 2592000000).toISOString(), // 30 days ago
      updated_at: baseTimestamp.toISOString(),
      published_at: new Date(baseTimestamp.getTime() - 2592000000).toISOString(),
      expires_at: new Date(baseTimestamp.getTime() - 86400000).toISOString(), // Expired yesterday
    },

    // 8. ZERO REWARD (XP only)
    {
      id: 'f1000000-0000-0000-0000-000000000008',
      slug: 'fixture-zero-reward',
      title: 'Test Zero Reward Quest',
      description: 'Quest with only XP, no monetary reward',
      protocol: {
        name: 'XPQuest',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'quest',
      chains: ['base'],
      reward: {
        min: 0,
        max: 0,
        currency: 'POINTS',
        confidence: 'confirmed',
      },
      trust: {
        score: 78,
        level: 'amber',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 6 * 3600000).toISOString(),
        issues: ['Limited track record'],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: false,
      time_left_sec: 432000, // 5 days
      external_url: 'https://example.com/xp-quest',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 432000000).toISOString(),
    },

    // 9. GEO-GATED opportunity
    {
      id: 'f1000000-0000-0000-0000-000000000009',
      slug: 'fixture-geo-gated',
      title: 'Test Geo-Restricted Opportunity',
      description: 'Not available in certain regions',
      protocol: {
        name: 'RegionalDAO',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'yield',
      chains: ['ethereum'],
      reward: {
        min: 8.5,
        max: 12.0,
        currency: 'APY',
        confidence: 'confirmed',
      },
      apr: 10.2,
      trust: {
        score: 92,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 2 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'medium',
      featured: false,
      sponsored: false,
      external_url: 'https://example.com/geo-gated',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
    },

    // 10. SPONSORED - Second sponsored item
    {
      id: 'f1000000-0000-0000-0000-000000000010',
      slug: 'fixture-sponsored-2',
      title: 'Sponsored Opportunity #2',
      description: 'Another sponsored listing',
      protocol: {
        name: 'SponsorCorp2',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'quest',
      chains: ['arbitrum'],
      reward: {
        min: 300,
        max: 1000,
        currency: 'TOKEN',
        confidence: 'estimated',
      },
      trust: {
        score: 87,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 1 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'medium',
      featured: false,
      sponsored: true,
      time_left_sec: 518400, // 6 days
      external_url: 'https://example.com/sponsored2',
      badges: [{ type: 'sponsored', label: 'Sponsored' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 518400000).toISOString(),
    },

    // 11. Testnet opportunity
    {
      id: 'f1000000-0000-0000-0000-000000000011',
      slug: 'fixture-testnet',
      title: 'Test Testnet Campaign',
      description: 'Testnet participation opportunity',
      protocol: {
        name: 'TestnetProtocol',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'testnet',
      chains: ['ethereum'],
      reward: {
        min: 0,
        max: 500,
        currency: 'TOKEN',
        confidence: 'estimated',
      },
      trust: {
        score: 75,
        level: 'amber',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 8 * 3600000).toISOString(),
        issues: ['Testnet - unverified mainnet deployment'],
      },
      difficulty: 'advanced',
      featured: false,
      sponsored: false,
      time_left_sec: 2592000, // 30 days
      external_url: 'https://example.com/testnet',
      badges: [{ type: 'retroactive', label: 'Potential Retroactive' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 2592000000).toISOString(),
    },

    // 12. Loyalty program
    {
      id: 'f1000000-0000-0000-0000-000000000012',
      slug: 'fixture-loyalty',
      title: 'Test Loyalty Program',
      description: 'Long-term loyalty rewards',
      protocol: {
        name: 'LoyaltyDAO',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'loyalty',
      chains: ['polygon', 'optimism'],
      reward: {
        min: 100,
        max: 1000,
        currency: 'POINTS',
        confidence: 'confirmed',
      },
      trust: {
        score: 91,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 3 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      featured: true,
      sponsored: false,
      external_url: 'https://example.com/loyalty',
      badges: [{ type: 'featured', label: 'Featured' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      urgency: 'hot',
    },

    // 13. NFT reward opportunity
    {
      id: 'f1000000-0000-0000-0000-000000000013',
      slug: 'fixture-nft-reward',
      title: 'Test NFT Reward Quest',
      description: 'Complete quest to earn exclusive NFT',
      protocol: {
        name: 'NFTQuest',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'quest',
      chains: ['base'],
      reward: {
        min: 1,
        max: 1,
        currency: 'NFT',
        confidence: 'confirmed',
      },
      trust: {
        score: 89,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 2 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'medium',
      featured: false,
      sponsored: false,
      time_left_sec: 345600, // 4 days
      external_url: 'https://example.com/nft-quest',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 345600000).toISOString(),
    },

    // 14. SPONSORED - Third sponsored item (tests capping)
    {
      id: 'f1000000-0000-0000-0000-000000000014',
      slug: 'fixture-sponsored-3',
      title: 'Sponsored Opportunity #3',
      description: 'Third sponsored listing to test capping',
      protocol: {
        name: 'SponsorCorp3',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['solana'],
      reward: {
        min: 150,
        max: 600,
        currency: 'TOKEN',
        confidence: 'confirmed',
      },
      trust: {
        score: 93,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 1 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'easy',
      featured: false,
      sponsored: true,
      time_left_sec: 691200, // 8 days
      external_url: 'https://example.com/sponsored3',
      badges: [{ type: 'sponsored', label: 'Sponsored' }],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 691200000).toISOString(),
    },

    // 15. Unlikely eligible opportunity
    {
      id: 'f1000000-0000-0000-0000-000000000015',
      slug: 'fixture-unlikely-eligible',
      title: 'Test Unlikely Eligible Opportunity',
      description: 'Opportunity with strict eligibility requirements',
      protocol: {
        name: 'ExclusiveDAO',
        logo: 'https://via.placeholder.com/64',
      },
      type: 'airdrop',
      chains: ['avalanche'],
      reward: {
        min: 500,
        max: 2000,
        currency: 'USD',
        confidence: 'confirmed',
      },
      trust: {
        score: 94,
        level: 'green',
        last_scanned_ts: new Date(baseTimestamp.getTime() - 2 * 3600000).toISOString(),
        issues: [],
      },
      difficulty: 'advanced',
      eligibility_preview: {
        status: 'unlikely',
        score: 0.25,
        reasons: ['Wallet not active on Avalanche', 'Insufficient holdings', 'Not on allowlist'],
      },
      featured: false,
      sponsored: false,
      time_left_sec: 1814400, // 21 days
      external_url: 'https://example.com/exclusive',
      badges: [],
      status: 'published',
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString(),
      published_at: baseTimestamp.toISOString(),
      expires_at: new Date(baseTimestamp.getTime() + 1814400000).toISOString(),
    },
  ];
}
