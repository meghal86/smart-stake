import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

// Feature: unified-portfolio, Property 21: Copilot Action Verb Handling
// Validates: Requirements 9.2

// Action verbs that should trigger ActionCard or IntentPlan
const actionVerbs = [
  'revoke', 'approve', 'swap', 'transfer', 'execute', 'cancel', 'claim',
  'stake', 'unstake', 'withdraw', 'deposit', 'bridge', 'migrate',
  'harvest', 'compound', 'rebalance', 'liquidate', 'hedge'
];

// Non-action verbs that should not trigger ActionCard or IntentPlan
const nonActionVerbs = [
  'show', 'display', 'view', 'check', 'analyze', 'explain', 'describe',
  'list', 'summarize', 'calculate', 'estimate', 'predict', 'forecast',
  'monitor', 'track', 'observe', 'report', 'notify'
];

// Generator for responses containing action verbs
const responseWithActionVerbArb = fc.record({
  text: fc.string().chain(baseText => 
    fc.constantFrom(...actionVerbs).map(verb => 
      `${baseText} Please ${verb} the token approval for better security.`
    )
  ),
  containsActionVerb: fc.constant(true)
});

// Generator for responses without action verbs
const responseWithoutActionVerbArb = fc.record({
  text: fc.string().chain(baseText => 
    fc.constantFrom(...nonActionVerbs).map(verb => 
      `${baseText} I can ${verb} your portfolio data for you.`
    )
  ),
  containsActionVerb: fc.constant(false)
});

// Generator for ActionCard objects
const actionCardArb = fc.record({
  type: fc.constant('ActionCard' as const),
  id: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
  why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
  impactPreview: fc.record({
    riskDelta: fc.float({ min: -5, max: 5 }),
    preventedLossP50Usd: fc.nat({ max: 100000 }),
    expectedGainUsd: fc.nat({ max: 100000 }),
    gasEstimateUsd: fc.float({ min: 0, max: 100 }),
    timeEstimateSec: fc.nat({ max: 300 }),
    confidence: fc.float({ min: 0.5, max: 1 })
  }),
  cta: fc.record({
    label: fc.string({ minLength: 1 }),
    intent: fc.string({ minLength: 1 }),
    params: fc.dictionary(fc.string(), fc.string())
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
});

// Generator for IntentPlan objects
const intentPlanArb = fc.record({
  type: fc.constant('IntentPlan' as const),
  id: fc.string({ minLength: 1 }),
  intent: fc.string({ minLength: 1 }),
  steps: fc.array(fc.record({
    stepId: fc.string({ minLength: 1 }),
    kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
    chainId: fc.nat({ min: 1, max: 1000 }),
    target: fc.constant('0x1234567890123456789012345678901234567890'),
    status: fc.constantFrom('pending', 'ready')
  }), { minLength: 1, maxLength: 3 }),
  policy: fc.record({
    status: fc.constantFrom('allowed', 'blocked'),
    violations: fc.array(fc.string(), { maxLength: 2 })
  }),
  simulation: fc.record({
    status: fc.constantFrom('pass', 'warn', 'block'),
    receiptId: fc.string({ minLength: 1 })
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
});

// Mock function to detect action verbs in text
function containsActionVerb(text: string): boolean {
  const lowerText = text.toLowerCase();
  return actionVerbs.some(verb => lowerText.includes(verb));
}

// Mock function to validate Copilot response structure
function validateCopilotResponse(response: any): { 
  hasActionVerb: boolean; 
  hasActionCard: boolean; 
  hasIntentPlan: boolean; 
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!response || typeof response !== 'object') {
    errors.push('Response must be an object');
    return { hasActionVerb: false, hasActionCard: false, hasIntentPlan: false, isValid: false, errors };
  }
  
  const hasActionVerb = response.text ? containsActionVerb(response.text) : false;
  const hasActionCard = !!(response.actionCard && response.actionCard.type === 'ActionCard');
  const hasIntentPlan = !!(response.intentPlan && response.intentPlan.type === 'IntentPlan');
  
  // Requirement 9.2: When response includes action verbs, THE Copilot SHALL include ActionCard or IntentPlan
  if (hasActionVerb && !hasActionCard && !hasIntentPlan) {
    errors.push('Response contains action verb but missing ActionCard or IntentPlan');
  }
  
  // Validate ActionCard structure if present
  if (hasActionCard) {
    const actionCard = response.actionCard;
    if (!actionCard.id || !actionCard.title || !actionCard.severity || !actionCard.cta) {
      errors.push('ActionCard missing required fields');
    }
    if (!['critical', 'high', 'medium', 'low'].includes(actionCard.severity)) {
      errors.push('ActionCard has invalid severity');
    }
  }
  
  // Validate IntentPlan structure if present
  if (hasIntentPlan) {
    const intentPlan = response.intentPlan;
    if (!intentPlan.id || !intentPlan.intent || !Array.isArray(intentPlan.steps)) {
      errors.push('IntentPlan missing required fields');
    }
    if (intentPlan.steps && intentPlan.steps.length === 0) {
      errors.push('IntentPlan must have at least one step');
    }
  }
  
  return {
    hasActionVerb,
    hasActionCard,
    hasIntentPlan,
    isValid: errors.length === 0,
    errors
  };
}

describe('Feature: unified-portfolio, Property 21: Copilot Action Verb Handling', () => {
  test('responses with action verbs must include ActionCard or IntentPlan', () => {
    fc.assert(
      fc.property(
        responseWithActionVerbArb,
        fc.oneof(actionCardArb, intentPlanArb),
        (response, actionObject) => {
          const copilotResponse = {
            text: response.text,
            [actionObject.type === 'ActionCard' ? 'actionCard' : 'intentPlan']: actionObject
          };
          
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: Responses with action verbs must include ActionCard or IntentPlan
          expect(validation.hasActionVerb).toBe(true);
          expect(validation.hasActionCard || validation.hasIntentPlan).toBe(true);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('responses without action verbs may omit ActionCard and IntentPlan', () => {
    fc.assert(
      fc.property(
        responseWithoutActionVerbArb,
        (response) => {
          const copilotResponse = {
            text: response.text
            // No ActionCard or IntentPlan
          };
          
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: Responses without action verbs don't require ActionCard or IntentPlan
          expect(validation.hasActionVerb).toBe(false);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('ActionCard objects must be well-formed when included', () => {
    fc.assert(
      fc.property(
        responseWithActionVerbArb,
        actionCardArb,
        (response, actionCard) => {
          const copilotResponse = {
            text: response.text,
            actionCard: actionCard
          };
          
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: ActionCard objects must be well-formed
          expect(validation.hasActionCard).toBe(true);
          expect(validation.isValid).toBe(true);
          
          // Verify ActionCard structure
          expect(actionCard.type).toBe('ActionCard');
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
  
  test('IntentPlan objects must be well-formed when included', () => {
    fc.assert(
      fc.property(
        responseWithActionVerbArb,
        intentPlanArb,
        (response, intentPlan) => {
          const copilotResponse = {
            text: response.text,
            intentPlan: intentPlan
          };
          
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: IntentPlan objects must be well-formed
          expect(validation.hasIntentPlan).toBe(true);
          expect(validation.isValid).toBe(true);
          
          // Verify IntentPlan structure
          expect(intentPlan.type).toBe('IntentPlan');
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
      { numRuns: 100 }
    );
  });
  
  test('responses with action verbs but missing ActionCard/IntentPlan should be invalid', () => {
    fc.assert(
      fc.property(
        responseWithActionVerbArb,
        (response) => {
          const copilotResponse = {
            text: response.text
            // Missing ActionCard or IntentPlan despite having action verb
          };
          
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: Action verb responses without ActionCard/IntentPlan should be invalid
          expect(validation.hasActionVerb).toBe(true);
          expect(validation.hasActionCard).toBe(false);
          expect(validation.hasIntentPlan).toBe(false);
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain('Response contains action verb but missing ActionCard or IntentPlan');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('specific action verbs are correctly detected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...actionVerbs),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (verb, prefix, suffix) => {
          const text = `${prefix} ${verb} ${suffix}`;
          
          // Property: All defined action verbs should be detected
          expect(containsActionVerb(text)).toBe(true);
          
          // Property: Action verb detection should be case-insensitive
          const upperText = `${prefix} ${verb.toUpperCase()} ${suffix}`;
          expect(containsActionVerb(upperText)).toBe(true);
          
          const mixedText = `${prefix} ${verb.charAt(0).toUpperCase() + verb.slice(1)} ${suffix}`;
          expect(containsActionVerb(mixedText)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('non-action verbs should not trigger ActionCard/IntentPlan requirement', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...nonActionVerbs),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (verb, prefix, suffix) => {
          const text = `${prefix} ${verb} ${suffix}`;
          
          // Property: Non-action verbs should not be detected as action verbs
          expect(containsActionVerb(text)).toBe(false);
          
          const copilotResponse = { text };
          const validation = validateCopilotResponse(copilotResponse);
          
          // Property: Responses with only non-action verbs should be valid without ActionCard/IntentPlan
          expect(validation.hasActionVerb).toBe(false);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});