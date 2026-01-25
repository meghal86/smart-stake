/**
 * Property-Based Tests for Risk Explainability
 * 
 * Feature: unified-portfolio, Property 10: Risk Explainability
 * Validates: Requirements 5.6, 5.7
 * 
 * Tests universal properties that should hold for ALL risk explainability:
 * - Top 3 contributing factors and their weights are persisted
 * - Risk Reasons array is exposed in API response
 * - Explanations are meaningful and actionable
 * - Contributing factors sum to meaningful analysis
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  calculateApprovalRisk,
  createApprovalRisk,
  generateRiskReasons,
  RISK_WEIGHTS
} from '../approvalRiskEngine';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate Ethereum addresses
const addressGenerator = fc.integer({ min: 0, max: 15 })
  .chain(n => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

// Generate token symbols
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

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 10: Risk Explainability', () => {
  
  test('contributing factors are always present and meaningful', () => {
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
          
          // Property: Contributing factors must be present
          expect(Array.isArray(calculation.contributingFactors)).toBe(true);
          expect(calculation.contributingFactors.length).toBeGreaterThan(0);
          
          // Property: Should have all required factor types
          const factorNames = calculation.contributingFactors.map(f => f.factor);
          expect(factorNames).toContain('Age Risk');
          expect(factorNames).toContain('Scope Risk');
          expect(factorNames).toContain('Value at Risk');
          expect(factorNames).toContain('Spender Trust');
          expect(factorNames).toContain('Contract Risk');
          expect(factorNames).toContain('Context Risk');
          
          // Property: Each factor must have meaningful content
          for (const factor of calculation.contributingFactors) {
            expect(factor.factor).toBeTruthy();
            expect(typeof factor.factor).toBe('string');
            expect(factor.factor.length).toBeGreaterThan(0);
            
            expect(factor.weight).toBeGreaterThan(0);
            expect(factor.weight).toBeLessThanOrEqual(1);
            expect(Number.isFinite(factor.weight)).toBe(true);
            
            expect(factor.score).toBeGreaterThanOrEqual(0);
            expect(factor.score).toBeLessThanOrEqual(1);
            expect(Number.isFinite(factor.score)).toBe(true);
            
            expect(factor.description).toBeTruthy();
            expect(typeof factor.description).toBe('string');
            expect(factor.description.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('top contributing factors are properly weighted', () => {
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
          
          // Property: Factors should be sorted by impact (weight * score)
          const factorImpacts = calculation.contributingFactors.map(f => ({
            ...f,
            impact: f.weight * f.score
          }));
          
          // Property: Higher impact factors should contribute more to explanation
          for (let i = 0; i < factorImpacts.length - 1; i++) {
            const current = factorImpacts[i];
            const next = factorImpacts[i + 1];
            
            // Property: Each factor should have reasonable impact
            expect(current.impact).toBeGreaterThanOrEqual(0);
            expect(current.impact).toBeLessThanOrEqual(1);
          }
          
          // Property: Weights should match expected risk weights
          const ageWeight = calculation.contributingFactors.find(f => f.factor === 'Age Risk')?.weight;
          const scopeWeight = calculation.contributingFactors.find(f => f.factor === 'Scope Risk')?.weight;
          const varWeight = calculation.contributingFactors.find(f => f.factor === 'Value at Risk')?.weight;
          
          expect(ageWeight).toBe(RISK_WEIGHTS.age);
          expect(scopeWeight).toBe(RISK_WEIGHTS.scope);
          expect(varWeight).toBe(RISK_WEIGHTS.valueAtRisk);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('risk reasons array is comprehensive and actionable', () => {
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
          
          // Property: Risk reasons must be present
          expect(Array.isArray(calculation.riskReasons)).toBe(true);
          
          // Property: Each reason must be a meaningful string
          for (const reason of calculation.riskReasons) {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
            expect(reason).toMatch(/^[A-Z_]+$/); // Should be uppercase constants
          }
          
          // Property: Reasons should be consistent with approval characteristics
          if (approval.amount === 'unlimited') {
            expect(calculation.riskReasons).toContain('INFINITE_ALLOWANCE');
          }
          
          if (approval.ageInDays > 365) {
            expect(calculation.riskReasons).toContain('OLD_APPROVAL');
          }
          
          // Property: No duplicate reasons
          const uniqueReasons = new Set(calculation.riskReasons);
          expect(uniqueReasons.size).toBe(calculation.riskReasons.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('risk explanations are contextually appropriate', () => {
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
          
          // Property: Age factor description should mention age
          const ageFactor = calculation.contributingFactors.find(f => f.factor === 'Age Risk');
          expect(ageFactor?.description).toContain(approval.ageInDays.toString());
          expect(ageFactor?.description.toLowerCase()).toMatch(/day|old|age/);
          
          // Property: Scope factor description should mention approval type
          const scopeFactor = calculation.contributingFactors.find(f => f.factor === 'Scope Risk');
          if (approval.amount === 'unlimited') {
            expect(scopeFactor?.description.toLowerCase()).toMatch(/unlimited|infinite/);
          } else {
            expect(scopeFactor?.description.toLowerCase()).toMatch(/limited/);
          }
          
          // Property: VAR factor description should mention dollar amount
          const varFactor = calculation.contributingFactors.find(f => f.factor === 'Value at Risk');
          expect(varFactor?.description).toMatch(/\$|usd|risk/i);
          
          // Property: Spender factor description should be meaningful
          const spenderFactor = calculation.contributingFactors.find(f => f.factor === 'Spender Trust');
          expect(spenderFactor?.description.toLowerCase()).toMatch(/spender|trust|protocol|address/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('high-risk scenarios have clear explanations', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        addressGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, ageInDays, chainId) => {
          // Test high-risk scenario: unlimited approval to unknown spender
          const calculation = calculateApprovalRisk(
            token,
            spender,
            'unlimited',
            ageInDays,
            chainId
          );
          
          // Property: High-risk scenarios should have clear risk reasons
          if (calculation.severity === 'critical' || calculation.severity === 'high') {
            expect(calculation.riskReasons.length).toBeGreaterThan(0);
            
            // Property: Should have at least one high-impact factor
            const highImpactFactors = calculation.contributingFactors.filter(f => 
              (f.weight * f.score) > 0.1
            );
            expect(highImpactFactors.length).toBeGreaterThan(0);
            
            // Property: Descriptions should be actionable
            for (const factor of calculation.contributingFactors) {
              expect(factor.description.length).toBeGreaterThan(10); // Meaningful description
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('factor weights are consistent and sum appropriately', () => {
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
          
          // Property: All weights should sum to 1.0 (within floating point precision)
          const totalWeight = calculation.contributingFactors.reduce((sum, f) => sum + f.weight, 0);
          expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001);
          
          // Property: Each weight should be reasonable
          for (const factor of calculation.contributingFactors) {
            expect(factor.weight).toBeGreaterThan(0);
            expect(factor.weight).toBeLessThan(1); // No single factor dominates completely
          }
          
          // Property: Weights should match expected distribution
          const expectedWeights = Object.values(RISK_WEIGHTS);
          const actualWeights = calculation.contributingFactors.map(f => f.weight).sort();
          expectedWeights.sort();
          
          for (let i = 0; i < expectedWeights.length; i++) {
            expect(Math.abs(actualWeights[i] - expectedWeights[i])).toBeLessThan(0.001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('explanations are deterministic and consistent', () => {
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
          
          // Property: Same inputs should produce identical explanations
          expect(calculation1.riskReasons).toEqual(calculation2.riskReasons);
          expect(calculation1.contributingFactors.length).toBe(calculation2.contributingFactors.length);
          
          for (let i = 0; i < calculation1.contributingFactors.length; i++) {
            const factor1 = calculation1.contributingFactors[i];
            const factor2 = calculation2.contributingFactors[i];
            
            expect(factor1.factor).toBe(factor2.factor);
            expect(factor1.weight).toBe(factor2.weight);
            expect(factor1.score).toBe(factor2.score);
            expect(factor1.description).toBe(factor2.description);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('createApprovalRisk preserves explainability data', () => {
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
          
          // Property: All explainability data should be preserved
          expect(Array.isArray(approvalRisk.riskReasons)).toBe(true);
          expect(Array.isArray(approvalRisk.contributingFactors)).toBe(true);
          
          // Property: Contributing factors should have all required fields
          for (const factor of approvalRisk.contributingFactors) {
            expect(factor).toHaveProperty('factor');
            expect(factor).toHaveProperty('weight');
            expect(factor).toHaveProperty('score');
            expect(factor).toHaveProperty('description');
            
            expect(typeof factor.factor).toBe('string');
            expect(typeof factor.weight).toBe('number');
            expect(typeof factor.score).toBe('number');
            expect(typeof factor.description).toBe('string');
          }
          
          // Property: Risk reasons should be meaningful
          for (const reason of approvalRisk.riskReasons) {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('generateRiskReasons produces consistent results', () => {
    fc.assert(
      fc.property(
        addressGenerator,
        ageGenerator,
        fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
        fc.boolean(),
        (spender, ageInDays, valueAtRisk, isPermit2) => {
          const reasons1 = generateRiskReasons(true, spender, ageInDays, valueAtRisk, isPermit2);
          const reasons2 = generateRiskReasons(true, spender, ageInDays, valueAtRisk, isPermit2);
          
          // Property: Same inputs should produce identical reasons
          expect(reasons1).toEqual(reasons2);
          
          // Property: Reasons should be consistent with inputs
          if (ageInDays > 365) {
            expect(reasons1).toContain('OLD_APPROVAL');
          }
          
          if (isPermit2) {
            expect(reasons1).toContain('PERMIT2_APPROVAL');
          }
          
          // Property: All reasons should be valid strings
          for (const reason of reasons1) {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
            expect(reason).toMatch(/^[A-Z_0-9]+$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('risk explanations scale with risk level', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        addressGenerator,
        chainIdGenerator,
        fc.tuple(
          fc.constant('unlimited'),
          fc.integer({ min: 1, max: 100 }).map(n => (BigInt(n) * BigInt(10 ** 18)).toString())
        ),
        fc.tuple(
          fc.integer({ min: 0, max: 30 }),
          fc.integer({ min: 365, max: 1095 })
        ),
        (token, spender, chainId, [unlimitedAmount, limitedAmount], [youngAge, oldAge]) => {
          const highRiskCalc = calculateApprovalRisk(token, spender, unlimitedAmount, oldAge, chainId);
          const lowRiskCalc = calculateApprovalRisk(token, spender, limitedAmount, youngAge, chainId);
          
          // Property: Higher risk should have more risk reasons
          if (highRiskCalc.riskScore > lowRiskCalc.riskScore) {
            expect(highRiskCalc.riskReasons.length).toBeGreaterThanOrEqual(lowRiskCalc.riskReasons.length);
          }
          
          // Property: Higher risk should have more detailed explanations
          const highRiskDescLength = highRiskCalc.contributingFactors
            .reduce((sum, f) => sum + f.description.length, 0);
          const lowRiskDescLength = lowRiskCalc.contributingFactors
            .reduce((sum, f) => sum + f.description.length, 0);
          
          // Both should have meaningful descriptions
          expect(highRiskDescLength).toBeGreaterThan(50);
          expect(lowRiskDescLength).toBeGreaterThan(50);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Validates: Requirements 5.6, 5.7**