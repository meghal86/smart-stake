/**
 * Admin Seed Script: Points/Loyalty Module
 * 
 * Seeds 10-15 points/loyalty program opportunities with realistic data
 * Run with: npm run seed:points
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

const pointsPrograms = [
  {
    slug: 'eigenlayer-points-program',
    title: 'EigenLayer Points Program',
    protocol: 'EigenLayer',
    protocol_name: 'EigenLayer',
    type: 'points',
    chains: ['ethereum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 94,
    source: 'admin',
    source_ref: 'eigenlayer-points-program',
    dedupe_key: 'admin:eigenlayer-points-program',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    points_program_name: 'EigenLayer Points',
    conversion_hint: '1000 points ≈ potential airdrop allocation',
    points_estimate_formula: 'ETH_staked * days * multiplier',
    description: 'Earn EigenLayer points by restaking ETH and LSTs',
    tags: ['points', 'restaking', 'ethereum'],
  },
  {
    slug: 'blast-points-program',
    title: 'Blast Points Program',
    protocol: 'Blast',
    protocol_name: 'Blast',
    type: 'points',
    chains: ['blast'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 85,
    source: 'admin',
    source_ref: 'blast-points-program',
    dedupe_key: 'admin:blast-points-program',
    requirements: {
      chains: ['blast'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    points_program_name: 'Blast Points',
    conversion_hint: '1000 points ≈ $10-50 airdrop value',
    points_estimate_formula: 'balance * time * yield_multiplier',
    description: 'Earn Blast points through native yield and DeFi activity',
    tags: ['points', 'yield', 'layer2'],
  },
  {
    slug: 'friend-tech-points',
    title: 'Friend.tech Points',
    protocol: 'Friend.tech',
    protocol_name: 'Friend.tech',
    type: 'points',
    chains: ['base'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 82,
    source: 'admin',
    source_ref: 'friend-tech-points',
    dedupe_key: 'admin:friend-tech-points',
    requirements: {
      chains: ['base'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    points_program_name: 'Friend.tech Points',
    conversion_hint: '1000 points ≈ potential token allocation',
    points_estimate_formula: 'trading_volume * social_activity',
    description: 'Earn points by trading keys and engaging socially',
    tags: ['points', 'social', 'base'],
  },
  {
    slug: 'blur-loyalty-program',
    title: 'Blur Loyalty Program',
    protocol: 'Blur',
    protocol_name: 'Blur',
    type: 'points',
    chains: ['ethereum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 88,
    source: 'admin',
    source_ref: 'blur-loyalty-program',
    dedupe_key: 'admin:blur-loyalty-program',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    points_program_name: 'Blur Loyalty Points',
    conversion_hint: '1000 points ≈ BLUR token rewards',
    points_estimate_formula: 'nft_trading_volume * bid_activity',
    description: 'Earn Blur loyalty points through NFT trading and bidding',
    tags: ['points', 'nft', 'trading'],
  },
  {
    slug: 'hyperliquid-points',
    title: 'Hyperliquid Points',
    protocol: 'Hyperliquid',
    protocol_name: 'Hyperliquid',
    type: 'points',
    chains: ['arbitrum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 86,
    source: 'admin',
    source_ref: 'hyperliquid-points',
    dedupe_key: 'admin:hyperliquid-points',
    requirements: {
      chains: ['arbitrum'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    points_program_name: 'Hyperliquid Points',
    conversion_hint: '1000 points ≈ potential HYPE token allocation',
    points_estimate_formula: 'trading_volume * maker_activity',
    description: 'Earn points through perpetual trading on Hyperliquid',
    tags: ['points', 'perps', 'trading'],
  },
  {
    slug: 'ethena-sats-program',
    title: 'Ethena Sats Program',
    protocol: 'Ethena',
    protocol_name: 'Ethena',
    type: 'points',
    chains: ['ethereum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 90,
    source: 'admin',
    source_ref: 'ethena-sats-program',
    dedupe_key: 'admin:ethena-sats-program',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    points_program_name: 'Ethena Sats',
    conversion_hint: '1000 sats ≈ ENA token rewards',
    points_estimate_formula: 'usde_balance * time * staking_multiplier',
    description: 'Earn Sats by holding and staking USDe',
    tags: ['points', 'stablecoin', 'yield'],
  },
  {
    slug: 'pendle-points-program',
    title: 'Pendle Points Program',
    protocol: 'Pendle',
    protocol_name: 'Pendle',
    type: 'points',
    chains: ['ethereum', 'arbitrum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 87,
    source: 'admin',
    source_ref: 'pendle-points-program',
    dedupe_key: 'admin:pendle-points-program',
    requirements: {
      chains: ['ethereum', 'arbitrum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    points_program_name: 'Pendle Points',
    conversion_hint: '1000 points ≈ PENDLE token rewards',
    points_estimate_formula: 'pt_yt_trading * liquidity_provision',
    description: 'Earn points by trading PT/YT and providing liquidity',
    tags: ['points', 'yield', 'defi'],
  },
  {
    slug: 'aevo-loyalty-program',
    title: 'Aevo Loyalty Program',
    protocol: 'Aevo',
    protocol_name: 'Aevo',
    type: 'points',
    chains: ['ethereum'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 84,
    source: 'admin',
    source_ref: 'aevo-loyalty-program',
    dedupe_key: 'admin:aevo-loyalty-program',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    points_program_name: 'Aevo Loyalty Points',
    conversion_hint: '1000 points ≈ AEVO token rewards',
    points_estimate_formula: 'options_trading_volume * maker_activity',
    description: 'Earn loyalty points through options trading on Aevo',
    tags: ['points', 'options', 'trading'],
  },
  {
    slug: 'kamino-points-program',
    title: 'Kamino Points Program',
    protocol: 'Kamino',
    protocol_name: 'Kamino',
    type: 'points',
    chains: ['solana'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 83,
    source: 'admin',
    source_ref: 'kamino-points-program',
    dedupe_key: 'admin:kamino-points-program',
    requirements: {
      chains: ['solana'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    points_program_name: 'Kamino Points',
    conversion_hint: '1000 points ≈ potential KMNO token allocation',
    points_estimate_formula: 'lending_volume * liquidity_provision',
    description: 'Earn points by lending and providing liquidity on Kamino',
    tags: ['points', 'lending', 'solana'],
  },
  {
    slug: 'marginfi-points-program',
    title: 'MarginFi Points Program',
    protocol: 'MarginFi',
    protocol_name: 'MarginFi',
    type: 'points',
    chains: ['solana'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 85,
    source: 'admin',
    source_ref: 'marginfi-points-program',
    dedupe_key: 'admin:marginfi-points-program',
    requirements: {
      chains: ['solana'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    points_program_name: 'MarginFi Points',
    conversion_hint: '1000 points ≈ potential MRGN token allocation',
    points_estimate_formula: 'lending_balance * time * multiplier',
    description: 'Earn points by lending and borrowing on MarginFi',
    tags: ['points', 'lending', 'solana'],
  },
  {
    slug: 'tensor-points-program',
    title: 'Tensor Points Program',
    protocol: 'Tensor',
    protocol_name: 'Tensor',
    type: 'points',
    chains: ['solana'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 86,
    source: 'admin',
    source_ref: 'tensor-points-program',
    dedupe_key: 'admin:tensor-points-program',
    requirements: {
      chains: ['solana'],
      min_wallet_age_days: 30,
      min_tx_count: 5,
    },
    points_program_name: 'Tensor Points',
    conversion_hint: '1000 points ≈ TNSR token rewards',
    points_estimate_formula: 'nft_trading_volume * maker_activity',
    description: 'Earn points through NFT trading on Tensor',
    tags: ['points', 'nft', 'solana'],
  },
  {
    slug: 'zeta-markets-points',
    title: 'Zeta Markets Points',
    protocol: 'Zeta Markets',
    protocol_name: 'Zeta Markets',
    type: 'points',
    chains: ['solana'],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 84,
    source: 'admin',
    source_ref: 'zeta-markets-points',
    dedupe_key: 'admin:zeta-markets-points',
    requirements: {
      chains: ['solana'],
      min_wallet_age_days: 45,
      min_tx_count: 8,
    },
    points_program_name: 'Zeta Points',
    conversion_hint: '1000 points ≈ Z token rewards',
    points_estimate_formula: 'perps_trading_volume * maker_activity',
    description: 'Earn points by trading perpetuals on Zeta Markets',
    tags: ['points', 'perps', 'solana'],
  },
];

async function seedPoints() {
  console.log('🌱 Seeding points programs...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const program of pointsPrograms) {
    try {
      const { error } = await supabase.from('opportunities').upsert(
        {
          ...program,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

      if (error) {
        console.error(`❌ Failed to seed ${program.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${program.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${program.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount} points programs`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} points programs`);
  }
}

seedPoints()
  .then(() => {
    console.log('\n✅ Points seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Points seeding failed:', error);
    process.exit(1);
  });
