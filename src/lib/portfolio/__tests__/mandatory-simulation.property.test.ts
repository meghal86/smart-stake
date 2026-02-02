/**
 * Property-Based Tests for Mandatory Simulation Coverage
 * Feature: unified-portfolio, Property 31: Mandatory Simulation Coverage
 * 
 * Validates: Requirements 14.2
 * 
 * Property 31: Mandatory Simulation Coverage
 * For any spend, approve, or revoke operation, the system should require
 * simulation before execution
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isSimulationRequired,
  validateSimulationPerformed,
  DEFAULT_SAFETY_CONFIG,
  type SafetyModeConfig,
} from '../security-privacy';

// ============================================================================
// GENERATORS
// ============================================================================

const operationTypeGen = fc.constantFrom('spend', 'approve', 'revoke', 'transfer' as const);
const valueUsdGen = fc.float({ min: 0, max: 100000, noNaN: true });
const simulationReceiptIdGen = fc.oneof(
  fc.constant(undefined),
  fc.string({ minLength: 10, maxLength: 50 }).map(s => `sim_${s}`)
);

// ============================================================================
// PROPERTY 31: MANDATORY SIMULATION COVERAGE
// ============================================================================

describe('Feature: unified-portfolio, Property 31: Mandatory Simulation Coverage', () => {
  describe('Simulation Requirements', () => {
    // Property 31.1: Spend operations always require simulation
    test('spend operations always require simulation when safety mode enabled', () => {
      fc.assert(
        fc.property(
          valueUsdGen,
          (valueUsd) => {
            const requirement = isSimulationRequired(
              { type: 'spend', valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.required).toBe(true);
            expect(requirement.operationType).toBe('spend');
            expect(requirement.reason).toContain('spend');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.2: Approve operations always require simulation
    test('approve operations always require simulation when safety mode enabled', () => {
      fc.assert(
        fc.property(
          valueUsdGen,
          (valueUsd) => {
            const requirement = isSimulationRequired(
              { type: 'approve', valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.required).toBe(true);
            expect(requirement.operationType).toBe('approve');
            expect(requirement.reason).toContain('approval');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.3: Revoke operations always require simulation
    test('revoke operations always require simulation when safety mode enabled', () => {
      fc.assert(
        fc.property(
          valueUsdGen,
          (valueUsd) => {
            const requirement = isSimulationRequired(
              { type: 'revoke', valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.required).toBe(true);
            expect(requirement.operationType).toBe('revoke');
            expect(requirement.reason).toContain('revoke');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.4: High-value transfers require simulation
    test('transfers over $100 require simulation', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 101, max: 100000, noNaN: true }),
          (valueUsd) => {
            const requirement = isSimulationRequired(
              { type: 'transfer', valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.required).toBe(true);
            expect(requirement.operationType).toBe('transfer');
            expect(requirement.reason).toContain('high-value');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.5: Low-value transfers do not require simulation
    test('transfers under $100 do not require simulation', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (valueUsd) => {
            const requirement = isSimulationRequired(
              { type: 'transfer', valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.required).toBe(false);
            expect(requirement.operationType).toBe('transfer');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Safety Mode Configuration', () => {
    // Property 31.6: Disabled safety mode does not require simulation
    test('disabled safety mode does not require simulation', () => {
      fc.assert(
        fc.property(
          operationTypeGen,
          valueUsdGen,
          (operationType, valueUsd) => {
            const config: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              enabled: false,
            };
            
            const requirement = isSimulationRequired(
              { type: operationType, valueUsd },
              config
            );
            
            expect(requirement.required).toBe(false);
            expect(requirement.reason).toContain('disabled');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.7: Individual simulation toggles work correctly
    test('individual simulation toggles disable specific requirements', () => {
      fc.assert(
        fc.property(
          valueUsdGen,
          (valueUsd) => {
            const configNoSpend: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              requireSimulationForSpend: false,
            };
            
            const configNoApprove: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              requireSimulationForApprove: false,
            };
            
            const configNoRevoke: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              requireSimulationForRevoke: false,
            };
            
            // Test spend simulation disabled
            const spendReq = isSimulationRequired(
              { type: 'spend', valueUsd },
              configNoSpend
            );
            expect(spendReq.required).toBe(false);
            
            // Test approve simulation disabled
            const approveReq = isSimulationRequired(
              { type: 'approve', valueUsd },
              configNoApprove
            );
            expect(approveReq.required).toBe(false);
            
            // Test revoke simulation disabled
            const revokeReq = isSimulationRequired(
              { type: 'revoke', valueUsd },
              configNoRevoke
            );
            expect(revokeReq.required).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Simulation Validation', () => {
    // Property 31.8: Operations requiring simulation fail without receipt
    test('operations requiring simulation fail validation without receipt', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spend', 'approve', 'revoke' as const),
          valueUsdGen,
          (operationType, valueUsd) => {
            const validation = validateSimulationPerformed(
              { type: operationType, valueUsd },
              undefined,
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(validation.valid).toBe(false);
            expect(validation.error).toBeDefined();
            expect(validation.error).toContain('Simulation required');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.9: Operations requiring simulation pass with receipt
    test('operations requiring simulation pass validation with receipt', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spend', 'approve', 'revoke' as const),
          valueUsdGen,
          fc.string({ minLength: 10, maxLength: 50 }),
          (operationType, valueUsd, receiptId) => {
            const validation = validateSimulationPerformed(
              { type: operationType, valueUsd },
              `sim_${receiptId}`,
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(validation.valid).toBe(true);
            expect(validation.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.10: Operations not requiring simulation pass without receipt
    test('operations not requiring simulation pass validation without receipt', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (valueUsd) => {
            const validation = validateSimulationPerformed(
              { type: 'transfer', valueUsd },
              undefined,
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(validation.valid).toBe(true);
            expect(validation.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.11: Disabled safety mode passes validation without receipt
    test('disabled safety mode passes validation without receipt', () => {
      fc.assert(
        fc.property(
          operationTypeGen,
          valueUsdGen,
          (operationType, valueUsd) => {
            const config: SafetyModeConfig = {
              ...DEFAULT_SAFETY_CONFIG,
              enabled: false,
            };
            
            const validation = validateSimulationPerformed(
              { type: operationType, valueUsd },
              undefined,
              config
            );
            
            expect(validation.valid).toBe(true);
            expect(validation.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Simulation Requirement Consistency', () => {
    // Property 31.12: Requirement and validation are consistent
    test('requirement and validation results are consistent', () => {
      fc.assert(
        fc.property(
          operationTypeGen,
          valueUsdGen,
          simulationReceiptIdGen,
          (operationType, valueUsd, receiptId) => {
            const requirement = isSimulationRequired(
              { type: operationType, valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            const validation = validateSimulationPerformed(
              { type: operationType, valueUsd },
              receiptId,
              DEFAULT_SAFETY_CONFIG
            );
            
            // If simulation is required and no receipt provided, validation should fail
            if (requirement.required && !receiptId) {
              expect(validation.valid).toBe(false);
            }
            
            // If simulation is not required, validation should pass regardless of receipt
            if (!requirement.required) {
              expect(validation.valid).toBe(true);
            }
            
            // If simulation is required and receipt is provided, validation should pass
            if (requirement.required && receiptId) {
              expect(validation.valid).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.13: All critical operations require simulation
    test('all critical operations (spend/approve/revoke) require simulation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('spend', 'approve', 'revoke' as const),
          valueUsdGen,
          (operationType, valueUsd) => {
            const requirement = isSimulationRequired(
              { type: operationType, valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            // All critical operations must require simulation
            expect(requirement.required).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.14: Simulation requirement includes operation type
    test('simulation requirement always includes operation type', () => {
      fc.assert(
        fc.property(
          operationTypeGen,
          valueUsdGen,
          (operationType, valueUsd) => {
            const requirement = isSimulationRequired(
              { type: operationType, valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.operationType).toBe(operationType);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 31.15: Simulation requirement includes reason
    test('simulation requirement always includes reason', () => {
      fc.assert(
        fc.property(
          operationTypeGen,
          valueUsdGen,
          (operationType, valueUsd) => {
            const requirement = isSimulationRequired(
              { type: operationType, valueUsd },
              DEFAULT_SAFETY_CONFIG
            );
            
            expect(requirement.reason).toBeDefined();
            expect(requirement.reason.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
