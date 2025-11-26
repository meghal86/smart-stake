/**
 * Guardian Adapter Tests
 * Tests for Guardian API integration with mock fallback
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  getGuardianScore,
  getGuardianScores,
  classifyRiskFromScore,
  clearGuardianCache,
  getGuardianCacheStats,
  type GuardianScore,
} from '../guardian-adapter.ts';

Deno.test('Guardian Adapter - getGuardianScore returns mock score', async () => {
  // Clear cache first
  clearGuardianCache();
  
  const score = await getGuardianScore('ETH');
  
  assertExists(score);
  assertEquals(score.token, 'ETH');
  assertEquals(typeof score.score, 'number');
  assertEquals(score.score >= 0 && score.score <= 10, true);
  assertExists(score.riskLevel);
  assertExists(score.lastUpdated);
  assertEquals(score.source, 'mock'); // Should use mock since Guardian API not configured
});

Deno.test('Guardian Adapter - getGuardianScore caches results', async () => {
  clearGuardianCache();
  
  // First call
  const score1 = await getGuardianScore('BTC');
  assertEquals(score1.source, 'mock');
  
  // Second call should use cache
  const score2 = await getGuardianScore('BTC');
  assertEquals(score2.source, 'cache');
  assertEquals(score1.score, score2.score);
});

Deno.test('Guardian Adapter - getGuardianScore forceRefresh bypasses cache', async () => {
  clearGuardianCache();
  
  // First call
  await getGuardianScore('USDC');
  
  // Force refresh should bypass cache
  const score = await getGuardianScore('USDC', true);
  assertEquals(score.source, 'mock'); // Should be fresh, not from cache
});

Deno.test('Guardian Adapter - getGuardianScores fetches multiple tokens', async () => {
  clearGuardianCache();
  
  const tokens = ['ETH', 'BTC', 'USDC'];
  const scores = await getGuardianScores(tokens);
  
  assertEquals(scores.size, 3);
  assertEquals(scores.has('ETH'), true);
  assertEquals(scores.has('BTC'), true);
  assertEquals(scores.has('USDC'), true);
  
  for (const [token, score] of scores) {
    assertEquals(score.token, token);
    assertEquals(typeof score.score, 'number');
    assertExists(score.riskLevel);
  }
});

Deno.test('Guardian Adapter - classifyRiskFromScore HIGH risk', () => {
  assertEquals(classifyRiskFromScore(0), 'HIGH');
  assertEquals(classifyRiskFromScore(1), 'HIGH');
  assertEquals(classifyRiskFromScore(2), 'HIGH');
  assertEquals(classifyRiskFromScore(3), 'HIGH');
});

Deno.test('Guardian Adapter - classifyRiskFromScore MEDIUM risk', () => {
  assertEquals(classifyRiskFromScore(4), 'MEDIUM');
  assertEquals(classifyRiskFromScore(5), 'MEDIUM');
  assertEquals(classifyRiskFromScore(6), 'MEDIUM');
});

Deno.test('Guardian Adapter - classifyRiskFromScore LOW risk', () => {
  assertEquals(classifyRiskFromScore(7), 'LOW');
  assertEquals(classifyRiskFromScore(8), 'LOW');
  assertEquals(classifyRiskFromScore(9), 'LOW');
  assertEquals(classifyRiskFromScore(10), 'LOW');
});

Deno.test('Guardian Adapter - cache management', async () => {
  clearGuardianCache();
  
  // Cache should be empty
  let stats = getGuardianCacheStats();
  assertEquals(stats.size, 0);
  assertEquals(stats.tokens.length, 0);
  
  // Add some scores
  await getGuardianScore('ETH');
  await getGuardianScore('BTC');
  
  // Cache should have 2 entries
  stats = getGuardianCacheStats();
  assertEquals(stats.size, 2);
  assertEquals(stats.tokens.includes('ETH'), true);
  assertEquals(stats.tokens.includes('BTC'), true);
  
  // Clear specific token
  clearGuardianCache('ETH');
  stats = getGuardianCacheStats();
  assertEquals(stats.size, 1);
  assertEquals(stats.tokens.includes('BTC'), true);
  
  // Clear all
  clearGuardianCache();
  stats = getGuardianCacheStats();
  assertEquals(stats.size, 0);
});

Deno.test('Guardian Adapter - mock score is deterministic', async () => {
  clearGuardianCache();
  
  const score1 = await getGuardianScore('TEST', true);
  const score2 = await getGuardianScore('TEST', true);
  
  assertEquals(score1.score, score2.score);
  assertEquals(score1.riskLevel, score2.riskLevel);
});

Deno.test('Guardian Adapter - normalizes token symbols to uppercase', async () => {
  clearGuardianCache();
  
  const score1 = await getGuardianScore('eth');
  const score2 = await getGuardianScore('ETH');
  const score3 = await getGuardianScore('Eth');
  
  assertEquals(score1.token, 'ETH');
  assertEquals(score2.token, 'ETH');
  assertEquals(score3.token, 'ETH');
  
  // All should have same score (deterministic mock)
  assertEquals(score1.score, score2.score);
  assertEquals(score2.score, score3.score);
});
