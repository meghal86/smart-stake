# Business Intelligence Dashboard Guide

## Overview
The WhalePlus BI Dashboard tracks user behavior, conversion funnels, and growth metrics to optimize product-market fit and revenue.

## Dashboard Access
- **URL**: `/admin/bi`
- **Access**: Admin role required (`user_metadata.role = 'admin'`)
- **Data**: Last 30 days of user activity

## Charts & Metrics

### 1. Preset → Upgrade Funnel
**What it shows**: Conversion rate from preset clicks to upgrades within 72 hours

**How to read**:
- **Blue bars**: Total preset clicks
- **Green bars**: Conversion rate percentage
- **Top performers**: Presets with highest conversion rates

**Key insights**:
- Which presets drive the most upgrades
- Conversion rates by preset complexity
- User preference patterns

**Action items**:
- Promote high-converting presets
- A/B test preset descriptions
- Move successful presets higher in UI

### 2. Feature Lock → Upgrade
**What it shows**: Conversion from feature lock views to upgrades within 24 hours

**How to read**:
- **Feature name**: Locked feature (export, backtests, forensics)
- **Views**: How many times users hit the paywall
- **Conversion %**: Upgrade rate after seeing lock

**Key insights**:
- Which paywalls are most effective
- Features that drive immediate upgrades
- Friction points in upgrade flow

**Action items**:
- Optimize high-converting lock screens
- Improve messaging for low-converting features
- Test different upgrade CTAs

### 3. Weekly Cohort Retention
**What it shows**: % of users who run ≥3 scenarios in first 7 days by signup week

**How to read**:
- **X-axis**: Signup week
- **Blue line**: Retention rate (target: >30%)
- **Green line**: Total users in cohort

**Key insights**:
- Product stickiness over time
- Impact of feature releases on retention
- Seasonal signup patterns

**Action items**:
- Improve onboarding for low-retention weeks
- Identify features that boost early engagement
- Set retention targets and alerts

### 4. Daily Runs by Tier
**What it shows**: Average scenarios per user per day by subscription tier

**How to read**:
- **X-axis**: Recent days
- **Y-axis**: Runs per user
- **Bars**: Usage intensity by tier

**Key insights**:
- Usage patterns by tier
- Feature adoption rates
- Engagement trends

**Action items**:
- Encourage free users to upgrade
- Identify power user behaviors
- Optimize for high-value actions

## Summary Stats Cards

### Total Preset Clicks
- **Metric**: Sum of all preset interactions
- **Goal**: Increase month-over-month
- **Levers**: UI placement, preset variety, onboarding

### Feature Lock Views
- **Metric**: Paywall encounters
- **Goal**: High views + high conversion
- **Levers**: Feature positioning, upgrade messaging

### Latest Cohort Retention
- **Metric**: Most recent week's 7-day retention
- **Goal**: >30% (industry benchmark)
- **Levers**: Onboarding flow, early value delivery

### Total Runs (30d)
- **Metric**: All scenario executions
- **Goal**: Growth trajectory
- **Levers**: User acquisition, engagement features

## Optimization Playbook

### High-Impact Tests to Run Next

#### 1. Preset Optimization
- **Test**: Move top-converting preset to #1 position
- **Hypothesis**: Better placement → more clicks → more upgrades
- **Measure**: Preset click rate, conversion rate
- **Timeline**: 2 weeks

#### 2. Upgrade CTA Positioning
- **Test**: Show upgrade prompt after 2nd scenario vs 5th scenario
- **Hypothesis**: Earlier prompts → higher conversion
- **Measure**: Feature lock conversion rate
- **Timeline**: 1 week

#### 3. Onboarding Flow
- **Test**: Guided tour vs self-discovery
- **Hypothesis**: Guided tour → higher 7-day retention
- **Measure**: Cohort retention rate
- **Timeline**: 4 weeks

#### 4. Tier-Specific Messaging
- **Test**: Different upgrade messages by user behavior
- **Hypothesis**: Personalized messaging → higher conversion
- **Measure**: Lock-to-upgrade conversion
- **Timeline**: 2 weeks

### Red Flags to Watch

#### Conversion Rate Drops
- **Threshold**: >20% week-over-week decline
- **Causes**: UI changes, pricing changes, competition
- **Action**: Immediate rollback and investigation

#### Retention Decline
- **Threshold**: <25% cohort retention
- **Causes**: Poor onboarding, feature bugs, value prop mismatch
- **Action**: User interviews, feature audit

#### Usage Stagnation
- **Threshold**: Flat runs/user for 2+ weeks
- **Causes**: Feature saturation, user fatigue
- **Action**: New feature development, engagement campaigns

## Data Quality Notes

### Event Tracking
- **Coverage**: All major user actions tracked
- **Latency**: Real-time to 5-minute delay
- **Retention**: 90 days in analytics_events table

### Known Limitations
- **Anonymous users**: Limited tracking before signup
- **Cross-device**: No user stitching implemented
- **Bot traffic**: Minimal filtering applied

### Refresh Schedule
- **Views**: Updated on query (real-time)
- **Dashboard**: Manual refresh button
- **Alerts**: Not implemented (future enhancement)

## Technical Details

### SQL Views
```sql
-- Preset conversion (72h window)
SELECT * FROM v_preset_to_upgrade;

-- Feature lock conversion (24h window)  
SELECT * FROM v_lock_to_upgrade;

-- Weekly cohorts (≥3 scenarios in 7d)
SELECT * FROM v_user_cohorts;

-- Daily usage by tier
SELECT * FROM v_daily_runs_by_tier;
```

### Event Schema
```json
{
  "event_name": "preset_clicked",
  "user_tier": "free",
  "asset": "ETH", 
  "timeframe": "6h",
  "model_version": "scn-v1.0",
  "properties": {
    "preset_name": "CEX Inflows Spike"
  }
}
```

## Success Metrics

### North Star: Revenue Growth
- **Primary**: Monthly recurring revenue (MRR)
- **Leading**: Conversion rate improvements
- **Lagging**: Customer lifetime value (CLV)

### Product Metrics
- **Engagement**: 7-day retention >30%
- **Conversion**: Feature lock conversion >15%
- **Usage**: Runs per user per week >5

### Growth Metrics  
- **Acquisition**: Weekly signups growth
- **Activation**: Time to first scenario <5 minutes
- **Retention**: Monthly active users growth

This dashboard provides the data foundation for evidence-based product decisions and growth optimization. 📊