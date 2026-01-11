# Implementation Plan: Authenticated Decision Cockpit

## Overview

This implementation plan converts the feature design into a series of incremental development tasks. The approach follows a backend-first layered strategy: database schema first, then API endpoints, followed by UI components, and finally integration and testing. Each task builds on previous work and includes validation checkpoints.

**Critical:** 8 property tests are MANDATORY for institutional-grade determinism (marked with `[MANDATORY]`).

## Route Decision

**Route:** `/cockpit` (NOT `/home` — existing `/home` routes remain untouched)

The authenticated decision cockpit lives at `/cockpit` to avoid conflicts with existing `/home` implementations.

## Reuse Existing Code Directive

**CRITICAL: Before implementing ANY task, the developer MUST:**

1. **Search the codebase** for existing implementations of the feature/component
2. **Reuse existing code** if it exists — do NOT create duplicates
3. **Extend existing code** if it partially covers the requirement
4. **Only create new code** if no existing implementation exists

**Specific areas to check before creating new:**
- Database tables: Check `supabase/migrations/` and existing schema
- API endpoints: Check `src/app/api/` and `pages/api/` for existing routes
- React components: Check `src/components/` for reusable UI components
- Hooks: Check `src/hooks/` for existing data fetching/state hooks
- Types: Check `src/types/` for existing TypeScript interfaces
- Utils: Check `src/lib/` and `src/utils/` for existing helper functions

**If existing code is found:**
- Document what was reused in the task completion notes
- Extend/modify rather than duplicate
- Import from existing locations rather than copying code

## Tasks

- [x] 1. Database Schema and Infrastructure Setup
  - Create Supabase database tables with proper RLS policies
  - Set up required indexes for performance
  - Configure environment variables and authentication
  - _Requirements: 17.1, 17.2, 17.7_

- [x] 1.1 Create shown_actions table for duplicate detection
  - Table: shown_actions (user_id UUID, dedupe_key TEXT, shown_at TIMESTAMPTZ)
  - Index: (user_id, shown_at DESC)
  - Unique constraint: (user_id, dedupe_key)
  - TTL strategy: delete rows older than 2 hours via scheduled job or partial index cleanup
  - RLS: user can read/write only their own rows
  - **Upsert semantics (Locked):** INSERT must refresh shown_at on conflict to prevent stale-row bugs:
    ```sql
    INSERT INTO shown_actions (user_id, dedupe_key, shown_at)
    VALUES ($1, $2, now())
    ON CONFLICT (user_id, dedupe_key)
    DO UPDATE SET shown_at = excluded.shown_at
    WHERE shown_actions.shown_at < now() - interval '30 seconds';
    ```
  - _Requirements: Duplicate Detection (Locked)_

- [x] 1.2 Expand cockpit_state prefs schema support
  - Ensure prefs JSONB can store timezone (IANA string)
  - Ensure daily_pulse and cockpit_state policies allow INSERT + UPDATE (upsert path)
  - _Requirements: Timezone Persistence (Locked), RLS Notes_

- [x] 1.3 [MANDATORY] Write property test for RLS isolation
  - **Property 14: Row Level Security Isolation**
  - Test: For any authenticated user, database queries only return data belonging to that user
  - Minimum 100 iterations
  - **Validates: Requirements 17.7**

- [ ] 2. Core API Endpoints Implementation

- [x] 2.1 Implement cockpit state management endpoints
  - Create POST /api/cockpit/open with debouncing logic (once per minute per user)
  - POST /api/cockpit/open MUST accept { timezone?: string }
  - Server MUST validate timezone is valid IANA (basic validation + allowlist fallback)
  - If prefs.timezone is missing, server MUST persist the provided timezone
  - Implement GET /api/cockpit/prefs and POST /api/cockpit/prefs
  - Add DND edge case: if dnd_start_local == dnd_end_local → DND disabled
  - Add proper input validation and error handling
  - _Requirements: 11.7, 11.8, 19.1, 19.3, 19.4, Timezone Persistence (Locked)_

- [x] 2.2 [MANDATORY] Write property test for cockpit open debouncing
  - **Property 11: Cockpit Open Debouncing**
  - Test: For any sequence of POST /api/cockpit/open calls from same user, only one update occurs per minute
  - Minimum 100 iterations
  - **Validates: Requirements 11.8**

- [x] 3. Source Adapter System Implementation

- [x] 3.1 Implement unified action model adapters
  - Create Guardian findings adapter with provenance mapping
  - Implement Hunter opportunities adapter with expiration handling
  - Add Portfolio deltas and Action Center adapters
  - Each adapter MUST output the unified Action model (Appendix F1)
  - **Timestamp contract (Locked):** Adapters MUST provide `created_at` + `updated_at` internally for freshness computation (stripped before response)
  - _Requirements: F2.1, F2.2, F2.3_

- [x] 3.2 Implement action scoring and ranking service
  - Implement ranking pipeline (Locked order):
    1. Adapter normalization: source item → Action draft (with internal created_at/updated_at)
    2. Provenance gating: heuristic + Fix/Execute → downgrade to Review + is_executable=false
    3. Candidate selection: Fix/Execute require is_executable=true; Review allowed
    4. Score computation: urgency_score, relevance_score (0-30), freshness, total score
    5. Sort + tie-breaks (Locked): severity → expires_at rule → relevance → event_time
  - **Exact scoring weights (Locked):**
    - lane_weight: Protect +80, Earn +50, Watch +20
    - severity_weight: critical +100, high +70, med +40, low +10
    - urgency_weight: <24h +90, <72h +60, else +0
    - freshness_weight: new +25, updated +15, expiring +20, stable +0
    - relevance_score: 0–30 (explicit field, used in tie-breaks)
    - burst_weight: +10 (if aggregated similar events)
    - degraded_penalty: -25 (if degraded_mode=true)
    - duplicate_penalty: -30 (if dedupe_key shown in last 2h)
  - **Duplicate penalty rule (Locked):**
    ```sql
    IF EXISTS (SELECT 1 FROM shown_actions 
               WHERE user_id = ? AND dedupe_key = ? 
               AND shown_at > now() - interval '2 hours')
    THEN score -= 30
    ```
  - Implement urgency_score computation (Locked):
    - expires_at null → 0
    - <24h → 90-100 (90 + clamp based on closeness)
    - <72h → 60-89
    - else → 0
  - Implement freshness derivation (Locked):
    - expiring if expires_at within 72h
    - else new if event_time > last_opened_at
    - else updated if updated_at > last_opened_at AND updated_at != created_at
    - else stable
  - Implement duplicate detection with dedupe_key = source.kind + ":" + source.ref_id + ":" + cta.kind
  - Response MUST include is_executable and relevance_score per action
  - Client MUST treat ordering as authoritative (no client re-rank)
  - _Requirements: 6.1, 6.2, 6.9, Ranking Pipeline (Locked)_

- [x] 4. Cockpit Summary Endpoint Implementation

- [x] 4.1 Implement GET /api/cockpit/summary endpoint
  - Accept wallet_scope parameter (active | all)
  - Validate "active" wallet belongs to user
  - Implement Today Card state machine logic (priority order):
    1. onboarding
    2. scan_required
    3. critical_risk
    4. pending_actions
    5. daily_pulse
    6. portfolio_anchor
  - Return action_preview (max 3), counters, provider_status, degraded_mode
  - _Requirements: 3.3, 3.4, 6.1, 6.9, 16.1, 16.2_

- [x] 4.2 [MANDATORY] Write property test for Today Card priority determinism
  - **Property 4: Today Card Priority Determinism**
  - Test: For any set of input conditions, Today Card state is determined by evaluating conditions in exact order and selecting first true
  - Minimum 100 iterations
  - **Validates: Requirements 3.3, 3.4**

- [x] 4.3 [MANDATORY] Write property test for action ranking algorithm
  - **Property 6: Action Ranking Algorithm**
  - Test: For any set of actions, ranking score is calculated using exact formula with specified weights
  - Minimum 100 iterations
  - **Validates: Requirements 6.1**

- [x] 4.4 [MANDATORY] Write property test for action ranking tie-breakers
  - **Property 7: Action Ranking Tie-Breakers**
  - Test: For any set of actions with identical scores, ordering follows tie-breakers in exact sequence
  - Tie-breaker order: higher severity → expires_at rule → higher relevance → newer event_time
  - expires_at rule: if both have expires_at, sooner wins; if only one has expires_at, it wins; if both null, skip
  - Minimum 100 iterations
  - **Validates: Requirements 6.9**

- [x] 4.5 Implement POST /api/cockpit/actions/rendered endpoint ✓
  - Body: { dedupe_keys: string[] } (max 3)
  - Server writes shown_actions rows with shown_at=now()
  - MUST be called only after ActionPreview actually renders
  - **Upsert with refresh (Locked):** Use ON CONFLICT DO UPDATE to refresh shown_at (see Task 1.1 SQL)
  - Guard against re-render spam: only update if shown_at < now() - 30 seconds
  - _Requirements: Duplicate Detection (Locked)_

- [x] 5. Daily Pulse Engine Implementation

- [x] 5.1 Implement pulse generation logic
  - Create timezone-aware pulse generation (9am user local time)
  - Implement "new since last" tracking logic
  - Add pulse content constraints: max 8 rows total, max 3 per category
  - Must include at least one of: expiring soon, new since last, portfolio delta
  - _Requirements: 9.1, 9.2, 11.2, 11.3_

- [x] 5.2 Implement GET /api/cockpit/pulse endpoint
  - Accept date parameter (YYYY-MM-DD)
  - Create pulse retrieval with on-demand generation fallback
  - _Requirements: 9.2, 16.3_

- [x] 6. Checkpoint - Backend API Validation
  - Ensure all API endpoints return proper response format (data, error, meta with ts)
  - Verify rate limiting and authentication work correctly
  - Test database operations and RLS policies
  - Ask the user if questions arise

- [x] 7. Investment Primitives Implementation

- [x] 7.1 Implement save/bookmark functionality
  - Create POST /api/investments/save endpoint
  - Add investment semantics (save vs bookmark vs wallet_role)
  - Implement relevance scoring integration
  - _Requirements: 12.1, 12.4, 12.6_

- [x] 7.2 Implement alert rules system
  - Create GET /api/alerts/rules and POST /api/alerts/rules endpoints
  - Add rule validation and storage
  - Integrate with relevance scoring
  - _Requirements: 12.3, 12.5, 12.6_

- [x] 8. Web Push Notifications Implementation

- [x] 8.1 Implement notification subscription endpoints
  - Create POST /api/notifications/subscribe and unsubscribe
  - Add subscription validation and storage
  - Implement dev-only test endpoint (5/day/user limit)
  - _Requirements: 13.1, 13.2, 13.8_

- [x] 8.2 Implement notification sending logic
  - Add DND hours enforcement (default 10pm-8am local)
  - Add daily caps enforcement (max 3/day)
  - Create notification categories (critical, daily_pulse, expiring_soon)
  - _Requirements: 13.5, 13.6, 13.7_

- [x] 9. Frontend Component Implementation

- [x] 9.1 Create Today Card component
  - Implement deterministic state rendering based on server-provided kind
  - Add header chrome support (demo pill, insights icon)
  - Ensure exactly 1 anchor metric, 1 context line, 1 primary CTA
  - Header chrome does NOT count as anchor/context/CTA
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 9.2 Create Action Preview component
  - Implement 3-row maximum constraint
  - Add lane indicators, impact chips (max 2), provenance chips
  - Implement provenance gating display (heuristic → Review only)
  - Client MUST render in server-provided order (no re-ranking)
  - Call POST /api/cockpit/actions/rendered after render
  - _Requirements: 5.1, 5.2, 5.6, 5.7_

- [x] 9.3 Create Peek Drawer component
  - Implement bottom sheet modal (80vh mobile, 640px max desktop)
  - Add collapsible sections with row limits (1-5 each)
  - Implement focus trap, aria-modal, focus restoration
  - Close: swipe down (mobile), overlay click, ESC key
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 9.4 Create Insights Sheet component
  - Implement full-screen overlay
  - Add provider status and preference controls
  - Include launcher fallback logic (top-right icon in Today Card if chrome unavailable)
  - _Requirements: 8.1, 8.2, 8.6, 8.7_

- [x] 10. Authentication and Demo Mode Implementation

- [x] 10.1 Implement authentication flow
  - Add unauthenticated redirect logic (redirect to /)
  - Create demo mode exception handling (/cockpit?demo=1)
  - _Requirements: 1.1, 1.3, 1.6_

- [x] 10.2 [MANDATORY] Write property test for unauthenticated access control
  - **Property 1: Unauthenticated Access Control**
  - Test: For any unauthenticated user request to /cockpit (excluding demo mode), system redirects to / and never renders authenticated dashboard
  - Minimum 100 iterations
  - **Validates: Requirements 1.1, 1.3**

- [x] 10.3 [MANDATORY] Write property test for demo mode exception
  - **Property 2: Demo Mode Exception**
  - Test: For any unauthenticated user request to /cockpit?demo=1, system bypasses redirect and renders static demo cockpit without calling authenticated APIs
  - Minimum 100 iterations
  - **Validates: Requirements 1.6, 1.7**

- [x] 10.4 Implement demo mode UX (Locked)
  - Add persistent "Demo Mode" pill in TodayCard header chrome
  - Disable Fix/Execute CTAs with "Demo" tooltips
  - Review actions: open local read-only preview (modal/sheet) OR show "Demo" tooltip
  - Demo mode MUST NOT navigate to authenticated routes (/action-center, /guardian, etc.)
  - Demo mode MUST NOT call /api/cockpit/* endpoints
  - Demo mode MUST NOT write any state
  - Render static demo payload only
  - _Requirements: 1.7, 1.8, Demo mode UX (Locked)_

- [x] 11. Runtime Data Flow Implementation

- [x] 11.1 Implement parallel data fetching
  - On mount: start fetching prefs + summary in parallel
  - Immediately fetch summary with wallet_scope="active" (default)
  - When prefs returns: if wallet_scope_default="all", refetch summary
  - POST /api/cockpit/open after first meaningful render (debounced server-side)
  - Body MUST include: { timezone?: string } from Intl.DateTimeFormat().resolvedOptions().timeZone
  - _Requirements: Performance optimization, Timezone Persistence (Locked)_

- [x] 11.2 Implement three-block layout enforcement
  - Ensure exactly: App Shell chrome, Today Card, Action Preview
  - Add layout validation and error boundaries
  - _Requirements: 2.1, 2.2_

- [ ] 12. Pulse Sheet Navigation Implementation

- [ ] 12.1 Implement hash-based navigation
  - /cockpit#pulse MUST open Pulse full-screen sheet
  - Closing MUST remove hash (back to /cockpit) without full reload
  - Mobile: swipe-down closes; Desktop: ESC closes
  - Must restore focus to the CTA that opened it
  - _Requirements: Pulse Sheet Navigation (Locked)_

- [ ] 13. Error Handling and Degraded Mode

- [ ] 13.1 Implement degraded mode detection
  - Add provider status monitoring
  - Implement graceful degradation logic
  - Disable Fix/Execute in degraded mode, keep Review enabled
  - Surface staleness indicator + retry CTA
  - _Requirements: 15.1, 15.2, 15.4_

- [ ] 13.2 Implement error boundaries
  - Add React Error Boundaries for major sections
  - If Today Card UI fails: render safe error state with Retry CTA (do not reclassify kind client-side)
  - Action Preview errors: show empty state with retry CTA
  - Peek Drawer errors: disable drawer but preserve main surface
  - _Requirements: Error boundary behavior_

- [ ] 13.3 [MANDATORY] Write property test for API response format
  - **Property 13: API Response Format**
  - Test: For any API endpoint response, structure includes { data, error, meta: { ts } } with server timestamp
  - Minimum 100 iterations
  - **Validates: Requirements 16.6**

- [ ] 14. Performance and Caching Implementation

- [ ] 14.1 Implement risk-aware caching
  - Add SWR with risk-aware TTL values:
    - critical_risk: 10s
    - scan_required: 15s
    - pending_actions: 20s
    - healthy/pulse: 60s
  - Implement cache invalidation logic
  - _Requirements: 14.4, 14.5_

- [ ] 14.2 Optimize for performance SLOs
  - /cockpit first meaningful paint < 1.2s on mobile
  - GET /api/cockpit/summary: p50 < 150ms, p95 < 400ms, p99 < 900ms
  - Drawer open latency < 100ms
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 15. Final Integration and Testing

- [ ] 15.1 Integration testing
  - Test complete user flows end-to-end
  - Verify all API endpoints work together
  - Test authentication and demo mode flows
  - _Requirements: All integration requirements_

- [ ] 15.2 Write remaining property tests (optional)
  - Property 3: Three Block Layout Constraint
  - Property 5: Action Preview Row Limit
  - Property 8: Daily Pulse Timezone Generation
  - Property 9: New Since Last Logic
  - Property 10: Home Open State Update
  - Property 12: Notification Permission Timing
  - Property 15: Source Adapter Mapping
  - Ensure 100 iterations minimum per test

- [ ] 15.3 Performance validation
  - Measure and validate SLO compliance
  - Test caching behavior under load
  - Verify degraded mode performance
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 16. Final Checkpoint - Complete System Validation
  - Ensure all acceptance tests pass
  - Verify Today Card priority order works correctly
  - Test notification permission timing
  - Validate RLS policies and data isolation
  - Confirm demo mode and degraded mode behavior
  - Ask the user if questions arise

## Mandatory Property Tests Summary

The following 8 property tests are REQUIRED for institutional-grade determinism:

| Task | Property | Description |
|------|----------|-------------|
| 1.3 | P14 | RLS Isolation - users only see their own data |
| 2.2 | P11 | Cockpit Open Debouncing - once per minute per user |
| 4.2 | P4 | Today Card Priority - deterministic state selection |
| 4.3 | P6 | Action Ranking Algorithm - exact score formula |
| 4.4 | P7 | Action Ranking Tie-Breakers - exact ordering |
| 10.2 | P1 | Unauthenticated Access Control - redirect to / |
| 10.3 | P2 | Demo Mode Exception - bypass redirect, no API calls |
| 13.3 | P13 | API Response Format - consistent { data, error, meta } envelope |

## Notes

- Tasks marked with `[MANDATORY]` are required property-based tests and MUST NOT be skipped
- Tasks in section 15.2 are optional property tests that can be added for additional coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and catch issues early
- Property tests validate universal correctness properties with 100+ iterations
- The implementation follows a backend-first approach to establish solid foundations
- All business logic MUST be server-side; UI is presentation only
- Client MUST treat server-provided ordering as authoritative (no re-ranking)
