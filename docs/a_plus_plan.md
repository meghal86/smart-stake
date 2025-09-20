# WhalePlus A+ Implementation Plan

## Overview
Upgrade path from A- to A+ grade enterprise-ready scenarios system.

## Phase 1: Storage & Performance ✅
- **Partitioning**: Time-based partitions for scenario_runs
- **Caching**: Redis-based caching with 30s-5min TTL
- **Hot Presets**: Precomputed popular scenarios
- **Cold Storage**: Archive policy for 6mo+ data

## Phase 2: Model Lifecycle (In Progress)
- **A/B Testing**: Model versioning with rollout controls
- **Drift Monitoring**: Live accuracy tracking vs backtests
- **Auto-calibration**: Platt scaling for model updates

## Phase 3: BI & Monetization
- **Product Analytics**: Preset→upgrade attribution
- **Conversion Funnel**: Feature lock→upgrade tracking
- **Retention Metrics**: Scenario usage patterns

## Phase 4: Enterprise Trust
- **Audit Logging**: All export/share/alert actions
- **SSO Readiness**: SAML/OIDC preparation
- **Export Watermarking**: Compliance features

## Phase 5: SLOs & Observability
- **Performance**: p95 <300ms cached, <700ms uncached
- **Reliability**: 99.9% uptime, <0.5% error rate
- **Monitoring**: Datadog/Sentry integration

## SLO Targets
```
p95_latency_ms: <300 (cached) / <700 (uncached)
error_rate: <0.5%
uptime: >99.9%
cache_hit_rate: >40% (after 7 days)
model_accuracy_30d: >70%
```

## Deployment
```bash
# Apply migrations
supabase db push

# Deploy functions
supabase functions deploy scenario-simulate
supabase functions deploy scenario-export

# Set up monitoring
# Configure Datadog/Sentry alerts
```

## Runbook
- **Cache Miss Spike**: Check Redis, enable precompute
- **Drift Alert**: Freeze rollout, revert model
- **Slow Queries**: Verify partitions, check indexes
- **Rate Limits**: Adjust thresholds or cache TTL