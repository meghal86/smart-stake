/**
 * Test script to debug seed issue
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSeed() {
  console.log('Testing single airdrop seed...\n');

  const testAirdrop = {
    slug: 'test-airdrop-debug',
    title: 'Test Airdrop',
    protocol: 'TestProtocol',
    protocol_name: 'TestProtocol',
    type: 'airdrop',
    chains: ['ethereum'],
    reward_min: 100,
    reward_max: 1000,
    reward_currency: 'USD',
    trust_score: 90,
    source: 'admin',
    source_ref: 'test-airdrop-debug',
    dedupe_key: 'admin:test-airdrop-debug',
    requirements: {
      chains: ['ethereum'],
      min_wallet_age_days: 30,
      min_tx_count: 10,
    },
    snapshot_date: new Date('2025-01-01'),
    claim_start: new Date('2025-02-01'),
    claim_end: new Date('2025-05-01'),
    airdrop_category: 'test',
    description: 'Test airdrop for debugging',
    tags: ['airdrop', 'test'],
    status: 'published',
  };

  try {
    console.log('Attempting to insert...');
    const { data, error } = await supabase
      .from('opportunities')
      .insert(testAirdrop)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success!', data);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testSeed();
