/**
 * Tests for CEX Integration (Deno)
 * 
 * Tests encryption, decryption, and CEX API signing
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  encryptCredential,
  decryptCredential,
  signCexRequest,
  isSupportedExchange,
  SUPPORTED_EXCHANGES,
} from '../cex-integration.ts';

// ============================================================================
// ENCRYPTION TESTS
// ============================================================================

Deno.test('encryptCredential - encrypts plaintext', async () => {
  const plaintext = 'my-secret-api-key';
  const encrypted = await encryptCredential(plaintext);
  
  assertExists(encrypted);
  assertEquals(typeof encrypted, 'string');
  assertEquals(encrypted.includes(':'), true, 'Should contain IV separator');
});

Deno.test('decryptCredential - decrypts ciphertext', async () => {
  const plaintext = 'my-secret-api-key';
  const encrypted = await encryptCredential(plaintext);
  const decrypted = await decryptCredential(encrypted);
  
  assertEquals(decrypted, plaintext);
});

Deno.test('encryptCredential - produces different ciphertexts for same plaintext', async () => {
  const plaintext = 'my-secret-api-key';
  const encrypted1 = await encryptCredential(plaintext);
  const encrypted2 = await encryptCredential(plaintext);
  
  // Different IVs should produce different ciphertexts
  assertEquals(encrypted1 !== encrypted2, true);
  
  // But both should decrypt to same plaintext
  const decrypted1 = await decryptCredential(encrypted1);
  const decrypted2 = await decryptCredential(encrypted2);
  assertEquals(decrypted1, plaintext);
  assertEquals(decrypted2, plaintext);
});

Deno.test('encryptCredential - handles empty string', async () => {
  const plaintext = '';
  const encrypted = await encryptCredential(plaintext);
  const decrypted = await decryptCredential(encrypted);
  
  assertEquals(decrypted, plaintext);
});

Deno.test('encryptCredential - handles special characters', async () => {
  const plaintext = 'key-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
  const encrypted = await encryptCredential(plaintext);
  const decrypted = await decryptCredential(encrypted);
  
  assertEquals(decrypted, plaintext);
});

// ============================================================================
// CEX API SIGNING TESTS
// ============================================================================

Deno.test('signCexRequest - signs message with HMAC-SHA256', async () => {
  const secret = 'my-secret-key';
  const message = 'timestamp=1234567890&symbol=BTCUSDT';
  
  const signature = await signCexRequest(secret, message);
  
  assertExists(signature);
  assertEquals(typeof signature, 'string');
  assertEquals(signature.length, 64, 'SHA-256 hex signature should be 64 chars');
});

Deno.test('signCexRequest - produces consistent signatures', async () => {
  const secret = 'my-secret-key';
  const message = 'timestamp=1234567890&symbol=BTCUSDT';
  
  const signature1 = await signCexRequest(secret, message);
  const signature2 = await signCexRequest(secret, message);
  
  assertEquals(signature1, signature2, 'Same input should produce same signature');
});

Deno.test('signCexRequest - produces different signatures for different messages', async () => {
  const secret = 'my-secret-key';
  const message1 = 'timestamp=1234567890&symbol=BTCUSDT';
  const message2 = 'timestamp=9876543210&symbol=ETHUSDT';
  
  const signature1 = await signCexRequest(secret, message1);
  const signature2 = await signCexRequest(secret, message2);
  
  assertEquals(signature1 !== signature2, true);
});

Deno.test('signCexRequest - produces different signatures for different secrets', async () => {
  const secret1 = 'secret-key-1';
  const secret2 = 'secret-key-2';
  const message = 'timestamp=1234567890&symbol=BTCUSDT';
  
  const signature1 = await signCexRequest(secret1, message);
  const signature2 = await signCexRequest(secret2, message);
  
  assertEquals(signature1 !== signature2, true);
});

// ============================================================================
// SUPPORTED EXCHANGES TESTS
// ============================================================================

Deno.test('isSupportedExchange - returns true for supported exchanges', () => {
  for (const exchange of SUPPORTED_EXCHANGES) {
    assertEquals(isSupportedExchange(exchange), true);
  }
});

Deno.test('isSupportedExchange - returns false for unsupported exchanges', () => {
  assertEquals(isSupportedExchange('FakeExchange'), false);
  assertEquals(isSupportedExchange(''), false);
  assertEquals(isSupportedExchange('binance'), false); // case-sensitive
});

Deno.test('SUPPORTED_EXCHANGES - contains expected exchanges', () => {
  assertEquals(SUPPORTED_EXCHANGES.includes('Binance'), true);
  assertEquals(SUPPORTED_EXCHANGES.includes('Coinbase'), true);
  assertEquals(SUPPORTED_EXCHANGES.includes('Kraken'), true);
  assertEquals(SUPPORTED_EXCHANGES.includes('Gemini'), true);
  assertEquals(SUPPORTED_EXCHANGES.includes('Bitfinex'), true);
});

// ============================================================================
// INTEGRATION TESTS (require Supabase)
// ============================================================================

// Note: These tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// They are skipped if environment variables are not set

const hasSupabaseEnv = Deno.env.get('SUPABASE_URL') && Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (hasSupabaseEnv) {
  Deno.test('getCexAccounts - returns empty array for user with no accounts', async () => {
    const { getCexAccounts } = await import('../cex-integration.ts');
    const userId = 'test-user-no-accounts';
    
    const accounts = await getCexAccounts(userId);
    assertEquals(Array.isArray(accounts), true);
  });
} else {
  console.log('⚠️  Skipping Supabase integration tests (env vars not set)');
}
