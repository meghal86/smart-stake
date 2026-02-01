/**
 * Manual Galxe Cache Verification Script
 * 
 * Run this to see the cache in action with real timing
 */

import { syncGalxeOpportunities } from './src/lib/hunter/sync/galxe';

async function testGalxeCache() {
  console.log('🧪 Testing Galxe Cache (10 min TTL)\n');

  // Test 1: First call (should fetch)
  console.log('📍 Test 1: First call (should fetch from API)');
  const start1 = Date.now();
  const result1 = await syncGalxeOpportunities(1);
  const duration1 = Date.now() - start1;
  console.log(`   ⏱️  Duration: ${duration1}ms`);
  console.log(`   📊 Result: ${result1.total_fetched} campaigns (${result1.airdrops.length} airdrops, ${result1.quests.length} quests)\n`);

  // Test 2: Second call immediately (should use cache)
  console.log('📍 Test 2: Second call immediately (should use cache)');
  const start2 = Date.now();
  const result2 = await syncGalxeOpportunities(1);
  const duration2 = Date.now() - start2;
  console.log(`   ⏱️  Duration: ${duration2}ms`);
  console.log(`   📊 Result: ${result2.total_fetched} campaigns (${result2.airdrops.length} airdrops, ${result2.quests.length} quests)`);
  console.log(`   ✅ Cache hit: ${duration2 < 10 ? 'YES' : 'NO'} (${duration2}ms < 10ms)\n`);

  // Test 3: Third call after 5 seconds (should still use cache)
  console.log('📍 Test 3: Third call after 5 seconds (should still use cache)');
  await new Promise(resolve => setTimeout(resolve, 5000));
  const start3 = Date.now();
  const result3 = await syncGalxeOpportunities(1);
  const duration3 = Date.now() - start3;
  console.log(`   ⏱️  Duration: ${duration3}ms`);
  console.log(`   📊 Result: ${result3.total_fetched} campaigns (${result3.airdrops.length} airdrops, ${result3.quests.length} quests)`);
  console.log(`   ✅ Cache hit: ${duration3 < 10 ? 'YES' : 'NO'} (${duration3}ms < 10ms)\n`);

  // Summary
  console.log('📋 Summary:');
  console.log(`   First call:  ${duration1}ms (API fetch)`);
  console.log(`   Second call: ${duration2}ms (cache hit)`);
  console.log(`   Third call:  ${duration3}ms (cache hit)`);
  console.log(`   Speedup:     ${Math.round(duration1 / duration2)}x faster with cache\n`);

  console.log('✅ Cache verification complete!');
  console.log('💡 Note: Cache expires after 10 minutes (600000ms)');
}

// Run the test
testGalxeCache().catch(console.error);
