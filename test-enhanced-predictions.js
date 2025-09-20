#!/usr/bin/env node

// Test script for enhanced whale predictions
import https from 'https';

const SUPABASE_URL = 'https://rebeznxivaxgserswhbn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo';

async function testPredictionsAPI() {
  console.log('🧪 Testing Enhanced Whale Predictions API\n');
  
  const options = {
    hostname: 'rebeznxivaxgserswhbn.supabase.co',
    port: 443,
    path: '/functions/v1/whale-predictions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function validatePrediction(prediction, index) {
  console.log(`\n📊 Prediction ${index + 1}: ${prediction.asset} ${prediction.prediction_type}`);
  
  // Test 1: Schema completeness
  const requiredFields = ['id', 'asset', 'confidence', 'features', 'context', 'provenance', 'quality'];
  const missingFields = requiredFields.filter(field => !prediction[field]);
  
  if (missingFields.length === 0) {
    console.log('✅ Schema: Complete');
  } else {
    console.log('❌ Schema: Missing fields:', missingFields);
  }
  
  // Test 2: Consistency check
  const whaleCount = prediction.context?.whale_count || 0;
  const explanation = prediction.explanation || '';
  const whaleVolumeScore = prediction.features?.whale_volume?.score || 0;
  
  const explanationMentionsWhales = explanation.includes(`${whaleCount} active whales`) || 
                                   explanation.includes(`${whaleCount} whales`) ||
                                   explanation.includes(`${whaleCount} BTC whales`) ||
                                   explanation.includes('No new elevated wallets');
  
  if (explanationMentionsWhales) {
    console.log('✅ Consistency: Whale count matches explanation');
  } else {
    console.log('❌ Consistency: Whale count mismatch in explanation');
  }
  
  // Test 3: Feature format
  const hasStructuredFeatures = Object.values(prediction.features || {}).every(
    feature => typeof feature === 'object' && typeof feature.score === 'number'
  );
  
  if (hasStructuredFeatures) {
    console.log('✅ Features: Properly structured');
  } else {
    console.log('❌ Features: Invalid structure');
  }
  
  // Test 4: Provenance
  const hasProvenance = prediction.provenance && 
                       prediction.provenance.sources &&
                       prediction.provenance.block_number &&
                       prediction.provenance.tx_hashes_sample;
  
  if (hasProvenance) {
    console.log('✅ Provenance: Complete audit trail');
    console.log(`   Sources: ${prediction.provenance.sources.join(', ')}`);
    console.log(`   Block: #${prediction.provenance.block_number}`);
    console.log(`   Sample TXs: ${prediction.provenance.tx_hashes_sample.length}`);
  } else {
    console.log('❌ Provenance: Missing audit trail');
  }
  
  // Test 5: Quality indicators
  if (prediction.quality && prediction.quality.status) {
    console.log(`✅ Quality: ${prediction.quality.status}`);
    if (prediction.quality.reason) {
      console.log(`   Reason: ${prediction.quality.reason}`);
    }
  } else {
    console.log('❌ Quality: Missing status');
  }
  
  // Test 6: Price prediction semantics (if applicable)
  if (prediction.prediction_type === 'price_movement') {
    const hasSemantics = prediction.basis_price && 
                        prediction.target_price && 
                        prediction.delta_pct !== undefined;
    
    if (hasSemantics) {
      console.log('✅ Price Semantics: Clear target and delta');
      console.log(`   ${prediction.basis_price} → ${prediction.target_price} (${prediction.delta_pct}%)`);
    } else {
      console.log('❌ Price Semantics: Missing clear targets');
    }
  }
  
  return {
    schemaComplete: missingFields.length === 0,
    consistent: explanationMentionsWhales,
    structuredFeatures: hasStructuredFeatures,
    hasProvenance,
    hasQuality: !!prediction.quality?.status
  };
}

async function runTests() {
  try {
    const response = await testPredictionsAPI();
    
    if (!response.predictions || !Array.isArray(response.predictions)) {
      console.log('❌ API Response: Invalid format');
      return;
    }
    
    console.log(`✅ API Response: ${response.predictions.length} predictions received\n`);
    
    const results = response.predictions.map(validatePrediction);
    
    // Summary
    console.log('\n📈 Test Summary:');
    console.log(`Schema Complete: ${results.filter(r => r.schemaComplete).length}/${results.length}`);
    console.log(`Consistency: ${results.filter(r => r.consistent).length}/${results.length}`);
    console.log(`Structured Features: ${results.filter(r => r.structuredFeatures).length}/${results.length}`);
    console.log(`Provenance: ${results.filter(r => r.hasProvenance).length}/${results.length}`);
    console.log(`Quality Indicators: ${results.filter(r => r.hasQuality).length}/${results.length}`);
    
    const allPassed = results.every(r => 
      r.schemaComplete && r.consistent && r.structuredFeatures && r.hasProvenance && r.hasQuality
    );
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Enhanced predictions are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();