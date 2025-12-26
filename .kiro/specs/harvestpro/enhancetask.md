# HarvestPro UX Enhancement Tasks

## 🚨 SCOPE LOCK — READ BEFORE IMPLEMENTATION

This work is strictly limited to UX gap remediation and quality fixes for the **existing HarvestPro implementation**.

### ABSOLUTELY FORBIDDEN
- ❌ Creating new pages, screens, or routes (HarvestPro page already exists at `/harvestpro`)
- ❌ Creating new product features or flows  
- ❌ Creating new data models, schemas, or APIs
- ❌ Adding new widgets, dashboards, or analytics
- ❌ Renaming or restructuring existing product concepts
- ❌ Introducing new demo data beyond labeling existing demo data
- ❌ Creating new modals/pages for proof/help — use existing modal/tooltip components only
- ❌ Adding new caching layers or performance infra — only tune existing client cache settings
- ❌ Creating new modal systems or modal infrastructure — use existing HarvestDetailModal and toast components only
- ❌ Creating new caching systems or cache infrastructure — only adjust existing React Query cache TTL settings

### ALLOWED ONLY
- ✅ Fixing incorrect routing to canonical routes
- ✅ Adding loading, skeleton, error, and disabled states to existing components
- ✅ Standardizing existing components (button, skeleton, toast)
- ✅ Validating and guarding existing data display (e.g., gas, metrics)
- ✅ Adding banners, tooltips, microcopy, and transitions
- ✅ Adding tests that enforce existing requirements

### TRACEABILITY RULE
Every code change MUST reference:
- A Requirement ID (e.g. `R3.GAS.NONZERO`)
- A Design section (e.g. `Design → Data Integrity → Gas Oracle Rules`)

If a change cannot be traced to an explicit requirement or design section, **IT MUST NOT BE IMPLEMENTED.**

## Overview

The existing HarvestPro implementation at `src/pages/HarvestPro.tsx` is functionally complete with components, hooks, and mock data. This enhancement plan focuses on applying UX Gap Requirements to improve the existing implementation's user experience, data integrity, and interaction quality.

**Router Architecture:** This project uses Next.js Pages Router (not App Router). The HarvestPro page already exists at `src/pages/HarvestPro.tsx` and routes to `/harvestpro`. DO NOT create new route files or modify the routing system.

## Current HarvestPro Implementation Analysis

**Existing Components (DO NOT RECREATE):**
- ✅ `HarvestProHeader` - Header with demo/live toggle and refresh
- ✅ `FilterChipRow` - Filter chips for opportunities
- ✅ `HarvestSummaryCard` - Summary metrics display
- ✅ `HarvestOpportunityCard` - Individual opportunity cards
- ✅ `HarvestDetailModal` - Opportunity detail modal
- ✅ `HarvestSuccessScreen` - Success completion screen
- ✅ Skeleton components for loading states
- ✅ Empty state components (NoWalletsConnected, NoOpportunitiesDetected, etc.)
- ✅ Mock data system with realistic opportunities
- ✅ Demo state switcher for testing different view states

**Existing Functionality (DO NOT RECREATE):**
- ✅ Demo/Live mode switching
- ✅ Pull-to-refresh functionality
- ✅ Opportunity filtering and display
- ✅ Modal interactions and execution flow
- ✅ CSV export generation
- ✅ Responsive layout and mobile optimization
- ✅ Wallet connection integration
- ✅ Success screen with confetti animation

## Enhancement Tasks

### Task 0: CRITICAL App Store Compliance (MANDATORY - ADD BEFORE Task 1)

**Scope:** Essential App Store compliance requirements that must be implemented first

- [x] **0.1 Legal Disclosure Modal (MANDATORY)**
  - Implement a Disclosure step/state using the existing HarvestDetailModal component (no new modal component/file). Trigger it on first visit.
  - Disclosure UI must be rendered by reusing HarvestDetailModal with a variant="disclosure" prop or similar (reusing existing modal).
  - Show on first HarvestPro visit: "Informational outputs only", "No tax/legal/financial advice", "Verify with a tax professional", "All transactions require confirmation in your wallet"
  - Store `{disclosureAccepted, version, timestamp}` in localStorage or existing user state
  - Re-prompt if `disclosureVersion` changes
  - _Requirements: Enhanced Req 0 AC1-5_
  - _Design: Legal Compliance → Disclosure Requirements_
  - _Effort: 3h_

- [x] **0.2 Copy Safety Lint (MANDATORY)**
  - Audit existing HarvestPro components: `grep -r "Execute\|Guaranteed\|IRS-ready" src/components/harvestpro/` → 0 results
  - Create unit test blocking forbidden phrases in HarvestPro UI copy
  - Replace: "Execute" → "Prepare", "IRS-ready" → "8949-compatible", "Guaranteed" → "Estimated"
  - _Requirements: Enhanced Req 27 AC1-5_
  - _Design: Apple-Safe UI Copy → Forbidden Phrases_
  - _Effort: 2h_

- [ ] **0.3 Form 8949 Export Columns (MANDATORY)**
  - Update existing CSV generation in `handleDownloadCSV`: add `term`, `quantity`, `source`, `tx_hash`, `fee_usd` columns
  - Add metadata header: "Accounting: FIFO, Not a tax filing"
  - Test opens correctly in Excel/Sheets/Numbers
  - _Requirements: Enhanced Req 21 AC1-5_
  - _Design: Export Enhancement → Form 8949 Compatibility_
  - _Effort: 4h_

### Task 1: Apply UX Gap Requirements to Existing HarvestPro Components

**Scope:** Enhance existing components with UX Gap Requirements compliance

- [x] **1.1 Fix Navigation Integration**
  - Ensure `/harvestpro` route works correctly with existing Next.js Pages Router
  - Verify bottom navigation "HarvestPro" item routes correctly to `/harvestpro`
  - Add active state styling when on HarvestPro page using existing navigation components
  - _Requirements: Enhanced Req 18 AC1 (responsive nav)_
  - _Design: Navigation Architecture → Route Canonicalization_

- [x] **1.2 Enhance Loading States**
  - Ensure all async operations show loading feedback within 100ms
  - Add descriptive loading messages ("Scanning opportunities...", "Preparing harvest...")
  - Add UI timeout state (banner + retry) using existing toast/error banner patterns when an existing request exceeds 8s. Do not add new infra; just UI handling around existing async calls.
  - _Requirements: Enhanced Req 14 AC1-3 (error banners) + Enhanced Req 17 AC1-2 (performance)_
  - _Design: Loading State Manager → Universal Feedback_

- [x] **1.3 Improve Demo Mode Integration**
  - Add persistent demo banner when in demo mode: "Demo Mode — Data is simulated"
  - Include "Connect Wallet for Live Data" CTA in demo banner
  - Ensure demo data is clearly labeled and never mixed with live data
  - _Requirements: Enhanced Req 30 AC2-3 (demo badges)_
  - _Design: Demo Mode Manager → Mode Switching_

- [x] **1.4 Enhance Micro-Interactions**
  - Add button scale animation (0.98) for primary CTAs
  - Implement card lift animation (4px) on hover for opportunity cards
  - Ensure smooth transitions for modal open/close and tab switching
  - _Requirements: Enhanced Req 18 AC2-3 (responsive design)_
  - _Design: Animation System → Micro-Interactions_

### Task 2: Standardize Existing Components

**Scope:** Apply component standardization to existing HarvestPro components

- [x] **2.1 Audit Button Usage**
  - Ensure all primary CTAs use standardized PrimaryButton component
  - Add loading states with spinner and "Preparing..." text for harvest actions
  - Implement disabled states with explanatory tooltips
  - _Requirements: Enhanced Req 13 AC1-2 (single button system), Enhanced Req 8 AC1-3 (disabled tooltips)_
  - _Design: Component Standards → Single Button System_

- [ ] **2.2 Standardize Skeleton Components**
  - Ensure all loading states use unified Skeleton system
  - Verify consistent shimmer animation and border radius
  - Match skeleton dimensions to final content layout
  - _Requirements: Enhanced Req 13 AC3-4 (skeleton consistency), Enhanced Req 7 AC1-2 (loading consistency)_
  - _Design: Component Standards → Skeleton System_

- [ ] **2.3 Implement No Silent Clicks**
  - Audit all clickable elements to ensure they provide feedback
  - Add test-based validation for silent clicks (no runtime validation)
  - Ensure every interactive element results in navigation, modal, toast, or tooltip
  - _Requirements: Enhanced Req 13 AC5 (no silent clicks)_
  - _Design: Component Standards → No Silent Clicks Contract_

### Task 3: Enhance Data Integrity and Trust Signals

**Scope:** Improve data display and trust indicators in existing components

- [x] **3.1 Add Trust Signal Integration**
  - Link existing "Guardian Score" displays to methodology explanations using existing modal/tooltip components
  - Add "How it's calculated" links for summary metrics using existing components
  - Add methodology/help content using existing tooltip OR inside existing HarvestDetailModal (accordion/section). Do not create any new modal routes or modal types.
  - _Requirements: Enhanced Req 10 AC1-3 (trust methodology), Enhanced Req 14 AC4-5 (metrics proof)_
  - _Design: Trust Signals → Verification System_

- [ ] **3.2 Improve Data Quality Indicators**
  - Add data quality flags to opportunity cards
  - Show "What assumptions were used?" panels in detail modal
  - Include confidence indicators and data source labels
  - _Requirements: Enhanced Req 3 AC1-3 (data provenance), Enhanced Req 14 AC1-2 (timestamps)_
  - _Design: Data Integrity → Quality Indicators_

- [ ] **3.3 Enhance Gas Price Display**
  - Ensure gas price never shows "0 gwei" (use existing validation)
  - Add color coding using existing status color classes: green <30, yellow 30-100, red >100 gwei
  - Show "Gas unavailable" on fetch failures with retry option
  - _Requirements: Enhanced Req 3 AC4-5 (gas nonzero, fallback)_
  - _Design: Data Integrity → Gas Oracle Rules_

### Task 4: Improve Form Quality and Validation

**Scope:** Enhance existing form interactions and validation

- [x] **4.1 Add Real-Time Validation**
  - Implement immediate validation feedback on form fields
  - Add character counters and helpful error messages
  - Show clear success confirmations for form submissions
  - _Requirements: Enhanced Req 6 AC1-3 (immediate validation, clear messages)_
  - _Design: Form Validation → Real-Time Feedback_

- [x] **4.2 Enhance Settings Integration**
  - Fix any "Invalid Date" placeholders in user settings
  - Add clear explanations for disabled form fields
  - Implement immediate save confirmation and error feedback
  - _Requirements: Enhanced Req 5 AC1-3 (no invalid placeholders, clear explanations)_
  - _Design: Form Quality → Settings Enhancement_

### Task 5: Add Progressive Disclosure and Empty States

**Scope:** Enhance existing information display and empty state handling

- [x] **5.1 Implement Progressive Disclosure**
  - Reorder and condense the existing card content to show key info first (title/subtitle/benefit/confidence/risk) without introducing new card expansion state unless it already exists today. If expansion does not exist, do not add it; instead improve hierarchy and spacing.
  - _Requirements: Enhanced Req 12 AC1-3 (expandable cards, smooth animations)_
  - _Design: Progressive Disclosure → Information Layering_

- [x] **5.2 Enhance Empty States**
  - Improve existing empty state messages with helpful guidance
  - Add relevant call-to-action buttons and next steps
  - Include checklists of items scanned when no results found
  - _Requirements: Enhanced Req 11 AC1-3 (helpful messages, clear actions)_
  - _Design: Empty States → Actionable Guidance_

### Task 6: Add Human Microcopy and Celebrations

**Scope:** Enhance existing copy and add celebration moments

- [x] **6.1 Humanize Error Messages**
  - Replace technical error messages with encouraging, human-friendly copy
  - Add contextual help and recovery suggestions
  - Use empathetic language for error conditions
  - _Requirements: Enhanced Req 16 AC1-3 (humanized errors, encouraging copy)_
  - _Design: Microcopy System → Error Humanization_

- [ ] **6.2 Add Celebration States**
  - Enhance existing success screen with celebration copy and animations using existing toast/confetti components only
  - Add micro-celebrations for key actions ("Harvest prepared ✓") using existing toast/confetti components only
  - Include encouraging copy for demo mode and onboarding
  - _Requirements: Enhanced Req 16 AC4-5 (celebrations)_
  - _Design: Microcopy System → Delight Moments_

### Task 7: Comprehensive Error Handling Enhancement

**Scope:** Improve existing error handling and recovery mechanisms

- [ ] **7.1 Enhance Error Boundaries**
  - Wrap existing components in error boundaries with recovery options
  - Add graceful degradation when external services are unavailable
  - Implement user-friendly error messages with retry functionality
  - _Requirements: Enhanced Req 15 AC1-3 (error boundaries, graceful degradation)_
  - _Design: Error Handling → Recovery Mechanisms_

- [ ] **7.2 Add Performance Monitoring**
  - Ensure existing loading states meet performance thresholds
  - Add performance metrics for opportunity loading and CSV generation
  - Tune existing React Query cache settings only (no new caching layers)
  - _Requirements: Enhanced Req 17 AC1-3 (performance standards)_
  - _Design: Performance → Monitoring and Optimization_

### Task 8: Testing and Quality Assurance

**Scope:** Add comprehensive testing for enhanced functionality

- [ ] **8.1 Property-Based Tests**
  - Add property tests for existing opportunity filtering logic behavior only
  - Test existing data integrity validation across all inputs
  - Validate existing animation consistency and timing
  - _Requirements: Enhanced Req 0/6/11/14/17/18/21/27/28/30 (only those touched by UX changes)_
  - _Design: Testing Strategy → Property-Based Testing_

- [ ] **8.2 Integration Tests**
  - Test demo/live mode switching functionality
  - Validate modal interactions and state management
  - Test error recovery and retry mechanisms
  - _Requirements: Enhanced Req 17 AC4-5 (integration testing standards)_
  - _Design: Testing Strategy → Integration Testing_

- [ ] **8.3 Accessibility Compliance**
  - Ensure all interactive elements meet WCAG AA standards
  - Test keyboard navigation and screen reader compatibility
  - Validate color contrast and touch target sizes
  - _Requirements: Enhanced Req 18 AC4-5 (accessibility standards)_
  - _Design: Accessibility → Compliance Validation_

### Task 9: Regulatory Compliance and Demo Safety (MANDATORY)

**Scope:** Critical regulatory warnings and demo data protection

- [ ] **9.1 Wash Sale Warning System (MANDATORY)**
  - When the UI presents any existing 'rebuy' / 're-entry' action or suggestion, display the wash sale warning copy and default toggles to OFF.
  - If no rebuy/re-entry UI exists, only add a static educational warning in the existing detail modal (no detection engine).
  - Display: "Wash sale rules may apply; consult a tax professional"
  - Flag re-entry in export if occurred within configurable window
  - _Requirements: Enhanced Req 28 AC1-5_
  - _Design: Regulatory Guardrails → Wash Sale Protection_
  - _Effort: 4h_

- [ ] **9.2 Demo Export Watermark (MANDATORY)**
  - Update the existing handleDownloadCSV demo branch to prepend watermark text (first row) and include disclaimer in existing header metadata.
  - Add "DEMO DATA - NOT FOR TAX FILING" watermark to all demo CSV exports
  - Include disclaimer in export header: "Sample data for demonstration only"
  - Prevent accidental use of demo exports for actual tax filing
  - Clear visual distinction between demo and live exports
  - _Requirements: Enhanced Req 30 AC5_
  - _Design: Demo Mode → Export Safety_
  - _Effort: 2h_

## Implementation Guidelines

### Enhancement Approach
1. **Audit First**: Review existing components before making changes
2. **Enhance, Don't Replace**: Improve existing functionality rather than rebuilding
3. **Test Existing**: Ensure current functionality continues to work
4. **Add Incrementally**: Add new UX features without breaking existing flows

### Code Changes
- All changes must reference specific UX Gap Requirements
- Use existing component patterns and styling
- Maintain backward compatibility with current functionality
- Follow existing TypeScript and React patterns

### Testing Requirements
- Test enhanced functionality without breaking existing tests
- Add new tests for UX improvements
- Validate accessibility and performance standards
- Ensure demo mode continues to work properly

## Success Criteria

- ✅ All existing HarvestPro functionality continues to work
- ✅ UX Gap Requirements applied to existing components
- ✅ No new pages, routes, or major features created
- ✅ Enhanced user experience with better feedback and interactions
- ✅ Improved data integrity and trust signals
- ✅ Comprehensive testing coverage for enhancements
- ✅ Accessibility and performance standards met

## Notes

This enhancement plan focuses exclusively on improving the existing HarvestPro implementation rather than creating new functionality. All tasks are scoped to UX gap remediation and quality improvements within the current system architecture.