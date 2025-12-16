# Implementation Plan: AlphaWhale UX Gap Improvements

## 🚨 SCOPE LOCK — READ BEFORE IMPLEMENTATION

This work is strictly limited to UX gap remediation and quality fixes.

### ABSOLUTELY FORBIDDEN
- ❌ Creating new pages, screens, or routes
- ❌ Creating new product features or flows  
- ❌ Creating new data models, schemas, or APIs
- ❌ Adding new widgets, dashboards, or analytics
- ❌ Renaming or restructuring existing product concepts
- ❌ Introducing new demo data beyond labeling existing demo data

### ALLOWED ONLY
- ✅ Fixing incorrect routing to canonical routes
- ✅ Adding loading, skeleton, error, and disabled states
- ✅ Standardizing existing components (button, skeleton, toast)
- ✅ Validating and guarding existing data display (e.g., gas, metrics)
- ✅ Adding banners, tooltips, microcopy, and transitions
- ✅ Adding tests that enforce existing requirements

### TRACEABILITY RULE
Every code change MUST reference:
- A Requirement ID (e.g. `R3.GAS.NONZERO`)
- A Design section (e.g. `Design → Data Integrity → Gas Oracle Rules`)

If a change cannot be traced to an explicit requirement or design section, **IT MUST NOT BE IMPLEMENTED.**

## 🔒 KIRO EXECUTION GUARDRAILS (Anti-Hallucination)

### Architecture Constraint
**DO NOT** create a new routing system. Any "NavigationRouter" must be a thin helper around existing Next.js routing primitives only.

### API/Backend Constraint  
**DO NOT** create new API routes, Edge Functions, schemas, or tables. "Gas Oracle" and "Home Metrics live data" must use existing infrastructure only. If required live sources do not exist, implement UX-safe fallback: Demo labeling + "unavailable" states + retry UI + telemetry.

### Test Constraint
Tests must validate observable UI behavior (URL, active nav state, banners, toasts, loading timing), not imaginary internal return values.

### UI Enhancement Constraint
- ✅ **Allowed**: Improving existing components/screens only where the UI already contains the element
- ❌ **Forbidden**: Creating new UI sections to satisfy a requirement if the section doesn't already exist

---

## 🚀 Quick Start Guide

**Implementation Workflow:**
1. **Pick a task** → Implement code → Write tests → Gather evidence
2. **Create PR** → Use embedded checklist → Add traceability map → Attach evidence
3. **Review** → Use full checklist in [PR_CHECKLIST.md](./PR_CHECKLIST.md)

**Each task below includes:**
- ✅ Implementation requirements
- 📋 Embedded PR checklist items
- 📸 Required evidence types
- 🧪 Test requirements

## Implementation Tasks

Each task includes integrated PR checklist requirements. When completing a task, use the embedded checklist items for your PR.

- [ ] 1. Navigation Router & Route Canonicalization
  - NavigationRouter MUST be a thin helper around existing Next.js router utilities. No new routing framework.
  - Implement canonical route enforcement using existing Next.js routing
  - Add route canonicalization for missing/invalid tabs with user feedback
  - Ensure deterministic browser back/forward behavior
  - Add runtime validation for route conflicts
  - _Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS_
  
  **PR Checklist for Task 1:**
  - [ ] Bottom nav routes exactly to canonical paths (Home→`/`, Guardian→`/guardian`, Hunter→`/hunter`, etc.)
  - [ ] Deep links restore deterministically (back/forward works)
  - [ ] Invalid tabs canonicalize with user feedback (toast), no crashes
  - [ ] Active nav state updates immediately and persists across refresh
  - [ ] **Evidence Required:** Screenshot/GIF showing each nav click landing correctly + Route diff proof in PR description
  - [ ] **Tests Required:** Assert URL + active state (observable behavior)

- [ ] 1.1 Write property test for navigation route consistency
  - **Property 1: Navigation Route Consistency**
  - **Validates: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS**

- [ ] 2. Universal Loading State System
  - Create LoadingStateManager for consistent 100ms feedback
  - Implement AppShell persistence to prevent white flash during navigation
  - Add descriptive loading messages for different operation types
  - Create timeout handling for operations exceeding 8 seconds
  - _Requirements: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE_
  
  **PR Checklist for Task 2:**
  - [ ] Any async action shows feedback within 100ms (button loading, skeleton, or descriptive loader)
  - [ ] AppShell persists (no white flash; header + bottom nav stay mounted)
  - [ ] Timeout behavior >8s shows error state + Retry
  - [ ] Skeleton dimensions match final layout (no layout shift)
  - [ ] **Evidence Required:** Video/GIF showing navigation with shell persistent
  - [ ] **Tests Required:** Loading UI appears quickly (observable behavior)

- [ ] 2.1 Write property test for loading state responsiveness
  - **Property 2: Loading State Responsiveness**
  - **Validates: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE**

- [ ] 3. Demo Mode & Data Integrity System
  - Implement DemoModeManager with automatic mode switching based on wallet connection
  - Add persistent demo banner with "Connect Wallet for Live Data" CTA
  - Gas fetch MUST NOT introduce new backend routes/APIs. Use existing provider integration or direct fetch only.
  - Add gas validation (never "0 gwei", 30s refresh, 60s cache)
  - Add data source validation for live mode readiness
  - _Requirements: R3.DEMO.BANNER_PERSISTENT, R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.AUTO_SWITCHING_
  
  **PR Checklist for Task 3:**
  - [ ] Demo banner appears when wallet not connected: "Demo Mode — Data is simulated"
  - [ ] Live mode only when readiness conditions satisfied (no guessing)
  - [ ] Gas never displays "0 gwei"
  - [ ] On gas failure, shows "Gas unavailable" + telemetry event
  - [ ] Timestamps avoid "0s ago" (use "Just now" under 1s)
  - [ ] **Evidence Required:** Screenshot of Demo banner + CTA, Screenshot of gas fallback state
  - [ ] **Tests Required:** Assert display text never equals "0 gwei"

- [ ] 3.1 Write property test for data integrity validation
  - **Property 3: Data Integrity Validation**
  - **Validates: R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.LABELING**

- [ ] 4. Global Animation & Motion System
  - Implement consistent micro-interactions (button scale 0.98, card lift 4px)
  - Add smooth transitions for tab switching and modal open/close
  - Ensure animations respect reduced motion preferences
  - Create animation timing standards across all components
  - _Requirements: R4.ANIMATION.BUTTON_SCALE, R4.ANIMATION.CARD_LIFT, R4.ANIMATION.TIMING_

- [ ] 4.1 Write property test for animation consistency
  - **Property 4: Animation Consistency**
  - **Validates: R4.ANIMATION.BUTTON_SCALE, R4.ANIMATION.CARD_LIFT, R4.ANIMATION.TIMING**

- [ ] 5. Settings & Form Quality Fixes
  - Fix "Invalid Date" placeholders and disabled email fields in Settings
  - Add clear explanations for disabled form fields
  - Implement immediate save confirmation and error feedback
  - Ensure all form fields have proper default values or "Not set" indicators
  - _Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS_

- [ ] 6. Comprehensive Form Validation System
  - Add real-time validation with immediate feedback on blur
  - Implement character counters and helpful error messages
  - Create disabled button states until forms are valid and modified
  - Add success toast notifications for form submissions
  - _Requirements: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES_

- [ ] 6.1 Write property test for form validation immediacy
  - **Property 5: Form Validation Immediacy**
  - **Validates: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES**

- [ ] 7. Progressive Loading & Skeleton States
  - Create unified Skeleton system with consistent shimmer and timing
  - Implement progressive content loading (header first, then content)
  - Add descriptive loading copy instead of generic spinners
  - Ensure skeleton states match final content layout dimensions
  - _Requirements: R7.LOADING.PROGRESSIVE, R7.LOADING.SKELETON_CONSISTENCY_

- [ ] 8. Action Gating & Prerequisites System
  - Implement disabled button states with explanatory tooltips
  - Add wallet connection requirements with clear messaging
  - Create loading states for button actions with "Executing..." text
  - Add progress indicators for multi-step operations
  - _Requirements: R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES_

- [ ] 9. Active Navigation State System
  - Fix bottom navigation active states with proper visual indicators
  - Add 2px top border and bold text for active navigation items
  - Ensure active states update correctly with browser navigation
  - Implement smooth transitions for navigation state changes
  - _Requirements: R9.NAV.ACTIVE_VISUAL, R9.NAV.BROWSER_SYNC, R9.NAV.SMOOTH_TRANSITIONS_

- [ ] 10. Trust Signal Verification System
  - Link trust badges to actual audit reports and methodology pages
  - Create proof link system with modal/page format standardization
  - Add "How it's calculated" links for platform metrics
  - Ensure all trust signals have verification timestamps
  - _Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS_

- [ ] 10.1 Write property test for trust signal verification
  - **Property 7: Trust Signal Verification**
  - **Validates: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF**

- [ ] 11. Actionable Empty States
  - Create helpful empty state messages with clear next steps
  - Add relevant call-to-action buttons for empty states
  - Include checklists of items scanned when no results found
  - Use appropriate icons and maintain WCAG AA contrast
  - _Requirements: R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS, R11.EMPTY.ACCESSIBILITY_

- [ ] 12. Progressive Information Disclosure
  - Implement expandable opportunity cards with key info first
  - Add "See breakdown" functionality for portfolio overview
  - Create smooth expand/collapse animations (300ms ease-out)
  - Maintain scroll position during expansion state changes
  - _Requirements: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS_

- [ ] 13. Component Standardization & No Silent Clicks
  - Create single PrimaryButton component with loading/disabled/scale states
  - Implement unified Skeleton system with consistent shimmer
  - Build standardized Toast system with success/error/info templates
  - Add "No Silent Clicks" enforcement with runtime validation
  - _Requirements: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.NO_SILENT_CLICKS_
  
  **PR Checklist for Task 13:**
  - [ ] Primary buttons: press scale to 0.98 (~120ms) and return smoothly
  - [ ] Cards: hover lift ~4px with smooth shadow transition (~200ms)
  - [ ] Reduced motion preference respected (animations reduced/disabled)
  - [ ] **No Silent Clicks**: every clickable element results in navigation/modal/toast/tooltip/loading/disabled explanation
  - [ ] Uses single `PrimaryButton` (no ad-hoc primary `<button>`)
  - [ ] Uses unified `Skeleton` system
  - [ ] Uses standardized `Toast` system
  - [ ] Uses CSS custom props (`--aw-primary`, `--aw-secondary`) not hardcoded hex
  - [ ] **Evidence Required:** Short GIF showing press + hover micro-interactions
  - [ ] **Tests Required:** Runtime validation in dev OR tests proving no dead clicks

- [ ] 13.1 Write property test for component standardization
  - **Property 6: Component Standardization**
  - **Validates: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.COMPONENTS.SINGLE_TOAST**

- [ ] 13.2 Write property test for interaction feedback completeness
  - **Property 10: Interaction Feedback Completeness**
  - **Validates: R13.NO_SILENT_CLICKS, R2.LOADING.CTA_FEEDBACK, R8.GATING.DISABLED_TOOLTIPS**

- [ ] 14. Home Page Metrics & Trust Indicators
  - If live sources already exist, wire them. If not, only label as demo + add proof modal skeleton + telemetry (no new APIs)
  - Add methodology explanation modals for "Assets Protected" and similar metrics
  - Link security partner logos to verified partnerships
  - Include "Last updated" timestamps for all platform statistics
  - _Requirements: R14.TRUST.METRICS_PROOF, R14.TRUST.LIVE_DATA, R14.TRUST.TIMESTAMPS_

- [ ] 15. Cross-Application Error Handling
  - Implement comprehensive error boundaries with recovery options
  - Add graceful degradation when external services are unavailable
  - Create user-friendly error messages with retry functionality
  - Ensure cached data is shown during network connectivity issues
  - _Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES_

- [ ] 15.1 Write property test for error message humanization
  - **Property 8: Error Message Humanization**
  - **Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES**

- [ ] 16. Human Microcopy & Delight Moments
  - Add celebration states for key user actions ("Quest joined 🎯", "Wallet connected ✓")
  - Implement humanized error messages with encouraging language
  - Create contextual welcome messages for returning users
  - Add encouraging empty state copy instead of negative messaging
  - _Requirements: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING_

- [ ] 16.1 Write property test for demo mode clarity
  - **Property 9: Demo Mode Clarity**
  - **Validates: R3.DEMO.BANNER_PERSISTENT, R3.DEMO.NEVER_MIXED, R3.DEMO.AUTO_SWITCHING**

- [ ] 17. Checkpoint - Ensure all tests pass
  - Run all property-based tests with minimum 100 iterations each
  - Verify unit test coverage for all new components and utilities
  - Execute integration tests for cross-component functionality
  - Validate E2E tests for critical user flows
  - Confirm accessibility compliance (WCAG AA) across all changes
  - Check performance thresholds (Lighthouse scores ≥90 performance, ≥95 accessibility)
  - Ensure all tests pass, ask the user if questions arise

## Success Criteria

- All canonical routes work correctly without conflicts
- Loading states appear within 100ms for all async actions
- Gas price never shows "0 gwei" and falls back gracefully
- Demo mode is clearly indicated with persistent banners
- All interactive elements provide immediate feedback
- Form validation provides instant, helpful feedback
- Trust signals link to actual verification content
- Error messages use encouraging, human-friendly language
- All components use standardized implementations
- No silent clicks exist anywhere in the application

## Testing Requirements

Each task must include:
- **Property-based tests** for universal behaviors (marked with *)
- **Unit tests** for component functionality
- **Integration tests** for cross-component interactions
- **Accessibility tests** for WCAG AA compliance
- **Performance tests** for loading and animation timing

## PR Workflow Integration

### Step 1: Implementation
1. Pick a task from the list above
2. Implement the code changes
3. Write the required tests (property-based + unit/integration)
4. Gather evidence as specified in the task's PR checklist

### Step 2: PR Preparation
1. Use the embedded PR checklist items from your completed task
2. Create traceability map in PR description:

```
| File | Change | Requirement | Design |
|------|--------|-------------|--------|
| src/components/nav/BottomNav.tsx | Fix routing | R1.ROUTING.CANONICAL | Design → Navigation Architecture |
| src/lib/router/canonicalize.ts | Add validation | R1.ROUTING.DETERMINISTIC | Design → Route Canonicalization |
```

3. Add evidence attachments (screenshots, GIFs, test results)
4. Reference the full PR checklist: `.kiro/specs/ux-gap-requirements/PR_CHECKLIST.md`

### Step 3: PR Submission
- Title: `[UX-GAP] Task X: Brief Description`
- Labels: `ux-gap`
- Use PR template that auto-loads from `.github/pull_request_template.md`
- Fill out sections using your task's embedded checklist items

### Quick PR Template Reference
For detailed PR checklist, see: [PR_CHECKLIST.md](./PR_CHECKLIST.md)

**Hard Gates (Must Pass):**
- [ ] Scope Lock (no new pages/features/APIs/data)
- [ ] Traceability (Req + Design for every change)
- [ ] Tests pass (unit/integration/e2e as applicable)
- [ ] No Silent Clicks respected
- [ ] No new deps / no backend changes

## Traceability Matrix

| Task | Requirements | Design Section | Test Type |
|------|-------------|----------------|-----------|
| 1 | R1.ROUTING.* | Navigation Architecture | Property + Unit |
| 2 | R2.LOADING.* | Loading State Manager | Property + Integration |
| 3 | R3.DEMO.*, R3.GAS.* | Demo Mode Manager | Property + Unit |
| 4 | R4.ANIMATION.* | Animation System | Property + Unit |
| 5 | R5.SETTINGS.* | Form Quality | Unit + Integration |
| 6 | R6.VALIDATION.* | Form Validation | Property + Unit |
| 7 | R7.LOADING.* | Skeleton System | Unit + Integration |
| 8 | R8.GATING.* | Action Gating | Unit + Integration |
| 9 | R9.NAV.* | Navigation States | Unit + E2E |
| 10 | R10.TRUST.* | Trust Signals | Property + Integration |
| 11 | R11.EMPTY.* | Empty States | Unit + Accessibility |
| 12 | R12.DISCLOSURE.* | Progressive Disclosure | Unit + Integration |
| 13 | R13.COMPONENTS.*, R13.NO_SILENT_CLICKS | Component Standards | Property + Unit |
| 14 | R14.TRUST.* | Home Metrics | Unit + Integration |
| 15 | R15.ERROR.* | Error Handling | Property + Integration |
| 16 | R16.MICROCOPY.* | Microcopy System | Property + Unit |