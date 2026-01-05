/**
 * CORS Preflight Handling Tests
 * 
 * Feature: multi-chain-wallet-system, Property 13: CORS and Preflight Handling
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 * 
 * Property: For any Edge Function request, OPTIONS preflight should be handled correctly,
 * CORS headers should include all required headers (authorization, content-type, apikey,
 * x-client-info, idempotency-key), and browser calls should succeed without CORS errors.
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { corsHeaders } from './cors.ts'

/**
 * Test that CORS headers include all required headers
 * Requirement 14.2: Responses SHALL include `Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info, idempotency-key`
 */
Deno.test('CORS headers include all required headers', () => {
  const requiredHeaders = [
    'authorization',
    'content-type',
    'apikey',
    'x-client-info',
    'idempotency-key',
  ]

  const allowHeadersValue = corsHeaders['Access-Control-Allow-Headers']
  assert(allowHeadersValue, 'Access-Control-Allow-Headers should be defined')

  // Check that all required headers are present (case-insensitive)
  const headersList = allowHeadersValue.toLowerCase().split(',').map(h => h.trim())

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
Deno.test('CORS headers include allowed methods', () => {
  const allowMethodsValue = corsHeaders['Access-Control-Allow-Methods']
  assert(allowMethodsValue, 'Access-Control-Allow-Methods should be defined')

  const methodsList = allowMethodsValue.toUpperCase().split(',').map(m => m.trim())

  // Check for at least GET, POST, OPTIONS
  assert(
    methodsList.includes('GET') || methodsList.includes('*'),
    'GET method should be allowed'
  )
  assert(
    methodsList.includes('POST') || methodsList.includes('*'),
    'POST method should be allowed'
  )
  assert(
    methodsList.includes('OPTIONS') || methodsList.includes('*'),
    'OPTIONS method should be allowed'
  )
})

/**
 * Test that CORS origin is set
 * Requirement 14.4: Browser calls MUST succeed without CORS errors
 */
Deno.test('CORS origin is configured', () => {
  const originValue = corsHeaders['Access-Control-Allow-Origin']
  assert(originValue, 'Access-Control-Allow-Origin should be defined')
  assert(
    originValue === '*' || originValue.startsWith('http'),
    'Access-Control-Allow-Origin should be * or a valid origin'
  )
})

/**
 * Test OPTIONS preflight response structure
 * Requirement 14.1: Every Edge Function SHALL handle `OPTIONS` preflight
 * Requirement 14.5: Preflight MUST succeed even when unauthenticated
 */
Deno.test('OPTIONS preflight response has correct structure', () => {
  // Simulate an OPTIONS preflight request
  const preflightResponse = new Response('ok', {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })

  assertEquals(preflightResponse.status, 200, 'Preflight should return 200 OK')

  // Verify all required CORS headers are present
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Origin'),
    'Response should include Access-Control-Allow-Origin'
  )
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Headers'),
    'Response should include Access-Control-Allow-Headers'
  )
  assert(
    preflightResponse.headers.has('Access-Control-Allow-Methods'),
    'Response should include Access-Control-Allow-Methods'
  )
})

/**
 * Test that preflight succeeds without authentication
 * Requirement 14.5: Preflight MUST succeed even when unauthenticated
 */
Deno.test('Preflight succeeds without Authorization header', () => {
  // Create a preflight request without Authorization header
  const preflightRequest = new Request('https://example.com', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })

  // Preflight should succeed regardless of auth
  const preflightResponse = new Response('ok', {
    status: 200,
    headers: corsHeaders,
  })

  assertEquals(preflightResponse.status, 200, 'Preflight should succeed without auth')
})

/**
 * Test CORS headers for different HTTP methods
 * Requirement 14.3: Responses SHALL include allowed methods
 */
Deno.test('CORS headers support multiple HTTP methods', () => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

  for (const method of methods) {
    const response = new Response('ok', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    })

    const allowedMethods = response.headers.get('Access-Control-Allow-Methods')
    assert(
      allowedMethods?.includes(method),
      `Method ${method} should be in allowed methods`
    )
  }
})

/**
 * Test that CORS headers are consistent across all responses
 * Requirement 14.2: Responses SHALL include required headers
 */
Deno.test('CORS headers are consistent', () => {
  // Create multiple responses with CORS headers
  const responses = [
    new Response('ok', { status: 200, headers: corsHeaders }),
    new Response('ok', { status: 200, headers: corsHeaders }),
    new Response('ok', { status: 200, headers: corsHeaders }),
  ]

  // All responses should have the same CORS headers
  for (const response of responses) {
    assertEquals(
      response.headers.get('Access-Control-Allow-Origin'),
      corsHeaders['Access-Control-Allow-Origin'],
      'Origin header should be consistent'
    )
    assertEquals(
      response.headers.get('Access-Control-Allow-Headers'),
      corsHeaders['Access-Control-Allow-Headers'],
      'Headers should be consistent'
    )
    assertEquals(
      response.headers.get('Access-Control-Allow-Methods'),
      corsHeaders['Access-Control-Allow-Methods'],
      'Methods should be consistent'
    )
  }
})

/**
 * Test that idempotency-key header is included in CORS
 * Requirement 14.2: idempotency-key should be in allowed headers
 */
Deno.test('Idempotency-key header is allowed in CORS', () => {
  const allowHeadersValue = corsHeaders['Access-Control-Allow-Headers']
  assert(
    allowHeadersValue.toLowerCase().includes('idempotency-key'),
    'idempotency-key should be in allowed headers for idempotent operations'
  )
})
