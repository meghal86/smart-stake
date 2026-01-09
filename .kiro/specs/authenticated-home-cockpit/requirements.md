# Requirements Document

## Introduction

The Authenticated Home "Decision Cockpit" is a new `/home` route that serves as the primary authenticated dashboard for AlphaWhale users. `/home` is the authenticated "decision cockpit" users open daily to answer: 1) Am I safe? 2) What changed since last open? 3) What should I do next? 4) What expires soon / what will I miss tomorrow? When the user is "healthy," `/home` MUST NOT fall back to a boring portfolio view; it falls back to **Daily Pulse**.

## Glossary

- **Today_Card**: Primary north-star card showing the most important daily state
- **Action_Preview**: Top 3 executable actions (Fix/Execute/Review)
- **Peek_Drawer**: Bottom sheet of all compact signals
- **Insights_Sheet**: Full-screen overlay for status + preferences
- **Daily_Pulse**: Daily digest emphasizing "new since last" + "expiring soon"
- **Expiration_Engine**: expires_at + urgency_score + freshness
- **Investment_Primitives**: Save/Bookmark, Alert Rules, Wallet Roles
- **Provenance**: confirmed | simulated | heuristic
- **New_Since_Last**: event_time > home_state.last_opened_at
- **Home_State**: per-user state table for last_opened_at and pulse viewed state
- **Degraded_Mode**: provider degraded/offline state → disables Fix/Execute

## Requirements

### Requirement 1: Route and Authentication

**User Story:** As an AlphaWhale user, I want a dedicated authenticated home dashboard, so that I can quickly assess my status and take necessary actions.

#### Acceptance Criteria

1. THE System SHALL keep `/` as the marketing landing page (public)
2. THE System SHALL create a new authenticated route `/home`
3. WHEN a user is NOT authenticated and tries `/home`, THE System SHALL redirect to `/`
4. WHEN a user accesses `/home?demo=1`, THE System SHALL render a static demo cockpit with a global "Demo Mode" pill
5. THE System SHALL require a valid authenticated session (Supabase JWT or equivalent) for `/home` access
6. WHEN a user is NOT authenticated AND accesses `/home?demo=1`, THE System SHALL NOT redirect and SHALL render the static demo cockpit
7. Demo mode SHALL NOT call authenticated APIs (`/api/home/*`) and SHALL NOT write home_state or trigger push prompts
8. Demo mode SHALL disable Fix/Execute CTAs and show "Demo" tooltips instead

### Requirement 2: Three Blocks Only Rule

**User Story:** As a user, I want a focused interface that doesn't overwhelm me, so that I can quickly find what matters most.

#### Acceptance Criteria

1. THE System SHALL render exactly three blocks on `/home` main surface: App Shell chrome (existing header/layout, out of scope), Today_Card, and Action_Preview
2. THE System SHALL place all other content behind single tap access: Peek_Drawer and Insights_Sheet
3. THE System SHALL NOT add more blocks to `/home` main surface regardless of data volume

### Requirement 3: Today Card Priority System

**User Story:** As a user, I want the most important information prioritized in the Today Card, so that I can focus on what matters most.

#### Acceptance Criteria

1. THE Today_Card SHALL display exactly one anchor metric, one context line, and one primary CTA
2. THE Today_Card SHALL optionally display one secondary CTA as text link only that must not compete
3. THE System SHALL evaluate priority conditions in exact order: onboarding, scan_required, critical_risk, pending_actions, daily_pulse, portfolio_anchor
4. THE System SHALL pick the first true condition as the Today_Card state
5. THE System SHALL use portfolio_anchor as absolute fallback when no other conditions are met
6. THE Today_Card MAY include non-competing header chrome (e.g., Demo Mode pill, Insights icon) that does NOT count as an anchor metric, context line, or CTA

### Requirement 4: Onboarding State Detection

**User Story:** As a new user, I want clear guidance on next steps, so that I can effectively use the platform.

#### Acceptance Criteria

1. WHEN a user has 0 wallets linked, THE System SHALL set onboarding_needed to true
2. WHEN a user has never completed first scan, THE System SHALL set onboarding_needed to true
3. WHEN a user has no alert rules AND no saved items AND Daily Pulse would be empty, THE System SHALL set onboarding_needed to true
4. WHEN a user has not enabled notifications AND has completed 2 or more meaningful sessions, THE System SHALL set onboarding_needed to true
5. THE System SHALL provide step-specific CTA based on which onboarding condition is unmet

### Requirement 5: Action Preview System

**User Story:** As a user, I want to see the most important executable actions, so that I can quickly address critical issues.

#### Acceptance Criteria

1. THE Action_Preview SHALL display a maximum of 3 rows
2. THE System SHALL render each action row with lane, title, up to 2 impact chips, provenance chip, and CTA
3. THE System SHALL support three lanes: Protect, Earn, and Watch
4. THE System SHALL display impact chips for risk_delta, gas_est_usd, time_est_sec, or upside_est_usd
5. THE System SHALL show provenance as confirmed, simulated, or heuristic
6. WHEN provenance is heuristic, THE System SHALL only allow Review action, never Execute
7. WHEN system is in Degraded_Mode, THE System SHALL disable Fix/Execute and allow Review only

### Requirement 6: Deterministic Action Ranking

**User Story:** As a user, I want the most urgent and relevant actions shown first, so that I can prioritize effectively.

#### Acceptance Criteria

1. THE System SHALL calculate action scores using: lane_weight + severity_weight + urgency_weight + freshness_weight + relevance_weight + burst_weight + penalty_weight
2. THE System SHALL apply lane weights: Protect +80, Earn +50, Watch +20
3. THE System SHALL apply severity weights: critical +100, high +70, med +40, low +10
4. THE System SHALL apply urgency weights based on expires_at: <24h +90, <72h +60, else +0
5. THE System SHALL apply freshness weights: new +25, updated +15, expiring +20, stable +0
6. THE System SHALL apply relevance weights: 0 to +30 based on holdings match, wallet role, saved tags
7. THE System SHALL apply burst weight: +10 for aggregated similar events
8. THE System SHALL apply penalty weights: heuristic execution +∞, provider degraded -25, duplicate in last 2h -30
9. THE System SHALL use tie-breakers in order: higher severity, sooner expires_at, higher relevance, newer event_time

### Requirement 7: Peek Drawer Interface

**User Story:** As a user, I want to see all available signals in a compact format, so that I can explore beyond the top 3 actions.

#### Acceptance Criteria

1. WHEN a user clicks "See all signals", THE System SHALL open Peek_Drawer as bottom sheet modal
2. THE Peek_Drawer SHALL have height of 80vh on mobile and max 640px on desktop
3. THE System SHALL support closing via swipe down on mobile, overlay click, or ESC key
4. THE Peek_Drawer SHALL implement focus trap and aria-modal="true" for accessibility
5. THE System SHALL restore focus to launcher element when drawer closes
6. THE Peek_Drawer SHALL display collapsible sections with 1-5 rows maximum each
7. THE System SHALL include sections: Daily Pulse teaser, Expiring Opportunities, Guardian Deltas, Portfolio Pulse, Proof/Receipts, and Alerts

### Requirement 8: Insights Sheet System

**User Story:** As a user, I want to understand system status and control settings, so that I can troubleshoot issues and manage preferences.

#### Acceptance Criteria

1. WHEN a user clicks "Status / More" icon, THE System SHALL open Insights_Sheet as full screen
2. THE Insights_Sheet SHALL display provider status with online/degraded/offline indicators
3. THE System SHALL show coverage information: wallets, chains, last refresh timestamps
4. THE Insights_Sheet SHALL provide preference controls for notification caps, DND hours, and wallet scope
5. THE System SHALL include links to documentation, terms, and privacy policy
6. THE System SHALL provide an Insights launcher within `/home` even if App Shell chrome is unchanged (fallback: top-right icon inside Today_Card)
7. THE Insights launcher MUST be reachable on mobile within one tap from the main three-block surface

### Requirement 9: Daily Pulse Engine

**User Story:** As a user, I want a daily digest of relevant changes, so that I can stay informed without being overwhelmed.

#### Acceptance Criteria

1. THE System SHALL generate Daily_Pulse per user timezone with default ready time of 9am local
2. WHEN today's pulse is missing, THE System SHALL generate on-demand at first open
3. THE Daily_Pulse SHALL contain maximum 8 rows total and maximum 3 rows per category
4. THE Daily_Pulse SHALL include at least one of: expiring soon (<72h), new since last open, or portfolio delta beyond threshold
5. WHEN no content exists, THE System SHALL show "Quiet day" state with CTAs for creating alert rules and saving opportunities
6. THE System SHALL rank pulse sources: expiring Hunter opportunities, new/updated opportunities, portfolio deltas, Guardian micro-deltas, recent receipts/proofs

### Requirement 10: Expiration Engine

**User Story:** As a user, I want time-sensitive opportunities clearly identified, so that I can act before they expire.

#### Acceptance Criteria

1. THE System SHALL include expires_at, freshness, and urgency_score fields for eligible items
2. WHEN expires_at is within 24 hours, THE System SHALL set urgency_score to 90 or higher
3. WHEN expires_at is within 72 hours, THE System SHALL set urgency_score to 60 or higher
4. THE System SHALL use expiration data to influence Action ranking, Daily Pulse, and Peek Drawer expiring section
5. THE System SHALL support freshness values: new, updated, expiring, stable

### Requirement 11: New Since Last Open Logic

**User Story:** As a user, I want to see what's changed since my last visit, so that I can focus on recent developments.

#### Acceptance Criteria

1. THE System SHALL store last_opened_at and last_pulse_viewed_date in home_state table per user
2. THE System SHALL define event_time as coalesce(updated_at, created_at) for all items
3. WHEN event_time is greater than last_opened_at, THE System SHALL mark item as NEW
4. WHEN updated_at is greater than last_opened_at AND updated_at differs from created_at, THE System SHALL mark item as UPDATED
5. WHEN last_opened_at is null, THE System SHALL treat last_opened_at as now() minus 24 hours
6. THE System SHALL cap displayed new_since_last counter at 99+
7. WHEN user calls POST /api/home/open, THE System SHALL update last_opened_at to current timestamp
8. THE System SHALL debounce open endpoint to maximum once per minute per user
9. THE System SHALL NOT mutate last_opened_at on GET /api/home/summary calls

### Requirement 12: Investment Primitives

**User Story:** As a user, I want to save interesting opportunities and create alert rules, so that the app becomes more useful over time.

#### Acceptance Criteria

1. THE System SHALL provide save/bookmark functionality for opportunities and findings
2. THE System SHALL support wallet role assignment for different addresses
3. THE System SHALL allow creation and management of alert rules with JSON rule definition
4. THE System SHALL store user investments in user_investments table with user_id, kind, ref_id, and payload
5. THE System SHALL store alert rules in alert_rules table with user_id, rule, and is_enabled fields
6. THE System SHALL use saved items and alert rules for relevance scoring in action ranking

### Requirement 13: Web Push Notifications

**User Story:** As a user, I want to receive relevant notifications, so that I can stay informed of critical changes without being overwhelmed.

#### Acceptance Criteria

1. THE System SHALL use web-push npm package for server-side implementation
2. THE System SHALL implement Service Worker and PushManager for client-side functionality
3. THE System SHALL NOT prompt for permission on page load
4. WHEN a user completes first scan OR first save/bookmark OR creates first alert rule, THE System SHALL prompt for notification permission
5. THE System SHALL apply default DND hours of 10pm-8am local time
6. THE System SHALL limit notifications to maximum 3 per day
7. THE System SHALL support categories: critical (immediate, overrides cap up to 1/day), daily_pulse (1/day), expiring_soon (<24h, high-trust only)
8. THE System SHALL provide endpoints for subscribe, unsubscribe, and dev-only test functionality

### Requirement 14: Performance and Caching

**User Story:** As a user, I want fast response times and reliable performance, so that I can efficiently use the dashboard.

#### Acceptance Criteria

1. THE System SHALL achieve /home first meaningful paint under 1.2 seconds on mobile
2. THE System SHALL achieve GET /api/home/summary p50 under 150ms, p95 under 400ms, p99 under 900ms
3. THE System SHALL achieve drawer open latency under 100ms
4. THE System SHALL implement risk-aware TTL caching: critical risk 10s, scan required 15s, pending actions 20s, healthy/pulse 60s
5. THE System SHALL use stale-while-revalidate pattern for cache management

### Requirement 15: Degraded Mode Operation

**User Story:** As a user, I want the system to work even when some services are unavailable, so that I can still access cached information.

#### Acceptance Criteria

1. WHEN providers are degraded/offline, THE System SHALL disable Fix and Execute actions
2. THE System SHALL continue to allow Review actions in degraded mode
3. THE System SHALL display cached last-known data with explicit staleness indicators
4. THE System SHALL provide retry mechanisms for failed operations
5. THE System SHALL show provider status in Insights_Sheet with online/degraded/offline indicators

### Requirement 16: API Contract Implementation

**User Story:** As a developer, I want consistent API contracts, so that I can reliably integrate with the system.

#### Acceptance Criteria

1. THE System SHALL implement POST /api/home/open endpoint for updating last_opened_at state
2. THE System SHALL implement GET /api/home/summary endpoint with wallet_scope parameter
3. THE System SHALL implement GET /api/home/pulse endpoint with date parameter
4. THE System SHALL implement investment endpoints: POST /api/investments/save, GET /api/alerts/rules, POST /api/alerts/rules
5. THE System SHALL implement notification endpoints: subscribe, unsubscribe, and dev-only test
6. THE System SHALL return responses with data, error, and meta fields including server timestamp
7. THE System SHALL use HTTP status codes: 200 OK, 400 validation, 401 unauthorized, 429 rate limit, 500 internal

### Requirement 17: Database Schema Implementation

**User Story:** As a system administrator, I want proper data storage and security, so that user data is protected and accessible.

#### Acceptance Criteria

1. THE System SHALL implement home_state table with user_id, last_opened_at, last_pulse_viewed_date, and updated_at
2. THE System SHALL implement daily_pulse table with user_id, pulse_date, payload, and created_at
3. THE System SHALL implement user_investments table with user_id, kind, ref_id, payload, and created_at
4. THE System SHALL implement alert_rules table with id, user_id, rule, is_enabled, and created_at
5. THE System SHALL implement web_push_subscriptions table with id, user_id, endpoint, p256dh, auth, user_agent, and created_at
6. THE System SHALL enable row level security on all tables
7. THE System SHALL implement RLS policies ensuring users can only access their own data

### Requirement 18: Telemetry and Testing

**User Story:** As a product manager, I want to understand user behavior and ensure system reliability, so that I can improve the product.

#### Acceptance Criteria

1. THE System SHALL emit telemetry events: home_opened, home_today_kind_shown, home_action_clicked, home_peek_opened/closed, home_insights_opened/closed
2. THE System SHALL emit investment events: home_pulse_opened, home_save_clicked, home_alert_created
3. THE System SHALL emit notification events: push_prompt_shown, push_accepted, push_denied
4. THE System SHALL pass acceptance tests: unauthenticated redirect, demo mode rendering, Today Card priority order, new-since-last logic
5. THE System SHALL validate that Action Preview shows max 3 rows with provenance gating, degraded mode disables Fix/Execute, and push permission prompts only after meaningful actions

## Appendix A — State Inputs (No Ambiguity)

### A1) Today Card Inputs (source of truth)

THE System SHALL compute these inputs for Today Card evaluation:
- onboarding_needed: boolean (Requirement 4)
- scan_state: "fresh" | "stale" | "missing"
- critical_risk_count: number
- pending_actions_count: number
- daily_pulse_available: boolean
- degraded_mode: boolean

### A2) scan_required definition (explicit)

scan_state = "missing" if no successful scan exists for the wallet_scope.

scan_state = "stale" if now() - last_scan_at exceeds staleness threshold by chain:
- Base / Arbitrum: 15 minutes
- Ethereum: 30 minutes

scan_state = "fresh" otherwise.

last_scan_at is the most recent completed Guardian scan timestamp for the wallet_scope.

### A3) critical_risk definition (explicit)

critical_risk_count = count of Guardian findings where:
- severity = "critical"
- status = "open" (not dismissed/resolved)
- within wallet_scope

### A4) pending_actions definition (explicit)

pending_actions_count = count of Action Center items where:
- state IN ("pending_user", "ready_to_execute", "needs_review")
- within wallet_scope

### A5) Degraded_Mode definition (explicit)

degraded_mode = true if ANY applies:
- primary RPC/provider for any chain in wallet_scope is offline
- OR provider is degraded AND p95 latency > 1200ms for last 5 minutes
- OR Guardian/Hunter backing indexer is stale by > 2x the chain staleness threshold

When degraded_mode = true, cockpit MUST:
- disable Fix/Execute (Requirement 5.7)
- keep Review enabled
- surface a staleness indicator + retry CTA

### A6) "Meaningful session" definition (for onboarding rule #4.4)

A "meaningful session" increments when user performs ANY:
- completes a scan
- saves/bookmarks an item
- creates/edits an alert rule
- clicks an action row CTA (Fix/Execute/Review)

## Appendix B — API Response Shapes (Locked)

### B1) GET /api/home/summary?wallet_scope=active|all

```json
{
  "data": {
    "wallet_scope": "active",
    "today_card": {
      "kind": "daily_pulse",
      "anchor_metric": "3 new · 2 expiring",
      "context_line": "Since your last open",
      "primary_cta": { "label": "Open today's pulse", "href": "/home#pulse" },
      "secondary_cta": { "label": "Explore Hunter", "href": "/hunter" }
    },
    "action_preview": [
      {
        "id": "act_123",
        "lane": "Protect",
        "title": "Revoke unused approval: Uniswap Router",
        "impact_chips": [
          { "kind": "gas_est_usd", "value": 0.42 },
          { "kind": "risk_delta", "value": -12 }
        ],
        "provenance": "simulated",
        "cta": { "kind": "Fix", "href": "/action-center?intent=act_123" },
        "severity": "high",
        "freshness": "updated",
        "expires_at": "2026-01-10T03:00:00Z",
        "event_time": "2026-01-09T15:22:00Z",
        "urgency_score": 92,
        "score": 262
      }
    ],
    "counters": {
      "new_since_last": 7,
      "expiring_soon": 2,
      "critical_risk": 0,
      "pending_actions": 1
    },
    "provider_status": { "state": "online", "detail": null },
    "degraded_mode": false
  },
  "error": null,
  "meta": { "ts": "2026-01-09T16:10:00Z" }
}
```

### B2) GET /api/home/pulse?date=YYYY-MM-DD

```json
{
  "data": {
    "pulse_date": "2026-01-09",
    "timezone": "America/Chicago",
    "rows": [
      {
        "kind": "expiring_opportunity",
        "title": "Arbitrum quest ends in 8h",
        "chip": "8h left",
        "cta": { "label": "Open", "href": "/hunter?op=arb_week4" },
        "provenance": "confirmed",
        "event_time": "2026-01-09T09:02:00Z"
      }
    ]
  },
  "error": null,
  "meta": { "ts": "2026-01-09T16:10:00Z" }
}
```

### B3) POST /api/home/open

MUST update home_state.last_opened_at = now()
MUST be debounced server-side to once/min/user
returns { data: { ok: true }, error: null, meta: { ts } }

### B4) GET /api/home/prefs

```json
{
  "data": {
    "wallet_scope_default": "active",
    "dnd_start_local": "22:00",
    "dnd_end_local": "08:00",
    "notif_cap_per_day": 3
  },
  "error": null,
  "meta": { "ts": "2026-01-09T16:10:00Z" }
}
```

### B5) POST /api/home/prefs

Request:
```json
{
  "wallet_scope_default": "all",
  "dnd_start_local": "22:00",
  "dnd_end_local": "08:00",
  "notif_cap_per_day": 3
}
```

### B6) POST /api/notifications/subscribe

Request:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": { "p256dh": "...", "auth": "..." },
  "user_agent": "Mozilla/5.0...",
  "timezone": "America/Chicago"
}
```

Response:
```json
{
  "data": { "ok": true },
  "error": null,
  "meta": { "ts": "2026-01-09T16:10:00Z" }
}
```

### B7) POST /api/notifications/unsubscribe

Request:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

Response:
```json
{
  "data": { "ok": true },
  "error": null,
  "meta": { "ts": "2026-01-09T16:10:00Z" }
}
```

### B8) POST /api/notifications/test (DEV ONLY)

Request:
```json
{
  "category": "critical" | "daily_pulse" | "expiring_soon"
}
```

Rules:
- MUST require dev-only auth (env key / role)
- MUST enforce 5/day/user

## Appendix C — Database Indexes + Rate Limits

### C1) Indexes (required)

- daily_pulse: index (user_id, pulse_date desc)
- alert_rules: index (user_id, is_enabled)
- web_push_subscriptions: unique (user_id, endpoint)
- user_investments: index (user_id, kind)

### C2) Rate limits (sane defaults)

- GET /api/home/summary: 60 req/min/user (client SWR should prevent this)
- POST /api/home/open: 1 req/min/user (hard enforced)
- POST /api/notifications/subscribe: 10/day/user
- POST /api/notifications/unsubscribe: 20/day/user
- POST /api/notifications/test: dev-only + 5/day/user

### C3) Default Preferences

If home_state.prefs.wallet_scope_default is unset:
- default = "active"
- if user has >=2 wallets, UI may suggest switching to "all" inside Insights

## Appendix D — Supabase SQL (DDL + RLS)

```sql
-- home_state
create table if not exists public.home_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_opened_at timestamptz,
  last_pulse_viewed_date date,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.home_state enable row level security;

create policy "home_state_select_own" on public.home_state for select using (auth.uid() = user_id);

create policy "home_state_upsert_own" on public.home_state for insert with check (auth.uid() = user_id);

create policy "home_state_update_own" on public.home_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- daily_pulse
create table if not exists public.daily_pulse (
  user_id uuid not null references auth.users(id) on delete cascade,
  pulse_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, pulse_date)
);

create index if not exists daily_pulse_user_date_idx on public.daily_pulse (user_id, pulse_date desc);

alter table public.daily_pulse enable row level security;

create policy "daily_pulse_select_own" on public.daily_pulse for select using (auth.uid() = user_id);

create policy "daily_pulse_upsert_own" on public.daily_pulse for insert with check (auth.uid() = user_id);

create policy "daily_pulse_update_own" on public.daily_pulse for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_investments
create table if not exists public.user_investments (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('save','bookmark','wallet_role')),
  ref_id text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists user_investments_user_kind_idx on public.user_investments (user_id, kind);

alter table public.user_investments enable row level security;

create policy "user_investments_select_own" on public.user_investments for select using (auth.uid() = user_id);

create policy "user_investments_insert_own" on public.user_investments for insert with check (auth.uid() = user_id);

create policy "user_investments_delete_own" on public.user_investments for delete using (auth.uid() = user_id);

-- alert_rules
create table if not exists public.alert_rules (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rule jsonb not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists alert_rules_user_enabled_idx on public.alert_rules (user_id, is_enabled);

alter table public.alert_rules enable row level security;

create policy "alert_rules_select_own" on public.alert_rules for select using (auth.uid() = user_id);

create policy "alert_rules_insert_own" on public.alert_rules for insert with check (auth.uid() = user_id);

create policy "alert_rules_update_own" on public.alert_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alert_rules_delete_own" on public.alert_rules for delete using (auth.uid() = user_id);

-- web_push_subscriptions
create table if not exists public.web_push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.web_push_subscriptions enable row level security;

create policy "push_sub_select_own" on public.web_push_subscriptions for select using (auth.uid() = user_id);

create policy "push_sub_insert_own" on public.web_push_subscriptions for insert with check (auth.uid() = user_id);

create policy "push_sub_delete_own" on public.web_push_subscriptions for delete using (auth.uid() = user_id);
```

## Appendix E — UI Clarifications

### E1) Pulse UI Location

Pulse opens as full-screen sheet on `/home#pulse` (overlays the main three-block surface).

Navigation semantics:
- Navigating to `/home#pulse` MUST open the Pulse sheet
- Closing the sheet MUST remove the hash (route back to `/home` without full reload)
- On mobile, swipe-down closes; ESC closes on desktop
- The sheet MUST restore focus to the CTA that opened it

### E2) Demo Mode Visual Indicators

Demo mode SHALL display "Demo" tooltips on disabled Fix/Execute CTAs and show a persistent "Demo Mode" pill in the top-right of the Today_Card.
### Requirement 19: Preferences Persistence

**User Story:** As a user, I want my cockpit preferences to persist across sessions and devices, so that my settings are maintained.

#### Acceptance Criteria

1. THE System SHALL persist preferences server-side (not localStorage-only) for authenticated users
2. THE persisted preferences MUST include: wallet_scope_default ("active" | "all"), dnd_start_local ("HH:MM"), dnd_end_local ("HH:MM"), notif_cap_per_day (integer)
3. THE System SHALL expose endpoints: GET /api/home/prefs, POST /api/home/prefs
4. POST /api/home/prefs MUST validate inputs and return the updated preferences
5. Demo mode SHALL NOT call /api/home/prefs
## Appendix F — Unified Action Model + Source Adapters (Locked)

### F1) Unified Action Model (canonical)

All sources MUST normalize into this shape before ranking:

- id: string (stable, unique)
- lane: "Protect" | "Earn" | "Watch"
- title: string
- severity: "critical" | "high" | "med" | "low"
- provenance: "confirmed" | "simulated" | "heuristic"
- cta: { kind: "Fix" | "Execute" | "Review", href: string }
- impact_chips: array of up to 2 chips:
  - { kind: "risk_delta" | "gas_est_usd" | "time_est_sec" | "upside_est_usd", value: number }
- event_time: timestamptz (coalesce(updated_at, created_at) from source)
- expires_at: timestamptz | null
- freshness: "new" | "updated" | "expiring" | "stable"
- urgency_score: 0..100 (0 if no expires_at)
- score: number (computed)
- source: { kind: "guardian" | "hunter" | "portfolio" | "action_center" | "proof", ref_id: string }

### F2) Source Adapter Rules (deterministic)

1. Guardian Findings → lane=Protect
   - severity maps 1:1 (critical/high/med/low)
   - provenance="confirmed" if from completed scan; "heuristic" if inferred from partial data
   - cta.kind="Review" unless system supports deterministic Fix flows for that finding

2. Hunter Opportunities → lane=Earn
   - expires_at MUST be set when known
   - provenance="confirmed" only if eligibility + source checks pass; else "simulated" or "heuristic"

3. Portfolio Deltas → lane=Watch (or Protect if risk-related)
   - provenance="confirmed" when based on confirmed balance/price snapshots; else "simulated"

4. Action Center Items → lane preserved from intent; default Protect
   - pending_actions_count derived only from Action Center states (Appendix A4)

5. Proof/Receipts → lane=Watch
   - used for pulse + peek drawer; typically cta.kind="Review"

### F3) Adapter Output Limits

- The backend MAY return >3 candidate actions, but client MUST display only top 3 in Action_Preview
- Peek_Drawer MAY show more (with section caps already defined)