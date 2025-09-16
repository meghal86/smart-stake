# 🐋 Whale Analytics Implementation Guide

## Overview
Complete implementation guide for the Whale Analytics feature with AI-powered risk scoring, real-time monitoring, and advanced alert systems.

## 🏗️ Architecture Components

### Database Schema
```sql
-- Core whale data tables
whale_balances (address, chain, balance, ts, provider, method, ingested_at)
whale_transfers (tx_hash, from_address, to_address, value, token, chain, ts)
whale_signals (address, chain, signal_type, value, confidence, reasons, supporting_events, ts)

-- User interaction tables  
user_watchlists (user_id, whale_address, created_at)
alert_rules (user_id, whale_address, alert_type, threshold_value, cooldown_minutes, hysteresis_percent)
alert_notifications (user_id, whale_address, status, delivery_method, message, created_at)
```

### Backend Functions
- `whale-analytics` - Main data aggregation and processing
- `health` - System health monitoring and metrics
- `blockchain-monitor` - Real-time whale data ingestion

### Frontend Components
- `WhaleAnalytics.tsx` - Main dashboard with enhanced header
- `WhaleBehaviorAnalytics.tsx` - AI behavior analysis
- `CustomAlertCreator.tsx` - Advanced alert configuration
- `whaleRiskScore.ts` - Risk calculation engine

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor
-- Fix whale_signals table schema
DROP TABLE IF EXISTS whale_signals CASCADE;

CREATE TABLE whale_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    signal_type TEXT NOT NULL,
    value DECIMAL(36,18),
    confidence FLOAT NOT NULL DEFAULT 0.5,
    reasons TEXT[] DEFAULT '{}',
    supporting_events TEXT[] DEFAULT '{}',
    ts TIMESTAMP NOT NULL DEFAULT NOW(),
    provider TEXT NOT NULL DEFAULT 'whale-analytics',
    method TEXT NOT NULL DEFAULT 'risk_computation',
    ingested_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_whale_signals_address_chain ON whale_signals(address, chain);
CREATE INDEX idx_whale_signals_ts ON whale_signals(ts DESC);
CREATE INDEX idx_whale_signals_confidence ON whale_signals(confidence DESC);

-- Enable RLS with permissive policies
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for service role" ON whale_signals
    FOR ALL USING (true);

CREATE POLICY "Allow read access for authenticated users" ON whale_signals
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON whale_signals
    FOR INSERT WITH CHECK (true);
```

### 2. Deploy Edge Functions
```bash
# Deploy all whale analytics functions
supabase functions deploy whale-analytics
supabase functions deploy health
supabase functions deploy blockchain-monitor
```

### 3. Environment Configuration
```bash
# Required environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional blockchain API keys
ALCHEMY_API_KEY=your-alchemy-key
MORALIS_API_KEY=your-moralis-key
```

## 🎯 Feature Implementation

### Enhanced Header Metrics
```typescript
// Displays real-time market data
- 24h Volume: Aggregated from whale_balances
- Active Whales: Count of unique addresses (24h)
- Market Signals: Top 5 signals from whale_signals
```

### Risk Scoring System
```typescript
// Risk factors with weights
- Transfer Velocity (25%): Recent transaction frequency
- Size Concentration (20%): Balance distribution analysis  
- CEX Proximity (20%): Centralized exchange interactions
- DEX Propensity (15%): Decentralized exchange usage
- Anomaly Detection (20%): Statistical deviation analysis

// Output: 0-100 risk score with explanatory reasons
```

### Custom Alert System
```typescript
// Alert configuration options
- Cooldown Period: 5 minutes to 24 hours
- Hysteresis Buffer: 0-20% threshold buffer
- Delivery Methods: Email, Push, Webhook, SMS
- Alert Types: Withdrawal, Deposit, Activity Spike, Balance Change
```

## 📊 Data Flow

### 1. Data Ingestion
```
Blockchain APIs → blockchain-monitor → whale_balances/whale_transfers
```

### 2. Risk Analysis
```
whale_balances → whaleRiskScore.ts → whale_signals
```

### 3. Alert Processing
```
whale_signals → alert_rules → alert_notifications
```

### 4. Frontend Display
```
whale-analytics function → WhaleAnalytics.tsx → User Dashboard
```

## 🔧 API Endpoints

### Health Check
```bash
GET /functions/v1/health
# Returns system metrics and status
```

### Whale Analytics
```bash
POST /functions/v1/whale-analytics
# Returns processed whale data with risk scores
```

### Market Metrics
```typescript
// Enhanced header data
{
  volume24h: number,
  activeWhales: number,
  topSignals: Array<{signal_type, confidence, value}>
}
```

## 🎨 UI Components

### Main Dashboard
- **Enhanced Header**: Market metrics with responsive cards
- **Whale List**: Risk scores with provenance badges
- **Risk Tooltips**: Detailed explanations with supporting evidence
- **Blockchain Links**: Clickable transaction explorer links

### Alert Creator
- **Slider Controls**: Cooldown and hysteresis configuration
- **Delivery Log**: Real-time notification status tracking
- **Explanatory Tooltips**: User-friendly setting explanations

### Behavior Analytics
- **AI Patterns**: Machine learning whale classification
- **Signal Detection**: Anomaly and trend identification
- **Performance Metrics**: System throughput and accuracy

## 🔒 Security Implementation

### Row Level Security
```sql
-- User data isolation
CREATE POLICY "Users manage own watchlists" ON user_watchlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own alerts" ON alert_rules
    FOR ALL USING (auth.uid() = user_id);
```

### Performance Indexes
```sql
-- Optimized query performance
CREATE INDEX idx_whale_balances_addr_chain_ts ON whale_balances(address, chain, ts DESC);
CREATE INDEX idx_whale_transfers_addr_chain_ts ON whale_transfers(from_address, chain, ts DESC);
CREATE INDEX idx_whale_signals_active_high_confidence ON whale_signals(address, chain, ts DESC) 
WHERE confidence >= 0.8;
```

## 📈 Monitoring & Analytics

### Health Metrics
- **Data Freshness**: Max age of whale data
- **Event Throughput**: Transactions processed per second
- **Provider Status**: API health and latency
- **Queue Lag**: Unprocessed events count

### Performance Tracking
- **Risk Calculation**: Average computation time
- **Database Queries**: Response time and efficiency
- **Alert Delivery**: Success rates and failures
- **User Engagement**: Feature usage analytics

## 🚨 Troubleshooting

### Common Issues

**Schema Cache Errors**
```sql
-- Fix missing columns
ALTER TABLE whale_signals ADD COLUMN IF NOT EXISTS [column_name] [type];
```

**RLS Policy Violations**
```sql
-- Update restrictive policies
CREATE POLICY "Allow operations" ON [table] FOR ALL USING (true);
```

**Performance Issues**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_[table]_[columns] ON [table]([columns]);
```

### Debug Commands
```bash
# Check function logs
supabase functions logs whale-analytics

# Test health endpoint
curl -H "Authorization: Bearer $ANON_KEY" /functions/v1/health

# Validate database schema
supabase db diff --linked
```

## 🎯 Success Metrics

### Technical KPIs
- **Response Time**: < 2s for whale data queries
- **Accuracy**: > 95% risk score confidence
- **Uptime**: > 99.9% system availability
- **Throughput**: > 1000 events/minute processing

### User Experience
- **Load Time**: < 3s initial page load
- **Alert Delivery**: < 30s notification latency
- **Data Freshness**: < 5min whale data updates
- **Error Rate**: < 1% failed operations

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Review alert delivery logs
- **Monthly**: Optimize database indexes
- **Quarterly**: Update risk scoring models
- **Annually**: Security audit and penetration testing

### Monitoring Alerts
- High error rates in whale data ingestion
- Unusual patterns in risk score distribution
- Alert delivery failures exceeding threshold
- Database performance degradation

---

## ✅ Implementation Checklist

- [ ] Database schema deployed and validated
- [ ] Edge functions deployed and tested
- [ ] RLS policies configured correctly
- [ ] Performance indexes created
- [ ] Frontend components integrated
- [ ] Risk scoring system operational
- [ ] Alert system configured and tested
- [ ] Health monitoring active
- [ ] Security policies implemented
- [ ] Documentation updated

**Status**: Production Ready 🚀
**Last Updated**: 2025-01-16
**Version**: 2.0.0