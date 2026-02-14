/**
 * Integration tests for portfolio cleanup jobs
 * 
 * Tests the scheduled cleanup functions for:
 * - Expired simulation receipts
 * - Old portfolio snapshots
 * 
 * Requirements: R8.6 - Cleanup Job
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Skip tests if no service key is available
const skipIfNoServiceKey = supabaseServiceKey ? test : test.skip;

describe('Feature: unified-portfolio, Cleanup Jobs Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create a test user for isolation
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-cleanup-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });
    
    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }
    
    testUserId = userData.user.id;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      // Delete test user's data
      await supabase.from('simulation_receipts').delete().eq('user_id', testUserId);
      await supabase.from('portfolio_snapshots').delete().eq('user_id', testUserId);
      await supabase.from('intent_plans').delete().eq('user_id', testUserId);
      
      // Delete test user
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('cleanup_expired_simulation_receipts', () => {
    skipIfNoServiceKey('should delete expired simulation receipts', async () => {
      // Create a test intent plan first
      const { data: planData, error: planError } = await supabase
        .from('intent_plans')
        .insert({
          user_id: testUserId,
          intent: 'test-intent',
          wallet_scope: { mode: 'active_wallet', address: '0x1234567890123456789012345678901234567890' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: `test-key-${Date.now()}`,
        })
        .select()
        .single();

      if (planError || !planData) {
        throw new Error(`Failed to create test plan: ${planError?.message}`);
      }

      // Create expired and non-expired simulation receipts
      const now = new Date();
      const expiredTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const { error: insertError } = await supabase
        .from('simulation_receipts')
        .insert([
          {
            id: 'expired-receipt-1',
            plan_id: planData.id,
            user_id: testUserId,
            wallet_scope_hash: 'hash1',
            chain_set_hash: 'chain1',
            simulator_version: 'v1',
            expires_at: expiredTime.toISOString(),
          },
          {
            id: 'expired-receipt-2',
            plan_id: planData.id,
            user_id: testUserId,
            wallet_scope_hash: 'hash2',
            chain_set_hash: 'chain2',
            simulator_version: 'v1',
            expires_at: expiredTime.toISOString(),
          },
          {
            id: 'valid-receipt',
            plan_id: planData.id,
            user_id: testUserId,
            wallet_scope_hash: 'hash3',
            chain_set_hash: 'chain3',
            simulator_version: 'v1',
            expires_at: futureTime.toISOString(),
          },
        ]);

      expect(insertError).toBeNull();

      // Call the cleanup function
      const { data: deletedCount, error: cleanupError } = await supabase
        .rpc('cleanup_expired_simulation_receipts');

      expect(cleanupError).toBeNull();
      expect(deletedCount).toBeGreaterThanOrEqual(2); // At least our 2 expired receipts

      // Verify expired receipts are deleted
      const { data: remainingReceipts, error: selectError } = await supabase
        .from('simulation_receipts')
        .select('id')
        .eq('user_id', testUserId);

      expect(selectError).toBeNull();
      expect(remainingReceipts).toHaveLength(1);
      expect(remainingReceipts?.[0].id).toBe('valid-receipt');
    });

    skipIfNoServiceKey('should return 0 when no expired receipts exist', async () => {
      // Call cleanup with no expired receipts
      const { data: deletedCount, error } = await supabase
        .rpc('cleanup_expired_simulation_receipts');

      expect(error).toBeNull();
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanup_old_portfolio_snapshots', () => {
    skipIfNoServiceKey('should keep only last N snapshots per scope', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      const scopeKey = walletAddress.toLowerCase();

      // Create 15 snapshots for the same scope
      const snapshots = Array.from({ length: 15 }, (_, i) => ({
        user_id: testUserId,
        wallet_address: walletAddress,
        scope_mode: 'active_wallet',
        scope_key: scopeKey,
        net_worth: 1000 + i,
        delta_24h: 10,
        freshness_sec: 60,
        confidence: 0.85,
        risk_score: 0.15,
        positions: [],
        // Stagger the updated_at times
        updated_at: new Date(Date.now() - (15 - i) * 60000).toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('portfolio_snapshots')
        .insert(snapshots);

      expect(insertError).toBeNull();

      // Verify all 15 were inserted
      const { data: beforeCleanup, error: beforeError } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', testUserId);

      expect(beforeError).toBeNull();
      expect(beforeCleanup).toHaveLength(15);

      // Call cleanup function to keep last 10
      const { data: deletedCount, error: cleanupError } = await supabase
        .rpc('cleanup_old_portfolio_snapshots', { keep_count: 10 });

      expect(cleanupError).toBeNull();
      expect(deletedCount).toBeGreaterThanOrEqual(5); // At least our 5 old snapshots

      // Verify only 10 remain
      const { data: afterCleanup, error: afterError } = await supabase
        .from('portfolio_snapshots')
        .select('net_worth, updated_at')
        .eq('user_id', testUserId)
        .order('updated_at', { ascending: false });

      expect(afterError).toBeNull();
      expect(afterCleanup).toHaveLength(10);

      // Verify the most recent 10 are kept (net_worth 5-14)
      const netWorths = afterCleanup?.map(s => s.net_worth) || [];
      expect(Math.min(...netWorths)).toBeGreaterThanOrEqual(1005);
      expect(Math.max(...netWorths)).toBe(1014);
    });

    skipIfNoServiceKey('should handle multiple scopes independently', async () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';

      // Create 12 snapshots for wallet1
      const snapshots1 = Array.from({ length: 12 }, (_, i) => ({
        user_id: testUserId,
        wallet_address: wallet1,
        scope_mode: 'active_wallet',
        scope_key: wallet1.toLowerCase(),
        net_worth: 1000 + i,
        delta_24h: 10,
        freshness_sec: 60,
        confidence: 0.85,
        risk_score: 0.15,
        positions: [],
        updated_at: new Date(Date.now() - (12 - i) * 60000).toISOString(),
      }));

      // Create 8 snapshots for wallet2
      const snapshots2 = Array.from({ length: 8 }, (_, i) => ({
        user_id: testUserId,
        wallet_address: wallet2,
        scope_mode: 'active_wallet',
        scope_key: wallet2.toLowerCase(),
        net_worth: 2000 + i,
        delta_24h: 20,
        freshness_sec: 60,
        confidence: 0.85,
        risk_score: 0.15,
        positions: [],
        updated_at: new Date(Date.now() - (8 - i) * 60000).toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('portfolio_snapshots')
        .insert([...snapshots1, ...snapshots2]);

      expect(insertError).toBeNull();

      // Call cleanup to keep last 10 per scope
      const { data: deletedCount, error: cleanupError } = await supabase
        .rpc('cleanup_old_portfolio_snapshots', { keep_count: 10 });

      expect(cleanupError).toBeNull();
      expect(deletedCount).toBeGreaterThanOrEqual(2); // At least 2 from wallet1

      // Verify wallet1 has 10 snapshots
      const { data: wallet1Snapshots, error: wallet1Error } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', testUserId)
        .eq('scope_key', wallet1.toLowerCase());

      expect(wallet1Error).toBeNull();
      expect(wallet1Snapshots).toHaveLength(10);

      // Verify wallet2 still has all 8 snapshots (less than keep_count)
      const { data: wallet2Snapshots, error: wallet2Error } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', testUserId)
        .eq('scope_key', wallet2.toLowerCase());

      expect(wallet2Error).toBeNull();
      expect(wallet2Snapshots).toHaveLength(8);
    });

    skipIfNoServiceKey('should use default keep_count of 10 when not specified', async () => {
      const walletAddress = '0x3333333333333333333333333333333333333333';
      const scopeKey = walletAddress.toLowerCase();

      // Create 15 snapshots
      const snapshots = Array.from({ length: 15 }, (_, i) => ({
        user_id: testUserId,
        wallet_address: walletAddress,
        scope_mode: 'active_wallet',
        scope_key: scopeKey,
        net_worth: 3000 + i,
        delta_24h: 30,
        freshness_sec: 60,
        confidence: 0.85,
        risk_score: 0.15,
        positions: [],
        updated_at: new Date(Date.now() - (15 - i) * 60000).toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('portfolio_snapshots')
        .insert(snapshots);

      expect(insertError).toBeNull();

      // Call cleanup without specifying keep_count (should default to 10)
      const { data: deletedCount, error: cleanupError } = await supabase
        .rpc('cleanup_old_portfolio_snapshots');

      expect(cleanupError).toBeNull();
      expect(deletedCount).toBeGreaterThanOrEqual(5);

      // Verify only 10 remain
      const { data: afterCleanup, error: afterError } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', testUserId)
        .eq('scope_key', scopeKey);

      expect(afterError).toBeNull();
      expect(afterCleanup).toHaveLength(10);
    });
  });
});
