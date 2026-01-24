# Critical Fixes Applied to Hunter Demand-Side Spec

## Summary

All 10 critical fixes have been applied to requirements.md, design.md, and tasks.md to ensure correct implementation.

## Fixes Applied

### 1. ✅ Schema Bug: source_id vs source_ref
**Problem:** Inconsistent field naming (source_id vs source_ref)
**Fix:** Standardized on `source_ref` (text) throughout all documents
- Updated Requirement 3.1
- Updated all database schema sections
- Updated all sync job implementations

### 2. ✅ Wallet Signals: Infeasible RPC Logic
**Problem:** Cannot get first_tx_block from plain RPC cheaply
**Fix:** Use Alchemy Transfers API for wallet age, return null if unavailable
- Updated Requirement 4.2-4.5
- Updated Wallet Signals Service design
- Added ALCHEMY_TRANSFERS_API_KEY environment variable
- Removed impossible "first_tx_block via RPC" logic

### 3. ✅ Ranking: Score Clamping
**Problem:** Relevance/freshness/overall scores could exceed 1.0
**Fix:** Added explicit clamping to [0, 1] for all scores
- Updated Requirement 6.7, 6.11, 6.12
- Updated Ranking Engine implementation strategy
- Added clamp operations after each score calculation

### 4. ✅ UI Changes: Unrealistic "No UI Changes"
**Problem:** Cannot complete all 7 modules without UI support
**Fix:** Changed to "Minimal UI changes allowed"
- Add RWA + Strategies tabs in Hunter
- Add Referrals entry in Settings
- Add eligibility badge + reasons tooltip display
- Updated design principles in all documents

### 5. ✅ API Pattern: Mixed Endpoint Strategy
**Problem:** Spec mixed single endpoint + multiple module endpoints
**Fix:** Clarified MVP uses single endpoint with type filter
- Primary: `/api/hunter/opportunities?type=...&walletAddress=...`
- Module endpoints are optional thin wrappers
- Updated all API route descriptions

### 6. ✅ Eligibility: Top 50 Selection Conflict
**Problem:** Selecting top 50 by trust_score misses high-relevance items
**Fix:** Preselect candidates by hybrid score before computing eligibility
- Preselect top 100 by: `(trust_score * 0.7 + recency_boost * 0.3)`
- Then compute eligibility for top 50 of preselected
- Updated Requirement 11.2-11.3
- Updated API route implementation

### 7. ✅ Referrals: Underspecified Activation
**Problem:** "Wallet connected + any completion event" was vague
**Fix:** Defined precisely as first tracked action
- Activation = first `user_opportunities.status = 'completed'` event
- Updated Requirement 19.5-19.6
- Updated referral activation logic in tasks

### 8. ✅ Strategies: Trust Score Confusion
**Problem:** Mixed "trust_score" with "Guardian trust aggregation"
**Fix:** Store cached computed value + breakdown
- Added `strategies.trust_score_cached` column
- Added `strategies.steps_trust_breakdown` JSONB column
- Recompute on strategy create/update
- Return both cached score and breakdown
- Updated Requirement 18.1-18.10
- Updated database schema and API endpoints

### 9. ✅ Property 20: Hybrid Preselection Mismatch
**Problem:** Property 20 said "top 50 by trust_score" but should match hybrid preselection rule
**Fix:** Updated Property 20 to match hybrid preselection logic
- Changed from "top 50 opportunities by trust_score"
- To "preselect top 100 by hybrid score (trust_score * 0.7 + recency_boost * 0.3), then compute eligibility for top 50 of preselected candidates"
- Updated Property 20 validation to reference Requirements 11.2, 11.3
- Updated Cost Control section in Eligibility Engine design

### 10. ✅ Eligibility Cache TTL: Table vs Query Enforcement
**Problem:** Eligibility cache TTL not enforced in table - needs query-based implementation
**Fix:** Clarified TTL enforcement via query timestamp check
- Added note in Cache Check: "TTL is enforced via query timestamp check, not automatic table expiration"
- Updated Cache Store to always update `updated_at` timestamp on upsert
- Clarified query pattern: `WHERE created_at > NOW() - INTERVAL '24 hours'`
- Updated Cost Control to specify: "Cache results for 24 hours (enforced via query)"
- Added note: "The table does not auto-delete old records"

## Files Updated

1. `.kiro/specs/hunter-demand-side/requirements.md`
   - Added "Critical Implementation Rules" section at top
   - Fixed 8 requirements with precise acceptance criteria

2. `.kiro/specs/hunter-demand-side/design.md`
   - Added "Critical Implementation Rules" section at top
   - Updated Wallet Signals Service implementation
   - Updated Ranking Engine with clamping
   - Updated API route with hybrid preselection
   - Updated Strategies schema
   - Fixed Property 20 to match hybrid preselection rule
   - Clarified eligibility cache TTL enforcement via query

3. `.kiro/specs/hunter-demand-side/tasks.md`
   - Added "Critical Implementation Rules" in Overview
   - Updated 8 tasks with correct implementation details
   - Added specific sub-tasks for new requirements

## Verification Checklist

Before implementation, verify:

- [ ] Database uses `source_ref` (not `source_id`)
- [ ] Wallet age only computed if Alchemy Transfers API available
- [ ] All scores clamped between 0 and 1
- [ ] Single endpoint `/api/hunter/opportunities?type=...` implemented
- [ ] RWA/Strategies tabs added to Hunter UI
- [ ] Referrals entry added to Settings
- [ ] Eligibility badges displayed on cards
- [ ] Hybrid preselection before eligibility computation: top 100 by `(trust_score * 0.7 + recency_boost * 0.3)`, then top 50 for eligibility
- [ ] Referral activation on first `user_opportunities.status = 'completed'`
- [ ] Strategy trust stored as `trust_score_cached` + `steps_trust_breakdown`
- [ ] Property 20 validates hybrid preselection (not simple trust_score sort)
- [ ] Eligibility cache TTL enforced via query: `created_at > NOW() - INTERVAL '24 hours'`
- [ ] Cache upsert always updates `updated_at` timestamp

## Next Steps

The spec is now ready for implementation. All critical bugs have been fixed. Developers can proceed with confidence that:

1. Schema will be consistent (source_ref)
2. Wallet signals will work without impossible RPC calls
3. Ranking scores will be mathematically correct (clamped)
4. API pattern is clear (single endpoint)
5. UI changes are minimal but sufficient
6. Eligibility selection won't miss high-relevance items (hybrid preselection)
7. Referral activation is precisely defined
8. Strategy trust is properly cached and computed
9. Property 20 correctly validates hybrid preselection logic
10. Eligibility cache TTL is enforced via query, not table auto-expiration

Start with Phase 0 (Shared Foundations) and proceed through the 7 modules in order.
