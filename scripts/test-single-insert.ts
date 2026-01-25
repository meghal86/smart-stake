import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 Testing single opportunity insert...\n');
  
  const testOpportunity = {
    slug: 'test-airdrop-seed-' + Date.now(),
    title: 'Test Airdrop',
    protocol: 'Test Protocol',
    protocol_name: 'Test Protocol',
    type: 'airdrop',
    chains: ['ethereum'],
    reward_min: 100,
    reward_max: 1000,
    reward_currency: 'USD',
    trust_score: 85,
    source: 'admin',
    source_ref: 'test-airdrop-' + Date.now(),
    dedupe_key: 'admin:test:' + Date.now(),
    description: 'Test airdrop for seeding',
    tags: ['test'],
  };
  
  console.log('Inserting:', JSON.stringify(testOpportunity, null, 2));
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert(testOpportunity)
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } else {
    console.log('✅ Success!');
    console.log('Inserted:', JSON.stringify(data, null, 2));
  }
}

testInsert();
