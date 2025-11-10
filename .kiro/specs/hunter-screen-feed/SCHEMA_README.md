# Hunter Screen Database Schema

This document describes the database schema for the AlphaWhale Hunter Screen (Feed) feature.

## Migration File

**Location:** `supabase/migrations/20250104000000_hunter_screen_schema.sql`

## Overview

The Hunter Screen schema consists of 7 main tables, 4 enums, comprehensive indexes, triggers, and RLS policies to support a high-performance, secure opportunity discovery feed.

## Tables

### 1. `opportunities`
Main table storing all DeFi opportunities (airdrops, quests, yield, etc.)

**Key Columns:**
- `id` (UUID): Primary key
- `slug` (TEXT): Unique URL-friendly identifier
- `title` (TEXT): Opportunity title
- `protocol_name` (TEXT): Protocol/project name
- `type` (opportunity_type): Enum - airdrop, quest, staking, yield, points, loyalty, testnet
- `chains` (TEXT[]): Array of supported chains
- `trust_score` (INTEGER): Guardian trust score (0-100, denormalized)
- `trust_level` (TEXT): green (≥80), amber (60-79), red (<60)
- `status` (opportunity_status): draft, published, expired, flagged, quarantined
- `urgency` (urgency_type): ending_soon, new, hot
- `dedupe_key` (TEXT): Unique key for deduplication across sources
- `source` (TEXT): partner, internal, aggregator (precedence order)

**Indexes:**
- Basic: type, chains (GIN), published_at, expires_at, dedupe_key
- Multicolumn: (status, published_at DESC), (trust_level, expires_at)
- Partial: published+green, status+trust+urgency, featured, trust+published

### 2. `guardian_scans`
Security scan results from Guardian system

**Key Columns:**
- `opportunity_id` (UUID): FK to opportunities
- `score` (INTEGER): Trust score 0-100
- `level` (TEXT): green, amber, red
- `issues` (JSONB): Array of security issues
- `scanned_at` (TIMESTAMPTZ): Scan timestamp

**Trigger:** Automatically updates `opportunities.trust_score` and `opportunities.trust_level` on insert

### 3. `eligibility_cache`
Cached wallet eligibility calculations (60 min TTL)

**Key Columns:**
- `opportunity_id` (UUID): FK to opportunities
- `wallet_address` (TEXT): User wallet
- `status` (TEXT): likely, maybe, unlikely, unknown
- `score` (NUMERIC): 0-1 eligibility score
- `reasons` (JSONB): Array of reason strings
- `expires_at` (TIMESTAMPTZ): Cache expiry

**Unique Constraint:** (opportunity_id, wallet_address)

### 4. `user_preferences`
User feed personalization settings

**Key Columns:**
- `user_id` (UUID): PK, FK to auth.users
- `preferred_chains` (TEXT[]): Preferred blockchain networks
- `trust_tolerance` (INTEGER): Minimum trust score (default: 60)
- `time_budget` (TEXT): easy_first, any
- `show_risky_consent` (BOOLEAN): Consent to view red trust items

### 5. `saved_opportunities`
User-saved opportunities for later review

**Key Columns:**
- `user_id` (UUID): FK to auth.users
- `opportunity_id` (UUID): FK to opportunities
- `saved_at` (TIMESTAMPTZ): Save timestamp

**RLS:** Users can only access their own saved items

### 6. `completed_opportunities`
Opportunities completed by users

**Key Columns:**
- `user_id` (UUID): FK to auth.users
- `opportunity_id` (UUID): FK to opportunities
- `completed_at` (TIMESTAMPTZ): Completion timestamp

**RLS:** Users can only access their own completed items

### 7. `analytics_events`
Analytics events (write-only from client)

**Key Columns:**
- `event_type` (TEXT): Event name
- `user_id_hash` (TEXT): Salted hash (never plain wallet)
- `opportunity_id` (UUID): FK to opportunities
- `metadata` (JSONB): Event metadata

**RLS:** Write-only, SELECT revoked from anon/authenticated

## Enums

### `opportunity_type`
- airdrop
- quest
- staking
- yield
- points
- loyalty
- testnet

### `reward_unit`
- TOKEN
- USD
- APR
- APY
- POINTS
- NFT

### `opportunity_status`
- draft
- published
- expired
- flagged
- quarantined

### `urgency_type`
- ending_soon
- new
- hot

## Functions

### `apply_latest_guardian_snapshot()`
**Type:** Trigger function  
**Purpose:** Automatically updates opportunity trust_score and trust_level when new Guardian scan is inserted  
**Trigger:** `trg_guardian_snapshot` on `guardian_scans` AFTER INSERT

### `upsert_opportunity(p_slug, p_source, p_dedupe_key, p_payload)`
**Type:** Function  
**Purpose:** Upsert opportunity with source precedence logic (Partner > Internal > Aggregator)  
**Returns:** UUID (opportunity id)

## Security

### Row Level Security (RLS)

**saved_opportunities:**
- INSERT: User can only insert their own saves
- SELECT: User can only view their own saves
- DELETE: User can only delete their own saves

**completed_opportunities:**
- All operations: User can only access their own completions

**analytics_events:**
- INSERT: Anyone can insert (for tracking)
- SELECT: Revoked from anon/authenticated (write-only)

## Performance Considerations

### Indexes
- **Partial indexes** for common queries (published+green, featured)
- **Multicolumn indexes** for complex sorts (status+published, trust+expires)
- **GIN index** on chains array for efficient array queries

### Denormalization
- `trust_score` and `trust_level` denormalized from `guardian_scans` for query performance
- Updated automatically via trigger on new scans

### Caching Strategy
- Eligibility calculations cached for 60 minutes
- Guardian scans cached in Redis (1 hour TTL)
- Edge CDN caching for anonymous feed (5 min TTL)

## Data Flow

1. **Opportunity Ingestion:**
   - External sources → `upsert_opportunity()` → `opportunities` table
   - Dedupe key prevents duplicates
   - Source precedence ensures data quality

2. **Guardian Scanning:**
   - Guardian API → `guardian_scans` table
   - Trigger updates `opportunities.trust_score/trust_level`
   - Cache invalidation for affected opportunities

3. **Eligibility Preview:**
   - Wallet signals → Eligibility algorithm → `eligibility_cache`
   - 60 min TTL, per wallet+opportunity

4. **User Interactions:**
   - Save → `saved_opportunities`
   - Complete → `completed_opportunities`
   - Analytics → `analytics_events` (hashed identifiers)

## Validation

Run the validation script to verify the schema:

```bash
node scripts/validate-hunter-schema.js
```

This will test:
- ✅ All enums exist
- ✅ All tables exist and are accessible
- ✅ Required columns present
- ✅ Triggers work correctly
- ✅ RLS policies are enforced

## Migration Commands

### Apply migration (if not auto-applied):
```bash
# Using Supabase CLI
supabase db push

# Or apply directly
psql $DATABASE_URL -f supabase/migrations/20250104000000_hunter_screen_schema.sql
```

### Rollback (if needed):
```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS completed_opportunities CASCADE;
DROP TABLE IF EXISTS saved_opportunities CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS eligibility_cache CASCADE;
DROP TABLE IF EXISTS guardian_scans CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS upsert_opportunity(TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot();

-- Drop enums
DROP TYPE IF EXISTS urgency_type;
DROP TYPE IF EXISTS opportunity_status;
DROP TYPE IF EXISTS reward_unit;
DROP TYPE IF EXISTS opportunity_type;
```

## Requirements Addressed

This schema implementation addresses the following requirements from the spec:

- **Requirement 1.1-1.6:** Performance optimizations via indexes and denormalization
- **Requirement 2.1:** Guardian trust integration with automatic updates
- **Requirement 6.1:** Eligibility caching infrastructure
- **Requirement 12.1:** Data refresh and sync support via source precedence

## Next Steps

After applying this migration:

1. ✅ Verify schema with validation script
2. ⏭️ Implement database triggers and functions (Task 2)
3. ⏭️ Create TypeScript types and Zod schemas (Task 3)
4. ⏭️ Build API endpoints (Tasks 12-14)
5. ⏭️ Implement frontend components (Tasks 16-24)
