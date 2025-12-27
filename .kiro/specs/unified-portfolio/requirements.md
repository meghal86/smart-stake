# Requirements Document

## Introduction

AlphaWhale Portfolio must evolve from read-only tracking into a read-write-automate "Wealth OS" that is actionable, deterministically safe, and unified across Guardian + Hunter + Harvest + Action Engine. This unified portfolio system serves as the central command center for all wealth management activities with mobile-first design and consistent AlphaWhale design system.

## Scope Lock (MANDATORY) — Reuse-First / No-Duplicate Rule

**User Story:** As the platform owner, I want the Portfolio redesign to reuse existing code and architecture, so we ship faster without duplicating systems or diverging styling.

#### Acceptance Criteria

1. THE System SHALL reuse the existing Portfolio route, screens, components, hooks, stores, and services where they exist
2. THE System SHALL NOT create new routes, tabs, or pages if equivalent Portfolio UI already exists in the codebase
3. THE System SHALL NOT introduce duplicate CSS/token systems; Portfolio styling SHALL use the existing AlphaWhale design system primitives
4. BEFORE adding any new component/hook/store/service, THE implementer SHALL document:
   - what was searched (paths/modules), and
   - why reuse/refactor was not possible (≤3 bullets)
5. THE System SHALL enforce a "no-duplicate Portfolio primitives" check (lint/script/CI gate) for key modules (Portfolio UI primitives, API clients, risk scoring utilities)
6. THE implementation SHALL NOT add new top-level navigation items or modules as part of Portfolio work

**Existing Portfolio Infrastructure to Reuse:**
- Routes: `/lite/portfolio`, `/lite5/portfolio5`, existing portfolio pages
- Components: `src/components/portfolio/*`, `src/components/ux/PortfolioEmptyState.tsx`
- Hooks: `src/hooks/useEnhancedPortfolio.ts`, `src/hooks/useUserAddresses.ts`
- Services: `src/services/MetricsService.ts` (portfolio tracking)
- Icons: `PortfolioIcon`, `PortfolioIcon5` in nav components
- Database: `user_portfolio_addresses`, `portfolio_snapshots` tables

## Glossary

- **Wealth_OS**: The unified portfolio system that orchestrates all wealth management activities
- **Action_Engine**: The execution system that handles transaction planning and execution
- **Intent_Plan**: A structured multi-step plan generated from user or Copilot intents
- **Pre_Flight_Card**: The simulation results shown before wallet signing
- **Copilot**: The AI assistant with constrained output taxonomy
- **Guardian**: The security scanning and risk assessment system
- **Hunter**: The opportunity discovery and analysis system
- **Harvest**: The tax loss harvesting system
- **Approval_Risk**: Computed risk score for token approvals and permissions
- **VAR**: Value at Risk - estimated dollar amount at risk from approvals
- **Simulation_Receipt**: Results from pre-transaction simulation
- **Action_Score**: Prioritization score for recommended actions

## Requirements

### Requirement 1: Unified Portfolio Hub

**User Story:** As a user, I want a single source of truth for my net worth, positions, exposures, and portfolio health across all my wallets, so that I can make informed decisions about my wealth.

#### Acceptance Criteria

1. THE Portfolio_Route SHALL serve as the canonical entry point at `/portfolio`
2. IF the existing canonical Portfolio route currently lives under `/lite/portfolio` (or other), THE System SHALL alias/redirect `/portfolio` to the existing route without creating a new parallel page (reuse-first)
3. WHEN a user accesses the portfolio, THE System SHALL display persistent AI Hub and 3-tab spine (Overview, Positions, Audit)
4. THE System SHALL show always-visible elements: net worth, 24h delta, freshness, trust/risk summary, alerts count
5. THE Copilot_Entry SHALL be always available through chat drawer
6. THE System SHALL aggregate data from Guardian, Hunter, and Harvest systems
7. THE System SHALL attach freshness_sec and confidence to all primary Portfolio aggregates: net worth, positions totals, approvals list, recommended actions
8. THE default confidence threshold SHALL be 0.70 unless overridden by config, and SHALL be lower-bounded at 0.50 (cannot disable gating entirely)
9. WHEN confidence < threshold, THE System SHALL show a degraded banner and gate risky actions

### Requirement 2: Mobile-First Responsive Design

**User Story:** As a mobile user, I want the portfolio to work seamlessly on my phone with touch-friendly interactions, so that I can manage my wealth on the go.

#### Acceptance Criteria

1. WHEN screen width is less than 480px, THE System SHALL use single-column layout with compact tab labels
2. WHEN screen width is 480-768px, THE System SHALL use single-column with denser bento layout
3. WHEN screen width is greater than 768px, THE System SHALL optionally use split view
4. THE System SHALL ensure minimum touch targets of 44×44px for all interactive elements
5. THE System SHALL implement sticky bottom safe-area spacing for iOS drawers and inputs
6. THE System SHALL support pull-to-refresh and optimistic UI patterns

### Requirement 3: Design System Consistency (No CSS Islands)

**User Story:** As a user, I want Portfolio to feel like the same AlphaWhale product, so I trust it and navigation feels seamless.

#### Acceptance Criteria

1. THE Portfolio UI SHALL use the existing design tokens, typography scale, spacing scale, and shared components
2. THE System SHALL NOT introduce custom one-off CSS patterns that bypass the shared component library
3. THE System SHALL include visual regression tests for Portfolio screens to prevent CSS drift
4. THE System SHALL support dark mode parity and safe-area compliance consistent with other AlphaWhale tabs

### Requirement 4: Recommended Actions Feed

**User Story:** As a user, I want to see prioritized recommendations for improving my portfolio security and value, so that I can take the most impactful actions first.

#### Acceptance Criteria

1. THE System SHALL generate 3-10 actions prioritized by ActionScore formula
2. THE ActionScore SHALL equal (Severity × ExposureUSD × Confidence × TimeDecay) − Friction(gasUSD + timeSec)
3. THE System SHALL include minimum action types: approval hygiene, de-risk exposure, claim rewards, opportunity routing
4. WHEN displaying an action, THE System SHALL show title, why (≤3 bullets), impact preview, and CTA
5. THE Impact_Preview SHALL include risk score delta, prevented-loss estimate, expected gain, gas estimate, time estimate

### Requirement 5: Approval Risk Scoring

**User Story:** As a user, I want to understand the risk level of my token approvals and permissions, so that I can revoke dangerous ones before they're exploited.

#### Acceptance Criteria

1. THE System SHALL compute ApprovalRisk score for every approval/permit
2. THE ApprovalRisk SHALL incorporate age_days, scope, value_at_risk_usd, spender_trust, contract_risk, interaction_context
3. THE System SHALL classify severity as Critical (≥0.80), High (0.60-0.79), Medium (0.40-0.59), Low (<0.40)
4. WHEN displaying approvals, THE System SHALL show severity chip, VAR estimate, why reasons, and batch revoke CTA
5. THE System SHALL flag infinite approvals to unknown spenders as Critical by default
6. THE System SHALL persist the top contributing factors (top 3) and their weights for each ApprovalRisk score to support explainability ("Why this is risky")
7. THE System SHALL expose a "Risk Reasons" array in the approvals response (e.g., ["INFINITE_ALLOWANCE", "UNKNOWN_SPENDER", "OLD_APPROVAL"])
8. THE System SHALL apply "Critical by rule" for: infinite + unknown spenders, spender is proxy + recently upgraded, Permit2 operator not verified
9. THE System SHALL detect and display Permit2 approvals (operator/spender) and score them using ApprovalRisk

### Requirement 6: Intent Planning and Deterministic Safety

**User Story:** As a user, I want to plan complex transactions safely with simulation before signing, so that I can avoid costly mistakes and malicious contracts.

#### Acceptance Criteria

1. WHEN user or Copilot issues intent, THE System SHALL generate Intent_Plan with steps
2. THE System SHALL perform policy checks and pre-sign simulation before wallet prompt
3. WHEN simulation flags critical loss or honeypot behavior, THE System SHALL block by default
4. THE Pre_Flight_Card SHALL show asset deltas, permissions delta, gas estimate, warnings, confidence
5. THE System SHALL support partial execution when remaining steps are safe
6. BEFORE returning any transaction payload for signing, THE System SHALL verify execution payload matches simulated intent (same target contract(s), calldata class, asset deltas within tolerance)
7. WHEN a mismatch is detected (simulation receipt differs from proposed tx), THE System SHALL block execution and log an audit event with mismatch reason
8. THE System SHALL enforce a PolicyEngine v0 with at least: max_gas_usd (user configurable), block_new_contracts_days (default 7 days), block_infinite_approvals_to_unknown (default true), require_simulation_for_value_over_usd (default $250)

### Requirement 7: Simulation Failure Handling

**User Story:** As a user, I want clear options when transaction simulation fails, so that I can decide how to proceed safely.

#### Acceptance Criteria

1. THE System SHALL track plan steps as pending | simulated | blocked | ready | signing | submitted | confirmed | failed
2. WHEN partial execution is safe, THE System SHALL allow user to confirm remaining steps
3. WHEN step fails, THE System SHALL show reason, "Retry", "Replan", and "Proceed with others" options
4. WHEN simulator is down, THE System SHALL show "Limited Preview" banner with lower confidence
5. THE System SHALL require idempotency for plan retries to prevent duplicate side effects
6. THE System SHALL assign an idempotency_key to each IntentPlan execution request and MUST reject duplicate execution requests for the same step

### Requirement 8: Audit Trail and Transparency

**User Story:** As a user, I want to see a complete history of my transactions and approvals with security analysis, so that I can understand my portfolio's security posture.

#### Acceptance Criteria

1. THE Audit_Tab SHALL display transaction timeline with AI tags
2. THE System SHALL show approvals/permissions list with risk ranking and VAR
3. THE System SHALL provide graph-lite visualizer for transaction flows with risk colors
4. THE System SHALL maintain receipts showing "planned vs executed" metadata for AlphaWhale-created plans
5. THE System SHALL track freshness and confidence for key numbers

### Requirement 9: Constrained Copilot Integration

**User Story:** As a user, I want an AI assistant that provides structured, actionable responses without making false automation promises, so that I can trust its recommendations.

#### Acceptance Criteria

1. THE Copilot SHALL output only valid taxonomy objects: Answer, Observation, Recommendation, ActionCard, IntentPlan, SimulationReceipt, CapabilityNotice
2. WHEN response includes action verbs, THE Copilot SHALL include ActionCard or IntentPlan
3. THE Copilot SHALL NOT promise automation like "I'll monitor daily" or "I'll automatically rebalance"
4. THE Valid_Plan SHALL include steps[], policy status, simulation status, impact preview
5. THE Copilot SHALL explicitly state capabilities and limitations with CapabilityNotice
6. THE Copilot SHALL emit ActionCard and IntentPlan objects that conform to the following minimal schema:

```json
{
  "type": "ActionCard",
  "id": "act_123",
  "title": "Revoke risky approval",
  "severity": "critical",
  "why": ["...", "..."],
  "impactPreview": {
    "riskDelta": -1.2,
    "preventedLossP50Usd": 2500,
    "expectedGainUsd": 0,
    "gasEstimateUsd": 8,
    "timeEstimateSec": 30,
    "confidence": 0.78
  },
  "cta": { "label": "Review Plan", "intent": "revoke_approvals", "params": {} },
  "walletScope": { "mode": "active_wallet", "address": "0x..." }
}
```

```json
{
  "type": "IntentPlan",
  "id": "plan_456",
  "intent": "revoke_approvals",
  "steps": [
    { "stepId": "s1", "kind": "revoke", "chain": "ethereum", "target": "0x...", "status": "ready" }
  ],
  "policy": { "status": "allowed", "violations": [] },
  "simulation": { "status": "pass", "receiptId": "sim_789" },
  "impactPreview": { "gasEstimateUsd": 8, "timeEstimateSec": 30, "riskDelta": -0.7 },
  "walletScope": { "mode": "active_wallet", "address": "0x..." }
}
```

**Schema Constraints:**
- `severity` MUST be one of: "critical", "high", "medium", "low"
- `policy.status` MUST be one of: "allowed", "blocked"
- `simulation.status` MUST be one of: "pass", "warn", "block"
- `walletScope.mode` MUST be one of: "active_wallet", "all_wallets"

7. WHEN Copilot output does not conform, THE System SHALL reject it and return a CapabilityNotice ("I can't execute this; missing plan schema")

### Requirement 10: Progressive Disclosure and Performance

**User Story:** As a user, I want fast loading with essential information first, so that I can quickly assess my portfolio status without waiting.

#### Acceptance Criteria

1. THE System SHALL show top 5 items per section by default with "View all" option
2. THE System SHALL provide loading skeleton, empty state, error state, degraded-mode banner for every section
3. THE System SHALL achieve p95 < 600ms for cached snapshot API calls
4. THE System SHALL achieve p95 < 1200ms for cold snapshot API calls
5. THE System SHALL compute caching TTL based on risk severity: Critical = 3–10s, High = 10–30s, Medium = 30–60s, Low = 60–120s
6. WHEN a new transaction is detected for an active wallet, THE System SHALL invalidate critical caches immediately

### Requirement 11: Notifications and Alert Management

**User Story:** As a user, I want intelligent notifications that aggregate related alerts and respect my preferences, so that I'm informed without being overwhelmed.

#### Acceptance Criteria

1. THE System SHALL implement exposure-aware aggregation to prevent spam
2. THE System SHALL support user settings for DND, caps, and severity threshold
3. THE System SHALL deep-link notifications to specific actions or plans
4. THE System SHALL track notification delivery and read status
5. THE System SHALL respect daily quotas and channel preferences

### Requirement 12: Multi-Wallet Portfolio Aggregation

**User Story:** As a user, I want to see my complete portfolio across all my wallets with unified risk analysis, so that I can understand my total exposure.

#### Acceptance Criteria

1. THE System SHALL aggregate net worth and exposure breakdown across all user wallets
2. THE System SHALL track asset/chain/protocol distribution
3. THE System SHALL compute unified risk scores across wallet set
4. THE System SHALL identify top movers and "what changed" drivers
5. THE System SHALL maintain wallet-user linkage protection with RLS and encryption

### Requirement 13: Stress Testing and Quality Gates

**User Story:** As a system administrator, I want comprehensive testing to ensure the portfolio system is reliable under stress, so that users can depend on it for critical financial decisions.

#### Acceptance Criteria

1. THE System SHALL pass functional stress tests for navigation, lists, actions, partial failure, degraded mode, and Copilot
2. THE System SHALL meet performance targets: p95 < 600ms cached, p95 < 1200ms cold, Copilot first token < 1500ms
3. THE System SHALL resist security threats: prompt injection, payload mismatch, new contract risk, deep-link phishing, proxy upgrade risk
4. THE System SHALL maintain visual regression protection and API contract tests
5. THE System SHALL enforce "no duplicate file" policy for Portfolio primitives

#### Functional Stress Test Matrix (Minimum)

| Test Area | Scenario | Pass Criteria |
|-----------|----------|---------------|
| Navigation | Rapid switching tabs + wallets for 60 seconds | No stale wallet leakage, no crashes |
| Navigation | Switch wallet while Copilot is streaming | No cross-wallet data leakage; stream resets with new context |
| Wallet Switching | Switch wallet mid-stream during plan execution | Stream resets, no cross-wallet data leakage, plan scope validation |
| Lists | Scroll positions/history 5k rows (virtualized) | No duplication, stable memory |
| Actions | Create plan → simulate → sign → receipt (10 cycles) | 0 broken receipts |
| Partial failure | 1/3 revoke fails | Can proceed with remaining, failed remains actionable |
| Degraded provider | Simulate service down | Limited Preview banner, risky actions gated |

#### Performance Stress Criteria (Minimum)

| Metric | Target |
|--------|--------|
| Snapshot cached p95 | < 600ms |
| Snapshot cold p95 | < 1200ms |
| Positions cached p95 | < 900ms |
| Copilot first token p95 | < 1500ms |
| Memory (20-min session) | No growth beyond acceptable threshold |

#### Security/Adversarial Suite (Minimum)

| Threat | Scenario | Pass Criteria |
|--------|----------|---------------|
| Prompt injection | Via token name / tx metadata | Copilot must not deviate from taxonomy |
| Simulation vs execution mismatch | TX differs from simulated plan | Blocked + audit logged |
| Deep-link / QR entry points | "Open wallet & sign" link | Warning + verification gate |
| Proxy upgradeable contract interaction | Upgradeable contract interaction | Flagged with reason + severity |

#### Automation Frequency

- **PR blocking**: unit + contract + smoke e2e
- **Nightly**: full e2e + perf checks
- **Weekly**: adversarial + degraded-provider/chaos suite

### Requirement 14: Safety and Security Framework

**User Story:** As a user, I want the portfolio system to protect me from common crypto threats while maintaining my privacy, so that I can use it safely.

#### Acceptance Criteria

1. THE System SHALL implement default safe mode with warnings for new/unverified contracts and unlimited approvals
2. THE System SHALL require simulation for spend/approve/revoke operations
3. THE System SHALL provide MEV-protected sending mode toggle where available
4. THE System SHALL never store private keys and protect wallet-user linkage
5. THE System SHALL use structured logging with minimal exposure of sensitive data

### Requirement 15: Data Model and API Surface

**User Story:** As a developer, I want well-defined data models and APIs for the portfolio system, so that I can integrate and extend functionality reliably.

#### Acceptance Criteria

1. THE System SHALL maintain data models for User, Wallet Profile, Portfolio Snapshot, Position, Approval/Permission, Recommended Action, Intent Plan, Audit Event, Notification Prefs
2. THE System SHALL provide APIs for portfolio snapshot, positions, approvals, recommended actions, plan creation/simulation/execution, audit events, graph-lite, copilot, notification settings
3. THE System SHALL support pagination for large datasets
4. THE System SHALL implement proper error handling with Result types
5. THE System SHALL maintain API versioning and backward compatibility

### Requirement 16: Telemetry and Business Metrics

**User Story:** As a product manager, I want to track key metrics that show how the portfolio system is helping users and preventing losses, so that I can measure success and identify improvements.

#### Acceptance Criteria

1. THE System SHALL track MTTS (Mean Time To Safety) for critical issues
2. THE System SHALL measure Prevented Loss $ at p50/p95 percentiles
3. THE System SHALL calculate Fix Rate (actions completed) and FP rate (critical dismissals/overrides)
4. THE System SHALL monitor p95/p99 latencies and SSE reconnect rates
5. THE System SHALL track action funnel from card → plan → simulate → sign → confirm

## Ship-Blocker Prevention Checklist

All ship-blockers enumerated in requirements above.