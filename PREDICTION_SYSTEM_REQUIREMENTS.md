# 🚀 WhalePlus Production Prediction System Requirements

## 📋 Overview
Production-grade AI prediction engine for blockchain whale activity and price movements with institutional reliability, tiered monetization, and real-time data processing.

## 🏗️ System Architecture

### Current Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth + OAuth (Google, Apple)
- **Payments**: Stripe with webhook processing
- **Deployment**: Vercel (frontend) + Supabase (backend)

### Existing Database Tables
```sql
-- Core tables already exist
users, users_metadata, subscriptions, alerts, user_preferences
prediction_outcomes, prediction_clusters, market_maker_flows
```

## 🎯 Core Requirements

### 1. Data Ingestion Pipeline
```typescript
interface DataProvider {
  primary: 'alchemy';
  secondary: 'quicknode' | 'infura';
  fallback: 'local_erigon';
  historical: 'dune' | 'flipside';
  prices: 'coingecko' | 'kaiko';
}
```

**Requirements:**
- Multi-provider failover with circuit breaker pattern
- Real-time webhook processing for large transactions (≥50 ETH)
- Historical backfill capability for model training
- Curated wallet labeling (exchanges, market makers, whales)
- Rate limiting and quota management per provider

### 2. Feature Engineering
```typescript
interface PredictionFeatures {
  whale_volume: { score: number; threshold: number };
  accumulation_pattern: { score: number; window: string };
  time_clustering: { score: number; burst_detection: boolean };
  market_sentiment: { score: number; sources: string[] };
  technical_indicators: { score: number; indicators: string[] };
  cross_chain_correlation: { score: number; lag_hours: number };
}
```

**Feature Specifications:**
- **Whale Volume**: Configurable thresholds (50+ ETH default)
- **Accumulation**: Rolling 6h/24h inflow vs outflow ratios
- **Time Clustering**: Transaction burst detection (30min-6h windows)
- **Market Sentiment**: Multi-source aggregation with confidence weighting
- **Technical Indicators**: RSI, EMA, liquidity depth from DEX data
- **Cross-chain**: ETH→BTC correlation with 2-8h lag analysis

### 3. Prediction Models

#### Model Tiers
```typescript
interface ModelConfig {
  free: 'logistic_regression';
  pro: 'xgboost';
  premium: 'lstm_transformer';
  enterprise: 'ensemble_advanced';
}
```

**Model Requirements:**
- Explainable baseline models (Logistic Regression, XGBoost)
- Advanced time-series models for Premium+ (LSTM/Transformer)
- Confidence calibration (Platt scaling)
- Backtest accuracy tracking (7d, 30d, 90d windows)
- Risk assessment classification (Low/Medium/High)

### 4. API Schema

#### Prediction Response
```typescript
interface PredictionResponse {
  id: string;
  timestamp: string;
  asset: 'ETH' | 'BTC' | string;
  chain: 'ethereum' | 'bitcoin' | string;
  prediction_type: 'whale_activity' | 'price_movement' | 'volume_spike';
  
  // Prediction semantics
  horizon_hours: number;
  basis_price?: number;
  target_price?: number;
  delta_pct?: number;
  direction: 'up' | 'down' | 'neutral';
  confidence: number; // 0-1 scale
  
  // Model metadata
  model: {
    name: string;
    version: string;
  };
  
  // Features with scores
  features: Record<string, { score: number }>;
  
  // Context data
  context: {
    whale_count: number;
    tx_count: number;
    net_inflow_usd: number;
  };
  
  // Audit trail
  provenance: {
    sources: string[];
    block_number: number;
    window: string;
    queried_at: string;
    tx_hashes_sample: string[];
  };
  
  // Quality indicators
  quality: {
    status: 'ok' | 'degraded' | 'fallback';
    reason?: string;
  };
  
  explanation: string;
}
```

### 5. Tiered Feature Access

#### Subscription Tiers
```typescript
interface TierAccess {
  free: {
    predictions_per_day: 50;
    features: ['impact', 'confidence'];
    refresh_interval: '5min';
    history_days: 0;
  };
  pro: {
    predictions_per_day: 500;
    features: ['basic_breakdown', 'history', 'alerts'];
    refresh_interval: '1min';
    history_days: 30;
  };
  premium: {
    predictions_per_day: 5000;
    features: ['advanced_features', 'scenarios', 'risk_scoring', 'ai_explanation', 'export'];
    refresh_interval: '30sec';
    history_days: 90;
  };
  enterprise: {
    predictions_per_day: 'unlimited';
    features: ['forensics', 'collusion_analysis', 'custom_api', 'white_label'];
    refresh_interval: 'real_time';
    history_days: 365;
  };
}
```

### 6. UI Component Structure

#### Prediction Page Components
```typescript
// Main page component
<WhalePredictions>
  <PredictionTabs>
    <TodaysSignals tier={userTier} />
    <PredictionHistory tier={userTier} />
    <ScenarioBuilder tier={userTier} />
    <AlertsManager tier={userTier} />
  </PredictionTabs>
</WhalePredictions>

// Tiered prediction card
<TieredPredictionCard prediction={prediction} userTier={tier}>
  {tier === 'free' && <FreeTierView />}
  {tier === 'pro' && <ProTierView />}
  {tier === 'premium' && <PremiumTierView />}
</TieredPredictionCard>
```

### 7. Database Schema Extensions

#### New Tables Needed
```sql
-- Prediction accuracy tracking
CREATE TABLE prediction_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id TEXT NOT NULL,
  realized_outcome BOOLEAN,
  realized_value NUMERIC,
  accuracy_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data provider health
CREATE TABLE provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('healthy', 'degraded', 'down')),
  last_success TIMESTAMPTZ,
  error_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature importance tracking
CREATE TABLE feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  importance_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Edge Functions Required

#### Core Functions
```typescript
// 1. Data ingestion
'data-ingestion': {
  triggers: ['webhook', 'cron'];
  providers: ['alchemy', 'quicknode', 'coingecko'];
  output: 'processed_transactions';
}

// 2. Feature computation
'feature-engineering': {
  input: 'processed_transactions';
  output: 'feature_vectors';
  window: 'rolling_6h';
}

// 3. Prediction generation
'whale-predictions': {
  input: 'feature_vectors';
  output: 'PredictionResponse[]';
  models: ['baseline', 'advanced'];
}

// 4. Accuracy tracking
'accuracy-tracker': {
  input: 'predictions + market_data';
  output: 'accuracy_metrics';
  schedule: 'daily';
}
```

### 9. Monitoring & Alerting

#### Health Checks
```typescript
interface SystemHealth {
  data_freshness: {
    last_block: number;
    delay_minutes: number;
    status: 'ok' | 'stale';
  };
  model_performance: {
    accuracy_7d: number;
    accuracy_30d: number;
    drift_detected: boolean;
  };
  provider_status: {
    alchemy: 'healthy' | 'degraded' | 'down';
    coingecko: 'healthy' | 'degraded' | 'down';
  };
}
```

### 10. Testing Requirements

#### Test Coverage
```typescript
// Unit tests
'feature-engineering.test.ts': 'Feature calculation accuracy';
'prediction-models.test.ts': 'Model output validation';
'tier-gating.test.ts': 'Subscription access control';

// Integration tests
'data-pipeline.test.ts': 'End-to-end data flow';
'api-endpoints.test.ts': 'Edge function responses';
'ui-components.test.ts': 'React component rendering';

// Performance tests
'load-testing.ts': 'High-volume prediction generation';
'provider-failover.test.ts': 'Multi-provider resilience';
```

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Multi-provider data ingestion
- [ ] Feature engineering pipeline
- [ ] Basic prediction models
- [ ] Database schema updates

### Phase 2: UI Integration (Week 3)
- [ ] Tiered prediction components
- [ ] Subscription gating logic
- [ ] Real-time updates
- [ ] Export functionality

### Phase 3: Advanced Features (Week 4)
- [ ] Advanced ML models
- [ ] Scenario builder
- [ ] Accuracy tracking
- [ ] Monitoring dashboard

### Phase 4: Production Hardening (Week 5)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

## 📊 Success Metrics

### Technical KPIs
- **Uptime**: >99.5% availability
- **Latency**: <2s prediction generation
- **Accuracy**: >75% 30-day prediction accuracy
- **Data Freshness**: <5min delay from blockchain

### Business KPIs
- **Conversion**: 15% Free→Pro upgrade rate
- **Retention**: 80% monthly retention (Pro+)
- **Revenue**: $50K ARR within 6 months
- **Usage**: 10K+ predictions/day

## 🔧 Environment Configuration

### Required API Keys
```env
# Blockchain data
ALCHEMY_API_KEY=
QUICKNODE_API_KEY=
INFURA_API_KEY=

# Price data
COINGECKO_API_KEY=
KAIKO_API_KEY=

# ML/Analytics
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Monitoring
SENTRY_DSN=
DATADOG_API_KEY=
```

### Supabase Secrets
```bash
supabase secrets set ALCHEMY_API_KEY="your-key"
supabase secrets set COINGECKO_API_KEY="your-key"
supabase secrets set OPENAI_API_KEY="your-key"
```

This requirements document provides Amazon Q with everything needed to build a production-ready prediction system that integrates seamlessly with your existing WhalePlus infrastructure.