# Market Intelligence Hub - Bloomberg-Grade Refactor

## Overview

This refactor combines the existing "Market" and "Alerts" sections into a single **Market Intelligence Hub** - a Bloomberg Terminal-style interface focused exclusively on cross-chain institutional intelligence. All portfolio/PnL/personal wallet logic has been removed and moved to a separate Portfolio module.

## Key Changes

### 🔄 **Architecture Refactor**
- **Single Route**: `/market/hub` replaces multiple market routes
- **Combined Interface**: Market + Alerts in unified Bloomberg-style layout
- **Portfolio Separation**: All personal wallet tracking moved to separate `/portfolio` area
- **Desktop-First**: Optimized for professional trading workflows with mobile responsiveness

### 🎯 **Core Components**

#### A) Global Market Health Cards (Top Row - Exactly 4)
1. **Market Mood Index** (0-100) + sparkline + Δ%
2. **24h Volume** + Δ%  
3. **Active Whales** + Δ%
4. **Market Risk Index** + "Top 3 Critical Alerts" mini-list

#### B) Whale Behavior Layer (Center)
- **5 Canonical Clusters**: Accumulation, Distribution, CEX Inflow, DeFi Activity, Dormant→Waking
- **Risk Heatmap by Chain**: BTC/ETH/SOL/Others with hover details
- **Drill-down Table**: Virtualized table with whale details, risk scores, actions

#### C) Real-time Alerts Sidebar (Right)
- **Single Source of Truth**: All alerts consolidated here
- **AI Digest**: Pinned 24h summary with key themes
- **Threading**: Near-duplicate alerts grouped intelligently
- **Advanced Filtering**: Chain, token, severity, USD threshold, watchlist
- **Inline Actions**: +Watchlist, Share, Open in Explorer

#### D) Contextual Action Bar (Bottom)
- **Appears on Selection**: Only when whale/cluster/alert selected
- **Trade/Hedge**: Feature-flagged with disabled state
- **Watchlist Management**: Cross-tab entity tracking
- **Export Features**: CSV/PDF (Pro-gated)

## API Architecture

### New Endpoints
```typescript
GET  /market/summary → MarketHealthData
GET  /whales/clusters → WhaleCluster[]
GET  /whales/cluster/{id} → ClusterDetails
GET  /alerts/stream → PaginatedAlerts
POST /alerts/rank → AlertsWithScores
POST /watchlist → WatchlistEntry
```

### Alert Ranking Algorithm
```typescript
score = w1*log10(usdAmount) + w2*exchangeImpact + w3*liquidityImpact
      + w4*entityReputation + w5*priceMoveCorrelation + w6*recencyBoost 
      - w7*burstSpamPenalty

severity: High ≥0.85, Medium ≥0.55, else Info
```

## Database Schema Updates

### New Tables
```sql
-- Watchlist (cross-tab entity tracking)
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('address', 'token', 'cluster')),
  entity_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Enhanced alert events with scoring
ALTER TABLE alert_events ADD COLUMN score DECIMAL(3,2);
ALTER TABLE alert_events ADD COLUMN severity TEXT CHECK (severity IN ('High', 'Medium', 'Info'));
ALTER TABLE alert_events ADD COLUMN reasons TEXT[];
```

### Removed Portfolio References
- All `user_portfolio_addresses` references removed from Market Hub
- Portfolio snapshots and PnL calculations moved to separate module
- Market Hub focuses purely on public blockchain intelligence

## Feature Mapping

| Component | Data Source | API Endpoint | Purpose |
|-----------|-------------|--------------|---------|
| Market Health Cards | `price_providers`, `whale_balances`, `alert_events` | `/market/summary` | Real-time market metrics |
| Whale Clusters | `whale_balances`, `whale_transactions` | `/whales/clusters` | Behavioral grouping |
| Alerts Stream | `alert_events` with ranking | `/alerts/stream` | Live transaction alerts |
| Risk Heatmap | Computed from whale data | Frontend calculation | Chain-level risk visualization |
| Watchlist | `watchlist` table | `/watchlist` CRUD | Cross-tab entity tracking |

## Monetization Strategy

### Free Tier
- Basic market health metrics
- Limited alert history (24h)
- Standard whale clusters
- Basic filtering

### Pro Tier ($9.99/month)
- **Extended History**: 30-day alert and cluster history
- **Advanced Clustering**: Custom cluster parameters and analysis
- **AI Digest**: Intelligent alert summarization and themes
- **Export Features**: CSV/PDF reports with custom date ranges
- **Priority Alerts**: Real-time push notifications
- **Advanced Filters**: Custom USD thresholds, entity reputation scores

## Performance Targets

- **P95 Summary API**: < 700ms
- **Mobile TTI**: < 2.5s (mid-tier device)
- **Crash-free Rate**: ≥ 99.9%
- **Cache Hit Rate**: ≥ 85% for market data
- **Alert Stream**: Real-time with < 2s latency

## Implementation Status

### ✅ Completed
- [x] Market Hub main page structure
- [x] Market Health Cards component
- [x] Alerts Sidebar with filtering
- [x] Whale Clusters grid and drill-down
- [x] Contextual Action Bar
- [x] Command Palette (Cmd+K)
- [x] Market Summary API
- [x] Alerts Stream API with ranking
- [x] Database migrations

### 🔄 In Progress
- [ ] Whale Analytics tab implementation
- [ ] Sentiment Analysis tab
- [ ] Correlation Heatmap tab
- [ ] Real-time WebSocket connections
- [ ] Pro feature gating

### 📋 Planned
- [ ] Mobile-responsive optimizations
- [ ] A/B testing framework
- [ ] Advanced clustering algorithms
- [ ] AI Digest implementation
- [ ] Export functionality
- [ ] Performance monitoring

## Migration Guide

### For Existing Users
1. **URL Changes**: `/market` → `/market/hub`
2. **Portfolio Separation**: Personal wallets now at `/portfolio`
3. **Alert Consolidation**: All alerts now in unified sidebar
4. **Watchlist Migration**: Existing watchlists automatically migrated

### For Developers
1. **Component Updates**: Import from `@/components/market-hub/`
2. **API Changes**: Use new unified endpoints
3. **State Management**: Simplified with single hub state
4. **Testing**: New test suites for integrated components

## Rollout Plan

### Phase 1: Beta (Week 1-2)
- Deploy to 10% of Pro users
- Monitor performance metrics
- Collect user feedback
- A/B test against current interface

### Phase 2: Gradual Rollout (Week 3-4)
- Expand to 50% of users
- Monitor conversion metrics
- Optimize based on usage patterns
- Prepare full migration

### Phase 3: Full Migration (Week 5-6)
- 100% user migration
- Deprecate old market routes
- Update documentation
- Monitor stability metrics

## Success Metrics

### User Engagement
- **Time in Hub**: Target 15+ minutes per session
- **Alert Interactions**: 5+ alerts clicked per session
- **Cluster Exploration**: 3+ clusters viewed per session
- **Command Palette Usage**: 20% of power users

### Business Metrics
- **Pro Conversion**: 15% increase from unified experience
- **Feature Adoption**: 60% of users use watchlist
- **Export Usage**: 40% of Pro users export monthly
- **Retention**: 10% improvement in 30-day retention

### Technical Metrics
- **Performance**: All targets met consistently
- **Error Rate**: < 0.1% for critical paths
- **Cache Efficiency**: 85%+ hit rate maintained
- **Mobile Experience**: 90+ Lighthouse scores

---

This refactor transforms the Market section into a true Bloomberg-grade institutional intelligence platform, removing personal portfolio distractions and focusing on what professional traders need: comprehensive, real-time, cross-chain market intelligence.