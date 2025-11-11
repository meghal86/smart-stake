# Requirements Document: AlphaWhale Hunter Screen (Feed)

## Introduction

The Hunter Screen is the primary discovery surface for the Verified DeFi Opportunity Marketplace. It provides a fast, personalized, Guardian-verified feed of opportunities (Airdrops, Quests, Yield, Points) with rich filters, eligibility previews, and one-click actions via the Action Engine.

**Version:** 1.0  
**Author:** AlphaWhale Product Team  
**Date:** November 2025

## Glossary

- **FCP (First Contentful Paint)**: Time until first content renders on screen
- **P95**: 95th percentile - metric value where 95% of samples are below this threshold
- **Fold**: Visible viewport area without scrolling
- **Likely Eligible**: Eligibility score ≥ 0.7 based on wallet heuristics
- **Guardian**: Security scanning system that evaluates opportunity trust scores
- **Cursor**: Pagination token for infinite scroll
- **APY**: Annual Percentage Yield (annualized return)
- **APR**: Annual Percentage Rate (non-compounded return)

## Global Policies

- **Timezone**: All time arithmetic computed in UTC; UI displays localized to user locale
- **Normalization**: APR/APY normalized to APY with 1 decimal precision
- **Privacy**: Wallet addresses never logged in analytics; use salted hashes
- **Legal**: All yield/reward displays include "Not financial advice" disclaimer

## Requirements

### Requirement 1: Performance & Speed

**User Story:** As a DeFi user, I want the Hunter Screen to load instantly so that I can quickly discover opportunities without waiting.

#### Acceptance Criteria

1. WHEN the Hunter Screen loads THEN the first contentful paint SHALL occur within 1.0 seconds on warm cache
2. WHEN the Hunter Screen loads on cold cache THEN the first contentful paint SHALL occur within 1.6 seconds
3. WHEN a user interacts with any UI element THEN the response time SHALL be less than 150 milliseconds
4. WHEN the first 12 opportunity cards are requested THEN they SHALL be delivered in a single batched API response
5. WHEN the API is called THEN the P95 response time SHALL be less than 200 milliseconds
6. WHEN images are loaded THEN they SHALL use lazy loading with width/height hints
7. WHEN GET /api/hunter/opportunities is called THEN the response SHALL conform to: `{ "items": [OpportunityCard], "cursor": "string|null", "ts": "RFC3339 UTC" }`
8. WHEN cursor is null THEN no further pages SHALL be fetched
9. WHEN If-None-Match or If-Modified-Since is provided AND no changes exist THEN the API SHALL return 304
10. WHEN GET /api/hunter/opportunities responds THEN it SHALL include ETag and Cache-Control headers (e.g., max-age=60, stale-while-revalidate=300)
11. WHEN an API change ships THEN responses SHALL include X-API-Version (semver) for gradual client rollouts

### Requirement 2: Trust & Security Display

**User Story:** As a DeFi user, I want to see trust indicators on every opportunity so that I can make informed decisions about which opportunities are safe.

#### Acceptance Criteria

1. WHEN an opportunity card is displayed THEN it SHALL show a Guardian trust chip with score
2. WHEN the trust score is ≥80 THEN the chip SHALL be displayed as Green
3. WHEN the trust score is 60-79 THEN the chip SHALL be displayed as Amber
4. WHEN the trust score is <60 THEN the opportunity SHALL be hidden by default
5. WHEN a user hovers over the trust chip THEN a tooltip SHALL display the top 3 security issues
6. WHEN the trust chip is clicked THEN an Issues Drawer SHALL open with the full Guardian report link
7. WHEN an opportunity is displayed THEN it SHALL show the last scanned timestamp
8. WHEN a user enables "Show Risky" filter THEN Red trust items SHALL become visible
9. WHEN last_scanned_ts > 24 hours THEN the card SHALL display a "Stale Scan" indicator and be queued for rescan
10. WHEN multiple sources provide a trust score THEN the most recent Guardian result SHALL take precedence
11. WHEN any Guardian score changes category (Green↔Amber↔Red) THEN affected cards SHALL be re-ranked within 5 minutes

### Requirement 3: Personalized Feed Ranking

**User Story:** As a DeFi user, I want to see opportunities ranked by relevance to my wallet and interests so that I don't waste time on irrelevant opportunities.

#### Acceptance Criteria

1. WHEN a wallet is connected THEN opportunities SHALL be ranked using 60% relevance, 25% trust, 15% freshness/urgency
2. WHEN calculating relevance THEN the system SHALL consider wallet chain history, recent completions, saves, and preferred chains
3. WHEN no wallet is connected (cold start) THEN the feed SHALL show globally trending + high trust + easy opportunities
4. WHEN a user has completed or saved opportunities THEN similar opportunities SHALL rank higher
5. WHEN a user has a trust tolerance preference THEN opportunities SHALL be filtered accordingly
6. WHEN a user has a time budget preference THEN easy opportunities SHALL rank first
7. WHEN two items have equal rank score THEN secondary sort SHALL be trust_score desc → time_left asc → id asc for stable ordering

### Requirement 4: Comprehensive Filtering

**User Story:** As a DeFi user, I want to filter opportunities by multiple criteria so that I can find exactly what I'm looking for.

#### Acceptance Criteria

1. WHEN the filter drawer is opened THEN it SHALL display filters for: Type, Chains, Trust Level, Reward, Urgency, Eligibility, Difficulty, and Sort
2. WHEN searching THEN the search SHALL be debounced by 300ms and cached
3. WHEN filtering by Type THEN options SHALL include: airdrop, quest, staking, yield, points, loyalty, testnet
4. WHEN filtering by Chains THEN multi-select SHALL be available for all supported chains
5. WHEN filtering by Trust Level THEN options SHALL be: Green (≥80), Amber (60-79), Red (<60, hidden by default)
6. WHEN filtering by Reward THEN a range slider SHALL allow min/max selection including POINTS/XP
7. WHEN filtering by Urgency THEN options SHALL include: Ending Soon (<48h), New (<24h), Hot
8. WHEN "Likely Eligible" toggle is enabled THEN only opportunities matching wallet heuristics SHALL display
9. WHEN filtering by Difficulty THEN options SHALL be: Easy, Medium, Advanced
10. WHEN sorting THEN options SHALL include: Recommended (default), Ends Soon, Highest Reward, Newest, Trust
11. WHEN filters are applied THEN they SHALL persist in URL query parameters
12. WHEN filters are applied THEN they SHALL be cached locally per tab
13. WHEN filter API is called THEN rate limit SHALL be 60 requests/hour/IP for anonymous users
14. WHEN filter API is called by authenticated users THEN rate limit SHALL be 120 requests/hour
15. WHEN rate limit is exceeded THEN burst allowance SHALL be 10 requests/10 seconds
16. WHEN Sponsored filter is off THEN sponsored items SHALL still respect the ≤2-per-fold cap and remain clearly labeled
17. WHEN Red trust level is included via filter THEN a safety confirmation modal SHALL require explicit user consent once per session
18. WHEN a user consents to view Red items THEN consent SHALL persist for the session via sessionStorage and reset on new session
19. WHEN Sponsored items are capped to ≤2 per fold THEN the cap SHALL be enforced per page fetch to prevent clustering at page boundaries

### Requirement 5: Opportunity Card Display

**User Story:** As a DeFi user, I want each opportunity card to show all relevant information at a glance so that I can quickly evaluate opportunities.

#### Acceptance Criteria

1. WHEN an opportunity card is displayed THEN it SHALL show: Title, Protocol logo/name, Chain chips
2. WHEN an opportunity card is displayed THEN it SHALL show the Guardian trust chip with score and tooltip
3. WHEN an opportunity card is displayed THEN it SHALL show reward information (Min-Max + currency or APR)
4. WHEN reward is displayed THEN confidence level SHALL be shown (Estimated/Confirmed)
5. WHEN an opportunity card is displayed THEN it SHALL show: Time left countdown, Difficulty, Category, Last scanned timestamp
6. WHEN a wallet is connected THEN eligibility preview SHALL show: Likely Eligible / Not Eligible with reason
7. WHEN an opportunity card is displayed THEN it SHALL show appropriate CTA: Claim, Start Quest, Stake, or View
8. WHEN an opportunity card is displayed THEN action buttons SHALL include: Save ⭐, Share, Report ⚑
9. WHEN applicable THEN badges SHALL display: Featured, Sponsored, Season Bonus, Retroactive
10. WHEN an opportunity is sponsored THEN it SHALL be clearly labeled and limited to ≤2 per fold
11. WHEN APR/APY is shown THEN it SHALL be normalized to APY and displayed with one decimal (e.g., 4.2%)
12. WHEN time left is displayed THEN it SHALL be computed in UTC and localized for display
13. WHEN reward unit is displayed THEN it SHALL use RewardUnit enum (TOKEN, USD, APR, APY, POINTS, NFT)
14. WHEN yield cards are displayed THEN they SHALL include disclaimer: "Not financial advice. Rewards are variable and may change." with link to disclosures
15. WHEN sponsored items are displayed THEN they SHALL not exceed 40% of any viewport fold and SHALL always include an 'Sponsored' aria-label
16. WHEN protocol logo fails to load THEN a deterministic initials avatar (e.g., "AC") SHALL render with AA contrast
17. WHEN amounts are displayed in fiat THEN Intl.NumberFormat with user locale and currency SHALL be used; compact notation applied for ≥10,000
18. WHEN sponsored cards are displayed THEN they SHALL include a visible "Sponsored" badge near the title (not tooltip-only) and be read by screen readers
19. WHEN external links are rendered THEN rel="noopener noreferrer" and target isolation SHALL be enforced
20. WHEN external links open THEN they SHALL use target="_blank" and pass through a safe redirector (e.g., /r?u=…) for abuse auditing
21. WHEN rendering markdown/HTML in descriptions THEN a strict sanitizer (allowlist tags/attrs) SHALL be applied; links inside MD obey the same safe-link rules

### Requirement 6: Eligibility Preview

**User Story:** As a DeFi user, I want to know if I'm eligible for an opportunity before clicking so that I don't waste time on opportunities I can't claim.

#### Acceptance Criteria

1. WHEN a wallet is connected THEN eligibility preview SHALL analyze: wallet age (25% weight), tx count (20% weight), holdings (15% weight), chain presence (40% weight), plus allowlist proofs as boolean bonus
2. WHEN eligibility score ≥ 0.7 THEN label = "Likely Eligible"
3. WHEN eligibility score is 0.4–0.69 THEN label = "Maybe Eligible"
4. WHEN eligibility score is < 0.4 THEN label = "Unlikely Eligible"
5. WHEN eligibility is shown THEN 1-2 reason bullets SHALL explain the determination
6. WHEN eligibility is calculated THEN it SHALL be cached per wallet/opportunity for 60 minutes
7. WHEN displaying eligibility THEN wallet balances SHALL never be exposed directly (use qualitative labels only)
8. WHEN eligibility cannot be computed THEN a neutral "Unknown" label SHALL render without blocking CTA

### Requirement 7: Navigation & Layout

**User Story:** As a DeFi user, I want intuitive navigation and responsive layout so that I can browse opportunities on any device.

#### Acceptance Criteria

1. WHEN the page loads THEN tabs SHALL display: All / Airdrops / Quests / Yield / Points / Featured
2. WHEN scrolling THEN sub-filters SHALL become sticky: Chain, Trust, Reward, Time Left
3. WHEN on mobile (≤768px) THEN layout SHALL be single column with collapsed filters in bottom sheet
4. WHEN on tablet (768-1279px) THEN layout SHALL be two-column grid with compact cards
5. WHEN on desktop (≥1280px) THEN layout SHALL be 2-3 columns with right rail showing: Personal picks, Saved items, Season progress
6. WHEN at the top THEN search, chain/type quick filters, and "Create Opportunity" CTA SHALL be visible
7. WHEN scrolling to 70% THEN the next page SHALL be prefetched
8. WHEN scrolling THEN infinite scroll SHALL use cursor tokens with no duplicate cards
9. WHEN a new page is fetched THEN previously rendered ids SHALL be de-duplicated client-side to avoid repeats
10. WHEN the server returns a cursor THEN it SHALL be monotonic and prevent duplicate items across pages

### Requirement 8: Empty States & Error Handling

**User Story:** As a DeFi user, I want helpful guidance when no results are found or errors occur so that I know what to do next.

#### Acceptance Criteria

1. WHEN no results match filters THEN a message SHALL suggest clearing filters and show global trending
2. WHEN the API is offline or returns an error THEN a toast notification SHALL appear with retry button
3. WHEN offline/error occurs THEN cached results SHALL be rendered if available
4. WHEN only Red trust results exist THEN an explanation SHALL show that Red filter is off by default with override option
5. WHEN an opportunity is geo/KYC gated THEN the CTA SHALL be greyed out with reason pill displayed
6. WHEN HTTP 429 is returned THEN UI SHALL backoff using Retry-After header and show a rate-limit toast
7. WHEN anon feed is cached THEN edge cache TTL SHALL be 5 minutes
8. WHEN personalized feed is requested THEN it SHALL bypass cache
9. WHEN opportunity is published/updated or trust changes THEN cache SHALL be invalidated
10. WHEN the API returns errors THEN payloads SHALL conform to: `{ "error": { "code": "STRING", "message": "HUMAN_READABLE", "retry_after_sec": 0 } }`
11. WHEN HTTP 429 is returned THEN the Retry-After header SHALL be set and mirrored as retry_after_sec in JSON
12. WHEN geo/age gating prevents action THEN the CTA SHALL be disabled with tooltip "Not available in your region/age group"
13. WHEN Guardian score crosses a category boundary (Green↔Amber↔Red) THEN affected cards SHALL be purged from edge cache within 5 minutes
14. WHEN errors are returned THEN each error SHALL have a stable code enum (RATE_LIMITED, BAD_FILTER, INTERNAL, UNAVAILABLE, NOT_ALLOWED_GEO, NOT_ALLOWED_KYC)

### Requirement 9: Accessibility

**User Story:** As a user with accessibility needs, I want the Hunter Screen to be fully accessible so that I can use it effectively.

#### Acceptance Criteria

1. WHEN viewing any element THEN AA contrast standards SHALL be met for all chips and text
2. WHEN using keyboard navigation THEN focus order SHALL be logical and visible
3. WHEN interacting with CTAs THEN aria-labels SHALL be present
4. WHEN viewing trust chips THEN text labels SHALL be included (not color-only)
5. WHEN using screen readers THEN all interactive elements SHALL be properly announced
6. WHEN tooltips are displayed THEN they SHALL be accessible via keyboard
7. WHEN tooltips and drawers are opened THEN they SHALL be dismissible via ESC key
8. WHEN tooltips and drawers are opened THEN they SHALL not trap focus
9. WHEN trust chip is interactive THEN it SHALL include role=button and aria-expanded state
10. WHEN dates/times are displayed THEN they SHALL respect user locale formatting
11. WHEN numbers are displayed THEN they SHALL use Intl formatting with localized abbreviations (k, M)
12. WHEN the Hunter Screen is displayed THEN a footer link to Privacy, Disclosures, and Risk pages SHALL be present

### Requirement 10: Analytics & Telemetry

**User Story:** As a product manager, I want comprehensive analytics on user behavior so that I can optimize the Hunter Screen experience.

#### Acceptance Criteria

1. WHEN the feed is viewed THEN a feed_view event SHALL fire
2. WHEN filters are changed THEN a filter_change event SHALL fire
3. WHEN a card is displayed THEN a card_impression event SHALL fire with 0.1% sampling
4. WHEN a card is clicked THEN a card_click event SHALL fire with 100% sampling
5. WHEN an opportunity is saved THEN a save event SHALL fire
6. WHEN an opportunity is reported THEN a report event SHALL fire
7. WHEN a CTA is clicked THEN a cta_click event SHALL fire
8. WHEN scrolling THEN scroll_depth events SHALL fire at key thresholds
9. WHEN analyzing data THEN conversion funnels SHALL be tracked per pillar
10. WHEN analyzing data THEN trust vs conversion correlation SHALL be measured
11. WHEN running experiments THEN A/B test hooks SHALL be available for: ranking weight, trust chip style, eligibility copy
12. WHEN analytics are emitted THEN wallet identifiers SHALL be salted-hashes (per-session salt)
13. WHEN analytics are emitted THEN events SHALL respect user consent gates (cookie consent)
14. WHEN wallet addresses are logged THEN they SHALL never appear in plain text in analytics systems

### Requirement 11: Security & Abuse Prevention

**User Story:** As a platform operator, I want security measures in place to prevent abuse and protect users.

#### Acceptance Criteria

1. WHEN displaying images THEN an SSRF-safe image proxy SHALL be used
2. WHEN displaying protocol/site names THEN content SHALL be sanitized
3. WHEN filter/search APIs are called THEN rate limiting SHALL be enforced
4. WHEN a report is submitted THEN it SHALL be added to the abuse queue
5. WHEN blocklist enforcement is active THEN blocked items SHALL not display
6. WHEN Red trust items exist THEN they SHALL be hidden by default requiring explicit consent to view
7. WHEN responses are sent THEN they SHALL include: CSP (Content Security Policy), HSTS, X-Content-Type-Options, X-Frame-Options=DENY
8. WHEN third-party scripts are loaded THEN they SHALL be restricted to an allowlist
9. WHEN reports are submitted THEN they SHALL be categorized (phishing, impersonation, reward not paid)
10. WHEN ≥5 independent reports occur within 1 hour THEN the opportunity SHALL be auto-quarantined
11. WHEN CSP is configured THEN connect-src SHALL be restricted to approved API origins and img-src to image proxy + allowed CDNs

### Requirement 12: Data Refresh & Sync

**User Story:** As a DeFi user, I want opportunity data to be fresh and accurate so that I don't miss time-sensitive opportunities.

#### Acceptance Criteria

1. WHEN live airdrops are synced THEN refresh SHALL occur hourly via /api/sync/airdrops
2. WHEN upcoming airdrops are synced THEN refresh SHALL occur every 4 hours via /api/sync/airdrops_upcoming
3. WHEN quests are synced THEN refresh SHALL occur hourly via /api/sync/quests
4. WHEN yield/staking data is synced THEN refresh SHALL occur every 2 hours via /api/sync/yield
5. WHEN points/loyalty data is synced THEN refresh SHALL occur daily via /api/sync/points
6. WHEN sponsored listings are created THEN they SHALL appear in real-time
7. WHEN community submissions are made THEN they SHALL require admin review before appearing
8. WHEN Guardian scans occur THEN results SHALL be reflected immediately

### Requirement 13: Data Normalization & Deduplication

**User Story:** As a DeFi user, I want consistent and accurate data without duplicates so that I can trust the information displayed.

#### Acceptance Criteria

1. WHEN duplicate items are ingested from multiple sources THEN only one card SHALL render using precedence: Partner > Internal > Aggregator
2. WHEN determining duplicates THEN dedupe key SHALL be: {protocol_slug}:{type}:{campaign_id or url}:{chain}
3. WHEN merging duplicate data THEN trust score SHALL always use the latest Guardian scan result
4. WHEN APR is sourced from multiple feeds THEN it SHALL be normalized to APY with compound frequency method and displayed with 1 decimal
5. WHEN reward units differ THEN they SHALL be normalized using RewardUnit enum (TOKEN, USD, APR, APY, POINTS, NFT)
6. WHEN time calculations are performed THEN they SHALL use UTC internally
7. WHEN time is displayed THEN it SHALL be localized to user's timezone and locale

### Requirement 14: Observability & Monitoring

**User Story:** As a platform operator, I want comprehensive monitoring and alerting so that I can maintain system reliability.

#### Acceptance Criteria

1. WHEN API p95 latency > 200ms for 5 minutes THEN an alert SHALL fire
2. WHEN error rate > 1% for 5 minutes THEN an alert SHALL fire
3. WHEN frontend hydration TTI > 2s at 95th percentile THEN an alert SHALL fire
4. WHEN alerts fire THEN they SHALL include a link to the relevant runbook
5. WHEN monitoring dashboards are viewed THEN they SHALL display golden signals: latency, traffic, errors, saturation
6. WHEN any SLO breach alert fires THEN an incident issue SHALL be auto-opened with last 15m logs, top error codes, and recent deploy SHA

### Requirement 15: Testing & QA Support

**User Story:** As a QA engineer, I want deterministic test data and fixtures so that I can write reliable automated tests.

#### Acceptance Criteria

1. WHEN /api/hunter/opportunities is called with ?mode=fixtures THEN it SHALL return a deterministic dataset for E2E testing
2. WHEN test fixtures are used THEN they SHALL include all opportunity types and edge cases
3. WHEN test fixtures are used THEN they SHALL include various trust levels and eligibility states
4. WHEN fixtures dataset is generated THEN it SHALL include ≥2 items per pillar and explicit edge cases: Red trust, geo-gated, expired, zero-reward XP, sponsored, and duplicate-source merged

### Requirement 16: Release Controls & Feature Flags

**User Story:** As a platform operator, I want to safely roll out new features and algorithms so that I can minimize risk and gather feedback.

#### Acceptance Criteria

1. WHEN ranking model is updated THEN it SHALL be controlled by server-side feature flags with per-percent rollout
2. WHEN eligibility preview algorithm changes THEN it SHALL be controlled by feature flags
3. WHEN sponsored placement rules change THEN they SHALL be controlled by feature flags
4. WHEN feature flags are enabled THEN they SHALL support gradual rollout (e.g., 1%, 10%, 50%, 100%)
5. WHEN feature flags are toggled THEN changes SHALL take effect within 60 seconds without deployment

## Out of Scope (v1)

- Full Create flow (covered in separate spec)
- Deep opportunity detail page
- Admin Console
- Preview Share Links for opportunity cards
- Server-side personalization model (score service)
- Eligibility Simulator inline
- Saved filter profiles per user
- Bulk guardian summaries via SSE

## Success Metrics

- First contentful paint ≤ 1.0s (warm cache)
- API P95 < 200ms
- Interaction response < 150ms
- 0% duplicate cards in infinite scroll
- 100% of cards show Guardian trust chip
- Filter state persists across navigation
- All accessibility criteria met (AA compliance)

###
 Requirement 17: Wallet Connection & Management

**User Story:** As a DeFi user, I want to connect my wallet to see personalized opportunities and eligibility so that I can find opportunities relevant to my portfolio.

#### Acceptance Criteria

1. WHEN the Hunter Screen loads AND no wallet is connected THEN a "Connect Wallet" button SHALL be displayed in the header
2. WHEN the "Connect Wallet" button is clicked THEN a wallet connection modal SHALL open with supported providers (MetaMask, WalletConnect, Coinbase Wallet)
3. WHEN a wallet is successfully connected THEN the wallet address SHALL be stored in the session
4. WHEN a wallet is connected THEN the feed SHALL refresh with personalized ranking based on wallet history
5. WHEN a wallet is connected THEN eligibility previews SHALL be displayed on opportunity cards
6. WHEN a wallet is disconnected THEN the feed SHALL revert to default (non-personalized) view
7. WHEN a wallet connection fails THEN an error message SHALL be displayed with retry option
8. WHEN a wallet is connected THEN the connection status SHALL persist across page refreshes
9. WHEN multiple wallets are available THEN the user SHALL be able to select which wallet to use

### Requirement 18: Multi-Wallet Selection & Switching

**User Story:** As a DeFi user with multiple wallets, I want to select which wallet to use for Hunter Screen so that I see personalized opportunities and eligibility for the correct wallet.

#### Acceptance Criteria

1. WHEN the Hunter Screen loads AND user has connected wallets THEN a wallet selector SHALL be displayed in the header
2. WHEN the wallet selector is clicked THEN a dropdown SHALL show all connected wallets with labels and truncated addresses (0x1234...5678)
3. WHEN a wallet is selected from the dropdown THEN it SHALL become the active wallet for the session
4. WHEN the active wallet changes THEN the feed SHALL refresh with personalized ranking for that wallet
5. WHEN the active wallet changes THEN eligibility previews SHALL update to show eligibility for the new wallet
6. WHEN no wallet is selected THEN the feed SHALL show default (non-personalized) opportunities
7. WHEN a wallet is selected THEN the selection SHALL persist in localStorage across sessions
8. WHEN the page reloads THEN the last selected wallet SHALL be restored if still connected
9. WHEN the wallet selector is displayed THEN it SHALL show: wallet label (if set), truncated address, and chain icon
10. WHEN hovering over a wallet in the dropdown THEN the full address SHALL be shown in a tooltip
11. WHEN a wallet is disconnected THEN it SHALL be removed from the selector and selection SHALL fall back to first available wallet
12. WHEN the active wallet is displayed in the dropdown THEN it SHALL have a visual indicator (checkmark or highlight)
13. WHEN switching wallets THEN a loading state SHALL be shown while the feed refreshes
14. WHEN the wallet selector is on mobile THEN it SHALL be responsive and touch-friendly with minimum 44px touch targets
15. WHEN a user has no connected wallets THEN a "Connect Wallet" button SHALL be shown instead of the selector
16. WHEN the wallet selector dropdown is open THEN clicking outside SHALL close the dropdown
17. WHEN the wallet selector is displayed THEN it SHALL support keyboard navigation (Tab, Enter, Escape)
18. WHEN a wallet label is set in user preferences THEN it SHALL be displayed in the selector instead of "Wallet 1", "Wallet 2"
19. WHEN the active wallet is shown THEN its ENS name SHALL be displayed if available, falling back to label or truncated address
20. WHEN switching between wallets THEN the transition SHALL be smooth with no flickering or layout shifts
