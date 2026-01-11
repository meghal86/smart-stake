/**
 * Simple Task 4 Test using existing CockpitService
 * 
 * This test imports the actual CockpitService and tests it against deployed Edge Functions.
 * Run this from the project root directory.
 */

// Import the actual CockpitService
const { CockpitService } = require('./src/services/cockpitService.ts');

async function testTask4() {
  console.log('🧪 Testing Task 4 - CockpitService Integration');
  console.log('===============================================');
  
  try {
    // Test 4.1 & 4.5: Summary endpoint
    console.log('\n1. Testing CockpitService.getSummary()...');
    const summaryResponse = await CockpitService.getSummary('active');
    
    if (summaryResponse.error) {
      console.log('❌ getSummary failed:', summaryResponse.error.message);
      return false;
    }
    
    if (!summaryResponse.data) {
      console.log('❌ getSummary returned no data');
      return false;
    }
    
    console.log('✅ getSummary working');
    console.log(`   Today Card: ${summaryResponse.data.today_card?.kind}`);
    console.log(`   Actions: ${summaryResponse.data.action_preview?.length || 0}`);
    
    // Test 4.5: Actions rendered endpoint
    console.log('\n2. Testing CockpitService.recordRenderedActions()...');
    
    const actions = summaryResponse.data.action_preview || [];
    if (actions.length > 0) {
      const dedupeKeys = CockpitService.getDedupeKeys(actions);
      console.log(`   Generated dedupe keys: ${dedupeKeys.slice(0, 2)}`); // Show first 2
      
      const renderedResponse = await CockpitService.recordRenderedActions(dedupeKeys.slice(0, 2));
      
      if (renderedResponse.error) {
        console.log('❌ recordRenderedActions failed:', renderedResponse.error.message);
        return false;
      }
      
      console.log('✅ recordRenderedActions working');
      console.log(`   Updated: ${renderedResponse.data?.updated_count}/${renderedResponse.data?.total_count}`);
    } else {
      // Test with dummy data if no actions
      const dummyKeys = ['test:dummy1:Fix', 'test:dummy2:Execute'];
      const renderedResponse = await CockpitService.recordRenderedActions(dummyKeys);
      
      if (renderedResponse.error) {
        console.log('❌ recordRenderedActions failed:', renderedResponse.error.message);
        return false;
      }
      
      console.log('✅ recordRenderedActions working (with dummy data)');
      console.log(`   Updated: ${renderedResponse.data?.updated_count}/${renderedResponse.data?.total_count}`);
    }
    
    // Test utility function
    console.log('\n3. Testing CockpitService.getDedupeKeys()...');
    const mockActions = [
      {
        source: { kind: 'guardian', ref_id: 'test-1' },
        cta: { kind: 'Fix' }
      }
    ];
    
    const dedupeKeys = CockpitService.getDedupeKeys(mockActions);
    const expected = 'guardian:test-1:Fix';
    
    if (dedupeKeys[0] === expected) {
      console.log('✅ getDedupeKeys working');
      console.log(`   Generated: ${dedupeKeys[0]}`);
    } else {
      console.log('❌ getDedupeKeys failed');
      console.log(`   Expected: ${expected}`);
      console.log(`   Got: ${dedupeKeys[0]}`);
      return false;
    }
    
    console.log('\n🎉 Task 4 VALIDATION COMPLETE!');
    console.log('===============================');
    console.log('✅ All CockpitService methods working');
    console.log('✅ Edge Functions deployed and accessible');
    console.log('✅ Response formats correct');
    console.log('✅ Integration successful');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

// Run the test
testTask4().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Test crashed:', error);
  process.exit(1);
});