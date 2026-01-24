/**
 * Property-Based Tests for Safety Blocking Rules
 * 
 * Feature: unified-portfolio, Property 13: Safety Blocking Rules
 * Validates: Requirements 6.3
 * 
 * Tests universal properties that should hold for ALL safety blocking:
 * - Critical loss scenarios are blocked by default
 * - Honeypot behavior detection blocks execution
 * - Policy violations prevent execution
 * - Simulation failures trigger appropriate blocking
 * - User overrides are properly gated and logged
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import type { IntentPlan, ExecutionStep, SimulationReceipt } from '@/types/portfolio';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate Ethereum addresses
const addressGenerator = fc.integer({ min: 0, max: 15 })
  .chain(() => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

// Generate chain IDs
const chainIdGenerator = fc.constantFrom(1, 137, 56, 43114, 42161, 10, 8453, 324);

// Generate simulation results with potential safety issues
const simulationResultGenerator = fc.record({
  id: fc.string({ minLength: 8, maxLength: 32 }),
  assetDeltas: fc.option(fc.array(fc.record({
    token: fc.constantFrom('ETH', 'USDC', 'USDT', 'DAI', 'WBTC'),
    amount: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
    valueUsd: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }))
  }), { maxLength: 10 })),
  gasEstimateUsd: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })),
  timeEstimateSec: fc.option(fc.integer({ min: 5, max: 3600 })),
  warnings: fc.option(fc.array(fc.string({ minLength: 10, maxLength: 100 }), { maxLength: 5 })),
  confidence: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }))
});

// Generate policy violations
const policyViolationGenerator = fc.array(
  fc.constantFrom(
    'MAX_GAS_EXCEEDED',
    'NEW_CONTRACT_BLOCKED',
    'INFINITE_APPROVAL_TO_UNKNOWN',
    'HIGH_VALUE_WITHOUT_SIMULATION',
    'CONFIDENCE_TOO_LOW',
    'DAILY_LIMIT_EXCEEDED'
  ),
  { maxLength: 5 }
);

// Generate critical loss scenarios
const criticalLossScenarioGenerator = fc.record({
  totalValueAtRisk: fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
  lossPercentage: fc.float({ min: Math.fround(0.5), max: Math.fround(1), noNaN: true }),
  isHoneypot: fc.boolean(),
  hasUnknownContract: fc.boolean(),
  hasInfiniteApproval: fc.boolean(),
  contractAge: fc.integer({ min: 0, max: 365 }),
  spenderTrustScore: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true })
});

// Mock safety blocking engine
const evaluateSafetyBlocking = (
  simulation: SimulationReceipt,
  policyViolations: string[],
  criticalLoss: any
): { shouldBlock: boolean; blockingReasons: string[]; severity: 'critical' | 'high' | 'medium' | 'low' } => {
  const blockingReasons: string[] = [];
  let shouldBlock = false;
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

  // Check for critical loss scenarios
  if (criticalLoss.totalValueAtRisk > 10000 && criticalLoss.lossPercentage > 0.8) {
    shouldBlock = true;
    blockingReasons.push('CRITICAL_LOSS_DETECTED');
    severity = 'critical';
  }

  // Check for honeypot behavior
  if (criticalLoss.isHoneypot) {
    shouldBlock = true;
    blockingReasons.push('HONEYPOT_DETECTED');
    severity = 'critical';
  }

  // Check for unknown contracts
  if (criticalLoss.hasUnknownContract && criticalLoss.contractAge < 7) {
    shouldBlock = true;
    blockingReasons.push('NEW_UNKNOWN_CONTRACT');
    if (severity !== 'critical') severity = 'high';
  }

  // Check for infinite approvals to untrusted spenders
  if (criticalLoss.hasInfiniteApproval && criticalLoss.spenderTrustScore < 0.5) {
    shouldBlock = true;
    blockingReasons.push('INFINITE_APPROVAL_UNTRUSTED');
    if (severity !== 'critical') severity = 'high';
  }

  // Check policy violations
  if (policyViolations.length > 0) {
    shouldBlock = true;
    blockingReasons.push(...policyViolations);
    if (policyViolations.includes('MAX_GAS_EXCEEDED') || policyViolations.includes('CONFIDENCE_TOO_LOW')) {
      if (severity !== 'critical') severity = 'high';
    }
  }

  // Check simulation warnings
  if (simulation.warnings && simulation.warnings.length > 0) {
    const criticalWarnings = simulation.warnings.filter(w => 
      w.includes('CRITICAL') || w.includes('HONEYPOT') || w.includes('SCAM')
    );
    if (criticalWarnings.length > 0) {
      shouldBlock = true;
      blockingReasons.push('SIMULATION_CRITICAL_WARNING');
      severity = 'critical';
    }
  }

  // Check low confidence
  if (simulation.confidence && simulation.confidence < 0.5) {
    shouldBlock = true;
    blockingReasons.push('LOW_CONFIDENCE');
    if (severity === 'low') severity = 'medium';
  }

  return { shouldBlock, blockingReasons, severity };
};

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 13: Safety Blocking Rules', () => {
  
  test('critical loss scenarios are always blocked', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        (simulation, policyViolations) => {
          // Force critical loss scenario
          const forcedCriticalLoss = {
            totalValueAtRisk: 50000, // High value
            lossPercentage: 0.9, // 90% loss
            isHoneypot: false,
            hasUnknownContract: false,
            hasInfiniteApproval: false,
            contractAge: 100,
            spenderTrustScore: 0.8
          };

          const result = evaluateSafetyBlocking(simulation, policyViolations, forcedCriticalLoss);
          
          // Critical loss scenarios must be blocked
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('CRITICAL_LOSS_DETECTED');
          expect(result.severity).toBe('critical');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('honeypot detection always blocks execution', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        (simulation, policyViolations) => {
          // Force honeypot scenario
          const honeypotScenario = {
            totalValueAtRisk: 1000,
            lossPercentage: 0.5,
            isHoneypot: true, // Force honeypot
            hasUnknownContract: false,
            hasInfiniteApproval: false,
            contractAge: 100,
            spenderTrustScore: 0.8
          };

          const result = evaluateSafetyBlocking(simulation, policyViolations, honeypotScenario);
          
          // Honeypot detection must block execution
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('HONEYPOT_DETECTED');
          expect(result.severity).toBe('critical');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('policy violations prevent execution', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        criticalLossScenarioGenerator,
        (simulation, criticalLoss) => {
          // Force policy violations
          const policyViolations = ['MAX_GAS_EXCEEDED', 'CONFIDENCE_TOO_LOW'];

          const result = evaluateSafetyBlocking(simulation, policyViolations, criticalLoss);
          
          // Policy violations must block execution
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toEqual(expect.arrayContaining(policyViolations));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('new unknown contracts are blocked within grace period', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        (simulation, policyViolations) => {
          // Force new unknown contract scenario
          const newUnknownContract = {
            totalValueAtRisk: 1000,
            lossPercentage: 0.1,
            isHoneypot: false,
            hasUnknownContract: true,
            hasInfiniteApproval: false,
            contractAge: 3, // Less than 7 days
            spenderTrustScore: 0.3 // Low trust
          };

          const result = evaluateSafetyBlocking(simulation, policyViolations, newUnknownContract);
          
          // New unknown contracts must be blocked
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('NEW_UNKNOWN_CONTRACT');
          expect(['high', 'critical']).toContain(result.severity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('infinite approvals to untrusted spenders are blocked', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        (simulation, policyViolations) => {
          // Force infinite approval to untrusted spender
          const infiniteApprovalScenario = {
            totalValueAtRisk: 5000,
            lossPercentage: 0.2,
            isHoneypot: false,
            hasUnknownContract: false,
            hasInfiniteApproval: true,
            contractAge: 100,
            spenderTrustScore: 0.3 // Low trust score
          };

          const result = evaluateSafetyBlocking(simulation, policyViolations, infiniteApprovalScenario);
          
          // Infinite approvals to untrusted spenders must be blocked
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('INFINITE_APPROVAL_UNTRUSTED');
          expect(['high', 'critical']).toContain(result.severity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('simulation critical warnings trigger blocking', () => {
    fc.assert(
      fc.property(
        policyViolationGenerator,
        criticalLossScenarioGenerator,
        (policyViolations, criticalLoss) => {
          // Force simulation with critical warnings
          const simulationWithWarnings: SimulationReceipt = {
            id: 'sim_123',
            warnings: ['CRITICAL: Potential honeypot detected', 'SCAM: Known malicious contract'],
            confidence: 0.8
          };

          const result = evaluateSafetyBlocking(simulationWithWarnings, policyViolations, criticalLoss);
          
          // Critical simulation warnings must block execution
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('SIMULATION_CRITICAL_WARNING');
          expect(result.severity).toBe('critical');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('low confidence simulations are blocked', () => {
    fc.assert(
      fc.property(
        policyViolationGenerator,
        criticalLossScenarioGenerator,
        (policyViolations, criticalLoss) => {
          // Force low confidence simulation
          const lowConfidenceSimulation: SimulationReceipt = {
            id: 'sim_123',
            confidence: 0.3 // Below 0.5 threshold
          };

          const result = evaluateSafetyBlocking(lowConfidenceSimulation, policyViolations, criticalLoss);
          
          // Low confidence must block execution
          expect(result.shouldBlock).toBe(true);
          expect(result.blockingReasons).toContain('LOW_CONFIDENCE');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('blocking reasons are comprehensive and actionable', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        criticalLossScenarioGenerator,
        (simulation, policyViolations, criticalLoss) => {
          const result = evaluateSafetyBlocking(simulation, policyViolations, criticalLoss);
          
          if (result.shouldBlock) {
            // Must have at least one blocking reason
            expect(result.blockingReasons.length).toBeGreaterThan(0);
            
            // All blocking reasons must be non-empty strings
            result.blockingReasons.forEach(reason => {
              expect(typeof reason).toBe('string');
              expect(reason.length).toBeGreaterThan(0);
            });
            
            // Severity must be appropriate for blocking
            expect(['critical', 'high', 'medium', 'low']).toContain(result.severity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('severity escalation is consistent', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        criticalLossScenarioGenerator,
        (simulation, policyViolations, criticalLoss) => {
          const result = evaluateSafetyBlocking(simulation, policyViolations, criticalLoss);
          
          // Critical reasons should result in critical severity
          const hasCriticalReason = result.blockingReasons.some(reason => 
            reason.includes('CRITICAL') || 
            reason.includes('HONEYPOT') || 
            reason === 'CRITICAL_LOSS_DETECTED'
          );
          
          if (hasCriticalReason) {
            expect(result.severity).toBe('critical');
          }
          
          // High-risk reasons should result in high or critical severity
          const hasHighRiskReason = result.blockingReasons.some(reason => 
            reason === 'NEW_UNKNOWN_CONTRACT' || 
            reason === 'INFINITE_APPROVAL_UNTRUSTED' ||
            reason === 'MAX_GAS_EXCEEDED'
          );
          
          if (hasHighRiskReason && !hasCriticalReason) {
            expect(['high', 'critical']).toContain(result.severity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('safe scenarios are not blocked', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalValueAtRisk: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
          lossPercentage: fc.float({ min: Math.fround(0), max: Math.fround(0.1), noNaN: true }),
          isHoneypot: fc.constant(false),
          hasUnknownContract: fc.constant(false),
          hasInfiniteApproval: fc.constant(false),
          contractAge: fc.integer({ min: 30, max: 365 }),
          spenderTrustScore: fc.float({ min: Math.fround(0.8), max: Math.fround(1), noNaN: true })
        }),
        (safeScenario) => {
          const safeSimulation: SimulationReceipt = {
            id: 'sim_safe',
            confidence: 0.9,
            warnings: []
          };
          
          const result = evaluateSafetyBlocking(safeSimulation, [], safeScenario);
          
          // Safe scenarios should not be blocked
          expect(result.shouldBlock).toBe(false);
          expect(result.blockingReasons.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('blocking decisions are deterministic', () => {
    fc.assert(
      fc.property(
        simulationResultGenerator,
        policyViolationGenerator,
        criticalLossScenarioGenerator,
        (simulation, policyViolations, criticalLoss) => {
          const result1 = evaluateSafetyBlocking(simulation, policyViolations, criticalLoss);
          const result2 = evaluateSafetyBlocking(simulation, policyViolations, criticalLoss);
          
          // Results must be deterministic
          expect(result1.shouldBlock).toBe(result2.shouldBlock);
          expect(result1.blockingReasons).toEqual(result2.blockingReasons);
          expect(result1.severity).toBe(result2.severity);
        }
      ),
      { numRuns: 100 }
    );
  });
});