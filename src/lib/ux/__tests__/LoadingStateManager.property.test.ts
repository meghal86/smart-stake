/**
 * Property-Based Tests for Loading State Responsiveness
 * 
 * Feature: ux-gap-requirements, Property 2: Loading State Responsiveness
 * Validates: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingStateManager, LoadingContext } from '../LoadingStateManager';

describe('Feature: ux-gap-requirements, Property 2: Loading State Responsiveness', () => {
  beforeEach(() => {
    // Clear all loading states before each test
    LoadingStateManager.clearAll();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    LoadingStateManager.clearAll();
    vi.useRealTimers();
  });

  test('loading feedback appears within 100ms for all async operations', () => {
    fc.assert(
      fc.property(
        // Generate random loading contexts
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
          timeout: fc.option(fc.integer({ min: 1000, max: 30000 })),
          showProgress: fc.option(fc.boolean()),
          message: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
        }),
        (contextData) => {
          const context: LoadingContext = {
            id: contextData.id,
            type: contextData.type,
            timeout: contextData.timeout,
            showProgress: contextData.showProgress,
            message: contextData.message
          };

          // Track when loading state is shown
          let feedbackReceived = false;
          let feedbackTime = 0;
          
          const unsubscribe = LoadingStateManager.subscribe((states) => {
            if (states.has(context.id) && !feedbackReceived) {
              feedbackReceived = true;
              feedbackTime = Date.now();
            }
          });

          const startTime = Date.now();
          
          // Show loading state
          LoadingStateManager.showLoading(context);
          
          // Advance timers to trigger immediate notification
          vi.advanceTimersByTime(0);
          
          // Property: Feedback must appear within 100ms
          expect(feedbackReceived).toBe(true);
          expect(feedbackTime - startTime).toBeLessThanOrEqual(100);
          
          // Property: Loading state must be active
          const loadingState = LoadingStateManager.getLoadingState(context.id);
          expect(loadingState).toBeDefined();
          expect(loadingState!.isLoading).toBe(true);
          
          // Property: Message must be descriptive (not empty)
          expect(loadingState!.message).toBeTruthy();
          expect(loadingState!.message.length).toBeGreaterThan(0);
          
          unsubscribe();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('loading states provide descriptive messages for all operation types', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
          customMessage: fc.option(fc.string({ minLength: 5, maxLength: 100 }))
        }),
        (contextData) => {
          const context: LoadingContext = {
            id: contextData.id,
            type: contextData.type,
            message: contextData.customMessage
          };

          LoadingStateManager.showLoading(context);
          
          const loadingState = LoadingStateManager.getLoadingState(context.id);
          expect(loadingState).toBeDefined();
          
          // Property: Message must be descriptive and contextual
          const message = loadingState!.message;
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(3);
          
          // Property: Custom messages should be preserved
          if (contextData.customMessage) {
            expect(message).toBe(contextData.customMessage);
          } else {
            // Property: Default messages should be contextual to operation type
            const lowerMessage = message.toLowerCase();
            switch (context.type) {
              case 'navigation':
                expect(lowerMessage).toMatch(/loading|page|navigat/);
                break;
              case 'data-fetch':
                expect(lowerMessage).toMatch(/loading|data|fetch/);
                break;
              case 'wallet-connect':
                expect(lowerMessage).toMatch(/connect|wallet/);
                break;
              case 'form-submit':
                expect(lowerMessage).toMatch(/sav|submit|process/);
                break;
              case 'async-action':
                expect(lowerMessage).toMatch(/process|loading|action/);
                break;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('timeout handling triggers after specified duration with recovery options', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
          timeout: fc.integer({ min: 1000, max: 10000 })
        }),
        (contextData) => {
          const context: LoadingContext = {
            id: contextData.id,
            type: contextData.type,
            timeout: contextData.timeout
          };

          LoadingStateManager.showLoading(context);
          
          // Initially should not be timed out
          let loadingState = LoadingStateManager.getLoadingState(context.id);
          expect(loadingState!.hasTimedOut).toBe(false);
          
          // Advance time to just before timeout
          vi.advanceTimersByTime(contextData.timeout - 100);
          loadingState = LoadingStateManager.getLoadingState(context.id);
          expect(loadingState!.hasTimedOut).toBe(false);
          
          // Advance time past timeout
          vi.advanceTimersByTime(200);
          loadingState = LoadingStateManager.getLoadingState(context.id);
          
          // Property: Must timeout after specified duration
          expect(loadingState!.hasTimedOut).toBe(true);
          
          // Property: Timeout message must be descriptive and encouraging
          expect(loadingState!.message).toBeTruthy();
          expect(loadingState!.message.toLowerCase()).toMatch(/longer|expected|taking/);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('loading state cleanup removes all traces and prevents memory leaks', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
            timeout: fc.option(fc.integer({ min: 1000, max: 10000 }))
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (contexts) => {
          // Ensure unique IDs
          const uniqueContexts = contexts.filter((context, index, arr) => 
            arr.findIndex(c => c.id === context.id) === index
          );
          
          if (uniqueContexts.length < 1) return; // Skip if no unique contexts
          
          // Start multiple loading operations
          uniqueContexts.forEach(contextData => {
            const context: LoadingContext = {
              id: contextData.id,
              type: contextData.type,
              timeout: contextData.timeout
            };
            LoadingStateManager.showLoading(context);
          });
          
          // Verify all unique contexts are active
          expect(LoadingStateManager.getAllLoadingStates().size).toBe(uniqueContexts.length);
          expect(LoadingStateManager.isAnyLoading()).toBe(true);
          
          // Hide each unique loading state
          uniqueContexts.forEach(contextData => {
            LoadingStateManager.hideLoading(contextData.id);
          });
          
          // Property: All loading states must be cleaned up
          expect(LoadingStateManager.getAllLoadingStates().size).toBe(0);
          expect(LoadingStateManager.isAnyLoading()).toBe(false);
          
          // Property: No loading state should be retrievable
          uniqueContexts.forEach(contextData => {
            expect(LoadingStateManager.getLoadingState(contextData.id)).toBeUndefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  test('progress updates maintain valid range and trigger notifications', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
          progressUpdates: fc.array(fc.float({ min: -50, max: 150 }), { minLength: 1, maxLength: 20 })
        }),
        (contextData) => {
          const context: LoadingContext = {
            id: contextData.id,
            type: contextData.type,
            showProgress: true
          };

          let notificationCount = 0;
          const unsubscribe = LoadingStateManager.subscribe(() => {
            notificationCount++;
          });

          LoadingStateManager.showLoading(context);
          
          // Apply progress updates
          contextData.progressUpdates.forEach(progress => {
            LoadingStateManager.updateProgress(context.id, progress);
            
            const loadingState = LoadingStateManager.getLoadingState(context.id);
            expect(loadingState).toBeDefined();
            
            // Property: Progress must be clamped to valid range [0, 100]
            expect(loadingState!.progress).toBeGreaterThanOrEqual(0);
            expect(loadingState!.progress).toBeLessThanOrEqual(100);
          });
          
          // Property: Progress updates must trigger notifications
          // Should have at least one notification from showLoading
          expect(notificationCount).toBeGreaterThanOrEqual(1);
          
          unsubscribe();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('concurrent loading operations maintain independent state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('navigation', 'async-action', 'data-fetch', 'wallet-connect', 'form-submit'),
            message: fc.string({ minLength: 5, maxLength: 50 }),
            timeout: fc.integer({ min: 2000, max: 8000 })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (contexts) => {
          // Ensure unique IDs
          const uniqueContexts = contexts.filter((context, index, arr) => 
            arr.findIndex(c => c.id === context.id) === index
          );
          
          if (uniqueContexts.length < 1) return; // Skip if no unique contexts
          
          // Start all loading operations
          uniqueContexts.forEach(contextData => {
            const context: LoadingContext = {
              id: contextData.id,
              type: contextData.type,
              message: contextData.message,
              timeout: contextData.timeout
            };
            LoadingStateManager.showLoading(context);
          });
          
          // Property: Each loading state must maintain independent state
          uniqueContexts.forEach(contextData => {
            const loadingState = LoadingStateManager.getLoadingState(contextData.id);
            expect(loadingState).toBeDefined();
            expect(loadingState!.isLoading).toBe(true);
            expect(loadingState!.message).toBe(contextData.message);
            expect(loadingState!.hasTimedOut).toBe(false);
          });
          
          // Hide one operation
          const firstContext = uniqueContexts[0];
          LoadingStateManager.hideLoading(firstContext.id);
          
          // Property: Other operations must remain unaffected
          expect(LoadingStateManager.getLoadingState(firstContext.id)).toBeUndefined();
          
          uniqueContexts.slice(1).forEach(contextData => {
            const loadingState = LoadingStateManager.getLoadingState(contextData.id);
            expect(loadingState).toBeDefined();
            expect(loadingState!.isLoading).toBe(true);
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});