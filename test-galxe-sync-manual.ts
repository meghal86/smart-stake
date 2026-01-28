/**
 * Manual Galxe Sync Test
 * 
 * Run this script to manually verify Galxe data sync:
 * npx tsx test-galxe-sync-manual.ts
 */

import { syncGalxeOpportunities } from './src/lib/hunter/sync/galxe';

async function testGalxeSync() {
  console.log('🔄 Testing Galxe Sync...\n');

  try {
    // Fetch 2 pages for a good sample
    const result = await syncGalxeOpportunities(2);

    console.log('📊 Sync Results:');
    console.log(`   Total Fetched: ${result.total_fetched} campaigns`);
    console.log(`   Pages Fetched: ${result.pages_fetched}`);
    console.log(`   Airdrops: ${result.airdrops.length}`);
    console.log(`   Quests: ${result.quests.length}\n`);

    // Show sample airdrops
    if (result.airdrops.length > 0) {
      console.log('🎁 Sample Airdrops:');
      result.airdrops.slice(0, 3).forEach((airdrop, i) => {
        console.log(`\n${i + 1}. ${airdrop.title}`);
        console.log(`   Protocol: ${airdrop.protocol}`);
        console.log(`   Chains: ${airdrop.chains.join(', ')}`);
        console.log(`   Trust Score: ${airdrop.trust_score}`);
        console.log(`   Status: ${airdrop.status}`);
        console.log(`   Source: ${airdrop.source}`);
        console.log(`   Dedupe Key: ${airdrop.dedupe_key}`);
        if (airdrop.starts_at) {
          console.log(`   Starts: ${airdrop.starts_at}`);
        }
        if (airdrop.ends_at) {
          console.log(`   Ends: ${airdrop.ends_at}`);
        }
      });
    } else {
      console.log('🎁 No airdrops found (all campaigns classified as quests)');
    }

    // Show sample quests
    if (result.quests.length > 0) {
      console.log('\n\n🎯 Sample Quests:');
      result.quests.slice(0, 3).forEach((quest, i) => {
        console.log(`\n${i + 1}. ${quest.title}`);
        console.log(`   Protocol: ${quest.protocol}`);
        console.log(`   Chains: ${quest.chains.join(', ')}`);
        console.log(`   Trust Score: ${quest.trust_score}`);
        console.log(`   Status: ${quest.status}`);
        console.log(`   Source: ${quest.source}`);
        console.log(`   Dedupe Key: ${quest.dedupe_key}`);
        if (quest.starts_at) {
          console.log(`   Starts: ${quest.starts_at}`);
        }
        if (quest.ends_at) {
          console.log(`   Ends: ${quest.ends_at}`);
        }
      });
    }

    // Show chain distribution
    const chainCounts = new Map<string, number>();
    [...result.airdrops, ...result.quests].forEach(opp => {
      opp.chains.forEach(chain => {
        chainCounts.set(chain, (chainCounts.get(chain) || 0) + 1);
      });
    });

    console.log('\n\n📍 Chain Distribution:');
    Array.from(chainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([chain, count]) => {
        console.log(`   ${chain}: ${count} opportunities`);
      });

    console.log('\n✅ Galxe sync test complete!');
  } catch (error) {
    console.error('❌ Error testing Galxe sync:', error);
    process.exit(1);
  }
}

testGalxeSync();
