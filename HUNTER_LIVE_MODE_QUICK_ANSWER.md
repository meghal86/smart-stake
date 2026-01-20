# Hunter Live Mode - Quick Answer

## Your Question
> "when i toggle switch i am seeing isDemo: false, isConnected: true but i dont see any network call and see random data /dummy data on screen"

## Answer

**The database migrations are DISABLED.**

Your code is correct, but the database tables don't exist because the migration files are in:
```
supabase/migrations_disabled/
```

Instead of:
```
supabase/migrations/
```

---

## What Should Happen (Per Spec)

According to `.kiro/specs/hunter-screen-feed/`:

### requirements.md says:
- **Requirement 1.7**: API endpoint `/api/hunter/opportunities` returns live data
- **Requirement 3.1**: Feed ranked using materialized view `mv_opportunity_rank`
- **Requirement 12.1-12.8**: Data synced from external sources hourly

### design.md says:
```typescript
// getFeedPage() queries Supabase database
const { data, error } = await supabase
  .from('mv_opportunity_rank')  // ← This table doesn't exist!
  .select('*');
```

### tasks.md says:
- **Task 1**: Create database schema (opportunities table, mv_opportunity_rank view)
- **Task 9a**: Create ranking materialized view
- **Status**: Migrations exist but are DISABLED

---

## What IS Happening

```
1. You toggle demo mode OFF
2. useHunterFeed sets useRealAPI = true
3. getFeedPage() tries to query mv_opportunity_rank
4. ❌ Table doesn't exist (migrations disabled)
5. Query fails silently
6. Falls back to mock data
7. No network call visible
```

---

## The Fix

### Quick Fix (5 minutes)

```bash
# Enable migrations
mv supabase/migrations_disabled/20250104000000_hunter_screen_schema.sql supabase/migrations/
mv supabase/migrations_disabled/20250104000003_hunter_ranking_view.sql supabase/migrations/

# Apply to database
supabase db push

# Seed sample data
psql $DATABASE_URL << EOF
INSERT INTO opportunities (slug, title, protocol_name, type, chains, reward_min, reward_max, reward_currency, trust_score, trust_level, difficulty, status, published_at)
VALUES 
  ('eth-staking', 'Ethereum Staking', 'Lido', 'staking', ARRAY['ethereum'], 0, 4.2, 'APY', 90, 'green', 'easy', 'published', NOW()),
  ('layerzero-airdrop', 'LayerZero Airdrop', 'LayerZero', 'airdrop', ARRAY['ethereum'], 500, 2000, 'USD', 78, 'amber', 'medium', 'published', NOW());
REFRESH MATERIALIZED VIEW mv_opportunity_rank;
EOF

# Hard refresh browser
# Ctrl+Shift+R or Cmd+Shift+R
```

### Alternative (Keep Demo Mode)

If migrations are disabled for a reason, just keep demo mode ON:

```typescript
// src/pages/Hunter.tsx
const [isDemo, setIsDemo] = useState(true); // Keep true until DB ready
```

---

## Verification

After enabling migrations:

```bash
# Check tables exist
psql $DATABASE_URL -c "\dt opportunities"
psql $DATABASE_URL -c "\dm mv_opportunity_rank"

# Check data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM mv_opportunity_rank;"
```

Expected console output after toggle:
```
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from API
✅ API Response: {itemCount: 2, hasMore: false}
```

Expected Network tab:
```
POST https://your-project.supabase.co/rest/v1/mv_opportunity_rank
Status: 200 OK
```

---

## Summary

| Component | Status | Issue |
|-----------|--------|-------|
| UI Code | ✅ Working | None |
| useHunterFeed Hook | ✅ Working | None |
| getFeedPage Function | ✅ Working | None |
| Query Key Fix | ✅ Applied | None |
| Database Schema | ❌ Missing | Migrations disabled |
| Sample Data | ❌ Missing | No data seeded |

**Root Cause**: Migrations in `migrations_disabled/` folder  
**Fix**: Enable migrations OR keep demo mode ON  
**Time**: 5-15 minutes

---

## Files

**Disabled migrations:**
- `supabase/migrations_disabled/20250104000000_hunter_screen_schema.sql`
- `supabase/migrations_disabled/20250104000003_hunter_ranking_view.sql`

**Spec documents:**
- `.kiro/specs/hunter-screen-feed/requirements.md`
- `.kiro/specs/hunter-screen-feed/design.md`
- `.kiro/specs/hunter-screen-feed/tasks.md`

**Analysis documents (created):**
- `HUNTER_LIVE_MODE_ROOT_CAUSE_FOUND.md` (detailed)
- `HUNTER_LIVE_DATA_ARCHITECTURE_ANALYSIS.md` (comprehensive)
- `HUNTER_LIVE_MODE_QUICK_ANSWER.md` (this file)

---

**Last Updated**: 2026-01-20  
**Status**: Issue identified - migrations disabled  
**Action**: Enable migrations or keep demo mode
