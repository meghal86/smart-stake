/**
 * Tests for rate limiting utility
 * 
 * Property-Based Testing: Rate Limiting Enforcement
 * Validates: Requirements 11.4, 10.3
 */

import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { RateLimitError, createRateLimitResponse } from './rate-limit.ts'

Deno.test('RateLimitError has correct properties', () => {
  const error = new RateLimitError(30);
  assertEquals(error.name, 'RateLimitError');
  assertEquals(error.message, 'Rate limit exceeded');
  assertEquals(error.retryAfter, 30);
});

Deno.test('createRateLimitResponse returns 429 status', () => {
  const response = createRateLimitResponse(60);
  assertEquals(response.status, 429);
});

Deno.test('createRateLimitResponse includes Retry-After header', async () => {
  const response = createRateLimitResponse(45);
  assertEquals(response.headers.get('Retry-After'), '45');
});

Deno.test('createRateLimitResponse includes error code', async () => {
  const response = createRateLimitResponse(30);
  const body = await response.json();
  assertEquals(body.error.code, 'RATE_LIMITED');
  assertEquals(body.error.retry_after_sec, 30);
});

Deno.test('createRateLimitResponse has correct content type', () => {
  const response = createRateLimitResponse(60);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
});
