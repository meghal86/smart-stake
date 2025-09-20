# P0 QA Acceptance Tests

## 1. Ground-Truth Labeling Test

**Objective**: Verify predictions are auto-labeled after horizon

```sql
-- 1. Create test prediction
INSERT INTO scenario_runs (user_id, inputs, outputs, confidence, delta_pct, created_at) VALUES
  (gen_random_uuid(), '{"asset":"ETH","timeframe":"2h"}', '{"deltaPct":2.5}', 0.75, 2.5, NOW() - INTERVAL '3 hours');

-- 2. Run labeling function
SELECT label_prediction_outcomes();

-- 3. Verify outcome exists
SELECT COUNT(*) FROM scenario_outcomes WHERE created_at > NOW() - INTERVAL '1 minute';
-- Expected: 1 new row

-- 4. Check accuracy tiles update
SELECT * FROM model_daily_metrics WHERE day = CURRENT_DATE;
-- Expected: Updated within 5 minutes
```

## 2. Alert Quality Guardrails Test

**Objective**: Verify alert cooldowns and thresholds work

```sql
-- 1. Test below threshold (should not fire)
SELECT should_fire_alert('ETH', 0.6, 1.5);
-- Expected: FALSE (below min confidence/impact)

-- 2. Test above threshold (should fire)  
SELECT should_fire_alert('ETH', 0.8, 3.0);
-- Expected: TRUE

-- 3. Test cooldown (should not fire again)
SELECT should_fire_alert('ETH', 0.8, 3.0);
-- Expected: FALSE (in cooldown)

-- 4. Simulate 10 borderline events in 10 minutes
-- Expected: Only 1-2 alerts fire, none below threshold
```

## 3. Tier Enforcement Test

**Objective**: Verify server-side tier checks return 403

```bash
# Test export endpoint with free token
curl -X POST "https://your-project.supabase.co/functions/v1/scenario-export" \
  -H "Authorization: Bearer FREE_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"test","format":"csv"}'
# Expected: 403 + {"error": "Upgrade required: export requires premium+ subscription"}

# Test backtest with pro token (should work)
curl -X POST "https://your-project.supabase.co/functions/v1/scenario-backtest" \
  -H "Authorization: Bearer PRO_USER_TOKEN"
# Expected: 200 OK

# Test forensics with premium token  
curl -X POST "https://your-project.supabase.co/functions/v1/scenario-forensics" \
  -H "Authorization: Bearer PREMIUM_USER_TOKEN"
# Expected: 403 (requires enterprise)
```

## 4. Stale Data State Test

**Objective**: Verify UI handles provider degradation

```sql
-- 1. Simulate stale price data
UPDATE price_cache SET updated_at = NOW() - INTERVAL '10 minutes' WHERE asset = 'ETH';

-- 2. Visit scenarios page
-- Expected: "Backup / Stale (10 min)" badge visible
-- Expected: Export button disabled
-- Expected: No crashes or errors
```

## 5. E2E Flow Test

**Objective**: Verify tier-specific experiences

### Free User Flow
1. Visit `/predictions?tab=scenarios`
2. Run "CEX Inflows Spike" preset
3. See headline + delta only (no detailed breakdown)
4. Click "Export" → See upgrade prompt
5. Click "Save" → See upgrade prompt

### Pro User Flow  
1. Same scenario run
2. See full breakdown with features
3. Can save scenarios to history
4. Export disabled (Premium feature)

### Premium User Flow
1. See price cone bands
2. Export works (CSV download)
3. Backtest data visible

### Enterprise User Flow
1. See "Promote to Alert" CTA
2. Forensics panel visible
3. Unrestricted sharing

## 6. Load Test

**Objective**: Verify performance under load

```bash
# Install k6 or use curl in loop
for i in {1..100}; do
  curl -X POST "https://your-project.supabase.co/functions/v1/scenario-simulate" \
    -H "Authorization: Bearer SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"inputs":{"asset":"ETH","timeframe":"6h","whaleCount":3,"txnSize":100,"direction":"accumulation","marketCondition":"neutral","cexFlowBias":0}}' &
done
wait

# Check logs for:
# - Error rate < 1%
# - p95 latency < 700ms  
# - Cache hits on repeated queries
# - X-Cache: hit headers
```

## 7. Explainer Test

**Objective**: Verify every result has inline reasoning

1. Run various scenarios with different inputs
2. Check each result has `explainer` field
3. Verify explainer mentions top 2-3 features
4. Example: "Driven by buying pressure with elevated whale activity and exchange flows."

## 8. Alert Simulation Test

**Objective**: Test alert storm prevention

```sql
-- Generate 10 high-impact scenarios rapidly
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO scenario_runs (user_id, inputs, outputs, confidence, delta_pct, created_at) VALUES
      (gen_random_uuid(), '{"asset":"ETH"}', '{"deltaPct":5.0}', 0.85, 5.0, NOW());
  END LOOP;
END $$;

-- Check alert_cooldowns table
SELECT * FROM alert_cooldowns WHERE asset = 'ETH';
-- Expected: Only 1-2 alerts fired, proper cooldown recorded
```

## Success Criteria

✅ **Ground-truth**: Outcomes auto-labeled, accuracy tiles update  
✅ **Guardrails**: Alert cooldowns work, precision improves  
✅ **Explainers**: Every card shows 1-sentence reasoning  
✅ **Tier checks**: 403 responses with machine-readable codes  
✅ **Stale mode**: UI shows degraded state gracefully  
✅ **E2E flows**: All tier experiences work correctly  
✅ **Load test**: p95 < 700ms, error rate < 1%, cache hits visible

## Failure Scenarios

❌ **No outcomes**: Check cron job, function permissions  
❌ **Alert storms**: Verify cooldown logic, threshold settings  
❌ **Missing explainers**: Check feature ranking, template logic  
❌ **Tier bypass**: Verify JWT validation, RLS policies  
❌ **UI crashes**: Check error boundaries, fallback states  
❌ **Poor performance**: Check caching, query optimization