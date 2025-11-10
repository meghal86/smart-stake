# Task 1 Completion Checklist

## Database Schema and Migrations Setup

### ✅ Files Created

- [x] `supabase/migrations/20250104000001_hunter_screen_enhancements.sql` - Enhancement migration (works with existing table)
- [x] `supabase/migrations/20250104000000_hunter_screen_schema.sql` - Full schema (for reference/new installs)
- [x] `scripts/validate-hunter-schema.js` - Validation script
- [x] `.kiro/specs/hunter-screen-feed/SCHEMA_README.md` - Schema documentation
- [x] `.kiro/specs/hunter-screen-feed/MIGRATION_INSTRUCTIONS.md` - Migration guide
- [x] `.kiro/specs/hunter-screen-feed/TASK_1_CHECKLIST.md` - This checklist
- [x] `package.json` - Added `db:validate-hunter` script

**Note:** Since the `opportunities` table already exists from migration `20251023000100_hunter_tables.sql`, we created an enhancement migration that:
- Adds missing columns to existing table
- Creates new tables (guardian_scans, user_preferences, etc.)
- Preserves existing data

### ✅ Enums Created (4)

- [x] `opportunity_type` - airdrop, quest, staking, yield, points, loyalty, testnet
- [x] `reward_unit` - TOKEN, USD, APR, APY, POINTS, NFT
- [x] `opportunity_status` - draft, published, expired, flagged, quarantined
- [x] `urgency_type` - ending_soon, new, hot

### ✅ Tables Created (7)

- [x] `opportunities` - Main feed table with all required columns:
  - [x] id, slug, title, description
  - [x] protocol_name, protocol_logo
  - [x] type (opportunity_type enum)
  - [x] chains (TEXT array)
  - [x] reward_min, reward_max, reward_currency, reward_confidence
  - [x] apr, difficulty
  - [x] featured, sponsored, time_left_sec
  - [x] external_url, dedupe_key, source
  - [x] **status** (opportunity_status enum) ✅
  - [x] **urgency** (urgency_type enum) ✅
  - [x] **trust_score** (INTEGER 0-100) ✅
  - [x] **trust_level** (TEXT: green/amber/red) ✅
  - [x] created_at, updated_at, published_at, expires_at

- [x] `guardian_scans` - Security scan results
  - [x] opportunity_id (FK to opportunities)
  - [x] score, level, issues (JSONB)
  - [x] scanned_at, created_at
  - [x] Unique constraint on (opportunity_id, scanned_at)

- [x] `eligibility_cache` - Wallet eligibility caching
  - [x] opportunity_id, wallet_address
  - [x] status, score, reasons (JSONB)
  - [x] cached_at, expires_at
  - [x] Unique constraint on (opportunity_id, wallet_address)

- [x] `user_preferences` - User personalization
  - [x] user_id (PK, FK to auth.users)
  - [x] preferred_chains, trust_tolerance, time_budget
  - [x] show_risky_consent
  - [x] created_at, updated_at

- [x] `saved_opportunities` - User saves
  - [x] user_id, opportunity_id
  - [x] saved_at
  - [x] Unique constraint on (user_id, opportunity_id)

- [x] `completed_opportunities` - User completions
  - [x] user_id, opportunity_id
  - [x] completed_at
  - [x] Unique constraint on (user_id, opportunity_id)

- [x] `analytics_events` - Analytics tracking
  - [x] event_type, user_id_hash (not plain wallet)
  - [x] opportunity_id, metadata (JSONB)
  - [x] created_at

### ✅ Indexes Created (15+)

#### Basic Indexes
- [x] `idx_opportunities_type` - ON opportunities(type)
- [x] `idx_opportunities_chains` - ON opportunities USING GIN(chains)
- [x] `idx_opportunities_published` - ON opportunities(published_at DESC) WHERE published_at IS NOT NULL
- [x] `idx_opportunities_expires` - ON opportunities(expires_at) WHERE expires_at IS NOT NULL
- [x] `idx_opportunities_dedupe` - ON opportunities(dedupe_key)

#### Multicolumn Indexes (as specified in task)
- [x] `idx_opportunities_status_published` - ON opportunities(**status, published_at DESC**) ✅
- [x] `idx_opportunities_trust_expires` - ON opportunities(**trust_level, expires_at**) ✅

#### Optimized Partial Indexes
- [x] `idx_opps_published_green` - WHERE status='published' AND trust_level='green'
- [x] `idx_opps_status_trust_urgency` - ON opportunities(status, trust_level, urgency)
- [x] `idx_opps_featured` - WHERE featured=true
- [x] `idx_opps_trust_published` - ON opportunities(trust_level, published_at DESC)

#### Other Table Indexes
- [x] `idx_guardian_scans_opportunity` - ON guardian_scans(opportunity_id, scanned_at DESC)
- [x] `idx_guardian_scans_level` - ON guardian_scans(level)
- [x] `idx_eligibility_cache_lookup` - ON eligibility_cache(opportunity_id, wallet_address, expires_at)
- [x] `idx_saved_opportunities_user` - ON saved_opportunities(user_id, saved_at DESC)
- [x] `idx_completed_opportunities_user` - ON completed_opportunities(user_id, completed_at DESC)
- [x] `idx_analytics_events_type` - ON analytics_events(event_type, created_at DESC)

### ✅ Triggers and Functions

- [x] `apply_latest_guardian_snapshot()` - Trigger function
  - [x] Updates opportunities.trust_score on new guardian_scans insert
  - [x] Updates opportunities.trust_level on new guardian_scans insert
  - [x] Updates opportunities.updated_at timestamp

- [x] `trg_guardian_snapshot` - Trigger
  - [x] AFTER INSERT ON guardian_scans
  - [x] Calls apply_latest_guardian_snapshot()

- [x] `upsert_opportunity()` - Function
  - [x] Accepts (p_slug, p_source, p_dedupe_key, p_payload JSONB)
  - [x] Implements source precedence: Partner > Internal > Aggregator
  - [x] Returns UUID (opportunity id)
  - [x] Handles ON CONFLICT (dedupe_key)

### ✅ RLS Policies

- [x] `saved_opportunities` - RLS enabled
  - [x] p_ins_saved - INSERT policy (user can only insert their own)
  - [x] p_sel_saved - SELECT policy (user can only view their own)
  - [x] p_del_saved - DELETE policy (user can only delete their own)

- [x] `completed_opportunities` - RLS enabled
  - [x] p_rw_completed - Combined policy (user can only access their own)

- [x] `analytics_events` - RLS enabled
  - [x] p_ins_analytics - INSERT policy (anyone can insert)
  - [x] SELECT revoked from anon and authenticated users (write-only)

### ✅ Requirements Addressed

- [x] **Requirement 1.1** - Performance: Indexes for fast queries
- [x] **Requirement 2.1** - Trust & Security: trust_score, trust_level columns with Guardian integration
- [x] **Requirement 6.1** - Eligibility: eligibility_cache table for caching calculations
- [x] **Requirement 12.1** - Data Refresh: Source precedence in upsert_opportunity()

### ✅ Documentation

- [x] Schema README with complete documentation
- [x] Migration instructions for manual application
- [x] Validation script for testing
- [x] Comments in SQL file explaining purpose
- [x] Task completion checklist (this file)

### 🔄 Next Steps (After Manual Migration)

1. **Apply the migration manually** (see MIGRATION_INSTRUCTIONS.md)
2. **Run validation**: `npm run db:validate-hunter`
3. **Verify all checks pass**
4. **Mark Task 1 as complete**
5. **Proceed to Task 2**: Implement database triggers and functions

### 📊 Verification Commands

After applying the migration, verify with:

```bash
# Run automated validation
npm run db:validate-hunter

# Or check manually in SQL
psql $DATABASE_URL -c "SELECT typname FROM pg_type WHERE typname IN ('opportunity_type', 'reward_unit', 'opportunity_status', 'urgency_type');"

psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('opportunities', 'guardian_scans', 'eligibility_cache', 'user_preferences', 'saved_opportunities', 'completed_opportunities', 'analytics_events');"

psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'opportunities';"
```

## Summary

✅ **All task requirements completed:**
- ✅ Created opportunities table with status, urgency, trust_score, trust_level
- ✅ Created guardian_scans table with relationship to opportunities
- ✅ Created eligibility_cache table for caching eligibility calculations
- ✅ Created user_preferences, saved_opportunities, completed_opportunities tables
- ✅ Created analytics_events table
- ✅ Added all required indexes including optimized partial indexes
- ✅ Added multicolumn indexes: (status, published_at DESC), (trust_level, expires_at)
- ✅ Created enums for opportunity_type, reward_unit, opportunity_status, urgency_type

**Status**: Ready for manual migration application
**Next Task**: Task 2 - Implement database triggers and functions (already included in this migration)
