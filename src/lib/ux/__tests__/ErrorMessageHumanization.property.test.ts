/**
 * Property-Based Tests for Error Message Humanization
 * Feature: ux-gap-requirements, Property 8: Error Message Humanization
 * Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errorMessages';

// Generator for error codes that should exist in ERROR_MESSAGES
const errorCodeArb = fc.constantFrom(
  ...Object.keys(ERROR_MESSAGES)
) as fc.Arbitrary<keyof typeof ERROR_MESSAGES>;

// Generator for various error scenarios
const errorScenarioArb = fc.record({
  code: errorCodeArb,
  context: fc.record({
    component: fc.constantFrom('wallet', 'api', 'navigation', 'data', 'network'),
    action: fc.constantFrom('connect', 'fetch', 'navigate', 'load', 'submit'),
    severity: fc.constantFrom('low', 'medium', 'high', 'critical')
  })
});

// Generator for technical error messages (what we want to avoid)
const technicalErrorArb = fc.oneof(
  fc.constant('Error 500: Internal Server Error'),
  fc.constant('TypeError: Cannot read property of undefined'),
  fc.constant('Network request failed with status 404'),
  fc.constant('Uncaught ReferenceError: variable is not defined'),
  fc.constant('CORS policy: No Access-Control-Allow-Origin header'),
  fc.constant('Failed to fetch'),
  fc.constant('Connection timeout'),
  fc.constant('Invalid JSON response')
);

describe('Error Message Humanization - Property Tests', () => {
  /**
   * Property 8: Error Message Humanization
   * For any error condition, the displayed message must use encouraging, 
   * human-friendly language rather than technical jargon
   * Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES
   */
  it('Property 8: All error messages are human-friendly and encouraging', () => {
    fc.assert(
      fc.property(
        errorScenarioArb,
        (scenario) => {
          const message = ERROR_MESSAGES[scenario.code];
          
          // Property 1: Messages should not contain technical jargon
          const technicalTerms = [
            'error', 'exception', 'null', 'undefined', 'timeout', 'cors',
            'xhr', 'fetch', 'promise', 'async', 'callback', 'stack trace',
            'internal server error', '500', '404', '403', '401', 'status code'
          ];
          
          const lowerMessage = message.toLowerCase();
          const containsTechnicalTerms = technicalTerms.some(term => 
            lowerMessage.includes(term.toLowerCase())
          );
          
          // Allow some technical terms if they're in user-friendly context
          const allowedTechnicalContexts = [
            'please try again',
            'check your connection',
            'refresh the page'
          ];
          
          const hasUserFriendlyContext = allowedTechnicalContexts.some(context =>
            lowerMessage.includes(context)
          );
          
          if (containsTechnicalTerms && !hasUserFriendlyContext) {
            // Only fail if it's purely technical without friendly guidance
            const purelyTechnical = technicalTerms.filter(term => 
              lowerMessage.includes(term.toLowerCase()) && 
              !lowerMessage.includes('please') && 
              !lowerMessage.includes('try') &&
              !lowerMessage.includes('check')
            );
            expect(purelyTechnical.length).toBe(0);
          }
          
          // Property 2: Messages should be encouraging/positive
          const encouragingWords = [
            'please', 'try', 'again', 'refresh', 'check', 'reconnect',
            'moment', 'later', 'available', 'temporarily'
          ];
          
          const hasEncouragingTone = encouragingWords.some(word =>
            lowerMessage.includes(word)
          );
          
          expect(hasEncouragingTone).toBe(true);
          
          // Property 3: Messages should provide actionable guidance
          const actionableWords = [
            'try again', 'refresh', 'check', 'reconnect', 'install',
            'switch', 'wait', 'contact', 'retry'
          ];
          
          const hasActionableGuidance = actionableWords.some(action =>
            lowerMessage.includes(action)
          );
          
          expect(hasActionableGuidance).toBe(true);
          
          // Property 4: Messages should not be empty or too short
          expect(message.length).toBeGreaterThan(10);
          
          // Property 5: Messages should not end with technical codes
          expect(message).not.toMatch(/\d{3}$/); // No HTTP status codes at end
          expect(message).not.toMatch(/error$/i); // No ending with "error"
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error messages avoid negative/discouraging language
   */
  it('Property: Error messages avoid negative or discouraging language', () => {
    fc.assert(
      fc.property(
        errorCodeArb,
        (errorCode) => {
          const message = ERROR_MESSAGES[errorCode];
          
          // Avoid overly negative words
          const negativeWords = [
            'failed', 'broken', 'crashed', 'dead', 'impossible',
            'never', 'can\'t', 'won\'t', 'unable', 'invalid'
          ];
          
          const lowerMessage = message.toLowerCase();
          
          // Count negative words, but allow some if balanced with positive guidance
          const negativeCount = negativeWords.filter(word => 
            lowerMessage.includes(word)
          ).length;
          
          const positiveWords = [
            'please', 'try', 'again', 'help', 'support', 'available',
            'moment', 'refresh', 'reconnect', 'check'
          ];
          
          const positiveCount = positiveWords.filter(word =>
            lowerMessage.includes(word)
          ).length;
          
          // If there are negative words, there should be at least as many positive ones
          if (negativeCount > 0) {
            expect(positiveCount).toBeGreaterThanOrEqual(negativeCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getErrorMessage function always returns human-friendly messages
   */
  it('Property: getErrorMessage function humanizes any error code', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          errorCodeArb,
          fc.string({ minLength: 1, maxLength: 50 }) // Random strings for unknown codes
        ),
        (errorCode) => {
          const message = getErrorMessage(errorCode);
          
          // Should always return a string
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should not return technical error codes
          expect(message).not.toMatch(/^[A-Z_]+$/); // Not just constant names
          expect(message).not.toMatch(/^\d+$/); // Not just numbers
          
          // Should be human readable (contains spaces and common words)
          expect(message).toMatch(/\s/); // Contains spaces
          expect(message.length).toBeGreaterThan(5); // Reasonable length
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error messages provide clear next steps
   */
  it('Property: Error messages provide clear next steps or recovery actions', () => {
    fc.assert(
      fc.property(
        errorCodeArb,
        (errorCode) => {
          const message = ERROR_MESSAGES[errorCode];
          
          // Should contain actionable language
          const actionPatterns = [
            /please\s+\w+/i,           // "please try", "please check"
            /try\s+\w+/i,              // "try again", "try refreshing"
            /check\s+\w+/i,            // "check your", "check the"
            /refresh\s+\w+/i,          // "refresh the", "refresh page"
            /reconnect/i,              // "reconnect"
            /contact\s+\w+/i,          // "contact support"
            /wait\s+\w+/i,             // "wait a moment"
            /install\s+\w+/i,          // "install a"
            /switch\s+\w+/i            // "switch to"
          ];
          
          const hasActionablePattern = actionPatterns.some(pattern =>
            pattern.test(message)
          );
          
          expect(hasActionablePattern).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Technical errors are transformed into human-friendly messages
   */
  it('Property: Technical error messages are humanized when processed', () => {
    fc.assert(
      fc.property(
        technicalErrorArb,
        (technicalError) => {
          // Simulate how we would humanize a technical error
          const humanizedMessage = humanizeError(technicalError);
          
          // Should not contain raw technical terms
          expect(humanizedMessage).not.toMatch(/\d{3}/); // No HTTP codes
          expect(humanizedMessage).not.toMatch(/TypeError|ReferenceError|SyntaxError/);
          expect(humanizedMessage).not.toMatch(/CORS|XMLHttpRequest|fetch/);
          
          // Should contain encouraging language
          expect(humanizedMessage).toMatch(/please|try|check|refresh|moment/i);
          
          // Should be longer than the technical error (more explanatory)
          expect(humanizedMessage.length).toBeGreaterThan(20);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Helper function to humanize technical error messages
 * This simulates the error processing that should happen in the application
 */
function humanizeError(technicalError: string): string {
  const lowerError = technicalError.toLowerCase();
  
  // Map technical errors to human-friendly messages
  if (lowerError.includes('500') || lowerError.includes('internal server')) {
    return ERROR_MESSAGES.API_SERVER_ERROR;
  }
  
  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return ERROR_MESSAGES.API_FAILED;
  }
  
  if (lowerError.includes('timeout') || lowerError.includes('took too long')) {
    return ERROR_MESSAGES.API_TIMEOUT;
  }
  
  if (lowerError.includes('cors') || lowerError.includes('access-control')) {
    return ERROR_MESSAGES.API_NETWORK_ERROR;
  }
  
  if (lowerError.includes('failed to fetch') || lowerError.includes('network')) {
    return ERROR_MESSAGES.NETWORK_UNREACHABLE;
  }
  
  if (lowerError.includes('typeerror') || lowerError.includes('undefined')) {
    return ERROR_MESSAGES.COMPONENT_ERROR;
  }
  
  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}