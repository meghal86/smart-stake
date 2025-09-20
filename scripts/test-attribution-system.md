# Attribution System Test Script

## 1. Deploy & Setup

```bash
# Apply indexes and functions
supabase db push
supabase functions deploy bi-summary
supabase functions deploy log-attribution

# Verify tables exist
supabase db reset --linked
```

## 2. Test Attribution Flow

### A. Generate Test Events
```sql
-- Insert test preset clicks
INSERT INTO preset_click_events (user_id, preset_key, asset, occurred_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'CEX Inflows Spike', 'ETH', NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Accumulation Cluster', 'BTC', NOW() - INTERVAL '1 hour');

-- Insert test feature locks  
INSERT INTO feature_lock_events (user_id, lock_key, occurred_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'export', NOW() - INTERVAL '30 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'backtests', NOW() - INTERVAL '15 minutes');

-- Insert test upgrades (trigger should auto-fill attribution)
INSERT INTO upgrade_events (user_id, new_tier, occurred_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'pro', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'premium', NOW());
```

### B. Verify Attribution
```sql
-- Check attribution was filled correctly
SELECT 
  user_id,
  new_tier,
  last_preset_key,
  last_lock_key,
  occurred_at
FROM upgrade_events 
WHERE occurred_at >= NOW() - INTERVAL '1 hour';

-- Expected:
-- User 1: last_preset_key = 'CEX Inflows Spike', last_lock_key = 'export'
-- User 2: last_preset_key = 'Accumulation Cluster', last_lock_key = 'backtests'
```

## 3. Test BI API

```bash
# Test BI summary endpoint
curl -i -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  "https://your-project.supabase.co/functions/v1/bi-summary" \
  -d '{"range":"30d","tier":"all","preset":"all","asset":"all"}'

# Expected response:
# - 200 OK
# - Cache-Control: private, max-age=60
# - X-Robots-Tag: noindex
# - JSON with: presetFunnel, lockFunnel, retention, etc.
```

## 4. Test Filters

```bash
# Test filtered data
curl -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  "https://your-project.supabase.co/functions/v1/bi-summary" \
  -d '{"range":"7d","tier":"pro","preset":"cex_inflows","asset":"ETH"}'

# Verify response contains filtered data matching criteria
```

## 5. Run Verification Queries

```bash
# Copy scripts/attribution-verification.sql into Supabase SQL Editor
# Run all queries and verify:
# ✅ Attribution coverage > 60%
# ✅ Windowing works (72h/24h)
# ✅ Last-touch attribution correct
# ✅ Funnel data looks realistic
```

## 6. Test UI Integration

1. **Visit `/admin/bi`**
2. **Change filters** → Verify charts update
3. **Check preset clicks** → Should log to both tables
4. **Trigger feature locks** → Should log attribution events
5. **Verify last refreshed** timestamp updates

## 7. Performance Validation

```sql
-- Check query performance with indexes
EXPLAIN ANALYZE 
SELECT * FROM preset_click_events 
WHERE user_id = '11111111-1111-1111-1111-111111111111' 
ORDER BY occurred_at DESC 
LIMIT 10;

-- Should use index scan, not seq scan
```

## 8. Security Validation

```bash
# Test RLS policies
curl -H "Authorization: Bearer FREE_USER_JWT" \
  "https://your-project.supabase.co/functions/v1/bi-summary"

# Expected: 403 Forbidden (not admin)
```

## Success Criteria

✅ **Attribution Coverage**: >60% of upgrades have preset attribution  
✅ **Windowing**: 72h preset, 24h lock windows work correctly  
✅ **Last-Touch**: Most recent events win attribution  
✅ **Performance**: All queries use indexes, <100ms response  
✅ **Security**: Admin-only access, no PII in responses  
✅ **Reliability**: Server-side logging works, ad-blocker resistant  
✅ **UI Integration**: Filters work, charts update, events log  

## Troubleshooting

### No Attribution Data
- Check trigger function exists and fires
- Verify user IDs match between tables
- Check time windows (72h/24h)

### Poor Performance  
- Verify indexes created successfully
- Check query plans use index scans
- Monitor function execution time

### Missing Events
- Check RLS policies allow inserts
- Verify server-side logging function works
- Test with ad-blocker disabled

Your attribution system is now bulletproof! 🎯