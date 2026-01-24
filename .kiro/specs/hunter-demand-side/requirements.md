# Requirements Document

## Critical Implementation Rules

**These rules MUST be followed to avoid implementation bugs:**

1. **Canonical external identity fields**: opportunities table uses `(source, source_ref)` unique constraint. Use `source_ref` (text) consistently - NOT `source_id`.
2. **Wallet age computation**: Only compute if Alchemy Transfers API or indexed endpoint exists; otherwise return `null`. Do NOT attempt "first_tx_block via RPC" - this is infeasible.
3. **Scoring clamp**: ALL scores (relevance, freshness, overall) MUST be clamped between 0 and 1.
4. **API pattern**: MVP uses **single endpoint** `/api/hunter/opportunities?type=...&walletAddress=...` with type filter. Module-specific endpoints are optional wrappers.
5. **Minimal UI allowed**: Add tabs for RWA + Strategies in Hunter; add Referrals entry in Settings; add eligibility badge display on cards.
6. **Eligibility candidate selection**: Preselect candidates by `(trust_score * 0.7 + recency_boost * 0.3)` then compute eligibility for top 50 to avoid missing high-relevance items.
7. **Referral activation**: Defined as first `user_opportunities.status = 'completed'` event for referred user.
8. **Strategy trust**: Store `strategies.trust_score_cached` as computed value; recompute on strategy create/update; return both cached score and `steps_trust_breakdown[]`.

## Introduction

The Hunter Demand-Side system completes all 7 opportunity modules with personalized, wallet-aware ranking and eligibility features. The current implementation (src/pages/Hunter.tsx, src/app/api/hunter/opportunities/route.ts) displays opportunities from the database but lacks:

1. **Wallet-based personalization** - relevance scoring based on wallet characteristics
2. **Eligibility evaluation** - Likely/Maybe/Unlikely status with reasons
3. **Multi-factor ranking** - 60% relevance + 25% trust + 15% freshness
4. **Complete module coverage** - All 7 opportunity types (Yield, Airdrops, Quests, Points, RWA, Strategies, Referrals)
5. **Sync jobs** - DeFiLlama yield integration, admin-seeded data for other modules
6. **Third-party API architecture** - Alchemy for wallet signals, cost-controlled design

**The 7 Modules:**
1. **Yield/Staking** - DeFiLlama real data (APY, TVL, protocols)
2. **Airdrops** - Admin-seeded with claim windows and eligibility
3. **Quests** - Admin-seeded with multi-step progress tracking
4. **Points/Loyalty** - Admin-seeded programs with conversion hints
5. **RWA Vaults** - Admin-seeded with KYC and jurisdiction requirements
6. **Strategies** - Creator plays linking multiple opportunities
7. **Referrals** - Internal system for viral growth

This spec defines the **complete implementation** for all 7 modules without regenerating existing code.

## Glossary

- **Hunter_Feed**: The existing opportunity discovery interface (src/pages/Hunter.tsx)
- **Opportunity**: A DeFi action stored in the opportunities table (7 types: airdrop, quest, staking, yield, points, rwa, strategy)
- **Wallet_Signals**: On-chain characteristics derived from a wallet address (age, transaction count, active chains, token holdings)
- **Eligibility_Engine**: NEW service that evaluates whether a user qualifies for an opportunity
- **Ranking_Engine**: NEW service that scores opportunities based on relevance, trust, and freshness
- **Sync_Job**: NEW scheduled task that fetches external opportunity data and updates the database
- **DeFiLlama**: Public API providing DeFi protocol yield data (no authentication required)
- **Alchemy**: RPC provider for wallet signals (requires API key per chain)
- **Live_Mode**: Existing authenticated state - needs enhancement with personalization
- **Demo_Mode**: Existing unauthenticated state - already working
- **Eligibility_Cache**: Existing table for storing computed eligibility results per wallet+opportunity
- **User_Opportunities**: Existing table tracking saved/dismissed/completed status
- **Module**: One of the 7 opportunity types (Yield, Airdrops, Quests, Points, RWA, Strategies, Referrals)
- **Admin_Seeding**: Manual data population for modules without external APIs (Airdrops, Quests, Points, RWA)
- **Creator_Play**: A strategy created by users linking multiple opportunities into a curated path

## Requirements

### Requirement 1: Enhance Existing API Route with Ranking

**User Story:** As a user, I want the existing /api/hunter/opportunities endpoint enhanced with wallet-aware ranking, so that opportunities are personalized to my profile.

#### Acceptance Criteria

1. WHEN a user requests GET /api/hunter/opportunities with walletAddress parameter, THE System SHALL compute wallet signals for that address
2. WHEN wallet signals are available, THE System SHALL evaluate eligibility for each opportunity
3. WHEN eligibility is computed, THE System SHALL calculate ranking scores (relevance, trust, freshness)
4. WHEN ranking scores are calculated, THE System SHALL sort opportunities by overall score descending
5. WHEN a user requests without walletAddress parameter, THE System SHALL return opportunities sorted by created_at descending (existing behavior)
6. THE System SHALL include eligibility_preview object in response when walletAddress is provided
7. THE System SHALL include ranking object in response when walletAddress is provided

### Requirement 2: Create Sync Jobs for External Data Integration

**User Story:** As a system administrator, I want automated sync jobs to fetch external opportunity data, so that the database stays current without manual intervention.

#### Acceptance Criteria

1. WHEN POST /api/sync/yield is invoked, THE System SHALL fetch yield opportunities from DeFiLlama and upsert them into the opportunities table
2. WHEN POST /api/sync/airdrops is invoked, THE System SHALL return a stub response with {count: 0, source: "stub", message: "Admin seeding required"}
3. WHEN POST /api/sync/quests is invoked, THE System SHALL return a stub response with {count: 0, source: "stub", message: "Admin seeding required"}
4. WHEN POST /api/sync/points is invoked, THE System SHALL return a stub response with {count: 0, source: "stub", message: "Admin seeding required"}
5. WHEN the yield sync job processes an opportunity, THE System SHALL upsert by unique constraint (source, source_ref) to prevent duplicates
6. WHEN the yield sync job runs, THE System SHALL complete within 30 seconds for up to 100 protocols
7. WHEN a sync job encounters an error, THE System SHALL log the error and return a descriptive error response without crashing
8. THE System SHALL validate CRON_SECRET header on all sync endpoints to prevent unauthorized access

### Requirement 3: Extend Database Schema for Demand-Side Features

**User Story:** As a developer, I want the existing database schema extended with demand-side columns, so that personalization data is stored efficiently.

#### Acceptance Criteria

1. THE Opportunities_Table SHALL add column source_ref (text) for external API reference
2. THE Opportunities_Table SHALL add column source (text) for external API source name
3. THE Opportunities_Table SHALL add unique constraint on (source, source_ref) if not exists
3. THE Eligibility_Cache_Table SHALL add column eligibility_status (enum: likely, maybe, unlikely)
4. THE Eligibility_Cache_Table SHALL add column eligibility_score (numeric 0-1)
5. THE Eligibility_Cache_Table SHALL rename column eligible to is_eligible for clarity
6. THE System SHALL create index on eligibility_cache (wallet_address, opportunity_id) for fast lookups
7. THE System SHALL add column last_synced_at (timestamptz) to opportunities table for tracking sync freshness

### Requirement 4: Wallet Signals Service

**User Story:** As a user, I want the system to analyze my wallet characteristics, so that opportunities are personalized to my on-chain profile.

#### Acceptance Criteria

1. WHEN a wallet address is provided, THE Wallet_Signals_Service SHALL validate the address format (0x followed by 40 hexadecimal characters)
2. WHEN ALCHEMY_TRANSFERS_API_KEY environment variable exists, THE Wallet_Signals_Service SHALL fetch wallet age via Alchemy Asset Transfers API (first seen transaction timestamp)
3. WHEN ALCHEMY_TRANSFERS_API_KEY does not exist, THE Wallet_Signals_Service SHALL return wallet_age_days as null (do NOT attempt first_tx_block via RPC - infeasible)
4. WHEN ALCHEMY_ETH_RPC_URL environment variable exists, THE Wallet_Signals_Service SHALL fetch transaction count and token holdings via Alchemy RPC
5. WHEN ALCHEMY_ETH_RPC_URL environment variable does not exist, THE Wallet_Signals_Service SHALL return wallet signals with null values for tx_count and empty arrays for chains_active and token_holdings
6. WHEN wallet signals are fetched, THE System SHALL cache results for 5 minutes using in-memory LRU cache
7. WHEN cached wallet signals exist and are less than 5 minutes old, THE System SHALL return cached data without making RPC calls
8. THE Wallet_Signals_Service SHALL return an object containing: address, wallet_age_days, tx_count_90d, chains_active, top_assets, stablecoin_usd_est

### Requirement 5: Eligibility Engine

**User Story:** As a user, I want to see whether I qualify for each opportunity, so that I can focus on opportunities I'm eligible for.

#### Acceptance Criteria

1. WHEN an opportunity has no requirements field or requirements is empty object, THE Eligibility_Engine SHALL return status "maybe" with score 0.5
2. WHEN wallet signals contain null chain data and opportunity requires specific chains, THE Eligibility_Engine SHALL return status "maybe" with score 0.5
3. WHEN wallet is not active on a required chain, THE Eligibility_Engine SHALL return status "unlikely" with score 0.2
4. WHEN wallet age is below required minimum, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
5. WHEN wallet transaction count is below required minimum, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
6. WHEN wallet does not hold required tokens, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
7. WHEN eligibility score is greater than or equal to 0.8, THE System SHALL set status to "likely"
8. WHEN eligibility score is between 0.5 and 0.79 inclusive, THE System SHALL set status to "maybe"
9. WHEN eligibility score is less than 0.5, THE System SHALL set status to "unlikely"
10. THE Eligibility_Engine SHALL always include between 2 and 5 reasons in the reasons array
11. THE Eligibility_Engine SHALL cache results in eligibility_cache table with 24-hour TTL

### Requirement 6: Ranking Engine

**User Story:** As a user, I want opportunities ranked by relevance to my profile, so that the most suitable opportunities appear first.

#### Acceptance Criteria

1. THE Ranking_Engine SHALL calculate overall score as: 0.60 × relevance + 0.25 × (trust_score / 100) + 0.15 × freshness
2. WHEN calculating relevance, THE System SHALL add 0.4 if opportunity chains array contains any wallet active chain
3. WHEN calculating relevance, THE System SHALL add 0.2 if eligibility status equals "likely"
4. WHEN calculating relevance, THE System SHALL add 0.1 if eligibility status equals "maybe"
5. WHEN calculating relevance, THE System SHALL add 0.1 if any opportunity tag matches user saved opportunity tags
6. WHEN calculating relevance, THE System SHALL add 0.2 if opportunity type matches user's most completed type
7. THE Ranking_Engine SHALL clamp relevance score between 0 and 1 (inclusive)
8. WHEN calculating freshness, THE System SHALL compute urgency boost as max(0, 1 - hours_to_end / 168) for opportunities with end_date timestamp
9. WHEN calculating freshness, THE System SHALL compute recency as max(0, 1 - days_since_created / 30)
10. THE Ranking_Engine SHALL set freshness to the maximum of recency and urgency boost
11. THE Ranking_Engine SHALL clamp freshness score between 0 and 1 (inclusive)
12. THE Ranking_Engine SHALL clamp overall score between 0 and 1 (inclusive)
13. THE Ranking_Engine SHALL return ranking object containing: overall, relevance, freshness scores

### Requirement 7: API Response Contract Enhancement

**User Story:** As a frontend developer, I want the existing API response enhanced with eligibility and ranking data, so that I can display personalized information.

#### Acceptance Criteria

1. WHEN any opportunity endpoint returns data with walletAddress parameter, THE System SHALL include eligibility_preview object with: status, score, reasons array
2. WHEN any opportunity endpoint returns data with walletAddress parameter, THE System SHALL include ranking object with: overall, relevance, freshness scores
3. WHEN a user requests without walletAddress parameter, THE System SHALL omit eligibility_preview and ranking objects (existing behavior)
4. THE System SHALL maintain existing response format: {items: [], cursor: null, ts: string}
5. WHEN an error occurs, THE System SHALL return error object with: code, message fields (existing behavior)

### Requirement 8: Scheduled Cron Jobs

**User Story:** As a system administrator, I want automated cron jobs to keep opportunity data fresh, so that users see current opportunities without manual updates.

#### Acceptance Criteria

1. THE System SHALL execute POST /api/sync/yield every 2 hours via Vercel cron configuration
2. THE System SHALL include cron configuration in vercel.json file
3. WHEN a cron job executes, THE System SHALL log execution start and completion timestamps
4. WHEN a cron job fails, THE System SHALL log the error without affecting other scheduled jobs
5. THE System SHALL include CRON_SECRET in cron job requests for authentication

### Requirement 9: Live Mode Data Flow Enhancement

**User Story:** As an authenticated user, I want to see real database opportunities personalized to my wallet, so that I receive relevant recommendations.

#### Acceptance Criteria

1. WHEN a user is authenticated and requests opportunities, THE System SHALL pass activeWallet to API as walletAddress parameter
2. WHEN walletAddress parameter is present, THE System SHALL fetch wallet signals for that address
3. WHEN wallet signals are fetched, THE System SHALL evaluate eligibility for each opportunity
4. WHEN eligibility is evaluated, THE System SHALL rank opportunities using the ranking engine
5. WHEN opportunities are ranked, THE System SHALL return them sorted by overall ranking score in descending order
6. THE System SHALL NOT return demo data when user is authenticated (existing behavior)

### Requirement 10: Third-Party API Integration Architecture

**User Story:** As a developer, I want a clear architecture for third-party API integration, so that costs are controlled and the system degrades gracefully.

#### Acceptance Criteria

1. THE System SHALL support DeFiLlama API for yield data without requiring API keys
2. THE System SHALL support Alchemy RPC for wallet signals with per-chain API keys (ALCHEMY_ETH_RPC_URL, ALCHEMY_BASE_RPC_URL, etc.)
3. WHEN Alchemy API keys are not configured, THE System SHALL return null wallet signals without throwing errors
4. THE System SHALL cache DeFiLlama responses for 30-60 minutes to reduce API calls
5. THE System SHALL cache wallet signals for 5-15 minutes to reduce RPC calls
6. THE System SHALL cache eligibility results for 1-24 hours to reduce computation
7. THE System SHALL implement rate limiting on sync endpoints (60 requests/hour)
8. THE System SHALL log all third-party API calls with duration and status for cost monitoring

### Requirement 11: Cost Control Rules

**User Story:** As a system administrator, I want cost control mechanisms, so that third-party API usage stays within budget.

#### Acceptance Criteria

1. THE System SHALL NOT compute eligibility for all opportunities on every request
2. WHEN computing eligibility, THE System SHALL first preselect top 100 candidates by hybrid score: (trust_score * 0.7 + recency_boost * 0.3)
3. WHEN computing eligibility, THE System SHALL then process top 50 of preselected candidates to avoid missing high-relevance but lower-trust items
4. WHEN wallet signals are cached, THE System SHALL use cached data instead of making new RPC calls
5. WHEN eligibility results are cached and less than 24 hours old, THE System SHALL use cached data
6. THE System SHALL implement exponential backoff for failed API calls (1s, 2s, 4s, 8s)
7. THE System SHALL log warning when API call duration exceeds 2 seconds
8. THE System SHALL return cached/stale data when API calls fail after 3 retries

### Requirement 12: Parser and Serializer Requirements

**User Story:** As a developer, I want robust parsing and serialization for opportunity data, so that data integrity is maintained across API boundaries.

#### Acceptance Criteria

1. WHEN parsing opportunity requirements from JSONB, THE Parser SHALL validate the structure matches the expected schema
2. WHEN serializing eligibility reasons to JSONB, THE Serializer SHALL format the array as valid JSON
3. WHEN parsing wallet signals from cache, THE Parser SHALL validate all required fields are present
4. THE Pretty_Printer SHALL format opportunity objects into human-readable JSON with 2-space indentation
5. FOR ALL valid opportunity objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)


### Requirement 13: Yield/Staking Module (DeFiLlama Integration)

**User Story:** As a user, I want to discover yield opportunities from DeFiLlama with real APY data, so that I can earn passive income on my crypto assets.

#### Acceptance Criteria

1. WHEN the yield sync job runs, THE System SHALL fetch pools from DeFiLlama API (https://yields.llama.fi/pools)
2. WHEN filtering pools, THE System SHALL only include pools with apy > 0, tvlUsd > 100000, and chain in supported list
3. WHEN transforming pools to opportunities, THE System SHALL map DeFiLlama fields to opportunities schema (apy, tvl_usd, protocol, chain)
4. WHEN displaying yield opportunities, THE System SHALL show APY, TVL, protocol name, and chain
5. THE System SHALL create user_yield_positions table for tracking user positions (optional for v1)
6. THE System SHALL provide GET /api/hunter/yield?wallet= endpoint filtering type='yield' or 'staking'

### Requirement 14: Airdrops Module (Admin-Seeded)

**User Story:** As a user, I want to discover airdrop opportunities with claim windows and eligibility status, so that I can claim tokens I'm entitled to.

#### Acceptance Criteria

1. THE System SHALL add airdrop-specific columns: snapshot_date, claim_start, claim_end, airdrop_category
2. THE System SHALL create user_airdrop_status table tracking: eligible, maybe, unlikely, claimed, missed, expired
3. WHEN evaluating airdrop eligibility, THE System SHALL check if current time is within claim window
4. WHEN displaying airdrops, THE System SHALL show claim window countdown and eligibility status
5. THE System SHALL provide GET /api/hunter/airdrops?wallet= endpoint filtering type='airdrop'
6. THE System SHALL provide GET /api/hunter/airdrops/history?wallet= endpoint showing user's airdrop history
7. THE System SHALL seed at least 10 airdrop opportunities via admin script

### Requirement 15: Quests Module (Admin-Seeded)

**User Story:** As a user, I want to discover quests with multi-step progress tracking, so that I can complete tasks and earn rewards.

#### Acceptance Criteria

1. THE System SHALL add quest-specific columns: quest_steps, quest_difficulty, xp_reward, quest_type
2. THE System SHALL create user_quest_progress table tracking step completion
3. WHEN displaying quests, THE System SHALL show progress bar and step list
4. WHEN a user completes a quest step, THE System SHALL update user_quest_progress
5. THE System SHALL provide GET /api/hunter/quests?wallet= endpoint filtering type='quest'
6. THE System SHALL provide POST /api/hunter/quests/progress endpoint for manual progress marking
7. THE System SHALL seed at least 10 quest opportunities via admin script

### Requirement 16: Points/Loyalty Module (Admin-Seeded)

**User Story:** As a user, I want to discover points and loyalty programs, so that I can earn rewards for protocol usage.

#### Acceptance Criteria

1. THE System SHALL add points-specific columns: points_program_name, conversion_hint, points_estimate_formula
2. THE System SHALL create user_points_status table tracking points earned
3. WHEN displaying points programs, THE System SHALL show conversion hints (e.g., "1000 points ≈ $10 airdrop")
4. WHEN evaluating points eligibility, THE System SHALL check wallet activity on required chains
5. THE System SHALL provide GET /api/hunter/points?wallet= endpoint filtering type='points'
6. THE System SHALL seed at least 10 points/loyalty programs via admin script

### Requirement 17: RWA Vaults Module (Admin-Seeded)

**User Story:** As a user, I want to discover RWA vault opportunities with KYC and jurisdiction requirements, so that I can invest in real-world assets.

#### Acceptance Criteria

1. THE System SHALL add RWA-specific columns: issuer_name, jurisdiction, kyc_required, min_investment, liquidity_term_days, rwa_type
2. THE System SHALL create user_rwa_positions table tracking user positions
3. WHEN displaying RWA vaults, THE System SHALL show KYC requirements and jurisdiction restrictions
4. WHEN evaluating RWA eligibility, THE System SHALL check minimum investment requirements
5. THE System SHALL provide GET /api/hunter/rwa?wallet= endpoint filtering type='rwa'
6. THE System SHALL seed at least 10 RWA vault opportunities via admin script

### Requirement 18: Strategies Module (Creator Plays)

**User Story:** As a user, I want to discover curated strategies linking multiple opportunities, so that I can follow proven paths to maximize returns.

#### Acceptance Criteria

1. THE System SHALL create strategies table with: id, title, description, creator_id, steps (JSONB array of opportunity IDs), trust_score_cached, steps_trust_breakdown (JSONB)
2. THE System SHALL create strategy_subscriptions table tracking user subscriptions
3. WHEN creating or updating a strategy, THE System SHALL compute trust_score_cached by aggregating Guardian trust scores across all steps
4. WHEN creating or updating a strategy, THE System SHALL store steps_trust_breakdown as JSONB array with per-step trust scores
5. WHEN displaying strategies, THE System SHALL show ordered steps linking to opportunities
6. WHEN displaying strategies, THE System SHALL return both trust_score_cached and steps_trust_breakdown
7. THE System SHALL provide GET /api/hunter/strategies endpoint listing all strategies
8. THE System SHALL provide POST /api/hunter/strategies/subscribe endpoint for subscribing
9. THE System SHALL provide POST /api/hunter/strategies endpoint for creating strategies (admin/creator only)
10. THE System SHALL seed at least 5 strategies via admin script

### Requirement 19: Referrals Module (Internal System)

**User Story:** As a user, I want to refer friends and earn rewards, so that I can benefit from growing the AlphaWhale community.

#### Acceptance Criteria

1. THE System SHALL create referral_profiles table with: user_id, referral_code, total_referrals, total_rewards
2. THE System SHALL create referrals table with: referrer_id, referred_user_id, activated_at, reward_amount
3. THE System SHALL create referral_rewards table with: referral_id, reward_type, reward_amount, claimed_at
4. WHEN a user creates a referral code, THE System SHALL generate a unique code
5. WHEN a referred user completes their first tracked action (user_opportunities.status = 'completed'), THE System SHALL activate the referral
6. WHEN a referral is activated, THE System SHALL set activated_at timestamp and credit reward to referrer
7. THE System SHALL provide POST /api/referrals/create-code endpoint for code generation
8. THE System SHALL provide POST /api/referrals/claim?code= endpoint for claiming referrals
9. THE System SHALL provide GET /api/referrals/dashboard endpoint showing user's referral stats

### Requirement 20: Module Definition of Done

**User Story:** As a product manager, I want clear completion criteria for each module, so that I know when a module is ready for users.

#### Acceptance Criteria

1. FOR EACH module, THE System SHALL provide a dedicated tab/section in the Hunter UI
2. FOR EACH module, THE System SHALL have at least 10 seeded opportunities
3. FOR EACH module, THE System SHALL show eligibility status on cards when wallet is connected
4. FOR EACH module, THE System SHALL rank opportunities by relevance to user's wallet
5. FOR EACH module, THE System SHALL provide "My [Module]" state tracking (even if empty)
6. FOR EACH module, THE System SHALL log analytics events (view, click, save, CTA)
7. FOR EACH module, THE System SHALL have at least one E2E test covering tab load and card interaction
