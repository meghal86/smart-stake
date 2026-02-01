import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkData() {
  console.log('🔍 Checking Hunter opportunities data...\n');
  
  // Get all opportunities
  const { data: all, error } = await supabase
    .from('opportunities')
    .select('id, title, type, status')
    .eq('status', 'published')
    .order('type');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Total published opportunities: ${all?.length || 0}\n`);
  
  // Group by type
  const byType = all?.reduce((acc, opp) => {
    acc[opp.type] = (acc[opp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Breakdown by type:');
  Object.entries(byType || {}).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n🎯 Filter mappings:');
  console.log('  All: all types');
  console.log('  Airdrops: airdrop');
  console.log('  Quests: quest, testnet');
  console.log('  Staking: staking, yield, rwa');
  console.log('  NFT: quest');
  console.log('  Points: points, loyalty');
  
  console.log('\n📋 RWA Opportunities:');
  const rwaOpps = all?.filter(o => o.type === 'rwa');
  rwaOpps?.forEach(opp => {
    console.log(`  - ${opp.title} (${opp.id})`);
  });
  
  console.log('\n✅ When you click "Staking" tab, you should see:');
  const stakingOpps = all?.filter(o => ['staking', 'yield', 'rwa'].includes(o.type));
  console.log(`  ${stakingOpps?.length || 0} opportunities (staking + yield + rwa)`);
  stakingOpps?.forEach(opp => {
    console.log(`  - [${opp.type}] ${opp.title}`);
  });
}

checkData().catch(console.error);
