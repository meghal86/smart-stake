#!/usr/bin/env node
/**
 * Verification script for Hunter Screen fixtures
 * 
 * Usage: node scripts/verify-fixtures.js
 */

async function verifyFixtures() {
  try {
    console.log('🔍 Verifying Hunter Screen fixtures...\n');

    // Dynamic import for ESM module
    const { getFixtureOpportunities } = await import('../src/lib/fixtures/hunter-opportunities.js');
    
    const fixtures = getFixtureOpportunities();
    
    console.log('✅ Fixtures loaded successfully');
    console.log(`📊 Total fixtures: ${fixtures.length}`);
    
    // Verify types
    const types = new Set(fixtures.map(f => f.type));
    console.log(`📋 Opportunity types: ${Array.from(types).join(', ')}`);
    console.log(`   Expected: 7, Got: ${types.size}`);
    
    // Verify trust levels
    const trustLevels = new Set(fixtures.map(f => f.trust.level));
    console.log(`🛡️  Trust levels: ${Array.from(trustLevels).join(', ')}`);
    console.log(`   Expected: 3, Got: ${trustLevels.size}`);
    
    // Verify edge cases
    const expired = fixtures.filter(f => f.status === 'expired').length;
    const sponsored = fixtures.filter(f => f.sponsored).length;
    const zeroReward = fixtures.filter(f => f.reward.min === 0 && f.reward.max === 0).length;
    const redTrust = fixtures.filter(f => f.trust.level === 'red').length;
    
    console.log(`\n🎯 Edge cases:`);
    console.log(`   Expired: ${expired} (expected: ≥1)`);
    console.log(`   Sponsored: ${sponsored} (expected: ≥3)`);
    console.log(`   Zero reward: ${zeroReward} (expected: ≥1)`);
    console.log(`   Red trust: ${redTrust} (expected: ≥1)`);
    
    // Verify determinism
    const fixtures2 = getFixtureOpportunities();
    const isDeterministic = JSON.stringify(fixtures) === JSON.stringify(fixtures2);
    console.log(`\n🔄 Deterministic: ${isDeterministic ? '✅' : '❌'}`);
    
    // Summary
    const allChecks = 
      fixtures.length === 15 &&
      types.size === 7 &&
      trustLevels.size === 3 &&
      expired >= 1 &&
      sponsored >= 3 &&
      zeroReward >= 1 &&
      redTrust >= 1 &&
      isDeterministic;
    
    console.log(`\n${allChecks ? '✅ All checks passed!' : '❌ Some checks failed'}`);
    
    process.exit(allChecks ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error verifying fixtures:', error.message);
    process.exit(1);
  }
}

verifyFixtures();
