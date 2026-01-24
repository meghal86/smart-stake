/**
 * Property-Based Tests for Portfolio Metadata Consistency
 * 
 * Feature: unified-portfolio, Property 2: Metadata Attachment Consistency
 * Validates: Risk-aware metadata tracking policy
 * 
 * Tests that all portfolio responses contain consistent freshness and confidence metadata.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { portfolioSnapshotService } from '../PortfolioSnapshotService'
import { WalletScope, FreshnessConfidence } from '@/types/portfolio'

// Mock dependencies
vi.mock('../PortfolioValuationService', () => ({
  portfolioValuationService: {
    valuatePortfolio: vi.fn()
  }
}))

vi.mock('../guardianService', () => ({
  requestGuardianScan: vi.fn()
}))

// Import mocked services after mocking
import { portfolioValuationService } from '../PortfolioValuationService'
import { requestGuardianScan } from '../guardianService'

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

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: unified-portfolio, Property 2: Metadata Attachment Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('all portfolio snapshots contain valid freshness metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        async (userId, walletScope) => {
          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope);
          
          // Property: Every snapshot must have freshness metadata
          expect(snapshot.freshness).toBeDefined()
          
          // Property: Freshness metadata must have all required fields
          expect(typeof snapshot.freshness.freshnessSec).toBe('number')
          expect(typeof snapshot.freshness.confidence).toBe('number')
          expect(typeof snapshot.freshness.confidenceThreshold).toBe('number')
          expect(typeof snapshot.freshness.degraded).toBe('boolean')
          
          // Property: Confidence must be within valid range
          expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(0.5)
          expect(snapshot.freshness.confidence).toBeLessThanOrEqual(1.0)
          
          // Property: Confidence threshold must be within valid range
          expect(snapshot.freshness.confidenceThreshold).toBeGreaterThanOrEqual(0.5)
          expect(snapshot.freshness.confidenceThreshold).toBeLessThanOrEqual(1.0)
          
          // Property: Freshness seconds must be non-negative
          expect(snapshot.freshness.freshnessSec).toBeGreaterThanOrEqual(0)
          
          // Property: If degraded, must have reasons
          if (snapshot.freshness.degraded) {
            expect(snapshot.freshness.degradedReasons).toBeDefined()
            expect(Array.isArray(snapshot.freshness.degradedReasons)).toBe(true)
            expect(snapshot.freshness.degradedReasons!.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('confidence calculation follows aggregation rules', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 4 }), // Success/failure for each system
        async (userId, walletScope, systemResults) => {
          // Set up mocks based on system results
          // Note: We only mock Portfolio and Guardian services
          // Hunter and Harvest services return placeholder data (always succeed)
          if (systemResults[0]) {
            vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
              kpis: { total_value: 1000, pnl_24h: 50, risk_score: 5, concentration_hhi: 0.3 },
              holdings: [],
              meta: { cache_status: 'hit', last_updated: new Date(), sim_version: '1.0', latency_ms: 100 }
            })
          } else {
            vi.mocked(portfolioValuationService.valuatePortfolio).mockRejectedValue(new Error('Portfolio service failed'))
          }
          
          if (systemResults.length > 1 && systemResults[1]) {
            vi.mocked(requestGuardianScan).mockResolvedValue({
              trustScorePercent: 85,
              trustScoreRaw: 0.85,
              riskScore: 3,
              riskLevel: 'Low',
              statusLabel: 'Trusted',
              statusTone: 'trusted',
              flags: []
            })
          } else {
            // Default to failure if not specified or explicitly false
            vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian service failed'))
          }

          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope);
          
          // Calculate expected confidence based on actual system behavior
          // Portfolio and Guardian can fail based on systemResults
          // Hunter and Harvest always succeed (placeholder implementations)
          const portfolioSuccess = systemResults[0] || false
          const guardianSuccess = systemResults.length > 1 ? systemResults[1] : false // Default to false if not specified
          const hunterSuccess = true  // Always succeeds (placeholder)
          const harvestSuccess = true // Always succeeds (placeholder)
          
          const actualSuccessCount = [portfolioSuccess, guardianSuccess, hunterSuccess, harvestSuccess].filter(Boolean).length
          const totalCount = 4
          const expectedBaseConfidence = actualSuccessCount / totalCount
          const expectedMinConfidence = Math.max(0.5, expectedBaseConfidence)
          
          // Property: Confidence should reflect system availability
          // For safety-critical aggregates, confidence = min(sourceConfidences)
          expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(expectedMinConfidence)
          
          // Property: Degraded mode when confidence < threshold
          if (snapshot.freshness.confidence < snapshot.freshness.confidenceThreshold) {
            expect(snapshot.freshness.degraded).toBe(true)
          }
          
          // Property: Non-degraded mode when confidence >= threshold
          if (snapshot.freshness.confidence >= snapshot.freshness.confidenceThreshold) {
            expect(snapshot.freshness.degraded).toBe(false)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  test('metadata consistency across different wallet scopes', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        fc.tuple(
          fc.record({ mode: fc.constant('active_wallet' as const), address: addressGenerator }),
          fc.record({ mode: fc.constant('all_wallets' as const) })
        ),
        async (userId, [activeWalletScope, allWalletsScope]) => {
          const [activeSnapshot, allSnapshot] = await Promise.all([
            portfolioSnapshotService.getSnapshot(userId, activeWalletScope),
            portfolioSnapshotService.getSnapshot(userId, allWalletsScope)
          ]);
          
          // Property: Both snapshots should have consistent metadata structure
          expect(activeSnapshot.freshness).toBeDefined()
          expect(allSnapshot.freshness).toBeDefined()
          
          // Property: Confidence thresholds should be consistent
          expect(activeSnapshot.freshness.confidenceThreshold)
            .toBe(allSnapshot.freshness.confidenceThreshold)
          
          // Property: Both should follow same confidence bounds
          expect(activeSnapshot.freshness.confidence).toBeGreaterThanOrEqual(0.5)
          expect(allSnapshot.freshness.confidence).toBeGreaterThanOrEqual(0.5)
          
          // Property: Degraded status should be consistent with confidence
          expect(activeSnapshot.freshness.degraded)
            .toBe(activeSnapshot.freshness.confidence < activeSnapshot.freshness.confidenceThreshold)
          expect(allSnapshot.freshness.degraded)
            .toBe(allSnapshot.freshness.confidence < allSnapshot.freshness.confidenceThreshold)
        }
      ),
      { numRuns: 30 }
    )
  })

  test('freshness metadata is attached to all response types', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        async (userId, walletScope) => {
          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope);
          
          // Property: Main snapshot has freshness
          expect(snapshot.freshness).toBeDefined()
          
          // Property: Freshness applies to all aggregates
          // (positions, approvals, recommendedActions all derive from same freshness calculation)
          
          // Property: Timestamp is present and valid
          expect(snapshot.lastUpdated).toBeDefined()
          expect(new Date(snapshot.lastUpdated)).toBeInstanceOf(Date)
          expect(new Date(snapshot.lastUpdated).getTime()).toBeLessThanOrEqual(Date.now())
          
          // Property: All numeric fields are valid numbers
          expect(typeof snapshot.netWorth).toBe('number')
          expect(typeof snapshot.delta24h).toBe('number')
          expect(isNaN(snapshot.netWorth)).toBe(false)
          expect(isNaN(snapshot.delta24h)).toBe(false)
          
          // Property: All array fields are arrays
          expect(Array.isArray(snapshot.positions)).toBe(true)
          expect(Array.isArray(snapshot.approvals)).toBe(true)
          expect(Array.isArray(snapshot.recommendedActions)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('degraded reasons are meaningful when present', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdGenerator,
        walletScopeGenerator,
        async (userId, walletScope) => {
          // Force some failures to test degraded mode
          vi.mocked(portfolioValuationService.valuatePortfolio).mockRejectedValue(new Error('Service unavailable'))
          vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian down'))

          const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope);
          
          if (snapshot.freshness.degraded && snapshot.freshness.degradedReasons) {
            // Property: Degraded reasons should be non-empty strings
            snapshot.freshness.degradedReasons.forEach(reason => {
              expect(typeof reason).toBe('string')
              expect(reason.length).toBeGreaterThan(0)
              expect(reason.trim()).toBe(reason) // No leading/trailing whitespace
            })
            
            // Property: Should mention which systems failed
            const reasonsText = snapshot.freshness.degradedReasons.join(' ')
            expect(reasonsText.toLowerCase()).toMatch(/failed|unavailable|error|down/)
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})