/**
 * Admin Seed Script: Quests Module
 * 
 * Seeds 10-15 quest opportunities with realistic data
 * Run with: npm run seed:quests
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const quests = [
  {
    slug: 'base-onchain-summer-quest',
    title: 'Base Onchain Summer Quest',
    protocol: 'Base',
    protocol_name: 'Base',
    type: 'quest',
    chains: ['base'],
    reward_min: 50,
    reward_max: 500,
    reward_currency: 'USD',
    trust_score: 92,
    source: 'admin',
    source_ref: 'base-onchain-summer-quest',
    dedupe_key: 'admin:base-onchain-summer-quest',
    requirements: {
      chains: ['base'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Base', completed: false },
      { step: 2, title: 'Swap on Uniswap', completed: false },
      { step: 3, title: 'Mint an NFT', completed: false },
      { step: 4, title: 'Provide liquidity', completed: false },
    ],
    quest_difficulty: 'medium',
    xp_reward: 500,
    quest_type: 'multi-step',
    description: 'Complete the Base Onchain Summer quest series',
    tags: ['quest', 'base', 'defi', 'nft'],
    end_date: new Date('2025-08-31'),
  },
  {
    slug: 'arbitrum-odyssey-quest',
    title: 'Arbitrum Odyssey Quest',
    protocol: 'Arbitrum',
    protocol_name: 'Arbitrum',
    type: 'quest',
    chains: ['arbitrum'],
    reward_min: 100,
    reward_max: 1000,
    reward_currency: 'USD',
    trust_score: 94,
    source: 'admin',
    source_ref: 'arbitrum-odyssey-quest',
    dedupe_key: 'admin:arbitrum-odyssey-quest',
    requirements: {
      chains: ['arbitrum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Arbitrum', completed: false },
      { step: 2, title: 'Trade on GMX', completed: false },
      { step: 3, title: 'Lend on Aave', completed: false },
      { step: 4, title: 'Stake ARB', completed: false },
      { step: 5, title: 'Vote on governance', completed: false },
    ],
    quest_difficulty: 'hard',
    xp_reward: 1000,
    quest_type: 'multi-step',
    description: 'Complete the Arbitrum Odyssey and explore the ecosystem',
    tags: ['quest', 'arbitrum', 'defi', 'governance'],
    end_date: new Date('2025-12-31'),
  },
  {
    slug: 'optimism-quests-season-5',
    title: 'Optimism Quests Season 5',
    protocol: 'Optimism',
    protocol_name: 'Optimism',
    type: 'quest',
    chains: ['optimism'],
    reward_min: 75,
    reward_max: 750,
    reward_currency: 'USD',
    trust_score: 91,
    source: 'admin',
    source_ref: 'optimism-quests-season-5',
    dedupe_key: 'admin:optimism-quests-season-5',
    requirements: {
      chains: ['optimism'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Optimism', completed: false },
      { step: 2, title: 'Swap on Velodrome', completed: false },
      { step: 3, title: 'Mint an NFT on Zora', completed: false },
    ],
    quest_difficulty: 'easy',
    xp_reward: 300,
    quest_type: 'multi-step',
    description: 'Optimism Season 5 quests for ecosystem exploration',
    tags: ['quest', 'optimism', 'defi', 'nft'],
    end_date: new Date('2025-06-30'),
  },
  {
    slug: 'polygon-zkevm-explorer-quest',
    title: 'Polygon zkEVM Explorer Quest',
    protocol: 'Polygon',
    protocol_name: 'Polygon',
    type: 'quest',
    chains: ['polygon'],
    reward_min: 50,
    reward_max: 500,
    reward_currency: 'USD',
    trust_score: 88,
    source: 'admin',
    source_ref: 'polygon-zkevm-explorer-quest',
    dedupe_key: 'admin:polygon-zkevm-explorer-quest',
    requirements: {
      chains: ['polygon'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Polygon zkEVM', completed: false },
      { step: 2, title: 'Swap on QuickSwap', completed: false },
      { step: 3, title: 'Provide liquidity', completed: false },
    ],
    quest_difficulty: 'medium',
    xp_reward: 400,
    quest_type: 'multi-step',
    description: 'Explore Polygon zkEVM and earn rewards',
    tags: ['quest', 'polygon', 'zk-rollup', 'defi'],
    end_date: new Date('2025-09-30'),
  },
  {
    slug: 'avalanche-rush-quest',
    title: 'Avalanche Rush Quest',
    protocol: 'Avalanche',
    protocol_name: 'Avalanche',
    type: 'quest',
    chains: ['avalanche'],
    reward_min: 100,
    reward_max: 1000,
    reward_currency: 'USD',
    trust_score: 90,
    source: 'admin',
    source_ref: 'avalanche-rush-quest',
    dedupe_key: 'admin:avalanche-rush-quest',
    requirements: {
      chains: ['avalanche'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Avalanche', completed: false },
      { step: 2, title: 'Trade on Trader Joe', completed: false },
      { step: 3, title: 'Stake AVAX', completed: false },
      { step: 4, title: 'Mint a subnet NFT', completed: false },
    ],
    quest_difficulty: 'medium',
    xp_reward: 600,
    quest_type: 'multi-step',
    description: 'Avalanche Rush quest series for ecosystem participants',
    tags: ['quest', 'avalanche', 'defi', 'staking'],
    end_date: new Date('2025-10-31'),
  },
  {
    slug: 'linea-voyage-quest-week-1',
    title: 'Linea Voyage Quest Week 1',
    protocol: 'Linea',
    protocol_name: 'Linea',
    type: 'quest',
    chains: ['linea'],
    reward_min: 50,
    reward_max: 500,
    reward_currency: 'USD',
    trust_score: 87,
    source: 'admin',
    source_ref: 'linea-voyage-quest-week-1',
    dedupe_key: 'admin:linea-voyage-quest-week-1',
    requirements: {
      chains: ['linea'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Linea', completed: false },
      { step: 2, title: 'Swap on SyncSwap', completed: false },
      { step: 3, title: 'Mint a Linea NFT', completed: false },
    ],
    quest_difficulty: 'easy',
    xp_reward: 250,
    quest_type: 'multi-step',
    description: 'Linea Voyage Week 1 quest for early explorers',
    tags: ['quest', 'linea', 'layer2', 'nft'],
    end_date: new Date('2025-07-31'),
  },
  {
    slug: 'scroll-canvas-quest',
    title: 'Scroll Canvas Quest',
    protocol: 'Scroll',
    protocol_name: 'Scroll',
    type: 'quest',
    chains: ['scroll'],
    reward_min: 75,
    reward_max: 750,
    reward_currency: 'USD',
    trust_score: 86,
    source: 'admin',
    source_ref: 'scroll-canvas-quest',
    dedupe_key: 'admin:scroll-canvas-quest',
    requirements: {
      chains: ['scroll'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Scroll', completed: false },
      { step: 2, title: 'Mint a Canvas badge', completed: false },
      { step: 3, title: 'Complete 5 transactions', completed: false },
    ],
    quest_difficulty: 'easy',
    xp_reward: 300,
    quest_type: 'multi-step',
    description: 'Scroll Canvas quest for badge collectors',
    tags: ['quest', 'scroll', 'layer2', 'badges'],
    end_date: new Date('2025-08-31'),
  },
  {
    slug: 'zksync-era-quest-series',
    title: 'zkSync Era Quest Series',
    protocol: 'zkSync',
    protocol_name: 'zkSync',
    type: 'quest',
    chains: ['zksync'],
    reward_min: 100,
    reward_max: 1000,
    reward_currency: 'USD',
    trust_score: 93,
    source: 'admin',
    source_ref: 'zksync-era-quest-series',
    dedupe_key: 'admin:zksync-era-quest-series',
    requirements: {
      chains: ['zksync'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to zkSync Era', completed: false },
      { step: 2, title: 'Swap on SyncSwap', completed: false },
      { step: 3, title: 'Provide liquidity', completed: false },
      { step: 4, title: 'Mint a zkSync NFT', completed: false },
      { step: 5, title: 'Complete 10 transactions', completed: false },
    ],
    quest_difficulty: 'hard',
    xp_reward: 800,
    quest_type: 'multi-step',
    description: 'zkSync Era quest series for power users',
    tags: ['quest', 'zksync', 'layer2', 'defi'],
    end_date: new Date('2025-11-30'),
  },
  {
    slug: 'starknet-quest-odyssey',
    title: 'Starknet Quest Odyssey',
    protocol: 'Starknet',
    protocol_name: 'Starknet',
    type: 'quest',
    chains: ['starknet'],
    reward_min: 150,
    reward_max: 1500,
    reward_currency: 'USD',
    trust_score: 89,
    source: 'admin',
    source_ref: 'starknet-quest-odyssey',
    dedupe_key: 'admin:starknet-quest-odyssey',
    requirements: {
      chains: ['starknet'],
      min_wallet_age_days: 90,
      min_tx_count: 15,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Starknet', completed: false },
      { step: 2, title: 'Swap on Jediswap', completed: false },
      { step: 3, title: 'Lend on zkLend', completed: false },
      { step: 4, title: 'Mint a Starknet ID', completed: false },
    ],
    quest_difficulty: 'medium',
    xp_reward: 700,
    quest_type: 'multi-step',
    description: 'Starknet Quest Odyssey for ecosystem explorers',
    tags: ['quest', 'starknet', 'layer2', 'cairo'],
    end_date: new Date('2025-12-31'),
  },
  {
    slug: 'blast-big-bang-quest',
    title: 'Blast Big Bang Quest',
    protocol: 'Blast',
    protocol_name: 'Blast',
    type: 'quest',
    chains: ['blast'],
    reward_min: 50,
    reward_max: 500,
    reward_currency: 'USD',
    trust_score: 84,
    source: 'admin',
    source_ref: 'blast-big-bang-quest',
    dedupe_key: 'admin:blast-big-bang-quest',
    requirements: {
      chains: ['blast'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Blast', completed: false },
      { step: 2, title: 'Earn native yield', completed: false },
      { step: 3, title: 'Swap on Thruster', completed: false },
    ],
    quest_difficulty: 'easy',
    xp_reward: 200,
    quest_type: 'multi-step',
    description: 'Blast Big Bang quest for yield seekers',
    tags: ['quest', 'blast', 'layer2', 'yield'],
    end_date: new Date('2025-07-31'),
  },
  {
    slug: 'manta-pacific-quest',
    title: 'Manta Pacific Quest',
    protocol: 'Manta',
    protocol_name: 'Manta',
    type: 'quest',
    chains: ['manta'],
    reward_min: 75,
    reward_max: 750,
    reward_currency: 'USD',
    trust_score: 85,
    source: 'admin',
    source_ref: 'manta-pacific-quest',
    dedupe_key: 'admin:manta-pacific-quest',
    requirements: {
      chains: ['manta'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Manta Pacific', completed: false },
      { step: 2, title: 'Swap on Aperture', completed: false },
      { step: 3, title: 'Use zkSBT', completed: false },
    ],
    quest_difficulty: 'medium',
    xp_reward: 400,
    quest_type: 'multi-step',
    description: 'Manta Pacific quest for privacy enthusiasts',
    tags: ['quest', 'manta', 'layer2', 'privacy'],
    end_date: new Date('2025-09-30'),
  },
  {
    slug: 'mode-network-quest',
    title: 'Mode Network Quest',
    protocol: 'Mode',
    protocol_name: 'Mode',
    type: 'quest',
    chains: ['mode'],
    reward_min: 50,
    reward_max: 500,
    reward_currency: 'USD',
    trust_score: 82,
    source: 'admin',
    source_ref: 'mode-network-quest',
    dedupe_key: 'admin:mode-network-quest',
    requirements: {
      chains: ['mode'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    quest_steps: [
      { step: 1, title: 'Bridge to Mode', completed: false },
      { step: 2, title: 'Swap on Kim Exchange', completed: false },
      { step: 3, title: 'Provide liquidity', completed: false },
    ],
    quest_difficulty: 'easy',
    xp_reward: 250,
    quest_type: 'multi-step',
    description: 'Mode Network quest for early adopters',
    tags: ['quest', 'mode', 'layer2', 'defi'],
    end_date: new Date('2025-08-31'),
  },
];

async function seedQuests() {
  console.log('🌱 Seeding quests...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const quest of quests) {
    try {
      const { error } = await supabase.from('opportunities').upsert(
        {
          ...quest,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

      if (error) {
        console.error(`❌ Failed to seed ${quest.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${quest.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${quest.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount} quests`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} quests`);
  }
}

seedQuests()
  .then(() => {
    console.log('\n✅ Quest seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Quest seeding failed:', error);
    process.exit(1);
  });
