# Hunter Screen Migration Instructions

## Manual Migration Application

Since you're applying this migration manually, follow these steps:

### Step 1: Apply the Migration

**IMPORTANT:** Since the `opportunities` table already exists from a previous migration, use the enhancement migration instead:

```
supabase/migrations/20250104000001_hunter_screen_enhancements.sql
```

This migration will:
- Add missing columns to the existing `opportunities` table
- Create new tables (guardian_scans, user_preferences, etc.)
- Add all required indexes, triggers, and functions
- Preserve existing data

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20250104000001_hunter_screen_enhancements.sql`
4. Paste and execute the SQL

**Option B: Using psql**
```bash
psql $DATABASE_URL -f supabase/migrations/20250104000001_hunter_screen_enhancements.sql
```

**Option C: Using Supabase CLI (single file)**
```bash
supabase db push
# This will apply the migration along with any other pending migrations
```

### Step 2: Verify the Migration

After applying the migration, run the validation script:

```bash
npm run db:validate-hunter
```

Expected output:
- ✅ All 4 enums created (opportunity_type, reward_unit, opportunity_status, urgency_type)
- ✅ All 7 tables created (opportunities, guardian_scans, eligibility_cache, user_preferences, saved_opportunities, completed_opportunities, analytics_events)
- ✅ All indexes created (15+ indexes including partial and multicolumn)
- ✅ Triggers working (apply_latest_guardian_snapshot)
- ✅ Functions created (upsert_opportunity)
- ✅ RLS policies enforced

### Step 3: Verify Schema Manually

You can also verify manually using SQL:

```sql
-- Check enums
SELECT typname FROM pg_type WHERE typname IN (
  'opportunity_type', 'reward_unit', 'opportunity_status', 'urgency_type'
);

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'opportunities', 'guardian_scans', 'eligibility_cache',
  'user_preferences', 'saved_opportunities', 'completed_opportunities',
  'analytics_events'
);

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'opportunities';

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trg_guardian_snapshot';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('apply_latest_guardian_snapshot', 'upsert_opportunity');
```

### What This Migration Creates

#### Enums (4)
- `opportunity_type`: airdrop, quest, staking, yield, points, loyalty, testnet
- `reward_unit`: TOKEN, USD, APR, APY, POINTS, NFT
- `opportunity_status`: draft, published, expired, flagged, quarantined
- `urgency_type`: ending_soon, new, hot

#### Tables (7)
1. **opportunities** - Main feed data with 20+ columns
2. **guardian_scans** - Security scan results
3. **eligibility_cache** - Wallet eligibility calculations (60 min TTL)
4. **user_preferences** - User personalization settings
5. **saved_opportunities** - User-saved items
6. **completed_opportunities** - User-completed items
7. **analytics_events** - Analytics tracking (write-only)

#### Indexes (15+)
- Basic indexes on type, chains, published_at, expires_at
- Multicolumn indexes: (status, published_at), (trust_level, expires_at)
- Partial indexes for common queries (published+green, featured)
- GIN index on chains array

#### Functions (2)
- `apply_latest_guardian_snapshot()` - Trigger function to update trust scores
- `upsert_opportunity()` - Upsert with source precedence logic

#### Triggers (1)
- `trg_guardian_snapshot` - Auto-updates opportunity trust on new scans

#### RLS Policies (7)
- saved_opportunities: User can only access their own
- completed_opportunities: User can only access their own
- analytics_events: Write-only, SELECT revoked

### Troubleshooting

**Issue: Enum already exists**
```sql
-- Drop and recreate if needed
DROP TYPE IF EXISTS opportunity_type CASCADE;
-- Then re-run the migration
```

**Issue: Table already exists**
```sql
-- Check if table exists
SELECT * FROM opportunities LIMIT 1;
-- If it exists but is different, you may need to drop it
DROP TABLE IF EXISTS opportunities CASCADE;
```

**Issue: Permission denied**
Make sure you're using a role with sufficient privileges (service_role or postgres role).

### Next Steps

After successful migration:
1. ✅ Mark Task 1 as complete
2. ⏭️ Proceed to Task 2: Implement database triggers and functions
3. ⏭️ Continue with Task 3: Create TypeScript types and Zod schemas

### Rollback (if needed)

If you need to rollback this migration:

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

## Summary

This migration creates the complete database foundation for the Hunter Screen feature, including:
- ✅ All required tables with proper constraints
- ✅ Enums for type safety
- ✅ Comprehensive indexes for performance
- ✅ Triggers for automatic trust score updates
- ✅ RLS policies for security
- ✅ Helper functions for data management

The schema is designed for:
- **Performance**: Sub-200ms P95 API response times
- **Security**: RLS policies, sanitization, write-only analytics
- **Scalability**: Proper indexes, denormalization, caching support
- **Data Quality**: Source precedence, deduplication, validation
