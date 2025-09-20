# Drift Monitoring Setup Guide

## Overview
This guide sets up automated daily drift monitoring for WhalePlus Scenarios with model accuracy tracking, alerting, and auto-disabling of underperforming models.

## Prerequisites
- ✅ Scenarios v2 deployed
- ✅ App deployed to Vercel
- ✅ GitHub repository with Actions enabled

## Step 1: Deploy Database Changes

```bash
# Apply drift monitoring schema
supabase db push
```

**What this creates:**
- `model_daily_metrics` - Daily accuracy tracking (7d/30d/90d hit rates)
- `drift_alerts` - Alert history and consecutive day tracking
- `model_versions.baseline_hit_rate_30d` - Baseline comparison values

## Step 2: Deploy Edge Functions

```bash
# Deploy drift monitoring function
supabase functions deploy drift-daily

# Deploy metrics summary for UI
supabase functions deploy metrics-scenarios-summary
```

## Step 3: Set Up GitHub Actions Cron

### 3.1 Add GitHub Secrets
Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
```
Name: SUPABASE_URL
Value: https://rebeznxivaxgserswhbn.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY  
Value: [Your Supabase service role key from dashboard]
```

### 3.2 Verify Workflow File
The workflow file is already created at `.github/workflows/drift-monitoring.yml`

It will run daily at 6 AM UTC automatically.

### 3.3 Test Manual Run
1. Go to **Actions** tab in GitHub
2. Click **"Daily Drift Monitoring"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Check logs for success

## Step 4: Optional Slack Alerts

```bash
# Set Slack webhook for alerts (optional)
supabase secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## Step 5: Verify UI Integration

Visit your app at `/predictions?tab=scenarios`

You should see the metrics header showing:
- **Accuracy**: 0.0% / 0.0% / 0.0% (will populate after first run)
- **Avg Confidence**: 0.0%
- **Runs Today**: 0

## How It Works

### Daily Process (6 AM UTC)
1. **Compute Metrics**: Joins `scenario_runs` ↔ `scenario_outcomes` for last 90 days
2. **Calculate Hit Rates**: 7d/30d/90d accuracy per model version
3. **Store Results**: Upserts into `model_daily_metrics`
4. **Check Drift**: Compares 30d rate vs baseline (default 72%)
5. **Alert & Disable**: If >5pp drop for 2+ days → Slack alert + set `rollout_percent=0`

### Drift Alert Triggers
- **Threshold**: 30d hit rate drops >5 percentage points below baseline
- **Duration**: Must persist for 2+ consecutive days
- **Action**: Slack notification + automatic model disabling

### UI Dashboard
- **Real-time**: Fetches latest metrics on page load
- **Fallback**: Shows 0.0% if no data available
- **Auto-refresh**: Updates timestamp on each fetch

## Testing

### Manual Function Test
```bash
# Test drift monitoring directly
curl -X POST "https://rebeznxivaxgserswhbn.supabase.co/functions/v1/drift-daily" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Test metrics summary
curl "https://rebeznxivaxgserswhbn.supabase.co/functions/v1/metrics-scenarios-summary"
```

### Simulate Drift Alert
```sql
-- In Supabase SQL Editor, simulate poor performance
INSERT INTO model_daily_metrics (day, model_version, hit_rate_30d, avg_confidence, runs) 
VALUES 
  (CURRENT_DATE - 1, 'scn-v1.0', 0.65, 0.75, 50),  -- 65% vs 72% baseline = 7pp drop
  (CURRENT_DATE, 'scn-v1.0', 0.64, 0.74, 45);      -- 2nd consecutive day

-- Run drift check
-- Should trigger alert and disable model
```

## Monitoring

### Check Cron Status
- **GitHub Actions**: Actions tab → Recent workflow runs
- **Logs**: Click on any run to see detailed logs
- **Failures**: GitHub will email you if cron fails

### Database Queries
```sql
-- View recent metrics
SELECT * FROM model_daily_metrics ORDER BY day DESC LIMIT 10;

-- Check active alerts
SELECT * FROM drift_alerts WHERE resolved_at IS NULL;

-- View model status
SELECT name, is_active, rollout_percent, baseline_hit_rate_30d 
FROM model_versions;
```

## Troubleshooting

### Cron Not Running
- Check GitHub Actions tab for errors
- Verify secrets are set correctly
- Ensure workflow file is in main branch

### No Metrics Data
- Verify `scenario_outcomes` table has data
- Check Edge Function logs in Supabase dashboard
- Run manual test curl command

### UI Shows 0.0%
- Wait for first cron run (6 AM UTC)
- Check browser console for fetch errors
- Verify `metrics-scenarios-summary` function deployed

### False Alerts
- Adjust baseline in `model_versions.baseline_hit_rate_30d`
- Modify threshold in drift-daily function (currently 0.05 = 5pp)

## Maintenance

### Monthly Tasks
- Review drift alerts and model performance
- Update baselines if needed
- Check Slack webhook still works

### Scaling Considerations
- Cron runs in <30s with current data volumes
- GitHub Actions has 2000 minutes/month free limit
- Consider Supabase pg_cron for high-frequency needs

## Files Created
```
.github/workflows/drift-monitoring.yml    # GitHub Actions cron
supabase/functions/drift-daily/           # Daily monitoring function  
supabase/functions/metrics-scenarios-summary/  # UI metrics endpoint
src/components/scenarios/ScenariosMetricsHeader.tsx  # UI component
supabase/migrations/20250122000011_drift_monitoring.sql  # Database schema
```

## Success Criteria
- ✅ Cron runs daily without errors
- ✅ UI shows live accuracy metrics  
- ✅ Drift alerts trigger correctly
- ✅ Poor models get disabled automatically
- ✅ Slack notifications work (if configured)

Your drift monitoring system is now production-ready! 🎯