/**
 * Property-Based Tests for Safety Mode Enforcement
 * Feature: unified-portfolio, Property 30: Safety Mode Enforcement
 * 
 * Validates: Requirements 14.1
 * 
 * Property 30: Safety Mode Enforcement
 * For any interaction with new/unverified contracts or unlimited approvals,
 * the system should display appropriate warnings in default safe mode
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateSafetyWarnings,
  canProceedWithOperation,
  isNewContract,
  DEFAULT_SAFETY_CONFIG,
  type SafetyModeConfig,
} from '../security-privacy';

// ============================================================================
// GENERATORS
// ============================================================================

const hexCharGen = fc.constantFrom(...'0123456789abcdef'.split(''));
const walletAddressGen = fc.array(hexCharGen, { minLength: 40, maxLength: 40 })
  .map(chars => `0x${chars.join('')}`);

const operationTypeGen = fc.constantFrom('spend', 'approve', 'revoke', 'transfer' as const);

const contractAgeGen = fc.record({
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  verified: fc.boolean(),
});

const approvalAmountGen = fc.oneof(
  fc.constant('unlimited'),
  fc.float({ min: 0, max: 1000000 }).map(n => n.toString())
);

const valueUsdGen = fc.float({ min: 0, max: 100000 });

// ============================================================================
// PROPERTY 30: SAFETY MODE ENFORCEMENT
// ============================================================================

describe('Feature: unified-portfolio, Property 30: Safety Mode Enforcement', () => {
  describe('New Contract Detection', () => {
    // Property 30.1: Contracts less than configured days old are flagged as new
    test('contracts less than configured days old are flagged as new', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 0, max: 100 }),
          (configDays, actualDays) => {
            const config: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              newContractAgeDays: configDays,
            };
            
            const contractCreatedAt = new Date(Date.now() - actualDays * 24 * 60 * 60 * 1000);
            const isNew = isNewContract(contractCreatedAt, config);
            
            if (actualDays < configDays) {
              expect(isNew).toBe(true);
            } else {
              expect(isNew).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.2: New contracts generate high severity warnings
    test('new contracts generate high severity warnings when enabled', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          (contractAddress, operationType) => {
            const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
            
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              contractCreatedAt: recentDate,
              contractVerified: true,
            });
            
            const newContractWarning = warnings.find(w => w.type === 'new_contract');
            expect(newContractWarning).toBeDefined();
            expect(newContractWarning?.severity).toBe('high');
            expect(newContractWarning?.requiresOverride).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.3: Old contracts do not generate new contract warnings
    test('old contracts do not generate new contract warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          (contractAddress, operationType) => {
            const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
            
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              contractCreatedAt: oldDate,
              contractVerified: true,
            });
            
            const newContractWarning = warnings.find(w => w.type === 'new_contract');
            expect(newContractWarning).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unverified Contract Warnings', () => {
    // Property 30.4: Unverified contracts always generate warnings
    test('unverified contracts generate high severity warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          fc.date(),
          (contractAddress, operationType, createdAt) => {
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              contractCreatedAt: createdAt,
              contractVerified: false,
            });
            
            const unverifiedWarning = warnings.find(w => w.type === 'unverified_contract');
            expect(unverifiedWarning).toBeDefined();
            expect(unverifiedWarning?.severity).toBe('high');
            expect(unverifiedWarning?.requiresOverride).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.5: Verified contracts do not generate unverified warnings
    test('verified contracts do not generate unverified warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          fc.date(),
          (contractAddress, operationType, createdAt) => {
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              contractCreatedAt: createdAt,
              contractVerified: true,
            });
            
            const unverifiedWarning = warnings.find(w => w.type === 'unverified_contract');
            expect(unverifiedWarning).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unlimited Approval Warnings', () => {
    // Property 30.6: Unlimited approvals generate critical warnings
    test('unlimited approvals generate critical severity warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          (contractAddress) => {
            const warnings = generateSafetyWarnings({
              type: 'approve',
              contractAddress,
              approvalAmount: 'unlimited',
            });
            
            const unlimitedWarning = warnings.find(w => w.type === 'unlimited_approval');
            expect(unlimitedWarning).toBeDefined();
            expect(unlimitedWarning?.severity).toBe('critical');
            expect(unlimitedWarning?.requiresOverride).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.7: Limited approvals do not generate unlimited warnings
    test('limited approvals do not generate unlimited warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          fc.float({ min: 1, max: 1000000 }),
          (contractAddress, amount) => {
            const warnings = generateSafetyWarnings({
              type: 'approve',
              contractAddress,
              approvalAmount: amount.toString(),
            });
            
            const unlimitedWarning = warnings.find(w => w.type === 'unlimited_approval');
            expect(unlimitedWarning).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.8: Non-approve operations don't check approval amount
    test('non-approve operations do not generate unlimited approval warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          fc.constantFrom('spend', 'revoke', 'transfer' as const),
          (contractAddress, operationType) => {
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              approvalAmount: 'unlimited',
            });
            
            const unlimitedWarning = warnings.find(w => w.type === 'unlimited_approval');
            expect(unlimitedWarning).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('High Value Warnings', () => {
    // Property 30.9: High value transactions generate warnings
    test('transactions over $10,000 generate medium severity warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          fc.float({ min: 10001, max: 1000000 }),
          (contractAddress, operationType, valueUsd) => {
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              valueUsd,
            });
            
            const highValueWarning = warnings.find(w => w.type === 'high_value');
            expect(highValueWarning).toBeDefined();
            expect(highValueWarning?.severity).toBe('medium');
            expect(highValueWarning?.requiresOverride).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.10: Low value transactions do not generate high value warnings
    test('transactions under $10,000 do not generate high value warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          fc.float({ min: 0, max: 10000 }),
          (contractAddress, operationType, valueUsd) => {
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              valueUsd,
            });
            
            const highValueWarning = warnings.find(w => w.type === 'high_value');
            expect(highValueWarning).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Safety Mode Configuration', () => {
    // Property 30.11: Disabled safety mode generates no warnings
    test('disabled safety mode generates no warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          (contractAddress, operationType) => {
            const config: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              enabled: false,
            };
            
            const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            
            const warnings = generateSafetyWarnings(
              {
                type: operationType,
                contractAddress,
                contractCreatedAt: recentDate,
                contractVerified: false,
                approvalAmount: 'unlimited',
                valueUsd: 50000,
              },
              config
            );
            
            expect(warnings).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.12: Individual warning toggles work correctly
    test('individual warning toggles disable specific warnings', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          (contractAddress) => {
            const configNoNewContract: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              warnOnNewContracts: false,
            };
            
            const configNoUnlimited: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              warnOnUnlimitedApprovals: false,
            };
            
            const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            
            // Test new contract warning disabled
            const warningsNoNew = generateSafetyWarnings(
              {
                type: 'approve',
                contractAddress,
                contractCreatedAt: recentDate,
              },
              configNoNewContract
            );
            expect(warningsNoNew.find(w => w.type === 'new_contract')).toBeUndefined();
            
            // Test unlimited approval warning disabled
            const warningsNoUnlimited = generateSafetyWarnings(
              {
                type: 'approve',
                contractAddress,
                approvalAmount: 'unlimited',
              },
              configNoUnlimited
            );
            expect(warningsNoUnlimited.find(w => w.type === 'unlimited_approval')).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Operation Proceed Logic', () => {
    // Property 30.13: Critical warnings block operations
    test('critical warnings that require override block operations', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          (contractAddress) => {
            const warnings = generateSafetyWarnings({
              type: 'approve',
              contractAddress,
              approvalAmount: 'unlimited',
            });
            
            const canProceed = canProceedWithOperation(warnings);
            expect(canProceed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.14: Non-critical warnings allow operations
    test('non-critical warnings allow operations to proceed', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          fc.float({ min: 10001, max: 100000 }),
          (contractAddress, valueUsd) => {
            const warnings = generateSafetyWarnings({
              type: 'transfer',
              contractAddress,
              valueUsd,
            });
            
            const canProceed = canProceedWithOperation(warnings);
            expect(canProceed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 30.15: No warnings allow operations
    test('operations with no warnings can proceed', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          operationTypeGen,
          (contractAddress, operationType) => {
            const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            
            const warnings = generateSafetyWarnings({
              type: operationType,
              contractAddress,
              contractCreatedAt: oldDate,
              contractVerified: true,
              valueUsd: 100,
            });
            
            const canProceed = canProceedWithOperation(warnings);
            expect(canProceed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
