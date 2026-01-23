/**
 * Integration Test: Portfolio Database Schema Constraints
 * 
 * Feature: unified-portfolio
 * Validates: Requirements 1.1
 * 
 * Tests database schema constraints, triggers, and RLS policies
 * for the unified portfolio system.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test user ID for consistent testing
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

describe('Portfolio Database Schema Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await supabase.from('portfolio_snapshots').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('approval_risks').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('intent_plans').delete().eq('user_id', TEST_USER_ID)
  })

  afterAll(async () => {
    // Clean up test data
    await supabase.from('portfolio_snapshots').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('approval_risks').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('intent_plans').delete().eq('user_id', TEST_USER_ID)
  })

  describe('Portfolio Snapshots - Scope Key Determinism', () => {
    test('scope_key is automatically set for active_wallet mode', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: TEST_USER_ID,
          wallet_address: walletAddress,
          scope_mode: 'active_wallet',
          net_worth: 1000.50,
          delta_24h: 50.25,
          freshness_sec: 30,
          confidence: 0.8500,
          risk_score: 0.2500,
          positions: {}
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.scope_key).toBe(walletAddress.toLowerCase())
      expect(data.wallet_address).toBe(walletAddress.toLowerCase())
    })

    test('scope_key is automatically set for all_wallets mode', async () => {
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: TEST_USER_ID,
          scope_mode: 'all_wallets',
          net_worth: 2000.75,
          delta_24h: -25.50,
          freshness_sec: 60,
          confidence: 0.9000,
          risk_score: 0.1500,
          positions: {}
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.scope_key).toBe(TEST_USER_ID)
      expect(data.wallet_address).toBeNull()
    })

    test('upsert-current behavior: same scope_key overwrites existing row', async () => {
      const walletAddress = '0x123456789abcdef123456789abcdef1234567890'
      
      // Insert first snapshot
      const { data: firstSnapshot, error: firstError } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: TEST_USER_ID,
          wallet_address: walletAddress,
          scope_mode: 'active_wallet',
          net_worth: 1000,
          delta_24h: 0,
          freshness_sec: 30,
          confidence: 0.7500,
          risk_score: 0.3000,
          positions: { initial: true }
        })
        .select()
        .single()

      expect(firstError).toBeNull()
      const firstUpdatedAt = firstSnapshot.updated_at

      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100))

      // Insert second snapshot with same scope (should upsert)
      const { data: secondSnapshot, error: secondError } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          user_id: TEST_USER_ID,
          wallet_address: walletAddress,
          scope_mode: 'active_wallet',
          net_worth: 2000,
          delta_24h: 100,
          freshness_sec: 45,
          confidence: 0.8000,
          risk_score: 0.2000,
          positions: { updated: true }
        })
        .select()
        .single()

      expect(secondError).toBeNull()

      // Verify only one row exists and it's updated
      const { data: allSnapshots, error: queryError } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('scope_mode', 'active_wallet')
        .eq('scope_key', walletAddress.toLowerCase())

      expect(queryError).toBeNull()
      expect(allSnapshots).toHaveLength(1)
      expect(allSnapshots[0].net_worth).toBe('2000.00000000')
      expect(allSnapshots[0].updated_at).not.toBe(firstUpdatedAt)
      expect(allSnapshots[0].positions).toEqual({ updated: true })
    })

    test('confidence and risk_score bounds are enforced', async () => {
      // Test confidence > 1.0000 fails
      const { error: confidenceError } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: TEST_USER_ID,
          scope_mode: 'all_wallets',
          net_worth: 1000,
          delta_24h: 0,
          freshness_sec: 30,
          confidence: 1.5000, // Invalid: > 1.0000
          risk_score: 0.5000,
          positions: {}
        })

      expect(confidenceError).not.toBeNull()
      expect(confidenceError.message).toContain('confidence')

      // Test risk_score < 0.0000 fails
      const { error: riskError } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: TEST_USER_ID,
          scope_mode: 'all_wallets',
          net_worth: 1000,
          delta_24h: 0,
          freshness_sec: 30,
          confidence: 0.7500,
          risk_score: -0.1000, // Invalid: < 0.0000
          positions: {}
        })

      expect(riskError).not.toBeNull()
      expect(riskError.message).toContain('risk_score')
    })
  })

  describe('Approval Risks - Address Normalization', () => {
    test('addresses are normalized to lowercase', async () => {
      const { data, error } = await supabase
        .from('approval_risks')
        .insert({
          user_id: TEST_USER_ID,
          wallet_address: '0x742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6', // Mixed case
          chain_id: 1,
          token_address: '0xA0B86A33E6776E681E9F29D3D0A7D4A2F5B5D8E9', // Mixed case
          spender_address: '0xDEF1CA1FB7FBCDC777520AA7F396B4E015F497AB', // Mixed case
          amount: 'unlimited',
          risk_score: 0.8500,
          severity: 'critical',
          value_at_risk_usd: 5000.00,
          risk_reasons: ['INFINITE_ALLOWANCE', 'UNKNOWN_SPENDER'],
          contributing_factors: {},
          age_days: 30,
          is_permit2: false
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.wallet_address).toBe('0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6')
      expect(data.token_address).toBe('0xa0b86a33e6776e681e9f29d3d0a7d4a2f5b5d8e9')
      expect(data.spender_address).toBe('0xdef1ca1fb7fbcdc777520aa7f396b4e015f497ab')
    })

    test('chain_id is required (no default)', async () => {
      const { error } = await supabase
        .from('approval_risks')
        .insert({
          user_id: TEST_USER_ID,
          wallet_address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          // chain_id missing - should fail
          token_address: '0xa0b86a33e6776e681e9f29d3d0a7d4a2f5b5d8e9',
          spender_address: '0xdef1ca1fb7fbcdc777520aa7f396b4e015f497ab',
          amount: 'unlimited',
          risk_score: 0.8500,
          severity: 'critical',
          value_at_risk_usd: 5000.00,
          risk_reasons: ['INFINITE_ALLOWANCE'],
          contributing_factors: {},
          age_days: 30,
          is_permit2: false
        })

      expect(error).not.toBeNull()
      expect(error.message).toContain('null value in column "chain_id"')
    })

    test('unique constraint prevents duplicate approvals', async () => {
      const approvalData = {
        user_id: TEST_USER_ID,
        wallet_address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
        chain_id: 1,
        token_address: '0xa0b86a33e6776e681e9f29d3d0a7d4a2f5b5d8e9',
        spender_address: '0xdef1ca1fb7fbcdc777520aa7f396b4e015f497ab',
        amount: 'unlimited',
        risk_score: 0.8500,
        severity: 'critical',
        value_at_risk_usd: 5000.00,
        risk_reasons: ['INFINITE_ALLOWANCE'],
        contributing_factors: {},
        age_days: 30,
        is_permit2: false
      }

      // First insert should succeed
      const { error: firstError } = await supabase
        .from('approval_risks')
        .insert(approvalData)

      expect(firstError).toBeNull()

      // Second insert with same identity should fail
      const { error: secondError } = await supabase
        .from('approval_risks')
        .insert(approvalData)

      expect(secondError).not.toBeNull()
      expect(secondError.message).toContain('duplicate key value')
    })
  })

  describe('Intent Plans - Wallet Scope Validation', () => {
    test('active_wallet mode requires address field', async () => {
      const { error } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'revoke_approvals',
          wallet_scope: { mode: 'active_wallet' }, // Missing address
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-key-1'
        })

      expect(error).not.toBeNull()
      expect(error.message).toContain('chk_wallet_scope_shape')
    })

    test('all_wallets mode must not have address field', async () => {
      const { error } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'revoke_approvals',
          wallet_scope: { 
            mode: 'all_wallets', 
            address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6' // Should not have address
          },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-key-2'
        })

      expect(error).not.toBeNull()
      expect(error.message).toContain('chk_wallet_scope_shape')
    })

    test('valid wallet_scope configurations succeed', async () => {
      // Test active_wallet with address
      const { error: activeError } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'revoke_approvals',
          wallet_scope: { 
            mode: 'active_wallet', 
            address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6'
          },
          steps: [{ stepId: 's1', kind: 'revoke' }],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-key-3'
        })

      expect(activeError).toBeNull()

      // Test all_wallets without address
      const { error: allError } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'batch_revoke',
          wallet_scope: { mode: 'all_wallets' },
          steps: [{ stepId: 's1', kind: 'revoke' }],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-key-4'
        })

      expect(allError).toBeNull()
    })

    test('steps field is immutable after creation', async () => {
      const { data: plan, error: insertError } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_immutable',
          wallet_scope: { mode: 'all_wallets' },
          steps: [{ stepId: 's1', kind: 'revoke' }],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-key-immutable'
        })
        .select()
        .single()

      expect(insertError).toBeNull()

      // Try to update steps - should fail
      const { error: updateError } = await supabase
        .from('intent_plans')
        .update({
          steps: [{ stepId: 's2', kind: 'approve' }] // Different steps
        })
        .eq('id', plan.id)

      expect(updateError).not.toBeNull()
      expect(updateError.message).toContain('intent_plans.steps is immutable')
    })

    test('idempotency_key uniqueness per user', async () => {
      const planData = {
        user_id: TEST_USER_ID,
        intent: 'test_idempotency',
        wallet_scope: { mode: 'all_wallets' },
        steps: [],
        policy_status: 'allowed',
        policy_violations: [],
        simulation_status: 'pass',
        impact_preview: {},
        idempotency_key: 'duplicate-key-test'
      }

      // First insert should succeed
      const { error: firstError } = await supabase
        .from('intent_plans')
        .insert(planData)

      expect(firstError).toBeNull()

      // Second insert with same idempotency_key should fail
      const { error: secondError } = await supabase
        .from('intent_plans')
        .insert(planData)

      expect(secondError).not.toBeNull()
      expect(secondError.message).toContain('duplicate key value')
    })
  })

  describe('Execution Steps - Chain ID and Idempotency', () => {
    test('chain_id is required (EIP-155)', async () => {
      // First create a plan to reference
      const { data: plan } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_execution',
          wallet_scope: { mode: 'all_wallets' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-execution-plan'
        })
        .select()
        .single()

      // Try to insert execution step without chain_id
      const { error } = await supabase
        .from('execution_steps')
        .insert({
          plan_id: plan.id,
          step_id: 'step-1',
          kind: 'revoke',
          // chain_id missing - should fail
          target_address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          status: 'pending',
          step_idempotency_key: 'step-key-1'
        })

      expect(error).not.toBeNull()
      expect(error.message).toContain('null value in column "chain_id"')
    })

    test('step idempotency constraints work correctly', async () => {
      // Create a plan first
      const { data: plan } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_step_idempotency',
          wallet_scope: { mode: 'all_wallets' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-step-idempotency-plan'
        })
        .select()
        .single()

      const stepData = {
        plan_id: plan.id,
        step_id: 'step-1',
        kind: 'revoke',
        chain_id: 1,
        target_address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
        status: 'pending',
        step_idempotency_key: 'duplicate-step-key'
      }

      // First insert should succeed
      const { error: firstError } = await supabase
        .from('execution_steps')
        .insert(stepData)

      expect(firstError).toBeNull()

      // Second insert with same step_idempotency_key should fail
      const { error: secondError } = await supabase
        .from('execution_steps')
        .insert({
          ...stepData,
          step_id: 'step-2' // Different step_id but same idempotency_key
        })

      expect(secondError).not.toBeNull()
      expect(secondError.message).toContain('duplicate key value')
    })
  })

  describe('Simulation Receipts - Expiry Constraints', () => {
    test('expires_at must be after created_at', async () => {
      // Create a plan first
      const { data: plan } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_simulation',
          wallet_scope: { mode: 'all_wallets' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-simulation-plan'
        })
        .select()
        .single()

      const now = new Date()
      const pastTime = new Date(now.getTime() - 60000) // 1 minute ago

      const { error } = await supabase
        .from('simulation_receipts')
        .insert({
          id: 'test-receipt-1',
          plan_id: plan.id,
          user_id: TEST_USER_ID,
          wallet_scope_hash: 'hash123',
          chain_set_hash: 'chainHash123',
          simulator_version: 'v1.0.0',
          created_at: now.toISOString(),
          expires_at: pastTime.toISOString() // Invalid: expires before created
        })

      expect(error).not.toBeNull()
      expect(error.message).toContain('chk_receipt_expires_after_created')
    })

    test('valid expiry time succeeds', async () => {
      // Create a plan first
      const { data: plan } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_valid_simulation',
          wallet_scope: { mode: 'all_wallets' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-valid-simulation-plan'
        })
        .select()
        .single()

      const now = new Date()
      const futureTime = new Date(now.getTime() + 60000) // 1 minute from now

      const { error } = await supabase
        .from('simulation_receipts')
        .insert({
          id: 'test-receipt-valid',
          plan_id: plan.id,
          user_id: TEST_USER_ID,
          wallet_scope_hash: 'hash123',
          chain_set_hash: 'chainHash123',
          simulator_version: 'v1.0.0',
          created_at: now.toISOString(),
          expires_at: futureTime.toISOString()
        })

      expect(error).toBeNull()
    })
  })

  describe('Cleanup Functions', () => {
    test('cleanup_expired_simulation_receipts removes expired receipts', async () => {
      // Create a plan first
      const { data: plan } = await supabase
        .from('intent_plans')
        .insert({
          user_id: TEST_USER_ID,
          intent: 'test_cleanup',
          wallet_scope: { mode: 'all_wallets' },
          steps: [],
          policy_status: 'allowed',
          policy_violations: [],
          simulation_status: 'pass',
          impact_preview: {},
          idempotency_key: 'test-cleanup-plan'
        })
        .select()
        .single()

      const now = new Date()
      const pastTime = new Date(now.getTime() - 120000) // 2 minutes ago

      // Insert an expired receipt (manually set timestamps)
      await supabase.rpc('sql', {
        query: `
          INSERT INTO simulation_receipts (id, plan_id, user_id, wallet_scope_hash, chain_set_hash, simulator_version, created_at, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        params: [
          'expired-receipt',
          plan.id,
          TEST_USER_ID,
          'hash123',
          'chainHash123',
          'v1.0.0',
          pastTime.toISOString(),
          pastTime.toISOString()
        ]
      })

      // Run cleanup function
      const { data: deletedCount } = await supabase.rpc('cleanup_expired_simulation_receipts')

      expect(deletedCount).toBeGreaterThan(0)

      // Verify receipt was deleted
      const { data: remainingReceipts } = await supabase
        .from('simulation_receipts')
        .select('*')
        .eq('id', 'expired-receipt')

      expect(remainingReceipts).toHaveLength(0)
    })

    test('cleanup_old_portfolio_snapshots keeps last N snapshots', async () => {
      const walletAddress = '0x999999999999999999999999999999999999999'
      
      // Insert multiple snapshots for the same scope
      for (let i = 0; i < 5; i++) {
        await supabase
          .from('portfolio_snapshots')
          .insert({
            user_id: TEST_USER_ID,
            wallet_address: walletAddress,
            scope_mode: 'active_wallet',
            net_worth: 1000 + i,
            delta_24h: i,
            freshness_sec: 30,
            confidence: 0.7500,
            risk_score: 0.2500,
            positions: { iteration: i }
          })
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Run cleanup to keep only 2 snapshots
      const { data: deletedCount } = await supabase.rpc('cleanup_old_portfolio_snapshots', { keep_count: 2 })

      expect(deletedCount).toBe(3) // Should delete 3 out of 5

      // Verify only 2 snapshots remain
      const { data: remainingSnapshots } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('scope_key', walletAddress.toLowerCase())
        .order('updated_at', { ascending: false })

      expect(remainingSnapshots).toHaveLength(2)
      expect(remainingSnapshots[0].positions.iteration).toBe(4) // Most recent
      expect(remainingSnapshots[1].positions.iteration).toBe(3) // Second most recent
    })
  })
})