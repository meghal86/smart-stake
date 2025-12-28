# Implementation Plan: Missing Requirements (v1 Launch)

## Overview

This implementation plan addresses the 24 missing requirements for AlphaWhale v1 using a screen-by-screen approach. **Non-negotiable rule:** Before any work item, do a repo-wide search. If something exists, fix/wire/extend it — do not build a parallel version.

## Preflight (Docs + Numbering — Must be done first)

- [x] 0. Align Requirements Numbering (R1–R24)
  - Confirm requirements.md contains R1–R21 plus R22–R24 (or renumber references across design/tasks)
  - Ensure task references match the final requirements.md IDs
  - _Acceptance: No task references undefined requirements_

## Phase 0: P0 Critical (Launch Gate Requirements)

- [x] 1. Fix PERF-01 App Freeze After 3–5 Interactions
  - Search: render loops, leaking listeners/intervals, runaway polling, unbounded state updates
  - Ensure cleanup on unmount (effects, subscriptions, intervals)
  - Search for existing monitoring utilities (src/lib/performance/, Sentry hooks, query retry loops)
  - _Requirements: R1-AC1, R1-AC2, R1-AC4, R1-AC5, R22-AC1, R22-AC2, R22-AC3, R22-AC4, R22-AC5_
  - _Acceptance: 5+ minutes interaction without freeze; no continuously growing memory footprint_

- [x] 2. Eliminate All Inert CTAs ("Touch Everything" Pass)
  - Inventory all interactive elements (buttons/links/cards/toggles)
  - Any element that can't act must be: disabled + tooltip ("Coming soon", "Connect wallet", "Sign in")
  - Extend existing Button/Card patterns — do not create new variants if one exists
  - _Requirements: R5-AC1, R5-AC2, R5-AC3, R5-AC4_
  - _Acceptance: 100% interactive elements produce feedback_

- [ ] 3. Add Footer OR Settings → Legal/Support (v1 minimal, but real)
  - Search for existing Footer/AppShell/Layout
  - Ensure links exist and work: Terms, Privacy, Contact Support, Report Bug
  - Legal pages are allowed as new routes only if they don't exist, but must show real content, not placeholders
  - _Requirements: R6-AC1, R6-AC2, R6-AC3, R6-AC4, R6-AC5, R24-AC1, R24-AC2, R24-AC3, R24-AC4, R24-AC5_
  - _Acceptance: All links work on mobile/desktop; legal pages show actual content_

- [ ] 3.1 Add Build/Version Visibility (Settings → About preferred)
  - Search for existing "About" or Settings metadata section
  - Display app version/build commit or build timestamp
  - _Requirements: R24-AC3_
  - _Acceptance: Build/version visible within 2 taps from Settings_

## Phase 1: Global Infrastructure (All Screens)

- [ ] 4. Add Identity Indicator Everywhere
  - Search: existing auth UI components (src/components/layout/, header components)
  - Extend existing header to show persistent "Guest" / "Signed in" chip
  - Tooltip: "Guest mode doesn't save wallets/alerts/settings"
  - _Requirements: R2-AC1, R2-AC2, R2-AC3_
  - _Acceptance: Visible within 1 glance on every screen_

- [ ] 5. Add Active Wallet Indicator Everywhere + Correct Wallet Switching
  - Search for existing wallet connection + selector components
  - Ensure wallet chip shows label (ENS/nickname) + short address everywhere
  - Wallet switching MUST: reset wallet-scoped state, show skeleton/loading, show success toast, never display stale cross-wallet data
  - _Requirements: R3-AC1, R3-AC2, R3-AC3, R3-AC4, R3-AC5, R17-AC1, R17-AC2, R17-AC3, R17-AC4, R17-AC5_
  - _Acceptance: Switching wallet refreshes all wallet-scoped data; no stale UI_

- [ ] 6. Demo Mode Banner Consistency
  - Search for existing demo/banner components/state
  - Sticky banner on all screens when demo is active
  - Exit demo works from any screen
  - _Requirements: R4-AC1, R4-AC2, R4-AC3, R4-AC4, R4-AC5_
  - _Acceptance: Banner present + consistent copy everywhere; exit always works_

- [ ] 7. Accessibility Baseline
  - Search for existing focus/ARIA/tap-target patterns
  - Ensure: visible focus states, ARIA labels, 44px tap targets, modal focus trap
  - _Requirements: R7-AC1, R7-AC2, R7-AC3, R7-AC4, R7-AC5_
  - _Acceptance: Keyboard-only navigation works across core flows_

## Phase 2: Screen-Specific Implementation

- [ ] 8. HOME (/) — First-Run Experience
  - Search for existing home components (src/pages/Home.tsx / src/app/page.tsx)
  - Outcome tiles above fold: Reduce Risk / Earn Safely / Save Taxes
  - "Next Best Action" CTA stack within 10 seconds
  - _Requirements: R8-AC1, R8-AC2, R8-AC3, R8-AC4, R8-AC5_
  - _Acceptance: New user can explain next step in <10 seconds_

- [ ] 9. HOME (/) — Metrics Transparency
  - Search for metric cards/stat displays
  - Add "How it's calculated" + last updated timestamp
  - Replace "Verifying documentation…" with methodology OR "Coming soon"
  - _Requirements: R9-AC1, R9-AC2, R9-AC3, R9-AC4, R9-AC5_
  - _Acceptance: Every headline metric has definition path + freshness indicator_

- [ ] 10. GUARDIAN (/guardian) — Wallet Scope Clarity
  - Add scope header: "Analyzing: [Wallet Name/Address]"
  - Ensure shown on Scan/Risks/Alerts/History
  - _Requirements: R10-AC3, R10-AC4_
  - _Acceptance: Wallet scope explicit everywhere in Guardian_

- [ ] 11. GUARDIAN (/guardian) — Risk Education
  - Extend risk cards with: plain-language impact + recommended action
  - _Requirements: R10-AC1, R10-AC2_
  - _Acceptance: Every risk card includes impact + action_

- [ ] 12. GUARDIAN (/guardian) — Pre-Transaction Confirmation (Intent Preview)
  - Extend existing modals/flows: show intent preview BEFORE wallet prompt
  - Must show: chain, target, action, value/amount, risk label/explanation, cancel path
  - _Requirements: R10-AC5, R19-AC1, R19-AC2, R19-AC3, R19-AC4, R19-AC5_
  - _Acceptance: No wallet prompt occurs without preview step_

- [ ] 13. HUNTER (/hunter) — Quest Transparency
  - "Join Quest" opens preview: steps, eligibility, network, time estimate, expected outcome
  - Wallet chip in header matches Guardian pattern
  - _Requirements: R11-AC1, R11-AC3, R11-AC4, R11-AC5_
  - _Acceptance: User understands what happens BEFORE joining_

- [ ] 14. HUNTER (/hunter) — Confidence Explanation
  - Tooltip or inline explainer: meaning of confidence and key factors
  - _Requirements: R11-AC2_
  - _Acceptance: Every confidence value has a clear explanation_

- [ ] 15. HUNTER (/hunter) — Filter Completeness
  - Either implement filters fully OR hide/remove until real
  - Provide Clear All + empty state reset CTA
  - _Requirements: R18-AC1, R18-AC2, R18-AC3, R18-AC4, R18-AC5_
  - _Acceptance: Zero dead filters; empty state is actionable_

- [ ] 16. HARVEST (/harvestpro) — Tax Compliance Disclaimer
  - Sticky disclaimer visible on all Harvest screens
  - _Requirements: R12-AC1_
  - _Acceptance: Disclaimer always visible; not silently dismissible_

- [ ] 17. HARVEST (/harvestpro) — Pre-Action Preview
  - "Start Harvest" MUST open preview first: sells list, benefit, gas/slippage, warnings
  - Scope line: "This affects Wallet X"
  - _Requirements: R12-AC2, R12-AC3, R12-AC4, R12-AC5 (+ R19 if shared intent preview is used)_
  - _Acceptance: No execution without preview_

- [ ] 18. PORTFOLIO (/portfolio) — Scope Clarity
  - Scope label: "Showing: Main Wallet" (or "All wallets")
  - All wallets toggle disabled w/ tooltip if not implemented
  - _Requirements: R13-AC1, R13-AC2_
  - _Acceptance: User always knows scope_

- [ ] 19. PORTFOLIO (/portfolio) — Search + Freshness
  - Search: implement or disable w/ tooltip
  - Add "Updated X ago" + refresh action
  - _Requirements: R13-AC3, R13-AC4, R13-AC5_
  - _Acceptance: No fake search; freshness always visible_

- [ ] 20. SETTINGS (/settings) — Account Management
  - Explain Guest vs Account + recovery path
  - Account section shows current status + recovery instructions
  - _Requirements: R14-AC1, R14-AC2, R16-AC5_
  - _Acceptance: Identity management clear + actionable_

- [ ] 21. SETTINGS (/settings) — Save Feedback
  - Loading state + success/error toast on any save
  - _Requirements: R14-AC3_
  - _Acceptance: All save actions provide feedback_

## Phase 3: Advanced Features

- [ ] 22. Authentication Flows & Session Management
  - Auth entry point within 2 taps everywhere
  - Stable identifier + working sign-out
  - Session expiry shows re-auth prompt without losing context
  - _Requirements: R16-AC1, R16-AC2, R16-AC3, R16-AC4_
  - _Acceptance: Auth usable + predictable_

- [ ] 23. Multi-Wallet Management & Persistence
  - Add multiple wallet support OR clearly state v1 limitations
  - Labeling (ENS/nickname) everywhere wallets appear
  - Persist wallet list + last active wallet for signed-in users OR clearly label as session-only for guests
  - _Requirements: R17-AC1, R17-AC2, R17-AC3, R17-AC4, R17-AC5_
  - _Acceptance: Multi-wallet works or limitations are explicit_

- [ ] 24. Monetization Transparency (Single Paywall Pattern)
  - One paywall component only (modal/drawer)
  - Pro badges on gated features; gated clicks always explain
  - _Requirements: R15-AC1, R15-AC2, R15-AC3, R15-AC4, R15-AC5_
  - _Acceptance: No surprise paywalls; one consistent implementation_

- [ ] 25. Privacy + Analytics Disclosure
  - Update privacy policy for what is collected + why
  - Add minimal cookie/telemetry disclosure if applicable
  - _Requirements: R20-AC1, R20-AC2, R20-AC3, R20-AC4, R20-AC5_
  - _Acceptance: Privacy transparency complete_

- [ ] 26. Launch Support Readiness
  - FAQ/help surface within 2 taps from Settings
  - "Known issues / status" hint during launch
  - Bug report includes basic context if possible
  - _Requirements: R21-AC1, R21-AC2, R21-AC3, R21-AC4, R21-AC5_
  - _Acceptance: Support is discoverable + useful_

## Phase 4: System States (Standardize using existing primitives only)

- [ ] 27. Standardize Loading States + Route Transition Fix (PERF-02)
  - Search for existing App Router loading.tsx files per route OR global shell loader
  - Add route-level skeletons and/or persistent shell (no blank screen ever)
  - Implement App Router loading.tsx per route OR global shell loader + top progress bar
  - Use React Query isLoading/isFetching (if present)
  - _Requirements: R1-AC3, R23-AC1_
  - _Acceptance: Loading feedback appears within 200ms everywhere needed; no white flash/dead air on route transitions_

- [ ] 28. Standardize Empty States
  - Use existing EmptyState/NoResults components
  - Every empty state must have a next action CTA
  - _Requirements: R23-AC2_
  - _Acceptance: No blank screens; empty states are actionable_

- [ ] 29. Standardize Error States
  - Use existing ErrorBoundary/InlineError/Toast patterns
  - Every error message must be user-actionable + include retry if possible
  - _Requirements: R21-AC3_
  - _Acceptance: Errors are recoverable or clearly explained_

- [ ] 30. Final Launch Gate Verification
  - "Touch everything" audit
  - 5+ minute session test (no freezes)
  - Verify P0 list passes
  - _Acceptance: Ready for v1 launch_

## Implementation Guardrails (Always On)

1. **Repo-wide search before any task**
2. **If implementation exists:** fix/wire/extend
3. **If it doesn't:** create minimal new code only after proving absence
4. **No parallel providers/stores/components** that duplicate responsibility
5. **Any non-working UI must be disabled + tooltip** (never inert)

## Notes

- All tasks follow search-first principle to prevent duplicate implementations
- Each task includes specific search targets and acceptance criteria
- Phased approach ensures P0 critical issues addressed first
- Focus on extending existing components rather than creating new ones
- Launch gate verification ensures readiness for v1 public release