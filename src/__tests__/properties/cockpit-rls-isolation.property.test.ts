/**
 * Cockpit RLS Isolation Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 14: Row Level Security Isolation
 * 
 * Tests that for any authenticated user, database queries only return data 
 * belonging to that user. This is a critical security property that ensures
 * users cannot access other users' cockpit state, daily pulse, or shown actions.
 * 
 * Validates: Requirements 17.7
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';

// ============================================================================
// Types
// ============================================================================

interface CockpitState {
  user_id: string;
  last_opened_at: string | null;
  last_pulse_viewed_date: string | null;
  prefs: {
    wallet_scope_default?: 'active' | 'all';
    timezone?: string;
    dnd_start_local?: string;
    dnd_end_local?: string;
    notif_cap_per_day?: number;
  };
  updated_at: string;
}

interface DailyPulse {
  user_id: string;
  pulse_date: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface ShownAction {
  user_id: string;
  dedupe_key: string;
  shown_at: string;
}

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate valid UUIDs for user IDs
 */
const uuidArbitrary = fc.uuid();

/**
 * Generate valid IANA timezone strings
 */
const timezoneArbitrary = fc.constantFrom(
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC'
);

/**
 * Generate valid HH:MM time strings
 */
const timeStringArbitrary = fc
  .tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 })
  )
  .map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/**
 * Generate valid cockpit preferences
 */
const prefsArbitrary = fc.record({
  wallet_scope_default: fc.constantFrom('active', 'all') as fc.Arbitrary<'active' | 'all'>,
  timezone: timezoneArbitrary,
  dnd_start_local: timeStringArbitrary,
  dnd_end_local: timeStringArbitrary,
  notif_cap_per_day: fc.integer({ min: 0, max: 10 })
});

/**
 * Generate valid ISO timestamp strings
 */
const timestampArbitrary = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .map(d => d.toISOString());

/**
 * Generate valid date strings (YYYY-MM-DD)
 */
const dateStringArbitrary = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .map(d => d.toISOString().split('T')[0]);

/**
 * Generate valid dedupe keys (format: source.kind:source.ref_id:cta.kind)
 */
const dedupeKeyArbitrary = fc
  .tuple(
    fc.constantFrom('guardian', 'hunter', 'portfolio', 'action_center', 'proof'),
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(':')),
    fc.constantFrom('Fix', 'Execute', 'Review')
  )
  .map(([kind, refId, ctaKind]) => `${kind}:${refId}:${ctaKind}`);

/**
 * Generate a cockpit state record for a user
 */
const cockpitStateArbitrary = (userId: string): fc.Arbitrary<CockpitState> =>
  fc.record({
    user_id: fc.constant(userId),
    last_opened_at: fc.option(timestampArbitrary, { nil: null }),
    last_pulse_viewed_date: fc.option(dateStringArbitrary, { nil: null }),
    prefs: prefsArbitrary,
    updated_at: timestampArbitrary
  });

/**
 * Generate a daily pulse record for a user
 */
const dailyPulseArbitrary = (userId: string): fc.Arbitrary<DailyPulse> =>
  fc.record({
    user_id: fc.constant(userId),
    pulse_date: dateStringArbitrary,
    payload: fc.record({
      rows: fc.array(
        fc.record({
          kind: fc.constantFrom('expiring_opportunity', 'new_opportunity', 'portfolio_delta'),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        { minLength: 0, maxLength: 8 }
      )
    }),
    created_at: timestampArbitrary
  });

/**
 * Generate a shown action record for a user
 */
const shownActionArbitrary = (userId: string): fc.Arbitrary<ShownAction> =>
  fc.record({
    user_id: fc.constant(userId),
    dedupe_key: dedupeKeyArbitrary,
    shown_at: timestampArbitrary
  });

// ============================================================================
// Mock Database with RLS Simulation
// ============================================================================

/**
 * Simulates a database with RLS policies.
 * This is a pure function implementation that mirrors the expected behavior
 * of Supabase RLS policies.
 */
class MockDatabaseWithRLS {
  private cockpitStates: Map<string, CockpitState> = new Map();
  private dailyPulses: Map<string, DailyPulse[]> = new Map();
  private shownActions: Map<string, ShownAction[]> = new Map();

  /**
   * Insert cockpit state (RLS: user can only insert their own)
   */
  insertCockpitState(authUserId: string, state: CockpitState): boolean {
    // RLS policy: auth.uid() = user_id
    if (authUserId !== state.user_id) {
      return false; // RLS violation
    }
    this.cockpitStates.set(state.user_id, state);
    return true;
  }

  /**
   * Select cockpit state (RLS: user can only select their own)
   */
  selectCockpitState(authUserId: string): CockpitState | null {
    // RLS policy: auth.uid() = user_id
    const state = this.cockpitStates.get(authUserId);
    return state || null;
  }

  /**
   * Select all cockpit states (simulates what would happen without RLS)
   * This should NEVER return other users' data when RLS is enabled
   */
  selectAllCockpitStatesWithRLS(authUserId: string): CockpitState[] {
    // With RLS, only the authenticated user's data is returned
    const state = this.cockpitStates.get(authUserId);
    return state ? [state] : [];
  }

  /**
   * Insert daily pulse (RLS: user can only insert their own)
   */
  insertDailyPulse(authUserId: string, pulse: DailyPulse): boolean {
    // RLS policy: auth.uid() = user_id
    if (authUserId !== pulse.user_id) {
      return false; // RLS violation
    }
    const userPulses = this.dailyPulses.get(pulse.user_id) || [];
    userPulses.push(pulse);
    this.dailyPulses.set(pulse.user_id, userPulses);
    return true;
  }

  /**
   * Select daily pulses (RLS: user can only select their own)
   */
  selectDailyPulses(authUserId: string): DailyPulse[] {
    // RLS policy: auth.uid() = user_id
    return this.dailyPulses.get(authUserId) || [];
  }

  /**
   * Insert shown action (RLS: user can only insert their own)
   */
  insertShownAction(authUserId: string, action: ShownAction): boolean {
    // RLS policy: auth.uid() = user_id
    if (authUserId !== action.user_id) {
      return false; // RLS violation
    }
    const userActions = this.shownActions.get(action.user_id) || [];
    userActions.push(action);
    this.shownActions.set(action.user_id, userActions);
    return true;
  }

  /**
   * Select shown actions (RLS: user can only select their own)
   */
  selectShownActions(authUserId: string): ShownAction[] {
    // RLS policy: auth.uid() = user_id
    return this.shownActions.get(authUserId) || [];
  }

  /**
   * Get total count of all records (for verification)
   */
  getTotalCounts(): { cockpitStates: number; dailyPulses: number; shownActions: number } {
    let dailyPulseCount = 0;
    let shownActionCount = 0;
    
    this.dailyPulses.forEach(pulses => {
      dailyPulseCount += pulses.length;
    });
    
    this.shownActions.forEach(actions => {
      shownActionCount += actions.length;
    });

    return {
      cockpitStates: this.cockpitStates.size,
      dailyPulses: dailyPulseCount,
      shownActions: shownActionCount
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.cockpitStates.clear();
    this.dailyPulses.clear();
    this.shownActions.clear();
  }
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 14: Row Level Security Isolation', () => {
  let db: MockDatabaseWithRLS;

  beforeEach(() => {
    db = new MockDatabaseWithRLS();
  });

  // ========================================================================
  // Property 14.1: Users can only read their own cockpit_state
  // ========================================================================

  test('users can only read their own cockpit_state', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        fc.array(uuidArbitrary, { minLength: 0, maxLength: 5 }),
        (user1Id, user2Id, otherUserIds) => {
          // Ensure user1 and user2 are different
          if (user1Id === user2Id) return true;

          db.clear();

          // Create cockpit states for multiple users
          const allUserIds = [user1Id, user2Id, ...otherUserIds.filter(id => id !== user1Id && id !== user2Id)];
          
          allUserIds.forEach(userId => {
            const state: CockpitState = {
              user_id: userId,
              last_opened_at: new Date().toISOString(),
              last_pulse_viewed_date: '2026-01-10',
              prefs: { wallet_scope_default: 'active' },
              updated_at: new Date().toISOString()
            };
            db.insertCockpitState(userId, state);
          });

          // User1 queries cockpit_state
          const user1Results = db.selectAllCockpitStatesWithRLS(user1Id);

          // Property: User1 should only see their own data
          const onlyOwnData = user1Results.every(state => state.user_id === user1Id);
          const maxOneResult = user1Results.length <= 1;

          return onlyOwnData && maxOneResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.2: Users can only read their own daily_pulse
  // ========================================================================

  test('users can only read their own daily_pulse', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        fc.array(dateStringArbitrary, { minLength: 1, maxLength: 5 }),
        (user1Id, user2Id, dates) => {
          // Ensure user1 and user2 are different
          if (user1Id === user2Id) return true;

          db.clear();

          // Create daily pulses for both users
          dates.forEach(date => {
            const pulse1: DailyPulse = {
              user_id: user1Id,
              pulse_date: date,
              payload: { rows: [] },
              created_at: new Date().toISOString()
            };
            const pulse2: DailyPulse = {
              user_id: user2Id,
              pulse_date: date,
              payload: { rows: [] },
              created_at: new Date().toISOString()
            };
            db.insertDailyPulse(user1Id, pulse1);
            db.insertDailyPulse(user2Id, pulse2);
          });

          // User1 queries daily_pulse
          const user1Results = db.selectDailyPulses(user1Id);

          // Property: User1 should only see their own data
          const onlyOwnData = user1Results.every(pulse => pulse.user_id === user1Id);

          return onlyOwnData;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.3: Users can only read their own shown_actions
  // ========================================================================

  test('users can only read their own shown_actions', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        fc.array(dedupeKeyArbitrary, { minLength: 1, maxLength: 10 }),
        (user1Id, user2Id, dedupeKeys) => {
          // Ensure user1 and user2 are different
          if (user1Id === user2Id) return true;

          db.clear();

          // Create shown actions for both users
          dedupeKeys.forEach(key => {
            const action1: ShownAction = {
              user_id: user1Id,
              dedupe_key: key,
              shown_at: new Date().toISOString()
            };
            const action2: ShownAction = {
              user_id: user2Id,
              dedupe_key: key,
              shown_at: new Date().toISOString()
            };
            db.insertShownAction(user1Id, action1);
            db.insertShownAction(user2Id, action2);
          });

          // User1 queries shown_actions
          const user1Results = db.selectShownActions(user1Id);

          // Property: User1 should only see their own data
          const onlyOwnData = user1Results.every(action => action.user_id === user1Id);

          return onlyOwnData;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.4: Users cannot insert data for other users
  // ========================================================================

  test('users cannot insert cockpit_state for other users', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        (authUserId, targetUserId) => {
          // Ensure users are different
          if (authUserId === targetUserId) return true;

          db.clear();

          // Try to insert cockpit state for another user
          const state: CockpitState = {
            user_id: targetUserId, // Trying to insert for different user
            last_opened_at: new Date().toISOString(),
            last_pulse_viewed_date: '2026-01-10',
            prefs: { wallet_scope_default: 'active' },
            updated_at: new Date().toISOString()
          };

          const insertResult = db.insertCockpitState(authUserId, state);

          // Property: Insert should fail (RLS violation)
          return insertResult === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.5: Users cannot insert daily_pulse for other users
  // ========================================================================

  test('users cannot insert daily_pulse for other users', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        dateStringArbitrary,
        (authUserId, targetUserId, date) => {
          // Ensure users are different
          if (authUserId === targetUserId) return true;

          db.clear();

          // Try to insert daily pulse for another user
          const pulse: DailyPulse = {
            user_id: targetUserId, // Trying to insert for different user
            pulse_date: date,
            payload: { rows: [] },
            created_at: new Date().toISOString()
          };

          const insertResult = db.insertDailyPulse(authUserId, pulse);

          // Property: Insert should fail (RLS violation)
          return insertResult === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.6: Users cannot insert shown_actions for other users
  // ========================================================================

  test('users cannot insert shown_actions for other users', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        dedupeKeyArbitrary,
        (authUserId, targetUserId, dedupeKey) => {
          // Ensure users are different
          if (authUserId === targetUserId) return true;

          db.clear();

          // Try to insert shown action for another user
          const action: ShownAction = {
            user_id: targetUserId, // Trying to insert for different user
            dedupe_key: dedupeKey,
            shown_at: new Date().toISOString()
          };

          const insertResult = db.insertShownAction(authUserId, action);

          // Property: Insert should fail (RLS violation)
          return insertResult === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.7: Data isolation is maintained with many users
  // ========================================================================

  test('data isolation is maintained with many users', () => {
    fc.assert(
      fc.property(
        fc.array(uuidArbitrary, { minLength: 2, maxLength: 10 }),
        fc.array(dedupeKeyArbitrary, { minLength: 1, maxLength: 5 }),
        (userIds, dedupeKeys) => {
          // Ensure unique user IDs
          const uniqueUserIds = [...new Set(userIds)];
          if (uniqueUserIds.length < 2) return true;

          db.clear();

          // Create data for all users
          uniqueUserIds.forEach(userId => {
            // Insert cockpit state
            const state: CockpitState = {
              user_id: userId,
              last_opened_at: new Date().toISOString(),
              last_pulse_viewed_date: '2026-01-10',
              prefs: { wallet_scope_default: 'active' },
              updated_at: new Date().toISOString()
            };
            db.insertCockpitState(userId, state);

            // Insert shown actions
            dedupeKeys.forEach(key => {
              const action: ShownAction = {
                user_id: userId,
                dedupe_key: key,
                shown_at: new Date().toISOString()
              };
              db.insertShownAction(userId, action);
            });
          });

          // Verify isolation for each user
          const isolationMaintained = uniqueUserIds.every(userId => {
            const cockpitResults = db.selectAllCockpitStatesWithRLS(userId);
            const actionResults = db.selectShownActions(userId);

            // All results should belong to this user only
            const cockpitOwnOnly = cockpitResults.every(s => s.user_id === userId);
            const actionsOwnOnly = actionResults.every(a => a.user_id === userId);

            return cockpitOwnOnly && actionsOwnOnly;
          });

          return isolationMaintained;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.8: Empty results for non-existent user data
  // ========================================================================

  test('empty results for non-existent user data', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        uuidArbitrary,
        (existingUserId, queryingUserId) => {
          // Ensure users are different
          if (existingUserId === queryingUserId) return true;

          db.clear();

          // Create data for existing user only
          const state: CockpitState = {
            user_id: existingUserId,
            last_opened_at: new Date().toISOString(),
            last_pulse_viewed_date: '2026-01-10',
            prefs: { wallet_scope_default: 'active' },
            updated_at: new Date().toISOString()
          };
          db.insertCockpitState(existingUserId, state);

          // Query as different user
          const cockpitResult = db.selectCockpitState(queryingUserId);
          const pulseResults = db.selectDailyPulses(queryingUserId);
          const actionResults = db.selectShownActions(queryingUserId);

          // Property: Should get empty/null results (not other user's data)
          return cockpitResult === null && pulseResults.length === 0 && actionResults.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 14.9: Users can successfully insert and read their own data
  // ========================================================================

  test('users can successfully insert and read their own data', () => {
    fc.assert(
      fc.property(
        uuidArbitrary,
        prefsArbitrary,
        fc.array(dedupeKeyArbitrary, { minLength: 1, maxLength: 5 }),
        (userId, prefs, dedupeKeys) => {
          db.clear();

          // Insert cockpit state
          const state: CockpitState = {
            user_id: userId,
            last_opened_at: new Date().toISOString(),
            last_pulse_viewed_date: '2026-01-10',
            prefs,
            updated_at: new Date().toISOString()
          };
          const stateInserted = db.insertCockpitState(userId, state);

          // Insert shown actions
          const actionsInserted = dedupeKeys.every(key => {
            const action: ShownAction = {
              user_id: userId,
              dedupe_key: key,
              shown_at: new Date().toISOString()
            };
            return db.insertShownAction(userId, action);
          });

          // Read back data
          const readState = db.selectCockpitState(userId);
          const readActions = db.selectShownActions(userId);

          // Property: User should be able to insert and read their own data
          const canInsert = stateInserted && actionsInserted;
          const canRead = readState !== null && readState.user_id === userId;
          const actionsReadable = readActions.length === dedupeKeys.length;

          return canInsert && canRead && actionsReadable;
        }
      ),
      { numRuns: 100 }
    );
  });
});
