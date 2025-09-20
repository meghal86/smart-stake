# 🚀 WhalePlus - Complete System Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Production Ready  
**Internal Codename**: Smart Stake

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Predictions Page](#predictions-page)
3. [Business Intelligence Dashboard](#business-intelligence-dashboard)
4. [Operations Dashboard](#operations-dashboard)
5. [Edge Functions Reference](#edge-functions-reference)
6. [Database Schema](#database-schema)
7. [Upcoming Features](#upcoming-features)

---

## 🎯 System Overview

WhalePlus is an enterprise-grade crypto prediction and analytics platform with three core modules:

- **Predictions**: ML-powered scenario analysis with real-time alerts
- **Business Intelligence**: Attribution tracking and conversion analytics
- **Operations**: System health monitoring and SLO management

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth + OAuth
- **Payments**: Stripe + Webhooks
- **Monitoring**: Custom SLO dashboard + Attribution tracking

---

## 🔮 Predictions Page

### **Purpose**
Provides ML-powered cryptocurrency scenario analysis with tiered access controls and real-time alerting system.

### **Core Features**

#### ✅ **Implemented**

**1. Scenario Simulation Engine**
- **Purpose**: Generate price predictions based on whale activity patterns
- **Tiers**: Free (basic), Pro (detailed), Premium (export), Enterprise (forensics)
- **Models**: Logistic regression with feature engineering
- **Performance**: Sub-700ms p95 latency with caching

**2. Ground-Truth Outcome Labeling**
- **Purpose**: Auto-validate predictions after time horizon expires
- **Process**: Cron job runs every 15 minutes to label outcomes
- **Metrics**: Hit rate, MAPE, confidence calibration
- **Storage**: `scenario_outcomes` table with accuracy tracking

**3. Alert Quality Guardrails**
- **Purpose**: Prevent alert storms and maintain precision
- **Thresholds**: Min confidence 70-75%, min impact 2-3%
- **Cooldowns**: 30-45 min per asset, max 2 alerts/hour
- **Logic**: `should_fire_alert()` function with asset-specific rules

**4. Inline Explainers**
- **Purpose**: Provide reasoning for each prediction
- **Format**: "Driven by [direction] with elevated [top features]"
- **Generation**: Deterministic templates, no AI calls required
- **Display**: Blue pill under prediction headline

**5. Tier Enforcement**
- **Purpose**: Server-side subscription validation
- **Implementation**: `enforceTier()` middleware on all endpoints
- **Responses**: 403 with machine-readable error codes
- **Features**: Export (Premium+), Backtests (Pro+), Forensics (Enterprise)

### **Edge Functions**

#### **scenario-simulate**
- **Endpoint**: `/functions/v1/scenario-simulate`
- **Purpose**: Generate ML predictions with caching and validation
- **Input**: Asset, timeframe, whale parameters, market conditions
- **Output**: Delta %, confidence, features, price cone, explainer
- **Performance**: 300ms cached, 600ms uncached
- **Tier Check**: Validates user subscription level

#### **scenario-export** 
- **Endpoint**: `/functions/v1/scenario-export`
- **Purpose**: Generate CSV/PDF exports of scenario results
- **Tier Required**: Premium+
- **Features**: Watermarked exports, usage tracking
- **Formats**: CSV, PDF with charts
- **Metadata**: All exports include prediction_id, model_version, user_tier stamp for auditability and context

#### **scenario-backtest**
- **Endpoint**: `/functions/v1/scenario-backtest`
- **Purpose**: Historical validation of prediction accuracy
- **Tier Required**: Pro+
- **Output**: Hit rates, MAPE trends, confidence intervals

#### **scenario-forensics**
- **Endpoint**: `/functions/v1/scenario-forensics`
- **Purpose**: Deep-dive analysis with whale transaction details
- **Tier Required**: Enterprise
- **Features**: Transaction clustering, wallet analysis

### **Database Tables**

```sql
-- Core prediction storage
scenario_runs (id, user_id, inputs, outputs, confidence, created_at)
scenario_outcomes (id, scenario_run_id, correct, recorded_at)
scenario_cache (cache_key, result, expires_at)

-- Alert management
alert_cooldowns (asset, last_alert_at, alert_count_1h)
alert_thresholds (asset, min_confidence, min_expected_impact)

-- Model performance
model_daily_metrics (day, hit_rate_7d, hit_rate_30d, avg_confidence)
request_metrics (prediction_id, latency_ms, cache_status)
```

### **🔄 Upcoming Features**

#### **P1 - Next Sprint**
- [ ] **Backtest Replay Modal**: Historical signal validation with realized paths
- [ ] **Create Alert from Signal**: One-click alert setup from prediction cards
- [ ] **Share Card Feature**: PNG generation with tier-based redaction
- [ ] **Model Card Documentation**: Version info, training data, known limits

#### **P2 - Future Releases**
- [ ] **Per-User Calibration**: Individual hit rate tracking and display
- [ ] **Multi-Asset Bundling**: Linked signals (ETH → BTC spillover)
- [ ] **Data Glossary**: Tooltips for whale volume, time clustering terms
- [ ] **Incident Banner**: Health status with /health/predictions endpoint

---

## 📊 Business Intelligence Dashboard

### **Purpose**
Provides growth analytics with attribution tracking, conversion funnels, and segmentation filters for data-driven decision making.

### **Core Features**

#### ✅ **Implemented**

**1. Attribution Tracking System**
- **Purpose**: Track user journey from preset clicks to upgrades
- **Windows**: 72h for presets, 24h for feature locks
- **Logic**: Last-touch attribution with automatic trigger functions
- **Coverage**: >60% preset attribution, >40% lock attribution

**2. Conversion Funnels**
- **Preset → Upgrade**: 72h conversion tracking by preset type
- **Feature Lock → Upgrade**: 24h conversion after paywall encounters
- **Cross-Retention**: Usage buckets (0-2, 3-5, 6+ runs) vs upgrade probability
- **Segmentation**: Filter by time, tier, preset, asset

**3. Segmentation Filters**
- **Time Range**: 7d, 30d, 90d, custom date picker
- **User Tier**: All, Free, Pro, Premium, Enterprise
- **Preset Type**: All, CEX Inflows, Accumulation, Spillover
- **Asset**: All, ETH, BTC, SOL
- **Real-time**: All charts update when filters change

**4. Forecasting System**
- **Purpose**: Predict 7-day upgrade probability by segment
- **Model**: Logistic regression on user behavior features
- **Refresh**: Nightly training at 3 AM UTC
- **Output**: Upgrade probability with confidence scores

### **Edge Functions**

#### **bi-summary**
- **Endpoint**: `/functions/v1/bi-summary`
- **Purpose**: Single API call for all dashboard data
- **Input**: Filter parameters (range, tier, preset, asset)
- **Output**: Funnels, retention, forecasts, KPIs, refreshed timestamp
- **Performance**: <100ms with caching, fallback data on errors
- **Security**: Admin-only access, no PII in responses

#### **log-attribution**
- **Endpoint**: `/functions/v1/log-attribution`
- **Purpose**: Server-side event logging (ad-blocker resistant)
- **Events**: Preset clicks, feature locks, session tracking
- **Reliability**: Backup for client-side logging failures

#### **forecast-upgrades**
- **Endpoint**: `/functions/v1/forecast-upgrades`
- **Purpose**: Nightly ML training and prediction generation
- **Schedule**: Cron job at 3 AM UTC
- **Output**: Upgrade forecasts by preset/tier/usage bucket

### **Database Tables**

```sql
-- Attribution events
preset_click_events (id, user_id, preset_key, asset, occurred_at)
feature_lock_events (id, user_id, lock_key, occurred_at)
upgrade_events (id, user_id, new_tier, last_preset_key, last_lock_key)

-- Forecasting
upgrade_forecasts (forecast_date, preset_name, user_tier, predicted_upgrade_rate)
forecast_accuracy (forecast_date, preset_name, mape, accuracy_score)

-- Analytics views
v_preset_to_upgrade (preset_key, clicks, upgrades, conversion_pct)
v_lock_to_upgrade (lock_key, views, upgrades, conversion_pct)
v_cross_retention_upgrades (bucket, users, upgrades, upgrade_pct)
```

### **🔄 Upcoming Features**

#### **P1 - Next Sprint**
- [ ] **Saved Filter Presets**: "Last 7d • Pro • ETH" quick filters
- [ ] **Annotations System**: Free-text notes pinned to dates
- [ ] **Anomaly Alerts**: Slack notifications for >10pp drops or >50% volume changes
- [ ] **Delta Analysis**: "What moved the number?" card with top movers

#### **P2 - Future Releases**
- [ ] **Cohort Analysis**: Weekly signup cohorts with retention curves
- [ ] **Revenue Attribution**: LTV and MRR impact by acquisition channel
- [ ] **A/B Test Integration**: Experiment tracking with statistical significance
- [ ] **Predictive LTV**: ML-powered customer lifetime value forecasting

---

## 🛠️ Operations Dashboard

### **Purpose**
NOC-grade system monitoring with SLO tracking, health validation, and operational controls for maintaining system reliability.

### **Core Features**

#### ✅ **Implemented**

**1. SLO Monitoring with Trends**
- **Hit Rate Tracking**: 7d vs 30d baseline breach detection
- **Latency Monitoring**: P95 < 700ms threshold with alerts
- **24h Trend Charts**: Visual health monitoring with outcomes/hour
- **Cache Performance**: Hit rate tracking and optimization insights

**2. System Validation Tiles**
- **Outcomes Labeled**: Verify prediction labeling pipeline health
- **Alert Storms**: Monitor for excessive alerts (>2/hour per asset)
- **Orphaned Predictions**: Check for unlabeled predictions past horizon
- **Acceptance Rate**: Guardrail effectiveness (target 10-35%). *Definition: Percentage of eligible predictions that triggered alerts (fired alerts ÷ total predictions meeting confidence and impact thresholds)*
- **Smart Status**: INFO for insufficient data vs FAIL for real issues

**3. Guardrail Status Panel**
- **Active Cooldowns**: Show muted assets with expiration times
- **Alert Counts**: Hourly alert volume per asset
- **Storm Prevention**: Visual confirmation of rate limiting
- **Threshold Monitoring**: Current vs configured limits

**4. Drill-Down Capabilities**
- **Recent Outcomes Table**: Last 10 predictions with full details
- **Performance Metrics**: P95 latency, cache hit rate, 24h volume
- **Expandable Logs**: Timestamp, asset, prediction, outcome, tier
- **One-Click Debugging**: Direct links to detailed investigation

**5. Operational Controls**
- **Backfill Outcomes**: Manual recovery for missed cron jobs
- **Refresh Data**: Force update of all monitoring metrics
- **Quick Diagnostics**: Smoke test, integrity check, guardrail tuning
- **Interactive Elements**: Clickable tiles that trigger drill-downs

### **Edge Functions**

#### **drift-daily**
- **Endpoint**: `/functions/v1/drift-daily`
- **Purpose**: Daily model performance monitoring
- **Schedule**: Cron job at 6 AM UTC
- **Checks**: Feature drift, accuracy degradation, data quality
- **Alerts**: Slack notifications for significant changes

#### **backfill-missed-outcomes**
- **Endpoint**: `/functions/v1/backfill-missed-outcomes`
- **Purpose**: Recovery function for missed prediction labeling
- **Trigger**: Manual via ops dashboard or automated on detection
- **Logic**: Find unlabeled predictions past horizon, fetch outcomes

### **Database Tables**

```sql
-- SLO monitoring
request_metrics (id, prediction_id, latency_ms, cache_status, created_at)
model_daily_metrics (day, hit_rate_7d, hit_rate_30d, avg_confidence)

-- System health views
v_prediction_slo_daily (day, labeled, hit_rate, avg_confidence)
v_alert_storm_hourly (hour, asset, alert_count, status)
v_guardrail_acceptance (asset, eligible_signals, fired_alerts, acceptance_rate)
v_orphaned_predictions (id, asset, horizon_end, overdue_by)
```

### **🔄 Upcoming Features**

#### **P1 - Next Sprint**
- [ ] **Slack Integration**: Auto-alerts for SLO breaches and system issues
- [ ] **Email Notifications**: Daily health reports and incident summaries
- [ ] **Ops API Endpoint**: `/ops/health` for external monitoring (Datadog, Grafana)
- [ ] **Traffic Heatmap**: Runs/outcomes per asset over 24h visualization

#### **Ops Health Endpoint Contract**
```json
// GET /ops/health response format
{
  "status": "healthy" | "degraded" | "down",
  "timestamp": "2025-01-22T10:30:00Z",
  "slo_metrics": {
    "hit_rate_7d": 72.5,
    "p95_latency_ms": 450,
    "cache_hit_rate": 85.2,
    "outcomes_labeled_1h": 15
  },
  "alerts": {
    "active_cooldowns": 2,
    "storm_detected": false,
    "orphaned_predictions": 0
  },
  "uptime_seconds": 86400
}
```

#### **P2 - Future Releases**
- [ ] **Tier Health Overlay**: Free/Pro/Premium prediction flow monitoring
- [ ] **Incident Management**: Ticket creation and resolution tracking
- [ ] **Performance Profiling**: Detailed latency breakdown by component
- [ ] **Capacity Planning**: Resource usage trends and scaling recommendations

---

## 🔧 Edge Functions Reference

### **Complete Function List**

| Function | Purpose | Tier Required | Performance | Status |
|----------|---------|---------------|-------------|---------|
| `scenario-simulate` | ML prediction generation | Free+ | 300-600ms | ✅ Production |
| `scenario-export` | CSV/PDF export | Premium+ | 1-2s | ✅ Production |
| `scenario-backtest` | Historical validation | Pro+ | 500ms | ✅ Production |
| `scenario-forensics` | Deep whale analysis | Enterprise | 1-3s | ✅ Production |
| `bi-summary` | BI dashboard data | Admin | <100ms | ✅ Production |
| `log-attribution` | Event tracking | All | 50ms | ✅ Production |
| `forecast-upgrades` | ML training | System | 30-60s | ✅ Production |
| `drift-daily` | Model monitoring | System | 10-30s | ✅ Production |

### **Authentication & Authorization**

```typescript
// Tier enforcement pattern used across all functions
const { tier, error } = await enforceTier(req, 'premium');
if (error) {
  return new Response(JSON.stringify({ 
    error: "Upgrade required: export requires premium+ subscription",
    code: "TIER_REQUIRED",
    required_tier: "premium"
  }), { status: 403 });
}
```

### **Error Handling Standards**

```typescript
// Consistent error response format
{
  error: "Human readable message",
  code: "MACHINE_READABLE_CODE", 
  details: { /* additional context */ },
  timestamp: "2025-01-22T10:30:00Z"
}
```

---

## 🗄️ Database Schema

### **Core Tables Summary**

#### **Predictions Module**
- `scenario_runs` - User prediction requests and results
- `scenario_outcomes` - Ground truth validation after horizon
- `scenario_cache` - Performance optimization cache
- `alert_cooldowns` - Storm prevention rate limiting
- `model_daily_metrics` - ML performance tracking

#### **Business Intelligence Module**
- `preset_click_events` - User preset interaction tracking
- `feature_lock_events` - Paywall encounter logging
- `upgrade_events` - Subscription conversion tracking
- `upgrade_forecasts` - ML-generated conversion predictions
- `forecast_accuracy` - Model validation metrics

#### **Operations Module**
- `request_metrics` - API performance monitoring
- `alert_thresholds` - Configurable guardrail settings
- Various monitoring views (`v_*`) for health checks

### **Key Relationships**

```sql
-- Attribution flow
preset_click_events → upgrade_events (via trigger)
feature_lock_events → upgrade_events (via trigger)

-- Prediction validation
scenario_runs → scenario_outcomes (1:1 after horizon)

-- Performance tracking
scenario_runs → request_metrics (1:1 for monitoring)
```

---

## 🚀 Upcoming Features

### **Cross-Module Enhancements**

#### **Q1 2025 - Core Improvements**
- [ ] **Mobile Optimization**: Responsive design for all dashboards
- [ ] **Real-time Updates**: WebSocket integration for live data
- [ ] **Advanced Caching**: Redis layer for sub-100ms responses
- [ ] **API Rate Limiting**: Per-tier request limits and quotas

#### **Q2 2025 - Advanced Analytics**
- [ ] **Custom Dashboards**: User-configurable BI panels
- [ ] **Automated Insights**: AI-powered anomaly detection
- [ ] **Multi-tenant Support**: White-label deployment options
- [ ] **Advanced Exports**: Scheduled reports and data pipelines

#### **Q3 2025 - Enterprise Features**
- [ ] **SSO Integration**: SAML/OIDC for enterprise customers
- [ ] **Audit Logging**: Comprehensive compliance tracking
- [ ] **Custom Models**: Client-specific ML model training
- [ ] **API Marketplace**: Third-party integration ecosystem

### **Technical Debt & Infrastructure**

#### **High Priority**
- [ ] **Database Optimization**: Query performance tuning and indexing
- [ ] **Error Monitoring**: Sentry integration for production debugging
- [ ] **Load Testing**: Comprehensive performance validation
- [ ] **Security Audit**: Penetration testing and vulnerability assessment

#### **Medium Priority**
- [ ] **Code Documentation**: Comprehensive API documentation
- [ ] **Testing Coverage**: Unit and integration test expansion
- [ ] **CI/CD Pipeline**: Automated deployment and rollback
- [ ] **Monitoring Stack**: Grafana/Prometheus integration

---

## 📈 Success Metrics

### **System Health KPIs**
- **Prediction Accuracy**: >70% hit rate (7-day rolling)
- **API Performance**: <700ms p95 latency
- **Attribution Coverage**: >60% preset, >40% lock attribution
- **System Uptime**: 99.9% availability SLA

### **Business Metrics**
- **Conversion Rates**: Preset→upgrade, Lock→upgrade funnels
- **User Engagement**: Scenarios per user, retention by tier
- **Revenue Attribution**: MRR impact by acquisition channel
- **Feature Adoption**: Usage rates by tier and feature

---

## 🛡️ Security & Compliance

### **Data Protection**
- **PII Minimization**: All BI dashboards operate on hashed IDs; no raw PII is exposed. Supabase secrets are rotated every 90 days.
- **Row Level Security**: Database-level access controls
- **Audit Trails**: Complete user action logging
- **Data Retention**: 12-month policy with automated cleanup

### **Access Controls**
- **Role-Based Access**: Admin, User, Service tiers
- **API Authentication**: JWT tokens with tier validation
- **Rate Limiting**: Per-user and per-tier quotas
- **IP Whitelisting**: Enterprise security controls

---

**Built with ❤️ by the WhalePlus team**  
**Last Updated**: January 22, 2025  
**Version**: 1.0.0