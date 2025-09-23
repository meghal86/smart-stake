# 🚀 Portfolio Intelligence Deployment Guide

## 📋 Quick Start Checklist

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] External API keys obtained

### ✅ Core Dependencies
```bash
# Install required packages
npm install recharts @radix-ui/react-slider
npm install @radix-ui/react-dialog @radix-ui/react-tabs
```

## 🔧 Environment Setup

### 1. Environment Variables
```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# External API Keys (for production)
ALCHEMY_API_KEY=your-alchemy-key
WHALE_ALERT_API_KEY=your-whale-alert-key
COINGECKO_API_KEY=your-coingecko-key
```

### 2. Supabase Configuration
```bash
# Link to your Supabase project
supabase login
supabase link --project-ref your-project-ref

# Apply database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy portfolio-tracker
supabase functions deploy whale-analytics
supabase functions deploy auto-risk-scanner
supabase functions deploy scenario-simulate
```

## 🗄️ Database Setup

### 1. Core Tables Migration
```sql
-- Run this in Supabase SQL Editor
-- Portfolio addresses table
CREATE TABLE IF NOT EXISTS portfolio_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum',
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio snapshots for caching
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  total_value_usd DECIMAL(20,2),
  risk_score DECIMAL(3,1),
  whale_interactions INTEGER DEFAULT 0,
  holdings JSONB,
  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

-- Whale interactions log
CREATE TABLE IF NOT EXISTS whale_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE,
  whale_address TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  token_symbol TEXT,
  amount DECIMAL(30,8),
  value_usd DECIMAL(20,2),
  impact_score INTEGER,
  portfolio_effect DECIMAL(5,2),
  description TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID,
  risk_type TEXT NOT NULL,
  risk_score DECIMAL(3,1),
  risk_factors JSONB,
  recommendations TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_address ON portfolio_addresses(user_id, address);
CREATE INDEX IF NOT EXISTS idx_snapshots_address_time ON portfolio_snapshots(address, snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_whale_interactions_time ON whale_interactions(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_portfolio ON risk_assessments(portfolio_id, assessed_at DESC);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_whale_interactions_composite ON whale_interactions(token_symbol, impact_score, detected_at DESC);
```

### 3. Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE portfolio_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own addresses" ON portfolio_addresses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their portfolio snapshots" ON portfolio_snapshots
  FOR SELECT USING (
    address IN (
      SELECT address FROM portfolio_addresses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view whale interactions for their tokens" ON whale_interactions
  FOR SELECT USING (true); -- Public whale data

CREATE POLICY "Users can view risk assessments for their portfolios" ON risk_assessments
  FOR SELECT USING (
    portfolio_id IN (
      SELECT id FROM portfolio_addresses WHERE user_id = auth.uid()
    )
  );
```

## ⚡ Edge Functions Deployment

### 1. Portfolio Tracker Function
```typescript
// supabase/functions/portfolio-tracker/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { addresses, enhanced = false } = await req.json()
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch portfolio data for each address
    const portfolioData = {}
    
    for (const address of addresses) {
      // Check cache first
      const { data: cached } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('address', address)
        .gte('snapshot_time', new Date(Date.now() - 30000).toISOString()) // 30 seconds
        .order('snapshot_time', { ascending: false })
        .limit(1)
        .single()

      if (cached) {
        portfolioData[address] = {
          total_value_usd: cached.total_value_usd,
          risk_score: cached.risk_score,
          whale_interactions: cached.whale_interactions,
          tokens: cached.holdings || []
        }
        continue
      }

      // Fetch fresh data from blockchain APIs
      const freshData = await fetchPortfolioData(address)
      
      // Cache the result
      await supabase.from('portfolio_snapshots').insert({
        address,
        total_value_usd: freshData.total_value_usd,
        risk_score: freshData.risk_score,
        whale_interactions: freshData.whale_interactions,
        holdings: freshData.tokens
      })

      portfolioData[address] = freshData
    }

    return new Response(
      JSON.stringify(portfolioData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function fetchPortfolioData(address: string) {
  // Mock implementation - replace with real API calls
  return {
    total_value_usd: Math.random() * 100000,
    risk_score: Math.random() * 10,
    whale_interactions: Math.floor(Math.random() * 20),
    tokens: [
      {
        symbol: 'ETH',
        balance: Math.random() * 100,
        value_usd: Math.random() * 50000,
        price_change_24h: (Math.random() - 0.5) * 20
      }
    ]
  }
}
```

### 2. Deploy All Functions
```bash
# Deploy portfolio functions
supabase functions deploy portfolio-tracker
supabase functions deploy whale-analytics
supabase functions deploy auto-risk-scanner
supabase functions deploy scenario-simulate

# Set environment variables for functions
supabase secrets set ALCHEMY_API_KEY="your-alchemy-key"
supabase secrets set WHALE_ALERT_API_KEY="your-whale-alert-key"
supabase secrets set COINGECKO_API_KEY="your-coingecko-key"
```

## 🎨 Frontend Deployment

### 1. Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'portfolio-charts': ['recharts'],
          'ui-components': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-slider']
        }
      }
    }
  }
})
```

### 2. Production Build
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY
```

## 🔄 Real-time Features Setup

### 1. WebSocket Configuration
```typescript
// src/hooks/useRealtimePortfolio.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useRealtimePortfolio(addresses: string[]) {
  const [updates, setUpdates] = useState<any[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('portfolio-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_interactions',
          filter: `token_symbol=in.(ETH,BTC,SOL,LINK,MATIC)`
        },
        (payload) => {
          setUpdates(prev => [payload.new, ...prev.slice(0, 49)]) // Keep last 50
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addresses])

  return updates
}
```

### 2. Push Notifications Setup
```typescript
// src/utils/notifications.ts
export async function setupPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.register('/sw.js')
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-public-key'
    })

    // Send subscription to backend
    await supabase.functions.invoke('notification-delivery', {
      body: { subscription, type: 'web_push' }
    })
  }
}
```

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
})
```

### 2. Analytics Setup
```typescript
// src/lib/analytics.ts
import { supabase } from '@/integrations/supabase/client'

export const trackEvent = async (event: string, properties: any) => {
  await supabase.functions.invoke('analytics-tracker', {
    body: { event, properties, timestamp: new Date().toISOString() }
  })
}

// Usage in components
trackEvent('portfolio_simulation_run', {
  scenario_type: 'market_crash',
  portfolio_value: 125000,
  user_tier: 'premium'
})
```

## 🧪 Testing Deployment

### 1. Health Check Endpoint
```bash
# Test all endpoints
curl https://your-project.supabase.co/functions/v1/portfolio-tracker/health
curl https://your-project.supabase.co/functions/v1/whale-analytics/health
curl https://your-project.supabase.co/functions/v1/auto-risk-scanner/health
```

### 2. Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

```yaml
# load-test.yml
config:
  target: 'https://your-app.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Portfolio Load Test"
    requests:
      - get:
          url: "/portfolio-enhanced"
      - post:
          url: "/api/portfolio-tracker"
          json:
            addresses: ["0x742d35Cc6634C0532925a3b8D4C9db4C532925a3"]
```

## 🔐 Security Checklist

### ✅ Pre-Production Security
- [ ] All API keys stored in environment variables
- [ ] Row Level Security enabled on all tables
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] HTTPS enforced everywhere

### ✅ Production Security
- [ ] Security headers configured
- [ ] Content Security Policy implemented
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning
- [ ] Access logs monitored
- [ ] Incident response plan documented

## 📈 Performance Optimization

### 1. Frontend Optimizations
```typescript
// Lazy loading for heavy components
const PortfolioSimulation = lazy(() => import('@/components/portfolio/PortfolioSimulation'))
const ChainBreakdownChart = lazy(() => import('@/components/portfolio/ChainBreakdownChart'))

// Memoization for expensive calculations
const memoizedRiskScore = useMemo(() => 
  calculateRiskScore(portfolioData), [portfolioData]
)

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'
```

### 2. Backend Optimizations
```sql
-- Database query optimization
EXPLAIN ANALYZE SELECT * FROM portfolio_snapshots 
WHERE address = $1 AND snapshot_time > NOW() - INTERVAL '30 seconds'
ORDER BY snapshot_time DESC LIMIT 1;

-- Add covering indexes
CREATE INDEX CONCURRENTLY idx_snapshots_covering 
ON portfolio_snapshots(address, snapshot_time DESC) 
INCLUDE (total_value_usd, risk_score, whale_interactions);
```

## 🚀 Go-Live Checklist

### ✅ Final Deployment Steps
- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] Edge functions deployed and tested
- [ ] Frontend built and deployed
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on new features

### ✅ Post-Launch Monitoring
- [ ] Error rates < 0.1%
- [ ] Response times < 500ms (P95)
- [ ] Database connections healthy
- [ ] Cache hit rates > 90%
- [ ] Real-time updates working
- [ ] User feedback collected
- [ ] Performance metrics tracked

## 🆘 Troubleshooting Guide

### Common Issues

#### 1. Slow Portfolio Loading
```bash
# Check database performance
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check cache hit rates
SELECT * FROM portfolio_snapshots WHERE snapshot_time > NOW() - INTERVAL '1 minute';
```

#### 2. Real-time Updates Not Working
```typescript
// Debug WebSocket connections
console.log('Supabase connection state:', supabase.realtime.connection.state)

// Check subscription status
const channel = supabase.channel('test')
console.log('Channel state:', channel.state)
```

#### 3. High Memory Usage
```bash
# Monitor memory usage
docker stats your-container-name

# Check for memory leaks in React
npm install --save-dev @welldone-software/why-did-you-render
```

### Support Contacts
- **Technical Issues**: tech-support@whaleplus.app
- **Database Issues**: db-admin@whaleplus.app
- **Security Issues**: security@whaleplus.app

---

## 🎯 Success Metrics Post-Deployment

### Week 1 Targets
- [ ] 99.9% uptime achieved
- [ ] < 2 second page load times
- [ ] Zero critical bugs reported
- [ ] 90%+ user satisfaction score

### Month 1 Targets
- [ ] 10K+ portfolio simulations run
- [ ] 1K+ PDF reports generated
- [ ] 95% cache hit rate maintained
- [ ] 50+ NPS score achieved

This deployment guide ensures a smooth rollout of the world-class portfolio intelligence system with institutional-grade reliability and performance.