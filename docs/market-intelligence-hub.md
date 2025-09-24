# Market Dashboard Documentation

## Overview

### Purpose
The Market Dashboard is a comprehensive Bloomberg Terminal-style interface that provides institutional-grade cryptocurrency market intelligence. It combines multiple analysis tools including whale tracking, sentiment analysis, behavioral clustering, and portfolio management into a unified professional trading platform.

### Market Dashboard Tabs
1. **Intelligence Hub** - Bloomberg-style real-time market intelligence
2. **Whale Analytics** - Advanced whale transaction analysis and tracking
3. **Sentiment** - Multi-coin sentiment analysis and market mood tracking
4. **Correlation** - Sentiment correlation heatmaps and cross-asset analysis
5. **Portfolio** - Personal portfolio tracking and whale interaction analysis

### High-Level Architecture
```
Frontend (React/TypeScript)
    ↓
API Layer (Supabase Edge Functions)
    ↓
Database (PostgreSQL + Existing Tables)
    ↓
External Data Sources (Whale Balances, Transactions, Price Feeds)
```

**Core Components:**
- **Market Health Dashboard**: Real-time market mood, volume, whale activity metrics
- **Intelligence Hub**: Bloomberg-style whale clustering and alert streaming
- **Whale Analytics**: Advanced transaction analysis with clustering and counterparty graphs
- **Sentiment Analysis**: Multi-coin sentiment tracking with correlation heatmaps
- **Portfolio Management**: Personal wallet tracking with whale interaction analysis
- **Watchlist Management**: User-customizable entity tracking across all tabs

## Database Schema

### New Tables

#### `watchlist`
```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('address', 'token', 'cluster')),
  entity_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);
```
**Purpose**: Stores user-specific watchlists for addresses, tokens, or whale clusters.
**Relationships**: Links to `auth.users` for user ownership.

#### `market_intelligence_cache`
```sql
CREATE TABLE market_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Caches expensive API computations (whale clustering, market summaries).
**Why**: Reduces database load and improves response times for complex queries.

### Existing Tables Used

#### `whale_balances`
- **Purpose**: Source data for whale clustering and market metrics
- **Usage**: Grouped by behavior patterns to create whale clusters

#### `alert_events`
- **Purpose**: Real-time alert stream data
- **Usage**: Filtered and displayed in the alerts sidebar

#### `price_providers`
- **Purpose**: Market volume and price data
- **Usage**: Powers market health metrics

#### `whale_transactions`
- **Purpose**: Transaction analysis for whale behavior
- **Usage**: Fallback data source for clustering when balances unavailable

## API Endpoints

### 1. Market Summary API
**Endpoint**: `GET /functions/v1/market-summary`
**Purpose**: Provides comprehensive market health data for dashboard cards.

**Response**:
```json
{
  "marketMoodIndex": 65,
  "volume24h": 1500000000,
  "volumeDelta": 12.5,
  "activeWhales": 892,
  "whalesDelta": 8.2,
  "riskIndex": 45,
  "topAlerts": [
    {
      "id": "alert-1",
      "severity": "High",
      "title": "Large ETH Movement",
      "description": "25M USDT transferred to Binance",
      "timestamp": "2025-01-25T10:30:00Z",
      "chain": "ETH"
    }
  ],
  "refreshedAt": "2025-01-25T10:35:00Z"
}
```

**Implementation**: 
- Queries `price_providers` for volume data
- Counts active whales from `whale_balances`
- Aggregates high-priority alerts from `alert_events`
- Calculates market mood using volume, whale activity, and risk metrics

### 2. Whale Clusters API
**Endpoint**: `GET /functions/v1/whale-clusters`
**Purpose**: Returns behavioral clusters of whale addresses.

**Response**:
```json
[
  {
    "id": "cex-inflow",
    "type": "CEX_INFLOW",
    "name": "CEX Inflow Whales",
    "membersCount": 23,
    "sumBalanceUsd": 450000000,
    "riskScore": 75,
    "stats": {
      "avgBalance": 19565217,
      "medianBalance": 15652174,
      "totalTransactions24h": 45,
      "netFlow24h": -12500000
    }
  }
]
```

**Implementation**:
- Primary: Clusters whales from `whale_balances` by activity patterns
- Fallback: Uses `whale_transactions` when balance data unavailable
- Clustering logic: Dormant (30+ days), CEX (exchange addresses), DeFi, Accumulation, Distribution

### 3. Alerts Stream API
**Endpoint**: `POST /functions/v1/alerts-stream` (via React Query hook)
**Purpose**: Filtered real-time alert stream for sidebar.

**Request Body**:
```json
{
  "filters": {
    "severity": ["High", "Medium"],
    "chains": ["ETH", "BTC"],
    "minUsd": 1000000
  },
  "cursor": "2025-01-25T10:00:00Z",
  "userId": "user-123"
}
```

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert-123",
      "timestamp": "2025-01-25T10:30:00Z",
      "chain": "ETH",
      "token": "USDT",
      "usdAmount": 25000000,
      "fromEntity": "Unknown Whale",
      "toEntity": "Binance",
      "severity": "High",
      "score": 0.85,
      "reasons": ["large_amount", "exchange_impact"],
      "isRead": false
    }
  ],
  "cursor": "2025-01-25T10:30:00Z",
  "hasMore": true,
  "totalCount": 150
}
```

**Implementation**:
- Queries `alert_events` with user-specific filters
- Joins with `alert_config` for trigger metadata
- Supports pagination via cursor-based approach

## Feature Mapping

### Intelligence Hub Tab
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Market Health Cards | `/market-summary` | `price_providers`, `whale_balances`, `alert_events` | Real-time market metrics |
| Whale Clusters | `/whale-clusters` | `whale_balances`, `whale_transactions` | Behavioral whale grouping |
| Alert Stream | React Query Hook | `alert_events`, `alert_config` | Live transaction alerts |
| AI Digest | Frontend Computed | `alert_events` (filtered) | Alert summarization |

### Whale Analytics Tab
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Whale Transactions | `useWhaleAnalytics` hook | `whale_balances`, `whale_signals`, `whale_transfers` | Live whale transaction data |
| Whale Clustering | Frontend Algorithm | `whale_balances` | Behavioral clustering of addresses |
| Counterparty Graph | Frontend Component | `whale_transfers` | Transaction relationship visualization |
| Risk Assessment | Frontend Computed | `whale_signals` | Whale risk scoring and analysis |

### Sentiment Tab
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Multi-Coin Sentiment | External API | Cache/Frontend State | Real-time sentiment tracking |
| Fear & Greed Index | External API | Cache/Frontend State | Market mood indicator |
| Sentiment History | External API | Cache/Frontend State | Historical sentiment trends |

### Correlation Tab
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Sentiment Heatmap | Frontend Computed | Sentiment data cache | Cross-asset correlation analysis |
| Mobile Correlation | Frontend Component | Sentiment data cache | Mobile-optimized correlation view |

### Portfolio Tab
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Portfolio Tracking | `usePortfolioSummary` | `user_portfolio_addresses`, `portfolio_snapshots` | Personal wallet monitoring |
| Whale Interactions | Frontend Analysis | `whale_transfers`, portfolio data | Whale-to-user transaction analysis |
| Performance Metrics | Frontend Computed | Portfolio and market data | PnL and performance tracking |

### Shared Features
| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| Watchlist | Frontend State | `watchlist` | User entity tracking across tabs |
| Export Features | Frontend Functions | All relevant tables | Data export for premium users |
| Real-time Updates | WebSocket/Polling | Various tables | Live data synchronization |
| Toolbar Filters | Frontend State | URL parameters | Cross-tab filtering and search |

## Implementation Notes

### Libraries & SDKs
- **Frontend**: React 18, TypeScript, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **State Management**: React Query for server state, React hooks for local state

### Error Handling Strategy
```typescript
// API Error Handling
const { data, error, isLoading } = useQuery({
  queryKey: ['market', 'summary'],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke('market-summary');
    if (error) throw error;
    return data;
  },
  staleTime: 30 * 1000,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

### Caching Strategy
- **Client-side**: React Query with 30s stale time for market data, 5min for clusters
- **Server-side**: `market_intelligence_cache` table with TTL-based expiration
- **Cache Keys**: Structured as `{endpoint}:{params_hash}` for efficient lookups

### Rate Limiting
- **Edge Functions**: Built-in Supabase rate limiting (100 req/min per user)
- **Database**: Connection pooling via Supabase
- **Frontend**: React Query deduplication prevents duplicate requests

## Developer Guide

### Local Development Setup

1. **Prerequisites**
```bash
# Install Supabase CLI
npm install -g supabase

# Clone and install dependencies
git clone <repository>
cd smart-stake
npm install
```

2. **Database Setup**
```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

3. **Deploy Edge Functions**
```bash
# Deploy market intelligence functions
supabase functions deploy market-summary
supabase functions deploy whale-clusters

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY="your-key"
```

4. **Start Development Server**
```bash
npm run dev
```

### Database Seeding

```sql
-- Seed whale balance data
INSERT INTO whale_balances (wallet_address, chain, balance_usd, risk_score, last_updated) VALUES
('0x1234...', 'ETH', 50000000, 75, NOW()),
('0x5678...', 'ETH', 25000000, 45, NOW());

-- Seed alert events
INSERT INTO alert_events (user_id, trigger_data, created_at) VALUES
(auth.uid(), '{"severity": "High", "amount": 25000000, "chain": "ETH"}', NOW());
```

### Testing APIs

```bash
# Test market summary
curl -X GET "http://localhost:54321/functions/v1/market-summary" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test whale clusters
curl -X GET "http://localhost:54321/functions/v1/whale-clusters" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Extending with New APIs

1. **Create Edge Function**
```bash
supabase functions new your-new-function
```

2. **Implement Function**
```typescript
// supabase/functions/your-new-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
  
  // Your logic here
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

3. **Add React Hook**
```typescript
// src/hooks/useYourNewHook.ts
export function useYourNewData() {
  return useQuery({
    queryKey: ['your', 'data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('your-new-function');
      if (error) throw error;
      return data;
    }
  });
}
```

4. **Deploy and Test**
```bash
supabase functions deploy your-new-function
```

### Performance Optimization

- **Database Indexes**: All foreign keys and frequently queried columns are indexed
- **Query Optimization**: Use `EXPLAIN ANALYZE` to optimize slow queries
- **Caching**: Implement server-side caching for expensive computations
- **Pagination**: Use cursor-based pagination for large datasets

### Security Considerations

- **RLS Policies**: All tables have Row Level Security enabled
- **API Authentication**: All endpoints require valid Supabase JWT
- **Input Validation**: Edge Functions validate all input parameters
- **CORS**: Properly configured for frontend domain only

### Monitoring & Debugging

- **Supabase Dashboard**: Monitor function invocations and errors
- **Database Logs**: Check slow query logs and connection metrics
- **Frontend DevTools**: React Query DevTools for cache inspection
- **Error Tracking**: Implement error boundaries and logging

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Edge Functions are deployed and CORS headers are set
2. **Database Connection**: Check RLS policies and user permissions
3. **Cache Issues**: Clear React Query cache or check TTL settings
4. **Type Errors**: Regenerate TypeScript types after schema changes

### Debug Commands

```bash
# Check function logs
supabase functions logs whale-clusters

# Test database connection
supabase db diff

# Validate migrations
supabase db lint
```