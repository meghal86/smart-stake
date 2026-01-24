# Implementation Plan: Hunter Demand-Side (All 7 Modules)

## Overview

Complete implementation of all 7 Hunter opportunity modules with wallet-aware personalization, eligibility evaluation, and multi-factor ranking. This plan builds on the existing Hunter screen with minimal UI changes.

**Critical Implementation Rules:**
1. Use `source_ref` (not `source_id`) for external API references
2. Wallet age via Alchemy Transfers API only (not first_tx_block via RPC)
3. Clamp all scores (relevance, freshness, overall) between 0 and 1
4. Single endpoint `/api/hunter/opportunities?type=...&walletAddress=...` (module endpoints are optional wrappers)
5. Add RWA/Strategies tabs + Referrals in Settings + eligibility badges
6. Preselect candidates by hybrid score before computing eligibility
7. Referral activation = first `user_opportunities.status = 'completed'`
8. Strategy trust stored as `trust_score_cached` + `steps_trust_breakdown`

**Modules:**
1. Yield/Staking (DeFiLlama - REAL data)
2. Airdrops (Admin-seeded initially)
3. Quests (Admin-seeded initially)
4. Points/Loyalty (Admin-seeded)
5. RWA Vaults (Admin-seeded)
6. Strategies (Creator Plays)
7. Referrals (Internal system)

## Tasks

- [ ] 1. Phase 0: Shared Foundations
  - Create shared database schema extensions
  - Implement core personalization services
  - Set up cost control mechanisms
  - _Requirements: 3.1-3.7, 4.1-4.6, 5.1-5.11, 6.1-6.10_

- [ ] 1.1 Create shared database migration
  - Add source (text) column to opportunities table
  - Add source_ref (text) column to opportunities table
  - Add last_synced_at column to opportunities table
  - Add unique constraint on (source, source_ref)
  - Extend eligibility_cache with eligibility_status, eligibility_score columns
  - Create composite index on eligibility_cache (wallet_address, opportunity_id)
  - Create user_history view for relevance scoring
  - _Requirements: 3.1-3.7_

- [ ] 1.2 Write property test for database schema
  - **Property 21: Opportunity Serialization Round Trip**
  - **Validates: Requirements 12.5**

- [ ] 1.3 Implement Wallet Signals Service
  - Create src/lib/hunter/wallet-signals.ts
  - Implement address validation (0x + 40 hex chars)
  - Implement RPC calls to Alchemy for tx count and balance (if ALCHEMY_ETH_RPC_URL configured)
  - Implement Alchemy Transfers API call for wallet age (if ALCHEMY_TRANSFERS_API_KEY configured)
  - Implement graceful degradation (null signals if no RPC/Transfers API)
  - Do NOT attempt first_tx_block via plain RPC - return null for wallet_age_days if no Transfers API
  - Implement in-memory LRU cache (5min TTL)
  - _Requirements: 4.1-4.8_

- [ ] 1.4 Write property tests for Wallet Signals Service
  - **Property 10: Wallet Address Validation**
  - **Property 11: Wallet Signals Caching**
  - **Validates: Requirements 4.1, 4.4, 4.5**

- [ ] 1.5 Implement Eligibility Engine
  - Create src/lib/hunter/eligibility-engine.ts
  - Implement requirements parsing from JSONB
  - Implement eligibility scoring logic
  - Implement status mapping (likely/maybe/unlikely)
  - Implement reasons generation (2-5 reasons)
  - Implement database caching (24h TTL)
  - _Requirements: 5.1-5.11_

- [ ] 1.6 Write property tests for Eligibility Engine
  - **Property 12: Empty Requirements Default Eligibility**
  - **Property 13: Eligibility Score to Status Mapping**
  - **Property 14: Eligibility Reasons Count**
  - **Validates: Requirements 5.1, 5.7-5.10**

- [ ] 1.7 Implement Ranking Engine
  - Create src/lib/hunter/ranking-engine.ts
  - Implement relevance calculation (chain match, eligibility, tags, type)
  - Clamp relevance score between 0 and 1
  - Implement freshness calculation (urgency + recency)
  - Clamp freshness score between 0 and 1
  - Implement overall score formula (0.60 relevance + 0.25 trust + 0.15 freshness)
  - Clamp overall score between 0 and 1
  - _Requirements: 6.1-6.13_

- [ ] 1.8 Write property tests for Ranking Engine
  - **Property 15: Ranking Formula Correctness**
  - **Property 16: Relevance Calculation Correctness**
  - **Property 17: Freshness Calculation Correctness**
  - **Validates: Requirements 6.1-6.9**

- [ ] 1.9 Enhance existing API route with personalization
  - Modify src/app/api/hunter/opportunities/route.ts
  - Add walletAddress parameter handling
  - Integrate Wallet Signals Service
  - Preselect top 100 candidates by hybrid score: (trust_score * 0.7 + recency_boost * 0.3)
  - Integrate Eligibility Engine (top 50 of preselected candidates)
  - Integrate Ranking Engine
  - Sort by ranking.overall DESC when personalized
  - Maintain backward compatibility (no walletAddress = existing behavior)
  - _Requirements: 1.1-1.7, 7.1-7.5, 11.1-11.3_

- [ ] 1.10 Write property tests for API route personalization
  - **Property 1: Wallet Signals Computation for All Addresses**
  - **Property 2: Eligibility Evaluation Completeness**
  - **Property 3: Ranking Follows Eligibility**
  - **Property 4: Ranked Opportunities Sorted Descending**
  - **Property 5: Backward Compatibility Without Wallet**
  - **Property 6: Eligibility Preview Presence**
  - **Property 7: Ranking Object Presence**
  - **Property 20: Top 50 Eligibility Limit**
  - **Validates: Requirements 1.1-1.7, 11.2, 11.3**

- [ ] 2. Checkpoint - Ensure shared foundations work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Module 1: Yield/Staking (DeFiLlama - REAL Data)
  - Implement DeFiLlama sync job with real API integration
  - Create yield-specific database columns
  - Implement yield API endpoints
  - _Requirements: 2.1, 2.5-2.8, 10.1-10.8_

- [ ] 3.1 Create DeFiLlama sync service
  - Create src/lib/hunter/sync/defillama.ts
  - Implement fetchPools() from DeFiLlama API
  - Implement filterPools() (apy > 0, tvlUsd > 100k, supported chains)
  - Implement transformToOpportunities() (map to opportunities schema)
  - Implement upsertOpportunities() (dedupe by source + source_ref)
  - Implement response caching (30min TTL)
  - _Requirements: 2.1, 2.5, 2.6, 10.4_

- [ ] 3.2 Write property tests for DeFiLlama sync
  - **Property 8: Sync Job Idempotence**
  - **Property 18: DeFiLlama Response Caching**
  - **Validates: Requirements 2.5, 10.4**

- [ ] 3.3 Create yield sync API route
  - Create src/app/api/sync/yield/route.ts
  - Implement CRON_SECRET validation
  - Call syncYieldOpportunities()
  - Return SyncResult (count, source, duration_ms, errors)
  - _Requirements: 2.1, 2.7, 2.8_

- [ ] 3.4 Write property test for sync authorization
  - **Property 9: Sync Job Authorization**
  - **Validates: Requirements 2.8**

- [ ] 3.5 Add yield-specific database columns
  - Migration: Add apy, tvl_usd, underlying_assets, lockup_days to opportunities
  - Create user_yield_positions table (optional for v1)
  - _Requirements: 3.1-3.7_

- [ ] 3.6 Create Vercel cron configuration
  - Add to vercel.json: POST /api/sync/yield every 2 hours
  - Include CRON_SECRET in cron job requests
  - _Requirements: 8.1-8.5_

- [ ] 3.7 Write integration test for yield sync end-to-end
  - Test: Sync job fetches DeFiLlama data and upserts to database
  - Test: Running sync twice doesn't create duplicates
  - Test: Sync completes within 30 seconds for 100 protocols
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 4. Module 2: Airdrops (Admin-Seeded)
  - Create airdrop-specific schema
  - Implement admin seeding mechanism
  - Create airdrop sync stub
  - _Requirements: 2.2_

- [ ] 4.1 Create airdrop database schema
  - Migration: Add snapshot_date, claim_start, claim_end, airdrop_category to opportunities
  - Create user_airdrop_status table (eligible/maybe/unlikely/claimed/missed/expired)
  - _Requirements: 3.1-3.7_

- [ ] 4.2 Create admin seed script
  - Create scripts/seed-airdrops.ts
  - Seed 10+ airdrop opportunities with realistic data
  - Include requirements (chains, min_wallet_age, min_tx_count)
  - _Requirements: 2.2_

- [ ] 4.3 Create airdrop sync API route (stub)
  - Create src/app/api/sync/airdrops/route.ts
  - Return stub response: {count: 0, source: "stub", message: "Admin seeding required"}
  - Implement CRON_SECRET validation
  - _Requirements: 2.2, 2.8_

- [ ] 4.4 Add airdrop-specific API endpoints
  - Create GET /api/hunter/airdrops?wallet= (filter type='airdrop')
  - Create GET /api/hunter/airdrops/history?wallet= (user_airdrop_status)
  - _Requirements: 1.1-1.7_

- [ ] 4.5 Write unit tests for airdrop eligibility
  - Test: Claim window logic (before/during/after)
  - Test: Snapshot date eligibility
  - _Requirements: 5.1-5.11_

- [ ] 5. Module 3: Quests (Admin-Seeded)
  - Create quest-specific schema
  - Implement admin seeding mechanism
  - Create quest sync stub
  - _Requirements: 2.3_

- [ ] 5.1 Create quest database schema
  - Migration: Add quest_steps, quest_difficulty, xp_reward, quest_type to opportunities
  - Create user_quest_progress table
  - _Requirements: 3.1-3.7_

- [ ] 5.2 Create admin seed script
  - Create scripts/seed-quests.ts
  - Seed 10+ quest opportunities with realistic data
  - Include multi-step quests with progress tracking
  - _Requirements: 2.3_

- [ ] 5.3 Create quest sync API route (stub)
  - Create src/app/api/sync/quests/route.ts
  - Return stub response: {count: 0, source: "stub", message: "Admin seeding required"}
  - Implement CRON_SECRET validation
  - _Requirements: 2.3, 2.8_

- [ ] 5.4 Add quest-specific API endpoints
  - Create GET /api/hunter/quests?wallet= (filter type='quest')
  - Create POST /api/hunter/quests/progress (manual progress marking)
  - _Requirements: 1.1-1.7_

- [ ] 5.5 Write unit tests for quest progress tracking
  - Test: Multi-step quest completion logic
  - Test: XP reward calculation
  - _Requirements: 5.1-5.11_

- [ ] 6. Module 4: Points/Loyalty (Admin-Seeded)
  - Create points-specific schema
  - Implement admin seeding mechanism
  - Create points sync stub
  - _Requirements: 2.4_

- [ ] 6.1 Create points database schema
  - Migration: Add points_program_name, conversion_hint, points_estimate_formula to opportunities
  - Create user_points_status table
  - _Requirements: 3.1-3.7_

- [ ] 6.2 Create admin seed script
  - Create scripts/seed-points.ts
  - Seed 10+ points/loyalty programs with realistic data
  - Include conversion hints (e.g., "1000 points ≈ $10 airdrop")
  - _Requirements: 2.4_

- [ ] 6.3 Create points sync API route (stub)
  - Create src/app/api/sync/points/route.ts
  - Return stub response: {count: 0, source: "stub", message: "Admin seeding required"}
  - Implement CRON_SECRET validation
  - _Requirements: 2.4, 2.8_

- [ ] 6.4 Add points-specific API endpoints
  - Create GET /api/hunter/points?wallet= (filter type='points')
  - _Requirements: 1.1-1.7_

- [ ] 6.5 Write unit tests for points eligibility
  - Test: Points program eligibility based on wallet activity
  - Test: Conversion hint display logic
  - _Requirements: 5.1-5.11_

- [ ] 7. Checkpoint - Ensure all opportunity types work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Module 5: RWA Vaults (Admin-Seeded)
  - Create RWA-specific schema
  - Implement admin seeding mechanism
  - Create RWA sync stub
  - _Requirements: 2.4_

- [ ] 8.1 Create RWA database schema
  - Migration: Add issuer_name, jurisdiction, kyc_required, min_investment, liquidity_term_days, rwa_type to opportunities
  - Create user_rwa_positions table
  - _Requirements: 3.1-3.7_

- [ ] 8.2 Create admin seed script
  - Create scripts/seed-rwa.ts
  - Seed 10+ RWA vault opportunities with realistic data
  - Include KYC requirements and jurisdiction info
  - _Requirements: 2.4_

- [ ] 8.3 Create RWA sync API route (stub)
  - Create src/app/api/sync/rwa/route.ts
  - Return stub response: {count: 0, source: "stub", message: "Admin seeding required"}
  - Implement CRON_SECRET validation
  - _Requirements: 2.4, 2.8_

- [ ] 8.4 Add RWA-specific API endpoints
  - Create GET /api/hunter/rwa?wallet= (filter type='rwa')
  - _Requirements: 1.1-1.7_

- [ ] 8.5 Write unit tests for RWA eligibility
  - Test: KYC requirement checking
  - Test: Minimum investment eligibility
  - Test: Jurisdiction restrictions
  - _Requirements: 5.1-5.11_

- [ ] 9. Module 6: Strategies (Creator Plays)
  - Create strategies schema
  - Implement strategy creation and subscription
  - Link strategies to opportunities
  - _Requirements: 1.1-1.7_

- [ ] 9.1 Create strategies database schema
  - Create strategies table (id, title, description, creator_id, steps, trust_score_cached, steps_trust_breakdown)
  - Create strategy_subscriptions table (user_id, strategy_id, subscribed_at)
  - strategies.steps references opportunity IDs (JSONB array)
  - strategies.trust_score_cached stores computed trust score
  - strategies.steps_trust_breakdown stores per-step trust scores (JSONB array)
  - _Requirements: 3.1-3.7, 18.1-18.4_

- [ ] 9.2 Add strategy API endpoints
  - Create GET /api/hunter/strategies (list all strategies)
  - Return both trust_score_cached and steps_trust_breakdown for each strategy
  - Create POST /api/hunter/strategies/subscribe (subscribe to strategy)
  - Create POST /api/hunter/strategies (admin/creator only - create strategy)
  - On strategy create/update: compute trust_score_cached by aggregating Guardian scores
  - On strategy create/update: store steps_trust_breakdown as JSONB array
  - _Requirements: 1.1-1.7, 18.1-18.10_

- [ ] 9.3 Create admin seed script
  - Create scripts/seed-strategies.ts
  - Seed 5+ strategies linking to existing opportunities
  - Include multi-step strategies (e.g., "Airdrop Farming 101")
  - _Requirements: 2.4_

- [ ] 9.4 Write unit tests for strategy logic
  - Test: Strategy step ordering
  - Test: Subscription tracking
  - Test: Trust score computation (aggregation across steps)
  - Test: Trust score caching and recomputation on update
  - Test: steps_trust_breakdown format and content
  - _Requirements: 5.1-5.11, 18.1-18.10_

- [ ] 10. Module 7: Referrals (Internal System)
  - Create referrals schema
  - Implement referral code generation
  - Implement referral tracking and rewards
  - _Requirements: 1.1-1.7_

- [ ] 10.1 Create referrals database schema
  - Create referral_profiles table (user_id, referral_code, total_referrals, total_rewards)
  - Create referrals table (referrer_id, referred_user_id, activated_at, reward_amount)
  - Create referral_rewards table (referral_id, reward_type, reward_amount, claimed_at)
  - _Requirements: 3.1-3.7_

- [ ] 10.2 Add referral API endpoints
  - Create POST /api/referrals/create-code (generate unique code)
  - Create POST /api/referrals/claim?code= (claim referral)
  - Create GET /api/referrals/dashboard (user's referral stats)
  - _Requirements: 1.1-1.7_

- [ ] 10.3 Implement referral activation logic
  - Trigger: Referred user completes first tracked action (user_opportunities.status = 'completed')
  - Update referrals.activated_at timestamp
  - Credit reward to referrer
  - _Requirements: 5.1-5.11, 19.5-19.6_

- [ ] 10.4 Write unit tests for referral logic
  - Test: Unique code generation
  - Test: Activation trigger logic
  - Test: Reward calculation and crediting
  - _Requirements: 5.1-5.11_

- [ ] 11. Checkpoint - Ensure all 7 modules work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration and Analytics
  - Wire all modules together
  - Add analytics tracking
  - Implement cost monitoring
  - _Requirements: 10.1-10.8, 11.1-11.7_

- [ ] 12.1 Add analytics tracking
  - Track feed personalization events (wallet connected, eligibility computed)
  - Track module-specific events (airdrop viewed, quest started, yield position opened)
  - Track sync job metrics (duration, count, errors)
  - _Requirements: 10.8_

- [ ] 12.2 Implement cost monitoring
  - Log all third-party API calls with duration and status
  - Track RPC call counts per wallet per day
  - Alert when API call duration exceeds 2 seconds
  - _Requirements: 10.7, 10.8, 11.6_

- [ ] 12.3 Add error recovery mechanisms
  - Implement exponential backoff for failed API calls (1s, 2s, 4s, 8s)
  - Return cached/stale data when API calls fail after 3 retries
  - Log all errors to monitoring service
  - _Requirements: 11.5, 11.7_

- [ ] 12.4 Write integration tests for complete flow
  - Test: Demo mode → Live mode transition
  - Test: Wallet connect → Personalized feed
  - Test: All 7 modules show in tabs
  - Test: Eligibility and ranking work across all modules
  - _Requirements: 9.1-9.6_

- [ ] 13. E2E Testing
  - Test all 7 modules with Playwright
  - Test wallet switching and personalization
  - Test demo vs live mode
  - _Requirements: 9.1-9.6_

- [ ] 13.1 Write E2E test for Yield module
  - Test: Yield tab loads with DeFiLlama data
  - Test: Eligibility badges show for connected wallet
  - Test: Ranking changes based on wallet characteristics
  - _Requirements: 9.1-9.6_

- [ ] 13.2 Write E2E test for Airdrops module
  - Test: Airdrops tab loads with admin-seeded data
  - Test: Claim window countdown displays correctly
  - Test: Eligibility status shows (Likely/Maybe/Unlikely)
  - _Requirements: 9.1-9.6_

- [ ] 13.3 Write E2E test for Quests module
  - Test: Quests tab loads with admin-seeded data
  - Test: Quest progress tracking works
  - Test: Multi-step quests display correctly
  - _Requirements: 9.1-9.6_

- [ ] 13.4 Write E2E test for Points module
  - Test: Points tab loads with admin-seeded data
  - Test: Points programs show eligibility based on wallet activity
  - Test: Conversion hints display correctly
  - _Requirements: 9.1-9.6_

- [ ] 13.5 Write E2E test for RWA module
  - Test: RWA tab loads with admin-seeded data
  - Test: KYC requirements display correctly
  - Test: Minimum investment eligibility shows
  - _Requirements: 9.1-9.6_

- [ ] 13.6 Write E2E test for Strategies module
  - Test: Strategies tab loads with admin-seeded data
  - Test: Strategy detail shows ordered steps
  - Test: Guardian trust score aggregation displays
  - _Requirements: 9.1-9.6_

- [ ] 13.7 Write E2E test for Referrals module
  - Test: Referral dashboard loads
  - Test: Referral code generation works
  - Test: Referral tracking and rewards display
  - _Requirements: 9.1-9.6_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (21 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- E2E tests validate all 7 modules in the browser

## Definition of Done (Per Module)

For each of the 7 modules:
- ✅ Appears as a Hunter tab/section
- ✅ Has at least 10 seeded items (admin seed ok)
- ✅ Live wallet shows eligibility status on cards
- ✅ Ranking puts "best fit" items first
- ✅ Has "My …" state (even if empty)
- ✅ Logs analytics events (view/click/save/cta)
- ✅ Has E2E test for the tab + 1 card action

## Fastest Path (Recommended Order)

1. **Yield** (DeFiLlama real data) - Highest value, real API
2. **Airdrops + Quests** (Admin seed) - Core Hunter experience
3. **Points** (Admin seed) - Future airdrop farming
4. **RWA** (Curated) - Trust-heavy, differentiated
5. **Strategies** (Bundles) - Retention driver
6. **Referrals** (Growth loop) - Viral mechanics
