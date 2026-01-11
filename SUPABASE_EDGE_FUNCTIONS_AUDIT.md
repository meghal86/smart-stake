# Supabase Edge Functions Audit

**Generated:** January 10, 2026  
**Total Functions:** 115+ directories

## Summary

This document audits all Supabase Edge Functions to identify:
- ✅ **KEEP** - Active, valid functions in use
- ⚠️ **REVIEW** - May have duplicates or need consolidation
- ❌ **DELETE** - Deprecated, broken, or duplicate functions

---

## 🔴 RECOMMENDED FOR DELETION

### Cockpit Functions (Duplicates of Next.js API Routes)

| Function | Reason | Action |
|----------|--------|--------|
| `cockpit-summary` | Duplicate of `src/app/api/cockpit/summary/route.ts` | ❌ DELETE |
| `cockpit-actions-rendered` | Duplicate of `src/app/api/cockpit/actions/rendered/route.ts` | ❌ DELETE |

**Note:** The cockpit endpoints are implemented as Next.js API routes. The Edge Functions are redundant duplicates.

### Health Check Duplicates

| Function | Reason | Action |
|----------|--------|--------|
| `health` | Simple health check - redundant with `healthz` | ❌ DELETE |
| `health-check` | Comprehensive but overlaps with `healthz` | ⚠️ CONSOLIDATE |
| `healthz` | Keep as primary health endpoint | ✅ KEEP |
| `guardian-healthz` | Guardian-specific health | ✅ KEEP |
| `odyssey-healthz` | Empty/broken directory | ❌ DELETE |
| `ops-health` | Review if needed | ⚠️ REVIEW |

### Guardian Duplicates

| Function | Reason | Action |
|----------|--------|--------|
| `guardian-scan` | v1 implementation | ⚠️ DEPRECATE (keep v2) |
| `guardian-scan-v2` | SSE streaming version - primary | ✅ KEEP |
| `guardian-revoke` | v1 implementation | ⚠️ DEPRECATE (keep v2) |
| `guardian-revoke-v2` | Idempotent with pre-simulation | ✅ KEEP |
| `guardian-multi-scan` | Mock implementation only | ⚠️ REVIEW |
| `guardian-automation-propose` | Review usage | ⚠️ REVIEW |

---

## ✅ KEEP - Active Functions

### Core Business Logic

| Function | Purpose | Status |
|----------|---------|--------|
| `guardian-scan-v2` | SSE streaming wallet security scan | ✅ ACTIVE |
| `guardian-revoke-v2` | Idempotent approval revocation | ✅ ACTIVE |
| `guardian-healthz` | Guardian service health check | ✅ ACTIVE |

### Wallet Registry

| Function | Purpose | Status |
|----------|---------|--------|
| `wallets-add-watch` | Add wallet with ENS resolution | ✅ ACTIVE |
| `wallets-list` | List user wallets with quota | ✅ ACTIVE |
| `wallets-remove` | Remove wallet with atomic primary reassignment | ✅ ACTIVE |
| `wallets-set-primary` | Set primary wallet atomically | ✅ ACTIVE |
| `wallets-remove-address` | Remove wallet by address | ✅ ACTIVE |
| `wallet-registry-scan` | Scheduled wallet scanning job | ✅ ACTIVE |

### HarvestPro (Tax Loss Harvesting)

| Function | Purpose | Status |
|----------|---------|--------|
| `harvest-sync-wallets` | Sync on-chain transactions | ✅ ACTIVE |
| `harvest-sync-cex` | Sync CEX trades | ✅ ACTIVE |
| `harvest-recompute-opportunities` | Calculate tax loss opportunities | ✅ ACTIVE |
| `harvest-notify` | Send harvest notifications | ✅ ACTIVE |

### Hunter (Opportunities)

| Function | Purpose | Status |
|----------|---------|--------|
| `hunter-opportunities` | Fetch yield opportunities | ✅ ACTIVE |
| `hunter-refresh` | Refresh opportunity data | ✅ ACTIVE |

### Stripe/Subscriptions

| Function | Purpose | Status |
|----------|---------|--------|
| `create-checkout-session` | Create Stripe checkout | ✅ ACTIVE |
| `create-subscription` | Create subscription | ✅ ACTIVE |
| `manage-subscription` | Manage existing subscription | ✅ ACTIVE |
| `stripe-webhook` | Handle Stripe webhooks | ✅ ACTIVE |
| `simple-subscription` | Simplified subscription flow | ⚠️ REVIEW |
| `simple-webhook` | Simplified webhook handler | ⚠️ REVIEW |

### Notifications

| Function | Purpose | Status |
|----------|---------|--------|
| `notification-delivery` | Deliver notifications | ✅ ACTIVE |
| `alert-notifications` | Alert-based notifications | ✅ ACTIVE |
| `multi-channel-alerts` | Multi-channel alert delivery | ✅ ACTIVE |
| `test-notifications` | Dev testing endpoint | ✅ KEEP (dev only) |

### Whale Analytics

| Function | Purpose | Status |
|----------|---------|--------|
| `whale-alerts` | Whale movement alerts | ✅ ACTIVE |
| `whale-analytics` | Whale behavior analytics | ✅ ACTIVE |
| `whale-behavior-engine` | Behavior pattern detection | ✅ ACTIVE |
| `whale-clusters` | Whale clustering analysis | ⚠️ REVIEW |
| `whale-clusters-fixed` | Fixed clustering | ⚠️ CONSOLIDATE |
| `whale-notifications` | Whale-specific notifications | ✅ ACTIVE |
| `whale-predictions` | Whale movement predictions | ✅ ACTIVE |
| `whale-profile` | Whale profile data | ✅ ACTIVE |
| `whale-signal-processor` | Process whale signals | ✅ ACTIVE |
| `live-whale-tracker` | Real-time whale tracking | ✅ ACTIVE |
| `real-whale-alerts` | Real-time whale alerts | ⚠️ REVIEW (duplicate?) |
| `fetchWhales` | Fetch whale data | ✅ ACTIVE |
| `sync-whale-data` | Sync whale data | ✅ ACTIVE |
| `populate-whale-data` | Populate whale data | ⚠️ REVIEW (one-time?) |
| `cleanup-whale-signals` | Clean old signals | ✅ ACTIVE |

### Market Intelligence

| Function | Purpose | Status |
|----------|---------|--------|
| `market-intelligence-hub` | Market intelligence aggregation | ✅ ACTIVE |
| `market-summary` | Market summary data | ⚠️ REVIEW |
| `market-summary-enhanced` | Enhanced market summary | ⚠️ CONSOLIDATE |
| `market-kpis` | Market KPI metrics | ✅ ACTIVE |
| `market-chain-risk` | Chain risk analysis | ⚠️ REVIEW |
| `market-chain-risk-quant` | Quantitative chain risk | ⚠️ CONSOLIDATE |
| `market-maker-sentinel` | Market maker monitoring | ✅ ACTIVE |

### Prices

| Function | Purpose | Status |
|----------|---------|--------|
| `prices` | Price data endpoint | ✅ ACTIVE |
| `prices-summary` | Price summary | ✅ ACTIVE |

### AI/ML Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `ai-sentiment` | AI sentiment analysis | ✅ ACTIVE |
| `ai-wallet-analyzer` | AI wallet analysis | ✅ ACTIVE |
| `ml-predictions` | ML predictions | ✅ ACTIVE |
| `ml-training` | ML model training | ✅ ACTIVE |
| `ml-cron` | ML scheduled jobs | ✅ ACTIVE |
| `feature-engineering` | Feature engineering | ✅ ACTIVE |
| `advanced-whale-predictions` | Advanced predictions | ✅ ACTIVE |

### Risk/Security

| Function | Purpose | Status |
|----------|---------|--------|
| `auto-risk-scanner` | Automated risk scanning | ✅ ACTIVE |
| `riskScan` | Risk scanning | ⚠️ REVIEW (duplicate?) |
| `chain-risk` | Chain risk analysis | ✅ ACTIVE |
| `chainalysis-sanctions` | Sanctions screening | ✅ ACTIVE |
| `anomaly-detector` | Anomaly detection | ✅ ACTIVE |

### Data Ingestion

| Function | Purpose | Status |
|----------|---------|--------|
| `data-ingestion` | General data ingestion | ✅ ACTIVE |
| `blockchain-monitor` | Blockchain monitoring | ✅ ACTIVE |
| `multi-chain-tracker` | Multi-chain tracking | ✅ ACTIVE |
| `ingest_unlocks` | Token unlock ingestion | ✅ ACTIVE |
| `ingest_whale_index` | Whale index ingestion | ✅ ACTIVE |

### Portfolio

| Function | Purpose | Status |
|----------|---------|--------|
| `portfolio-tracker` | Portfolio tracking | ⚠️ REVIEW |
| `portfolio-tracker-live` | Live portfolio tracking | ⚠️ CONSOLIDATE |

### Alerts

| Function | Purpose | Status |
|----------|---------|--------|
| `alerts-stream` | Alert streaming | ✅ ACTIVE |
| `alerts-classify-quant` | Quantitative alert classification | ✅ ACTIVE |
| `custom-alert-processor` | Custom alert processing | ✅ ACTIVE |
| `watchlist-alerts` | Watchlist-based alerts | ✅ ACTIVE |
| `debug-alerts` | Debug alerts (dev) | ⚠️ REVIEW |

### Misc/Utility

| Function | Purpose | Status |
|----------|---------|--------|
| `healthz` | Primary health check | ✅ ACTIVE |
| `verify-session` | Session verification | ✅ ACTIVE |
| `user-notes` | User notes CRUD | ✅ ACTIVE |
| `log-attribution` | Attribution logging | ✅ ACTIVE |
| `accuracy-tracker` | Prediction accuracy tracking | ✅ ACTIVE |
| `coverage-monitor` | Coverage monitoring | ✅ ACTIVE |
| `api-monitor` | API monitoring | ✅ ACTIVE |
| `bi-summary` | BI summary data | ✅ ACTIVE |
| `roi_analytics` | ROI analytics | ✅ ACTIVE |
| `roi-digest` | ROI digest | ⚠️ CONSOLIDATE |
| `drift-daily` | Daily drift analysis | ✅ ACTIVE |
| `correlation-enhanced` | Enhanced correlation | ✅ ACTIVE |
| `forecast-upgrades` | Forecast upgrades | ✅ ACTIVE |
| `subscription-reminders` | Subscription reminders | ✅ ACTIVE |
| `crypto-news` | Crypto news feed | ✅ ACTIVE |
| `fetch-sentiment` | Fetch sentiment data | ✅ ACTIVE |
| `fetchYields` | Fetch yield data | ✅ ACTIVE |
| `multi-coin-sentiment` | Multi-coin sentiment | ✅ ACTIVE |
| `nft-whale-tracker` | NFT whale tracking | ✅ ACTIVE |
| `notify_streak` | Streak notifications | ✅ ACTIVE |

### Scenario/Export

| Function | Purpose | Status |
|----------|---------|--------|
| `scenario-simulate` | Scenario simulation | ✅ ACTIVE |
| `scenario-save` | Save scenarios | ✅ ACTIVE |
| `scenario-export` | Export scenarios | ✅ ACTIVE |
| `export-csv-pro` | Pro CSV export | ✅ ACTIVE |
| `metrics-scenarios-summary` | Metrics scenarios | ✅ ACTIVE |

---

## ⚠️ NEEDS REVIEW

### One-Time Setup Functions (May Delete After Use)

| Function | Purpose | Action |
|----------|---------|--------|
| `add-stripe-columns` | DB migration | ❌ DELETE if migrated |
| `create-chain-risk-view` | DB view creation | ❌ DELETE if created |
| `create-table` | Generic table creation | ❌ DELETE |
| `create-whale-table` | Whale table creation | ❌ DELETE if created |
| `fix-plan` | Plan fix migration | ❌ DELETE if fixed |
| `fix-subscription` | Subscription fix | ❌ DELETE if fixed |
| `clear-users` | Clear users (dangerous) | ❌ DELETE |
| `test-user-plan` | Test user plan | ⚠️ REVIEW |

### Webhook Handlers

| Function | Purpose | Action |
|----------|---------|--------|
| `webhooks` | Generic webhooks | ⚠️ REVIEW |
| `stripe-webhook` | Stripe webhooks | ✅ KEEP |
| `simple-webhook` | Simple webhook | ⚠️ CONSOLIDATE |

---

## 📁 Shared Libraries

| Directory | Purpose | Status |
|-----------|---------|--------|
| `_lib/` | Shared library code | ✅ KEEP |
| `_shared/` | Shared utilities | ✅ KEEP |
| `_shared/harvestpro/` | HarvestPro shared logic | ✅ KEEP |
| `_shared/cors.ts` | CORS headers | ✅ KEEP |
| `_shared/rate-limit.ts` | Rate limiting | ✅ KEEP |
| `_shared/idempotency.ts` | Idempotency handling | ✅ KEEP |

---

## Recommended Actions

### Immediate Deletions (Safe)

```bash
# Delete cockpit duplicates (Next.js API routes exist)
rm -rf supabase/functions/cockpit-summary
rm -rf supabase/functions/cockpit-actions-rendered

# Delete empty/broken directories
rm -rf supabase/functions/odyssey-healthz

# Delete one-time migration scripts (if already run)
rm -rf supabase/functions/add-stripe-columns
rm -rf supabase/functions/create-chain-risk-view
rm -rf supabase/functions/create-table
rm -rf supabase/functions/create-whale-table
rm -rf supabase/functions/fix-plan
rm -rf supabase/functions/fix-subscription
rm -rf supabase/functions/clear-users
```

### Consolidation Needed

1. **Health Checks**: Keep `healthz` as primary, delete `health`, consolidate `health-check` features into `healthz`

2. **Guardian**: Deprecate v1 functions (`guardian-scan`, `guardian-revoke`), keep v2 versions

3. **Whale Clusters**: Consolidate `whale-clusters` and `whale-clusters-fixed`

4. **Market Summary**: Consolidate `market-summary` and `market-summary-enhanced`

5. **Portfolio Tracker**: Consolidate `portfolio-tracker` and `portfolio-tracker-live`

6. **ROI**: Consolidate `roi_analytics` and `roi-digest`

### Before Deleting

1. Check if function is called from frontend code
2. Check if function is scheduled via pg_cron
3. Check if function is called from other edge functions
4. Verify no active users depend on the endpoint

---

## Function Count Summary

| Category | Count |
|----------|-------|
| ✅ KEEP | ~70 |
| ⚠️ REVIEW | ~25 |
| ❌ DELETE | ~10 |
| **Total** | ~105 |

---

## Next Steps

1. **Delete cockpit duplicates** - These are definitely redundant
2. **Delete one-time migration scripts** - Verify migrations are complete first
3. **Consolidate health checks** - Keep one primary endpoint
4. **Deprecate v1 Guardian functions** - After confirming v2 is stable
5. **Review whale/market duplicates** - Consolidate where possible
