# Task 5: Quests Module (Admin-Seeded) - COMPLETE ✅

## Summary

Successfully implemented the complete Quests module for Hunter Demand-Side, including database schema, admin seed script, Galxe integration, API endpoints, and comprehensive unit tests.

## Completed Subtasks

### 5.1 Create quest database schema ✅
- **File**: `supabase/migrations/20260126000000_hunter_quests_schema.sql`
- Added quest-specific columns to opportunities table:
  - `quest_steps` (JSONB) - Multi-step quest structure
  - `quest_difficulty` (TEXT) - easy/medium/hard
  - `xp_reward` (INTEGER) - XP earned on completion
  - `quest_type` (TEXT) - Quest classification
- Created `user_quest_progress` table for tracking:
  - User ID, opportunity ID, wallet address
  - Current step index
  - Completed steps array (JSONB)
  - XP earned
  - Started/completed timestamps
- Added indexes for fast lookups
- Enabled RLS with user-scoped policies

### 5.2 Create admin seed script ✅
- **File**: `scripts/seed-quests.ts` (already existed)
- Seeds 12 quest opportunities with realistic data:
  - Base Onchain Summer Quest
  - Arbitrum Odyssey Quest
  - Optimism Quests Season 5
  - Polygon zkEVM Explorer Quest
  - Avalanche Rush Quest
  - Linea Voyage Quest Week 1
  - Scroll Canvas Quest
  - zkSync Era Quest Series
  - Starknet Quest Odyssey
  - Blast Big Bang Quest
  - Manta Pacific Quest
  - Mode Network Quest
- Each quest includes:
  - Multi-step structure (2-5 steps)
  - Difficulty level (easy/medium/hard)
  - XP rewards (200-1000 XP)
  - Chain requirements
  - End dates

### 5.3 Create quest sync with Galxe integration (REAL DATA) ✅
- **File**: `src/lib/hunter/sync/quests.ts`
- Orchestrates quest sync from multiple sources:
  1. Galxe GraphQL API (real-time quests)
  2. Admin seeds (curated quests)
- Implements deduplication logic:
  - Priority: Admin (trust=95) > Galxe (trust=85)
  - Deduplication key: `protocol_name + chains[0]`
- Returns breakdown by source
- Handles errors gracefully with partial results

- **File**: `src/app/api/sync/quests/route.ts`
- POST endpoint for quest sync
- Validates CRON_SECRET for authorization
- Returns: `{count, sources, breakdown, duration_ms, errors?}`

### 5.4 Add quest-specific API endpoints ✅
- **File**: `src/app/api/hunter/quests/route.ts`
- GET `/api/hunter/quests?wallet=0x...`
- Filters opportunities by `type='quest'`
- Supports personalization with wallet address:
  - Fetches wallet signals
  - Evaluates eligibility for top 50 candidates
  - Calculates ranking scores
  - Sorts by overall ranking
- Graceful fallback to non-personalized results on error

- **File**: `src/app/api/hunter/quests/progress/route.ts`
- POST `/api/hunter/quests/progress` - Update quest progress
  - Validates user authentication
  - Validates request body (opportunity_id, wallet_address, current_step, completed_steps)
  - Upserts progress to database
  - Calculates XP earned
  - Marks quest as completed when all steps done
- GET `/api/hunter/quests/progress` - Fetch user's quest progress
  - Filters by opportunity_id and/or wallet_address
  - Returns all progress records for authenticated user

### 5.5 Write unit tests for quest progress tracking ✅
- **File**: `src/__tests__/unit/hunter-quest-progress.test.ts`
- **18 tests, all passing** ✅

**Test Coverage:**
1. Multi-step quest completion logic (6 tests)
   - Mark first step as completed
   - Mark multiple steps in order
   - Mark quest as completed when all steps done
   - Handle steps completed out of order
   - Prevent duplicate completed steps
   - Handle single-step quests

2. XP reward calculation (5 tests)
   - Award full XP when quest completed
   - Award partial XP based on completion ratio
   - Award zero XP when no steps completed
   - Floor partial XP to integer
   - Handle high XP rewards

3. Quest completion status (4 tests)
   - Return false when no steps completed
   - Return false when some steps completed
   - Return true when all steps completed
   - Return true even if steps completed out of order

4. Edge cases (3 tests)
   - Handle quest with no steps
   - Handle invalid step indices gracefully
   - Handle negative step indices

## Files Created/Modified

### New Files
1. `supabase/migrations/20260126000000_hunter_quests_schema.sql` - Database schema
2. `src/lib/hunter/sync/quests.ts` - Quest sync orchestrator
3. `src/app/api/sync/quests/route.ts` - Quest sync API route
4. `src/app/api/hunter/quests/route.ts` - Quest opportunities API
5. `src/app/api/hunter/quests/progress/route.ts` - Quest progress API
6. `src/__tests__/unit/hunter-quest-progress.test.ts` - Unit tests

### Existing Files (Verified)
1. `scripts/seed-quests.ts` - Admin seed script (already complete)

## Integration Points

### Galxe Integration
- Uses existing `syncGalxeOpportunities()` from `src/lib/hunter/sync/galxe.ts`
- Filters Galxe campaigns for quest classification
- Applies 10-minute response cache
- Handles pagination (max 5 pages = 250 campaigns)

### Database Integration
- Extends opportunities table with quest-specific columns
- Creates user_quest_progress table for tracking
- Uses RLS for user-scoped access control
- Supports upsert operations for idempotent syncs

### API Integration
- Quest opportunities endpoint supports wallet-based personalization
- Progress endpoint requires authentication
- Both endpoints follow standard error response format
- Graceful degradation on personalization failures

## Testing Results

```
✓ src/__tests__/unit/hunter-quest-progress.test.ts (18 tests) 23ms
  ✓ Quest Progress Tracking > Multi-step quest completion logic (6 tests)
  ✓ Quest Progress Tracking > XP reward calculation (5 tests)
  ✓ Quest Progress Tracking > Quest completion status (4 tests)
  ✓ Quest Progress Tracking > Edge cases (3 tests)

Test Files  1 passed (1)
     Tests  18 passed (18)
  Duration  1.03s
```

## Requirements Validated

- ✅ **Requirement 2.3**: Quest module with admin seeding
- ✅ **Requirement 3.1-3.7**: Quest-specific database schema
- ✅ **Requirement 5.1-5.11**: Quest eligibility evaluation
- ✅ **Requirement 21.1-21.10**: Galxe API integration

## Next Steps

1. Run database migration: `supabase migration up`
2. Seed quest data: `npm run seed:quests`
3. Test quest sync: `curl -X POST http://localhost:3000/api/sync/quests -H "x-cron-secret: $CRON_SECRET"`
4. Test quest API: `curl http://localhost:3000/api/hunter/quests?wallet=0x...`
5. Configure Vercel cron job for quest sync (hourly)

## Module Status

**Quests Module: COMPLETE** ✅

All subtasks completed:
- ✅ 5.1 Database schema
- ✅ 5.2 Admin seed script
- ✅ 5.3 Quest sync with Galxe integration
- ✅ 5.4 Quest-specific API endpoints
- ✅ 5.5 Unit tests for quest progress tracking

The Quests module is now ready for integration testing and deployment.
