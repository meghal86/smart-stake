# AlphaWhale - Whale Intelligence Platform

A unified Next.js 14 monorepo for the AlphaWhale whale intelligence platform with automated data correctness and quality monitoring.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

## 📊 Data Quality & Monitoring

### Automated Data Correctness

The platform includes comprehensive data quality monitoring:

- **SQL Invariants**: Automated checks for negative USD amounts, missing hashes, data consistency
- **Freshness SLOs**: Alerts when data is >10 minutes stale
- **Provenance Tracking**: Monitors ratio of Real vs Simulated data
- **Reconciliation**: Hourly comparison with Etherscan/Alchemy sources

### Supabase Functions

#### Scheduled Functions

```bash
# Reconciliation (hourly at :07)
supabase functions invoke reconcile

# Backfill (nightly at 02:15)  
supabase functions invoke backfill_24h

# QC Alerts (every 15 minutes)
supabase functions invoke qc-alerts
```

#### Manual Deployment

```bash
# Deploy all functions
supabase functions deploy reconcile
supabase functions deploy backfill_24h  
supabase functions deploy qc-alerts
supabase functions deploy uptime-monitor
```

### Cron Schedule

Configure in Supabase Dashboard > Edge Functions > Cron:

```sql
-- Reconciliation: Every hour at 7 minutes past
SELECT cron.schedule('reconcile-hourly', '7 * * * *', 'https://your-project.supabase.co/functions/v1/reconcile');

-- Backfill: Daily at 2:15 AM
SELECT cron.schedule('backfill-nightly', '15 2 * * *', 'https://your-project.supabase.co/functions/v1/backfill_24h');

-- QC Alerts: Every 15 minutes
SELECT cron.schedule('qc-alerts', '*/15 * * * *', 'https://your-project.supabase.co/functions/v1/qc-alerts');

-- Uptime Monitor: Every 5 minutes  
SELECT cron.schedule('uptime-monitor', '*/5 * * * *', 'https://your-project.supabase.co/functions/v1/uptime-monitor');
```

### Environment Variables

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Data Providers
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key

# Monitoring
SLACK_WEBHOOK_URL=your_slack_webhook
APP_URL=https://your-app.com

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn
```

## 🔍 Monitoring Endpoints

- **Health Check**: `/api/healthz` - System health with data quality metrics
- **Status Page**: `/status` - Public status dashboard  
- **Ops Dashboard**: `/internal/ops` - Internal metrics and error budgets

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Data quality tests
pnpm test data-quality

# E2E tests
pnpm test:e2e
```

## 📈 Data Quality Metrics

### Invariants Monitored

- **Negative USD**: `sum((amount_usd < 0)::int)` should be 0
- **Missing TX Hash**: `sum((tx_hash IS NULL OR tx_hash='')::int)` should be 0  
- **Missing Wallet**: `sum((wallet_hash IS NULL OR wallet_hash='')::int)` should be 0

### Freshness SLOs

- **Warning**: Data age 180-600 seconds
- **Critical**: Data age >600 seconds (10 minutes)

### Provenance Thresholds

- **Healthy**: >40% Real data in last 2 hours
- **Degraded**: <40% Real data triggers alerts

## 🚨 Alert Conditions

Slack alerts are sent when:

- Any invariant violations detected
- Data freshness exceeds 10 minutes
- Real data ratio drops below 40% for 2+ hours
- Reconciliation variance exceeds tolerances
- Provider APIs are down or degraded

## 🔧 Development

### Feature Flags

```bash
# Get flag value
node scripts/flags.ts get ui.v2

# Set flag value  
node scripts/flags.ts set ui.v2 true

# Ramp percentage
node scripts/flags.ts ramp ui.v2 50
```

### Safe Rollouts

Use GitHub Actions workflow:

```bash
# Trigger safe rollout
gh workflow run safe-rollout.yml -f feature_flag=ui.v2 -f environment=production
```

## 📊 Architecture

- **Frontend**: Next.js 14 with App Router
- **Database**: Supabase with automated views
- **Functions**: Supabase Edge Functions for data processing
- **Monitoring**: Sentry + custom health checks
- **Alerts**: Slack webhooks for critical issues

---

Built with enterprise-grade data quality and monitoring. 🚀