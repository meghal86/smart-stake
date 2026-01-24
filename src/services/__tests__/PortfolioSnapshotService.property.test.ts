/**
 * Property-Based Tests for Portfolio Snapshot Service
 * 
 * Feature: unified-portfolio, Property 1: Data Aggregation Completeness
 * Validates: Requirements 1.6
 * 
 * Tests that portfolio snapshot aggregation includes data from all available systems.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { portfolioSnapshotService } from '../PortfolioSnapshotService'
import { WalletScope } from '@/types/portfolio'

// Mock dependencies
vi.mock('../PortfolioValuationService', () => ({
  portfolioValuationService: {
    valuatePortfolio: vi.fn()
  }
}))

vi.mock('../guardianService', () => ({
  requestGuardianScan: vi.fn()
}))

vi.mock('@/lib/cache/RiskAwareCacheService', () => ({
  riskAwareCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidateCritical: vi.fn(),
    warmCache: vi.fn()
  },
  calculateCacheTTL: vi.fn()
}))

// ============================================================================
// GENERATORS
// ============================================================================

const addressGenerator = fc.string({ minLength: 42, maxLength: 42 }).map(s => 
  `0x${s.slice(2).replace(/[^0-9a-fA-F]/g, '0')}` as `0x${string}`
)

const walletScopeGenerator = fc.oneof(
  fc.record({
    mode: fc.constant('active_wallet' as const),
    address: addressGenerator
  }),
  fc.record({
    mode: fc.constant('all_wallets' as const)
  })
) as fc.Arbitrary<WalletScope>

const userIdGenerator = fc.uuid()

const portfolioDataGenerator = fc.record({
  kpis: fc.record({
    total_value: fc.float({ min: 0, max: 1000000, noNaN: true }),
    pnl_24h: fc.float({ min: -50000, max: 50000, noNaN: true }),
    risk_score: fc.float({ min: 0, max: 10, noNaN: true }),
    concentration_hhi: fc.float({ min: 0, max: 1, noNaN: true })
  }),
  holdings: fc.array(fc.record({
    token: fc.constantFrom('ETH', 'BTC', 'USDC', 'LINK'),
    qty: fc.float({ min: 0, max: 1000, noNaN: true }),
    value: fc.float({ min: 0, max: 100000, noNaN: true }),
    source: fc.constantFrom('real', 'simulated'),
    change_24h: fc.float({ min: -50, max: 50, noNaN: true })
  }), { minLength: 0, maxLength: 10 }),
  meta: fc.record({
    cache_status: fc.constantFrom('hit', 'miss', 'stale'),
    last_updated: fc.date(),
    sim_version: fc.string(),
    latency_ms: fc.integer({ min: 0, max: 5000 })
  })
})

const guardianDataGenerator = fc.record({
  trustScorePercent: fc.integer({ min: 0, max: 100 }),
  trustScoreRaw: fc.float({ min: 0, max: 1, noNaN: true }),
  riskScore: fc.float({ min: 0, max: 10, noNaN: true }),
  riskLevel: fc.constantFrom('Low', 'Medium', 'High'),
  statusLabel: fc.constantFrom('Trusted', 'Warning', 'Danger'),
  statusTone: fc.constantFrom('trusted', 'warning', 'danger'),
  flags: fc.array(fc.record({
    id: fc.string(),
    type: fc.string(),
    severity: fc.constantFrom('low', 'medium', 'high'),
    details: fc.string(),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString())
  }), { minLength: 0, maxLength: 5 })
})

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: unified-portfolio, Property 1: Data Aggregation Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('portfolio snapshot includes data from all available systems when they succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        portfolioDataGenerator,
        guardianDataGenerator,
        async (userId, walletScope, portfolioData, guardianData) => {
          // Mock successful responses from all systems
          const { portfolioValuationService } = await import('../PortfolioValuationService')
          const { requestGuardianScan } = await import('../guardianService')
          
          vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue(portfolioData)
          vi.mocked(requestGuardianScan).mockResolvedValue(guardianData)

          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope)

          // Property: When all systems are available, snapshot should include data from all
          expect(snapshot.userId).toBe(userId)
          
          // For all_wallets mode with no addresses, expect 0 values
          if (walletScope.mode === 'all_wallets') {
            expect(snapshot.netWorth).toBe(0)
            expect(snapshot.delta24h).toBe(0)
          } else {
            // For active_wallet mode, expect portfolio data values
            expect(snapshot.netWorth).toBe(portfolioData.kpis.total_value)
            // Handle JavaScript's +0 vs -0 distinction
            if (portfolioData.kpis.pnl_24h === 0) {
              expect(Math.abs(snapshot.delta24h)).toBe(0)
            } else {
              expect(snapshot.delta24h).toBe(portfolioData.kpis.pnl_24h)
            }
          }
          
          // Should have freshness metadata
          expect(snapshot.freshness).toBeDefined()
          expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(0.5)
          expect(snapshot.freshness.confidence).toBeLessThanOrEqual(1.0)
          
          // Should have positions from portfolio system
          expect(Array.isArray(snapshot.positions)).toBe(true)
          
          // Should have risk summary that incorporates Guardian data
          expect(snapshot.riskSummary).toBeDefined()
          expect(typeof snapshot.riskSummary.overallScore).toBe('number')
          expect(snapshot.riskSummary.overallScore).toBeGreaterThanOrEqual(0)
          expect(snapshot.riskSummary.overallScore).toBeLessThanOrEqual(1)
          
          // Should have timestamp
          expect(snapshot.lastUpdated).toBeDefined()
          expect(new Date(snapshot.lastUpdated)).toBeInstanceOf(Date)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('portfolio snapshot maintains minimum confidence when some systems fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        portfolioDataGenerator,
        async (userId, walletScope, portfolioData) => {
          // Mock mixed success/failure scenario
          const { portfolioValuationService } = await import('../PortfolioValuationService')
          const { requestGuardianScan } = await import('../guardianService')
          
          vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue(portfolioData)
          vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian service unavailable'))

          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope)

          // Property: Confidence should never go below minimum threshold (0.50)
          expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(0.50)
          
          // Property: When confidence < 0.70, system should be in degraded mode
          if (snapshot.freshness.confidence < 0.70) {
            expect(snapshot.freshness.degraded).toBe(true)
            expect(snapshot.freshness.degradedReasons).toBeDefined()
            expect(Array.isArray(snapshot.freshness.degradedReasons)).toBe(true)
          }
          
          // Property: Should still return valid snapshot structure even with failures
          expect(snapshot.userId).toBe(userId)
          expect(typeof snapshot.netWorth).toBe('number')
          expect(typeof snapshot.delta24h).toBe('number')
          expect(Array.isArray(snapshot.positions)).toBe(true)
          expect(Array.isArray(snapshot.approvals)).toBe(true)
          expect(Array.isArray(snapshot.recommendedActions)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('portfolio snapshot handles empty wallet scope correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        fc.record({ mode: fc.constant('all_wallets' as const) }),
        async (userId, walletScope) => {
          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope)

          // Property: Empty wallet scope should return valid but empty snapshot
          expect(snapshot.userId).toBe(userId)
          expect(snapshot.netWorth).toBe(0)
          expect(snapshot.delta24h).toBe(0)
          expect(Array.isArray(snapshot.positions)).toBe(true)
          expect(Array.isArray(snapshot.approvals)).toBe(true)
          expect(Array.isArray(snapshot.recommendedActions)).toBe(true)
          
          // Should still have valid freshness metadata
          expect(snapshot.freshness).toBeDefined()
          expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(0.5)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('portfolio snapshot aggregates positions correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        portfolioDataGenerator,
        async (userId, walletScope, portfolioData) => {
          const { portfolioValuationService } = await import('../PortfolioValuationService')
          vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue(portfolioData)

          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope)

          // Property: Position data should be properly structured and derived from input
          expect(snapshot.positions.length).toBeLessThanOrEqual(portfolioData.holdings.length)
          
          // Property: Each position should have required fields
          snapshot.positions.forEach(position => {
            expect(typeof position.id).toBe('string')
            expect(typeof position.token).toBe('string')
            expect(typeof position.symbol).toBe('string')
            expect(typeof position.amount).toBe('string')
            expect(typeof position.valueUsd).toBe('number')
            expect(typeof position.chainId).toBe('number')
            expect(['token', 'lp', 'nft', 'defi']).toContain(position.category)
            
            // Values should be finite and non-negative
            expect(Number.isFinite(position.valueUsd)).toBe(true)
            expect(position.valueUsd).toBeGreaterThanOrEqual(0)
          })
          
          // Property: Net worth should match input data based on wallet scope
          if (walletScope.mode === 'all_wallets') {
            // For all_wallets mode with no addresses, service returns 0
            expect(snapshot.netWorth).toBe(0)
          } else {
            // For active_wallet mode, should match input
            expect(snapshot.netWorth).toBe(portfolioData.kpis.total_value)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})