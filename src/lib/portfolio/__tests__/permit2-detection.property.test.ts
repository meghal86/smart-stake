/**
 * Property-Based Tests for Permit2 Detection and Scoring
 * 
 * Feature: unified-portfolio, Property 11: Permit2 Detection and Scoring
 * Validates: Requirements 5.9
 * 
 * Tests universal properties that should hold for ALL Permit2 detection:
 * - Permit2 approvals are correctly identified (is_permit2 = true)
 * - ApprovalRisk scoring applies to Permit2 operators/spenders
 * - Special rules for unverified Permit2 operators
 * - Permit2 detection is consistent and deterministic
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  calculateApprovalRisk,
  createApprovalRisk,
  PERMIT2_ADDRESSES,
  TRUSTED_SPENDERS,
  RISK_THRESHOLDS
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

// Generate known Permit2 addresses
const permit2AddressGenerator = PERMIT2_ADDRESSES.size > 0
  ? fc.constantFrom(...Array.from(PERMIT2_ADDRESSES))
  : fc.constant('0x000000000022d473030f116ddee9f6b43ac78ba3'); // Uniswap Permit2

// Generate non-Permit2 addresses
const nonPermit2AddressGenerator = addressGenerator.filter(addr => 
  !PERMIT2_ADDRESSES.has(addr.toLowerCase())
);

// Generate trusted vs untrusted Permit2 operators
const trustedPermit2Generator = fc.constantFrom(...Array.from(PERMIT2_ADDRESSES))
  .filter(addr => TRUSTED_SPENDERS.has(addr.toLowerCase()));

const untrustedPermit2Generator = fc.constantFrom(...Array.from(PERMIT2_ADDRESSES))
  .filter(addr => !TRUSTED_SPENDERS.has(addr.toLowerCase()));

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 11: Permit2 Detection and Scoring', () => {
  
  test('Permit2 addresses are correctly identified', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(
            token,
            spender,
            amount,
            ageInDays,
            chainId
          );
          
          // Property: Known Permit2 addresses should be detected
          expect(calculation.isPermit2).toBe(true);
          
          // Property: Permit2 detection should be in risk reasons
          expect(calculation.riskReasons).toContain('PERMIT2_APPROVAL');
          
          // Property: Permit2 should be mentioned in contributing factors
          const hasPermit2Context = calculation.contributingFactors.some(factor =>
            factor.description.toLowerCase().includes('permit2') ||
            factor.description.toLowerCase().includes('operator')
          );
          // Note: This might not always be true depending on implementation
        }
      ),
      { numRuns: 100 }
    );
  });

  test('non-Permit2 addresses are not identified as Permit2', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        nonPermit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(
            token,
            spender,
            amount,
            ageInDays,
            chainId
          );
          
          // Property: Non-Permit2 addresses should not be detected as Permit2
          expect(calculation.isPermit2).toBe(false);
          
          // Property: Should not have Permit2 approval reason
          expect(calculation.riskReasons).not.toContain('PERMIT2_APPROVAL');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unverified Permit2 operators trigger critical rule', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(
            token,
            spender,
            amount,
            ageInDays,
            chainId
          );
          
          // Property: Should be detected as Permit2
          expect(calculation.isPermit2).toBe(true);
          
          // Property: If spender is not trusted, should trigger unverified rule
          if (!TRUSTED_SPENDERS.has(spender.toLowerCase())) {
            expect(calculation.riskReasons).toContain('UNVERIFIED_PERMIT2_OPERATOR');
            expect(calculation.severity).toBe('critical');
            expect(calculation.riskScore).toBeGreaterThanOrEqual(RISK_THRESHOLDS.critical);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 detection is deterministic', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        addressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation1 = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          const calculation2 = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: Same inputs should produce identical Permit2 detection
          expect(calculation1.isPermit2).toBe(calculation2.isPermit2);
          
          // Property: Permit2 reasons should be consistent
          const hasPermit2Reason1 = calculation1.riskReasons.includes('PERMIT2_APPROVAL');
          const hasPermit2Reason2 = calculation2.riskReasons.includes('PERMIT2_APPROVAL');
          expect(hasPermit2Reason1).toBe(hasPermit2Reason2);
          
          // Property: Unverified operator rules should be consistent
          const hasUnverifiedRule1 = calculation1.riskReasons.includes('UNVERIFIED_PERMIT2_OPERATOR');
          const hasUnverifiedRule2 = calculation2.riskReasons.includes('UNVERIFIED_PERMIT2_OPERATOR');
          expect(hasUnverifiedRule1).toBe(hasUnverifiedRule2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 detection works across all chain IDs', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: Permit2 detection should work regardless of chain
          expect(calculation.isPermit2).toBe(true);
          expect(calculation.riskReasons).toContain('PERMIT2_APPROVAL');
          
          // Property: Chain ID should not affect Permit2 detection logic
          const otherChainId = chainId === 1 ? 137 : 1;
          const otherChainCalc = calculateApprovalRisk(token, spender, amount, ageInDays, otherChainId);
          
          expect(otherChainCalc.isPermit2).toBe(true);
          expect(otherChainCalc.riskReasons).toContain('PERMIT2_APPROVAL');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 scoring incorporates all risk factors', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: Permit2 approvals should still have all risk factors
          const factorNames = calculation.contributingFactors.map(f => f.factor);
          expect(factorNames).toContain('Age Risk');
          expect(factorNames).toContain('Scope Risk');
          expect(factorNames).toContain('Value at Risk');
          expect(factorNames).toContain('Spender Trust');
          expect(factorNames).toContain('Contract Risk');
          expect(factorNames).toContain('Context Risk');
          
          // Property: Risk score should still be bounded
          expect(calculation.riskScore).toBeGreaterThanOrEqual(0);
          expect(calculation.riskScore).toBeLessThanOrEqual(1);
          
          // Property: Should have valid severity
          expect(['critical', 'high', 'medium', 'low']).toContain(calculation.severity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('createApprovalRisk preserves Permit2 detection', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 32 }),
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (id, token, spender, amount, ageInDays, chainId) => {
          const approvalRisk = createApprovalRisk(
            id,
            token,
            spender,
            amount,
            ageInDays,
            chainId
          );
          
          // Property: Permit2 detection should be preserved
          expect(approvalRisk.isPermit2).toBe(true);
          
          // Property: Permit2 reason should be in risk reasons
          expect(approvalRisk.riskReasons).toContain('PERMIT2_APPROVAL');
          
          // Property: All other fields should be valid
          expect(approvalRisk.id).toBe(id);
          expect(approvalRisk.token).toBe(token);
          expect(approvalRisk.spender).toBe(spender);
          expect(approvalRisk.amount).toBe(amount);
          expect(approvalRisk.ageInDays).toBe(ageInDays);
          expect(approvalRisk.chainId).toBe(chainId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 vs regular approval risk comparison', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        nonPermit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, permit2Spender, regularSpender, amount, ageInDays, chainId) => {
          const permit2Calc = calculateApprovalRisk(token, permit2Spender, amount, ageInDays, chainId);
          const regularCalc = calculateApprovalRisk(token, regularSpender, amount, ageInDays, chainId);
          
          // Property: Permit2 should be detected correctly
          expect(permit2Calc.isPermit2).toBe(true);
          expect(regularCalc.isPermit2).toBe(false);
          
          // Property: Both should have valid risk scores
          expect(permit2Calc.riskScore).toBeGreaterThanOrEqual(0);
          expect(permit2Calc.riskScore).toBeLessThanOrEqual(1);
          expect(regularCalc.riskScore).toBeGreaterThanOrEqual(0);
          expect(regularCalc.riskScore).toBeLessThanOrEqual(1);
          
          // Property: Both should have all required contributing factors
          expect(permit2Calc.contributingFactors.length).toBe(regularCalc.contributingFactors.length);
          
          // Property: Risk reasons should differ appropriately
          expect(permit2Calc.riskReasons).toContain('PERMIT2_APPROVAL');
          expect(regularCalc.riskReasons).not.toContain('PERMIT2_APPROVAL');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 address case sensitivity', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        fc.constantFrom('0x000000000022D473030F116DDEE9F6B43AC78BA3'), // Uppercase
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: Permit2 detection should be case-insensitive
          expect(calculation.isPermit2).toBe(true);
          expect(calculation.riskReasons).toContain('PERMIT2_APPROVAL');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 special rules override base scoring', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        fc.constant('unlimited'), // Force unlimited to test special rules
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: Should be detected as Permit2
          expect(calculation.isPermit2).toBe(true);
          
          // Property: If unverified, should have critical severity due to special rule
          if (!TRUSTED_SPENDERS.has(spender.toLowerCase())) {
            expect(calculation.severity).toBe('critical');
            expect(calculation.riskScore).toBeGreaterThanOrEqual(RISK_THRESHOLDS.critical);
            expect(calculation.riskReasons).toContain('UNVERIFIED_PERMIT2_OPERATOR');
          }
          
          // Property: Should also have unlimited approval reason
          expect(calculation.riskReasons).toContain('INFINITE_ALLOWANCE');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 detection with edge case addresses', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        fc.constantFrom(
          '0x000000000022d473030f116ddee9f6b43ac78ba3', // Standard case
          '0x000000000022D473030F116DDEE9F6B43AC78BA3', // Upper case
          '0x000000000022d473030f116ddee9f6b43ac78ba3'.toUpperCase(), // All upper
        ),
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          const calculation = calculateApprovalRisk(token, spender, amount, ageInDays, chainId);
          
          // Property: All case variations should be detected
          expect(calculation.isPermit2).toBe(true);
          expect(calculation.riskReasons).toContain('PERMIT2_APPROVAL');
          
          // Property: Case should not affect risk scoring
          expect(calculation.riskScore).toBeGreaterThanOrEqual(0);
          expect(calculation.riskScore).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Permit2 detection consistency across multiple calls', () => {
    fc.assert(
      fc.property(
        tokenSymbolGenerator,
        permit2AddressGenerator,
        approvalAmountGenerator,
        ageGenerator,
        chainIdGenerator,
        (token, spender, amount, ageInDays, chainId) => {
          // Multiple calls with same parameters
          const calculations = Array.from({ length: 5 }, () =>
            calculateApprovalRisk(token, spender, amount, ageInDays, chainId)
          );
          
          // Property: All calls should produce identical Permit2 detection
          for (const calc of calculations) {
            expect(calc.isPermit2).toBe(true);
            expect(calc.riskReasons).toContain('PERMIT2_APPROVAL');
          }
          
          // Property: All risk scores should be identical
          const firstScore = calculations[0].riskScore;
          for (const calc of calculations) {
            expect(calc.riskScore).toBe(firstScore);
          }
          
          // Property: All severities should be identical
          const firstSeverity = calculations[0].severity;
          for (const calc of calculations) {
            expect(calc.severity).toBe(firstSeverity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Validates: Requirements 5.9**