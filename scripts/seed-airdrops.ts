/**
 * Admin Seed Script: Airdrops Module
 * 
 * Seeds 10-15 airdrop opportunities with realistic data
 * Run with: npm run seed:airdrops
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

const airdrops = [
  {
    slug: 'layerzero-airdrop-2025',
    title: 'LayerZero Airdrop',
    protocol: 'LayerZero',
    protocol_name: 'LayerZero',
    type: 'airdrop',
    chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
    reward_min: 100,
    reward_max: 5000,
    reward_currency: 'USD',
    trust_score: 95,
    source: 'admin',
    source_ref: 'layerzero-airdrop-2025',
    dedupe_key: 'admin:layerzero-airdrop-2025',
    requirements: {
      chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
      min_wallet_age_days: 180,
      min_tx_count: 50,
    },
    snapshot_date: new Date('2025-01-15'),
    claim_start: new Date('2025-02-01'),
    claim_end: new Date('2025-05-01'),
    airdrop_category: 'infrastructure',
    description: 'Claim your LayerZero airdrop for early protocol usage',
    tags: ['airdrop', 'infrastructure', 'cross-chain'],
  },
  {
    slug: 'zksync-era-airdrop',
    title: 'zkSync Era Airdrop',
    protocol: 'zkSync',
    protocol_name: 'zkSync',
    type: 'airdrop',
    chains: ['ethereum', 'zksync'],
    reward_min: 200,
    reward_max: 10000,
    reward_currency: 'USD',
    trust_score: 92,
    source: 'admin',
    source_ref: 'zksync-era-airdrop',
    dedupe_key: 'admin:zksync-era-airdrop',
    requirements: {
      chains: ['ethereum', 'zksync'],
      min_wallet_age_days: 90,
      min_tx_count: 20,
    },
    snapshot_date: new Date('2025-01-10'),
    claim_start: new Date('2025-02-15'),
    claim_end: new Date('2025-06-15'),
    airdrop_category: 'layer2',
    description: 'zkSync Era airdrop for early adopters and active users',
    tags: ['airdrop', 'layer2', 'zk-rollup'],
  },
  {
    slug: 'scroll-airdrop-season-1',
    title: 'Scroll Airdrop Season 1',
    protocol: 'Scroll',
    protocol_name: 'Scroll',
    type: 'airdrop',
    chains: ['ethereum', 'scroll'],
    reward_min: 150,
    reward_max: 8000,
    reward_currency: 'USD',
    trust_score: 88,
    source: 'admin',
    source_ref: 'scroll-airdrop-season-1',
    dedupe_key: 'admin:scroll-airdrop-season-1',
    requirements: {
      chains: ['ethereum', 'scroll'],
      min_wallet_age_days: 60,
      min_tx_count: 15,
    },
    snapshot_date: new Date('2025-01-20'),
    claim_start: new Date('2025-03-01'),
    claim_end: new Date('2025-07-01'),
    airdrop_category: 'layer2',
    description: 'Scroll Season 1 airdrop for testnet and mainnet participants',
    tags: ['airdrop', 'layer2', 'zk-rollup'],
  },
  {
    slug: 'starknet-provisions-airdrop',
    title: 'Starknet Provisions Airdrop',
    protocol: 'Starknet',
    protocol_name: 'Starknet',
    type: 'airdrop',
    chains: ['ethereum', 'starknet'],
    reward_min: 300,
    reward_max: 15000,
    reward_currency: 'USD',
    trust_score: 90,
    source: 'admin',
    source_ref: 'starknet-provisions-airdrop',
    dedupe_key: 'admin:starknet-provisions-airdrop',
    requirements: {
      chains: ['ethereum', 'starknet'],
      min_wallet_age_days: 120,
      min_tx_count: 30,
    },
    snapshot_date: new Date('2025-01-05'),
    claim_start: new Date('2025-02-20'),
    claim_end: new Date('2025-06-20'),
    airdrop_category: 'layer2',
    description: 'Starknet Provisions airdrop for ecosystem contributors',
    tags: ['airdrop', 'layer2', 'cairo'],
  },
  {
    slug: 'eigenlayer-airdrop-phase-2',
    title: 'EigenLayer Airdrop Phase 2',
    protocol: 'EigenLayer',
    protocol_name: 'EigenLayer',
    type: 'airdrop',
    chains: ['ethereum'],
    reward_min: 500,
    reward_max: 20000,
    reward_currency: 'USD',
    trust_score: 94,
    source: 'admin',
    source_ref: 'eigenlayer-airdrop-phase-2',
    dedupe_key: 'admin:eigenlayer-airdrop-phase-2',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 180,
      min_tx_count: 40,
    },
    snapshot_date: new Date('2025-01-25'),
    claim_start: new Date('2025-03-15'),
    claim_end: new Date('2025-07-15'),
    airdrop_category: 'restaking',
    description: 'EigenLayer Phase 2 airdrop for restakers and operators',
    tags: ['airdrop', 'restaking', 'ethereum'],
  },
  {
    slug: 'blast-airdrop-season-2',
    title: 'Blast Airdrop Season 2',
    protocol: 'Blast',
    protocol_name: 'Blast',
    type: 'airdrop',
    chains: ['ethereum', 'blast'],
    reward_min: 100,
    reward_max: 6000,
    reward_currency: 'USD',
    trust_score: 85,
    source: 'admin',
    source_ref: 'blast-airdrop-season-2',
    dedupe_key: 'admin:blast-airdrop-season-2',
    requirements: {
      chains: ['ethereum', 'blast'],
      min_wallet_age_days: 30,
      min_tx_count: 10,
    },
    snapshot_date: new Date('2025-02-01'),
    claim_start: new Date('2025-03-01'),
    claim_end: new Date('2025-06-01'),
    airdrop_category: 'layer2',
    description: 'Blast Season 2 airdrop for bridge users and DeFi participants',
    tags: ['airdrop', 'layer2', 'yield'],
  },
  {
    slug: 'linea-voyage-airdrop',
    title: 'Linea Voyage Airdrop',
    protocol: 'Linea',
    protocol_name: 'Linea',
    type: 'airdrop',
    chains: ['ethereum', 'linea'],
    reward_min: 150,
    reward_max: 7000,
    reward_currency: 'USD',
    trust_score: 87,
    source: 'admin',
    source_ref: 'linea-voyage-airdrop',
    dedupe_key: 'admin:linea-voyage-airdrop',
    requirements: {
      chains: ['ethereum', 'linea'],
      min_wallet_age_days: 60,
      min_tx_count: 20,
    },
    snapshot_date: new Date('2025-01-30'),
    claim_start: new Date('2025-03-10'),
    claim_end: new Date('2025-07-10'),
    airdrop_category: 'layer2',
    description: 'Linea Voyage airdrop for testnet and mainnet explorers',
    tags: ['airdrop', 'layer2', 'consensys'],
  },
  {
    slug: 'zora-creator-airdrop',
    title: 'Zora Creator Airdrop',
    protocol: 'Zora',
    protocol_name: 'Zora',
    type: 'airdrop',
    chains: ['ethereum', 'zora', 'base'],
    reward_min: 100,
    reward_max: 5000,
    reward_currency: 'USD',
    trust_score: 83,
    source: 'admin',
    source_ref: 'zora-creator-airdrop',
    dedupe_key: 'admin:zora-creator-airdrop',
    requirements: {
      chains: ['ethereum', 'zora', 'base'],
      min_wallet_age_days: 90,
      min_tx_count: 15,
    },
    snapshot_date: new Date('2025-02-05'),
    claim_start: new Date('2025-03-20'),
    claim_end: new Date('2025-07-20'),
    airdrop_category: 'nft',
    description: 'Zora airdrop for creators and collectors',
    tags: ['airdrop', 'nft', 'creator-economy'],
  },
  {
    slug: 'mode-network-airdrop',
    title: 'Mode Network Airdrop',
    protocol: 'Mode',
    protocol_name: 'Mode',
    type: 'airdrop',
    chains: ['ethereum', 'mode'],
    reward_min: 120,
    reward_max: 6000,
    reward_currency: 'USD',
    trust_score: 82,
    source: 'admin',
    source_ref: 'mode-network-airdrop',
    dedupe_key: 'admin:mode-network-airdrop',
    requirements: {
      chains: ['ethereum', 'mode'],
      min_wallet_age_days: 45,
      min_tx_count: 12,
    },
    snapshot_date: new Date('2025-02-10'),
    claim_start: new Date('2025-03-25'),
    claim_end: new Date('2025-07-25'),
    airdrop_category: 'layer2',
    description: 'Mode Network airdrop for early adopters',
    tags: ['airdrop', 'layer2', 'optimism-stack'],
  },
  {
    slug: 'manta-pacific-airdrop',
    title: 'Manta Pacific Airdrop',
    protocol: 'Manta',
    protocol_name: 'Manta',
    type: 'airdrop',
    chains: ['ethereum', 'manta'],
    reward_min: 150,
    reward_max: 7500,
    reward_currency: 'USD',
    trust_score: 86,
    source: 'admin',
    source_ref: 'manta-pacific-airdrop',
    dedupe_key: 'admin:manta-pacific-airdrop',
    requirements: {
      chains: ['ethereum', 'manta'],
      min_wallet_age_days: 60,
      min_tx_count: 18,
    },
    snapshot_date: new Date('2025-02-15'),
    claim_start: new Date('2025-04-01'),
    claim_end: new Date('2025-08-01'),
    airdrop_category: 'layer2',
    description: 'Manta Pacific airdrop for privacy-focused users',
    tags: ['airdrop', 'layer2', 'privacy'],
  },
  {
    slug: 'taiko-genesis-airdrop',
    title: 'Taiko Genesis Airdrop',
    protocol: 'Taiko',
    protocol_name: 'Taiko',
    type: 'airdrop',
    chains: ['ethereum', 'taiko'],
    reward_min: 200,
    reward_max: 10000,
    reward_currency: 'USD',
    trust_score: 89,
    source: 'admin',
    source_ref: 'taiko-genesis-airdrop',
    dedupe_key: 'admin:taiko-genesis-airdrop',
    requirements: {
      chains: ['ethereum', 'taiko'],
      min_wallet_age_days: 90,
      min_tx_count: 25,
    },
    snapshot_date: new Date('2025-02-20'),
    claim_start: new Date('2025-04-10'),
    claim_end: new Date('2025-08-10'),
    airdrop_category: 'layer2',
    description: 'Taiko Genesis airdrop for testnet participants',
    tags: ['airdrop', 'layer2', 'zk-rollup'],
  },
  {
    slug: 'metis-andromeda-airdrop',
    title: 'Metis Andromeda Airdrop',
    protocol: 'Metis',
    protocol_name: 'Metis',
    type: 'airdrop',
    chains: ['ethereum', 'metis'],
    reward_min: 100,
    reward_max: 5000,
    reward_currency: 'USD',
    trust_score: 81,
    source: 'admin',
    source_ref: 'metis-andromeda-airdrop',
    dedupe_key: 'admin:metis-andromeda-airdrop',
    requirements: {
      chains: ['ethereum', 'metis'],
      min_wallet_age_days: 60,
      min_tx_count: 15,
    },
    snapshot_date: new Date('2025-02-25'),
    claim_start: new Date('2025-04-15'),
    claim_end: new Date('2025-08-15'),
    airdrop_category: 'layer2',
    description: 'Metis Andromeda airdrop for ecosystem participants',
    tags: ['airdrop', 'layer2', 'dao'],
  },
];

async function seedAirdrops() {
  console.log('🌱 Seeding airdrops...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const airdrop of airdrops) {
    try {
      const { error } = await supabase.from('opportunities').upsert(
        {
          ...airdrop,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

      if (error) {
        console.error(`❌ Failed to seed ${airdrop.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${airdrop.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${airdrop.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount} airdrops`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} airdrops`);
  }
}

seedAirdrops()
  .then(() => {
    console.log('\n✅ Airdrop seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Airdrop seeding failed:', error);
    process.exit(1);
  });
