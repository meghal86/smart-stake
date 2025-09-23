# 🐋 WhalePlus Portfolio Intelligence System

## Overview

WhalePlus is an institutional-grade cryptocurrency portfolio intelligence platform that provides real-time whale tracking, risk analysis, and predictive analytics. The system combines live blockchain data with advanced analytics to deliver actionable insights for crypto investors and institutions.

### Purpose
- **Real-time Portfolio Monitoring**: Track multi-wallet portfolios with live price feeds
- **Whale Intelligence**: Monitor large cryptocurrency transactions and whale behavior patterns
- **Risk Analysis**: Institutional-grade risk scoring and stress testing
- **Predictive Analytics**: AI-powered market predictions and scenario modeling
- **Subscription Management**: Tiered access with Stripe integration

### High-Level Architecture

```
Frontend (React/TypeScript) → Supabase Edge Functions → PostgreSQL Database
                            ↓
External APIs: CoinGecko, Etherscan, Stripe, Whale Alert
                            ↓
Circuit Breakers & Caching → Real-time Data Processing
```

## Database Schema

### Core Tables

#### `users` (Supabase Auth)
```sql
-- Managed by Supabase Auth
id UUID PRIMARY KEY
email TEXT
created_at TIMESTAMPTZ
```
**Purpose**: User authentication and account management

#### `users_metadata`
```sql
CREATE TABLE users_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium', 'institutional')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Extended user information including subscription plans and Stripe integration

#### `user_portfolio_addresses`
```sql
CREATE TABLE user_portfolio_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  address_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address)
);
```
**Purpose**: Store user's monitored wallet addresses with custom labels and groupings

#### `portfolio_snapshots`
```sql
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  total_value_usd DECIMAL(20,2),
  risk_score DECIMAL(3,1),
  whale_interactions INTEGER DEFAULT 0,
  holdings JSONB,
  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Cache portfolio valuations and holdings data for performance

### Alert System

#### `alert_config`
```sql
CREATE TABLE alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('price_drop', 'whale_move', 'stress_impact', 'whale_proximity')),
  threshold JSONB NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  quota_daily INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: User-configured alert rules with quotas and channel preferences

#### `alert_events`
```sql
CREATE TABLE alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id UUID REFERENCES alert_config(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Store triggered alert events and read status

### Analytics & Metrics

#### `product_metrics`
```sql
CREATE TABLE product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Track user behavior and business KPIs for product analytics

#### `whale_proximity`
```sql
CREATE TABLE whale_proximity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  neighbor_address TEXT NOT NULL,
  hops INTEGER NOT NULL CHECK (hops BETWEEN 1 AND 3),
  wallet_size_tier TEXT NOT NULL CHECK (wallet_size_tier IN ('small', 'medium', 'large', 'whale')),
  block_seed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, neighbor_address, block_seed)
);
```
**Purpose**: Deterministic whale proximity graph for whale activity alerts

### Whale Intelligence

#### `whale_transactions`
```sql
CREATE TABLE whale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  amount DECIMAL(30,8) NOT NULL,
  amount_usd DECIMAL(20,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Store large cryptocurrency transactions for whale tracking

## API Endpoints

### Authentication APIs

#### `POST /auth/signup`
- **Purpose**: User registration with email/password
- **Parameters**: `{ email: string, password: string }`
- **Response**: `{ user: User, session: Session }`
- **Feature**: User onboarding and account creation

#### `POST /auth/signin`
- **Purpose**: User login authentication
- **Parameters**: `{ email: string, password: string }`
- **Response**: `{ user: User, session: Session }`
- **Feature**: User authentication

### Portfolio APIs

#### `POST /functions/v1/portfolio-tracker-live`
- **Purpose**: Real-time portfolio valuation with live prices
- **Parameters**: `{ addresses: string[] }`
- **Response**: `{ [address]: { total_value_usd, risk_score, tokens, whale_interactions } }`
- **Feature**: Live portfolio monitoring and risk analysis
- **Implementation**: Combines Etherscan ETH balances with CoinGecko prices

#### `GET /functions/v1/healthz`
- **Purpose**: System health monitoring with SLA metrics
- **Parameters**: None
- **Response**: `{ status, data_freshness, model_performance, provider_status, uptime_metrics }`
- **Feature**: Operational monitoring and circuit breaker status

### Subscription APIs

#### `POST /functions/v1/create-checkout-session`
- **Purpose**: Stripe checkout session creation
- **Parameters**: `{ priceId: string, userId: string }`
- **Response**: `{ sessionId: string, url: string }`
- **Feature**: Subscription upgrade flow

#### `POST /functions/v1/stripe-webhook`
- **Purpose**: Handle Stripe webhook events
- **Parameters**: Stripe webhook payload
- **Response**: `{ received: true }`
- **Feature**: Subscription status synchronization

### Alert APIs

#### `POST /functions/v1/alert-notifications`
- **Purpose**: Process and deliver user alerts
- **Parameters**: `{ alertId: string, userId: string }`
- **Response**: `{ delivered: boolean, channels: string[] }`
- **Feature**: Multi-channel alert delivery

#### `GET /functions/v1/whale-alerts`
- **Purpose**: Fetch recent whale transactions
- **Parameters**: `{ limit?: number, minAmount?: number }`
- **Response**: `{ transactions: WhaleTransaction[] }`
- **Feature**: Real-time whale activity monitoring

## Feature Mapping

| Feature | API Endpoints | Database Tables | Purpose |
|---------|---------------|-----------------|---------|
| **User Authentication** | `/auth/signup`, `/auth/signin` | `users`, `users_metadata` | Account management and subscription tracking |
| **Portfolio Monitoring** | `/portfolio-tracker-live` | `user_portfolio_addresses`, `portfolio_snapshots` | Real-time portfolio valuation and risk analysis |
| **Alert System** | `/alert-notifications` | `alert_config`, `alert_events` | Custom user alerts with quota management |
| **Whale Tracking** | `/whale-alerts` | `whale_transactions`, `whale_proximity` | Large transaction monitoring and whale intelligence |
| **Subscription Management** | `/create-checkout-session`, `/stripe-webhook` | `users_metadata` | Tiered access and payment processing |
| **System Health** | `/healthz` | `product_metrics` | Operational monitoring and SLA compliance |
| **Business Analytics** | Internal metrics | `product_metrics` | User behavior tracking and KPI measurement |

## Implementation Notes

### Libraries & SDKs

#### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** + **shadcn/ui** for consistent design system
- **Recharts** for data visualization
- **React Query** for API state management

#### Backend
- **Supabase** for database, authentication, and edge functions
- **Deno** runtime for edge functions
- **Stripe SDK** for payment processing
- **CoinGecko API** for cryptocurrency prices
- **Etherscan API** for Ethereum blockchain data

### Error Handling Strategy

#### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open';
  private failureThreshold: number = 5;
  private openDuration: number = 90000; // 90s
  
  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Implementation with SLA guarantees
  }
}
```

#### Error Boundaries
- **React Error Boundaries** catch component errors
- **Global error handlers** for unhandled promises
- **Graceful degradation** with cached data fallbacks

### Caching & Rate Limiting

#### Multi-Level Caching
- **Browser Cache**: 60s for price data
- **Edge Function Cache**: 30s for portfolio snapshots
- **Database Cache**: Portfolio snapshots with timestamps

#### Rate Limiting
- **Free Tier**: 5 alerts/day, basic features
- **Pro Tier**: Unlimited alerts, advanced features
- **API Rate Limits**: Respect external API limits with exponential backoff

#### Request Coalescing
```typescript
class RequestCoalescer {
  async coalesce<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Prevents stampede by coalescing concurrent requests
  }
}
```

### Performance Optimizations

#### Code Splitting
- **Route-based splitting**: <150KB per route
- **Component lazy loading**: Defer heavy components
- **Tree shaking**: Remove unused code

#### Database Optimization
- **Indexes**: Optimized for common queries
- **Row Level Security**: Secure data access
- **Connection pooling**: Efficient database connections

## Developer Guide

### Local Development Setup

#### Prerequisites
```bash
# Required tools
node >= 18
npm >= 8
supabase CLI
```

#### Installation
```bash
# Clone repository
git clone <repository-url>
cd smart-stake

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Update .env with your keys

# Database setup
supabase start
supabase db push
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Start development server
npm run dev
```

### Database Seeding

#### Run Migrations
```bash
# Apply all migrations
supabase db push

# Run specific migration
supabase migration up 20240101000000_setup_whale_tracker.sql
```

#### Seed Test Data
```bash
# Populate sample data
node scripts/generate-test-data.js

# Create test users
node scripts/test-user-auth.js

# Populate whale transactions
node scripts/populate-whale-data.js
```

### Testing

#### Unit Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

#### Integration Tests
```bash
# Test subscription flow
node scripts/test-subscription-flow.js

# Test portfolio tracking
node scripts/test-risk-scanner.js

# Validate database
node scripts/simple-validation.sql
```

#### E2E Tests
```bash
# Cypress tests
npm run cypress:open
npm run cypress:run

# Test specific features
npm run test:portfolio
npm run test:alerts
```

### Adding New APIs

#### 1. Create Edge Function
```bash
# Create new function
supabase functions new my-new-function

# Edit function
# supabase/functions/my-new-function/index.ts
```

#### 2. Add Database Tables
```sql
-- Create migration
-- supabase/migrations/YYYYMMDD_my_feature.sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Add Frontend Integration
```typescript
// src/hooks/useMyFeature.ts
export function useMyFeature() {
  return useQuery(['my-feature'], async () => {
    const { data } = await supabase.functions.invoke('my-new-function');
    return data;
  });
}
```

#### 4. Add Tests
```typescript
// src/__tests__/MyFeature.test.tsx
describe('MyFeature', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

### Deployment

#### Production Deployment
```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel --prod

# Deploy edge functions
supabase functions deploy

# Run migrations
supabase db push --linked
```

#### Environment Variables
```bash
# Production secrets
supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
supabase secrets set COINGECKO_API_KEY="your-key"
supabase secrets set ETHERSCAN_API_KEY="your-key"
```

### Monitoring & Debugging

#### Health Monitoring
- **Health Dashboard**: `/health-check` for system status
- **Circuit Breakers**: Real-time provider status
- **SLA Monitoring**: <150ms cached response guarantee

#### Debug Tools
- **Database Debug**: `src/components/debug/DatabaseStatus.tsx`
- **Subscription Debug**: `src/components/debug/SubscriptionDebug.tsx`
- **Live Data Validation**: `scripts/verify-live-data.js`

#### Logging
```typescript
// Structured logging
console.log('🚀 Portfolio valuation:', { 
  address, 
  totalValue, 
  latency: Date.now() - startTime 
});
```

This documentation provides a comprehensive overview of the WhalePlus portfolio intelligence system, enabling new engineers to understand the architecture, contribute effectively, and extend the platform with new features.