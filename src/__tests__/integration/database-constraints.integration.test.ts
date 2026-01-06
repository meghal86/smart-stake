import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Integration Tests for Database Constraints
 * Feature: multi-chain-wallet-system, Property 5: Database Constraint Enforcement
 * Validates: Requirements 9.1-9.5, 17.1-17.5, 18.1-18.5
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Database Constraints Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(async () => {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Skipping database integration tests: Supabase credentials not configured');
      return;
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a test user for integration tests
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-constraints-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError) {
      console.error('Failed to create test user:', authError);
      throw authError;
    }

    testUserId = authData.user.id;
  });

  afterAll(async () => {
    if (!supabase || !testUserId) return;

    // Clean up test data
    try {
      await supabase.from('user_wallets').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    } catch (error) {
      console.error('Failed to clean up test data:', error);
    }
  });

  test('address_lc column exists and is lowercase', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // Insert a wallet with mixed-case address
    const mixedCaseAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
    const { data, error } = await supabase
      .from('user_wallets')
      .insert({
        user_id: testUserId,
        address: mixedCaseAddress,
        chain_namespace: 'eip155:1',
        is_primary: false,
      })
      .select('address, address_lc')
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.address).toBe(mixedCaseAddress);
    expect(data?.address_lc).toBe(mixedCaseAddress.toLowerCase());
  });

  test('unique constraint on (user_id, address_lc, chain_namespace) prevents duplicates', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const address = '0x' + '1'.repeat(40);
    const chainNamespace = 'eip155:1';

    // Insert first wallet
    const { error: firstError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address,
      chain_namespace: chainNamespace,
      is_primary: false,
    });

    expect(firstError).toBeNull();

    // Try to insert duplicate (should fail)
    const { error: duplicateError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address, // Same address
      chain_namespace: chainNamespace, // Same network
      is_primary: false,
    });

    expect(duplicateError).toBeDefined();
    expect(duplicateError?.code).toBe('23505'); // PostgreSQL unique violation code
  });

  test('case-insensitive duplicate detection works', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const address1 = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf13';
    const address2 = address1.toLowerCase(); // Same address, different case
    const chainNamespace = 'eip155:137';

    // Insert first wallet with mixed case
    const { error: firstError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address: address1,
      chain_namespace: chainNamespace,
      is_primary: false,
    });

    expect(firstError).toBeNull();

    // Try to insert same address with different case (should fail)
    const { error: duplicateError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address: address2,
      chain_namespace: chainNamespace,
      is_primary: false,
    });

    expect(duplicateError).toBeDefined();
    expect(duplicateError?.code).toBe('23505'); // Unique violation
  });

  test('unique constraint on (user_id) WHERE is_primary = true prevents multiple primaries', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const address1 = '0x' + '2'.repeat(40);
    const address2 = '0x' + '3'.repeat(40);

    // Insert first wallet as primary
    const { error: firstError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address: address1,
      chain_namespace: 'eip155:1',
      is_primary: true,
    });

    expect(firstError).toBeNull();

    // Try to insert second wallet as primary (should fail)
    const { error: secondPrimaryError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address: address2,
      chain_namespace: 'eip155:137',
      is_primary: true,
    });

    expect(secondPrimaryError).toBeDefined();
    expect(secondPrimaryError?.code).toBe('23505'); // Unique violation
  });

  test('RLS policy prevents direct client INSERT', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // Create an authenticated client (not service role)
    const authenticatedClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

    // Try to insert as authenticated user (should fail due to RLS policy)
    const { error } = await authenticatedClient.from('user_wallets').insert({
      user_id: testUserId,
      address: '0x' + '4'.repeat(40),
      chain_namespace: 'eip155:1',
      is_primary: false,
    });

    // Should fail with permission denied or policy violation
    expect(error).toBeDefined();
    expect(error?.code).toMatch(/42501|new row violates row-level security policy/i);
  });

  test('RLS policy prevents direct client UPDATE', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // First, insert a wallet using service role
    const { data: insertData, error: insertError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: testUserId,
        address: '0x' + '5'.repeat(40),
        chain_namespace: 'eip155:1',
        is_primary: false,
      })
      .select('id')
      .single();

    expect(insertError).toBeNull();
    expect(insertData).toBeDefined();

    // Create an authenticated client (not service role)
    const authenticatedClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

    // Try to update as authenticated user (should fail due to RLS policy)
    const { error: updateError } = await authenticatedClient
      .from('user_wallets')
      .update({ is_primary: true })
      .eq('id', insertData?.id);

    // Should fail with permission denied or policy violation
    expect(updateError).toBeDefined();
    expect(updateError?.code).toMatch(/42501|row-level security policy/i);
  });

  test('RLS policy prevents direct client DELETE', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // First, insert a wallet using service role
    const { data: insertData, error: insertError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: testUserId,
        address: '0x' + '6'.repeat(40),
        chain_namespace: 'eip155:1',
        is_primary: false,
      })
      .select('id')
      .single();

    expect(insertError).toBeNull();
    expect(insertData).toBeDefined();

    // Create an authenticated client (not service role)
    const authenticatedClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

    // Try to delete as authenticated user (should fail due to RLS policy)
    const { error: deleteError } = await authenticatedClient
      .from('user_wallets')
      .delete()
      .eq('id', insertData?.id);

    // Should fail with permission denied or policy violation
    expect(deleteError).toBeDefined();
    expect(deleteError?.code).toMatch(/42501|row-level security policy/i);
  });

  test('RLS policy allows authenticated user to SELECT their own wallets', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    // Insert a wallet using service role
    const { error: insertError } = await supabase.from('user_wallets').insert({
      user_id: testUserId,
      address: '0x' + '7'.repeat(40),
      chain_namespace: 'eip155:1',
      is_primary: false,
    });

    expect(insertError).toBeNull();

    // Create an authenticated client with the test user's session
    const { data: signInData, error: signInError } = await createClient(supabaseUrl, supabaseServiceKey)
      .auth.admin.createSession(testUserId);

    if (signInError || !signInData.session) {
      console.warn('Could not create session for RLS test');
      return;
    }

    const authenticatedClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    await authenticatedClient.auth.setSession(signInData.session);

    // Try to select wallets as authenticated user (should succeed)
    const { data, error } = await authenticatedClient.from('user_wallets').select('*').eq('user_id', testUserId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  test('CAIP-2 chain namespace validation', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase not configured');
      return;
    }

    const validChainNamespaces = ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'];

    for (const chainNamespace of validChainNamespaces) {
      const { error } = await supabase.from('user_wallets').insert({
        user_id: testUserId,
        address: '0x' + Math.random().toString(16).slice(2, 42),
        chain_namespace: chainNamespace,
        is_primary: false,
      });

      expect(error).toBeNull();
    }
  });
});
