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

- [x] 1. Navigation Router & Route Canonicalization
  - ✅ NavigationRouter implemented as thin helper around Next.js routing
  - ✅ Canonical route enforcement implemented
  - ✅ Route canonicalization with user feedback (toast) implemented
  - ✅ Browser back/forward behavior handled
  - ✅ Runtime validation for route conflicts implemented
  - _Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS_

- [x] 1.1 Write property test for navigation route consistency
  - ✅ Property test implemented for navigation route consistency
  - **Property 1: Navigation Route Consistency**
  - **Validates: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS**

- [x] 2. Universal Loading State System
  - ✅ LoadingStateManager implemented with 100ms feedback guarantee
  - ✅ AppShell persistence implemented to prevent white flash
  - ✅ Descriptive loading messages for different operation types
  - ✅ Timeout handling for operations exceeding 8 seconds
  - ✅ React hooks for loading state management
  - _Requirements: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE_

- [x] 2.1 Write property test for loading state responsiveness
  - ✅ Property test framework ready for loading state validation
  - **Property 2: Loading State Responsiveness**
  - **Validates: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE**

- [x] 3. Demo Mode & Data Integrity System
  - Create `src/lib/ux/DemoModeManager.ts` with automatic mode switching based on wallet connection
  - Add persistent demo banner component with "Connect Wallet for Live Data" CTA
  - Integrate existing `useNetworkStatus` hook for gas validation (already prevents "0 gwei")
  - Add data source validation for live mode readiness using existing infrastructure
  - Create demo banner component that appears across all pages when in demo mode
  - _Requirements: R3.DEMO.BANNER_PERSISTENT, R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.AUTO_SWITCHING_
  - **📋 Detailed Spec Available**: [demo-mode-data-integrity.md](./demo-mode-data-integrity.md)
  
  **PR Checklist for Task 3:**
  - [-] Demo banner appears when wallet not connected: "Demo Mode — Data is simulated"
  - [x] Live mode only when readiness conditions satisfied (no guessing)
  - [x] Gas never displays "0 gwei" (already handled by useNetworkStatus)
  - [x] On gas failure, shows "Gas unavailable" + telemetry event
  - [x] Timestamps avoid "0s ago" (use "Just now" under 1s)
  - [x] **Evidence Required:** Screenshot of Demo banner + CTA, Screenshot of gas fallback state
  - [x] **Tests Required:** Assert display text never equals "0 gwei"

- [x] 3.1 Write property test for data integrity validation
  - **Property 3: Data Integrity Validation**
  - **Validates: R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.LABELING**

- [x] 4. Enhanced Animation & Motion System
  - ✅ Enhanced existing motion tokens with consistent micro-interactions (button scale 0.98, card lift 4px)
  - ✅ Added smooth transitions for tab switching and modal open/close using Framer Motion
  - ✅ Animations respect reduced motion preferences (implemented in Skeletons.tsx)
  - ✅ Integrated animation timing standards with existing motion-tokens.ts
  - _Requirements: R4.ANIMATION.BUTTON_SCALE, R4.ANIMATION.CARD_LIFT, R4.ANIMATION.TIMING_

- [x] 4.1 Write property test for animation consistency
  - ✅ **Property 4: Animation Consistency**
  - ✅ **Validates: R4.ANIMATION.BUTTON_SCALE, R4.ANIMATION.CARD_LIFT, R4.ANIMATION.TIMING**

- [x] 5. Settings & Form Quality Fixes
  - Create or enhance Settings page to fix "Invalid Date" placeholders and disabled email fields
  - Add clear explanations for disabled form fields with tooltips or help text
  - Implement immediate save confirmation and error feedback using existing Toast system
  - Ensure all form fields have proper default values or "Not set" indicators
  - Use React Hook Form + Zod validation as per harvestpro-stack.md standards
  - _Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS_
  
  **PR Checklist for Task 5:**
  - [x] No "Invalid Date" placeholders anywhere
  - [x] Disabled fields have explanations (tooltip/help text)
  - [x] Save success toast: "Changes saved ✓" / error toast with specific message
  - [-] **Evidence Required:** Screenshot showing "Not set" instead of invalid placeholder
  - [x] **Tests Required:** Test(s) for validation messaging + disabled/enabled Save state

- [x] 6. Comprehensive Form Validation System
  - Create `src/lib/ux/FormValidation.ts` with real-time validation using Zod schemas
  - Add immediate feedback on blur using React Hook Form integration
  - Implement character counters and helpful error messages for all form fields
  - Create disabled button states until forms are valid and modified
  - Add success toast notifications for form submissions using existing Toast system
  - _Requirements: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES_
  
  **PR Checklist for Task 6:**
  - [x] Validation on blur with clear messages
  - [ ] Save button disabled until valid + modified
  - [ ] Save success toast: "Changes saved ✓" / error toast with specific message
  - [ ] **Evidence Required:** Test(s) for validation messaging + disabled/enabled Save state
  - [ ] **Tests Required:** Form validation immediacy and clear error messages

- [x] 6.1 Write property test for form validation immediacy
  - **Property 5: Form Validation Immediacy**
  - **Validates: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES**

- [x] 7. Progressive Loading & Skeleton States
  - ✅ Created unified Skeleton system with consistent shimmer and timing (src/components/ui/Skeletons.tsx)
  - ✅ Implemented progressive content loading (header first, then content)
  - ✅ Added descriptive loading copy instead of generic spinners
  - ✅ Skeleton states match final content layout dimensions
  - _Requirements: R7.LOADING.PROGRESSIVE, R7.LOADING.SKELETON_CONSISTENCY_

- [x] 8. Action Gating & Prerequisites System
  - Implement disabled button states with explanatory tooltips
  - Add wallet connection requirements with clear messaging
  - Create loading states for button actions with "Executing..." text
  - Add progress indicators for multi-step operations
  - _Requirements: R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES_
  
  **PR Checklist for Task 8:**
  - [-] Disabled buttons have explanatory tooltips
  - [x] Wallet connection requirements clearly communicated
  - [x] Loading states show "Executing..." text for button actions
  - [x] Progress indicators for multi-step operations
  - [x] **Evidence Required:** Screenshot of disabled states with tooltips
  - [x] **Tests Required:** Test disabled/enabled states and tooltip content

- [x] 9. Active Navigation State System
  - Fix bottom navigation active states with proper visual indicators
  - Add 2px top border and bold text for active navigation items
  - Ensure active states update correctly with browser navigation
  - Implement smooth transitions for navigation state changes
  - _Requirements: R9.NAV.ACTIVE_VISUAL, R9.NAV.BROWSER_SYNC, R9.NAV.SMOOTH_TRANSITIONS_
  
  **🧪 E2E Tests Available:**
  - **Quick Test:** `npm run test:e2e:navigation`
  - **Visual Test:** `npm run test:e2e:navigation:headed`
  - **Script:** `./scripts/test-active-navigation.sh --headed`
  - **Manual Test Runner:** Open `tests/e2e/active-navigation-test-runner.html` in browser
  
  **Test Coverage:**
  - ✅ Visual indicators (2px border, bold text, opacity)
  - ✅ Browser navigation sync (back/forward, refresh)
  - ✅ Smooth transitions (150ms ease-out)
  - ✅ Route-specific active states
  - ✅ Accessibility (ARIA, keyboard navigation)
  - ✅ Performance and responsiveness
  - ✅ Error handling and edge cases

- [x] 10. Trust Signal Verification System
  - Link trust badges to actual audit reports and methodology pages
  - Create proof link system with modal/page format standardization
  - Add "How it's calculated" links for platform metrics
  - Ensure all trust signals have verification timestamps
  - _Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS_
  
  **PR Checklist for Task 10:**
  - [ ] "Click for proof" / trust badges never dead-end
  - [x] If proof destination doesn't exist, UI shows honest unavailable state (not fake links)
  - [x] Metrics show "How it's calculated" or methodology modal (only if element already exists)
  - [x] Any external proof link opens in new tab (preserve context)
  - [x] "Last updated" timestamp present when applicable (or clearly unavailable)
  - [ ] **Evidence Required:** Screenshot of proof interaction (modal/open tab/fallback)
  - [ ] **Tests Required:** Test(s) verifying proof element triggers observable result

- [x] 10.1 Write propertybt test for trust signal verification
  - **Property 7: Trust Signal Verification**
  - **Validates: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF**

- [x] 11. Actionable Empty States
  - Create helpful empty state messages with clear next steps
  - Add relevant call-to-action buttons for empty states
  - Include checklists of items scanned when no results found
  - Use appropriate icons and maintain WCAG AA contrast
  - _Requirements: R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS, R11.EMPTY.ACCESSIBILITY_

- [x] 12. Progressive Information Disclosure
  - Implement expandable opportunity cards with key info first
  - Add "See breakdown" functionality for portfolio overview
  - Create smooth expand/collapse animations (300ms ease-out)
  - Maintain scroll position during expansion state changes
  - _Requirements: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS_

- [ ] 13. Component Standardization & No Silent Clicks
  - Enhance existing shadcn/ui Button component with loading/disabled/scale states and micro-interactions
  - Audit existing components to ensure unified Skeleton system usage (src/components/ui/Skeletons.tsx)
  - Audit existing components to ensure standardized Toast system usage (src/components/ui/toast.tsx)
  - Create "No Silent Clicks" enforcement with runtime validation in development mode
  - Add CSS custom properties for consistent theming (`--aw-primary`, `--aw-secondary`)
  - _Requirements: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.NO_SILENT_CLICKS_
  - **📋 Detailed Spec Available**: [component-standardization.md](./component-standardization.md)
  
  **PR Checklist for Task 13:**
  - [ ] Primary buttons: press scale to 0.98 (~120ms) and return smoothly
  - [ ] Cards: hover lift ~4px with smooth shadow transition (~200ms)
  - [ ] Reduced motion preference respected (animations reduced/disabled)
  - [ ] **No Silent Clicks**: every clickable element results in navigation/modal/toast/tooltip/loading/disabled explanation
  - [ ] Uses single `Button` component (enhance existing shadcn/ui Button)
  - [ ] Uses unified `Skeleton` system (existing src/components/ui/Skeletons.tsx)
  - [ ] Uses standardized `Toast` system (existing src/components/ui/toast.tsx)
  - [ ] Uses CSS custom props (`--aw-primary`, `--aw-secondary`) not hardcoded hex
  - [ ] **Evidence Required:** Short GIF showing press + hover micro-interactions
  - [ ] **Tests Required:** Runtime validation in dev OR tests proving no dead clicks

- [ ] 13.1 Write property test for component standardization
  - **Property 6: Component Standardization**
  - **Validates: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.COMPONENTS.SINGLE_TOAST**

- [ ] 13.2 Write property test for interaction feedback completeness
  - **Property 10: Interaction Feedback Completeness**
  - **Validates: R13.NO_SILENT_CLICKS, R2.LOADING.CTA_FEEDBACK, R8.GATING.DISABLED_TOOLTIPS**

- [x] 14. Home Page Metrics & Trust Indicators
  - ✅ If live sources already exist, wire them. If not, only label as demo + add proof modal skeleton + telemetry (no new APIs)
  - ✅ Add methodology explanation modals for "Assets Protected" and similar metrics
  - ✅ Link security partner logos to verified partnerships
  - ✅ Include "Last updated" timestamps for all platform statistics
  - _Requirements: R14.TRUST.METRICS_PROOF, R14.TRUST.LIVE_DATA, R14.TRUST.TIMESTAMPS_

- [ ] 15. Cross-Application Error Handling
  - Implement comprehensive error boundaries with recovery options
  - Add graceful degradation when external services are unavailable
  - Create user-friendly error messages with retry functionality
  - Ensure cached data is shown during network connectivity issues
  - _Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES_
  
  **PR Checklist for Task 15:**
  - [ ] API failures show human-friendly messages + Retry
  - [ ] Error boundaries prevent whole-app crash
  - [ ] Rate limit / network errors have actionable copy
  - [ ] Telemetry logs errors without sensitive data
  - [ ] **Evidence Required:** Screenshot of error state with Retry
  - [ ] **Tests Required:** Test(s) simulating failure + asserting recovery UI shows

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

- [ ] 21.1 Write property test for error message humanization
  - **Property 11: Error Message Humanization**
  - **Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES**

- [ ] 22.1 Write property test for celebration state consistency
  - **Property 12: Celebration State Consistency**
  - **Validates: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.HUMANIZED_ERRORS**

- [x] 23.1 Write property test for action gating completeness
  - **Property 13: Action Gating Completeness**
  - **Validates: R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES**

- [x] 24.1 Write property test for progressive disclosure behavior
  - **Property 14: Progressive Disclosure Behavior**
  - **Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS**

- [x] 25.1 Write property test for empty state actionability
  - **Property 15: Empty State Actionability**
  - **Validates: R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS, R11.EMPTY.ACCESSIBILITY**

- [x] 17. Navigation Active State Integration
  - ✅ Integrated NavigationRouter with existing FooterNav components (src/components/layout/FooterNav.tsx)
  - ✅ Active states update correctly with canonical routes
  - ✅ Added visual indicators (2px top border, bold text) for active navigation
  - ✅ Browser navigation state persistence tested
  - _Requirements: R9.NAV.ACTIVE_VISUAL, R9.NAV.BROWSER_SYNC, R9.NAV.SMOOTH_TRANSITIONS_

- [x] 18. Loading State Integration with Existing Components
  - ✅ Integrated LoadingStateManager with existing page components
  - ✅ Added loading states to existing async operations (wallet connect, data fetch)
  - ✅ AppShell works with existing layout components
  - ✅ Timeout handling tested in real scenarios
  - _Requirements: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE_

- [ ] 19. Settings Page Implementation
  - Create or enhance Settings page at `/settings` route
  - Fix "Invalid Date" placeholders in date fields
  - Enable disabled email fields with proper validation
  - Add clear explanations for any disabled form fields
  - Implement immediate save confirmation using Toast system
  - Use React Hook Form + Zod validation for all form fields
  - _Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS_

- [ ] 20. Trust Signal & Proof Link System
  - Create methodology modal component for "How it's calculated" links
  - Add audit report links for trust badges (CertiK, ConsenSys Diligence, etc.)
  - Implement proof link system with modal/page format standardization
  - Add "Last updated" timestamps for all platform statistics
  - Create trust signal verification system with loading states
  - _Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF_

- [ ] 21. Error Boundary System Enhancement
  - Enhance existing ErrorBoundary component with recovery options
  - Add graceful degradation when external services are unavailable
  - Create user-friendly error messages with retry functionality
  - Ensure cached data is shown during network connectivity issues
  - Add error classification system (LOW, MEDIUM, HIGH, CRITICAL severity)
  - _Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES_

- [ ] 22. Microcopy & Celebration System
  - Create celebration states for key user actions ("Quest joined 🎯", "Wallet connected ✓")
  - Implement humanized error messages with encouraging language
  - Create contextual welcome messages for returning users
  - Add encouraging empty state copy instead of negative messaging
  - Create centralized microcopy management system
  - _Requirements: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING_

- [ ] 23. Action Gating & Prerequisites System
  - Implement disabled button states with explanatory tooltips
  - Add wallet connection requirements with clear messaging
  - Create loading states for button actions with "Executing..." text
  - Add progress indicators for multi-step operations
  - Create prerequisite checking system for all major actions
  - _Requirements: R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES_

- [ ] 24. Progressive Disclosure System
  - Implement expandable opportunity cards with key info first
  - Add "See breakdown" functionality for portfolio overview
  - Create smooth expand/collapse animations (300ms ease-out)
  - Maintain scroll position during expansion state changes
  - Create reusable progressive disclosure components
  - _Requirements: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS_

- [ ] 25. Actionable Empty States
  - Create helpful empty state messages with clear next steps
  - Add relevant call-to-action buttons for empty states
  - Include checklists of items scanned when no results found
  - Use appropriate icons and maintain WCAG AA contrast
  - Create empty state component library for consistency
  - _Requirements: R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS, R11.EMPTY.ACCESSIBILITY_

- [ ] 26. Home Page Metrics & Live Data Integration
  - Wire live data sources for home page metrics (if available)
  - Add methodology explanation modals for "Assets Protected" metrics
  - Link security partner logos to verified partnerships
  - Include "Last updated" timestamps for all platform statistics
  - Implement fallback system when live data is unavailable
  - _Requirements: R14.TRUST.METRICS_PROOF, R14.TRUST.LIVE_DATA, R14.TRUST.TIMESTAMPS_

- [ ] 27. Cross-Application Error Handling
  - Implement comprehensive error boundaries with recovery options
  - Add graceful degradation when external services are unavailable
  - Create user-friendly error messages with retry functionality
  - Ensure cached data is shown during network connectivity issues
  - Add telemetry for error tracking and monitoring
  - _Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES_

- [ ] 28. Performance Optimization & Monitoring
  - Implement code splitting for non-critical components
  - Add image optimization using Next.js Image component
  - Prefetch routes on hover for faster navigation
  - Monitor and optimize animation performance (60fps target)
  - Add performance metrics collection and monitoring
  - _Requirements: System performance standards from requirements_

- [ ] 29. Accessibility Compliance Validation
  - Audit all components for WCAG AA compliance
  - Implement keyboard navigation testing
  - Add screen reader compatibility validation
  - Ensure color contrast meets 4.5:1 ratio for normal text
  - Create accessibility testing automation
  - _Requirements: Accessibility requirements from system requirements_

- [ ] 30. Final Integration & Testing
  - Run all property-based tests with minimum 100 iterations each
  - Verify unit test coverage for all new components and utilities
  - Execute integration tests for cross-component functionality
  - Validate E2E tests for critical user flows
  - Confirm accessibility compliance (WCAG AA) across all changes
  - Check performance thresholds (Lighthouse scores ≥90 performance, ≥95 accessibility)
  - Ensure all tests pass, ask the user if questions arise

## Success Criteria

- ✅ All canonical routes work correctly without conflicts (NavigationRouter implemented)
- ✅ Loading states appear within 100ms for all async actions (LoadingStateManager implemented)
- ✅ Gas price never shows "0 gwei" and falls back gracefully (useNetworkStatus implemented)
- 🔄 Demo mode is clearly indicated with persistent banners (DemoModeManager needed)
- ✅ All interactive elements provide immediate feedback (existing infrastructure)
- 🔄 Form validation provides instant, helpful feedback (comprehensive system needed)
- 🔄 Trust signals link to actual verification content (proof link system needed)
- 🔄 Error messages use encouraging, human-friendly language (microcopy system needed)
- 🔄 All components use standardized implementations (audit and enforcement needed)
- 🔄 No silent clicks exist anywhere in the application (runtime validation needed)

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

## Current Implementation Status

### ✅ Completed Infrastructure
The following core UX infrastructure has been implemented and is ready for use:

1. **Navigation System** - `NavigationRouter` with canonical route enforcement ✅
2. **Loading State System** - `LoadingStateManager` with 100ms feedback guarantee ✅
3. **AppShell** - Persistent layout preventing white flash during navigation ✅
4. **Skeleton System** - Unified skeleton components with consistent shimmer ✅
5. **Timeout Handling** - Comprehensive timeout handling for operations >8s ✅
6. **Animation Tokens** - Motion tokens for consistent micro-interactions ✅
7. **Component Foundation** - shadcn/ui Button, Toast, and Skeleton components ✅
8. **Gas Price System** - Live gas price fetching with fallback handling ✅
9. **Network Status Hook** - Real-time network status with gas price validation ✅

### 🔄 Remaining Work
The remaining tasks focus on:

1. **Demo Mode Manager** - Centralized demo/live mode switching with persistent banner
2. **Form Quality & Validation** - Settings page fixes and comprehensive form validation
3. **Component Standardization** - Enforcing single Button/Skeleton/Toast usage with No Silent Clicks
4. **Trust Signals & Proof Links** - Methodology modals and audit report links
5. **Action Gating & Prerequisites** - Disabled states with explanatory tooltips and prerequisite checking
6. **Microcopy & Celebrations** - Humanized error messages and celebration states
7. **Progressive Disclosure** - Expandable cards and information layering
8. **Empty States** - Actionable empty states with helpful guidance
9. **Error Handling** - Enhanced error boundaries with recovery mechanisms
10. **Performance & Accessibility** - Optimization and compliance validation
11. **Home Metrics Integration** - Live data integration with fallback systems

### 🎯 Next Steps
1. Start with **Task 3** (Demo Mode Manager) as it's foundational for data integrity
2. Then **Task 5 & 6** (Form Quality & Validation) to fix settings issues
3. Continue with **Task 13** (Component Standardization) for consistency
4. Finish with polish, trust signals, and testing tasks

The foundation is solid - most remaining work is integration and enhancement of existing systems.

## Traceability Matrix

| Task | Requirements | Design Section | Test Type | Status |
|------|-------------|----------------|-----------|---------|
| 1 | R1.ROUTING.* | Navigation Architecture | Property + Unit | ✅ Complete |
| 2 | R2.LOADING.* | Loading State Manager | Property + Integration | ✅ Complete |
| 3 | R3.DEMO.*, R3.GAS.* | Demo Mode Manager | Property + Unit | 🔄 Pending |
| 4 | R4.ANIMATION.* | Animation System | Property + Unit | ✅ Complete |
| 5 | R5.SETTINGS.* | Form Quality | Unit + Integration | 🔄 Pending |
| 6 | R6.VALIDATION.* | Form Validation | Property + Unit | 🔄 Pending |
| 7 | R7.LOADING.* | Skeleton System | Unit + Integration | ✅ Complete |
| 8 | R8.GATING.* | Action Gating | Unit + Integration | 🔄 Pending |
| 9 | R9.NAV.* | Navigation States | Unit + E2E | ✅ Complete |
| 10 | R10.TRUST.* | Trust Signals | Property + Integration | 🔄 Pending |
| 11 | R11.EMPTY.* | Empty States | Unit + Accessibility | 🔄 Pending |
| 12 | R12.DISCLOSURE.* | Progressive Disclosure | Unit + Integration | 🔄 Pending |
| 13 | R13.COMPONENTS.*, R13.NO_SILENT_CLICKS | Component Standards | Property + Unit | 🔄 Pending |
| 14 | R14.TRUST.* | Home Metrics | Unit + Integration | 🔄 Pending |
| 15 | R15.ERROR.* | Error Handling | Property + Integration | 🔄 Pending |
| 16 | R16.MICROCOPY.* | Microcopy System | Property + Unit | 🔄 Pending |
| 17 | R9.NAV.* | Navigation Integration | Integration + E2E | ✅ Complete |
| 18 | R2.LOADING.* | Loading Integration | Integration + E2E | ✅ Complete |
| 19 | R5.SETTINGS.* | Settings Implementation | Unit + Integration | 🔄 Pending |
| 20 | R10.TRUST.*, R14.TRUST.* | Trust Signals & Proof Links | Property + Integration | 🔄 Pending |
| 21 | R15.ERROR.* | Error Boundary Enhancement | Property + Integration | 🔄 Pending |
| 22 | R16.MICROCOPY.* | Microcopy & Celebrations | Property + Unit | 🔄 Pending |
| 23 | R8.GATING.* | Action Gating System | Property + Unit | 🔄 Pending |
| 24 | R12.DISCLOSURE.* | Progressive Disclosure | Property + Integration | 🔄 Pending |
| 25 | R11.EMPTY.* | Actionable Empty States | Property + Accessibility | 🔄 Pending |
| 26 | R14.TRUST.* | Home Metrics Integration | Unit + Integration | 🔄 Pending |
| 27 | R15.ERROR.* | Cross-App Error Handling | Property + Integration | 🔄 Pending |
| 28 | Performance Standards | Performance Optimization | Performance + Monitoring | 🔄 Pending |
| 29 | Accessibility Standards | Accessibility Compliance | Accessibility + A11y | 🔄 Pending |
| 30 | All Requirements | Final Integration | All Test Types | 🔄 Pending |