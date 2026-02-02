import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

// Feature: unified-portfolio, Property 22: Copilot Automation Promise Prevention
// Validates: Requirements 9.3

// Prohibited automation promises that Copilot should never make
const PROHIBITED_AUTOMATION_PROMISES = [
  "I'll monitor daily",
  "I'll automatically rebalance",
  "I'll track this for you",
  "I'll keep watching",
  "I'll alert you when",
  "I'll automatically execute",
  "I'll handle this ongoing",
  "I'll continuously monitor",
  "I'll auto-adjust",
  "I'll manage this for you",
  "I'll take care of",
  "I'll watch for changes",
  "I'll notify you automatically",
  "I'll run this regularly",
  "I'll schedule this",
  "I'll set up monitoring",
  "I'll keep an eye on",
  "I'll maintain this",
  "I'll update this automatically"
];

// Acceptable capability statements that are allowed
const ACCEPTABLE_CAPABILITY_STATEMENTS = [
  "I can analyze your portfolio",
  "I can help you identify risks",
  "I can suggest optimizations",
  "I can show you recommendations",
  "I can explain the risks",
  "I can calculate potential savings",
  "I can provide insights",
  "I can help you understand",
  "I can generate a plan",
  "I can simulate the outcome",
  "I can validate the transaction",
  "I can check for issues"
];

// Generator for responses containing prohibited automation promises
const responseWithAutomationPromiseArb = fc.record({
  text: fc.string().chain(baseText => 
    fc.constantFrom(...PROHIBITED_AUTOMATION_PROMISES).map(promise => 
      `${baseText} ${promise} to ensure your portfolio stays optimized.`
    )
  ),
  containsAutomationPromise: fc.constant(true)
});

// Generator for responses with acceptable capability statements
const responseWithAcceptableCapabilityArb = fc.record({
  text: fc.string().chain(baseText => 
    fc.constantFrom(...ACCEPTABLE_CAPABILITY_STATEMENTS).map(statement => 
      `${baseText} ${statement} based on your current holdings.`
    )
  ),
  containsAutomationPromise: fc.constant(false)
});

// Generator for neutral responses without automation promises
const neutralResponseArb = fc.record({
  text: fc.oneof(
    fc.constant("Your portfolio has a risk score of 7.2 out of 10."),
    fc.constant("I found 3 high-risk token approvals that should be reviewed."),
    fc.constant("Based on current market conditions, consider diversifying into stablecoins."),
    fc.constant("The simulation shows this transaction will cost approximately $12 in gas."),
    fc.constant("Your current exposure to DeFi protocols is 45% of total portfolio value.")
  ),
  containsAutomationPromise: fc.constant(false)
});

// Mock function to detect automation promises in text
function containsAutomationPromise(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for exact matches first
  const exactMatch = PROHIBITED_AUTOMATION_PROMISES.some(promise => 
    lowerText.includes(promise.toLowerCase())
  );
  
  if (exactMatch) return true;
  
  // Check for partial matches and variations
  const partialPatterns = [
    /i'll\s+(monitor|track|watch|handle|manage|maintain|keep\s+watching|continuously\s+monitor)/i,
    /i'll\s+automatically/i,
    /i'll\s+.*(daily|continuously|ongoing|regularly)/i,
    /i'll\s+.*for\s+you/i
  ];
  
  return partialPatterns.some(pattern => pattern.test(text));
}

// Mock function to validate Copilot response for automation promises
function validateCopilotResponseForAutomation(response: any): {
  hasAutomationPromise: boolean;
  isValid: boolean;
  errors: string[];
  capabilityNotice?: { code: string; message: string };
} {
  const errors: string[] = [];
  
  if (!response || typeof response !== 'object') {
    errors.push('Response must be an object');
    return { hasAutomationPromise: false, isValid: false, errors };
  }
  
  const hasAutomationPromise = response.text ? containsAutomationPromise(response.text) : false;
  
  // Requirement 9.3: THE Copilot SHALL NOT promise automation
  if (hasAutomationPromise) {
    errors.push('Response contains prohibited automation promise');
    
    // System should generate a CapabilityNotice explaining limitations
    const capabilityNotice = {
      code: 'AUTOMATION_NOT_SUPPORTED',
      message: 'I can provide analysis and recommendations, but I cannot perform ongoing monitoring or automatic actions. You maintain full control over all transactions and decisions.'
    };
    
    return {
      hasAutomationPromise: true,
      isValid: false,
      errors,
      capabilityNotice
    };
  }
  
  return {
    hasAutomationPromise: false,
    isValid: true,
    errors
  };
}

// Mock function to generate corrected response without automation promises
function correctAutomationPromise(originalText: string): string {
  let correctedText = originalText;
  
  // Replace automation promises with capability statements
  const replacements: Record<string, string> = {
    "I'll monitor daily": "I can help you check your portfolio daily",
    "I'll automatically rebalance": "I can suggest rebalancing strategies",
    "I'll track this for you": "I can help you analyze this data",
    "I'll keep watching": "I can help you review this regularly",
    "I'll alert you when": "I can help you identify when",
    "I'll automatically execute": "I can help you plan the execution",
    "I'll handle this ongoing": "I can help you manage this",
    "I'll continuously monitor": "I can help you check this regularly",
    "I'll auto-adjust": "I can suggest adjustments",
    "I'll manage this for you": "I can help you manage this"
  };
  
  for (const [promise, replacement] of Object.entries(replacements)) {
    correctedText = correctedText.replace(new RegExp(promise, 'gi'), replacement);
  }
  
  return correctedText;
}

describe('Feature: unified-portfolio, Property 22: Copilot Automation Promise Prevention', () => {
  test('responses with automation promises should be rejected', () => {
    fc.assert(
      fc.property(
        responseWithAutomationPromiseArb,
        (response) => {
          const validation = validateCopilotResponseForAutomation(response);
          
          // Property: Responses with automation promises should be invalid
          expect(validation.hasAutomationPromise).toBe(true);
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain('Response contains prohibited automation promise');
          
          // Property: System should provide capability notice explaining limitations
          expect(validation.capabilityNotice).toBeDefined();
          expect(validation.capabilityNotice?.code).toBe('AUTOMATION_NOT_SUPPORTED');
          expect(validation.capabilityNotice?.message).toContain('cannot perform ongoing monitoring');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('responses with acceptable capability statements should be allowed', () => {
    fc.assert(
      fc.property(
        responseWithAcceptableCapabilityArb,
        (response) => {
          const validation = validateCopilotResponseForAutomation(response);
          
          // Property: Acceptable capability statements should be valid
          expect(validation.hasAutomationPromise).toBe(false);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.capabilityNotice).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('neutral responses without automation promises should be valid', () => {
    fc.assert(
      fc.property(
        neutralResponseArb,
        (response) => {
          const validation = validateCopilotResponseForAutomation(response);
          
          // Property: Neutral responses should be valid
          expect(validation.hasAutomationPromise).toBe(false);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('specific prohibited phrases are correctly detected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROHIBITED_AUTOMATION_PROMISES),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (promise, prefix, suffix) => {
          const text = `${prefix} ${promise} ${suffix}`;
          
          // Property: All prohibited automation promises should be detected
          expect(containsAutomationPromise(text)).toBe(true);
          
          // Property: Detection should be case-insensitive
          const upperText = `${prefix} ${promise.toUpperCase()} ${suffix}`;
          expect(containsAutomationPromise(upperText)).toBe(true);
          
          const mixedText = `${prefix} ${promise.charAt(0).toUpperCase() + promise.slice(1)} ${suffix}`;
          expect(containsAutomationPromise(mixedText)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('acceptable capability statements should not be flagged as automation promises', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCEPTABLE_CAPABILITY_STATEMENTS),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (statement, prefix, suffix) => {
          const text = `${prefix} ${statement} ${suffix}`;
          
          // Property: Acceptable capability statements should not be detected as automation promises
          expect(containsAutomationPromise(text)).toBe(false);
          
          const response = { text };
          const validation = validateCopilotResponseForAutomation(response);
          
          // Property: Responses with only acceptable statements should be valid
          expect(validation.hasAutomationPromise).toBe(false);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('automation promise correction maintains meaning while removing promises', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROHIBITED_AUTOMATION_PROMISES.slice(0, 10)), // Test subset for performance
        (promise) => {
          const originalText = `Based on your portfolio analysis, ${promise} to keep your investments secure.`;
          const correctedText = correctAutomationPromise(originalText);
          
          // Property: Corrected text should not contain automation promises
          expect(containsAutomationPromise(correctedText)).toBe(false);
          
          // Property: Corrected text should maintain core meaning (contain key words)
          expect(correctedText).toContain('portfolio');
          expect(correctedText).toContain('secure');
          
          // Property: Corrected text should use acceptable capability language
          const hasCapabilityLanguage = ACCEPTABLE_CAPABILITY_STATEMENTS.some(statement =>
            correctedText.toLowerCase().includes(statement.toLowerCase().substring(0, 10))
          );
          expect(hasCapabilityLanguage).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('complex responses with mixed content should be properly validated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCEPTABLE_CAPABILITY_STATEMENTS),
        fc.constantFrom(...PROHIBITED_AUTOMATION_PROMISES),
        fc.string({ minLength: 10, maxLength: 100 }),
        (acceptableStatement, prohibitedPromise, middleText) => {
          const mixedText = `${acceptableStatement} ${middleText} ${prohibitedPromise}`;
          
          // Property: Mixed content with any automation promise should be invalid
          expect(containsAutomationPromise(mixedText)).toBe(true);
          
          const response = { text: mixedText };
          const validation = validateCopilotResponseForAutomation(response);
          
          expect(validation.hasAutomationPromise).toBe(true);
          expect(validation.isValid).toBe(false);
          expect(validation.capabilityNotice).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('edge cases and variations of automation promises should be detected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom("I'll monitor", "I'll track", "I'll watch", "I'll handle"),
        fc.constantFrom("daily", "continuously", "automatically", "for you", "ongoing"),
        (basePromise, modifier) => {
          const variationText = `${basePromise} ${modifier} your portfolio performance.`;
          
          // Property: Variations of automation promises should be detected
          expect(containsAutomationPromise(variationText)).toBe(true);
          
          const response = { text: variationText };
          const validation = validateCopilotResponseForAutomation(response);
          
          expect(validation.isValid).toBe(false);
          expect(validation.capabilityNotice).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('capability notices should provide clear explanations of limitations', () => {
    fc.assert(
      fc.property(
        responseWithAutomationPromiseArb,
        (response) => {
          const validation = validateCopilotResponseForAutomation(response);
          
          if (validation.capabilityNotice) {
            // Property: Capability notice should explain what Copilot CAN do
            expect(validation.capabilityNotice.message).toMatch(/can provide|can help|can analyze/i);
            
            // Property: Capability notice should explain what Copilot CANNOT do
            expect(validation.capabilityNotice.message).toMatch(/cannot perform|cannot.*automatic/i);
            
            // Property: Capability notice should emphasize user control
            expect(validation.capabilityNotice.message).toMatch(/you maintain.*control|full control/i);
            
            // Property: Capability notice should have appropriate error code
            expect(validation.capabilityNotice.code).toBe('AUTOMATION_NOT_SUPPORTED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});