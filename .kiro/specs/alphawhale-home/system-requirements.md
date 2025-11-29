# System-Wide Requirements Document

## Introduction

This document defines system-wide requirements that apply across the entire AlphaWhale platform, not just the Home screen. These requirements cover authentication, demo mode, error handling, data fetching patterns, loading states, session management, and performance standards that must be implemented consistently across all pages.

## Glossary

- **Demo Mode**: A state where unauthenticated users can explore the platform with sample data
- **Live Mode**: A state where authenticated users see their real wallet data
- **JWT (JSON Web Token)**: A secure token used for authentication
- **WalletConnect**: A protocol for connecting cryptocurrency wallets to dApps
- **Skeleton Loader**: An animated placeholder shown while content is loading
- **SWR (Stale-While-Revalidate)**: A caching strategy that shows cached data while fetching fresh data
- **Core Web Vitals**: Google's metrics for measuring user experience (LCP, FID, CLS)
- **httpOnly Cookie**: A secure cookie that cannot be accessed via JavaScript

## Requirements

### Requirement 12: Demo Mode System

**User Story:** As an unauthenticated visitor, I want to explore AlphaWhale without connecting my wallet, so that I can understand the value before committing.

**Scope:** Home, /guardian, /hunter, /harvestpro, /settings

#### Acceptance Criteria

1. WHEN an unauthenticated user visits any page THEN the system SHALL display demo metrics (Guardian Score: 89, Opportunities: 42, Harvest Estimate: $12,400)
2. WHEN demo metrics are displayed THEN the system SHALL show a subtle "Demo Mode" badge or label next to metric values
3. WHEN feature cards are displayed in demo mode THEN all interactive buttons SHALL be functional and navigate to feature pages with demo data
4. WHEN a demo user navigates to /guardian or /hunter THEN that page SHALL also load in demo mode with sample data
5. WHEN a demo user returns to Home THEN demo state SHALL persist for the session (sessionStorage, not localStorage)
6. WHEN demo user opens browser DevTools THEN demo metrics code SHALL be visible (not API secrets – those stay on backend)
7. WHEN page loads THEN demo metrics SHALL display immediately (no API latency) within 200ms

### Requirement 13: Authentication & Wallet Connection Flow

**User Story:** As a user, I want to easily connect my wallet and transition to seeing my real data, so that I can start using AlphaWhale's features.

**Scope:** All authenticated pages

#### Acceptance Criteria

1. WHEN user is in demo mode THEN a "Connect Wallet" button SHALL be visible in the hero section (primary button position)
2. WHEN user clicks "Connect Wallet" THEN a WalletConnect v2 modal SHALL open displaying available wallets (MetaMask, WalletConnect, Coinbase Wallet, etc.)
3. WHEN user selects a wallet THEN the system SHALL establish Web3 connection within 3 seconds or show timeout error: "Connection took too long. Please try again."
4. WHEN wallet connects successfully THEN the system SHALL request signature for authentication (EIP-191 message signing), send signed message to /api/auth/verify endpoint, receive JWT token valid for 7 days, and store JWT in secure httpOnly cookie
5. WHEN JWT is stored THEN the system SHALL automatically fetch live metrics and transition from demo to live mode without page reload
6. WHEN transition happens THEN "Demo Mode" badges SHALL disappear and real metrics SHALL fade in over 200ms
7. WHEN wallet connection fails THEN error message SHALL display: "Failed to connect: [error reason]. Please try again." and app SHALL remain in demo mode
8. WHEN user is already authenticated THEN "Connect Wallet" button SHALL be replaced with "Disconnect" button (or account selector)
9. WHEN user clicks "Disconnect" THEN JWT cookie SHALL be cleared and page SHALL revert to demo mode
10. WHEN JWT expires (7 days) THEN user SHALL be automatically logged out and returned to demo mode on next page load

### Requirement 14: Error Handling & API Resilience

**User Story:** As a user, I want reliable data even when API has issues, so that the app remains usable and I see clear status indicators.

**Scope:** All pages that fetch data (Home, /guardian, /hunter, /harvestpro)

#### Acceptance Criteria

1. WHEN authenticated user loads any page THEN the system SHALL call appropriate API endpoint with JWT in Authorization header
2. WHEN API returns 200 OK THEN metrics SHALL display immediately (no skeleton loading if cached data exists)
3. WHEN API takes more than 2 seconds to respond THEN skeleton loaders SHALL appear for metric values while fetching continues
4. WHEN API returns 401 Unauthorized THEN JWT SHALL be cleared, user reverted to demo mode, and message shown: "Session expired. Please reconnect wallet."
5. WHEN API returns 5xx error THEN system SHALL show previous cached data (if available), display subtle info toast: "Using cached data. Refreshing...", retry automatically every 10 seconds for up to 2 minutes, and after 2 minutes show error banner: "Metrics unavailable. Please refresh page."
6. WHEN API response takes more than 5 seconds THEN show loading indicator "Fetching your live data..."
7. WHEN API data is more than 5 minutes old THEN show timestamp label: "Last updated 5 minutes ago" with subtle refresh icon
8. WHEN user manually clicks refresh icon THEN immediate retry (not polling wait)
9. WHEN API returns partial data (some metrics missing) THEN show available metrics and display "—" for missing values
10. WHEN authenticated and offline THEN show all available cached data with label "Offline – showing last known values"

### Requirement 15: Loading States & Skeleton Screens

**User Story:** As a user, I want clear visual feedback during data loading, so that I understand the page is responsive and data is coming.

**Scope:** All pages that fetch data (Home, /guardian, /hunter, /harvestpro)

#### Acceptance Criteria

1. WHEN authenticated user first loads any page THEN hero section, cards, footer render immediately (full layout visible), metric values show animated skeleton loaders (pulsing gray bars), and skeleton height matches final metric text height
2. WHEN metrics load successfully THEN skeleton loaders fade out (200ms) and real values fade in (200ms)
3. WHEN metrics fail to load within 3 seconds THEN skeleton loaders replaced with fallback values automatically (no skeleton forever)
4. WHEN feature cards are loading THEN icon, title, tagline display immediately (static content), live metric value shows skeleton, and buttons remain interactive (hover/focus states work)
5. WHEN stat sections load THEN stat cards also show skeleton loaders for numbers (labels display immediately)
6. WHEN page is manually refreshed THEN skeleton loaders appear again (consistent UX)
7. WHEN user navigates away during loading THEN pending API call is cancelled (no memory leak, no orphaned requests)

### Requirement 16: Auth State Persistence & Multi-Tab Sync

**User Story:** As a user, I want my session to persist across browser refreshes and multiple tabs, so that I don't have to reconnect repeatedly.

**Scope:** All pages + auth system globally

#### Acceptance Criteria

1. WHEN user connects wallet THEN JWT SHALL be stored in secure httpOnly cookie (secure, SameSite=Strict, Max-Age=604800 for 7 days)
2. WHEN user closes any page tab and returns later THEN JWT SHALL still be valid and user SHALL remain authenticated (not reverted to demo)
3. WHEN JWT is stored THEN user CANNOT access JWT via JavaScript (httpOnly cookie)
4. WHEN user opens multiple AlphaWhale tabs THEN all tabs SHALL share same auth state (user connects wallet in Tab 1 → Tab 2 also shows authenticated state)
5. WHEN user opens new tab, sees demo, connects wallet, and returns to first tab THEN first tab SHALL automatically refresh and show authenticated state
6. WHEN JWT expires (7 days) THEN on next API request, 401 response triggers automatic logout (JWT cleared, revert to demo mode)
7. WHEN user explicitly disconnects wallet THEN JWT cookie SHALL be cleared immediately and all tabs SHALL show demo mode on next action
8. WHEN user has cookie consent disabled THEN all pages SHALL still work in demo mode (auth cookies only set after user consents)

### Requirement 17: Error Messages & User Communication

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and can take action.

**Scope:** All pages + all features

#### Acceptance Criteria

1. WHEN API returns error THEN user SHALL see human-readable message (not raw JSON or error codes)
2. WHEN wallet connection fails THEN error toast SHALL show: "Failed to connect wallet: [reason]. Tap to try again."
3. WHEN signature request rejected by user THEN message: "You declined the signature request. No connection made."
4. WHEN unsupported chain detected THEN message: "This wallet is on [Chain Name]. Please switch to Ethereum mainnet."
5. WHEN connection timeout THEN message: "Connection took too long (>30s). Please check your internet and try again."
6. WHEN API 5xx error THEN message: "Our servers are having issues. We're working on it. Please try again in a moment."
7. WHEN user has low balance THEN optional message: "Your wallet needs more ETH for gas fees. Consider adding funds."
8. WHEN feature is not yet implemented THEN button SHALL be disabled with tooltip: "Coming soon in Phase 2"
9. WHEN user has no eligible assets for HarvestPro THEN card shows: "No eligible tokens for tax harvesting. Check back after your next transaction."
10. WHEN error messages display THEN all error messages SHALL auto-dismiss after 6 seconds (or when user clicks X)

### Requirement 18: Data Freshness & Refresh Behavior

**User Story:** As a user, I want to know if my data is current, so that I make decisions based on accurate information.

**Scope:** Home, /guardian, /hunter, /harvestpro (all metrics/data-driven pages)

#### Acceptance Criteria

1. WHEN metrics load THEN lastUpdated timestamp SHALL be compared to current time
2. WHEN data is less than 1 minute old THEN no timestamp displayed (assumed current)
3. WHEN data is 1-5 minutes old THEN show subtle label: "Updated 3 min ago"
4. WHEN data is 5-10 minutes old THEN show label in orange: "Updated 8 min ago – may be outdated"
5. WHEN data is more than 10 minutes old THEN show label in red: "Data stale – tap to refresh"
6. WHEN user clicks refresh button/label THEN immediate API call (don't wait for polling)
7. WHEN authenticated and session active THEN background polling every 30 seconds (SWR refresh)
8. WHEN API returns same data as cached THEN do NOT re-render (no flicker)
9. WHEN API returns new data THEN smoothly transition (fade, no jump)
10. WHEN user is inactive for more than 5 minutes THEN pause polling to save bandwidth and resume on next user action

### Requirement 19: Performance & Core Web Vitals

**User Story:** As a user, I want all pages to load fast and respond quickly, so that I have a smooth experience.

**Scope:** Every page in the app

#### Acceptance Criteria

1. WHEN any page loads on 4G connection THEN First Paint (FP) less than 1.0 second, Largest Contentful Paint (LCP) less than 2.5 seconds, Time to Interactive (TTI) less than 3.0 seconds, and Cumulative Layout Shift (CLS) less than 0.1 score
2. WHEN any page loads on mobile (real device) THEN same targets as above (not just emulation)
3. WHEN any page loads on fast 5G/desktop THEN LCP less than 1.5s and TTI less than 2.0s
4. WHEN user clicks button THEN First Input Delay (FID) less than 100ms
5. WHEN animated backgrounds render THEN maintain 60fps (no jank)
6. WHEN interactive elements animate on hover THEN animation smooth (no stutter)
7. WHEN page is audited THEN Lighthouse scores: Performance at least 90, Accessibility at least 90, Best Practices at least 90, and SEO at least 90
8. WHEN page loads THEN no render-blocking resources in critical path
9. WHEN images load THEN use Next/Image optimization (automatic WebP, responsive sizes)
10. WHEN page has animations THEN animations SHALL NOT block page interactivity (run on separate thread)
11. WHEN offline THEN page still functional with cached data (no 404 or blank page)
