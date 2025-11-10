# Design Document: AlphaWhale Hunter Screen (Feed)

## Overview

The Hunter Screen is a high-performance, personalized discovery feed for DeFi opportunities. This design document outlines the technical architecture, component structure, data models, and implementation strategies to meet the requirements specified in requirements.md.

**Key Design Principles:**
- **Performance First**: Sub-1s FCP, <150ms interactions, P95 API <200ms
- **Security by Default**: Guardian trust integration, CSP, sanitization
- **Progressive Enhancement**: Works without wallet, enhanced with connection
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
- **Scalability**: Edge caching, cursor pagination, efficient queries

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Next.js/React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Hunter Screen│  │ Filter Drawer│  │ Right Rail   │      │
│  │   Component  │  │  Component   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  API Client  │                         │
│                     │  (React Query│                         │
│                     │   + SWR)     │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Edge CDN      │
                    │  (Vercel/CF)    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/hunter/ │  │ /api/guardian│  │ /api/eligib  │      │
│  │ opportunities│  │  /summary    │  │  ility/prev  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  Services    │                         │
│                     │  Layer       │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Data Layer (Supabase)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ opportunities│  │ guardian_    │  │ eligibility_ │      │
│  │    table     │  │  scans       │  │   cache      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ user_prefs   │  │ saved_items  │  │ analytics_   │      │
│  │              │  │              │  │  events      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with Server Components
- TypeScript 5+
- TailwindCSS + shadcn/ui components
- React Query (TanStack Query) for data fetching
- Zustand for client state management
- Zod for runtime validation

**Backend:**
- Next.js API Routes (Edge Runtime where possible)
- Supabase (PostgreSQL + Realtime + Auth)
- Redis for caching (Upstash/Vercel KV)
- Feature flags (Vercel Edge Config or LaunchDarkly)

**External Services:**
- Stripe (payment processing)
- Guardian API (security scanning)
- DeFiLlama API (yield data)
- Galxe/Layer3/Zealy APIs (quest data)
- Analytics (PostHog or Mixpanel)

## Components and Interfaces

### Component Hierarchy

```
HunterScreen (Page)
├── HunterHeader
│   ├── SearchBar
│   ├── QuickFilters
│   └── CreateOpportunityCTA
├── HunterTabs
│   └── TabList (All/Airdrops/Quests/Yield/Points/Featured)
├── FilterDrawer
│   ├── TypeFilter
│   ├── ChainFilter
│   ├── TrustLevelFilter
│   ├── RewardRangeFilter
│   ├── UrgencyFilter
│   ├── EligibilityToggle
│   ├── DifficultyFilter
│   └── SortSelector
├── OpportunityFeed
│   ├── StickySubFilters
│   ├── OpportunityGrid
│   │   └── OpportunityCard[]
│   │       ├── CardHeader
│   │       ├── GuardianTrustChip
│   │       ├── RewardDisplay
│   │       ├── MetaInfo
│   │       ├── EligibilityPreview
│   │       ├── CTAButton
│   │       └── ActionButtons
│   └── InfiniteScrollTrigger
├── RightRail (Desktop only)
│   ├── PersonalPicks
│   ├── SavedItems
│   └── SeasonProgress
└── Footer
    ├── LegalLinks
    ├── DocsLink
    └── ReportIssue
```

### Key Component Interfaces

#### OpportunityCard Component

```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onCTAClick: (id: string, action: CTAAction) => void;
  isConnected: boolean;
  userWallet?: string;
}

interface Opportunity {
  id: string;
  slug: string;
  title: string;
  protocol: {
    name: string;
    logo: string;
  };
  type: OpportunityType;
  chains: Chain[];
  reward: {
    min: number;
    max: number;
    currency: RewardUnit;
    confidence: 'estimated' | 'confirmed';
  };
  apr?: number;
  trust: {
    score: number;
    level: 'green' | 'amber' | 'red';
    last_scanned_ts: string;
    issues?: string[];
  };
  urgency?: 'ending_soon' | 'new' | 'hot';
  difficulty: 'easy' | 'medium' | 'advanced';
  eligibility_preview?: {
    status: 'likely' | 'maybe' | 'unlikely' | 'unknown';
    reasons: string[];
  };
  featured: boolean;
  sponsored: boolean;
  time_left_sec?: number;
  badges: Badge[];
}

type OpportunityType = 
  | 'airdrop' 
  | 'quest' 
  | 'staking' 
  | 'yield' 
  | 'points' 
  | 'loyalty' 
  | 'testnet';

type RewardUnit = 
  | 'TOKEN' 
  | 'USD' 
  | 'APR' 
  | 'APY' 
  | 'POINTS' 
  | 'NFT';

type Chain = 
  | 'ethereum' 
  | 'base' 
  | 'arbitrum' 
  | 'optimism' 
  | 'polygon' 
  | 'solana' 
  | 'avalanche';

type CTAAction = 
  | 'claim' 
  | 'start_quest' 
  | 'stake' 
  | 'view';

interface Badge {
  type: 'featured' | 'sponsored' | 'season_bonus' | 'retroactive';
  label: string;
}
```

#### FilterDrawer Component

```typescript
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

interface FilterState {
  search: string;
  types: OpportunityType[];
  chains: Chain[];
  trustMin: number;
  rewardMin: number;
  rewardMax: number;
  urgency: ('ending_soon' | 'new' | 'hot')[];
  eligibleOnly: boolean;
  difficulty: ('easy' | 'medium' | 'advanced')[];
  sort: SortOption;
  showRisky: boolean;
}

type SortOption = 
  | 'recommended' 
  | 'ends_soon' 
  | 'highest_reward' 
  | 'newest' 
  | 'trust';
```

## Data Models

### Database Schema (Supabase/PostgreSQL)

```sql
-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  protocol_name TEXT NOT NULL,
  protocol_logo TEXT,
  type opportunity_type NOT NULL,
  chains TEXT[] NOT NULL,
  reward_min NUMERIC,
  reward_max NUMERIC,
  reward_currency reward_unit,
  reward_confidence TEXT CHECK (reward_confidence IN ('estimated', 'confirmed')),
  apr NUMERIC,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'advanced')),
  featured BOOLEAN DEFAULT FALSE,
  sponsored BOOLEAN DEFAULT FALSE,
  time_left_sec INTEGER,
  external_url TEXT,
  dedupe_key TEXT UNIQUE NOT NULL, -- {protocol_slug}:{type}:{campaign_id}:{chain}
  source TEXT NOT NULL CHECK (source IN ('partner', 'internal', 'aggregator')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'expired', 'flagged', 'quarantined')),
  urgency TEXT CHECK (urgency IN ('ending_soon', 'new', 'hot')),
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100), -- Denormalized from latest Guardian scan
  trust_level TEXT CHECK (trust_level IN ('green', 'amber', 'red')), -- Denormalized from latest Guardian scan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Guardian scans table
CREATE TABLE guardian_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('green', 'amber', 'red')),
  issues JSONB DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, scanned_at)
);

-- Eligibility cache table
CREATE TABLE eligibility_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('likely', 'maybe', 'unlikely', 'unknown')),
  score NUMERIC CHECK (score >= 0 AND score <= 1),
  reasons JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(opportunity_id, wallet_address)
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_chains TEXT[],
  trust_tolerance INTEGER DEFAULT 60,
  time_budget TEXT CHECK (time_budget IN ('easy_first', 'any')),
  show_risky_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved opportunities table
CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Completed opportunities table
CREATE TABLE completed_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id_hash TEXT, -- Salted hash, never plain wallet
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_chains ON opportunities USING GIN(chains);
CREATE INDEX idx_opportunities_published ON opportunities(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_opportunities_expires ON opportunities(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_opportunities_dedupe ON opportunities(dedupe_key);
CREATE INDEX idx_guardian_scans_opportunity ON guardian_scans(opportunity_id, scanned_at DESC);
CREATE INDEX idx_guardian_scans_level ON guardian_scans(level);
CREATE INDEX idx_eligibility_cache_lookup ON eligibility_cache(opportunity_id, wallet_address, expires_at);
CREATE INDEX idx_saved_opportunities_user ON saved_opportunities(user_id, saved_at DESC);
CREATE INDEX idx_completed_opportunities_user ON completed_opportunities(user_id, completed_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);

-- Optimized indexes for feed queries
CREATE INDEX idx_opps_published_green ON opportunities(published_at DESC) 
  WHERE status='published' AND trust_level='green';
CREATE INDEX idx_opps_status_trust_urgency ON opportunities(status, trust_level, urgency);
CREATE INDEX idx_opps_featured ON opportunities(featured) WHERE featured=true;
CREATE INDEX idx_opps_trust_published ON opportunities(trust_level, published_at DESC);

-- Enums
CREATE TYPE opportunity_type AS ENUM (
  'airdrop', 'quest', 'staking', 'yield', 'points', 'loyalty', 'testnet'
);

CREATE TYPE reward_unit AS ENUM (
  'TOKEN', 'USD', 'APR', 'APY', 'POINTS', 'NFT'
);

CREATE TYPE opportunity_status AS ENUM (
  'draft', 'published', 'expired', 'flagged', 'quarantined'
);

CREATE TYPE urgency_type AS ENUM (
  'ending_soon', 'new', 'hot'
);

-- Trigger to keep trust snapshot fresh on new Guardian scans
CREATE OR REPLACE FUNCTION apply_latest_guardian_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE opportunities
    SET trust_score = NEW.score,
        trust_level = NEW.level,
        updated_at  = NOW()
  WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guardian_snapshot
AFTER INSERT ON guardian_scans
FOR EACH ROW EXECUTE PROCEDURE apply_latest_guardian_snapshot();

-- Function for deterministic opportunity upsert with source precedence
CREATE OR REPLACE FUNCTION upsert_opportunity(
  p_slug TEXT, p_source TEXT, p_dedupe_key TEXT, p_payload JSONB
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO opportunities (
    slug, source, dedupe_key, title, protocol_name, protocol_logo,
    type, chains, reward_min, reward_max, reward_currency, reward_confidence,
    apr, difficulty, featured, sponsored, external_url, published_at, expires_at
  )
  VALUES (
    p_slug, p_source, p_dedupe_key,
    p_payload->>'title',
    p_payload->>'protocol_name',
    p_payload->>'protocol_logo',
    (p_payload->>'type')::opportunity_type,
    ARRAY(SELECT jsonb_array_elements_text(p_payload->'chains')),
    (p_payload->>'reward_min')::NUMERIC,
    (p_payload->>'reward_max')::NUMERIC,
    (p_payload->>'reward_currency')::reward_unit,
    p_payload->>'reward_confidence',
    (p_payload->>'apr')::NUMERIC,
    p_payload->>'difficulty',
    COALESCE((p_payload->>'featured')::BOOLEAN, FALSE),
    COALESCE((p_payload->>'sponsored')::BOOLEAN, FALSE),
    p_payload->>'external_url',
    (p_payload->>'published_at')::timestamptz,
    (p_payload->>'expires_at')::timestamptz
  )
  ON CONFLICT (dedupe_key) DO UPDATE
  SET
    -- Precedence: Partner > Internal > Aggregator
    title = CASE
      WHEN EXCLUDED.source='partner' OR (opportunities.source='aggregator' AND EXCLUDED.source='internal')
      THEN EXCLUDED.title ELSE opportunities.title END,
    protocol_logo = COALESCE(EXCLUDED.protocol_logo, opportunities.protocol_logo),
    reward_min = COALESCE(EXCLUDED.reward_min, opportunities.reward_min),
    reward_max = COALESCE(EXCLUDED.reward_max, opportunities.reward_max),
    reward_currency = COALESCE(EXCLUDED.reward_currency, opportunities.reward_currency),
    apr = COALESCE(EXCLUDED.apr, opportunities.apr),
    updated_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_ins_saved ON saved_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY p_sel_saved ON saved_opportunities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY p_del_saved ON saved_opportunities
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE completed_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_rw_completed ON completed_opportunities
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analytics events: write-only, no read from client
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_ins_analytics ON analytics_events
  FOR INSERT WITH CHECK (true);
REVOKE SELECT ON analytics_events FROM anon, authenticated;
```

### API Response Schemas

```typescript
// GET /api/hunter/opportunities response
interface OpportunitiesResponse {
  items: Opportunity[];
  cursor: string | null;
  ts: string; // RFC3339 UTC
}

// Error response
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retry_after_sec?: number;
  };
}

type ErrorCode = 
  | 'RATE_LIMITED'
  | 'BAD_FILTER'
  | 'INTERNAL'
  | 'UNAVAILABLE'
  | 'NOT_ALLOWED_GEO'
  | 'NOT_ALLOWED_KYC';

// GET /api/guardian/summary response
interface GuardianSummaryResponse {
  summaries: {
    [opportunityId: string]: {
      score: number;
      level: 'green' | 'amber' | 'red';
      last_scanned_ts: string;
      top_issues: string[];
    };
  };
}

// GET /api/eligibility/preview response
interface EligibilityPreviewResponse {
  status: 'likely' | 'maybe' | 'unlikely' | 'unknown';
  score: number;
  reasons: string[];
  cached_until: string;
}
```

## Error Handling

### Error Handling Strategy

1. **API Errors**: Structured error responses with stable codes
2. **Network Errors**: Retry with exponential backoff
3. **Rate Limiting**: Respect Retry-After headers
4. **Validation Errors**: Client-side validation with Zod
5. **Fallback UI**: Cached results when API unavailable

### Error Boundary Implementation

```typescript
class HunterScreenErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Tests
- Component rendering and interactions
- Filter logic and state management
- Data transformation utilities
- Eligibility scoring algorithm

### Integration Tests
- API route handlers
- Database queries and mutations
- Guardian integration
- Eligibility preview service

### E2E Tests (Playwright)
- Feed loading and pagination
- Filter application and persistence
- Card interactions (save, share, report)
- Accessibility compliance
- Mobile responsive behavior

### Performance Tests
- Lighthouse CI for FCP/TTI metrics
- API load testing (k6)
- Database query performance
- Cache hit rates

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**: Dynamic imports for heavy components
2. **Image Optimization**: Next.js Image component with lazy loading
3. **Virtual Scrolling**: React Virtual for large lists
4. **Memoization**: React.memo for expensive components
5. **Debouncing**: Search and filter inputs
6. **Prefetching**: Next page at 70% scroll

### Backend Optimizations

1. **Edge Caching**: CDN caching for anonymous users
2. **Database Indexing**: Optimized queries with proper indexes
3. **Query Batching**: Batch Guardian summaries
4. **Cursor Pagination**: Efficient infinite scroll
5. **Redis Caching**: Hot data in memory
6. **Connection Pooling**: Supabase connection management

### Caching Strategy

```typescript
// Cache layers
const CACHE_STRATEGY = {
  // Edge CDN (Vercel/Cloudflare)
  edge: {
    anonymous: {
      ttl: 300, // 5 minutes
      staleWhileRevalidate: 300,
    },
    authenticated: {
      bypass: true, // Personalized content
    },
  },
  
  // Redis/KV
  redis: {
    guardianScans: {
      ttl: 3600, // 1 hour
    },
    eligibilityCache: {
      ttl: 3600, // 1 hour
    },
    trendingOpportunities: {
      ttl: 600, // 10 minutes
    },
  },
  
  // Client (React Query)
  client: {
    opportunities: {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
    },
    filters: {
      staleTime: Infinity, // Never stale
    },
  },
};
```

## Security Considerations

### Content Security Policy

```typescript
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'vercel.live'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:', 'imageproxy.alphawhale.com'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://api.alphawhale.com',
    'https://*.supabase.co',
    'https://analytics.alphawhale.com',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
```

### Input Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize markdown/HTML content
function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

// Safe link redirector
function createSafeLink(url: string): string {
  const encoded = encodeURIComponent(url);
  return `/r?u=${encoded}`;
}
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 h'), // 60 requests per hour
  analytics: true,
});

// Apply rate limiting
async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new RateLimitError({
      limit,
      reset,
      remaining,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    });
  }
}
```

## Monitoring and Observability

### Metrics to Track

1. **Performance Metrics**
   - FCP, LCP, TTI, CLS
   - API P50, P95, P99 latency
   - Cache hit rates
   - Database query times

2. **Business Metrics**
   - Feed views per user
   - Filter usage patterns
   - Card click-through rates
   - Conversion by pillar
   - Trust score vs conversion correlation

3. **Error Metrics**
   - Error rate by endpoint
   - Failed requests by error code
   - Client-side errors
   - Rate limit hits

### Alerting Rules

```typescript
const ALERT_RULES = {
  api_latency_p95: {
    threshold: 200, // ms
    window: '5m',
    severity: 'warning',
  },
  error_rate: {
    threshold: 0.01, // 1%
    window: '5m',
    severity: 'critical',
  },
  frontend_tti: {
    threshold: 2000, // ms
    percentile: 95,
    severity: 'warning',
  },
};
```

## Deployment Strategy

### Feature Flags

```typescript
interface FeatureFlags {
  rankingModelV2: boolean;
  eligibilityPreviewV2: boolean;
  sponsoredPlacementV2: boolean;
  guardianChipStyleV2: boolean;
}

// Gradual rollout
const ROLLOUT_PERCENTAGES = {
  rankingModelV2: 10, // 10% of users
  eligibilityPreviewV2: 50, // 50% of users
  sponsoredPlacementV2: 100, // All users
  guardianChipStyleV2: 0, // Disabled
};
```

### Deployment Checklist

- [ ] Run all tests (unit, integration, E2E)
- [ ] Check Lighthouse scores (FCP < 1s, TTI < 2s)
- [ ] Verify database migrations
- [ ] Test feature flags
- [ ] Review security headers
- [ ] Check rate limiting configuration
- [ ] Verify CDN cache configuration
- [ ] Test error handling and fallbacks
- [ ] Validate analytics events
- [ ] Review monitoring dashboards

## Implementation Details

### Cursor Pagination

Stable, opaque cursor encoding to prevent flicker and ensure consistent ordering:

```typescript
// lib/cursor.ts
export type CursorTuple = [number, number, string, string];
// [rank_score(desc), trust_score(desc), ends_at(asc RFC3339), id(asc)]

export function encodeCursor(t: CursorTuple): string {
  return Buffer.from(JSON.stringify(t)).toString('base64url');
}

export function decodeCursor(s: string): CursorTuple {
  return JSON.parse(Buffer.from(s, 'base64url').toString());
}

// SQL query with tie-breakers matching Requirement 3.7
const query = `
  SELECT * FROM opportunities
  WHERE status = 'published'
    AND (rank_score, trust_score, expires_at, id) < ($1, $2, $3, $4)
  ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
  LIMIT 12
`;
```

### Eligibility Scoring Algorithm

Deterministic scoring matching Requirement 6 weights:

```typescript
// lib/eligibility.ts
export interface EligibilitySignals {
  walletAgeDays: number;
  txCount: number;
  holdsOnChain: boolean;
  hasOnChainForChain: (chain: string) => boolean;
  allowlistProofs: boolean;
}

export function calculateEligibilityScore(signals: EligibilitySignals): {
  score: number;
  label: 'likely' | 'maybe' | 'unlikely';
} {
  // Chain presence: 40% weight
  const chainPresence = signals.hasOnChainForChain ? 1 : 0;
  
  // Wallet age: 25% weight (capped at 30 days)
  const age = Math.min(signals.walletAgeDays / 30, 1);
  
  // Transaction count: 20% weight (capped at 10 transactions)
  const tx = Math.min(signals.txCount / 10, 1);
  
  // Holdings: 15% weight
  const holds = signals.holdsOnChain ? 1 : 0;
  
  // Allowlist proofs: boolean bonus
  const bonus = signals.allowlistProofs ? 0.05 : 0;
  
  const score = 0.40 * chainPresence + 0.25 * age + 0.20 * tx + 0.15 * holds + bonus;
  
  const label = score >= 0.70 ? 'likely' : score >= 0.40 ? 'maybe' : 'unlikely';
  
  return { score: Number(score.toFixed(2)), label };
}
```

### Feed API Implementation

Next.js 14 App Router with proper headers, ETag, and rate limiting:

```typescript
// app/api/hunter/opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { encodeCursor } from '@/lib/cursor';
import { hashETag } from '@/lib/etag';
import { getFeedPage } from '@/lib/feed';
import { checkRateLimit } from '@/lib/rate-limit';

const QuerySchema = z.object({
  q: z.string().optional(),
  type: z.array(z.enum(['airdrop', 'quest', 'staking', 'yield', 'points', 'loyalty', 'testnet'])).optional(),
  chains: z.array(z.string()).optional(),
  trust_min: z.coerce.number().min(0).max(100).default(80),
  eligible: z.coerce.boolean().optional(),
  sort: z.enum(['recommended', 'ends_soon', 'highest_reward', 'newest', 'trust']).default('recommended'),
  cursor: z.string().nullish(),
  mode: z.enum(['fixtures']).optional(),
});

export async function GET(req: NextRequest) {
  // Rate limiting
  const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
  try {
    await checkRateLimit(identifier);
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests', retry_after_sec: error.retryAfter } },
      { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
    );
  }

  // Validate query parameters
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_FILTER', message: 'Invalid query parameters' } },
      { status: 400 }
    );
  }

  // Fetch data
  const data = await getFeedPage(parsed.data);

  const body = {
    items: data.items,
    cursor: data.nextCursorTuple ? encodeCursor(data.nextCursorTuple) : null,
    ts: new Date().toISOString(),
  };

  // ETag support for 304 Not Modified
  const etag = await hashETag(body);
  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { 
      status: 304, 
      headers: { ETag: etag } 
    });
  }

  // Response with proper headers
  const res = NextResponse.json(body, { status: 200 });
  res.headers.set('ETag', etag);
  res.headers.set('Cache-Control', 'max-age=60, stale-while-revalidate=300');
  res.headers.set('X-API-Version', '1.0.0');
  
  return res;
}
```

### Content Sanitization

Server-side HTML/Markdown sanitization with DOMPurify:

```typescript
// lib/sanitize.ts
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window as any);
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: { 'a': ['href', 'rel', 'target'] },
    ALLOW_DATA_ATTR: false,
  });
}

export function createSafeLink(url: string): string {
  return `/r?u=${encodeURIComponent(url)}`;
}
```

### Guardian Staleness Job

Edge cron job to rescan stale opportunities and purge cache:

```typescript
// jobs/guardian-rescan.ts
import { listStaleOpportunities } from '@/lib/guardian';
import { queueRescan } from '@/lib/guardian-queue';
import { purgeCDNCache } from '@/lib/cdn';

export async function run() {
  // Find opportunities with scans older than 24 hours
  const stale = await listStaleOpportunities({ olderThanHours: 24 });
  
  // Queue for rescan
  await Promise.all(stale.map(op => queueRescan(op.id)));
  
  // Purge CDN cache for opportunities whose trust category changed
  const categoryFlips = await listCategoryFlips({ windowMinutes: 5 });
  await purgeCDNCache(categoryFlips.map(f => f.slug));
  
  console.log(`Queued ${stale.length} rescans, purged ${categoryFlips.length} cache entries`);
}
```

### Redis Key Namespacing

Consistent key naming to avoid cross-environment collisions:

```typescript
// lib/redis-keys.ts
export const RedisKeys = {
  guardianScan: (opportunityId: string) => `guardian:scan:${opportunityId}`,
  eligibility: (opportunityId: string, walletHash: string) => 
    `elig:op:${opportunityId}:wa:${walletHash}`,
  trending: () => `feed:trending`,
  userPrefs: (userId: string) => `user:prefs:${userId}`,
} as const;
```

### Content Security Policy (Production)

Tightened CSP with nonces instead of unsafe-inline/unsafe-eval:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'", // Keep for Tailwind, or use nonce
    "img-src 'self' data: https: blob: imageproxy.alphawhale.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.alphawhale.com https://analytics.alphawhale.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Pass nonce to page for inline scripts
  response.headers.set('X-Nonce', nonce);
  
  return response;
}
```

### E2E Test Examples

Playwright tests for critical requirements:

```typescript
// tests/e2e/hunter-screen.spec.ts
import { test, expect } from '@playwright/test';

test('sponsored cap per fold', async ({ page }) => {
  await page.goto('/?mode=fixtures');
  
  // Check first fold
  const firstFoldCards = await page.locator('[data-test=card]')
    .filter({ has: page.locator('[data-test=fold=1]') });
  const sponsored = firstFoldCards.locator('[data-test=badge-sponsored]');
  
  await expect(await sponsored.count()).toBeLessThanOrEqual(2);
});

test('red consent gate', async ({ page }) => {
  await page.goto('/?trust=red');
  
  // Should show consent modal
  await expect(page.getByText('Confirm: show risky items')).toBeVisible();
  
  // Accept consent
  await page.getByRole('button', { name: 'I understand' }).click();
  
  // Modal should close
  await expect(page.getByText('Confirm: show risky items')).toBeHidden();
  
  // Red items should now be visible
  await expect(page.locator('[data-test=trust-chip-red]')).toBeVisible();
});

test('no duplicates across pages', async ({ page }) => {
  await page.goto('/');
  
  const seen = new Set<string>();
  
  // Scroll through 3 pages
  for (let i = 0; i < 3; i++) {
    const ids = await page.$$eval('[data-test=card]', 
      els => els.map(e => e.getAttribute('data-id'))
    );
    
    ids.forEach(id => {
      if (seen.has(id!)) {
        throw new Error(`Duplicate card found: ${id}`);
      }
      seen.add(id!);
    });
    
    // Scroll to trigger next page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
  }
  
  expect(seen.size).toBeGreaterThan(24); // At least 2 pages loaded
});

test('accessibility compliance', async ({ page }) => {
  await page.goto('/');
  
  // Keyboard navigation
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
  
  // Screen reader labels
  const cards = await page.locator('[data-test=card]').all();
  for (const card of cards) {
    await expect(card).toHaveAttribute('aria-label');
  }
  
  // Trust chips have text labels
  const trustChips = await page.locator('[data-test=trust-chip]').all();
  for (const chip of trustChips) {
    const text = await chip.textContent();
    expect(text).toBeTruthy();
    expect(text).not.toBe(''); // Not color-only
  }
});
```

## Future Enhancements (v1.1+)

1. **Preview Share Links**: Pre-rendered OG images for opportunities
2. **Server-side Personalization**: ML-based ranking model
3. **Eligibility Simulator**: Interactive wallet simulation
4. **Saved Filter Profiles**: User-defined filter presets
5. **Live Guardian Updates**: SSE for real-time trust score changes
6. **Advanced Analytics**: Cohort analysis and funnel optimization
7. **Mobile App**: React Native implementation
8. **API for Partners**: Public API with authentication

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** After v1 launch