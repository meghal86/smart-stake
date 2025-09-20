# BI Dashboard Testing Guide

## 1. Generate Test Data

**Run in Supabase SQL Editor:**
```sql
-- Copy and paste the entire generate-test-data.sql file
```

## 2. Manually Trigger Forecasting

**Option A: Direct Function Call**
```bash
curl -X POST "https://rebeznxivaxgserswhbn.supabase.co/functions/v1/forecast-upgrades" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Option B: SQL Function Call**
```sql
SELECT net.http_post(
  'https://rebeznxivaxgserswhbn.supabase.co/functions/v1/forecast-upgrades',
  '{}',
  'application/json'
);
```

## 3. Verify Data Population

```sql
-- Check analytics events
SELECT event_name, COUNT(*) FROM analytics_events GROUP BY event_name;

-- Check forecasts
SELECT preset_name, COUNT(*) FROM upgrade_forecasts GROUP BY preset_name;

-- Check views work
SELECT * FROM v_preset_to_upgrade LIMIT 5;
SELECT * FROM v_cross_retention_upgrades;
SELECT * FROM v_lock_to_upgrade LIMIT 5;
```

## 4. Expected Dashboard Results

After running the test data, you should see:

### Forecasts Panel
- **CEX Inflows Spike**: 15.2% upgrade rate (3-5 runs bucket)
- **Accumulation Cluster**: 12.8% upgrade rate
- **Distribution Wave**: 9.1% upgrade rate
- **Whale Accumulation**: 13.7% upgrade rate

### Cross-Retention Chart
- **0-2 runs**: ~6-8% upgrade probability
- **3-5 runs**: ~12-15% upgrade probability  
- **6+ runs**: ~19-24% upgrade probability

### Conversion Funnels
- **Preset → Upgrade**: 40% conversion (2/5 users upgraded)
- **Feature Lock → Upgrade**: 67% conversion (2/3 locks led to upgrades)

### Summary Stats
- **Total Preset Clicks**: 6
- **Feature Lock Views**: 4
- **Latest Cohort Retention**: ~72%
- **Total Runs (30d)**: 12

## 5. Troubleshooting

### No Data Showing
1. Check if test users were created: `SELECT COUNT(*) FROM auth.users WHERE email LIKE 'test%@example.com';`
2. Verify events inserted: `SELECT COUNT(*) FROM analytics_events;`
3. Check view permissions: Ensure admin role is set

### Forecast Panel Empty
1. Run forecast function manually
2. Check forecast table: `SELECT COUNT(*) FROM upgrade_forecasts WHERE forecast_date = CURRENT_DATE;`
3. Verify function logs in Supabase dashboard

### Charts Not Rendering
1. Check browser console for errors
2. Verify Recharts library is installed
3. Refresh the page after data insertion

## 6. Reset Test Data

```sql
-- Clean up test data
DELETE FROM analytics_events WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

DELETE FROM upgrade_forecasts WHERE forecast_date = CURRENT_DATE;
DELETE FROM model_daily_metrics WHERE day >= CURRENT_DATE - 5;

DELETE FROM auth.users WHERE email LIKE 'test%@example.com';
```

Your BI dashboard should now be fully populated with realistic test data! 📊