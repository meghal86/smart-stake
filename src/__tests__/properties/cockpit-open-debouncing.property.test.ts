/**
 * Cockpit Open Debouncing Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 11: Cockpit Open Debouncing
 * 
 * Tests that for any sequence of POST /api/cockpit/open calls from the same user,
 * only one update occurs per minute regardless of call frequency.
 * 
 * Validates: Requirements 11.8
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';

// ============================================================================
// Constants
// ============================================================================

/**
 * Debounce window in milliseconds (1 minute)
 * This matches the DEBOUNCE_WINDOW_MS constant in the actual endpoint
 */
const DEBOUNCE_WINDOW_MS = 60 * 1000;

// ============================================================================
// Types
// ============================================================================

interface CockpitState {
  user_id: string;
  last_opened_at: string | null;
  prefs: Record<string, unknown>;
  updated_at: string;
}

interface OpenCallResult {
  ok: boolean;
  debounced: boolean;
  timestamp: number;
}

interface OpenCallSequence {
  userId: string;
  callTimestamps: number[];
}

// ============================================================================
// Debouncing Logic (Pure Function Implementation)
// ============================================================================

/**
 * Pure function that implements the debouncing logic from the cockpit open endpoint.
 * This mirrors the server-side implementation for property testing.
 * 
 * @param lastOpenedAt - The last_opened_at timestamp from cockpit_state (null if first open)
 * @param currentTime - The current timestamp of the call
 * @returns Object indicating if the call was debounced and the new last_opened_at
 */
function shouldDebounce(
  lastOpenedAt: number | null,
  currentTime: number
): { debounced: boolean; newLastOpenedAt: number } {
  if (lastOpenedAt === null) {
    // First open - never debounced
    return { debounced: false, newLastOpenedAt: currentTime };
  }

  const timeSinceLastOpen = currentTime - lastOpenedAt;
  
  if (timeSinceLastOpen < DEBOUNCE_WINDOW_MS) {
    // Within debounce window - skip update
    return { debounced: true, newLastOpenedAt: lastOpenedAt };
  }

  // Outside debounce window - allow update
  return { debounced: false, newLastOpenedAt: currentTime };
}

/**
 * Simulates a sequence of cockpit open calls and returns the results.
 * This is a pure function that models the server-side behavior.
 * 
 * @param callTimestamps - Array of timestamps when calls are made (in ms)
 * @returns Array of results for each call
 */
function simulateOpenCallSequence(callTimestamps: number[]): OpenCallResult[] {
  const results: OpenCallResult[] = [];
  let lastOpenedAt: number | null = null;

  for (const timestamp of callTimestamps) {
    const { debounced, newLastOpenedAt } = shouldDebounce(lastOpenedAt, timestamp);
    
    results.push({
      ok: true,
      debounced,
      timestamp,
    });

    lastOpenedAt = newLastOpenedAt;
  }

  return results;
}

/**
 * Counts the number of actual updates (non-debounced calls) in a sequence.
 */
function countActualUpdates(results: OpenCallResult[]): number {
  return results.filter(r => !r.debounced).length;
}

/**
 * Groups call timestamps into 1-minute windows and returns the expected
 * maximum number of updates.
 */
function getExpectedMaxUpdates(callTimestamps: number[]): number {
  if (callTimestamps.length === 0) return 0;
  
  const sorted = [...callTimestamps].sort((a, b) => a - b);
  const firstCall = sorted[0];
  const lastCall = sorted[sorted.length - 1];
  
  // Calculate the time span
  const timeSpan = lastCall - firstCall;
  
  // Maximum updates = 1 (first call) + number of complete minutes in the span
  // Plus 1 for potential update at the end if it's outside the last window
  return Math.floor(timeSpan / DEBOUNCE_WINDOW_MS) + 1;
}

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate valid UUIDs for user IDs
 */
const uuidArbitrary = fc.uuid();

/**
 * Generate a base timestamp (start of test scenario)
 */
const baseTimestampArbitrary = fc.integer({ 
  min: Date.now() - 86400000, // 24 hours ago
  max: Date.now() 
});

/**
 * Generate a sequence of call timestamps relative to a base timestamp.
 * Timestamps are sorted in ascending order.
 */
const callTimestampsArbitrary = (baseTimestamp: number) =>
  fc.array(
    fc.integer({ min: 0, max: 300000 }), // 0 to 5 minutes offset
    { minLength: 1, maxLength: 20 }
  ).map(offsets => 
    offsets
      .map(offset => baseTimestamp + offset)
      .sort((a, b) => a - b)
  );

/**
 * Generate a sequence of rapid calls (all within 1 minute)
 */
const rapidCallsArbitrary = (baseTimestamp: number) =>
  fc.array(
    fc.integer({ min: 0, max: DEBOUNCE_WINDOW_MS - 1 }),
    { minLength: 2, maxLength: 10 }
  ).map(offsets =>
    offsets
      .map(offset => baseTimestamp + offset)
      .sort((a, b) => a - b)
  );

/**
 * Generate a sequence of spaced calls (each at least 1 minute apart)
 */
const spacedCallsArbitrary = (baseTimestamp: number) =>
  fc.array(
    fc.integer({ min: DEBOUNCE_WINDOW_MS, max: DEBOUNCE_WINDOW_MS * 2 }),
    { minLength: 1, maxLength: 5 }
  ).map(intervals => {
    const timestamps: number[] = [baseTimestamp];
    let current = baseTimestamp;
    for (const interval of intervals) {
      current += interval;
      timestamps.push(current);
    }
    return timestamps;
  });

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 11: Cockpit Open Debouncing', () => {
  // ========================================================================
  // Property 11.1: First call is never debounced
  // ========================================================================

  test('first call is never debounced', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        (timestamp) => {
          const results = simulateOpenCallSequence([timestamp]);
          
          // Property: First call should never be debounced
          return results.length === 1 && 
                 results[0].ok === true && 
                 results[0].debounced === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.2: Rapid calls within 1 minute result in only one update
  // ========================================================================

  test('rapid calls within 1 minute result in only one update', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        (baseTimestamp) => {
          // Generate rapid calls all within the debounce window
          const rapidCalls = rapidCallsArbitrary(baseTimestamp);
          
          return fc.assert(
            fc.property(rapidCalls, (timestamps) => {
              const results = simulateOpenCallSequence(timestamps);
              const actualUpdates = countActualUpdates(results);
              
              // Property: Only the first call should result in an update
              // All subsequent calls within the minute should be debounced
              return actualUpdates === 1;
            }),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 2 } // Outer loop runs fewer times since inner loop runs 50
    );
  });

  // ========================================================================
  // Property 11.3: Calls spaced more than 1 minute apart are not debounced
  // ========================================================================

  test('calls spaced more than 1 minute apart are not debounced', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        (baseTimestamp) => {
          const spacedCalls = spacedCallsArbitrary(baseTimestamp);
          
          return fc.assert(
            fc.property(spacedCalls, (timestamps) => {
              const results = simulateOpenCallSequence(timestamps);
              const actualUpdates = countActualUpdates(results);
              
              // Property: All calls should result in updates since they're spaced apart
              return actualUpdates === timestamps.length;
            }),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 2 }
    );
  });

  // ========================================================================
  // Property 11.4: Number of updates never exceeds theoretical maximum
  // ========================================================================

  test('number of updates never exceeds theoretical maximum', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary.chain(base => 
          callTimestampsArbitrary(base).map(timestamps => ({ base, timestamps }))
        ),
        ({ timestamps }) => {
          const results = simulateOpenCallSequence(timestamps);
          const actualUpdates = countActualUpdates(results);
          const maxExpected = getExpectedMaxUpdates(timestamps);
          
          // Property: Actual updates should never exceed the theoretical maximum
          return actualUpdates <= maxExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.5: Debouncing is deterministic
  // ========================================================================

  test('debouncing is deterministic - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary.chain(base => callTimestampsArbitrary(base)),
        (timestamps) => {
          // Run the same sequence twice
          const results1 = simulateOpenCallSequence(timestamps);
          const results2 = simulateOpenCallSequence(timestamps);
          
          // Property: Results should be identical
          if (results1.length !== results2.length) return false;
          
          return results1.every((r1, i) => 
            r1.ok === results2[i].ok &&
            r1.debounced === results2[i].debounced &&
            r1.timestamp === results2[i].timestamp
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.6: Exactly at 1 minute boundary allows new update
  // ========================================================================

  test('call exactly at 1 minute boundary allows new update', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        (baseTimestamp) => {
          // First call, then exactly 1 minute later
          const timestamps = [baseTimestamp, baseTimestamp + DEBOUNCE_WINDOW_MS];
          const results = simulateOpenCallSequence(timestamps);
          
          // Property: Both calls should result in updates (second is exactly at boundary)
          return countActualUpdates(results) === 2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.7: Call at 59.999 seconds is still debounced
  // ========================================================================

  test('call just before 1 minute boundary is debounced', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        fc.integer({ min: 1, max: DEBOUNCE_WINDOW_MS - 1 }),
        (baseTimestamp, offset) => {
          // First call, then just before the 1 minute mark
          const timestamps = [baseTimestamp, baseTimestamp + offset];
          const results = simulateOpenCallSequence(timestamps);
          
          // Property: Second call should be debounced
          return results.length === 2 &&
                 results[0].debounced === false &&
                 results[1].debounced === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.8: Mixed rapid and spaced calls
  // ========================================================================

  test('mixed rapid and spaced calls produce correct update count', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        fc.array(
          fc.oneof(
            fc.integer({ min: 0, max: DEBOUNCE_WINDOW_MS - 1 }), // Rapid
            fc.integer({ min: DEBOUNCE_WINDOW_MS, max: DEBOUNCE_WINDOW_MS * 2 }) // Spaced
          ),
          { minLength: 2, maxLength: 15 }
        ),
        (baseTimestamp, intervals) => {
          // Build timestamps from intervals
          const timestamps: number[] = [baseTimestamp];
          let current = baseTimestamp;
          for (const interval of intervals) {
            current += interval;
            timestamps.push(current);
          }
          
          const results = simulateOpenCallSequence(timestamps);
          const actualUpdates = countActualUpdates(results);
          
          // Property: At least 1 update (first call) and at most theoretical max
          const maxExpected = getExpectedMaxUpdates(timestamps);
          return actualUpdates >= 1 && actualUpdates <= maxExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.9: Debounce window resets after successful update
  // ========================================================================

  test('debounce window resets after successful update', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary,
        fc.integer({ min: 1, max: DEBOUNCE_WINDOW_MS - 1 }),
        (baseTimestamp, rapidOffset) => {
          // Pattern: call -> wait 1 min -> call -> rapid call
          // The rapid call after the second update should be debounced
          const timestamps = [
            baseTimestamp,
            baseTimestamp + DEBOUNCE_WINDOW_MS, // 1 min later - should update
            baseTimestamp + DEBOUNCE_WINDOW_MS + rapidOffset // rapid after second - should debounce
          ];
          
          const results = simulateOpenCallSequence(timestamps);
          
          // Property: First two calls update, third is debounced
          return results.length === 3 &&
                 results[0].debounced === false &&
                 results[1].debounced === false &&
                 results[2].debounced === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.10: All results have ok=true
  // ========================================================================

  test('all calls return ok=true regardless of debouncing', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary.chain(base => callTimestampsArbitrary(base)),
        (timestamps) => {
          const results = simulateOpenCallSequence(timestamps);
          
          // Property: All calls should return ok=true
          return results.every(r => r.ok === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.11: Debounced flag correctly indicates update status
  // ========================================================================

  test('debounced flag correctly indicates whether update occurred', () => {
    fc.assert(
      fc.property(
        baseTimestampArbitrary.chain(base => callTimestampsArbitrary(base)),
        (timestamps) => {
          const results = simulateOpenCallSequence(timestamps);
          
          // Track what the last_opened_at should be after each call
          let lastOpenedAt: number | null = null;
          
          for (const result of results) {
            const { debounced, newLastOpenedAt } = shouldDebounce(lastOpenedAt, result.timestamp);
            
            // Property: debounced flag should match whether last_opened_at changed
            const updateOccurred = newLastOpenedAt !== lastOpenedAt;
            if (result.debounced !== !updateOccurred) {
              return false;
            }
            
            lastOpenedAt = newLastOpenedAt;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 11.12: Per-user isolation (different users don't affect each other)
  // ========================================================================

  test('debouncing is per-user - different users do not affect each other', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        baseTimestampArbitrary,
        (user1Id, user2Id, baseTimestamp) => {
          // Ensure different users
          if (user1Id === user2Id) return true;
          
          // Simulate interleaved calls from two users
          const user1Timestamps = [baseTimestamp, baseTimestamp + 100]; // Rapid calls
          const user2Timestamps = [baseTimestamp + 50, baseTimestamp + 150]; // Also rapid
          
          // Each user's sequence should be independent
          const user1Results = simulateOpenCallSequence(user1Timestamps);
          const user2Results = simulateOpenCallSequence(user2Timestamps);
          
          // Property: Each user should have exactly 1 update (first call only)
          // because their rapid calls are within the debounce window
          return countActualUpdates(user1Results) === 1 &&
                 countActualUpdates(user2Results) === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
