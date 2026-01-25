/**
 * Admin Seed Script: RWA Vaults Module
 * 
 * Seeds 10-15 RWA vault opportunities with realistic data
 * Run with: npm run seed:rwa
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

const rwaVaults = [
  {
    slug: 'ondo-usdy-vault',
    title: 'Ondo USDY Vault',
    protocol: 'Ondo Finance',
    protocol_name: 'Ondo Finance',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 4.5,
    reward_max: 5.5,
    reward_currency: 'USD',
    apr: 5.0,
    trust_score: 92,
    source: 'admin',
    source_ref: 'ondo-usdy-vault',
    dedupe_key: 'admin:ondo-usdy-vault',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    issuer_name: 'Ondo Finance',
    jurisdiction: 'United States',
    kyc_required: true,
    min_investment: 100000,
    liquidity_term_days: 30,
    rwa_type: 'treasury',
    description: 'Tokenized US Treasury bills with 5% APY',
    tags: ['rwa', 'treasury', 'stablecoin'],
  },
  {
    slug: 'maple-finance-usdc-pool',
    title: 'Maple Finance USDC Pool',
    protocol: 'Maple Finance',
    protocol_name: 'Maple Finance',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 8.0,
    reward_max: 12.0,
    reward_currency: 'USD',
    apr: 10.0,
    trust_score: 88,
    source: 'admin',
    source_ref: 'maple-finance-usdc-pool',
    dedupe_key: 'admin:maple-finance-usdc-pool',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 120,
      min_tx_count: 15,
    },
    issuer_name: 'Maple Finance',
    jurisdiction: 'Cayman Islands',
    kyc_required: true,
    min_investment: 50000,
    liquidity_term_days: 90,
    rwa_type: 'credit',
    description: 'Institutional credit pool with 10% APY',
    tags: ['rwa', 'credit', 'institutional'],
  },
  {
    slug: 'centrifuge-real-estate-pool',
    title: 'Centrifuge Real Estate Pool',
    protocol: 'Centrifuge',
    protocol_name: 'Centrifuge',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 6.0,
    reward_max: 9.0,
    reward_currency: 'USD',
    apr: 7.5,
    trust_score: 85,
    source: 'admin',
    source_ref: 'centrifuge-real-estate-pool',
    dedupe_key: 'admin:centrifuge-real-estate-pool',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    issuer_name: 'Centrifuge',
    jurisdiction: 'Germany',
    kyc_required: true,
    min_investment: 25000,
    liquidity_term_days: 180,
    rwa_type: 'real_estate',
    description: 'Tokenized real estate debt with 7.5% APY',
    tags: ['rwa', 'real-estate', 'debt'],
  },
  {
    slug: 'goldfinch-emerging-markets',
    title: 'Goldfinch Emerging Markets',
    protocol: 'Goldfinch',
    protocol_name: 'Goldfinch',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 10.0,
    reward_max: 15.0,
    reward_currency: 'USD',
    apr: 12.5,
    trust_score: 82,
    source: 'admin',
    source_ref: 'goldfinch-emerging-markets',
    dedupe_key: 'admin:goldfinch-emerging-markets',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 120,
      min_tx_count: 15,
    },
    issuer_name: 'Goldfinch',
    jurisdiction: 'United States',
    kyc_required: true,
    min_investment: 10000,
    liquidity_term_days: 365,
    rwa_type: 'credit',
    description: 'Emerging markets credit with 12.5% APY',
    tags: ['rwa', 'credit', 'emerging-markets'],
  },
  {
    slug: 'backed-finance-treasury',
    title: 'Backed Finance Treasury',
    protocol: 'Backed Finance',
    protocol_name: 'Backed Finance',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 4.0,
    reward_max: 5.0,
    reward_currency: 'USD',
    apr: 4.5,
    trust_score: 90,
    source: 'admin',
    source_ref: 'backed-finance-treasury',
    dedupe_key: 'admin:backed-finance-treasury',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    issuer_name: 'Backed Finance',
    jurisdiction: 'Switzerland',
    kyc_required: true,
    min_investment: 50000,
    liquidity_term_days: 30,
    rwa_type: 'treasury',
    description: 'Swiss-regulated tokenized treasuries with 4.5% APY',
    tags: ['rwa', 'treasury', 'switzerland'],
  },
  {
    slug: 'matrixdock-short-term-treasury',
    title: 'MatrixDock Short-Term Treasury',
    protocol: 'MatrixDock',
    protocol_name: 'MatrixDock',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 4.5,
    reward_max: 5.5,
    reward_currency: 'USD',
    apr: 5.0,
    trust_score: 87,
    source: 'admin',
    source_ref: 'matrixdock-short-term-treasury',
    dedupe_key: 'admin:matrixdock-short-term-treasury',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    issuer_name: 'MatrixDock',
    jurisdiction: 'Singapore',
    kyc_required: true,
    min_investment: 100000,
    liquidity_term_days: 30,
    rwa_type: 'treasury',
    description: 'Singapore-regulated short-term treasuries with 5% APY',
    tags: ['rwa', 'treasury', 'singapore'],
  },
  {
    slug: 'swarm-markets-real-estate',
    title: 'Swarm Markets Real Estate',
    protocol: 'Swarm Markets',
    protocol_name: 'Swarm Markets',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 7.0,
    reward_max: 10.0,
    reward_currency: 'USD',
    apr: 8.5,
    trust_score: 84,
    source: 'admin',
    source_ref: 'swarm-markets-real-estate',
    dedupe_key: 'admin:swarm-markets-real-estate',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 120,
      min_tx_count: 15,
    },
    issuer_name: 'Swarm Markets',
    jurisdiction: 'Germany',
    kyc_required: true,
    min_investment: 50000,
    liquidity_term_days: 365,
    rwa_type: 'real_estate',
    description: 'Tokenized European real estate with 8.5% APY',
    tags: ['rwa', 'real-estate', 'europe'],
  },
  {
    slug: 'credix-latin-america-credit',
    title: 'Credix Latin America Credit',
    protocol: 'Credix',
    protocol_name: 'Credix',
    type: 'rwa',
    chains: ['solana'],
    reward_min: 12.0,
    reward_max: 18.0,
    reward_currency: 'USD',
    apr: 15.0,
    trust_score: 80,
    source: 'admin',
    source_ref: 'credix-latin-america-credit',
    dedupe_key: 'admin:credix-latin-america-credit',
    requirements: {
      chains: ['solana'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    issuer_name: 'Credix',
    jurisdiction: 'Netherlands',
    kyc_required: true,
    min_investment: 25000,
    liquidity_term_days: 180,
    rwa_type: 'credit',
    description: 'Latin American fintech credit with 15% APY',
    tags: ['rwa', 'credit', 'latin-america'],
  },
  {
    slug: 'truefi-uncollateralized-lending',
    title: 'TrueFi Uncollateralized Lending',
    protocol: 'TrueFi',
    protocol_name: 'TrueFi',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 8.0,
    reward_max: 12.0,
    reward_currency: 'USD',
    apr: 10.0,
    trust_score: 86,
    source: 'admin',
    source_ref: 'truefi-uncollateralized-lending',
    dedupe_key: 'admin:truefi-uncollateralized-lending',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 120,
      min_tx_count: 15,
    },
    issuer_name: 'TrueFi',
    jurisdiction: 'United States',
    kyc_required: true,
    min_investment: 50000,
    liquidity_term_days: 90,
    rwa_type: 'credit',
    description: 'Uncollateralized institutional lending with 10% APY',
    tags: ['rwa', 'credit', 'institutional'],
  },
  {
    slug: 'realio-real-estate-fund',
    title: 'Realio Real Estate Fund',
    protocol: 'Realio',
    protocol_name: 'Realio',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 6.0,
    reward_max: 9.0,
    reward_currency: 'USD',
    apr: 7.5,
    trust_score: 83,
    source: 'admin',
    source_ref: 'realio-real-estate-fund',
    dedupe_key: 'admin:realio-real-estate-fund',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 90,
      min_tx_count: 10,
    },
    issuer_name: 'Realio',
    jurisdiction: 'United States',
    kyc_required: true,
    min_investment: 100000,
    liquidity_term_days: 365,
    rwa_type: 'real_estate',
    description: 'US commercial real estate fund with 7.5% APY',
    tags: ['rwa', 'real-estate', 'commercial'],
  },
  {
    slug: 'polytrade-trade-finance',
    title: 'Polytrade Trade Finance',
    protocol: 'Polytrade',
    protocol_name: 'Polytrade',
    type: 'rwa',
    chains: ['polygon'],
    reward_min: 10.0,
    reward_max: 14.0,
    reward_currency: 'USD',
    apr: 12.0,
    trust_score: 81,
    source: 'admin',
    source_ref: 'polytrade-trade-finance',
    dedupe_key: 'admin:polytrade-trade-finance',
    requirements: {
      chains: ['polygon'],
      min_wallet_age_days: 120,
      min_tx_count: 15,
    },
    issuer_name: 'Polytrade',
    jurisdiction: 'Singapore',
    kyc_required: true,
    min_investment: 50000,
    liquidity_term_days: 180,
    rwa_type: 'trade_finance',
    description: 'Global trade finance with 12% APY',
    tags: ['rwa', 'trade-finance', 'global'],
  },
  {
    slug: 'openeden-treasury-vault',
    title: 'OpenEden Treasury Vault',
    protocol: 'OpenEden',
    protocol_name: 'OpenEden',
    type: 'rwa',
    chains: ['ethereum'],
    reward_min: 4.5,
    reward_max: 5.5,
    reward_currency: 'USD',
    apr: 5.0,
    trust_score: 89,
    source: 'admin',
    source_ref: 'openeden-treasury-vault',
    dedupe_key: 'admin:openeden-treasury-vault',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 60,
      min_tx_count: 10,
    },
    issuer_name: 'OpenEden',
    jurisdiction: 'Singapore',
    kyc_required: true,
    min_investment: 100000,
    liquidity_term_days: 30,
    rwa_type: 'treasury',
    description: 'Institutional-grade treasury vault with 5% APY',
    tags: ['rwa', 'treasury', 'institutional'],
  },
];

async function seedRWA() {
  console.log('🌱 Seeding RWA vaults...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const vault of rwaVaults) {
    try {
      const { error } = await supabase.from('opportunities').upsert(
        {
          ...vault,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

      if (error) {
        console.error(`❌ Failed to seed ${vault.title}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${vault.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${vault.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Seeded ${successCount} RWA vaults`);
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} RWA vaults`);
  }
}

seedRWA()
  .then(() => {
    console.log('\n✅ RWA seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ RWA seeding failed:', error);
    process.exit(1);
  });
