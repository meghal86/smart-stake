# Requirements Document

## Introduction

The Hunter Demand-Side MVP enhances the existing Hunter screen with personalized, wallet-aware ranking and eligibility features. The current implementation displays opportunities from the database but lacks:
1. Wallet-based personalization (relevance scoring)
2. Eligibility evaluation (Likely/Maybe/Unlikely status with reasons)
3. Multi-factor ranking (60% relevance + 25% trust + 15% freshness)
4. Sync jobs for external data (DeFiLlama yield, admin-seeded airdrops/quests)
5. Third-party API integration architecture

This spec defines the **missing features** to complete the demand-side experience without regenerating existing code.

## Glossary

- **Hunter_Feed**: The existing opportunity discovery interface (src/pages/Hunter.tsx)
- **Opportunity**: A DeFi action stored in the opportunities table (airdrop, quest, staking, yield)
- **Wallet_Signals**: On-chain characteristics derived from a wallet address (age, transaction count, active chains, token holdings)
- **Eligibility_Engine**: NEW service that evaluates whether a user qualifies for an opportunity
- **Ranking_Engine**: NEW service that scores opportunities based on relevance, trust, and freshness
- **Sync_Job**: NEW scheduled task that fetches external opportunity data and updates the database
- **DeFiLlama**: Public API providing DeFi protocol yield data (no authentication required)
- **Alchemy**: RPC provider for wallet signals (requires API key per chain)
- **Live_Mode**: Existing authenticated state - needs enhancement with personalization
- **Demo_Mode**: Existing unauthenticated state - already working
- **Eligibility_Cache**: NEW table for storing computed eligibility results per wallet+opportunity
- **User_Opportunity_State**: Renamed from user_opportunities - tracks saved/dismissed/completed status

## Requirements

### Requirement 1: Enhance Existing API Route with Ranking

**User Story:** As a user, I want the existing /api/hunter/opportunities endpoint enhanced with wallet-aware ranking, so that opportunities are personalized to my profile.

#### Acceptance Criteria

1. WHEN a user requests GET /api/hunter/opportunities with walletAddress parameter, THE System SHALL compute wallet signals for that address
2. WHEN wallet signals are available, THE System SHALL evaluate eligibility for each opportunity
3. WHEN eligibility is computed, THE System SHALL calculate ranking scores (relevance, trust, freshness)
4. WHEN ranking scores are calculated, THE System SHALL sort opportunities by overall score descending
5. WHEN a user requests without walletAddress parameter, THE System SHALL return opportunities sorted by created_at descending (existing behavior)
6. THE System SHALL include eligibility object in response when walletAddress is provided
7. THE System SHALL include ranking object in response when walletAddress is provided

### Requirement 2: Sync Jobs for External Data Integration

**User Story:** As a system administrator, I want automated sync jobs to fetch external opportunity data, so that the database stays current without manual intervention.

#### Acceptance Criteria

1. WHEN GET /api/sync/yield is invoked, THE System SHALL fetch yield opportunities from DeFiLlama and upsert them into the opportunities table
2. WHEN GET /api/sync/airdrops is invoked, THE System SHALL return a stub response with count 0 and source "stub"
3. WHEN GET /api/sync/quests is invoked, THE System SHALL return a stub response with count 0 and source "stub"
4. WHEN GET /api/sync/points is invoked, THE System SHALL return a stub response with count 0 and source "stub"
5. WHEN any sync job processes an opportunity, THE System SHALL upsert by unique constraint (source, source_id) to prevent duplicates
6. WHEN the yield sync job runs, THE System SHALL complete within 30 seconds for up to 100 protocols
7. WHEN a sync job encounters an error, THE System SHALL log the error and return a descriptive error response without crashing

### Requirement 3: Database Schema for Opportunities and User State

**User Story:** As a developer, I want a normalized database schema for opportunities and user state, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE Opportunities_Table SHALL include columns: id, type, title, description, protocol, chain, chains, url, source, source_id, trust_score, created_at, updated_at, starts_at, ends_at, tags, requirements
2. THE Opportunities_Table SHALL enforce a unique constraint on (source, source_id)
3. THE Opportunities_Table SHALL use an enum type for the type column with values: airdrop, quest, yield, points, rwa, strategy
4. THE User_Opportunity_State_Table SHALL include columns: id, user_id, wallet_address, opportunity_id, state, eligibility_status, eligibility_score, eligibility_reasons, last_checked_at, updated_at
5. THE User_Opportunity_State_Table SHALL use an enum type for state with values: saved, dismissed, completed, claimed, missed
6. THE User_Opportunity_State_Table SHALL use an enum type for eligibility_status with values: likely, maybe, unlikely
7. THE User_Opportunity_State_Table SHALL have indexes on user_id, wallet_address, and opportunity_id
8. THE User_Opportunity_State_Table SHALL store eligibility_reasons as JSONB containing an array of reason strings

### Requirement 4: Wallet Signals Service

**User Story:** As a user, I want the system to analyze my wallet characteristics, so that opportunities are personalized to my on-chain profile.

#### Acceptance Criteria

1. WHEN a wallet address is provided, THE Wallet_Signals_Service SHALL validate the address format (0x followed by 40 hexadecimal characters)
2. WHEN RPC_URL environment variable exists, THE Wallet_Signals_Service SHALL fetch wallet age, transaction count, and token holdings via RPC calls
3. WHEN RPC_URL environment variable does not exist, THE Wallet_Signals_Service SHALL return wallet signals with null values for wallet_age_days, tx_count, and empty arrays for chains_active and token_holdings
4. WHEN wallet signals are fetched, THE System SHALL cache results for 5 minutes using Upstash Redis or in-memory LRU cache
5. WHEN cached wallet signals exist and are less than 5 minutes old, THE System SHALL return cached data without making RPC calls
6. THE Wallet_Signals_Service SHALL return an object containing: address, wallet_age_days, tx_count, chains_active, token_holdings

### Requirement 5: Eligibility Engine

**User Story:** As a user, I want to see whether I qualify for each opportunity, so that I can focus on opportunities I'm eligible for.

#### Acceptance Criteria

1. WHEN an opportunity has no requirements field, THE Eligibility_Engine SHALL return status "maybe" with score 0.5
2. WHEN wallet signals contain unknown chain data and opportunity requires specific chains, THE Eligibility_Engine SHALL return status "maybe" with score 0.5
3. WHEN wallet is not active on a required chain, THE Eligibility_Engine SHALL return status "unlikely" with score 0.2
4. WHEN wallet age is below required minimum, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
5. WHEN wallet transaction count is below required minimum, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
6. WHEN wallet does not hold required tokens, THE Eligibility_Engine SHALL return status "unlikely" with score less than 0.5
7. WHEN eligibility score is greater than or equal to 0.8, THE System SHALL set status to "likely"
8. WHEN eligibility score is between 0.5 and 0.79 inclusive, THE System SHALL set status to "maybe"
9. WHEN eligibility score is less than 0.5, THE System SHALL set status to "unlikely"
10. THE Eligibility_Engine SHALL always include between 2 and 5 reasons in the eligibility_reasons array

### Requirement 6: Ranking Engine

**User Story:** As a user, I want opportunities ranked by relevance to my profile, so that the most suitable opportunities appear first.

#### Acceptance Criteria

1. THE Ranking_Engine SHALL calculate overall score as: 0.60 × relevance + 0.25 × (trust_score / 100) + 0.15 × freshness
2. WHEN calculating relevance, THE System SHALL add 0.4 if opportunity chain matches any wallet active chain
3. WHEN calculating relevance, THE System SHALL add 0.2 if eligibility status equals "likely"
4. WHEN calculating relevance, THE System SHALL add 0.1 if eligibility status equals "maybe"
5. WHEN calculating relevance, THE System SHALL add 0.1 if any opportunity tag matches user history tags
6. WHEN calculating relevance, THE System SHALL add 0.2 if opportunity type matches user preference
7. WHEN calculating freshness, THE System SHALL compute urgency boost as max(0, 1 - hours_to_end / 168) for opportunities with ends_at timestamp
8. WHEN calculating freshness, THE System SHALL compute recency as max(0, 1 - days_since_created / 30)
9. THE Ranking_Engine SHALL set freshness to the maximum of recency and urgency boost
10. THE Ranking_Engine SHALL return ranking object containing: overall, relevance, freshness scores

### Requirement 7: API Response Contract

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse and display opportunity data.

#### Acceptance Criteria

1. WHEN any opportunity endpoint returns data, THE System SHALL include fields: id, title, type, protocol, chain, trust_score, starts_at, ends_at
2. WHEN a user is authenticated, THE System SHALL include eligibility object with: status, score, reasons array
3. WHEN a user is authenticated, THE System SHALL include ranking object with: overall, relevance, freshness scores
4. WHEN a user is unauthenticated, THE System SHALL omit eligibility and ranking objects
5. THE System SHALL return opportunities as a JSON array in the data field
6. WHEN an error occurs, THE System SHALL return error object with: code, message fields

### Requirement 8: Scheduled Cron Jobs

**User Story:** As a system administrator, I want automated cron jobs to keep opportunity data fresh, so that users see current opportunities without manual updates.

#### Acceptance Criteria

1. THE System SHALL execute GET /api/sync/yield every 2 hours via Vercel cron configuration
2. THE System SHALL include cron configuration in vercel.json file
3. WHEN a cron job executes, THE System SHALL log execution start and completion timestamps
4. WHEN a cron job fails, THE System SHALL log the error without affecting other scheduled jobs

### Requirement 9: Live Mode Data Flow

**User Story:** As an authenticated user, I want to see real database opportunities personalized to my wallet, so that I receive relevant recommendations.

#### Acceptance Criteria

1. WHEN a user is authenticated and requests opportunities, THE System SHALL fetch wallet signals for the user's connected wallet
2. WHEN a user is authenticated, THE System SHALL evaluate eligibility for each opportunity using wallet signals
3. WHEN a user is authenticated, THE System SHALL rank opportunities using the ranking engine
4. WHEN a user is authenticated, THE System SHALL return opportunities sorted by overall ranking score in descending order
5. THE System SHALL NOT return demo data when user is authenticated

### Requirement 10: Parser and Serializer Requirements

**User Story:** As a developer, I want robust parsing and serialization for opportunity data, so that data integrity is maintained across API boundaries.

#### Acceptance Criteria

1. WHEN parsing opportunity requirements from JSONB, THE Parser SHALL validate the structure matches the expected schema
2. WHEN serializing eligibility reasons to JSONB, THE Serializer SHALL format the array as valid JSON
3. WHEN parsing wallet signals from cache, THE Parser SHALL validate all required fields are present
4. THE Pretty_Printer SHALL format opportunity objects into human-readable JSON with 2-space indentation
5. FOR ALL valid opportunity objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
