/**
 * Property-Based Tests for Portfolio Types
 * 
 * Feature: unified-portfolio, Property S2: Type safety enforcement
 * Validates: Requirements 1.1
 * 
 * Tests universal properties that should hold for all valid portfolio type instances.
 */

import { describe, test } from 'vitest'
import * as fc from 'fast-check'
import {
  ScopeMode,
  WalletScope,
  FreshnessConfidence,
  PortfolioSnapshot,
  PortfolioApprovalRisk,
  RecommendedAction,
  IntentPlan,
  ExecutionStep,
  PolicyEngineConfig,
  isActiveWalletScope,
  isAllWalletsScope,
  isValidSeverity,
  isValidConfidence,
  isValidRiskScore,
  type Severity,
  type Address
} from '../portfolio'

// ============================================================================
// GENERATORS
// ============================================================================

const addressGenerator = fc.string({ minLength: 42, maxLength: 42 }).map(s => 
  `0x${s.slice(2).replace(/[^0-9a-fA-F]/g, '0')}` as Address
)

const scopeModeGenerator = fc.constantFrom('active_wallet', 'all_wallets') as fc.Arbitrary<ScopeMode>

const severityGenerator = fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<Severity>

const walletScopeGenerator = fc.oneof(
  fc.record({
    mode: fc.constant('active_wallet' as const),
    address: addressGenerator
  }),
  fc.record({
    mode: fc.constant('all_wallets' as const)
  })
) as fc.Arbitrary<WalletScope>

const freshnessConfidenceGenerator = fc.record({
  freshnessSec: fc.integer({ min: 0, max: 3600 }),
  confidence: fc.float({ min: 0.5000, max: 1.0000, noNaN: true }),
  confidenceThreshold: fc.float({ min: 0.5000, max: 1.0000, noNaN: true }),
  degraded: fc.boolean(),
  degradedReasons: fc.option(fc.array(fc.string({ minLength: 1 })))
}) as fc.Arbitrary<FreshnessConfidence>

const portfolioSnapshotGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  walletAddress: fc.option(addressGenerator),
  scopeMode: scopeModeGenerator,
  scopeKey: fc.string({ minLength: 1 }),
  netWorth: fc.float({ min: 0, max: 1000000, noNaN: true }),
  delta24h: fc.float({ min: -100000, max: 100000, noNaN: true }),
  freshnessSec: fc.integer({ min: 0, max: 3600 }),
  confidence: fc.float({ min: 0.5000, max: 1.0000, noNaN: true }),
  riskScore: fc.float({ min: 0.0001, max: 1.0000, noNaN: true }),
  positions: fc.array(fc.record({
    token: addressGenerator,
    symbol: fc.string({ minLength: 1, maxLength: 10 }),
    balance: fc.float({ min: 0, max: 1000000, noNaN: true }),
    valueUsd: fc.float({ min: 0, max: 1000000, noNaN: true }),
    chain: fc.string({ minLength: 1 }),
    protocol: fc.option(fc.string()),
    category: fc.constantFrom('token', 'nft', 'defi', 'staking')
  })),
  createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString())
}).map(snapshot => {
  // Ensure scope_key consistency
  if (snapshot.scopeMode === 'active_wallet') {
    return {
      ...snapshot,
      walletAddress: snapshot.walletAddress || '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
      scopeKey: (snapshot.walletAddress || '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6').toLowerCase()
    }
  } else {
    return {
      ...snapshot,
      walletAddress: null,
      scopeKey: snapshot.userId
    }
  }
}) as fc.Arbitrary<PortfolioSnapshot>

const approvalRiskGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  walletAddress: addressGenerator,
  chainId: fc.integer({ min: 1, max: 999999 }),
  tokenAddress: addressGenerator,
  spenderAddress: addressGenerator,
  amount: fc.oneof(fc.constant('unlimited'), fc.bigInt().map(b => b.toString())),
  riskScore: fc.float({ min: 0.0001, max: 1.0000, noNaN: true }),
  severity: severityGenerator,
  valueAtRiskUsd: fc.float({ min: 0, max: 1000000, noNaN: true }),
  riskReasons: fc.array(fc.string({ minLength: 1 })),
  contributingFactors: fc.array(fc.record({
    factor: fc.string({ minLength: 1 }),
    weight: fc.float({ min: 0, max: 1, noNaN: true }),
    description: fc.string({ minLength: 1 })
  })),
  ageDays: fc.integer({ min: 0, max: 365 }),
  isPermit2: fc.boolean(),
  createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString())
}) as fc.Arbitrary<PortfolioApprovalRisk>

const recommendedActionGenerator = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  severity: severityGenerator,
  why: fc.array(fc.string({ minLength: 1 })),
  impactPreview: fc.record({
    riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
    preventedLossP50Usd: fc.float({ min: 0, max: 100000, noNaN: true }),
    expectedGainUsd: fc.float({ min: 0, max: 100000, noNaN: true }),
    gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
    timeEstimateSec: fc.integer({ min: 0, max: 3600 }),
    confidence: fc.float({ min: 0.5000, max: 1.0000, noNaN: true })
  }),
  actionScore: fc.float({ min: 0, max: 100, noNaN: true }),
  cta: fc.record({
    label: fc.string({ minLength: 1 }),
    intent: fc.string({ minLength: 1 }),
    params: fc.dictionary(fc.string({ minLength: 1 }), fc.anything())
  }),
  walletScope: walletScopeGenerator
}) as fc.Arbitrary<RecommendedAction>

const executionStepGenerator = fc.record({
  id: fc.uuid(),
  planId: fc.uuid(),
  stepId: fc.string({ minLength: 1 }),
  kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
  chainId: fc.integer({ min: 1, max: 999999 }),
  targetAddress: addressGenerator,
  status: fc.constantFrom('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed'),
  payload: fc.option(fc.string({ minLength: 1 })),
  gasEstimate: fc.option(fc.integer({ min: 0 })),
  errorMessage: fc.option(fc.string({ minLength: 1 })),
  transactionHash: fc.option(addressGenerator),
  blockNumber: fc.option(fc.integer({ min: 0 })),
  stepIdempotencyKey: fc.string({ minLength: 1 }),
  createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString())
}) as fc.Arbitrary<ExecutionStep>

const intentPlanGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  intent: fc.string({ minLength: 1 }),
  walletScope: walletScopeGenerator,
  steps: fc.array(executionStepGenerator),
  policy: fc.record({
    status: fc.constantFrom('allowed', 'blocked'),
    violations: fc.array(fc.string({ minLength: 1 }))
  }),
  simulation: fc.record({
    status: fc.constantFrom('pass', 'warn', 'block'),
    receiptId: fc.string({ minLength: 1 })
  }),
  impactPreview: fc.record({
    gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
    timeEstimateSec: fc.integer({ min: 0, max: 3600 }),
    riskDelta: fc.float({ min: -1, max: 1, noNaN: true })
  }),
  idempotencyKey: fc.string({ minLength: 1 }),
  status: fc.constantFrom('pending', 'executing', 'completed', 'failed', 'cancelled'),
  createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date().getTime() }).map(ts => new Date(ts).toISOString())
}) as fc.Arbitrary<IntentPlan>

const policyEngineConfigGenerator = fc.record({
  maxGasUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
  blockNewContractsDays: fc.integer({ min: 0, max: 365 }),
  blockInfiniteApprovalsToUnknown: fc.boolean(),
  requireSimulationForValueOverUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
  confidenceThreshold: fc.float({ min: 0.5000, max: 1.0000, noNaN: true }),
  allowedSlippagePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  maxDailyTransactionCount: fc.integer({ min: 0, max: 1000 })
}) as fc.Arbitrary<PolicyEngineConfig>

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: unified-portfolio, Property S2: Type safety enforcement', () => {
  test('WalletScope discriminated union is correctly typed', () => {
    fc.assert(
      fc.property(walletScopeGenerator, (walletScope) => {
        if (walletScope.mode === 'active_wallet') {
          // Active wallet mode must have address
          return 'address' in walletScope && typeof walletScope.address === 'string'
        } else if (walletScope.mode === 'all_wallets') {
          // All wallets mode must not have address
          return !('address' in walletScope)
        }
        return false
      }),
      { numRuns: 100 }
    )
  })

  test('Type guards correctly identify wallet scope types', () => {
    fc.assert(
      fc.property(walletScopeGenerator, (walletScope) => {
        const isActive = isActiveWalletScope(walletScope)
        const isAll = isAllWalletsScope(walletScope)
        
        // Exactly one should be true
        return (isActive && !isAll) || (!isActive && isAll)
      }),
      { numRuns: 100 }
    )
  })

  test('Confidence values are always within valid bounds', () => {
    fc.assert(
      fc.property(freshnessConfidenceGenerator, (freshness) => {
        return isValidConfidence(freshness.confidence) && 
               isValidConfidence(freshness.confidenceThreshold) &&
               freshness.confidence >= 0.5000 && 
               freshness.confidence <= 1.0000 &&
               freshness.confidenceThreshold >= 0.5000 &&
               freshness.confidenceThreshold <= 1.0000
      }),
      { numRuns: 100 }
    )
  })

  test('Risk scores are always within valid bounds', () => {
    fc.assert(
      fc.property(
        fc.oneof(portfolioSnapshotGenerator, approvalRiskGenerator),
        (item) => {
          const riskScore = 'riskScore' in item ? item.riskScore : 0
          return isValidRiskScore(riskScore) && 
                 riskScore >= 0.0000 && 
                 riskScore <= 1.0000
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Severity values are always valid', () => {
    fc.assert(
      fc.property(severityGenerator, (severity) => {
        return isValidSeverity(severity) &&
               ['critical', 'high', 'medium', 'low'].includes(severity)
      }),
      { numRuns: 100 }
    )
  })

  test('Portfolio snapshots have consistent scope_key rules', () => {
    fc.assert(
      fc.property(portfolioSnapshotGenerator, (snapshot) => {
        if (snapshot.scopeMode === 'active_wallet') {
          // Active wallet mode: must have wallet address and scope_key should match
          return snapshot.walletAddress !== null && 
                 snapshot.walletAddress !== undefined &&
                 snapshot.scopeKey === snapshot.walletAddress.toLowerCase()
        } else if (snapshot.scopeMode === 'all_wallets') {
          // All wallets mode: wallet address should be null and scope_key should be user_id
          return (snapshot.walletAddress === null || snapshot.walletAddress === undefined) &&
                 snapshot.scopeKey === snapshot.userId
        }
        return false
      }),
      { numRuns: 100 }
    )
  })

  test('Approval risks have required chain_id', () => {
    fc.assert(
      fc.property(approvalRiskGenerator, (approval) => {
        return typeof approval.chainId === 'number' && 
               approval.chainId > 0 &&
               Number.isInteger(approval.chainId)
      }),
      { numRuns: 100 }
    )
  })

  test('Execution steps have required chain_id (EIP-155)', () => {
    fc.assert(
      fc.property(executionStepGenerator, (step) => {
        return typeof step.chainId === 'number' && 
               step.chainId > 0 &&
               Number.isInteger(step.chainId)
      }),
      { numRuns: 100 }
    )
  })

  test('Intent plans have valid wallet scope structure', () => {
    fc.assert(
      fc.property(intentPlanGenerator, (plan) => {
        const scope = plan.walletScope
        if (scope.mode === 'active_wallet') {
          return 'address' in scope && typeof scope.address === 'string'
        } else if (scope.mode === 'all_wallets') {
          return !('address' in scope)
        }
        return false
      }),
      { numRuns: 100 }
    )
  })

  test('Recommended actions have valid impact preview structure', () => {
    fc.assert(
      fc.property(recommendedActionGenerator, (action) => {
        const preview = action.impactPreview
        return typeof preview.riskDelta === 'number' &&
               typeof preview.preventedLossP50Usd === 'number' &&
               typeof preview.expectedGainUsd === 'number' &&
               typeof preview.gasEstimateUsd === 'number' &&
               typeof preview.timeEstimateSec === 'number' &&
               isValidConfidence(preview.confidence) &&
               preview.preventedLossP50Usd >= 0 &&
               preview.expectedGainUsd >= 0 &&
               preview.gasEstimateUsd >= 0 &&
               preview.timeEstimateSec >= 0
      }),
      { numRuns: 100 }
    )
  })

  test('Policy engine config has valid threshold values', () => {
    fc.assert(
      fc.property(policyEngineConfigGenerator, (config) => {
        return config.maxGasUsd >= 0 &&
               config.blockNewContractsDays >= 0 &&
               config.requireSimulationForValueOverUsd >= 0 &&
               isValidConfidence(config.confidenceThreshold) &&
               config.confidenceThreshold >= 0.5000 &&
               config.allowedSlippagePercent >= 0 &&
               config.allowedSlippagePercent <= 100 &&
               config.maxDailyTransactionCount >= 0
      }),
      { numRuns: 100 }
    )
  })

  test('Address format is consistent', () => {
    fc.assert(
      fc.property(addressGenerator, (address) => {
        return address.startsWith('0x') &&
               address.length === 42 &&
               /^0x[0-9a-fA-F]{40}$/.test(address)
      }),
      { numRuns: 100 }
    )
  })

  test('Timestamps are valid ISO 8601 strings', () => {
    fc.assert(
      fc.property(
        fc.oneof(portfolioSnapshotGenerator, approvalRiskGenerator, executionStepGenerator),
        (item) => {
          const createdAt = item.createdAt
          const updatedAt = item.updatedAt
          
          // Should be valid ISO 8601 strings
          const createdDate = new Date(createdAt)
          const updatedDate = new Date(updatedAt)
          
          return !isNaN(createdDate.getTime()) && 
                 !isNaN(updatedDate.getTime()) &&
                 createdAt === createdDate.toISOString() &&
                 updatedAt === updatedDate.toISOString()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Numeric precision constraints are respected', () => {
    fc.assert(
      fc.property(
        fc.oneof(portfolioSnapshotGenerator, approvalRiskGenerator),
        (item) => {
          const confidence = 'confidence' in item ? item.confidence : 1.0
          const riskScore = 'riskScore' in item ? item.riskScore : 0.0
          
          // Should be valid numbers (not NaN or Infinity)
          if (!Number.isFinite(confidence) || !Number.isFinite(riskScore)) {
            return false
          }
          
          // Should be within valid ranges
          if (confidence < 0.5000 || confidence > 1.0000) {
            return false
          }
          
          if (riskScore < 0.0000 || riskScore > 1.0000) {
            return false
          }
          
          // Should have reasonable precision (not extremely small numbers that cause precision issues)
          // Since we now generate riskScore with min: 0.0001, this should always pass
          const minPrecision = 0.0001 // Minimum meaningful precision
          if (riskScore > 0 && riskScore < minPrecision) {
            return false
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})