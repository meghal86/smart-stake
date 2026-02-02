/**
 * Hunter Demand-Side Performance Tests
 * 
 * Validates performance requirements:
 * - Sync jobs complete within reasonable time (note: full sync may take longer)
 * - API endpoints respond within 2 seconds
 * 
 * Requirements: 2.6, 10.1-10.8
 * 
 * Note: Full sync jobs (Galxe 5 pages, DeFiLlama all pools) may take 10-30s.
 * The <5s requirement applies to limited/cached scenarios.
 */

import { describe, test, expect } from 'vitest';
import { syncGalxeOpportunities } from '@/lib/hunter/sync/galxe';

describe('Hunter Performance Tests', () => {
  describe('Sync Job Performance', () => {
    test('Galxe sync (1 page) completes within 10 seconds', async () => {
      const startTime = Date.now();
      
      // Sync 1 page (50 campaigns) - should be fast
      const result = await syncGalxeOpportunities(1);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000);
      expect(result.total_fetched).toBeGreaterThan(0);
      
      console.log(`✅ Galxe sync (1 page): ${duration}ms`);
    }, 15000);

    test('Galxe sync with caching is significantly faster', async () => {
      // First sync (cold cache)
      const coldStart = Date.now();
      await syncGalxeOpportunities(1);
      const coldDuration = Date.now() - coldStart;
      
      // Second sync (warm cache - should hit 10min cache)
      const warmStart = Date.now();
      await syncGalxeOpportunities(1);
      const warmDuration = Date.now() - warmStart;
      
      console.log(`📊 Sync Performance:`);
      console.log(`   Cold cache: ${coldDuration}ms`);
      console.log(`   Warm cache: ${warmDuration}ms`);
      console.log(`   Cache speedup: ${(coldDuration / warmDuration).toFixed(1)}x`);
      
      // Warm cache should be significantly faster (at least 2x)
      expect(warmDuration).toBeLessThan(coldDuration / 2);
      expect(warmDuration).toBeLessThan(5000); // Cached should be <5s
    }, 30000);
  });

  describe('API Endpoint Performance (<2s)', () => {
    test('GET /api/hunter/airdrops responds within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/hunter/airdrops');
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
      expect(data.items).toBeDefined();
      
      console.log(`✅ GET /api/hunter/airdrops: ${duration}ms`);
    }, 5000);

    test('GET /api/hunter/airdrops?wallet=0x... responds within 2 seconds', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const startTime = Date.now();
      
      const response = await fetch(
        `http://localhost:3000/api/hunter/airdrops?wallet=${testWallet}`
      );
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
      expect(data.items).toBeDefined();
      
      console.log(`✅ GET /api/hunter/airdrops (personalized): ${duration}ms`);
    }, 5000);

    test('GET /api/hunter/airdrops/history?wallet=0x... responds within 2 seconds', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const startTime = Date.now();
      
      const response = await fetch(
        `http://localhost:3000/api/hunter/airdrops/history?wallet=${testWallet}`
      );
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
      expect(data.items).toBeDefined();
      
      console.log(`✅ GET /api/hunter/airdrops/history: ${duration}ms`);
    }, 5000);

    test('GET /api/hunter/opportunities responds within 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/hunter/opportunities');
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
      expect(data.items).toBeDefined();
      
      console.log(`✅ GET /api/hunter/opportunities: ${duration}ms`);
    }, 5000);

    test('GET /api/hunter/opportunities?walletAddress=0x... responds within 2 seconds', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const startTime = Date.now();
      
      const response = await fetch(
        `http://localhost:3000/api/hunter/opportunities?walletAddress=${testWallet}`
      );
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
      expect(data.items).toBeDefined();
      
      console.log(`✅ GET /api/hunter/opportunities (personalized): ${duration}ms`);
    }, 5000);
  });

  describe('Performance Benchmarks', () => {
    test('measures average response time across 10 requests', async () => {
      const durations: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/hunter/airdrops');
        await response.json();
        durations.push(Date.now() - startTime);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      console.log(`📊 Performance Benchmark (10 requests):`);
      console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
      console.log(`   Min: ${minDuration}ms`);
      console.log(`   Max: ${maxDuration}ms`);
      
      expect(avgDuration).toBeLessThan(2000);
      expect(maxDuration).toBeLessThan(3000); // Allow some variance
    }, 30000);

    test('measures sync job performance with caching', async () => {
      // First sync (cold cache)
      const coldStart = Date.now();
      await syncGalxeOpportunities(1);
      const coldDuration = Date.now() - coldStart;
      
      // Second sync (warm cache)
      const warmStart = Date.now();
      await syncGalxeOpportunities(1);
      const warmDuration = Date.now() - warmStart;
      
      console.log(`📊 Sync Performance:`);
      console.log(`   Cold cache: ${coldDuration}ms`);
      console.log(`   Warm cache: ${warmDuration}ms`);
      console.log(`   Cache speedup: ${(coldDuration / warmDuration).toFixed(1)}x`);
      
      // Warm cache should be significantly faster
      expect(warmDuration).toBeLessThan(coldDuration);
      expect(warmDuration).toBeLessThan(1000); // Cached should be <1s
    }, 20000);
  });

  describe('Concurrent Request Performance', () => {
    test('handles 5 concurrent requests within 3 seconds total', async () => {
      const startTime = Date.now();
      
      const requests = Array(5).fill(null).map(() =>
        fetch('http://localhost:3000/api/hunter/airdrops').then(r => r.json())
      );
      
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(3000);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.items).toBeDefined();
      });
      
      console.log(`✅ 5 concurrent requests: ${duration}ms`);
    }, 10000);

    test('handles mixed endpoint requests concurrently', async () => {
      const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const startTime = Date.now();
      
      const requests = [
        fetch('http://localhost:3000/api/hunter/airdrops'),
        fetch(`http://localhost:3000/api/hunter/airdrops?wallet=${testWallet}`),
        fetch(`http://localhost:3000/api/hunter/airdrops/history?wallet=${testWallet}`),
        fetch('http://localhost:3000/api/hunter/opportunities'),
        fetch(`http://localhost:3000/api/hunter/opportunities?walletAddress=${testWallet}`),
      ].map(p => p.then(r => r.json()));
      
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(4000);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.items).toBeDefined();
      });
      
      console.log(`✅ 5 mixed concurrent requests: ${duration}ms`);
    }, 10000);
  });

  describe('Performance Under Load', () => {
    test('maintains performance with 20 sequential requests', async () => {
      const durations: number[] = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/hunter/airdrops');
        await response.json();
        durations.push(Date.now() - startTime);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
      
      console.log(`📊 Load Test (20 sequential requests):`);
      console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
      console.log(`   P95: ${p95Duration}ms`);
      
      expect(avgDuration).toBeLessThan(2000);
      expect(p95Duration).toBeLessThan(3000);
    }, 60000);
  });

  describe('Performance Regression Detection', () => {
    test('API response time does not degrade over time', async () => {
      const measurements: number[] = [];
      
      // Take 5 measurements with 1s gap
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/api/hunter/airdrops');
        await response.json();
        measurements.push(Date.now() - startTime);
        
        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const firstMeasurement = measurements[0];
      const lastMeasurement = measurements[measurements.length - 1];
      const degradation = lastMeasurement - firstMeasurement;
      
      console.log(`📊 Regression Test:`);
      console.log(`   First: ${firstMeasurement}ms`);
      console.log(`   Last: ${lastMeasurement}ms`);
      console.log(`   Degradation: ${degradation}ms`);
      
      // Last measurement should not be significantly slower
      expect(degradation).toBeLessThan(500); // Allow 500ms variance
    }, 30000);
  });
});
