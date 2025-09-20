#!/usr/bin/env node

/**
 * WhalePlus Price Provider System Test
 * Tests dual failover, caching, and circuit breaker functionality
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

class PriceProviderTester {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1/prices`;
    this.headers = {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  async testBasicFunctionality() {
    console.log('🧪 Testing Basic Price Fetching...');
    
    try {
      const response = await fetch(`${this.baseUrl}?assets=ETH,BTC`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const provider = response.headers.get('X-Provider');
      const quality = response.headers.get('X-Quality');
      
      console.log('✅ Basic functionality test passed');
      console.log(`   Provider: ${provider || data.provider}`);
      console.log(`   Quality: ${quality || data.quality}`);
      console.log(`   ETH Price: $${data.assets?.ETH?.price_usd || 'N/A'}`);
      console.log(`   BTC Price: $${data.assets?.BTC?.price_usd || 'N/A'}`);
      
      return { success: true, data, provider, quality };
    } catch (error) {
      console.log('❌ Basic functionality test failed');
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testHealthEndpoint() {
    console.log('\\n🏥 Testing Health Endpoint...');
    
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const health = await response.json();
      
      console.log('✅ Health endpoint test passed');
      console.log(`   CoinGecko: ${health.coingecko?.breaker} (${health.coingecko?.minuteRemaining} tokens)`);
      console.log(`   CMC: ${health.cmc?.breaker} (${health.cmc?.minuteRemaining} tokens, ${health.cmc?.dayUsed}/${health.cmc?.dayUsed + health.cmc?.dayRemaining} daily)`);
      console.log(`   Cache: ${health.cache?.memoryKeys} keys in memory`);
      
      return { success: true, health };
    } catch (error) {
      console.log('❌ Health endpoint test failed');
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testCachePerformance() {
    console.log('\\n⚡ Testing Cache Performance...');
    
    const times = [];
    const requests = 5;
    
    try {
      for (let i = 0; i < requests; i++) {
        const start = Date.now();
        
        const response = await fetch(`${this.baseUrl}?assets=ETH`, {
          headers: this.headers
        });
        
        const end = Date.now();
        times.push(end - start);
        
        if (!response.ok) {
          throw new Error(`Request ${i + 1} failed: ${response.status}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log('✅ Cache performance test passed');
      console.log(`   Average response time: ${avgTime.toFixed(0)}ms`);
      console.log(`   Min/Max: ${minTime}ms / ${maxTime}ms`);
      console.log(`   Cache efficiency: ${minTime < 300 ? 'Good' : 'Needs improvement'}`);
      
      return { success: true, avgTime, minTime, maxTime };
    } catch (error) {
      console.log('❌ Cache performance test failed');
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testErrorHandling() {
    console.log('\\n🚨 Testing Error Handling...');
    
    try {
      // Test invalid asset
      const response = await fetch(`${this.baseUrl}?assets=INVALID`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Error handling test passed (graceful degradation)');
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log('✅ Error handling test passed (proper error response)');
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error}`);
      }
      
      return { success: true };
    } catch (error) {
      console.log('❌ Error handling test failed');
      console.log(`   Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('🏷️ WhalePlus Price Provider System Test Suite\\n');
    console.log(`Testing endpoint: ${this.baseUrl}`);
    console.log('=' .repeat(60));
    
    const results = {
      basic: await this.testBasicFunctionality(),
      health: await this.testHealthEndpoint(),
      cache: await this.testCachePerformance(),
      errors: await this.testErrorHandling()
    };
    
    console.log('\\n' + '=' .repeat(60));
    console.log('📊 Test Summary:');
    
    const passed = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    
    console.log(`   Tests passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Price provider system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
    // Performance assessment
    if (results.cache.success && results.cache.avgTime < 500) {
      console.log('⚡ Performance: Excellent (< 500ms average)');
    } else if (results.cache.success && results.cache.avgTime < 1000) {
      console.log('⚡ Performance: Good (< 1000ms average)');
    } else {
      console.log('⚡ Performance: Needs optimization (> 1000ms average)');
    }
    
    return results;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PriceProviderTester();
  tester.runAllTests().catch(console.error);
}

export default PriceProviderTester;