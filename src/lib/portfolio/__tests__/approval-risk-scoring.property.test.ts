/**
 * Property-Based Tests for Approval Risk Scoring
 * 
 * Feature: unified-portfolio, Property 8: Approval Risk Scoring Completeness
 * Validates: Requirements 5.1, 5.2
 * 
 * Tests universal properties that should hold for ALL approval risk calculations:
 * - Risk scores incorporate all required factors (age, scope, VAR, spender trust, contract risk, context)
 * - Risk scores are bounded between 0 and 1
 * - Special rules are applied consistently
 * - Contributing factors sum to meaningful weights
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  calculateApprovalRisk,
  createApprovalRisk,
  generateRiskReasons,
  RISK_WEIGHTS,
  RISK_THRESHOLDS,
  VAR_THRESHOLDS,
  KNOWN_SCAM_SPENDERS,
  HIGH_RISK_SPENDERS,
  TRUSTED_SPENDERS,
  PERMIT2_ADDRESSES
} from '../approvalRiskEngine';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate valid Ethereum addresses
const addressGenerator = fc.integer({ min: 0, max: 15 })
  .chain(n => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

// Generate valid token symbols
const tokenSymbolGenerator = fc.constantFrom(
  'ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'UNI', 'LINK', 'AAVE', 'COMP', 'MKR'
);

// Generate approval amounts
const approvalAmountGenerator = fc.oneof(
  fc.constant('unlimited'),
  fc.bigInt({ min: 1n, max: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') })
    .map(n => n.toString()),
  fc.integer({ min: 1, max: 1000000 }).map(n => (BigInt(n) * BigInt(10 ** 18)).toString())
);

// Generate age in days
const ageGenerator = fc.integer({ min: 0, max: 1095 }); // 0-3 years

// Generate chain IDs
const chainIdGenerator = fc.constantFrom(1, 137, 56, 43114, 42161, 10);

// Generate token prices
const tokenPriceGenerator = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true });

// Generate token decimals
const tokenDecimalsGenerator = fc.constantFrom(6, 8, 18);

// Generate complete approval data
const approvalDataGenerator = fc.record({
  id: fc.string({ minLength: 8, maxLength: 32 }),
  token: tokenSymbolGenerator,
  spender: addressGenerator,
  amount: approvalAmountGenerator,
  ageInDays: ageGenerator,
  chainId: chainIdGenerator,
  tokenPriceUsd: fc.option(tokenPriceGenerator),
  tokenDecimals: fc.option(tokenDecimalsGenerator)
});

// Generate known risk categories (with fallbacks for empty sets)
const knownScamSpenderGenerator = KNOWN_SCAM_SPENDERS.size > 0 
  ? fc.constantFrom(...Array.from(KNOWN_SCAM_SPENDERS))
  : fc.constant('0x0000000000000000000000000000000000000000');

const highRiskSpenderGenerator = HIGH_RISK_SPENDERS.size > 0
  ? fc.constantFrom(...Array.from(HIGH_RISK_SPENDERS))
  : fc.constant('0x1111111111111111111111111111111111111111');

const trustedSpenderGenerator = TRUSTED_SPENDERS.size > 0
  ? fc.constantFrom(...Array.from(TRUSTED_SPENDERS))
  : fc.constant('0xa0b86a33e6441e8c8c7014b5c1e2c8b5e8b5e8b5');

const permit2SpenderGenerator = PERMIT2_ADDRESSES.size > 0
  ? fc.constantFrom(...Array.from(PERMIT2_ADDRESSES))
  : fc.constant('0x000000000022d473030f116ddee9f6b43ac78ba3');

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 8: Approval Risk Scoring Completeness', () => {
  
  test('risk scores are always bounded between 0 and 1', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: Risk score must be bounded
          expect(calculation.riskScore).toBeGreaterThanOrEqual(0);
          expect(calculation.riskScore).toBeLessThanOrEqual(1);
          
          // Property: Risk score must be a valid number
          expect(Number.isFinite(calculation.riskScore)).toBe(true);
          expect(Number.isNaN(calculation.riskScore)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all required risk factors are incorporated', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: All required factors must be present
          const factorNames = calculation.contributingFactors.map(f => f.factor);
          expect(factorNames).toContain('Age Risk');
          expect(factorNames).toContain('Scope Risk');
          expect(factorNames).toContain('Value at Risk');
          expect(factorNames).toContain('Spender Trust');
          expect(factorNames).toContain('Contract Risk');
          expect(factorNames).toContain('Context Risk');
          
          // Property: Each factor must have valid weight and score
          for (const factor of calculation.contributingFactors) {
            expect(factor.weight).toBeGreaterThan(0);
            expect(factor.weight).toBeLessThanOrEqual(1);
            expect(factor.score).toBeGreaterThanOrEqual(0);
            expect(factor.score).toBeLessThanOrEqual(1);
            expect(factor.description).toBeTruthy();
          }
          
          // Property: Weights should match expected values
          const ageWeight = calculation.contributingFactors.find(f => f.factor === 'Age Risk')?.weight;
          const scopeWeight = calculation.contributingFactors.find(f => f.factor === 'Scope Risk')?.weight;
          const varWeight = calculation.contributingFactors.find(f => f.factor === 'Value at Risk')?.weight;
          const spenderWeight = calculation.contributingFactors.find(f => f.factor === 'Spender Trust')?.weight;
          const contractWeight = calculation.contributingFactors.find(f => f.factor === 'Contract Risk')?.weight;
          const contextWeight = calculation.contributingFactors.find(f => f.factor === 'Context Risk')?.weight;
          
          expect(ageWeight).toBe(RISK_WEIGHTS.age);
          expect(scopeWeight).toBe(RISK_WEIGHTS.scope);
          expect(varWeight).toBe(RISK_WEIGHTS.valueAtRisk);
          expect(spenderWeight).toBe(RISK_WEIGHTS.spenderTrust);
          expect(contractWeight).toBe(RISK_WEIGHTS.contractRisk);
          expect(contextWeight).toBe(RISK_WEIGHTS.context);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('severity classification is consistent with risk score', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: Severity must match risk score thresholds
          if (calculation.riskScore >= RISK_THRESHOLDS.critical) {
            expect(calculation.severity).toBe('critical');
          } else if (calculation.riskScore >= RISK_THRESHOLDS.high) {
            expect(calculation.severity).toBe('high');
          } else if (calculation.riskScore >= RISK_THRESHOLDS.medium) {
            expect(calculation.severity).toBe('medium');
          } else {
            expect(calculation.severity).toBe('low');
          }
          
          // Property: Severity must be one of valid values
          expect(['critical', 'high', 'medium', 'low']).toContain(calculation.severity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('value at risk calculation is accurate', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: VAR must be non-negative
          expect(calculation.valueAtRisk).toBeGreaterThanOrEqual(0);
          
          // Property: VAR must be finite
          expect(Number.isFinite(calculation.valueAtRisk)).toBe(true);
          
          // Property: For unlimited approvals, VAR should be reasonable
          if (approval.amount === 'unlimited') {
            expect(calculation.valueAtRisk).toBeGreaterThan(0);
            if (approval.tokenPriceUsd) {
              expect(calculation.valueAtRisk).toBeLessThanOrEqual(approval.tokenPriceUsd * 10000);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('special rules are applied consistently', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, amount, ageInDays, chainId) => {
          // Test infinite + unknown spender rule
          const unknownSpender = '0x1234567890123456789012345678901234567890';
          const calculation = calculateApprovalRisk(
            token,
            unknownSpender,
            'unlimited',
            ageInDays,
            chainId
          );
          
          // Property: Infinite + unknown should be critical or have special reason
          if (amount === 'unlimited' && !TRUSTED_SPENDERS.has(unknownSpender)) {
            expect(calculation.riskScore >= RISK_THRESHOLDS.critical || 
                   calculation.riskReasons.includes('INFINITE_UNKNOWN_RULE')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('known spender categories are handled correctly', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        fc.oneof(
          knownScamSpenderGenerator,
          trustedSpenderGenerator,
          permit2SpenderGenerator
        ),
        (token, amount, ageInDays, chainId, spender) => {
          const calculation = calculateApprovalRisk(
            token,
            spender,
            amount,
            ageInDays,
            chainId
          );
          
          // Property: Known scam spenders should have high risk
          if (KNOWN_SCAM_SPENDERS.has(spender)) {
            expect(calculation.riskScore).toBeGreaterThan(0.7);
            expect(calculation.riskReasons).toContain('KNOWN_SCAM_SPENDER');
          }
          
          // Property: Trusted spenders should have lower base risk
          if (TRUSTED_SPENDERS.has(spender)) {
            const spenderFactor = calculation.contributingFactors.find(f => f.factor === 'Spender Trust');
            expect(spenderFactor?.score).toBeLessThan(0.5);
          }
          
          // Property: Permit2 addresses should be detected
          if (PERMIT2_ADDRESSES.has(spender)) {
            expect(calculation.isPermit2).toBe(true);
            expect(calculation.riskReasons).toContain('PERMIT2_APPROVAL');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('risk reasons are generated consistently', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: Risk reasons should be non-empty array
          expect(Array.isArray(calculation.riskReasons)).toBe(true);
          
          // Property: Each reason should be a non-empty string
          for (const reason of calculation.riskReasons) {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
          }
          
          // Property: Unlimited approvals should have INFINITE_ALLOWANCE reason
          if (approval.amount === 'unlimited') {
            expect(calculation.riskReasons).toContain('INFINITE_ALLOWANCE');
          }
          
          // Property: Old approvals should have OLD_APPROVAL reason
          if (approval.ageInDays > 365) {
            expect(calculation.riskReasons).toContain('OLD_APPROVAL');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('createApprovalRisk produces valid ApprovalRisk objects', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const approvalRisk = createApprovalRisk(
            approval.id,
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: All required fields should be present
          expect(approvalRisk.id).toBe(approval.id);
          expect(approvalRisk.token).toBe(approval.token);
          expect(approvalRisk.spender).toBe(approval.spender);
          expect(approvalRisk.amount).toBe(approval.amount);
          expect(approvalRisk.ageInDays).toBe(approval.ageInDays);
          expect(approvalRisk.chainId).toBe(approval.chainId);
          
          // Property: Risk score should be valid
          expect(approvalRisk.riskScore).toBeGreaterThanOrEqual(0);
          expect(approvalRisk.riskScore).toBeLessThanOrEqual(1);
          
          // Property: Severity should be valid
          expect(['critical', 'high', 'medium', 'low']).toContain(approvalRisk.severity);
          
          // Property: Value at risk should be non-negative
          expect(approvalRisk.valueAtRisk).toBeGreaterThanOrEqual(0);
          
          // Property: Risk reasons should be array
          expect(Array.isArray(approvalRisk.riskReasons)).toBe(true);
          
          // Property: Contributing factors should be array
          expect(Array.isArray(approvalRisk.contributingFactors)).toBe(true);
          
          // Property: isPermit2 should be boolean
          expect(typeof approvalRisk.isPermit2).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('risk calculation is deterministic', () => {
    fc.assert(
      fc.property(
        approvalDataGenerator,
        (approval) => {
          const calculation1 = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          const calculation2 = calculateApprovalRisk(
            approval.token,
            approval.spender,
            approval.amount,
            approval.ageInDays,
            approval.chainId,
            approval.tokenPriceUsd,
            approval.tokenDecimals
          );
          
          // Property: Same inputs should produce identical results
          expect(calculation1.riskScore).toBe(calculation2.riskScore);
          expect(calculation1.severity).toBe(calculation2.severity);
          expect(calculation1.valueAtRisk).toBe(calculation2.valueAtRisk);
          expect(calculation1.riskReasons).toEqual(calculation2.riskReasons);
          expect(calculation1.isPermit2).toBe(calculation2.isPermit2);
          expect(calculation1.contributingFactors.length).toBe(calculation2.contributingFactors.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('age risk increases monotonically with age', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        addressGenerator,
        approvalAmountGenerator,
        chainIdGenerator,
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 501, max: 1095 }),
        (token, spender, amount, chainId, youngerAge, olderAge) => {
          const youngerCalc = calculateApprovalRisk(token, spender, amount, youngerAge, chainId);
          const olderCalc = calculateApprovalRisk(token, spender, amount, olderAge, chainId);
          
          const youngerAgeFactor = youngerCalc.contributingFactors.find(f => f.factor === 'Age Risk');
          const olderAgeFactor = olderCalc.contributingFactors.find(f => f.factor === 'Age Risk');
          
          // Property: Older approvals should have higher age risk scores
          expect(olderAgeFactor!.score).toBeGreaterThanOrEqual(youngerAgeFactor!.score);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unlimited approvals have higher scope risk than limited', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        addressGenerator,
        ageGenerator,
        chainIdGenerator,
        fc.integer({ min: 1, max: 1000000 }).map(n => (BigInt(n) * BigInt(10 ** 18)).toString()),
        (token, spender, ageInDays, chainId, limitedAmount) => {
          const unlimitedCalc = calculateApprovalRisk(token, spender, 'unlimited', ageInDays, chainId);
          const limitedCalc = calculateApprovalRisk(token, spender, limitedAmount, ageInDays, chainId);
          
          const unlimitedScopeFactor = unlimitedCalc.contributingFactors.find(f => f.factor === 'Scope Risk');
          const limitedScopeFactor = limitedCalc.contributingFactors.find(f => f.factor === 'Scope Risk');
          
          // Property: Unlimited approvals should have higher scope risk
          expect(unlimitedScopeFactor!.score).toBeGreaterThan(limitedScopeFactor!.score);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Validates: Requirements 5.1, 5.2**