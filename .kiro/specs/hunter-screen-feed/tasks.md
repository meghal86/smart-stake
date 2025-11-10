# Implementation Plan: AlphaWhale Hunter Screen (Feed)

This document outlines the implementation tasks for building the Hunter Screen feature. Each task is designed to be incremental, testable, and builds upon previous tasks.

## Task List

- [x] 1. Set up database schema and migrations
  - Create opportunities table with all required columns (status, urgency, trust_score, trust_level)
  - Create guardian_scans table with relationship to opportunities
  - Create eligibility_cache table for caching eligibility calculations
  - Create user_preferences, saved_opportunities, completed_opportunities tables
  - Create analytics_events table
  - Add all required indexes including optimized partial indexes
  - Add multicolumn indexes: (status, published_at DESC), (trust_level, expires_at)
  - Create enums for opportunity_type, reward_unit, opportunity_status, urgency_type
  - _Requirements: 1.1, 2.1, 6.1, 12.1_

- [x] 2. Implement database triggers and functions
  - Create apply_latest_guardian_snapshot() trigger function
  - Create upsert_opportunity() function with source precedence logic
  - Set up RLS policies for saved_opportunities, completed_opportunities, analytics_events
  - Test trigger updates trust_score and trust_level on new Guardian scans
  - Test upsert function handles partner > internal > aggregator precedence
  - _Requirements: 2.10, 13.1, 13.2, 13.3_

- [x] 3. Create TypeScript types and Zod schemas
  - Define Opportunity interface matching database schema
  - Define OpportunityCard component props interface
  - Define FilterState interface
  - Define API response schemas (OpportunitiesResponse, ErrorResponse, GuardianSummaryResponse, EligibilityPreviewResponse)
  - Create Zod schemas for runtime validation
  - Define ErrorCode enum with all error types
  - _Requirements: 1.7, 8.14_

- [x] 4. Implement cursor pagination utilities
  - Create encodeCursor() function for base64url encoding
  - Create decodeCursor() function for parsing cursor tuples
  - Write unit tests for cursor encoding/decoding
  - Test cursor stability across multiple pages
  - _Requirements: 3.7, 7.9, 7.10_

- [x] 4a. Add snapshot watermark to cursor
  - Add snapshot_ts to cursor tuple as compact UNIX seconds int
  - Constrain queries to updated_at <= snapshot_ts for entire scroll session
  - Add hash(slug) as hidden final tiebreaker for full ties
  - Prevent duplicates/flicker when trust/expiry changes mid-scroll
  - Write mutation test: no dupes across 3 pages when data changes
  - Test cursor stays URL-safe and compact
  - _Requirements: 7.9, 7.10_

- [x] 5. Implement eligibility scoring algorithm
  - Create calculateEligibilityScore() function with weighted scoring
  - Implement chain presence check (40% weight)
  - Implement wallet age calculation (25% weight, capped at 30 days)
  - Implement transaction count scoring (20% weight, capped at 10 tx)
  - Implement holdings check (15% weight)
  - Implement allowlist proofs bonus (+5%)
  - Add label determination (likely ≥0.7, maybe 0.4-0.69, unlikely <0.4)
  - Write unit tests for all scoring scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Create Redis caching utilities
  - Set up Redis client with Upstash or Vercel KV
  - Implement RedisKeys namespace functions
  - Create cache get/set helpers with TTL
  - Implement cache invalidation utilities
  - Test cache operations with different key types
  - _Requirements: 8.7, 8.8, 8.9_

- [x] 7. Implement rate limiting middleware
  - Set up Upstash Ratelimit with sliding window
  - Create checkRateLimit() function
  - Implement different limits for auth vs anon users (120/hr vs 60/hr)
  - Add burst allowance (10 req/10s)
  - Handle rate limit errors with Retry-After header
  - Write tests for rate limit enforcement
  - _Requirements: 4.13, 4.14, 4.15, 8.6, 8.11_

- [x] 8. Implement content sanitization utilities
  - Set up DOMPurify with JSDOM for server-side sanitization
  - Create sanitizeHtml() function with allowed tags/attributes
  - Create createSafeLink() function for redirector
  - Test sanitization removes dangerous content
  - Test safe links are properly encoded
  - _Requirements: 5.20, 5.21, 11.2_

- [x] 9. Create feed query service
  - Implement getFeedPage() function with cursor-based pagination
  - Build SQL query with proper ORDER BY (rank_score DESC, trust_score DESC, expires_at ASC, id ASC)
  - Implement filter application (type, chains, trust_min, urgency, difficulty)
  - Implement search functionality with debouncing
  - Add sponsored item capping (≤2 per fold)
  - Test query performance with indexes
  - Test deduplication across pages
  - _Requirements: 3.7, 4.1-4.12, 4.16, 4.19, 7.9_

- [x] 9a. Create ranking materialized view
  - Create mv_opportunity_rank materialized view
  - Compute rank_score = relevance(60%) + trust(25%) + freshness/urgency(15%)
  - Store individual components (relevance, trust_weighted, freshness_weighted) for observability
  - Seed basic trending_score from impressions/CTR or static seed for cold start
  - Add fallback: if trending_score missing, use trust_score DESC, published_at DESC
  - Set up concurrent refresh every 2-5 minutes
  - Update feed queries to read from mv_opportunity_rank
  - Add WHERE (expires_at IS NULL OR expires_at > now()) to prevent expired items
  - Test P95 < 200ms on 100k rows
  - _Requirements: 3.1-3.6_

- [x] 9c. Add rank observability and debug view
  - Create vw_opportunity_rank_debug exposing weights + final score (✅ Already created in 9a)
  - Store relevance, trust_weighted, freshness_weighted as columns (✅ Already done)
  - Enable A/B analysis of ranking components (✅ Already done)
  - Test debug view is accessible
  - Document debug view usage for A/B testing
  - _Requirements: 3.1-3.6_

- [x] 16a. Integrate existing UI with ranking API
  - Update OpportunityGrid to call getFeedPage() with ranking
  - Verify opportunities display in ranked order
  - Test filters work with materialized view
  - Verify cursor pagination maintains ranking order
  - Test infinite scroll with ranked data
  - Verify sponsored capping works correctly
  - Test all sort options use rank_score appropriately
  - _Requirements: 3.1-3.7, 7.3-7.10_

- [x] 9b. Enforce sponsored window filter server-side
  - Implement "≤2 sponsored per any contiguous 12 cards" in server result set
  - Keep sliding counter across pages (stateful per request)
  - Ensure deterministic behavior across all viewport sizes
  - Write E2E test asserting compliance across folds and window sizes
  - Test at various grid densities (mobile/tablet/desktop)
  - Test partial folds (e.g., 7 items on short viewports)
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

- [ ] 27. Implement save/share/report functionality
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

- [ ] 28. Create Guardian staleness cron job
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

- [ ] 29. Implement feature flags
  - Set up feature flag service (Vercel Edge Config or LaunchDarkly)
  - Create flags for ranking model, eligibility preview, sponsored placement
  - Implement gradual rollout percentages
  - Test flags can be toggled without deployment
  - Test rollout percentages work correctly
  - _Requirements: 16.1-16.5_

- [ ] 30. Create test fixtures endpoint
  - Implement ?mode=fixtures query parameter
  - Return deterministic dataset with all opportunity types
  - Include edge cases (Red trust, geo-gated, expired, zero-reward, sponsored, duplicates)
  - Test fixtures are consistent across calls
  - _Requirements: 15.1-15.4_

- [ ] 31. Write unit tests
  - Test cursor encoding/decoding
  - Test eligibility scoring algorithm
  - Test content sanitization
  - Test rate limiting logic
  - Test filter state management
  - Achieve >80% code coverage
  - _Requirements: All_

- [ ] 32. Write integration tests
  - Test API endpoints return correct data
  - Test database queries with real data
  - Test Guardian integration
  - Test eligibility preview service
  - Test caching behavior
  - _Requirements: All_

- [ ] 33. Write E2E tests with Playwright
  - Test feed loading and pagination
  - Test filter application and persistence
  - Test sponsored cap per fold
  - Test Red consent gate
  - Test no duplicates across pages
  - Test card interactions (save, share, report)
  - Test accessibility compliance (keyboard nav, screen readers, aria-labels)
  - Test mobile responsive behavior
  - _Requirements: All_

- [ ] 34. Performance optimization
  - Implement code splitting for heavy components
  - Add image optimization with Next.js Image
  - Implement React.memo for expensive components
  - Add virtual scrolling if needed
  - Optimize database queries
  - Set up CDN caching rules
  - Test FCP < 1.0s on warm cache
  - Test FCP < 1.6s on cold cache
  - Test API P95 < 200ms
  - Test interaction < 150ms
  - _Requirements: 1.1-1.6_

- [ ] 34a. Set up synthetic smoke tests
  - Create uptime check hitting /api/hunter/opportunities?mode=fixtures
  - Deploy from 3 regions (US, EU, APAC)
  - Alert on failures or latency spikes
  - Test synthetic checks run on schedule
  - _Requirements: 14.1-14.6_

- [ ] 35. Set up monitoring and alerting
  - Configure performance monitoring (Vercel Analytics or similar)
  - Set up error tracking (Sentry)
  - Create dashboards for golden signals (latency, traffic, errors, saturation)
  - Configure alerts for SLO breaches (API p95 >200ms, error rate >1%, FE TTI >2s)
  - Set up auto-incident creation on alert
  - Test alerts fire correctly
  - _Requirements: 14.1-14.6_

- [ ] 35a. Create golden signals dashboard JSON
  - Export Grafana (or equivalent) dashboard JSON
  - Include panels for latency, error rate, saturation
  - Check into repository for version control
  - Document dashboard setup process
  - _Requirements: 14.5_

- [ ] 35b. Add rank drift and cache SLO alerts
  - Alert when %items_with_rank_score_null > 0.5%
  - Alert when average rank_score swings >25% day-over-day
  - Emit cache hit/miss metrics with tags {layer=edge|redis|client}
  - Set budget: miss_rate_edge < 35% for anon feed
  - Create dashboards for cache health
  - Test alerts fire on anomalies
  - _Requirements: 14.1-14.6_

- [ ] 36. Accessibility audit and fixes
  - Run axe-core accessibility tests
  - Verify AA contrast standards for green/amber/red chips on light and dark backgrounds
  - Test keyboard navigation flow
  - Verify all interactive elements have aria-labels
  - Test with screen reader (NVDA or JAWS)
  - Ensure tooltips are keyboard accessible
  - Test ESC key dismisses modals/tooltips
  - Verify focus management
  - Add Playwright test: open Red-consent modal, tab through, ensure focus returns to trigger
  - Respect prefers-reduced-motion for countdowns/badges
  - _Requirements: 9.1-9.12_

- [ ] 37. Security audit
  - Verify CSP headers are correct
  - Test content sanitization prevents XSS
  - Verify rate limiting works
  - Test RLS policies prevent unauthorized access
  - Verify external links use safe redirector
  - Test auto-quarantine on reports
  - Run security scan (npm audit, Snyk)
  - _Requirements: 11.1-11.11_

- [ ] 37a. Create incident runbook and on-call setup
  - Write incident runbook markdown with common scenarios
  - Document quarantine workflow
  - Set up pager route for SLO breaches
  - Define escalation policy
  - Test runbook is accessible and clear
  - _Requirements: 14.4_

- [ ] 37b. Write RLS regression tests
  - Create integration tests attempting forbidden reads
  - Test unauthorized writes are blocked
  - Verify service role can bypass RLS
  - Test user can only access own data
  - _Requirements: 11.1-11.11_

- [ ] 37c. Harden link redirector against open-redirect
  - Add signed, short-lived tokens to /r?u=… URLs
  - Deny bare external links in UI
  - Validate destination against allowlist
  - Set token expiry (e.g., 1 hour)
  - Test redirector rejects unsigned/expired links
  - _Requirements: 5.19, 11.1_

- [ ] 38. Documentation
  - Write API documentation
  - Create component documentation with Storybook
  - Document database schema
  - Write deployment guide
  - Create troubleshooting guide
  - Document feature flags
  - _Requirements: All_

- [ ] 38a. Define data retention policy
  - Set analytics raw events TTL (180 days)
  - Set eligibility_cache TTL (60 minutes)
  - Keep guardian_scans indefinitely but compressible
  - Document retention policy
  - Implement automated cleanup jobs
  - _Requirements: 10.12-10.14_

- [ ] 38b. Implement DNT and consent hard gate
  - Check for DNT (Do Not Track) header
  - Check for consent=false in user preferences
  - Fully disable analytics if DNT=true or consent=false
  - Prevent any analytics network calls
  - Add CI smoke test: regex scan artifacts for wallet_address in analytics payloads
  - Test analytics respects consent
  - _Requirements: 10.12-10.14_

- [ ] 38c. Create data retention cleanup jobs
  - Implement cron SQL: DELETE FROM analytics_events WHERE created_at < now()-interval '180 days'
  - Process in 10k row batches to avoid locks
  - Add ANALYZE after big syncs
  - Bump autovacuum scale factor for opportunities table
  - Test cleanup jobs run on schedule
  - _Requirements: 10.12-10.14_

- [ ] 39. Deployment preparation
  - Run all tests (unit, integration, E2E)
  - Check Lighthouse scores
  - Verify database migrations
  - Test feature flags
  - Review security headers
  - Check rate limiting configuration
  - Verify CDN cache configuration
  - Test error handling and fallbacks
  - Validate analytics events
  - Review monitoring dashboards
  - Require X-Client-Version in prod only (allow in staging)
  - _Requirements: All_

- [ ] 40. Production deployment
  - Deploy database migrations
  - Deploy API endpoints
  - Deploy frontend application
  - Configure CDN
  - Set up cron jobs
  - Enable monitoring
  - Test production environment
  - Monitor for errors
  - _Requirements: All_

---

**Total Tasks:** 56 (40 original + 16 enhancements)  
**Estimated Timeline:** 8-10 weeks (2 developers)  
**Priority:** High (Core feature)

## Critical Path & Milestones

### Milestone M0: API Skeleton (Days 1-3)
**Tasks:** 1, 2, 3, 7, 8, 12 (fixtures mode only), 15, 15a, 30  
**Outcome:** API skeleton with security headers and deterministic fixtures

### Milestone M1: Anonymous Feed (Days 4-7)
**Tasks:** 4, 4a, 9, 9a, 9b, 22 (grid with fixtures), 16 (card basics), 18 (filters basics), 20 (tabs), 34 (basic perf checks)  
**Outcome:** Anonymous feed works with fixtures, stable scroll & sponsored cap, sub-1.6s FCP cold

### Milestone M2: Live Data Integration (Days 8-12)
**Tasks:** 10, 11, 11a, 12 (real data), 12a, 12b, 28, 26 (analytics with consent), 35, 35a  
**Outcome:** Live trust + eligibility; monitoring/alerts on

### Milestone M3: Production Ready (Days 13-14)
**Tasks:** 33 (E2E), 36 (A11y AA), 37, 37a, 37b, 38, 38a, 38b, 39  
**Outcome:** Ship-ready v1

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