# 📈 Forecasting Playbook

**Purpose**: Predict 7-day upgrade probability by preset/tier/usage bucket and drive focused growth actions.  
**Audience**: Growth, Product, Data, Engineering.  
**Scope**: BI views, ML training loop, validation, dashboards, alerts, and decision playbooks.

---

## 1) System Overview

**Goal**: Forecast which presets and early-usage patterns will convert users to Pro/Premium in the next 7 days.

### Inputs
- **Product events**: preset_clicked, scenario_saved, feature_locked_view, export_success, upgrade_clicked, subscription_upgraded
- **Usage metrics**: scenarios run count, assets used, timeframes, tier, session recency
- **Cohorts**: week-of-signup, plan tier at signup

### Outputs
- **upgrade_forecasts**: 7-day upgrade probability by preset / tier / usage bucket
- **forecast_accuracy**: rolling accuracy & MAPE vs actuals
- **BI**: Forecasts Panel, Early-usage vs Upgrade chart, Alerts

### Cadence
- **Nightly training** (UTC 02:00)
- **Forecast refresh + alerting** (UTC 02:10)

---

## 2) Data Model (SQL Views & Tables)

### 2.1 Training Set (features → label)

```sql
-- v_upgrade_training_data
-- One row per user-week with features and label (upgraded within 7 days).
```

**Feature families**:
- **Engagement**: runs in days 1–7 (buckets: 0–2, 3–5, 6+)
- **Preset signals**: top preset clicked (one-hot or top-k)
- **Intent**: feature_locked_view counts (export/backtest/forensics)
- **Save behavior**: scenario_saved count, time-to-first-save
- **Recency**: days since last session
- **Tier at start**: free/pro/premium

**Label**:
- **upgraded_7d**: binary (1 if user upgraded within 7 days of observation window)

### 2.2 Retention & Cross-tab

```sql
-- v_cross_retention_upgrades
-- Upgrade probability by early usage bucket (0–2, 3–5, 6+) and tier.
```

### 2.3 Funnels

```sql
-- v_preset_to_upgrade
-- 72h conversion by preset (attributed to first preset or last touch).

-- v_lock_to_upgrade
-- 24h conversion after encountering a gated feature.
```

### 2.4 Forecast Store

```sql
-- upgrade_forecasts (table)
-- Key: forecast_date, preset, tier, usage_bucket
-- Values: upgrade_prob, conf_score, sample_size

-- forecast_accuracy (table)
-- Key: as above + realized window key (week)
-- Values: mape, accuracy, sample_size
```

---

## 3) Model Training (Nightly)

**Model**: Logistic Regression (baseline, interpretable)  
**Optionally**: GBT/LGBM challenger logged in forecast_accuracy for benchmarking.

### 3.1 Feature Pipeline (pseudo-SQL → vector)
- One-hot encode top N presets (e.g., 10)
- Bucketize early runs: {0–2, 3–5, 6+}
- Normalize recency, save counts
- Encode tier (free/pro/premium) as dummies
- Include interaction features: (preset × tier), (runs_bucket × feature_locked_view)

### 3.2 Training Loop (Edge Function)

```typescript
// functions/forecast-train/index.ts
export async function main() {
  // 1) Pull v_upgrade_training_data (last 13 weeks)
  // 2) Train logistic regression (or use a hosted tiny model)
  // 3) Score by (preset, tier, usage_bucket) for next 7d
  // 4) Write to upgrade_forecasts with conf_score + sample_size
  // 5) Evaluate last week's predictions vs realized → forecast_accuracy
}
```

**Confidence Scoring**:
- `conf_score = min( model_auc_weight, log(sample_size)/log(1000) )` in [0,1]
- Show low confidence if sample is small or recent behavior shifted.

---

## 4) Validation & Monitoring

### Accuracy Metrics
- **Accuracy** (thresholded at 0.5)
- **MAPE** (probability calibration error)
- **AUC** (optional, for model quality trend)

### Drift & Stability
- Alert if MAPE rises >10% WoW for any preset/tier bucket
- Alert if sample_size falls below threshold (data sparsity)

### Alert Examples (Slack)
- "⚠️ Forecast drift: CEX Inflows Spike · Free · 3–5 runs MAPE +12% WoW."
- "⬇️ Forecast drop: ETH Accumulation · Pro · 6+ runs upgrade_prob 0.34 → 0.27 (−7pp)."

---

## 5) BI Dashboard Specs (/admin/bi)

### 5.1 Forecasts Panel
- **Table**: Preset | Tier | Usage bucket | Upgrade prob (7d) | Conf | Sample | WoW Δ
- **Sparkline** per preset (last 6 weeks prob)
- **Filter**: by tier, preset, min sample size

### 5.2 Early Usage → Upgrade
- **Chart**: Runs in week 1 (0–2, 3–5, 6+) vs upgrade probability (stacked by tier)
- **Toggle**: Absolute vs Δ vs base cohort

### 5.3 Paywall Effectiveness
- **Funnel**: Feature lock → Upgrade (24h)
- **Compare** Export vs Backtest vs Forensics lock performance

### 5.4 Accuracy Panel
- **Tiles**: AUC (logreg), MAPE (7d), Coverage (% of traffic forecastable)
- **Table**: Forecast vs Realized per bucket (last 4 weeks)

---

## 6) Growth Playbooks (How to Act)

### 6.1 Preset Ordering
- **Do**: Pin top-forecast presets to the first row on the Scenarios tab (per tier).
- **Test**: A/B "Preset order dynamic vs static," success = +X% upgrade within 7 days.

### 6.2 Paywall Placement
- **Do**: Move the strongest converting paywall (e.g., Export) into the Result panel.
- **Test**: "After-run paywall" vs "Pre-run paywall," success = higher upgrade with no drop in runs.

### 6.3 Nurture Messaging
- **Do**: Target users in 3–5 runs bucket with in-app nudge: "🔥 Users like you see +2.1× ROI with Premium backtests."
- **Test**: 7-day uplift in upgrades for the cohort vs holdout.

### 6.4 Onboarding
- **Do**: Map top forecasted presets to the first-run experience (Free tier).
- **Test**: "Preset first-run wizard" vs control; measure "3+ runs in 7 days" and upgrade.

---

## 7) Alerting Rules

- **Forecast Drop**: If any (preset,tier,usage) forecast ↓ >10% WoW and sample_size ≥ 100 → alert Growth + PM.
- **Accuracy Degradation**: If MAPE ↑ >10% WoW → alert Data + Eng; investigate feature drift.
- **Coverage Gap**: If % forecastable traffic < 70% → alert Data to expand features or reduce sparsity.

---

## 8) Ops Runbook

### Low Confidence
- **Action**: Aggregate similar presets; widen buckets; increase training window.

### High MAPE
- **Action**: Re-fit with added features (e.g., session recency), cross-validate; compare to GBT challenger.

### Sample Drought
- **Action**: Merge small presets into "Other (Alpha)" until volume grows.

### SLO Breach
- **Action**: Roll back to last stable model; freeze rollout; notify channel.

---

## 9) Privacy & Governance

- **PII**: Forecasts stored at cohort level (not individual unless explicitly enabled).
- **Access**: /admin/bi role-gated; exports watermarked.
- **Retention**: Forecasts & accuracy logs retained 12 months; purge older.
- **Transparency**: Document model type, refresh cadence, and known limitations.

---

## 10) Roadmap (Next)

- **Challenger Model**: Add LightGBM; record head-to-head in forecast_accuracy.
- **Personalized Uplift**: User-level upgrade likelihood + nudge experiments.
- **Scenario Overlay**: "If N users run preset X, expect +Y upgrades next 7d."
- **Self-serve Experiments**: BI UI to launch A/B tests (preset order, paywall text).

---

## Appendix: Quick Queries

### Top forecasted presets (next 7d):

```sql
SELECT forecast_date, preset_name, user_tier, run_count_bucket, predicted_upgrade_rate, confidence_score, sample_size
FROM upgrade_forecasts
WHERE forecast_date = CURRENT_DATE
  AND sample_size >= 100
ORDER BY predicted_upgrade_rate DESC
LIMIT 10;
```

### MAPE trend (last 6 weeks):

```sql
SELECT forecast_date, preset_name, predicted_rate, actual_rate, accuracy_score
FROM forecast_accuracy
WHERE forecast_date >= CURRENT_DATE - INTERVAL '42 days'
ORDER BY forecast_date DESC, accuracy_score DESC;
```

### Cohort upgrade by early usage:

```sql
SELECT activity_bucket, total_users, upgraded_users, upgrade_probability
FROM v_cross_retention_upgrades
ORDER BY upgrade_probability DESC;
```

---

## Ownership

- **Data/ML**: Data Eng
- **Dashboards**: Growth Analytics
- **Product**: Scenarios & Monetization PM
- **SRE/Alerts**: Platform Eng

**SLA**: Forecasts by 02:30 UTC daily; dashboards refreshed by 03:00 UTC.

---

## One-liner Summary

We use nightly, interpretable ML on first-week behavior to predict upgrades, validate forecasts vs reality, and auto-alert on risk—so Growth can prioritize high-impact presets, paywalls, and onboarding with measurable ROI.

---

**Built with ❤️ by the WhalePlus team**