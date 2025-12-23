/**
 * Property-Based Tests for Human Microcopy & Delight Moments
 * Feature: ux-gap-requirements, Property 16: Demo Mode Clarity
 * Validates: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the toast hook with factory function
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

import { 
  MicrocopyManager,
  humanizeError,
  getEmptyStateMessage,
  celebrateWalletConnection,
  celebrateQuestJoined,
  celebrateScanComplete
} from '../MicrocopyManager';

import { toast } from '@/hooks/use-toast';

describe('Feature: ux-gap-requirements, Property Tests for Human Microcopy', () => {
  let microcopyManager: MicrocopyManager;
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    microcopyManager = new MicrocopyManager();
    mockToast.mockClear();
  });

  /**
   * Property 1: All celebration messages are encouraging and positive
   * For any celebration type and content, the message should be encouraging and positive
   * Validates: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.ENCOURAGING
   */
  test('Property 1: All celebration messages are encouraging and positive', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('success', 'milestone', 'welcome', 'achievement'),
          title: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2 && /[a-zA-Z]/.test(s)),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
          emoji: fc.option(fc.constantFrom('🎉', '🚀', '✓', '🎯', '🛡️', '💎')),
          duration: fc.option(fc.integer({ min: 1000, max: 10000 }))
        }),
        (celebrationConfig) => {
          // Property: All celebrations should result in positive toast calls
          microcopyManager.celebrate(celebrationConfig);

          // Verify toast was called
          expect(mockToast).toHaveBeenCalled();
          
          const lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
          
          // Property: Title should contain the celebration title
          expect(lastCall.title).toContain(celebrationConfig.title);
          
          // Property: Should use success variant for positive reinforcement
          expect(lastCall.variant).toBe('success');
          
          // Property: Duration should be reasonable (not too short or too long)
          if (celebrationConfig.duration) {
            expect(lastCall.duration).toBe(celebrationConfig.duration);
          } else {
            expect(lastCall.duration).toBeGreaterThanOrEqual(1000);
            expect(lastCall.duration).toBeLessThanOrEqual(10000);
          }
          
          // Property: Title should not contain negative words
          const negativeWords = ['error', 'fail', 'wrong', 'bad', 'broken', 'problem'];
          const titleLower = lastCall.title.toLowerCase();
          negativeWords.forEach(word => {
            expect(titleLower).not.toContain(word);
          });
          
          // Property: Description should be encouraging if present
          if (lastCall.description) {
            const descriptionLower = lastCall.description.toLowerCase();
            negativeWords.forEach(word => {
              expect(descriptionLower).not.toContain(word);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: All error messages are humanized and encouraging
   * For any error condition, the displayed message must use encouraging, 
   * human-friendly language rather than technical jargon
   * Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING
   */
  test('Property 2: All error messages are humanized and encouraging', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Common error patterns
          fc.constantFrom(
            'Network request failed',
            'Connection timeout',
            'Rate limit exceeded',
            'User rejected the request',
            'Wallet not found',
            'Authentication failed',
            'Server error 500',
            'Validation failed',
            'Invalid input format',
            'Resource not found'
          ),
          // Random error messages
          fc.string({ minLength: 5, maxLength: 100 })
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 20 })), // context
        (errorMessage, context) => {
          const humanizedMessage = humanizeError(errorMessage, context);
          
          // Property: Humanized message should not be empty
          expect(humanizedMessage).toBeTruthy();
          expect(humanizedMessage.length).toBeGreaterThan(0);
          
          // Property: Should not contain technical jargon
          const technicalTerms = [
            'null pointer', 'undefined reference', 'stack trace', 'exception',
            'HTTP 500', 'TCP', 'SSL', 'JSON parse', 'buffer overflow'
          ];
          const messageLower = humanizedMessage.toLowerCase();
          technicalTerms.forEach(term => {
            expect(messageLower).not.toContain(term);
          });
          
          // Property: Should contain encouraging language
          const encouragingIndicators = [
            '!', // Exclamation for positivity
            'try again', 'don\'t worry', 'no worries', 'hang tight',
            'we\'ll', 'please', 'moment', 'back', 'fix', 'check'
          ];
          const hasEncouragingLanguage = encouragingIndicators.some(indicator => 
            messageLower.includes(indicator)
          );
          expect(hasEncouragingLanguage).toBe(true);
          
          // Property: Should not blame the user
          const blamingWords = ['you failed', 'your fault', 'you broke', 'you caused'];
          blamingWords.forEach(word => {
            expect(messageLower).not.toContain(word);
          });
          
          // Property: Should provide actionable guidance
          const actionWords = ['try', 'check', 'refresh', 'wait', 'connect', 'please'];
          const hasActionableGuidance = actionWords.some(word => 
            messageLower.includes(word)
          );
          expect(hasActionableGuidance).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Empty state messages are encouraging rather than negative
   * For any empty state context, the message should be encouraging and provide clear next steps
   * Validates: R16.MICROCOPY.ENCOURAGING, R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS
   */
  test('Property 3: Empty state messages are encouraging rather than negative', () => {
    fc.assert(
      fc.property(
        fc.record({
          context: fc.constantFrom('opportunities', 'risks', 'quests', 'portfolio', 'alerts', 'history'),
          isFirstTime: fc.boolean(),
          hasFilters: fc.boolean()
        }),
        (emptyStateConfig) => {
          const message = getEmptyStateMessage(emptyStateConfig);
          
          // Property: Message should have all required fields
          expect(message).toHaveProperty('title');
          expect(message).toHaveProperty('description');
          expect(message.title).toBeTruthy();
          expect(message.description).toBeTruthy();
          
          // Property: Title should not be negative
          const negativeWords = [
            'no results', 'nothing found', 'empty', 'failed', 'error',
            'broken', 'missing', 'unavailable', 'none'
          ];
          const titleLower = message.title.toLowerCase();
          
          // Allow some contextually appropriate words but ensure overall tone is positive
          if (negativeWords.some(word => titleLower.includes(word))) {
            // If negative words are present, they should be balanced with positive framing
            const positiveWords = [
              'ready', 'all clear', 'caught up', 'awaits', 'starts here',
              'making', 'quiet', 'detected', 'great', 'good'
            ];
            const hasPositiveFraming = positiveWords.some(word => 
              titleLower.includes(word)
            );
            expect(hasPositiveFraming).toBe(true);
          }
          
          // Property: Description should be encouraging
          const descriptionLower = message.description.toLowerCase();
          const encouragingWords = [
            'ready', 'connect', 'explore', 'discover', 'start', 'find',
            'great', 'perfect', 'awesome', 'excellent', 'amazing',
            'journey', 'adventure', 'opportunity', 'exciting', 'caught up',
            'all clear', 'quiet', 'stable', 'secure', 'check back',
            'constantly scanning', 'soon', 'new', 'coming', 'completed',
            'achievements', 'rewards', 'looking good', 'monitoring',
            'use alphawhale', 'appear here', 'activity', 'history',
            'recent activity', 'making'
          ];
          const hasEncouragingLanguage = encouragingWords.some(word => 
            descriptionLower.includes(word)
          );
          expect(hasEncouragingLanguage).toBe(true);
          
          // Property: Should provide actionable next steps
          if (message.actionText) {
            expect(message.actionText).toBeTruthy();
            expect(message.actionText.length).toBeGreaterThan(0);
            
            // Action text should be positive and actionable
            const actionLower = message.actionText.toLowerCase();
            const actionWords = [
              'connect', 'explore', 'create', 'get started', 'find',
              'discover', 'learn', 'try', 'refresh', 'clear'
            ];
            const hasActionableLanguage = actionWords.some(word => 
              actionLower.includes(word)
            );
            expect(hasActionableLanguage).toBe(true);
          }
          
          // Property: Action hint should provide helpful context
          if (message.actionHint) {
            expect(message.actionHint).toBeTruthy();
            expect(message.actionHint.length).toBeGreaterThan(0);
            
            const hintLower = message.actionHint.toLowerCase();
            const helpfulWords = [
              'unlock', 'personalized', 'get', 'see', 'discover',
              'start', 'broaden', 'find', 'stay', 'check'
            ];
            const hasHelpfulLanguage = helpfulWords.some(word => 
              hintLower.includes(word)
            );
            expect(hasHelpfulLanguage).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Welcome messages are contextual and personal
   * For any user state, welcome messages should be contextually appropriate and personal
   * Validates: R16.MICROCOPY.ENCOURAGING, R16.MICROCOPY.CELEBRATIONS
   */
  test('Property 4: Welcome messages are contextual and personal', () => {
    fc.assert(
      fc.property(
        fc.record({
          isReturningUser: fc.boolean(),
          lastVisit: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
          userActions: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })),
          personalizedMessage: fc.option(fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length > 2 && /[a-zA-Z]/.test(s))),
          streak: fc.option(fc.integer({ min: 1, max: 100 })),
          achievements: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }))
        }),
        (welcomeConfig) => {
          microcopyManager.showWelcomeMessage(welcomeConfig);
          
          // Property: Should always call toast for welcome messages
          expect(mockToast).toHaveBeenCalled();
          
          const lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
          
          // Property: Should have appropriate title and description
          expect(lastCall.title).toBeTruthy();
          expect(lastCall.description).toBeTruthy();
          
          // Property: Should use success variant for positive experience
          expect(lastCall.variant).toBe('success');
          
          // Property: Duration should be reasonable for reading
          expect(lastCall.duration).toBe(5000);
          
          // Property: New users should get welcoming language
          if (!welcomeConfig.isReturningUser && !welcomeConfig.personalizedMessage) {
            expect(lastCall.title).toContain('Welcome to AlphaWhale');
            expect(lastCall.description).toContain('Ready to discover');
          }
          
          // Property: Returning users should get personalized greetings
          if (welcomeConfig.isReturningUser && !welcomeConfig.personalizedMessage) {
            const titleLower = lastCall.title.toLowerCase();
            const personalWords = ['welcome back', 'good to see', 'long time'];
            const hasPersonalGreeting = personalWords.some(word => 
              titleLower.includes(word)
            );
            expect(hasPersonalGreeting).toBe(true);
          }
          
          // Property: Custom messages should be used when provided
          if (welcomeConfig.personalizedMessage) {
            expect(lastCall.description).toBe(welcomeConfig.personalizedMessage);
          }
          
          // Property: Messages should be encouraging and forward-looking
          const descriptionLower = lastCall.description.toLowerCase();
          const forwardLookingWords = [
            'ready', 'let\'s', 'discover', 'explore', 'continue',
            'await', 'new', 'opportunities', 'journey', 'check',
            'left off', 'today', 'what\'s new', 'busy', 'landscape'
          ];
          const hasForwardLookingLanguage = forwardLookingWords.some(word => 
            descriptionLower.includes(word)
          );
          expect(hasForwardLookingLanguage).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Celebration helper functions maintain consistency
   * For any celebration helper function, the output should be consistent and appropriate
   * Validates: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.ENCOURAGING
   */
  test('Property 5: Celebration helper functions maintain consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          isFirstTime: fc.boolean(),
          questName: fc.option(fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 2 && /[a-zA-Z]/.test(s))),
          risksFound: fc.integer({ min: 0, max: 10 })
        }),
        (testData) => {
          // Test wallet connection celebration
          celebrateWalletConnection(testData.isFirstTime);
          
          let lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
          
          // Property: First-time connections should be more celebratory
          if (testData.isFirstTime) {
            expect(lastCall.title).toContain('Wallet Connected!');
            expect(lastCall.description).toContain('Welcome to the DeFi universe');
            expect(lastCall.duration).toBeGreaterThanOrEqual(5000);
          } else {
            expect(lastCall.title).toContain('Wallet Connected');
            expect(lastCall.description).toContain('Ready to explore');
            expect(lastCall.duration).toBeLessThanOrEqual(4000);
          }
          
          // Test quest celebration
          celebrateQuestJoined(testData.questName);
          
          lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
          
          // Property: Quest celebrations should be encouraging
          expect(lastCall.title).toContain('Quest Joined');
          expect(lastCall.description).toContain('Time to earn');
          
          // Property: Quest name should be included when provided
          if (testData.questName && testData.questName.trim().length > 2 && /[a-zA-Z]/.test(testData.questName)) {
            expect(lastCall.description).toContain(testData.questName);
          } else {
            expect(lastCall.description).toContain('Time to earn');
          }
          
          // Test scan completion celebration
          celebrateScanComplete(testData.risksFound);
          
          lastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1][0];
          
          // Property: Scan celebrations should reflect results appropriately
          expect(lastCall.title).toContain('Scan Complete');
          
          if (testData.risksFound === 0) {
            expect(lastCall.description).toContain('No risks detected');
            expect(lastCall.description).toContain('all set');
          } else {
            expect(lastCall.description).toContain(`Found ${testData.risksFound}`);
            expect(lastCall.description).toContain('item');
            
            // Property: Plural handling should be correct
            if (testData.risksFound > 1) {
              expect(lastCall.description).toContain('items');
            } else {
              expect(lastCall.description).toContain('item');
              expect(lastCall.description).not.toContain('items');
            }
          }
          
          // Property: All celebrations should use success variant
          expect(lastCall.variant).toBe('success');
        }
      ),
      { numRuns: 100 }
    );
  });
});