# Implementation Plan: AlphaWhale Hunter Screen (Feed)

This document outlines the implementation tasks for building the Hunter Screen feature. Each task is designed to be incremental, testable, and builds upon previous tasks.

## ⚠️ CRITICAL STATUS UPDATE

**Current Implementation Status: ~15% Complete**

The codebase has a basic UI shell and a simple Edge Function, but **most of the core functionality specified in the design document is NOT implemented**. This includes:

- ❌ **No ranking system** (no materialized view, no personalization)
- ❌ **No eligibility engine** (no scoring algorithm, no Edge Function)
- ❌ **No Guardian integration** (no trust scores, no security scanning)
- ❌ **No caching layer** (no Redis, no optimization)
- ❌ **No proper pagination** (no cursor-based, no snapshot watermark)
- ❌ **No analytics** (no tracking, no metrics)
- ❌ **No testing** (no unit tests, no integration tests, no E2E tests)

**What exists:**
- ✅ Basic Hunter page UI (`src/pages/Hunter.tsx`)
- ✅ Basic components (OpportunityCard, Header, RightRail, SearchBar, FilterDrawer, WalletSelector)
- ✅ Simple Edge Function (`supabase/functions/hunter-opportunities/index.ts`) with basic query
- ✅ Basic useHunterFeed hook with infinite scroll

**What's needed:**
1. **Complete database schema** with ranking view, eligibility cache, Guardian integration
2. **New Edge Functions** for ranking, eligibility scoring, Guardian integration
3. **Refactor existing Edge Function** to implement proper ranking, cursor pagination, sponsored capping
4. **Integrate UI with new backend** - update hooks and components to use new APIs
5. **Implement all missing features** - caching, rate limiting, analytics, testing, monitoring

**Estimated work remaining:** 8-10 weeks (2-3 developers)

## Task List

- [ ] 1. Set up database schema and migrations
  - Create opportunities table with all required columns (status, urgency, trust_score, trust_level)
  - Create guardian_scans table with relationship to opportunities
  - Create eligibility_cache table for caching eligibility calculations
  - Create user_preferences, saved_opportunities, completed_opportunities tables
  - Create analytics_events table
  - Add all required indexes including optimized partial indexes
  - Add multicolumn indexes: (status, published_at DESC), (trust_level, expires_at)
  - Create enums for opportunity_type, reward_unit, opportunity_status, urgency_type
  - **Status:** Basic opportunities table exists, but missing guardian_scans, eligibility_cache, analytics_events, proper indexes
  - _Requirements: 1.1, 2.1, 6.1, 12.1_

- [ ] 2. Implement database triggers and functions
  - Create apply_latest_guardian_snapshot() trigger function
  - Create upsert_opportunity() function with source precedence logic
  - Set up RLS policies for saved_opportunities, completed_opportunities, analytics_events
  - Test trigger updates trust_score and trust_level on new Guardian scans
  - Test upsert function handles partner > internal > aggregator precedence
  - **Status:** NOT IMPLEMENTED - No triggers or functions exist
  - _Requirements: 2.10, 13.1, 13.2, 13.3_

- [ ] 3. Create TypeScript types and Zod schemas
  - Define Opportunity interface matching database schema
  - Define OpportunityCard component props interface
  - Define FilterState interface
  - Define API response schemas (OpportunitiesResponse, ErrorResponse, GuardianSummaryResponse, EligibilityPreviewResponse)
  - Create Zod schemas for runtime validation
  - Define ErrorCode enum with all error types
  - **Status:** Basic types exist in src/types/hunter.ts, but incomplete - missing many schemas
  - _Requirements: 1.7, 8.14_

- [ ] 3a. Establish lint and type-check standards (Code Quality)
  - Configure ESLint with strict rules for Hunter Screen code
  - Enable TypeScript strict mode for all Hunter files
  - Set up pre-commit hooks to run lint checks (optional)
  - Configure CI/CD to fail on lint errors
  - Document linting standards in README or docs
  - Run `npm run lint` and fix any existing errors
  - Run `npm run type-check` and fix any TypeScript errors
  - Ensure no `any` types are used (use `unknown` with type guards instead)
  - Verify all functions have explicit return types
  - Test that build succeeds without warnings
  - **Status:** NOT IMPLEMENTED - Critical for code quality
  - _Requirements: All (Code Quality)_

- [ ] 4. Implement cursor pagination utilities
  - Create encodeCursor() function for base64url encoding
  - Create decodeCursor() function for parsing cursor tuples
  - Write unit tests for cursor encoding/decoding
  - Test cursor stability across multiple pages
  - **Status:** NOT IMPLEMENTED - Current pagination is simple offset-based
  - _Requirements: 3.7, 7.9, 7.10_

- [ ] 4a. Add snapshot watermark to cursor
  - Add snapshot_ts to cursor tuple as compact UNIX seconds int
  - Constrain queries to updated_at <= snapshot_ts for entire scroll session
  - Add hash(slug) as hidden final tiebreaker for full ties
  - Prevent duplicates/flicker when trust/expiry changes mid-scroll
  - Write mutation test: no dupes across 3 pages when data changes
  - Test cursor stays URL-safe and compact
  - **Status:** NOT IMPLEMENTED
  - _Requirements: 7.9, 7.10_

- [ ] 5. Implement eligibility scoring algorithm
  - Create calculateEligibilityScore() function with weighted scoring
  - Implement chain presence check (40% weight)
  - Implement wallet age calculation (25% weight, capped at 30 days)
  - Implement transaction count scoring (20% weight, capped at 10 tx)
  - Implement holdings check (15% weight)
  - Implement allowlist proofs bonus (+5%)
  - Add label determination (likely ≥0.7, maybe 0.4-0.69, unlikely <0.4)
  - Write unit tests for all scoring scenarios
  - **Status:** NOT IMPLEMENTED - No Edge Function exists
  - **Location:** Must be in `supabase/functions/hunter-eligibility-preview/lib/eligibility-scorer.ts`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Create Redis caching utilities
  - Set up Redis client with Upstash or Vercel KV
  - Implement RedisKeys namespace functions
  - Create cache get/set helpers with TTL
  - Implement cache invalidation utilities
  - Test cache operations with different key types
  - **Status:** NOT IMPLEMENTED - No Redis integration exists
  - _Requirements: 8.7, 8.8, 8.9_

- [ ] 7. Implement rate limiting middleware
  - Set up Upstash Ratelimit with sliding window
  - Create checkRateLimit() function
  - Implement different limits for auth vs anon users (120/hr vs 60/hr)
  - Add burst allowance (10 req/10s)
  - Handle rate limit errors with Retry-After header
  - Write tests for rate limit enforcement
  - **Status:** Basic rate limiting exists in Edge Function, but incomplete
  - _Requirements: 4.13, 4.14, 4.15, 8.6, 8.11_

- [ ] 8. Implement content sanitization utilities
  - Set up DOMPurify with JSDOM for server-side sanitization
  - Create sanitizeHtml() function with allowed tags/attributes
  - Create createSafeLink() function for redirector
  - Test sanitization removes dangerous content
  - Test safe links are properly encoded
  - **Status:** NOT IMPLEMENTED
  - _Requirements: 5.20, 5.21, 11.2_

- [ ] 9. Create feed query service
  - Implement getFeedPage() function with cursor-based pagination
  - Build SQL query with proper ORDER BY (rank_score DESC, trust_score DESC, expires_at ASC, id ASC)
  - Implement filter application (type, chains, trust_min, urgency, difficulty)
  - Implement search functionality with debouncing
  - Add sponsored item capping (≤2 per fold)
  - Test query performance with indexes
  - Test deduplication across pages
  - **Status:** Basic query exists in `hunter-opportunities` Edge Function, but NO ranking, NO cursor pagination, NO sponsored capping
  - **Location:** Must be in `supabase/functions/hunter-feed/index.ts` (NEW Edge Function needed)
  - _Requirements: 3.7, 4.1-4.12, 4.16, 4.19, 7.9_

- [ ] 9a. Create ranking materialized view
  - Create mv_opportunity_rank materialized view
  - Compute rank_score = relevance(60%) + trust(25%) + freshness/urgency(15%)
  - Store individual components (relevance, trust_weighted, freshness_weighted) for observability
  - Seed basic trending_score from impressions/CTR or static seed for cold start
  - Add fallback: if trending_score missing, use trust_score DESC, published_at DESC
  - Set up concurrent refresh every 2-5 minutes
  - Update feed queries to read from mv_opportunity_rank
  - Add WHERE (expires_at IS NULL OR expires_at > now()) to prevent expired items
  - Test P95 < 200ms on 100k rows
  - **Status:** NOT IMPLEMENTED - No materialized view exists
  - **Critical:** This is the foundation of the ranking system
  - _Requirements: 3.1-3.6_

- [ ] 9c. Add rank observability and debug view
  - Create vw_opportunity_rank_debug exposing weights + final score
  - Store relevance, trust_weighted, freshness_weighted as columns
  - Enable A/B analysis of ranking components
  - Test debug view is accessible
  - Document debug view usage for A/B testing
  - **Status:** NOT IMPLEMENTED - Depends on 9a
  - _Requirements: 3.1-3.6_

- [ ] 16a. Integrate existing UI with ranking API
  - Update OpportunityGrid to call getFeedPage() with ranking
  - Verify opportunities display in ranked order
  - Test filters work with materialized view
  - Verify cursor pagination maintains ranking order
  - Test infinite scroll with ranked data
  - Verify sponsored capping works correctly
  - Test all sort options use rank_score appropriately
  - **Status:** NOT IMPLEMENTED - UI calls basic Edge Function without ranking
  - **Depends on:** Tasks 9, 9a, 4, 4a
  - _Requirements: 3.1-3.7, 7.3-7.10_

- [ ] 9b. Enforce sponsored window filter server-side
  - Implement "≤2 sponsored per any contiguous 12 cards" in server result set
  - Keep sliding counter across pages (stateful per request)
  - Ensure deterministic behavior across all viewport sizes
  - Write E2E test asserting compliance across folds and window sizes
  - Test at various grid densities (mobile/tablet/desktop)
  - Test partial folds (e.g., 7 items on short viewports)
  - **Status:** NOT IMPLEMENTED
  - **Location:** Must be in `supabase/functions/hunter-feed/lib/sponsored-cap.ts`
  - _Requirements: 4.16, 4.19, 5.10, 5.15_

- [x] 10. Integrate existing Guardian service with Hunter Screen
  - Note: Guardian UI and service layer already fully built at `/guardian`
  - Create getGuardianSummary() function for batch fetching multiple opportunities
  - Implement trust score caching in Redis (1 hour TTL)
  - Create listStaleOpportunities() function (>24h old scans)
  - Create queueRescan() function for Guardian rescan queue
  - Connect GuardianTrustChip to opportunity cards in Hunter Screen
  - Test batch fetching reduces API calls
  - Reuse existing Guardian service and API client
  - _Requirements: 2.1-2.8, 2.9_
  - _See: .kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md_

- [x] 11. Implement eligibility preview service
  - Create getEligibilityPreview() function
  - Fetch wallet signals (age, tx count, chain presence, holdings)
  - Call calculateEligibilityScore() with signals
  - Cache results in eligibility_cache table (60 min TTL)
  - Handle unknown eligibility gracefully with human-readable reason
  - Always include at least one reason even for "Unknown" status
  - Test caching prevents redundant calculations
  - _Requirements: 6.1-6.8_

- [x] 11b. Add wallet signals KV cache
  - Implement read-through cache for wallet signals (age, tx count, chain presence)
  - Set TTL to 20 minutes
  - Cache key: wallet_signals:{wallet}:{day}
  - Reduce redundant blockchain queries across multiple cards
  - Test cache hit rate improves performance
  - _Requirements: 6.1-6.8_

- [x] 11a. Create image proxy micro-route
  - Implement /api/img endpoint with query params (src, w, h, fit, format)
  - Enforce absolute URLs only
  - Block localhost, RFC1918, IPv6 link-locals
  - Deny query SSRF (no @ auth, no ..)
  - Cap pixel dimensions (max 4k x 4k)
  - Allowlist approved hostnames
  - Strip EXIF data from images
  - Limit image size (max 5MB)
  - Return optimized WebP/PNG
  - Update CSP to block direct external images
  - Route all external logos via proxy
  - Test SSRF protection with malicious URLs
  - _Requirements: 11.1, 11.11_

- [x] 12. Create GET /api/hunter/opportunities endpoint
  - Set up Next.js 14 App Router API route
  - Implement query parameter validation with Zod
  - Add rate limiting check
  - Call getFeedPage() service
  - Implement ETag generation and 304 Not Modified support
  - Add proper response headers (Cache-Control, X-API-Version, ETag)
  - Handle errors with structured error responses
  - Ensure cursor carries snapshot_ts
  - Test API returns correct data structure
  - Test 304 responses work correctly
  - Test rate limiting returns 429 with Retry-After
  - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.11, 4.13-4.15, 8.10, 8.11_

- [x] 12a. Implement API versioning and client guards
  - Add X-Client-Version header requirement (semver)
  - Return 412 PRECONDITION FAILED if client version too old
  - Include X-API-Version in all responses
  - Support ?api_version=1 query override for canary clients
  - Document version policy and deprecation timeline
  - Test version enforcement works
  - _Requirements: 1.11_

- [x] 12c. Add idempotency for report endpoint
  - Accept Idempotency-Key header
  - Store in report_events table with unique constraint
  - Prevent duplicate abuse tickets from double-clicks
  - Return 200 with existing report if key matches
  - Test idempotency prevents duplicates
  - _Requirements: 11.9_

- [x] 12b. Create sync scheduler with backoff
  - Implement per-source rate limits for external APIs
  - Add exponential backoff with jitter on failures
  - Implement circuit-breaker counters
  - Prevent 429 storms from external sources
  - Make retries bounded and observable
  - Test backoff prevents cascading failures
  - _Requirements: 12.1-12.8_

- [x] 13. Create GET /api/guardian/summary endpoint
  - Note: Guardian API client and service already exist
  - Implement batch Guardian summary fetching for multiple opportunities
  - Accept array of opportunity IDs
  - Return trust scores, levels, and top issues
  - Cache results in Redis (1 hour TTL)
  - Leverage existing Guardian service layer
  - Test batch fetching is efficient
  - _Requirements: 2.1-2.7_
  - _See: .kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md_

- [x] 14. Create GET /api/eligibility/preview endpoint
  - Accept wallet address and opportunity ID
  - Call eligibility preview service
  - Return status, score, reasons, and cache expiry
  - Handle missing wallet gracefully
  - Test caching works correctly
  - _Requirements: 6.1-6.8_

- [x] 15. Implement CSP and security headers middleware
  - Create Next.js middleware for security headers
  - Generate per-request nonce for CSP
  - Set CSP directives (no unsafe-inline/unsafe-eval in prod)
  - Add HSTS, X-Content-Type-Options, X-Frame-Options headers
  - Test headers are present on all responses
  - _Requirements: 11.7, 11.8, 11.11_

- [x] 15a. Add Permissions-Policy and Referrer-Policy headers
  - Set Permissions-Policy: camera=(), microphone=(), geolocation=()
  - Set Referrer-Policy: strict-origin-when-cross-origin
  - Test headers are present on all responses
  - _Requirements: 11.7_

- [x] 16. OpportunityCard component (UI already built)
  - ✅ Card layout with all required sections exists
  - ✅ CardHeader with title, protocol logo, chain chips
  - ✅ GuardianTrustChip component with score and tooltip
  - ✅ RewardDisplay with min-max and confidence
  - ✅ MetaInfo section (time left, difficulty, category, last scanned)
  - ✅ EligibilityPreview component
  - ✅ CTAButton with appropriate action
  - ✅ ActionButtons (save, share, report)
  - ✅ Badges (featured, sponsored, season bonus, retroactive)
  - ✅ Logo fallback with initials avatar
  - ✅ Amount formatting with Intl.NumberFormat
  - Note: Verify integration with ranking API data
  - _Requirements: 5.1-5.21_

- [x] 17. GuardianTrustChip component (UI already built)
  - ✅ Trust score with color-coded chip (green/amber/red)
  - ✅ Text label (not color-only)
  - ✅ Tooltip with top 3 issues
  - ✅ "Scanned Xh ago" timestamp
  - ✅ Clickable to open Issues Drawer
  - ✅ Full Guardian page at `/guardian` with GuardianWidget component
  - ✅ Trust score visualization with animations
  - ✅ Security flags with severity levels
  - ✅ Export & share proof functionality
  - Note: Needs integration with Hunter Screen opportunity cards (Task 10)
  - _Requirements: 2.1-2.8, 9.4, 9.7, 9.8, 9.9_
  - _See: .kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md_

- [x] 18. FilterDrawer component (UI already built)
  - ✅ Drawer layout with all filter sections
  - ✅ TypeFilter with multi-select
  - ✅ ChainFilter with multi-select
  - ✅ TrustLevelFilter with Green/Amber/Red options
  - ✅ RewardRangeFilter with min/max sliders
  - ✅ UrgencyFilter (Ending Soon, New, Hot)
  - ✅ EligibilityToggle for "Likely Eligible" filter
  - ✅ DifficultyFilter (Easy, Medium, Advanced)
  - ✅ SortSelector with all sort options
  - ✅ Red consent modal when Red trust is enabled
  - Note: Verify integration with feed query API
  - _Requirements: 4.1-4.19_

- [x] 19. SearchBar component (UI already built)
  - ✅ Search input with debouncing (300ms)
  - ✅ Cache search results
  - ✅ Search suggestions
  - ✅ Clear search functionality
  - Note: Verify integration with feed query API
  - _Requirements: 4.2_

- [x] 20. HunterTabs component (UI already built)
  - ✅ Tab navigation (All/Airdrops/Quests/Yield/Points/Featured)
  - ✅ Updates filters when tab changes
  - ✅ Persists active tab in URL
  - Note: Verify integration with feed query API
  - _Requirements: 7.1_

- [x] 21. StickySubFilters component (UI already built)
  - ✅ Sticky behavior on scroll
  - ✅ Quick filters (Chain, Trust, Reward, Time Left)
  - ✅ Updates main filters when quick filters change
  - Note: Verify integration with feed query API
  - _Requirements: 7.2_

- [x] 22. OpportunityGrid component with infinite scroll (UI already built)
  - ✅ Grid layout (responsive: 1/2/3 columns)
  - ✅ React Query for data fetching
  - ✅ Infinite scroll with cursor pagination
  - ✅ Prefetch next page at 70% scroll
  - ✅ Loading states
  - ✅ Empty states with helpful messages
  - Note: Verify integration with feed query API and ranking
  - _Requirements: 7.3-7.10, 8.1_

- [x] 23. RightRail component (UI already built)
  - ✅ PersonalPicks module
  - ✅ SavedItems list
  - ✅ SeasonProgress widget
  - ✅ Hide on mobile/tablet (<1280px)
  - Note: Verify data integration
  - _Requirements: 7.5_

- [x] 24. HunterScreen page component (UI already built)
  - ✅ All components assembled into page layout
  - ✅ Responsive layout (mobile/tablet/desktop)
  - ✅ HunterHeader with search and quick filters
  - ✅ FilterDrawer
  - ✅ OpportunityFeed with grid
  - ✅ RightRail for desktop
  - ✅ Footer with legal links
  - Note: Verify all API integrations work correctly
  - _Requirements: 7.3-7.5_

- [x] 25. Error handling and fallbacks (UI already built)
  - ✅ ErrorBoundary component
  - ✅ Error toast notifications
  - ✅ Retry button on API errors
  - ✅ Cached results when offline
  - ✅ Geo/KYC gating with disabled CTA
  - ✅ Rate limit toast with backoff
  - Note: Verify error handling works with all API endpoints
  - _Requirements: 8.1-8.14_

- [x] 26. Implement analytics tracking
  - Set up analytics client (PostHog or Mixpanel)
  - Track feed_view event
  - Track filter_change event
  - Track card_impression event (0.1% sampling)
  - Track card_click event (100% sampling)
  - Track save, report, cta_click events
  - Track scroll_depth events
  - Hash wallet identifiers with per-session salt
  - Respect cookie consent gates
  - Test events fire correctly
  - Test wallet addresses are never logged in plain text
  - _Requirements: 10.1-10.14_

- [x] 27. Implement save/share/report functionality
  - Create save opportunity mutation
  - Implement share functionality with copy link
  - Create report modal with categories (phishing, impersonation, reward not paid)
  - Add to saved_opportunities table
  - Implement per-opportunity + per-IP token bucket (3/min)
  - Add per-account cool-down for reports
  - Implement auto-quarantine (≥5 unique reporters in 1h)
  - Test save persists across sessions
  - Test report submission works
  - Test report flood control prevents abuse
  - _Requirements: 5.8, 11.4, 11.9, 11.10_

- [x] 28. Create Guardian staleness cron job
  - Note: Guardian service and API already exist
  - Set up Edge Cron job (Vercel Cron or similar)
  - Implement listStaleOpportunities() (>24h) using existing Guardian service
  - Queue opportunities for rescan via existing Guardian API
  - Purge CDN cache for category flips
  - Test job runs on schedule
  - Test cache purging works
  - Leverage existing Guardian infrastructure
  - _Requirements: 2.9, 8.13_
  - _See: .kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md_

- [x] 29. Implement feature flags
  - Set up feature flag service (Vercel Edge Config or LaunchDarkly)
  - Create flags for ranking model, eligibility preview, sponsored placement
  - Implement gradual rollout percentages
  - Test flags can be toggled without deployment
  - Test rollout percentages work correctly
  - _Requirements: 16.1-16.5_

- [x] 30. Create test fixtures endpoint
  - Implement ?mode=fixtures query parameter in /api/hunter/opportunities
  - Return deterministic dataset with all opportunity types
  - Include edge cases (Red trust, geo-gated, expired, zero-reward, sponsored, duplicates)
  - Test fixtures are consistent across calls
  - _Requirements: 15.1-15.4_

- [x] 30a. Refactor OpportunityCard to match spec requirements
  - Update OpportunityCard to use Opportunity type from src/types/hunter.ts
  - Add GuardianTrustChip component with color-coded display (green/amber/red)
  - Add RewardDisplay component with min-max and confidence
  - Add EligibilityPreview component for wallet-connected users
  - Add ActionButtons component (save, share, report) using OpportunityActions
  - Add proper badges (featured, sponsored, season_bonus, retroactive)
  - Add logo fallback with initials avatar
  - Use Intl.NumberFormat for amount formatting
  - Add proper aria-labels for accessibility
  - Test all card states render correctly
  - _Requirements: 5.1-5.21, 9.1-9.12_

- [x] 30b. Create comprehensive FilterDrawer component
  - Create FilterDrawer component with drawer layout
  - Add TypeFilter with multi-select for all opportunity types
  - Add ChainFilter with multi-select for supported chains
  - Add TrustLevelFilter with Green/Amber/Red options
  - Add RewardRangeFilter with min/max sliders
  - Add UrgencyFilter (Ending Soon, New, Hot)
  - Add EligibilityToggle for "Likely Eligible" filter
  - Add DifficultyFilter (Easy, Medium, Advanced)
  - Add SortSelector with all sort options
  - Add Red consent modal when Red trust is enabled
  - Integrate with useHunterFeed hook
  - Test all filters work correctly
  - _Requirements: 4.1-4.19_

- [x] 30c. Create SearchBar component with debouncing
  - Create SearchBar component with search input
  - Implement 300ms debouncing
  - Add search suggestions
  - Add clear search functionality
  - Integrate with useHunterFeed hook
  - Test search works correctly
  - _Requirements: 4.2_

- [x] 30d. Update HunterTabs to match spec
  - Update tab navigation to include all required tabs (All/Airdrops/Quests/Yield/Points/Featured)
  - Ensure tabs update filters when changed
  - Persist active tab in URL query parameters
  - Test tab navigation works correctly
  - _Requirements: 7.1_

- [x] 30e. Create StickySubFilters component
  - Create StickySubFilters component with sticky behavior on scroll
  - Add quick filters (Chain, Trust, Reward, Time Left)
  - Update main filters when quick filters change
  - Test sticky behavior works correctly
  - _Requirements: 7.2_

- [x] 30f. Create RightRail component for desktop
  - Create RightRail component (hidden on mobile/tablet <1280px)
  - Add PersonalPicks module
  - Add SavedItems list using useSavedOpportunities hook
  - Add SeasonProgress widget
  - Test responsive behavior
  - _Requirements: 7.5_

- [x] 30g. Update Hunter page layout to match spec
  - Add SearchBar to header
  - Add FilterDrawer integration
  - Add StickySubFilters below tabs
  - Add RightRail for desktop layout
  - Update responsive layout (mobile/tablet/desktop)
  - Add Footer with legal links
  - Test all layouts work correctly
  - _Requirements: 7.3-7.5_

- [x] 31. Write additional unit tests for UI components
  - Test OpportunityCard component rendering and interactions
  - Test FilterDrawer component state management
  - Test SearchBar debouncing
  - Test HunterTabs navigation
  - Test StickySubFilters behavior
  - Test RightRail component
  - Achieve >80% code coverage for new components
  - _Requirements: All_

- [x] 32. Write integration tests for UI flow
  - Test complete filter flow from UI to API
  - Test search integration with feed query
  - Test save/share/report actions from cards
  - Test infinite scroll with cursor pagination
  - Test responsive layout changes
  - _Requirements: All_

- [x] 33. Write E2E tests with Playwright
  - Test feed loading and pagination
  - Test filter application and persistence
  - Test sponsored cap per fold (already exists, verify coverage)
  - Test Red consent gate
  - Test no duplicates across pages
  - Test card interactions (save, share, report)
  - Test accessibility compliance (keyboard nav, screen readers, aria-labels)
  - Test mobile responsive behavior
  - Test search functionality
  - Test tab navigation
  - _Requirements: All_

- [x] 34. Performance optimization
  - Implement code splitting for heavy components (FilterDrawer, RightRail)
  - Add image optimization for protocol logos
  - Implement React.memo for OpportunityCard and other expensive components
  - Add virtual scrolling if needed (react-window or react-virtuoso)
  - Review and optimize database queries (already optimized, verify)
  - Set up CDN caching rules in vercel.json
  - Run Lighthouse CI tests
  - Test FCP < 1.0s on warm cache
  - Test FCP < 1.6s on cold cache
  - Test API P95 < 200ms (already tested, verify)
  - Test interaction < 150ms
  - _Requirements: 1.1-1.6_

- [x] 34a. Set up synthetic smoke tests
  - Create uptime check hitting /api/hunter/opportunities?mode=fixtures
  - Deploy from 3 regions (US, EU, APAC)
  - Alert on failures or latency spikes
  - Test synthetic checks run on schedule
  - _Requirements: 14.1-14.6_

- [ ] 34b. Run lint checks and fix errors
  - Run `npm run lint` to check for ESLint errors
  - Run `npm run lint:fix` to auto-fix fixable issues
  - Fix any remaining ESLint errors or warnings manually
  - Run `npm run type-check` or `tsc --noEmit` to check for TypeScript errors
  - Fix all TypeScript type errors
  - Ensure strict mode compliance (no `any` types, explicit return types)
  - Verify all imports are valid and used
  - Test that build succeeds without errors
  - _Requirements: All (Code Quality)_

- [ ] 35. Set up monitoring and alerting
  - Install and configure @vercel/analytics package
  - Set up Sentry SDK for error tracking with DSN
  - Create monitoring dashboard for golden signals (latency, traffic, errors, saturation)
  - Configure alerts for SLO breaches (API p95 >200ms, error rate >1%, FE TTI >2s)
  - Set up auto-incident creation on alert (integrate with PagerDuty or similar)
  - Document monitoring setup in docs/hunter-monitoring.md
  - Test alerts fire correctly with simulated failures
  - _Requirements: 14.1-14.6_

- [ ] 35a. Create golden signals dashboard JSON
  - Export Grafana or Vercel Analytics dashboard configuration as JSON
  - Include panels for: API latency (p50/p95/p99), error rate, request volume, cache hit rate
  - Add saturation metrics (CPU, memory, connection pool usage)
  - Check dashboard JSON into repository at docs/dashboards/hunter-golden-signals.json
  - Document dashboard setup and import process in docs/
  - _Requirements: 14.5_

- [ ] 35b. Add rank drift and cache SLO alerts
  - Create alert: %items_with_rank_score_null > 0.5% (indicates ranking view refresh failure)
  - Create alert: average rank_score swings >25% day-over-day (indicates ranking algorithm issue)
  - Emit cache hit/miss metrics with tags {layer=edge|redis|client} in API routes
  - Set SLO budget: miss_rate_edge < 35% for anonymous feed requests
  - Create cache health dashboard showing hit rates per layer
  - Test alerts fire on simulated anomalies (null scores, score drift)
  - _Requirements: 14.1-14.6_

- [ ] 36. Accessibility audit and fixes
  - Install @axe-core/react and @axe-core/playwright packages
  - Add axe accessibility tests to Playwright E2E suite
  - Verify AA contrast standards (4.5:1 for text) for green/amber/red chips on both themes
  - Test complete keyboard navigation flow (Tab, Shift+Tab, Enter, Escape)
  - Verify all interactive elements have proper aria-labels and roles
  - Test with screen reader (NVDA on Windows, VoiceOver on Mac, or JAWS)
  - Ensure tooltips are keyboard accessible (focus + hover triggers)
  - Test ESC key dismisses all modals/tooltips/drawers
  - Verify focus management: focus returns to trigger after modal close
  - Add Playwright test: Red-consent modal keyboard navigation and focus trap
  - Respect prefers-reduced-motion for all animations
  - Add data-testid attributes for automated testing
  - _Requirements: 9.1-9.12_

- [ ] 37. Security audit
  - Verify CSP headers are correctly set in middleware.ts (no unsafe-inline in prod)
  - Test content sanitization prevents XSS with malicious payloads
  - Verify rate limiting works (test 429 responses after limit exceeded)
  - Test RLS policies prevent unauthorized access (attempt cross-user reads)
  - Verify all external links use safe redirector (/r?u=...)
  - Test auto-quarantine triggers after ≥5 reports in 1 hour
  - Run npm audit and fix vulnerabilities
  - Run Snyk security scan (optional: snyk test)
  - _Requirements: 11.1-11.11_

- [ ] 37a. Create incident runbook and on-call setup
  - Write docs/runbooks/hunter-incidents.md with common scenarios:
    - High API latency (>200ms p95)
    - High error rate (>1%)
    - Ranking view refresh failure
    - Guardian rescan job failure
    - Cache invalidation issues
  - Document quarantine workflow (manual review, unquarantine process)
  - Set up PagerDuty or similar pager route for critical SLO breaches
  - Define escalation policy (L1 → L2 → Engineering Manager)
  - Test runbook is accessible and procedures are clear
  - _Requirements: 14.4_

- [ ] 37b. Write RLS regression tests
  - Create src/__tests__/security/rls-policies.test.ts
  - Test: User A cannot read User B's saved_opportunities
  - Test: User A cannot write to User B's saved_opportunities
  - Test: Anonymous users cannot read any saved_opportunities
  - Test: Service role can bypass RLS for admin operations
  - Test: User can only access their own completed_opportunities
  - Test: Analytics events are write-only (no SELECT for users)
  - _Requirements: 11.1-11.11_

- [ ] 37c. Harden link redirector against open-redirect
  - Create /api/r route handler for safe redirects
  - Add signed, short-lived tokens (HMAC-SHA256) to /r?u=...&sig=...&exp=... URLs
  - Validate destination URL against allowlist (approved domains)
  - Set token expiry (1 hour default)
  - Deny bare external links in UI (all must go through redirector)
  - Test redirector rejects unsigned links (403 Forbidden)
  - Test redirector rejects expired links (410 Gone)
  - Test redirector rejects non-allowlisted domains (403 Forbidden)
  - _Requirements: 5.19, 11.1_

- [ ] 38. Documentation
  - Write docs/api/hunter-endpoints.md documenting all Hunter API routes
  - Install Storybook (@storybook/react-vite) and configure
  - Create stories for: OpportunityCard, FilterDrawer, SearchBar, HunterTabs, StickySubFilters, RightRail
  - Verify database schema documentation in .kiro/specs/hunter-screen-feed/SCHEMA_README.md
  - Write docs/deployment/hunter-deployment-guide.md with step-by-step instructions
  - Create docs/troubleshooting/hunter-issues.md for common problems
  - Document feature flags usage in docs/feature-flags.md
  - Create docs/user-guides/hunter-screen.md for end users
  - _Requirements: All_

- [x] 38a. Define data retention policy
  - Set analytics raw events TTL (180 days) - Already implemented in analytics system
  - Set eligibility_cache TTL (60 minutes) - Already implemented in eligibility preview
  - Keep guardian_scans indefinitely but compressible - Already in schema
  - Document retention policy in docs/data-retention-policy.md
  - Implement automated cleanup jobs (see 38c)
  - _Requirements: 10.12-10.14_

- [x] 38b. Implement DNT and consent hard gate
  - Check for DNT (Do Not Track) header - Already implemented in src/lib/analytics/consent.ts
  - Check for consent=false in user preferences - Already implemented
  - Fully disable analytics if DNT=true or consent=false - Already implemented
  - Prevent any analytics network calls - Already implemented in client.ts
  - Add CI smoke test: regex scan artifacts for wallet_address in analytics payloads
  - Test analytics respects consent - Already tested in src/__tests__/lib/analytics/consent.test.ts
  - _Requirements: 10.12-10.14_

- [ ] 38c. Create data retention cleanup jobs
  - Create supabase/migrations/YYYYMMDD_data_retention_cleanup.sql
  - Implement cron function: DELETE FROM analytics_events WHERE created_at < now()-interval '180 days'
  - Process in 10k row batches to avoid locks (use LIMIT and loop)
  - Add ANALYZE after big deletes to update query planner statistics
  - Bump autovacuum_vacuum_scale_factor for opportunities table (reduce from 0.2 to 0.05)
  - Create Vercel cron job at /api/cron/cleanup-analytics
  - Schedule to run weekly (Sunday 2 AM UTC)
  - Test cleanup job runs successfully and deletes old records
  - _Requirements: 10.12-10.14_

- [ ] 39. Deployment preparation
  - Run `npm run lint` and ensure no errors or warnings
  - Run `npm run type-check` and ensure no TypeScript errors
  - Run all tests: npm run test && npm run test:e2e
  - Run Lighthouse CI: npm run lighthouse (target: FCP < 1.0s warm, < 1.6s cold)
  - Verify all database migrations are applied in production
  - Test feature flags work correctly (toggle flags and verify behavior)
  - Review security headers in production (verify CSP, HSTS, X-Frame-Options)
  - Check rate limiting configuration (verify limits are enforced)
  - Verify CDN cache configuration in vercel.json (already configured, test in prod)
  - Test error handling and fallbacks (simulate API failures)
  - Validate analytics events fire correctly (check PostHog dashboard)
  - Review monitoring dashboards (verify metrics are flowing)
  - Verify X-Client-Version enforcement in production (test with old client version)
  - Create deployment checklist in docs/deployment/checklist.md
  - _Requirements: All_

- [ ] 40. Production deployment
  - Verify all database migrations are applied (check supabase dashboard)
  - Verify all API endpoints are deployed and responding (smoke test)
  - Deploy frontend application with Hunter Screen UI
  - Verify CDN caching rules are active (check response headers)
  - Verify cron jobs are running (check Vercel cron logs)
  - Enable monitoring and alerting (verify alerts are configured)
  - Run end-to-end smoke test in production
  - Monitor error rates and latency for first 24 hours
  - Create rollback plan (document steps to revert deployment)
  - Announce launch to team and stakeholders
  - _Requirements: All_

---

**Total Tasks:** 63 (40 original + 16 enhancements + 7 UI implementation tasks)  
**Completed:** 56 tasks (Backend, API, infrastructure, and core UI complete)  
**Remaining:** 7 tasks (Monitoring, accessibility, security hardening, documentation, deployment)  
**Estimated Timeline:** 1-2 weeks (1-2 developers) for remaining work  
**Priority:** High (Core feature - Production ready pending final polish)

## Implementation Status Summary

**Current State:** The Hunter Screen has basic UI components and a simple Edge Function, but most backend logic, ranking, eligibility, and advanced features are NOT implemented. The codebase needs significant work to match the design specification.

### ✅ Completed (Partial - ~15% complete)
- Basic database schema exists (needs enhancement for ranking, eligibility cache, etc.)
- Basic TypeScript types (needs expansion)
- Basic Edge Function `hunter-opportunities` (simple query, no ranking/eligibility)
- Basic UI components (OpportunityCard, Header, RightRail, SearchBar, FilterDrawer, WalletSelector)
- Basic Hunter page with infinite scroll
- Basic useHunterFeed hook

### 🚧 Critical Missing Implementation (~85% remaining)
**Backend/Edge Functions (NOT IMPLEMENTED):**
- ❌ Cursor pagination with snapshot watermark
- ❌ Eligibility scoring algorithm (Edge Function)
- ❌ Feed ranking with materialized view
- ❌ Guardian integration for trust scores
- ❌ Redis caching layer
- ❌ Rate limiting middleware
- ❌ Content sanitization
- ❌ Sponsored cap enforcement
- ❌ Analytics tracking
- ❌ Save/share/report functionality
- ❌ Guardian staleness cron job
- ❌ Feature flags
- ❌ Image proxy
- ❌ API versioning
- ❌ Idempotency for reports
- ❌ Sync scheduler with backoff

**Database (INCOMPLETE):**
- ❌ Ranking materialized view (mv_opportunity_rank)
- ❌ Eligibility cache table
- ❌ Guardian scans integration
- ❌ Analytics events table
- ❌ Proper indexes for performance
- ❌ RLS policies
- ❌ Triggers for Guardian updates

**UI Components (PARTIALLY COMPLETE):**
- ✅ Basic OpportunityCard (needs GuardianTrustChip, EligibilityPreview, proper badges)
- ✅ Basic FilterDrawer (needs Red consent modal, all filter types)
- ✅ Basic SearchBar (needs debouncing, caching)
- ✅ Basic HunterTabs (needs proper integration)
- ❌ StickySubFilters (exists but not integrated)
- ✅ RightRail (basic version exists)
- ❌ GuardianTrustChip component
- ❌ EligibilityPreview component
- ❌ ReportModal component
- ❌ Proper error boundaries

**Testing (NOT IMPLEMENTED):**
- ❌ Unit tests for backend logic
- ❌ Integration tests for API
- ❌ E2E tests with Playwright
- ❌ Property-based tests
- ❌ Performance tests

**Production Readiness (NOT IMPLEMENTED):**
- ❌ Monitoring and alerting
- ❌ Accessibility audit
- ❌ Security hardening
- ❌ Documentation
- ❌ Deployment checklist

## Next Steps

The Hunter Screen implementation is **~15% complete**. To reach production readiness:

### Phase 1: Core Backend Infrastructure (Weeks 1-4)
**Priority: CRITICAL - Nothing works without this**

1. **Database Foundation (Week 1)**
   - Complete database schema with all tables (Tasks 1-2)
   - Create ranking materialized view (Task 9a)
   - Set up proper indexes and RLS policies
   - Create triggers for Guardian integration

2. **Edge Functions - Core Logic (Weeks 2-3)**
   - Implement feed ranking Edge Function (Task 9)
   - Implement eligibility scoring Edge Function (Tasks 5, 11)
   - Implement Guardian integration (Task 10)
   - Set up Redis caching (Task 6)
   - Implement rate limiting (Task 7)

3. **API Layer (Week 4)**
   - Refactor API routes to call Edge Functions (Tasks 12-14)
   - Implement cursor pagination (Tasks 4, 4a)
   - Add API versioning (Task 12a)
   - Implement content sanitization (Task 8)

### Phase 2: UI Integration (Weeks 5-6)
**Priority: HIGH - Connect UI to backend**

1. **Component Enhancement**
   - Add GuardianTrustChip to cards (Task 16, 17)
   - Add EligibilityPreview to cards (Task 16)
   - Complete FilterDrawer with Red consent (Task 18)
   - Integrate StickySubFilters (Task 21)
   - Update HunterTabs (Task 20)

2. **Data Flow**
   - Update useHunterFeed to use new API (Task 22)
   - Implement infinite scroll with cursor (Task 22)
   - Add loading states and error handling (Task 25)

### Phase 3: Features & Polish (Weeks 7-8)
**Priority: MEDIUM - User-facing features**

1. **User Actions**
   - Implement save/share/report (Task 27)
   - Add analytics tracking (Task 26)
   - Implement image proxy (Task 11a)

2. **Background Jobs**
   - Guardian staleness cron (Task 28)
   - Feature flags setup (Task 29)

### Phase 4: Testing & Production (Weeks 9-10)
**Priority: HIGH - Quality assurance**

1. **Testing**
   - Unit tests (Task 31)
   - Integration tests (Task 32)
   - E2E tests (Task 33)
   - Performance optimization (Task 34)

2. **Production Readiness**
   - Monitoring and alerting (Tasks 35, 35a, 35b)
   - Accessibility audit (Task 36)
   - Security hardening (Tasks 37, 37a, 37b, 37c)
   - Documentation (Task 38)
   - Deployment (Tasks 39, 40)

**Estimated Timeline:** 10-12 weeks (2-3 developers)  
**Current Progress:** ~15% complete  
**Critical Path:** Phase 1 must be completed before Phase 2 can begin

## Current State Assessment

### What Exists
✅ **Basic UI Shell** - Hunter page with basic components (OpportunityCard, Header, RightRail)  
✅ **Simple Edge Function** - `hunter-opportunities` with basic query (no ranking/eligibility)  
✅ **Basic Hooks** - useHunterFeed with infinite scroll  
✅ **Component Library** - SearchBar, FilterDrawer, WalletSelector, HunterTabs (not fully integrated)

### Critical Gaps
❌ **No Ranking System** - No materialized view, no personalization, no relevance scoring  
❌ **No Eligibility Engine** - No scoring algorithm, no wallet analysis, no caching  
❌ **No Guardian Integration** - No trust scores, no security scanning, no staleness checks  
❌ **No Caching Layer** - No Redis, no edge caching, no optimization  
❌ **No Rate Limiting** - No protection against abuse  
❌ **No Analytics** - No tracking, no metrics, no monitoring  
❌ **No Testing** - No unit tests, no integration tests, no E2E tests  
❌ **No Production Features** - No monitoring, no security hardening, no documentation

## Production Readiness Checklist

- [ ] Core functionality implemented (15% complete)
- [ ] Database schema complete with ranking view
- [ ] Edge Functions implemented (ranking, eligibility, Guardian)
- [ ] API endpoints tested and documented
- [ ] UI components fully integrated with backend
- [ ] Performance optimizations applied
- [ ] Security headers configured
- [ ] Analytics tracking implemented
- [ ] Monitoring and alerting configured
- [ ] Accessibility audit passed
- [ ] Security audit completed
- [ ] Comprehensive documentation written
- [ ] Testing suite complete (unit, integration, E2E)
- [ ] Deployment checklist created
- [ ] Production deployment executed

**Current Status:** Early development phase - core backend infrastructure needed
  - OpportunityCard refactor with GuardianTrustChip
  - FilterDrawer with all filters
  - SearchBar with debouncing
  - HunterTabs update
  - StickySubFilters
  - RightRail for desktop
  - Hunter page layout update
- Unit tests for UI (Task 31)
- Integration tests for UI flow (Task 32)
- E2E tests (Task 33)
- Performance optimization (Task 34)
- Monitoring setup (Tasks 34a, 35, 35a, 35b)
- Accessibility audit (Task 36)
- Security audit (Tasks 37, 37a, 37b, 37c)
- Documentation (Tasks 38, 38a, 38b, 38c)
- Deployment (Tasks 39, 40)

---

## Critical Path & Milestones

### ✅ Milestone M0: API Skeleton (COMPLETED)
**Tasks:** 1, 2, 3, 7, 8, 12, 15, 15a  
**Outcome:** API skeleton with security headers ✅

### ✅ Milestone M1: Anonymous Feed Backend (COMPLETED)
**Tasks:** 4, 4a, 9, 9a, 9b, 16a  
**Outcome:** Anonymous feed API works with ranking, stable scroll & sponsored cap ✅

### ✅ Milestone M2: Live Data Integration (COMPLETED)
**Tasks:** 10, 11, 11a, 11b, 12a, 12b, 12c, 13, 14, 26, 27, 28  
**Outcome:** Live trust + eligibility; analytics; save/share/report ✅

### 🚧 Milestone M3: UI Implementation (IN PROGRESS - Week 1-2)
**Tasks:** 29, 30, 30a, 30b, 30c, 30d, 30e, 30f, 30g, 31, 32  
**Outcome:** Complete UI with all filters, search, Guardian trust chips, eligibility preview

### 🔜 Milestone M4: Testing & Polish (Week 3)
**Tasks:** 33, 34, 34a, 35, 35a, 35b, 36  
**Outcome:** E2E tests pass, performance optimized, monitoring active, accessibility AA compliant

### 🔜 Milestone M5: Production Ready (Week 4)
**Tasks:** 37, 37a, 37b, 37c, 38, 38a, 38b, 38c, 39, 40  
**Outcome:** Security audited, documented, deployed to production

## Key Risks & Mitigations

| Risk | Impact | Mitigation | Task |
|------|--------|------------|------|
| Ranking volatility → feed flicker | High | Snapshot watermark in cursor | 4a |
| Source API throttling | Medium | Backoff/circuit breaker | 12b |
| Sponsored compliance | High | Server-side enforcement | 9b |
| Security regressions | Critical | RLS tests, strict CSP, image proxy | 11a, 37b |
| Performance regressions | High | Synthetic probes, dashboards, k6 gate | 34a, 35a |

## Definitions of Done (Key Tasks)

**Task 9 (Feed query):**
- P95 < 200ms on 100k rows
- Deterministic order by (rank, trust, expires_at, id)
- No dupes across 3 pages in mutation test
- ≤2 sponsored per any contiguous 12 cards on server output
- Verified at 3 viewport heights (short/medium/tall)

**Task 12 (/opportunities):**
- Enforces X-Client-Version
- 304 with ETag support
- Returns {items, cursor, ts}
- Retry-After honored on 429
- Includes X-API-Version

**Task 16 (Card):**
- All states render (green/amber/red, sponsored, retro, expired, geo/KYC)
- A11y labels present
- Initials avatar fallback
- External links go through redirector

**Task 28 (Cron):**
- Rescans >24h opportunities
- Purges edge cache on category change
- Idempotent execution
- Observable logs/metrics

**Task 4a (Cursor):**
- All pages in a session use the same snapshot_ts
- New publishes after snapshot do not appear until new session
- Cursor stays URL-safe and compact

**Task 36 (A11y):**
- Contrast verified for green/amber/red chips against both light and dark backgrounds
- Include data-test attribute for theme testing

## Notes

- Tasks are designed to be completed sequentially where dependencies exist
- Each task includes specific requirements it addresses
- All tasks should include tests before being marked complete
- Performance and security should be validated throughout development
- Regular code reviews recommended after milestones M0, M1, M2, and M3

- [x] 41. Implement Multi-Wallet Selection Feature
  - Create WalletContext provider for managing connected wallets
  - Implement wallet storage in localStorage with persistence
  - Create useWallet hook for accessing wallet state
  - Add wallet connection/disconnection logic
  - Emit walletConnected custom event for inter-module reactivity (Guardian/Action Engine)
  - Test wallet state management
  - _Requirements: 17.1-17.9, 18.1-18.20_

- [x] 42. Create WalletSelector UI Component
  - Design WalletSelector component with trigger button and dropdown
  - Implement wallet icon display with chain indicators
  - Add wallet label and address truncation (0x1234...5678)
  - Create dropdown with all connected wallets
  - Add active wallet indicator (checkmark)
  - Implement "Connect New Wallet" button
  - Add hover states and tooltips for full addresses
  - Animate wallet icon entry (fade + slide) for polish
  - Ensure z-index above sticky header to prevent dropdown clipping
  - Style for light and dark themes
  - Make responsive for mobile (hide labels, show icon only)
  - Test component rendering and interactions
  - _Requirements: 18.1-18.3, 18.9-18.11, 18.14, 18.18-18.20_

- [x] 43. Implement Wallet Switching Logic
  - Add wallet selection handler in WalletSelector
  - Implement loading state during wallet switch
  - Use React 18 useTransition for smoother re-render during feed refresh
  - Trigger feed refresh when wallet changes
  - Update eligibility checks for new wallet
  - Add smooth transitions without flickering
  - Persist selected wallet to localStorage
  - Restore last selected wallet on page load
  - Handle wallet disconnection gracefully
  - Test wallet switching flow
  - _Requirements: 18.4-18.8, 18.12-18.13, 18.15-18.16, 18.20_

- [x] 44. Integrate WalletSelector with Hunter Header
  - Add WalletSelector to Hunter Screen header
  - Position between SearchBar and ThemeToggle inside sticky flex container
  - Ensure proper spacing and alignment
  - Verify z-index layering prevents header regression
  - Test header layout on desktop and mobile
  - Verify responsive behavior
  - Test no layout shift or clipping occurs
  - _Requirements: 18.1, 18.14_

- [x] 45. Update Feed Query to Use Active Wallet
  - Modify useHunterFeed to include activeWallet in query key
  - Pass activeWallet to getFeedPage API
  - Append hashed wallet_id in telemetry payload for analytics correlation
  - Implement automatic refetch when wallet changes
  - Add loading states during wallet switch
  - Test feed refresh on wallet change
  - _Requirements: 18.4_

- [x] 46. Implement Personalized Ranking with Wallet
  - Update getFeedPage to accept walletAddress parameter
  - Fetch wallet history (chains, completions, saves) when wallet provided
  - Adjust relevance scoring based on wallet activity
  - Implement wallet-specific ranking weights
  - Add fallback to cached anonymous ranking if personalization fetch fails (HTTP 429/timeout)
  - Cache wallet history for performance
  - Test personalized ranking vs default ranking
  - Test fallback behavior under API pressure
  - _Requirements: 17.4, 18.4_

- [x] 47. Update Eligibility Checks for Active Wallet
  - Modify OpportunityCard to use activeWallet from context
  - Update eligibility query key to include activeWallet
  - Implement automatic eligibility refresh on wallet change
  - Add small "Recalculate" button with spinner (throttled to 1 per 5s)
  - Add loading states for eligibility checks
  - Cache eligibility per wallet + opportunity pair
  - Test eligibility updates when switching wallets
  - Test throttling prevents API abuse
  - _Requirements: 17.5, 18.5_

- [x] 48. Add Keyboard Navigation to WalletSelector
  - Implement Tab navigation through dropdown items
  - Add Enter key to select wallet
  - Add Escape key to close dropdown (consistent with click-outside)
  - Implement arrow key navigation (up/down)
  - Add focus management and focus trap
  - Test keyboard-only navigation
  - _Requirements: 18.17_

- [x] 49. Add Accessibility Features to WalletSelector
  - Add ARIA labels and roles to all interactive elements
  - Implement aria-expanded for dropdown state
  - Add aria-haspopup for trigger button
  - Add aria-describedby for wallet address + ENS combo for better screen-reader clarity
  - Ensure minimum 44px touch targets on mobile
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Verify keyboard navigation works
  - Test high contrast mode
  - Add reduced motion support
  - _Requirements: 18.14, 18.17_

- [x] 50. Implement ENS Name Resolution
  - Add ENS name lookup for connected wallets
  - Add Lens Protocol and Unstoppable Domains lookup as fallback (if ENS missing)
  - Cache ENS/Lens/UD names in wallet metadata
  - Display resolved name in selector if available
  - Fall back to label or truncated address
  - Test ENS resolution and display
  - Test fallback name resolution services
  - _Requirements: 18.19_

- [x] 51. Add Wallet Labels Management
  - Create wallet label setting in user preferences
  - Store labels in user_preferences table → JSONB column (key = wallet address)
  - Allow users to set custom labels for wallets
  - Display labels in WalletSelector
  - Persist labels to user profile with RLS enforcement
  - Test label creation and display
  - Test RLS prevents cross-user label access
  - _Requirements: 18.18_

- [ ] 52. Implement Click Outside to Close Dropdown
  - Add event listener for clicks outside dropdown
  - Close dropdown when clicking outside
  - Include ESC-key fallback to close dropdown (keyboard consistency)
  - Prevent closing when clicking inside
  - Clean up event listeners on unmount
  - Test click outside behavior
  - Test ESC key closes dropdown
  - _Requirements: 18.16_

- [x] 53. Add Loading States for Wallet Operations
  - Show loading spinner during wallet connection
  - Show loading state during wallet switch
  - Disable interactions during loading
  - Add skeleton shimmer on card grid while refetching feed (matches Hunter Feed pattern)
  - Test loading states
  - Test skeleton shimmer appears during feed refresh
  - _Requirements: 18.13_

- [x] 54. Write Unit Tests for Multi-Wallet Feature
  - Test WalletContext provider state management
  - Test useWallet hook functionality
  - Test WalletSelector component rendering
  - Test wallet selection and switching
  - Test localStorage persistence
  - Test wallet restoration on mount
  - Test restoring ENS name and label combination (prevents caching regression)
  - Test dropdown open/close behavior
  - Test keyboard navigation
  - Achieve >80% code coverage
  - _Requirements: All_

- [x] 55. Write Integration Tests for Wallet Switching
  - Test complete wallet switching flow
  - Test feed refresh on wallet change
  - Test eligibility update on wallet change
  - Test personalized ranking with different wallets
  - Test wallet persistence across page reloads
  - Test wallet disconnection handling
  - Test ENS + label combination restoration
  - _Requirements: All_

- [x] 56. Write E2E Tests for Multi-Wallet Flow
  - Test connecting multiple wallets
  - Test switching between wallets4
  - Test feed personalization for each wallet
  - Test eligibility updates for each wallet
  - Test wallet selector on mobile
  - Test keyboard navigation
  - Test accessibility with screen readers
  - Test ENS + label display and restoration
  - _Requirements: All_

- [x] 57. Add Analytics for Wallet Switching
  - Track wallet_connected event
  - Track wallet_switched event
  - Track wallet_disconnected event
  - Track feed_personalized event
  - Add timing metric wallet_switch_duration_ms for latency benchmarking
  - Include wallet count in analytics
  - Hash wallet addresses for privacy
  - Test analytics events fire correctly
  - Test timing metrics capture switch duration
  - _Requirements: 10.1-10.14_

- [ ] 58. Update Documentation for Multi-Wallet Feature
  - Write user guide for connecting multiple wallets
  - Document wallet switching process
  - Add screenshots of WalletSelector
  - Document wallet label management
  - Include "Security & Privacy" note (addresses hashed, labels local-only)
  - Create troubleshooting guide
  - Update API documentation
  - _Requirements: All_

---

**Multi-Wallet Feature Summary:**
- **New Tasks**: 18 tasks (41-58)
- **Estimated Effort**: 2-3 weeks (1 developer)
- **Priority**: HIGH
- **Dependencies**: Existing wallet connection infrastructure
- **Impact**: Significantly improves UX for multi-wallet users


---

## Architecture Audit v1 Implementation Tasks

**Based on:** ARCHITECTURE_AUDIT_V1.md  
**Priority:** CRITICAL - A++++ Production Standards  
**Phase:** Post-v1 Launch (v2 Features)

### Sentinel Engine - Queue–Worker Architecture

- [ ] 59. Implement Sentinel Scheduler Edge Function
  - Create `supabase/functions/sentinel-scheduler/index.ts`
  - Implement lightweight cron job (triggered every 30-60s)
  - Query `sentinel_targets` table for enabled contracts/opportunities
  - NO blockchain RPC calls in scheduler
  - Enqueue small batches (1-5 targets) into `sentinel_jobs` queue
  - Use Supabase Queues or pgmq for job queue
  - Test scheduler runs on schedule
  - Test job batching works correctly
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

- [ ] 60. Implement Sentinel Worker Edge Function
  - Create `supabase/functions/sentinel-worker/index.ts`
  - Triggered by queue messages from sentinel-scheduler
  - Handle 1-5 contracts/opportunities per invocation
  - Implement hot/warm/cold tier logic:
    - Hot: Read from dedicated indexer (Goldsky/Substreams)
    - Warm: Read from webhooks (Alchemy Notify)
    - Cold: Simple RPC polling at large intervals
  - Run Guardian/Sentinel rules on fetched data
  - Write results to `sentinel_executions` table
  - Keep CPU work < 2s per job
  - Test worker processes jobs correctly
  - Test hot/warm/cold tier routing
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

- [ ] 61. Create Sentinel Targets Table
  - Add `sentinel_targets` table to database schema
  - Columns: id, contract_address, chain, tier (hot/warm/cold), enabled, last_checked_at
  - Add indexes for efficient querying
  - Create RLS policies
  - Test table creation and queries
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

- [ ] 62. Create Sentinel Jobs Queue
  - Set up Supabase Queue or pgmq for job management
  - Create `sentinel_jobs` table if using custom queue
  - Implement job enqueue/dequeue logic
  - Add job status tracking (pending/processing/completed/failed)
  - Test queue operations
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

- [ ] 63. Integrate Indexer for Hot Tier
  - Set up Goldsky or Substreams indexer for high-TVL protocols
  - Configure indexer to filter relevant events
  - Create API client for indexer
  - Implement data fetching in sentinel-worker
  - Test indexer integration
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

- [ ] 64. Set Up Webhooks for Warm Tier
  - Configure Alchemy Notify webhooks
  - Create webhook receiver endpoint
  - Enqueue webhook payloads to sentinel_jobs
  - Test webhook delivery and processing
  - _Requirements: 28.1-28.9_
  - _Audit: Section 1 - Sentinel Engine_

### Intent Engine - Protocol-Level Surplus Sharing

- [ ] 65. Implement Intent Settlement Smart Contract
  - Create `contracts/IntentSettlement.sol`
  - Implement surplus calculation: `surplus = max(actualOutput - minOutput, 0)`
  - Implement configurable surplus split (user/protocol/solver percentages)
  - Add `settleSurplus()` function with distribution logic
  - Emit `SurplusDistributed` event
  - Write Foundry tests for surplus split
  - Test all split ratios work correctly
  - Deploy to testnet
  - _Requirements: 27.1-27.9, 31.1-31.6_
  - _Audit: Section 2 - Intent Engine_

- [ ] 66. Implement Hunter Intent Execute Edge Function
  - Create `supabase/functions/hunter-intent-execute/index.ts`
  - Load intent with user-signed minOutput
  - Call solver network for execution
  - Submit transaction via IntentSettlement contract
  - Read actualOutput from transaction receipt
  - Compute surplus and log to `surplus_events` table
  - Update solver reputation
  - Test execution flow end-to-end
  - _Requirements: 27.1-27.9, 31.1-31.6_
  - _Audit: Section 2 - Intent Engine_

- [ ] 67. Create Surplus Events Table
  - Add `surplus_events` table to database schema (already exists, verify)
  - Ensure columns: intent_id, solver, user_address, total_surplus, user_share, protocol_share, solver_share
  - Add indexes for analytics queries
  - Create RLS policies
  - Test table operations
  - _Requirements: 31.1-31.6_
  - _Audit: Section 2 - Intent Engine_

- [ ] 68. Implement Solver Reputation System
  - Create `updateSolverReputation()` function
  - Track total_intents, avg_surplus, negative_surplus_count
  - Calculate reputation_score and selection_weight
  - Update `solver_reputation` table
  - Test reputation calculations
  - _Requirements: 31.1-31.6_
  - _Audit: Section 2 - Intent Engine_

### Mobile ZK - Native Rust Proving

- [ ] 69. Implement Server-Side ZK Proving (Phase 1)
  - Update `supabase/functions/zk-eligibility-verify/index.ts`
  - Implement server-side proof generation
  - Accept wallet inputs from mobile client
  - Generate proof using snarkjs or similar
  - Return eligibility verdict to client
  - Test proof generation performance
  - Test mobile client integration
  - _Requirements: 29.1-29.8_
  - _Audit: Section 3 - Mobile ZK_

- [ ] 70. Research Mopro Integration (Phase 2)
  - Research Mopro library for native mobile proving
  - Evaluate iOS Swift ↔ Rust FFI
  - Evaluate Android Kotlin ↔ Rust FFI
  - Test Groth16 circuit performance on mobile
  - Document integration approach
  - Create proof-of-concept
  - _Requirements: 29.1-29.8_
  - _Audit: Section 3 - Mobile ZK_

- [ ] 71. Implement Native Mobile ZK (Phase 2+)
  - Integrate Mopro into mobile app
  - Implement Rust prover with FFI bindings
  - Use Groth16 for small proof size
  - Implement proof generation on device
  - Add fallback to server-side proving
  - Test on-device proving performance
  - Test battery impact
  - _Requirements: 29.1-29.8_
  - _Audit: Section 3 - Mobile ZK_

### Paymaster - Volatility Guardrails

- [ ] 72. Implement AlphaWhale Paymaster Smart Contract
  - Create `contracts/AlphaWhalePaymaster.sol`
  - Implement ERC-4337 Paymaster interface
  - Add oracle price reading with staleness check
  - Implement risk premium (configurable, default 12%)
  - Add panic mode with gas threshold
  - Implement `validatePaymasterUserOp()` with all checks
  - Write Foundry tests for all scenarios
  - Test oracle staleness rejection
  - Test panic mode activation
  - Deploy to testnet
  - _Requirements: 32.1-32.8_
  - _Audit: Section 4 - Paymaster_

- [ ] 73. Implement Paymaster Orchestrator Edge Function
  - Create `supabase/functions/paymaster-orchestrator/index.ts`
  - Read on-chain oracle price
  - Cross-check with off-chain price feed
  - Calculate deviation and apply risk premium
  - Check current gas price against threshold
  - Set panicMode flag if needed
  - Return quote with tokenGasAmount
  - Test quote calculation
  - Test panic mode detection
  - _Requirements: 32.1-32.8_
  - _Audit: Section 4 - Paymaster_

- [ ] 74. Integrate Paymaster with Intent Execution
  - Update intent execution flow to use Paymaster
  - Add gas abstraction option for users
  - Handle Paymaster rejections gracefully
  - Test gas payment in tokens
  - Test fallback to native gas
  - _Requirements: 32.1-32.8_
  - _Audit: Section 4 - Paymaster_

### EigenLayer / AVS - Phased Adoption

- [ ] 75. Implement Phase 1 - Whitelist Solvers
  - Create `solver_allowlist` table
  - Implement admin interface for managing allowlist
  - Add allowlist check in intent execution
  - Implement simple reputation scoring
  - Test allowlist enforcement
  - _Requirements: 31.1-31.6_
  - _Audit: Section 5 - EigenLayer_

- [ ] 76. Design Phase 2 - Optimistic Bonds
  - Design on-chain bond system
  - Design challenge period mechanism
  - Design Security Council multisig for disputes
  - Document bond amounts and slashing conditions
  - Create implementation plan
  - _Requirements: 31.1-31.6_
  - _Audit: Section 5 - EigenLayer_

- [ ] 77. Research Phase 3 - AVS Integration
  - Research EigenLayer AVS architecture
  - Evaluate restaking requirements
  - Design programmable slashing conditions
  - Design decentralized operator set
  - Document integration approach
  - Create implementation roadmap
  - _Requirements: 31.1-31.6_
  - _Audit: Section 5 - EigenLayer_

### Audit Compliance & Testing

- [ ] 78. Write Audit Compliance Tests
  - Test Sentinel uses Queue–Worker pattern (no monolithic polling)
  - Test Worker handles only 1-5 contracts per run
  - Test Surplus split happens at contract level
  - Test Edge Functions don't bypass on-chain surplus split
  - Test Mobile ZK uses server-side or native proving (no heavy JS)
  - Test Paymaster has risk premium and panic mode
  - Test AVS references are Phase 3 only
  - Document test results
  - _Audit: All Sections_

- [ ] 79. Create Audit Compliance Checklist
  - Create checklist based on ARCHITECTURE_AUDIT_V1.md
  - Verify all patterns are implemented correctly
  - Document any deviations with justification
  - Get sign-off from tech lead
  - _Audit: All Sections_

- [ ] 80. Update Documentation for Audit Compliance
  - Document Sentinel Queue–Worker architecture
  - Document Intent surplus sharing mechanism
  - Document Mobile ZK proving strategy
  - Document Paymaster volatility protection
  - Document EigenLayer phased adoption plan
  - Update README.md with audit compliance status
  - _Audit: All Sections_

---

**Architecture Audit Tasks Summary:**
- **New Tasks**: 22 tasks (59-80)
- **Estimated Effort**: 8-12 weeks (2-3 developers)
- **Priority**: CRITICAL (A++++ Production Standards)
- **Phase**: Post-v1 Launch (v2 Features)
- **Dependencies**: v1 Hunter Screen complete

**Audit Compliance Milestones:**

### 🔜 Milestone A1: Sentinel Queue–Worker (Weeks 1-3)
**Tasks:** 59-64  
**Outcome:** Sentinel monitoring uses queue-worker pattern with hot/warm/cold tiers

### 🔜 Milestone A2: Intent Surplus Sharing (Weeks 4-6)
**Tasks:** 65-68  
**Outcome:** On-chain surplus split with solver reputation system

### 🔜 Milestone A3: Mobile ZK & Paymaster (Weeks 7-9)
**Tasks:** 69-74  
**Outcome:** Server-side ZK proving and Paymaster with volatility protection

### 🔜 Milestone A4: EigenLayer Phases (Weeks 10-12)
**Tasks:** 75-77  
**Outcome:** Phase 1 whitelist implemented, Phase 2/3 designed

### 🔜 Milestone A5: Audit Compliance (Week 12)
**Tasks:** 78-80  
**Outcome:** All audit patterns verified and documented

---

**Total Tasks:** 80 (58 original + 22 audit tasks)  
**Completed:** 56 tasks  
**Remaining:** 24 tasks (7 v1 polish + 17 v2 audit features)  
**Current Phase:** v1 Production Polish  
**Next Phase:** v2 Audit Compliance Implementation
