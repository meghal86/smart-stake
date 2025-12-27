# Requirements Document

## Introduction

This specification addresses critical missing requirements identified through comprehensive UX audit for AlphaWhale's first public v1 launch. The audit revealed gaps that could impact user trust, clarity, and retention - particularly for first-time users expecting Apple-level trust, Robinhood-level reliability, and Stripe-grade quality assurance.

## Screen-by-Screen Requirements Mapping

### How to Use This Map

For each screen, go top-to-bottom and mark each item: **Exists ✅ / Partial 🟡 / Missing ❌ / Broken 🔴**

**Hard rule:** If it exists anywhere, reuse/extend/fix — do not create parallel components.

**Legend:**
- ✅ Exists (works)
- 🟡 Partial (exists but inconsistent or incomplete)  
- ❌ Missing (not present in UX/code)
- 🔴 Broken (present but not working reliably)

### 0) GLOBAL (applies to every screen)

**Identity + Persistence**
- R2-AC1 Identity indicator visible on all screens (Guest / Signed in) ✅/🟡/❌/🔴
- R2-AC2 Guest tooltip ("doesn't save…") ✅/🟡/❌/🔴
- R2-AC3 Indicator updates immediately on auth change ✅/🟡/❌/🔴
- R2-AC4 Saved vs session-only disclosure exists (Settings) ✅/🟡/❌/🔴
- R2-AC5 Findable within 2 taps ✅/🟡/❌/🔴

**Wallet Context (Multi-wallet)**
- R3-AC1 Active wallet chip visible everywhere ✅/🟡/❌/🔴
- R3-AC2 Switching resets state & refreshes data ✅/🟡/❌/🔴
- R3-AC3 Switch shows skeleton then success toast ✅/🟡/❌/🔴
- R3-AC4 No stale cross-wallet data ✅/🟡/❌/🔴
- R3-AC5 Wallet scope shown on all listed screens ✅/🟡/❌/🔴

**Demo Mode**
- R4-AC1 Sticky demo banner on all screens ✅/🟡/❌/🔴
- R4-AC2 Banner text matches spec ✅/🟡/❌/🔴
- R4-AC3 Exit demo works from any screen ✅/🟡/❌/🔴
- R4-AC4 Demo indicators consistent ✅/🟡/❌/🔴
- R4-AC5 Demo purpose/limits explained ✅/🟡/❌/🔴

**Interactive Reliability**
- R5-AC1 Every click produces feedback ✅/🟡/❌/🔴
- R5-AC2 Zero inert interactions ✅/🟡/❌/🔴
- R5-AC3 Disabled state + tooltip if unavailable ✅/🟡/❌/🔴
- R5-AC4 "Touch everything" passes ✅/🟡/❌/🔴
- R5-AC5 All interactive components provide feedback ✅/🟡/❌/🔴

**Performance (P0)**
- R1-AC1 5+ min responsive ✅/🟡/❌/🔴
- R1-AC2 No steady memory growth ✅/🟡/❌/🔴
- R1-AC3 Loading feedback <200ms on transitions ✅/🟡/❌/🔴
- R1-AC4 Polling/interval cleanup ✅/🟡/❌/🔴
- R1-AC5 Backpressure (dedupe inflight, no storms) ✅/🟡/❌/🔴

**Support + Compliance + Accessibility**
- R6-AC1 Support entry in Settings + Footer ✅/🟡/❌/🔴
- R6-AC2 Contact + Report bug works mobile ✅/🟡/❌/🔴
- R6-AC3 Terms + Privacy linked on all screens ✅/🟡/❌/🔴
- R6-AC4 Legal content real (not placeholder) ✅/🟡/❌/🔴
- R6-AC5 Support opens mailto/form ✅/🟡/❌/🔴
- R7-AC1 Focus states everywhere ✅/🟡/❌/🔴
- R7-AC2 Keyboard tab traversal logical ✅/🟡/❌/🔴
- R7-AC3 ARIA labels for icons ✅/🟡/❌/🔴
- R7-AC4 Tap targets ≥44px ✅/🟡/❌/🔴
- R7-AC5 Modal focus trap ✅/🟡/❌/🔴

### 1) HOME (/)

**First-run + Outcomes**
- R8-AC1 Primary CTA stack visible within 10s ✅/🟡/❌/🔴
- R8-AC2 CTA stack includes Run Guardian Scan / Try Demo / Explore ✅/🟡/❌/🔴
- R8-AC3 Next step clear without guessing ✅/🟡/❌/🔴
- R8-AC4 Modules framed as "Next Best Action" ✅/🟡/❌/🔴
- R8-AC5 Outcome tiles above fold ✅/🟡/❌/🔴

**Metrics Transparency**
- R9-AC1 Metric definition + source visible ✅/🟡/❌/🔴
- R9-AC2 "How it's calculated" modal for key metrics ✅/🟡/❌/🔴
- R9-AC3 Last updated timestamp ✅/🟡/❌/🔴
- R9-AC4 No permanent "Verifying…" (replaced) ✅/🟡/❌/🔴
- R9-AC5 100% of headline metrics have methodology path ✅/🟡/❌/🔴

### 2) GUARDIAN (/guardian)

**Risk Education + Intent Preview**
- R10-AC1 Plain language impact on every risk card ✅/🟡/❌/🔴
- R10-AC2 Recommended action per risk ✅/🟡/❌/🔴
- R10-AC3 Wallet target label ("Analyzing: Wallet X") ✅/🟡/❌/🔴
- R10-AC4 Wallet scope header on Scan/Risks/Alerts/History ✅/🟡/❌/🔴
- R10-AC5 Pre-transaction confirmation before remediation ✅/🟡/❌/🔴

### 3) HUNTER (/hunter)

**Quest Transparency + Filters**
- R11-AC1 Join Quest opens preview (steps/eligibility/network/time) ✅/🟡/❌/🔴
- R11-AC2 Confidence metric definition + why high/low ✅/🟡/❌/🔴
- R11-AC3 Active wallet indicator matches Guardian ✅/🟡/❌/🔴
- R11-AC4 Quest detail drawer/modal before participation ✅/🟡/❌/🔴
- R11-AC5 Empty state with reset CTA ✅/🟡/❌/🔴

**Filter Completeness (R18)**
- R18-AC1 Network filter OR hidden until implemented ✅/🟡/❌/🔴
- R18-AC2 Duration filter OR hidden until implemented ✅/🟡/❌/🔴
- R18-AC3 Minimum APY control OR hidden until implemented ✅/🟡/❌/🔴
- R18-AC4 Clear all filters ✅/🟡/❌/🔴
- R18-AC5 Empty state w/ reset CTA ✅/🟡/❌/🔴

### 4) HARVEST (/harvestpro)

**Tax Compliance + Preview**
- R12-AC1 Tax disclaimer visible ✅/🟡/❌/🔴
- R12-AC2 Start harvest opens preview (sell/benefit/cost) ✅/🟡/❌/🔴
- R12-AC3 Wallet scope ("This affects Wallet X") ✅/🟡/❌/🔴
- R12-AC4 Preview ALWAYS shown before execution ✅/🟡/❌/🔴
- R12-AC5 Warnings (slippage, gas, market risk) ✅/🟡/❌/🔴

### 5) PORTFOLIO (/portfolio)

**Scope + Freshness + Search**
- R13-AC1 Label per-wallet vs aggregated ✅/🟡/❌/🔴
- R13-AC2 Toggle scopes (All wallets can be "coming soon") ✅/🟡/❌/🔴
- R13-AC3 Search works OR disabled w/ tooltip ✅/🟡/❌/🔴
- R13-AC4 "Updated Xs ago" timestamp ✅/🟡/❌/🔴
- R13-AC5 Timestamp updates on refresh ✅/🟡/❌/🔴

### 6) SETTINGS (/settings)

**Account + Billing + Feedback**
- R14-AC1 Guest vs Account + recovery explained ✅/🟡/❌/🔴
- R14-AC2 Account section shows current status + recovery ✅/🟡/❌/🔴
- R14-AC3 Save shows loading + success/error toast ✅/🟡/❌/🔴
- R14-AC4 Plan boundaries Free vs Pro ✅/🟡/❌/🔴
- R14-AC5 Upgrade/billing works OR clear "coming soon" ✅/🟡/❌/🔴

**Monetization (global but often surfaced here)**
- R15-AC1 Pro badge w/ explanation ✅/🟡/❌/🔴
- R15-AC2 Paywall explanation for gated clicks ✅/🟡/❌/🔴
- R15-AC3 Limited preview without payment ✅/🟡/❌/🔴
- R15-AC4 Upgrade prompt after preview limits ✅/🟡/❌/🔴
- R15-AC5 No surprise paywalls ✅/🟡/❌/🔴

### 7) AUTH + MULTI-WALLET (Cross-screen behaviors)

**Auth Flows (R16)**
- R16-AC1 Auth entry point within 2 taps ✅/🟡/❌/🔴
- R16-AC2 Auth method exists (email magic link OR wallet sign-in) ✅/🟡/❌/🔴
- R16-AC3 Stable identifier + working sign-out ✅/🟡/❌/🔴
- R16-AC4 Session expiry → re-auth prompt + preserve context ✅/🟡/❌/🔴
- R16-AC5 Recovery explanation in Settings ✅/🟡/❌/🔴

**Multi-wallet Mgmt (R17)**
- R17-AC1 Add multiple wallets or clearly state limitation ✅/🟡/❌/🔴
- R17-AC2 Wallet labeling + display everywhere ✅/🟡/❌/🔴
- R17-AC3 Remove/disconnect confirmation ✅/🟡/❌/🔴
- R17-AC4 Persist wallet list + last active wallet (signed-in) ✅/🟡/❌/🔴
- R17-AC5 Switching updates all modules w/ refresh indicator ✅/🟡/❌/🔴

### 8) Transaction Intent Preview (Cross-screen)

**Intent & Risk Preview (R19)**
- R19-AC1 Intent preview modal before wallet popup ✅/🟡/❌/🔴
- R19-AC2 Shows chain, target, action type, amount ✅/🟡/❌/🔴
- R19-AC3 Risk label + explanation ✅/🟡/❌/🔴
- R19-AC4 Cancel path + explicit "Continue to wallet" ✅/🟡/❌/🔴
- R19-AC5 If no simulation, show fallback + block ambiguous execution ✅/🟡/❌/🔴

### 9) Privacy + Telemetry (R20)

- R20-AC1 Privacy policy states what is collected ✅/🟡/❌/🔴
- R20-AC2 Cookie/telemetry disclosure if used ✅/🟡/❌/🔴
- R20-AC3 No sensitive wallet/private data collected ✅/🟡/❌/🔴
- R20-AC4 Opt-out or explicit statement for v1 ✅/🟡/❌/🔴
- R20-AC5 Demo data clearly labeled ✅/🟡/❌/🔴

### 10) Launch Support Readiness (R21)

- R21-AC1 FAQ/help surface within 2 taps ✅/🟡/❌/🔴
- R21-AC2 Known issues/status hint linked ✅/🟡/❌/🔴
- R21-AC3 Errors actionable + retry ✅/🟡/❌/🔴
- R21-AC4 Bug report includes basic context ✅/🟡/❌/🔴
- R21-AC5 Links work on mobile & desktop ✅/🟡/❌/🔴

### Quick "Launch Gate" Checklist (P0 Must Pass)

- [ ] PERF-01 stable (no freezes)
- [ ] No inert CTAs anywhere
- [ ] Terms + Privacy live and linked
- [ ] Harvest tax disclaimer + pre-action preview
- [ ] Guardian pre-transaction confirmation
- [ ] Identity state visible (Guest/Signed in)
- [ ] Active wallet visible everywhere
- [ ] Demo mode consistent banner

## Glossary

- **System**: AlphaWhale web application and mobile interface
- **User**: Any person interacting with AlphaWhale (guest or authenticated)
- **Guest_Mode**: Unauthenticated state with demo data and no persistence
- **Active_Wallet**: Currently selected wallet for wallet-scoped operations
- **Demo_Mode**: System state showing sample data instead of live blockchain data
- **Trust_Signal**: UI element that builds user confidence (badges, disclaimers, methodology)
- **CTA**: Call-to-action button or interactive element
- **Route_Transition**: Navigation between different pages/screens

## Requirements

### Requirement 1: Performance Reliability

**User Story:** As a user, I want the application to remain responsive indefinitely, so that I can use AlphaWhale without experiencing freezes or crashes.

#### Acceptance Criteria

1. WHEN a user interacts with the application continuously for 5+ minutes, THE System SHALL maintain responsiveness without freezing
2. WHEN memory usage is monitored during extended sessions, THE System SHALL maintain stable memory consumption without continuous growth
3. WHEN route transitions occur, THE System SHALL show loading feedback within 200ms to prevent white flash or dead air
4. IF polling intervals or timeouts are active, THEN THE System SHALL properly clean up all listeners and intervals on component unmount
5. WHEN background processes run, THE System SHALL implement backpressure to prevent runaway requests

### Requirement 2: Global Identity State

**User Story:** As a user, I want to always know my authentication status and what data is saved, so that I understand what will persist across sessions.

#### Acceptance Criteria

1. THE System SHALL display persistent identity indicator showing "Guest" or "Signed in" status on all screens
2. WHEN in guest mode, THE System SHALL show tooltip explaining "Guest mode doesn't save wallets/alerts/settings"
3. WHEN user authentication status changes, THE System SHALL update the identity indicator immediately
4. THE System SHALL provide clear disclosure of what data is saved vs session-only in settings
5. WHEN user accesses data storage information, THE System SHALL be findable within 2 taps maximum

### Requirement 3: Active Wallet Consistency

**User Story:** As a user, I want to always see which wallet is active across all screens, so that I never have ambiguity about wallet-scoped data.

#### Acceptance Criteria

1. THE System SHALL display active wallet indicator (ENS/nickname + short address) on all screens
2. WHEN user switches wallets, THE System SHALL reset relevant state and refresh wallet-scoped data
3. WHEN wallet switching occurs, THE System SHALL show skeleton loading states followed by success toast
4. THE System SHALL ensure no stale cross-wallet data remains after wallet switching
5. THE System SHALL display wallet scope indicator on Home, Guardian, Hunter, Harvest, Portfolio, and Settings screens

### Requirement 4: Demo Mode Clarity

**User Story:** As a user, I want demo mode to be obvious and consistently explained, so that I understand when I'm viewing sample vs live data.

#### Acceptance Criteria

1. WHEN in demo mode, THE System SHALL display sticky demo banner across all screens
2. THE System SHALL show demo banner with text "🎭 Demo Mode — Sample data | Connect wallet for live"
3. WHEN user wants to exit demo mode, THE System SHALL provide working exit functionality from any screen
4. THE System SHALL make demo mode obvious through consistent visual indicators
5. THE System SHALL explain demo mode purpose and limitations clearly

### Requirement 5: Interactive Element Reliability

**User Story:** As a user, I want every clickable element to provide feedback, so that I never encounter unresponsive interface elements.

#### Acceptance Criteria

1. WHEN user clicks any interactive element, THE System SHALL produce immediate feedback (action/modal/toast/disabled tooltip)
2. THE System SHALL ensure zero inert interactions exist across the entire application
3. WHEN an element cannot perform its action, THE System SHALL show disabled state with explanatory tooltip
4. WHEN user performs "touch everything" testing, THE System SHALL respond to 100% of interactive elements
5. THE System SHALL provide appropriate feedback for all buttons, links, cards, and interactive components

### Requirement 6: Support and Compliance Infrastructure

**User Story:** As a user, I want access to support and legal information, so that I can get help and understand terms of service.

#### Acceptance Criteria

1. THE System SHALL provide visible support entry point in settings and footer
2. THE System SHALL include "Contact" and "Report bug" functionality that works from mobile
3. THE System SHALL display Terms of Service and Privacy Policy links on all screens
4. WHEN user accesses legal documents, THE System SHALL show actual content not placeholder text
5. THE System SHALL ensure support contact opens appropriate communication channel (mailto/form)

### Requirement 7: Accessibility Baseline

**User Story:** As a user with accessibility needs, I want proper keyboard navigation and screen reader support, so that I can use AlphaWhale effectively.

#### Acceptance Criteria

1. THE System SHALL provide focus states for all interactive elements
2. WHEN user navigates with keyboard, THE System SHALL support tab traversal through logical order
3. THE System SHALL include ARIA labels for all icons and complex interactive elements
4. THE System SHALL ensure tap targets are minimum 44px height on mobile devices
5. WHEN modals are open, THE System SHALL trap focus within the modal container

### Requirement 8: Home Screen First-Run Experience

**User Story:** As a first-time user, I want to understand what AlphaWhale does and what to do next within 10 seconds, so that I can quickly determine if the product meets my needs.

#### Acceptance Criteria

1. WHEN a new user visits the home screen, THE System SHALL present clear primary CTA stack within 10 seconds
2. THE System SHALL offer "Run Guardian Scan", "Try Demo", and "Explore Opportunities" as primary actions
3. WHEN user sees the home screen, THE System SHALL enable them to explain the next step without guessing
4. THE System SHALL frame modules as outcomes with "Next Best Action" guidance
5. THE System SHALL display outcome tiles for "Reduce Risk", "Earn Safely", and "Save Taxes" above the fold

### Requirement 9: Metrics Transparency

**User Story:** As a user, I want to understand how metrics are calculated and when they were last updated, so that I can trust the data presented.

#### Acceptance Criteria

1. WHEN headline metrics are displayed, THE System SHALL provide definition and source for each metric
2. THE System SHALL show "How it's calculated" modal for all key metrics
3. WHEN metrics are shown, THE System SHALL display last updated timestamp
4. THE System SHALL replace permanent "Verifying documentation..." text with actual methodology or "coming soon" state
5. THE System SHALL ensure 100% of headline metrics have methodology explanation path

### Requirement 10: Guardian Risk Education

**User Story:** As a user viewing security risks, I want to understand why each risk matters and what I should do about it, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN risk cards are displayed, THE System SHALL explain impact in plain language for each risk
2. THE System SHALL provide recommended action for every identified risk
3. WHEN user views Guardian screens, THE System SHALL show explicit wallet target label ("Analyzing: Wallet X")
4. THE System SHALL display wallet scope header on Scan, Risks, Alerts, and History screens
5. WHEN user initiates risk remediation, THE System SHALL show pre-transaction confirmation with details

### Requirement 11: Hunter Quest Transparency

**User Story:** As a user interested in opportunities, I want to understand what happens when I join a quest and whether I'm eligible, so that I can make informed participation decisions.

#### Acceptance Criteria

1. WHEN user clicks "Join Quest", THE System SHALL open preview showing steps, eligibility rules, network, and estimated time
2. THE System SHALL display confidence metric definition and explanation for high/low confidence
3. WHEN user views Hunter screen, THE System SHALL show active wallet indicator matching Guardian pattern
4. THE System SHALL provide quest detail drawer/modal before allowing quest participation
5. WHEN no opportunities match filters, THE System SHALL show empty state with reset CTA

### Requirement 12: Harvest Tax Compliance

**User Story:** As a user considering tax loss harvesting, I want clear disclaimers and transaction previews, so that I understand the tax and financial implications.

#### Acceptance Criteria

1. WHEN user accesses harvest functionality, THE System SHALL display "Information only, consult a tax professional" disclaimer
2. WHEN user initiates harvest action, THE System SHALL show preview with what sells, estimated tax benefit, and estimated costs
3. THE System SHALL display wallet scope explicitly ("This affects Wallet X") on opportunity cards
4. WHEN user clicks "Start Harvest", THE System SHALL always open preview first before execution
5. THE System SHALL include warnings about slippage, gas costs, and market risks in preview

### Requirement 13: Portfolio Data Clarity

**User Story:** As a user viewing portfolio data, I want to know the scope of data (single wallet vs all wallets) and freshness, so that I can interpret the information correctly.

#### Acceptance Criteria

1. WHEN portfolio is displayed, THE System SHALL clearly label whether data is per-wallet or aggregated
2. THE System SHALL provide toggle between wallet scopes (even if "All wallets coming soon")
3. WHEN search functionality is present, THE System SHALL either filter results or be disabled with "coming soon" tooltip
4. THE System SHALL show "Updated Xs ago" timestamp with refresh behavior
5. THE System SHALL update timestamp when data refresh occurs

### Requirement 14: Settings Identity Management

**User Story:** As a user managing my account, I want to understand the difference between Guest and Account status and how to recover my data, so that I can manage my identity appropriately.

#### Acceptance Criteria

1. WHEN user accesses settings, THE System SHALL explain Guest vs Account status with recovery path
2. THE System SHALL show visible "Account" section with current status and recovery instructions
3. WHEN user saves settings, THE System SHALL show loading state followed by success/error toast
4. THE System SHALL display plan boundaries between Free vs Pro features
5. WHEN user accesses billing, THE System SHALL provide working upgrade/billing path or clear "coming soon" state

### Requirement 15: Monetization Transparency

**User Story:** As a user encountering premium features, I want clear indication of what's included in Pro and preview capabilities, so that I can evaluate the upgrade without surprises.

#### Acceptance Criteria

1. WHEN gated features are encountered, THE System SHALL show Pro badge with feature explanation
2. THE System SHALL ensure every gated click results in clear paywall explanation
3. WHEN premium features are previewed, THE System SHALL provide limited preview without payment requirement
4. THE System SHALL show upgrade prompt after preview limits are reached
5. THE System SHALL avoid surprise paywalls by clearly marking premium features upfront

### Requirement 16: Authentication Flows & Session Management

**User Story:** As a user, I want a clear way to sign in, recover access, and understand session behavior, so I can trust that my data will persist safely across devices.

#### Acceptance Criteria

1. THE System SHALL provide visible entry point for authentication accessible from all screens within 2 taps
2. THE System SHALL support at least one v1 authentication method (Email magic link OR wallet signature sign-in)
3. WHEN user is signed in, THE System SHALL display stable identifier and provide working sign-out action
4. WHEN session expires or authentication becomes invalid, THE System SHALL show clear re-authentication prompt and preserve navigation context
5. THE System SHALL provide account recovery explanation visible in Settings

### Requirement 17: Multi-Wallet Management & Persistence

**User Story:** As a user with multiple wallets, I want to add, label, remove, and switch wallets reliably, so I always know which wallet my data/actions apply to.

#### Acceptance Criteria

1. THE System SHALL allow users to add multiple wallets to their profile OR clearly state multi-wallet limitations in v1
2. THE System SHALL support wallet labeling (ENS and/or user-provided nickname) and display labels wherever wallet is referenced
3. WHEN user removes/disconnects wallet, THE System SHALL confirm action and prevent accidental removal
4. THE System SHALL persist wallet list and last active wallet across sessions for signed-in users OR clearly label as session-only for guests
5. WHEN user switches wallets, THE System SHALL update all wallet-scoped modules and show refresh indicator

### Requirement 18: Hunter Filtering Completeness

**User Story:** As a user browsing opportunities, I want core filters to control what I see, so I can quickly find opportunities that match my constraints.

#### Acceptance Criteria

1. THE System SHALL provide "Network" filter OR hide network filtering until implemented
2. THE System SHALL provide "Duration" filter OR hide duration filtering until implemented
3. THE System SHALL provide "Minimum APY" control OR hide APY filtering until implemented
4. THE System SHALL provide "Clear all filters" action that resets all filters in one click
5. WHEN filters result in zero matches, THE System SHALL show helpful empty state with reset CTA

### Requirement 19: Pre-Transaction Intent & Risk Preview

**User Story:** As a user, I want to understand exactly what I'm about to approve or execute before my wallet pops up, so I feel safe and in control.

#### Acceptance Criteria

1. BEFORE any wallet signature/approval/transaction request, THE System SHALL show intent preview modal
2. THE intent preview SHALL display chain/network, target contract/address, action type, and any value/amount involved
3. THE intent preview SHALL display risk label and short explanation
4. THE intent preview SHALL include clear cancel path and require explicit user confirmation
5. WHEN transaction cannot be simulated or estimated, THE System SHALL show clear fallback message and prevent ambiguous execution

### Requirement 20: Telemetry, Analytics, and Privacy Disclosure

**User Story:** As a user, I want to understand what data is collected and have transparency controls, so I can trust AlphaWhale with my activity.

#### Acceptance Criteria

1. IF System collects analytics/telemetry, THEN Privacy Policy SHALL explicitly describe what is collected and why
2. IF cookies or similar tracking are used, THEN System SHALL provide minimal disclosure and link to privacy details
3. THE System SHALL avoid collecting sensitive wallet/private data beyond product operation requirements and document this in Privacy Policy
4. THE System SHALL provide simple mechanism to disable non-essential analytics OR state that v1 does not provide opt-out
5. THE System SHALL label demo data clearly to avoid confusing demo activity with real user activity

### Requirement 21: Launch Support Readiness

**User Story:** As a first-time user, I want quick answers and a way to understand issues during launch, so I don't abandon the product when confused.

#### Acceptance Criteria

1. THE System SHALL provide basic FAQ/help surface accessible from Settings within 2 taps
2. THE System SHALL include "Known issues" or "Status" hint during launch, linked from Settings/Support
3. WHEN error occurs, THE System SHALL provide user-actionable message and retry path where applicable
4. THE System SHALL provide "Report a bug" path that includes basic context when possible
5. THE System SHALL ensure all support/legal links work on mobile and desktop

### Requirement 22: P0 Performance Freeze Resolution

**User Story:** As a user, I want the app to remain responsive after repeated interactions, so I can navigate and use AlphaWhale without the UI freezing.

#### Acceptance Criteria

1. WHEN user clicks 50+ interactive elements across multiple screens within single session, THE System SHALL remain responsive without interaction timeouts or freezing
2. WHEN developer tools performance profiling is enabled, THE System SHALL NOT show infinite render loops or runaway commit rates
3. WHEN memory profiling is enabled, THE System SHALL NOT show continuous heap growth without recovery
4. IF System uses polling/intervals for timestamps/refresh/demo updates, THEN System SHALL clean up intervals/listeners on unmount and prevent duplicate interval creation
5. WHEN network requests are triggered repeatedly, THE System SHALL deduplicate inflight requests and apply backpressure to prevent request storms

### Requirement 23: Standardized System States

**User Story:** As a user, I want consistent and helpful system states, so the app never feels broken and I always know what to do next.

#### Acceptance Criteria

1. WHEN data is loading on any screen or list, THE System SHALL display loading state within 200ms
2. WHEN data is empty, THE System SHALL display explicit empty state with clear next action
3. WHEN error occurs, THE System SHALL display actionable error message and provide retry path where applicable
4. WHEN action is unavailable, THE System SHALL show disabled state with explanatory tooltip or inline message
5. THE System SHALL ensure no silent failures occur - every click/submit produces visible feedback

### Requirement 24: Global Footer & Build Visibility

**User Story:** As a user (and as support), I want access to legal/support links and basic build information, so I can trust the app and report issues efficiently.

#### Acceptance Criteria

1. THE System SHALL provide consistent global footer accessible from all screens including Terms of Service, Privacy Policy, Contact Support, and Report a Bug
2. WHEN user opens "Report a Bug", THE System SHALL include basic context with route/screen name and app version/build number if available
3. THE System SHALL display app version/build number somewhere accessible in Settings
4. WHEN footer/links are tapped on mobile, THE System SHALL open successfully without layout breakage
5. THE System SHALL ensure footer links contain real content not placeholders
