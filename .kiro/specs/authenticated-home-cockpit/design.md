# Design Document

## Overview

The Authenticated Home "Decision Cockpit" is a new `/home` route that serves as the primary authenticated dashboard for AlphaWhale users. The design emphasizes calm, focused decision-making through a strict three-block layout that prioritizes actionable insights over information density. The system implements a deterministic state machine for Today Card prioritization, a sophisticated action ranking algorithm, and retention-focused features like Daily Pulse and investment primitives.

The architecture follows a clear separation of concerns: the UI presents information and captures user input, while all business logic, calculations, and data processing occur server-side through API endpoints and database operations. This ensures security, consistency, and enables future scalability.

## Architecture

### System Architecture

The system follows a layered architecture pattern:

**Presentation Layer (React/Next.js)**
- `/home` route with three-block layout enforcement
- Peek Drawer (bottom sheet) for expanded signal viewing
- Insights Sheet (full-screen) for system status and preferences
- Demo mode with static data and disabled actions

**API Layer (Next.js API Routes)**
- Thin orchestration layer for authentication and data formatting
- Endpoints for home summary, pulse data, preferences, and notifications
- Rate limiting and input validation

**Business Logic Layer (Server-side)**
- Today Card state machine with deterministic priority evaluation
- Action ranking algorithm with configurable weights
- Daily Pulse generation with timezone awareness
- Investment primitives (save/bookmark, alerts, wallet roles)

**Data Layer (Supabase PostgreSQL)**
- User state tracking (last opened, preferences)
- Daily pulse storage keyed by (user_id, pulse_date) with index (user_id, pulse_date desc)
- Investment and alert rule persistence
- Web push subscription management
- Row Level Security for data isolation

### Component Architecture

The UI follows a strict component hierarchy:

```
/home
├── AppShellChrome (existing, out of scope)
├── TodayCard (north star anchor)
│   ├── AnchorMetric
│   ├── ContextLine
│   ├── PrimaryCTA
│   ├── SecondaryCTA (optional)
│   └── HeaderChrome (demo pill, insights icon)
├── ActionPreview (max 3 rows)
│   └── ActionRow[]
│       ├── LaneIndicator
│       ├── Title
│       ├── ImpactChips (max 2)
│       ├── ProvenanceChip
│       └── CTA
├── PeekDrawer (bottom sheet)
│   └── SignalSections[]
└── InsightsSheet (full screen)
    ├── ProviderStatus
    ├── CoverageInfo
    ├── PreferenceControls
    └── DocumentationLinks
```

## Components and Interfaces

### Today Card Component

The Today Card implements a deterministic state machine with six possible states:

**State Priority Order (evaluated sequentially):**
1. `onboarding` - User needs setup (0 wallets, no scans, no engagement)
2. `scan_required` - Scan data missing or stale beyond thresholds
3. `critical_risk` - Active critical security findings
4. `pending_actions` - Items awaiting user action in Action Center
5. `daily_pulse` - Fresh pulse content available
6. `portfolio_anchor` - Fallback showing portfolio summary

**State Input Computation:**
```typescript
interface TodayCardInputs {
  onboarding_needed: boolean;
  scan_state: "fresh" | "stale" | "missing";
  critical_risk_count: number;
  pending_actions_count: number;
  daily_pulse_available: boolean;
  degraded_mode: boolean;
}
```

**UI Contract:**
- Exactly 1 anchor metric (large, prominent)
- Exactly 1 context line (explanatory text)
- Exactly 1 primary CTA (button)
- Optional secondary CTA (text link, non-competing)
- Optional header chrome (demo pill, insights icon) - does NOT count as anchor metric, context line, or CTA

### Action Preview Component

Displays the top 3 ranked executable actions using a sophisticated scoring algorithm:

**Unified Action Model:**
```typescript
interface Action {
  id: string;
  lane: "Protect" | "Earn" | "Watch";
  title: string;
  severity: "critical" | "high" | "med" | "low";
  provenance: "confirmed" | "simulated" | "heuristic";
  // Gating result (server-authoritative)
  is_executable: boolean;
  cta: { kind: "Fix" | "Execute" | "Review", href: string };
  impact_chips: ImpactChip[]; // max 2
  // RFC3339/ISO8601
  event_time: string; // "2026-01-09T16:10:00Z"
  expires_at: string | null; // "2026-01-09T16:10:00Z"
  freshness: "new" | "updated" | "expiring" | "stable";
  // Computed server-side
  urgency_score: number; // 0-100
  relevance_score: number; // 0-30 (used for tie-breaks)
  score: number; // total score (authoritative ordering)
  source: {
    kind: "guardian" | "hunter" | "portfolio" | "action_center" | "proof";
    ref_id: string;
  };
}
```

**Ranking Algorithm:**
```
score = lane_weight + severity_weight + urgency_weight + 
        freshness_weight + relevance_weight + burst_weight + penalty_weight

Weights:
- lane_weight: Protect +80, Earn +50, Watch +20
- severity_weight: critical +100, high +70, med +40, low +10
- urgency_weight: <24h +90, <72h +60, else +0
- freshness_weight: new +25, updated +15, expiring +20, stable +0
- relevance_weight: 0-30 (holdings, wallet role, saved tags)
- burst_weight: +10 (aggregated events)
- penalty_weight:
  - heuristic_execution: disqualify (handled by provenance gating + candidate selection; MUST NOT appear as Fix/Execute)
  - degraded: -25
  - duplicate: -30
```

**Ranking Pipeline (Locked):**
Server MUST apply this pipeline in order:

1) Adapter normalization: source item → Action draft
2) Provenance gating:
   - If provenance="heuristic" and CTA would be Fix/Execute:
     - MUST downgrade cta.kind="Review"
     - MUST set is_executable=false
   - Otherwise set is_executable based on provenance + degraded_mode rules
3) Candidate selection for Action_Preview:
   - Action_Preview MAY include non-executable actions only if cta.kind="Review"
   - Actions with cta.kind in ("Fix","Execute") MUST have is_executable=true to be eligible
4) Score computation: compute urgency_score, relevance_score, freshness, then total score using the specified weights
5) Sorting:
   - Primary: score DESC
   - Tie-breakers (Locked): higher severity → expires_at rule → higher relevance_score → newer event_time
6) Output: server returns actions already ordered; client MUST render in given order and MUST NOT re-rank

**Tie-Breaker Rules (Locked):**
- Higher severity wins
- Then: if both have expires_at, sooner wins; if only one has expires_at, it wins; if both null, skip
- Then higher relevance wins
- Then newer event_time wins

**Urgency Score Computation (Locked):**
- If expires_at is null → urgency_score = 0
- Else compute minutes remaining and bucket:
  - <24h → urgency_score = 90-100 (90 + clamp(0-10) based on closeness)
  - <72h → urgency_score = 60-89
  - else → urgency_score = 0

**Freshness Derivation (Locked):**
- Freshness is computed server-side by adapters using each source item's native timestamps:
  - created_at (required)
  - updated_at (optional)
- The unified Action model does NOT need to expose created_at/updated_at; only the computed `freshness` is returned
- Precedence:
  1) expiring if expires_at is within 72h
  2) else new if event_time > last_opened_at
  3) else updated if (updated_at exists) AND (updated_at > last_opened_at) AND (updated_at != created_at)
  4) else stable
- Correctness Lock: client MUST treat `freshness` as authoritative and MUST NOT recompute freshness

**Duplicate Detection (Locked):**
- Define dedupe_key = source.kind + ":" + source.ref_id + ":" + cta.kind
- If same dedupe_key was shown in Action_Preview within last 2 hours → apply -30 penalty
- shown_actions is per-user, stores (dedupe_key, shown_at)
- Entries expire after 2 hours
- Must be written only when an action is actually rendered in Action_Preview (not just returned by API)

**Provenance Gating:**
- `confirmed`: Allow Fix/Execute
- `simulated`: Allow Fix/Execute with simulation preview
- `heuristic`: If cta.kind in ("Fix","Execute") → adapter MUST downgrade cta.kind="Review" and mark is_executable=false
- Degraded mode: Disable Fix/Execute, allow Review only

### Peek Drawer Component

Bottom sheet modal (80vh mobile, 640px max desktop) with collapsible sections:

**Sections (1-5 rows each):**
- Daily Pulse (teaser of top items)
- Expiring Opportunities (<72h remaining)
- Guardian Deltas (new approvals, risky changes)
- Portfolio Pulse (significant price/position changes)
- Proof/Receipts (recent transaction confirmations)
- Alerts (high severity notifications)

**Interaction:**
- Open: "See all signals" CTA
- Close: swipe down (mobile), overlay click, ESC key
- Accessibility: focus trap, aria-modal, focus restoration

### Insights Sheet Component

Full-screen overlay for system status and preferences:

**Content Sections:**
- Provider Status: online/degraded/offline indicators with retry CTAs
- Coverage Info: chains, wallets, last refresh timestamps
- Preference Controls: DND hours, notification caps, wallet scope
- Documentation: links to terms, privacy, help docs

**Launcher Location:**
- Primary: existing App Shell chrome "Status/More" icon
- Fallback: top-right icon inside Today Card (if chrome unavailable)

## Data Models

### Home State Model

Tracks user session state and preferences:

```sql
CREATE TABLE home_state (
  user_id UUID PRIMARY KEY,
  last_opened_at TIMESTAMPTZ,
  last_pulse_viewed_date DATE,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Preferences Schema:**
```typescript
interface HomePreferences {
  wallet_scope_default: "active" | "all";
  timezone?: string; // IANA, e.g. "America/Chicago" (server persists if missing)
  dnd_start_local: string; // "HH:MM"
  dnd_end_local: string;   // "HH:MM"
  notif_cap_per_day: number;
}
```

### Daily Pulse Model

Stores timezone-aware daily digests:

```sql
CREATE TABLE daily_pulse (
  user_id UUID NOT NULL,
  pulse_date DATE NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pulse_date)
);
```

**Pulse Content Constraints:**
- Maximum 8 rows total
- Maximum 3 rows per category
- Must include at least one: expiring soon, new since last, or portfolio delta
- Generated at 9am user timezone, on-demand fallback

### Investment Primitives Model

Tracks user engagement and personalization:

```sql
CREATE TABLE user_investments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('save','bookmark','wallet_role')),
  ref_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);
```

**Investment Types:**
- `save`: User wants this to affect ranking/personalization (relevance_weight)
- `bookmark`: User wants quick access later; MAY affect relevance but lower weight
- `wallet_role`: Role assignment for address; affects relevance_weight strongly

### Investment Semantics (Locked)
- save: user wants this to affect ranking/personalization (relevance_weight)
- bookmark: user wants quick access later; MAY affect relevance but lower weight  
- wallet_role: role assignment for address; affects relevance_weight strongly

### Alert Rules Model

Stores user-defined notification rules:

```sql
CREATE TABLE alert_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  rule JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Web Push Subscriptions Model

Manages browser push notification registrations:

```sql
CREATE TABLE web_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
```

### RLS Notes
- daily_pulse MUST allow insert + update (upsert path)
- home_state MUST allow insert + update (first open creates row, later updates)

## Runtime Data Flow (Locked)

### /home (authenticated)
On mount:
1) Start fetching prefs (`GET /api/home/prefs`) and summary in parallel
2) Immediately fetch summary with wallet_scope="active" (default)
3) When prefs returns:
   - if wallet_scope_default="all", refetch summary with wallet_scope="all"
4) POST /api/home/open after first meaningful render (debounced server-side)
   - Body MUST include: { timezone?: string }

### /home?demo=1 (demo mode)
On mount:
- MUST NOT call `/api/home/*`
- MUST NOT write `home_state`
- Render static demo payload

Demo mode UX (Locked):
- Persistent "Demo Mode" pill in TodayCard header chrome
- Fix/Execute CTAs disabled and show "Demo" tooltip on hover/tap
- Review actions may remain enabled (optional) BUT:
  - In demo mode, Review MUST open a local read-only preview (modal/sheet) OR show a "Demo" tooltip
  - Demo mode MUST NOT navigate to authenticated routes (e.g., /action-center, /guardian, etc.)
  - Demo mode MUST NOT write any state

### Timezone Source (Locked)
- Primary: user profile timezone if available
- Else: client-resolved IANA timezone passed to server (e.g., during subscribe or first /home open)
- Server stores timezone for consistent pulse + DND behavior

### Timezone Persistence (Locked)
- Canonical storage location: `home_state.prefs.timezone` (IANA timezone string)
- On first authenticated /home open:
  - Client MUST include `timezone` in `POST /api/home/open` if available via `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - Server MUST persist prefs.timezone if it is missing and the provided value is valid IANA
- Daily Pulse and DND evaluation MUST use the persisted timezone; if missing, fall back to UTC and mark degraded_mode=true for pulse scheduling only

### Wallet Scope Definition (Locked)
- wallet_scope=active = the current selected wallet in WalletContext
- wallet_scope=all = all wallets linked to the user
- Server must validate that "active" wallet belongs to the user

### Preference Validation Rules (Locked)
- notif_cap_per_day: integer 0-10
- dnd_start_local/dnd_end_local: HH must be 00-23, MM must be 00-59, store normalized HH:MM (zero-padded)
- If dnd_start_local == dnd_end_local → treat DND as disabled (no quiet hours)
- DND may cross midnight (22:00 → 08:00 is valid)
- Server stores prefs normalized (strings preserved, validated)

### Timestamp Formats (Locked)
- All timestamp fields use RFC3339/ISO8601 format: "2026-01-09T16:10:00Z"
- Applies to: event_time, expires_at, meta.ts

## Pulse Sheet Navigation (Locked)
- Navigating to `/home#pulse` MUST open the Pulse full-screen sheet
- Closing MUST remove the hash (back to `/home`) without full reload
- Mobile: swipe-down closes; Desktop: ESC closes
- Must restore focus to the CTA that opened it

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property-Based Testing Overview

Property-based testing validates software correctness by testing universal properties across many generated inputs. Each property is a formal specification that should hold for all valid inputs, providing mathematical proof of system correctness.

### Converting EARS to Properties

Based on the prework analysis, the following acceptance criteria are testable as properties:

**Property 1: Unauthenticated Access Control**
*For any* unauthenticated user request to `/home` (excluding demo mode), the system should redirect to `/` and never render the authenticated dashboard
**Validates: Requirements 1.1, 1.3**

**Property 2: Demo Mode Exception**
*For any* unauthenticated user request to `/home?demo=1`, the system should bypass redirect and render the static demo cockpit without calling authenticated APIs
**Validates: Requirements 1.6, 1.7**

**Property 3: Three Block Layout Constraint**
*For any* authenticated `/home` request, the rendered main surface should contain exactly three blocks: App Shell chrome, Today_Card, and Action_Preview
**Validates: Requirements 2.1**

**Property 4: Today Card Priority Determinism**
*For any* set of input conditions, the Today Card state should be determined by evaluating conditions in exact order (onboarding, scan_required, critical_risk, pending_actions, daily_pulse, portfolio_anchor) and selecting the first true condition
**Validates: Requirements 3.3, 3.4**

**Property 5: Action Preview Row Limit**
*For any* number of candidate actions, the Action_Preview should display at most 3 rows regardless of how many actions are available
**Validates: Requirements 5.1**

**Property 6: Action Ranking Algorithm**
*For any* set of actions, the ranking score should be calculated using the exact formula: lane_weight + severity_weight + urgency_weight + freshness_weight + relevance_weight + burst_weight + penalty_weight with specified weights
**Validates: Requirements 6.1**

**Property 7: Action Ranking Tie-Breakers**
*For any* set of actions with identical scores, the ordering should follow tie-breakers in exact sequence: higher severity, then if both have expires_at sooner wins (if only one has expires_at it wins, if both null skip), then higher relevance, then newer event_time
**Validates: Requirements 6.9**

**Property 8: Daily Pulse Timezone Generation**
*For any* user timezone, the Daily_Pulse should be generated at 9am local time and respect timezone boundaries for date calculation
**Validates: Requirements 9.1**

**Property 9: New Since Last Logic**
*For any* item with event_time greater than the user's last_opened_at timestamp, the system should mark the item as NEW
**Validates: Requirements 11.2**

**Property 10: Home Open State Update**
*For any* call to POST /api/home/open, the system should update the user's last_opened_at to the current timestamp
**Validates: Requirements 11.7**

**Property 11: Home Open Debouncing**
*For any* sequence of POST /api/home/open calls from the same user, only one update should occur per minute regardless of call frequency
**Validates: Requirements 11.8**

**Property 12: Notification Permission Timing**
*For any* user who completes a meaningful action (first scan, first save/bookmark, or first alert rule), the system should prompt for notification permission and never prompt on page load
**Validates: Requirements 13.4**

**Property 13: API Response Format**
*For any* API endpoint response, the structure should include data, error, and meta fields with server timestamp in the meta field
**Validates: Requirements 16.6**

**Property 14: Row Level Security Isolation**
*For any* authenticated user, database queries should only return data belonging to that user and never expose other users' data
**Validates: Requirements 17.7**

**Property 15: Source Adapter Mapping**
*For any* source system item (Guardian findings, Hunter opportunities, Portfolio deltas, Action Center items, Proof receipts), the adapter should map to the unified action model following the specified rules for lane, severity, provenance, and expiration
**Validates: Requirements F2.1, F2.2**

## Error Handling

### Degraded Mode Operation

When providers are degraded or offline, the system implements graceful degradation:

**Detection Criteria:**
- Primary RPC/provider offline for any chain in wallet scope
- Provider degraded with p95 latency > 1200ms for 5+ minutes  
- Guardian/Hunter indexer stale beyond 2x chain staleness threshold

**Degraded Mode Behavior:**
- Disable Fix/Execute actions (force Review only)
- Display cached data with staleness indicators
- Show retry CTAs for failed operations
- Surface provider status in Insights Sheet

### API Error Handling

All API endpoints follow consistent error response format:

```typescript
interface ErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    retry_after_sec?: number;
  };
  meta: { ts: string };
}
```

**Error Categories:**
- `VALIDATION_ERROR` (400): Invalid input parameters
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Rate limit exceeded
- `INTERNAL_ERROR` (500): Server-side failure

### Client-Side Error Boundaries

React Error Boundaries wrap major sections to prevent cascade failures:

- If Today Card UI fails, render a safe error state inside Today Card with Retry CTA (do not reclassify Today Card kind client-side)
- Action Preview errors show empty state with retry CTA
- Peek Drawer errors disable drawer but preserve main surface
- Insights Sheet errors show basic status without preferences

### Correctness Lock
- Score calculation and tie-break ordering are server-side only
- Client MUST treat `action.score` order as authoritative and must not re-rank

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing as complementary approaches:

**Unit Tests:**
- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary values
- Focus on concrete scenarios and known failure modes

**Property-Based Tests:**
- Verify universal properties across all inputs
- Test correctness properties with randomized data
- Provide comprehensive input coverage through generation
- Catch edge cases that manual testing might miss

### Property-Based Testing Configuration

**Library:** fast-check for TypeScript/JavaScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: authenticated-home-cockpit, Property {number}: {property_text}`

**Example Property Test Structure:**
```typescript
import * as fc from 'fast-check';

// Feature: authenticated-home-cockpit, Property 4: Today Card Priority Determinism
test('Today Card state follows deterministic priority order', () => {
  fc.assert(
    fc.property(
      fc.record({
        onboarding_needed: fc.boolean(),
        scan_state: fc.constantFrom('fresh', 'stale', 'missing'),
        critical_risk_count: fc.nat(),
        pending_actions_count: fc.nat(),
        daily_pulse_available: fc.boolean()
      }),
      (inputs) => {
        const state = determineTodayCardState(inputs);
        
        // Verify priority order is respected
        if (inputs.onboarding_needed) {
          expect(state.kind).toBe('onboarding');
        } else if (inputs.scan_state !== 'fresh') {
          expect(state.kind).toBe('scan_required');
        } else if (inputs.critical_risk_count > 0) {
          expect(state.kind).toBe('critical_risk');
        } else if (inputs.pending_actions_count > 0) {
          expect(state.kind).toBe('pending_actions');
        } else if (inputs.daily_pulse_available) {
          expect(state.kind).toBe('daily_pulse');
        } else {
          expect(state.kind).toBe('portfolio_anchor');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Smart Test Data Generation

Property tests use constrained generators that produce valid input spaces:

**Action Generator:**
```typescript
const actionGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  lane: fc.constantFrom('Protect', 'Earn', 'Watch'),
  severity: fc.constantFrom('critical', 'high', 'med', 'low'),
  provenance: fc.constantFrom('confirmed', 'simulated', 'heuristic'),
  event_time: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  expires_at: fc.option(fc.date({ min: new Date(), max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }))
});
```

**User State Generator:**
```typescript
const userStateGenerator = fc.record({
  user_id: fc.uuid(),
  last_opened_at: fc.option(fc.date({ max: new Date() })),
  wallet_count: fc.integer({ min: 0, max: 10 }),
  has_completed_scan: fc.boolean(),
  has_alert_rules: fc.boolean(),
  has_saved_items: fc.boolean()
});
```

### Integration Testing

**API Endpoint Testing:**
- Test all endpoints with valid and invalid inputs
- Verify authentication and authorization
- Test rate limiting and error responses
- Validate response format compliance

**Database Integration:**
- Test RLS policies with cross-user access attempts
- Verify constraint enforcement and data validation
- Test concurrent access patterns
- Validate index performance under load

### End-to-End Testing

**Critical User Flows:**
- Unauthenticated user redirect and demo mode access
- Today Card state transitions based on user conditions
- Action ranking and display with various data scenarios
- Peek Drawer and Insights Sheet interactions
- Notification permission flow and preferences management

**Performance Testing:**
- Verify SLO compliance for API response times
- Test caching behavior and TTL expiration
- Validate degraded mode performance
- Measure client-side rendering performance

### Testing Environment Requirements

**Test Data:**
- Isolated test database with known seed data
- Mock external services (Guardian, Hunter, Portfolio APIs)
- Configurable time zones for pulse generation testing
- Simulated network conditions for degraded mode testing

**Test Infrastructure:**
- Automated test execution in CI/CD pipeline
- Property test failure reproduction and debugging
- Performance monitoring and regression detection
- Accessibility testing with automated tools