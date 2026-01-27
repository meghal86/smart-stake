import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

// Feature: unified-portfolio, Property 20: Copilot Output Validation
// Validates: Requirements 9.1, 9.6, 9.7

// Valid taxonomy objects that Copilot can output
type ValidTaxonomyObject = 
  | { type: 'Answer'; content: string }
  | { type: 'Observation'; content: string }
  | { type: 'Recommendation'; content: string }
  | { type: 'ActionCard'; id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low'; why: string[]; impactPreview: any; cta: any; walletScope: any }
  | { type: 'IntentPlan'; id: string; intent: string; steps: any[]; policy: any; simulation: any; impactPreview: any; walletScope: any }
  | { type: 'SimulationReceipt'; id: string; status: string; results: any }
  | { type: 'CapabilityNotice'; code: string; message: string };

// Generator for valid taxonomy objects
const validTaxonomyObjectArb = fc.oneof(
  fc.record({
    type: fc.constant('Answer' as const),
    content: fc.string({ minLength: 1, maxLength: 1000 })
  }),
  fc.record({
    type: fc.constant('Observation' as const),
    content: fc.string({ minLength: 1, maxLength: 1000 })
  }),
  fc.record({
    type: fc.constant('Recommendation' as const),
    content: fc.string({ minLength: 1, maxLength: 1000 })
  }),
  fc.record({
    type: fc.constant('ActionCard' as const),
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
    why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
    impactPreview: fc.record({
      riskDelta: fc.float({ min: -10, max: 10 }),
      preventedLossP50Usd: fc.nat({ max: 1000000 }),
      expectedGainUsd: fc.nat({ max: 1000000 }),
      gasEstimateUsd: fc.float({ min: 0, max: 1000 }),
      timeEstimateSec: fc.nat({ max: 3600 }),
      confidence: fc.float({ min: 0, max: 1 })
    }),
    cta: fc.record({
      label: fc.string({ minLength: 1 }),
      intent: fc.string({ minLength: 1 }),
      params: fc.dictionary(fc.string(), fc.anything())
    }),
    walletScope: fc.oneof(
      fc.record({
        mode: fc.constant('active_wallet' as const),
        address: fc.string({ minLength: 42, maxLength: 42 }).filter(s => s.startsWith('0x'))
      }),
      fc.record({
        mode: fc.constant('all_wallets' as const)
      })
    )
  }),
  fc.record({
    type: fc.constant('IntentPlan' as const),
    id: fc.string({ minLength: 1 }),
    intent: fc.string({ minLength: 1 }),
    steps: fc.array(fc.record({
      stepId: fc.string({ minLength: 1 }),
      kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
      chainId: fc.nat({ min: 1, max: 100000 }),
      target: fc.string({ minLength: 42, maxLength: 42 }).filter(s => s.startsWith('0x')),
      status: fc.constantFrom('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed')
    }), { minLength: 1, maxLength: 10 }),
    policy: fc.record({
      status: fc.constantFrom('allowed', 'blocked'),
      violations: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 })
    }),
    simulation: fc.record({
      status: fc.constantFrom('pass', 'warn', 'block'),
      receiptId: fc.string({ minLength: 1 })
    }),
    impactPreview: fc.record({
      gasEstimateUsd: fc.float({ min: 0, max: 1000 }),
      timeEstimateSec: fc.nat({ max: 3600 }),
      riskDelta: fc.float({ min: -10, max: 10 })
    }),
    walletScope: fc.oneof(
      fc.record({
        mode: fc.constant('active_wallet' as const),
        address: fc.string({ minLength: 42, maxLength: 42 }).filter(s => s.startsWith('0x'))
      }),
      fc.record({
        mode: fc.constant('all_wallets' as const)
      })
    )
  }),
  fc.record({
    type: fc.constant('SimulationReceipt' as const),
    id: fc.string({ minLength: 1 }),
    status: fc.constantFrom('success', 'warning', 'error'),
    results: fc.anything()
  }),
  fc.record({
    type: fc.constant('CapabilityNotice' as const),
    code: fc.string({ minLength: 1 }),
    message: fc.string({ minLength: 1 })
  })
);

// Generator for invalid taxonomy objects (wrong types, missing fields, etc.)
const invalidTaxonomyObjectArb = fc.oneof(
  // Invalid type
  fc.record({
    type: fc.string().filter(s => !['Answer', 'Observation', 'Recommendation', 'ActionCard', 'IntentPlan', 'SimulationReceipt', 'CapabilityNotice'].includes(s)),
    content: fc.string()
  }),
  // Missing required fields
  fc.record({
    type: fc.constant('ActionCard'),
    // Missing required fields like id, title, severity, etc.
    someField: fc.string()
  }),
  // Invalid severity values
  fc.record({
    type: fc.constant('ActionCard'),
    id: fc.string(),
    title: fc.string(),
    severity: fc.string().filter(s => !['critical', 'high', 'medium', 'low'].includes(s)),
    why: fc.array(fc.string()),
    impactPreview: fc.anything(),
    cta: fc.anything(),
    walletScope: fc.anything()
  }),
  // Invalid walletScope mode
  fc.record({
    type: fc.constant('IntentPlan'),
    id: fc.string(),
    intent: fc.string(),
    steps: fc.array(fc.anything()),
    policy: fc.anything(),
    simulation: fc.anything(),
    impactPreview: fc.anything(),
    walletScope: fc.record({
      mode: fc.string().filter(s => !['active_wallet', 'all_wallets'].includes(s))
    })
  })
);

// Mock Copilot output validator
function validateCopilotOutput(output: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!output || typeof output !== 'object') {
    errors.push('Output must be an object');
    return { isValid: false, errors };
  }
  
  const validTypes = ['Answer', 'Observation', 'Recommendation', 'ActionCard', 'IntentPlan', 'SimulationReceipt', 'CapabilityNotice'];
  if (!validTypes.includes(output.type)) {
    errors.push(`Invalid type: ${output.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate ActionCard schema
  if (output.type === 'ActionCard') {
    if (!output.id || typeof output.id !== 'string') {
      errors.push('ActionCard must have a string id');
    }
    if (!output.title || typeof output.title !== 'string') {
      errors.push('ActionCard must have a string title');
    }
    if (!['critical', 'high', 'medium', 'low'].includes(output.severity)) {
      errors.push('ActionCard severity must be critical, high, medium, or low');
    }
    if (!Array.isArray(output.why)) {
      errors.push('ActionCard why must be an array');
    }
    if (!output.impactPreview || typeof output.impactPreview !== 'object') {
      errors.push('ActionCard must have impactPreview object');
    }
    if (!output.cta || typeof output.cta !== 'object') {
      errors.push('ActionCard must have cta object');
    }
    if (!output.walletScope || typeof output.walletScope !== 'object') {
      errors.push('ActionCard must have walletScope object');
    }
    if (output.walletScope && !['active_wallet', 'all_wallets'].includes(output.walletScope.mode)) {
      errors.push('ActionCard walletScope.mode must be active_wallet or all_wallets');
    }
  }
  
  // Validate IntentPlan schema
  if (output.type === 'IntentPlan') {
    if (!output.id || typeof output.id !== 'string') {
      errors.push('IntentPlan must have a string id');
    }
    if (!output.intent || typeof output.intent !== 'string') {
      errors.push('IntentPlan must have a string intent');
    }
    if (!Array.isArray(output.steps)) {
      errors.push('IntentPlan steps must be an array');
    }
    if (!output.policy || typeof output.policy !== 'object') {
      errors.push('IntentPlan must have policy object');
    }
    if (output.policy && !['allowed', 'blocked'].includes(output.policy.status)) {
      errors.push('IntentPlan policy.status must be allowed or blocked');
    }
    if (!output.simulation || typeof output.simulation !== 'object') {
      errors.push('IntentPlan must have simulation object');
    }
    if (output.simulation && !['pass', 'warn', 'block'].includes(output.simulation.status)) {
      errors.push('IntentPlan simulation.status must be pass, warn, or block');
    }
    if (!output.walletScope || typeof output.walletScope !== 'object') {
      errors.push('IntentPlan must have walletScope object');
    }
    if (output.walletScope && !['active_wallet', 'all_wallets'].includes(output.walletScope.mode)) {
      errors.push('IntentPlan walletScope.mode must be active_wallet or all_wallets');
    }
  }
  
  // Validate CapabilityNotice schema
  if (output.type === 'CapabilityNotice') {
    if (!output.code || typeof output.code !== 'string') {
      errors.push('CapabilityNotice must have a string code');
    }
    if (!output.message || typeof output.message !== 'string') {
      errors.push('CapabilityNotice must have a string message');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

describe('Feature: unified-portfolio, Property 20: Copilot Output Validation', () => {
  test('valid taxonomy objects should pass validation', () => {
    fc.assert(
      fc.property(
        validTaxonomyObjectArb,
        (taxonomyObject) => {
          const result = validateCopilotOutput(taxonomyObject);
          
          // Property: All valid taxonomy objects should pass validation
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('invalid taxonomy objects should fail validation', () => {
    fc.assert(
      fc.property(
        invalidTaxonomyObjectArb,
        (invalidObject) => {
          const result = validateCopilotOutput(invalidObject);
          
          // Property: All invalid taxonomy objects should fail validation
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('ActionCard objects must conform to schema constraints', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constant('ActionCard'),
          id: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
          why: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          impactPreview: fc.record({
            riskDelta: fc.float(),
            preventedLossP50Usd: fc.nat(),
            expectedGainUsd: fc.nat(),
            gasEstimateUsd: fc.float({ min: 0 }),
            timeEstimateSec: fc.nat(),
            confidence: fc.float({ min: 0, max: 1 })
          }),
          cta: fc.record({
            label: fc.string({ minLength: 1 }),
            intent: fc.string({ minLength: 1 }),
            params: fc.dictionary(fc.string(), fc.anything())
          }),
          walletScope: fc.oneof(
            fc.record({
              mode: fc.constant('active_wallet' as const),
              address: fc.string({ minLength: 42, maxLength: 42 }).filter(s => s.startsWith('0x'))
            }),
            fc.record({
              mode: fc.constant('all_wallets' as const)
            })
          )
        }),
        (actionCard) => {
          const result = validateCopilotOutput(actionCard);
          
          // Property: Valid ActionCard objects should pass validation
          expect(result.isValid).toBe(true);
          
          // Property: ActionCard must have required fields
          expect(actionCard.id).toBeDefined();
          expect(actionCard.title).toBeDefined();
          expect(['critical', 'high', 'medium', 'low']).toContain(actionCard.severity);
          expect(Array.isArray(actionCard.why)).toBe(true);
          expect(actionCard.impactPreview).toBeDefined();
          expect(actionCard.cta).toBeDefined();
          expect(actionCard.walletScope).toBeDefined();
          expect(['active_wallet', 'all_wallets']).toContain(actionCard.walletScope.mode);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('IntentPlan objects must conform to schema constraints', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constant('IntentPlan'),
          id: fc.string({ minLength: 1, maxLength: 20 }),
          intent: fc.string({ minLength: 1, maxLength: 50 }),
          steps: fc.array(fc.record({
            stepId: fc.string({ minLength: 1, maxLength: 10 }),
            kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
            chainId: fc.nat({ min: 1, max: 1000 }),
            target: fc.constant('0x1234567890123456789012345678901234567890'),
            status: fc.constantFrom('pending', 'ready')
          }), { minLength: 1, maxLength: 3 }),
          policy: fc.record({
            status: fc.constantFrom('allowed', 'blocked'),
            violations: fc.array(fc.string({ maxLength: 20 }), { maxLength: 2 })
          }),
          simulation: fc.record({
            status: fc.constantFrom('pass', 'warn', 'block'),
            receiptId: fc.string({ minLength: 1, maxLength: 20 })
          }),
          impactPreview: fc.record({
            gasEstimateUsd: fc.float({ min: 0, max: 100 }),
            timeEstimateSec: fc.nat({ max: 300 }),
            riskDelta: fc.float({ min: -5, max: 5 })
          }),
          walletScope: fc.oneof(
            fc.record({
              mode: fc.constant('active_wallet' as const),
              address: fc.constant('0x1234567890123456789012345678901234567890' as const)
            }),
            fc.record({
              mode: fc.constant('all_wallets' as const)
            })
          )
        }),
        (intentPlan) => {
          const result = validateCopilotOutput(intentPlan);
          
          // Property: Valid IntentPlan objects should pass validation
          expect(result.isValid).toBe(true);
          
          // Property: IntentPlan must have required fields
          expect(intentPlan.id).toBeDefined();
          expect(intentPlan.intent).toBeDefined();
          expect(Array.isArray(intentPlan.steps)).toBe(true);
          expect(intentPlan.steps.length).toBeGreaterThan(0);
          expect(intentPlan.policy).toBeDefined();
          expect(['allowed', 'blocked']).toContain(intentPlan.policy.status);
          expect(intentPlan.simulation).toBeDefined();
          expect(['pass', 'warn', 'block']).toContain(intentPlan.simulation.status);
          expect(intentPlan.walletScope).toBeDefined();
          expect(['active_wallet', 'all_wallets']).toContain(intentPlan.walletScope.mode);
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });
  
  test('non-conforming outputs should be rejected with CapabilityNotice', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(), // Plain string instead of object
          fc.nat(), // Number instead of object
          fc.array(fc.anything()), // Array instead of object
          fc.record({
            type: fc.string().filter(s => !['Answer', 'Observation', 'Recommendation', 'ActionCard', 'IntentPlan', 'SimulationReceipt', 'CapabilityNotice'].includes(s)),
            data: fc.anything()
          }) // Invalid type
        ),
        (invalidOutput) => {
          const result = validateCopilotOutput(invalidOutput);
          
          // Property: Non-conforming outputs should be rejected
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // In a real system, this would trigger a CapabilityNotice response
          const capabilityNotice = {
            type: 'CapabilityNotice',
            code: 'INVALID_SCHEMA',
            message: "I can't execute this; missing plan schema"
          };
          
          const noticeResult = validateCopilotOutput(capabilityNotice);
          expect(noticeResult.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});