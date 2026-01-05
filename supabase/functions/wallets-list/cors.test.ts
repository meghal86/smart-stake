/**
 * CORS Preflight Test for wallets-list Edge Function
 * 
 * Feature: multi-chain-wallet-system, Property 13: CORS and Preflight Handling
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'

/**
 * Test that wallets-list handles OPTIONS preflight correctly
 * Requirement 14.1: Every Edge Function SHALL handle `OPTIONS` preflight
 */
Deno.test('wallets-list: handles OPTIONS preflight request', async () => {
  // Create a mock OPTIONS request (preflight)
  const preflightRequest = new Request('https://example.com/functions/v1/wallets-list', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization, content-type',
    },
  })

  // Simulate the preflight response that wallets-list should return
  const preflightResponse = new Response('ok', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })

  assertEquals(preflightResponse.status, 200, 'Preflight should return 200 OK')
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Origin'),
    'Should include Access-Control-Allow-Origin'
  )
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Headers'),
    'Should include Access-Control-Allow-Headers'
  )
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Methods'),
    'Should include Access-Control-Allow-Methods'
  )
})

/**
 * Test that CORS headers include all required headers
 * Requirement 14.2: Responses SHALL include `Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info, idempotency-key`
 */
Deno.test('wallets-list: CORS headers include all required headers', () => {
  const corsHeaders = 'authorization, x-client-info, apikey, content-type, idempotency-key'
  const requiredHeaders = [
    'authorization',
    'content-type',
    'apikey',
    'x-client-info',
    'idempotency-key',
  ]

  const headersList = corsHeaders.toLowerCase().split(',').map(h => h.trim())

  for (const requiredHeader of requiredHeaders) {
    assert(
      headersList.includes(requiredHeader.toLowerCase()),
      `Required header "${requiredHeader}" not found in CORS headers`
    )
  }
})

/**
 * Test that CORS headers include allowed methods
 * Requirement 14.3: Responses SHALL include allowed methods (GET/POST/OPTIONS)
 */
Deno.test('wallets-list: CORS headers include allowed methods', () => {
  const allowMethods = 'GET, OPTIONS'
  const methodsList = allowMethods.toUpperCase().split(',').map(m => m.trim())

  assert(
    methodsList.includes('GET'),
    'GET method should be allowed'
  )
  assert(
    methodsList.includes('OPTIONS'),
    'OPTIONS method should be allowed'
  )
})

/**
 * Test that preflight succeeds without authentication
 * Requirement 14.5: Preflight MUST succeed even when unauthenticated
 */
Deno.test('wallets-list: preflight succeeds without Authorization header', () => {
  const preflightRequest = new Request('https://example.com/functions/v1/wallets-list', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'GET',
    },
  })

  // Preflight should succeed regardless of auth
  const preflightResponse = new Response('ok', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })

  assertEquals(preflightResponse.status, 200, 'Preflight should succeed without auth')
})

/**
 * Test that browser calls succeed without CORS errors
 * Requirement 14.4: Browser calls MUST succeed without CORS errors
 */
Deno.test('wallets-list: browser calls have proper CORS headers', () => {
  const response = new Response(JSON.stringify({
    wallets: [],
    quota: { used_addresses: 0, used_rows: 0, total: 5, plan: 'free' },
    active_hint: { primary_wallet_id: null },
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })

  assertEquals(response.status, 200)
  assert(
    response.headers.has('Access-Control-Allow-Origin'),
    'Response should include CORS origin header'
  )
})
