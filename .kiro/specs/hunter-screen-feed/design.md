# Design Document: AlphaWhale Hunter Screen (Feed)

> **⚠️ ARCHITECTURE PRIORITY NOTICE**  
> This file follows the **Hunter Architecture Clarification** (ARCHITECTURE_CLARIFICATION.md).  
> **If any code examples in this document conflict with the architecture rules, the architecture document wins.**  
> 
> **Key Rule:** All business logic (ranking, eligibility scoring, solver orchestration, regulatory policy, surplus calculation, sentinel evaluation, etc.) is implemented in **Supabase Edge Functions** under `supabase/functions/*`.  
> Any `lib/*.ts` examples in this doc should be interpreted as **Edge Function internal modules**, NOT Next.js app code.

## Audit v1 Notes – How to Interpret This Design

This design file describes **what** the Hunter system does. The **where** is enforced by `ARCHITECTURE_CLARIFICATION.md` and `ARCHITECTURE_AUDIT_V1.md`.

When reading any examples in this document:

- All **ranking, eligibility, Sentinel, solver, surplus, Paymaster, policy, and Guardian logic** belong in:
  - `supabase/functions/*/index.ts`,
  - and their co-located `supabase/functions/*/lib/*.ts` helpers.

- The **Next.js app** (`app/*`, `src/components/*`, `src/hooks/*`) is **presentation only**:
  - fetches data from Edge Functions via `supabase.functions.invoke`,
  - manages UI state (tabs, filters, modals),
  - never touches Postgres directly,
  - never re-implements business logic.

Whenever this document shows a function like:

```typescript
// lib/eligibility.ts
export function calculateEligibilityScore(signals) { ... }
```

You **MUST** implement it as:

```typescript
// supabase/functions/hunter-eligibility-preview/lib/scorer.ts
export function calculateEligibilityScore(signals) { ... }
```

**NOT:**

```typescript
// src/lib/eligibility.ts  // ❌ forbidden location for business logic
```

### Additional Constraints from Architecture Audit v1

**Sentinels:**
- MUST use the Queue–Worker pattern (`sentinel-scheduler` + `sentinel-worker`)
- Worker functions MUST handle only tiny batches (1–5 contracts/opportunities)
- NO monolithic polling in a single function

**Intents & Surplus:**
- Surplus (`actualOutput - minOutput`) MUST be split at the contract level according to a configurable ratio (user / protocol / solver)
- Edge Functions only orchestrate and record events; they do not bypass this split

**Mobile ZK:**
- Heavy proving is either server-side or via native Rust/Mopro
- No large ZK circuits are generated in JS on mobile

**Paymaster:**
- Always add a risk premium and panic mode, as defined in `ARCHITECTURE_AUDIT_V1.md`

These notes are here so that AI tools (Cursor, Amazon Q, Kiro) generate code in the correct layer and avoid "smart but wrong" placements.

**See:** `ARCHITECTURE_AUDIT_V1.md` for complete audit details and code examples.

---

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

### Edge Functions Architecture (Business Logic Layer)

**CRITICAL RULE**: All business logic, calculations, and data transformations MUST live in Supabase Edge Functions. The UI is presentation-only.

**Edge Functions (supabase/functions/):**

```
supabase/functions/
├── hunter-feed/                    # Feed ranking & filtering
│   ├── index.ts                    # Main handler
│   └── lib/
│       ├── ranking-safety.ts       # Safety mode evaluation
│       ├── regulatory-policy.ts    # Geo compliance filtering
│       └── feed-query.ts           # SQL query builder
├── hunter-eligibility-preview/     # Eligibility scoring
│   ├── index.ts
│   └── lib/
│       └── eligibility-scorer.ts   # Scoring algorithm
├── hunter-intent-quote/            # Intent solver orchestration
│   ├── index.ts
│   └── lib/
│       ├── solver-orchestrator.ts  # Multi-solver quotes
│       ├── lifi-solver.ts
│       ├── oneinch-solver.ts
│       └── cowswap-solver.ts
├── hunter-intent-execute/          # Intent execution
│   ├── index.ts
│   └── lib/
│       ├── surplus-calculator.ts   # Surplus capture logic
│       └── solver-reputation.ts    # Reputation updates
├── hunter-sentinel-monitor/        # Sentinel agent monitoring (cron)
│   ├── index.ts
│   └── lib/
│       └── sentinel-evaluator.ts   # Trigger evaluation
├── hunter-threat-monitor/          # Threat detection (cron)
│   ├── index.ts
│   └── lib/
│       ├── threat-providers.ts     # Hypernative/Forta integration
│       └── circuit-breaker.ts      # Pause logic
├── guardian-liability/             # Guardian verification & staking
│   └── index.ts
├── ranking-safety/                 # Ranking metrics monitoring (cron)
│   └── index.ts
├── regulatory-policy/              # Policy engine updates
│   └── index.ts
├── zk-eligibility-verify/          # ZK proof verification
│   └── index.ts
├── paymaster-orchestrator/         # Gas abstraction
│   └── index.ts
└── _shared/                        # Shared utilities
    └── hunter/
        ├── types.ts
        ├── utils.ts
        └── db.ts
```

**Next.js API Routes (Thin Proxy Layer):**

Next.js routes at `/api/hunter/*` should ONLY:
- Validate request with Zod
- Call appropriate Edge Function via `supabase.functions.invoke()`
- Add cache headers
- Return response

**Example:**
```typescript
// app/api/hunter/opportunities/route.ts
export async function GET(req: NextRequest) {
  // 1. Validate
  const params = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  
  // 2. Call Edge Function (where all logic lives)
  const { data, error } = await supabase.functions.invoke('hunter-feed', {
    body: { ...params, region: getRegion(req) }
  });
  
  // 3. Return with headers
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'max-age=60' }
  });
}
```

**Feed Query Pipeline (Inside hunter-feed Edge Function):**

```
User Request
  ↓
1. Parse & Validate Filters
  ↓
2. Apply Regulatory Policy Engine
   - Filter by user region
   - Exclude restricted opportunities
  ↓
3. Apply Ranking Safety Mode
   - Check if safety mode active
   - Override to safe baseline if needed
  ↓
4. Execute Ranked SQL Query
   - Apply trust filters
   - Apply personalization (if wallet connected)
   - Apply cursor pagination
  ↓
5. Return OpportunitiesResponse
```

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

-- Intent & Execution tables (v2+)
CREATE TABLE intent_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opportunity_id UUID REFERENCES opportunities(id),
  intent_json JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending','quoted','executing','completed','failed','expired')) NOT NULL,
  winning_solver TEXT,
  min_output NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE intent_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent_id UUID REFERENCES intent_orders(id) ON DELETE CASCADE,
  solver TEXT NOT NULL,
  plan_json JSONB NOT NULL,
  quote_output_amount NUMERIC NOT NULL,
  quote_valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentinel Agent tables (v3)
CREATE TABLE sentinel_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opportunity_id UUID REFERENCES opportunities(id),
  position_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  mode TEXT CHECK (mode IN ('auto','manual_confirm')) NOT NULL,
  triggers JSONB NOT NULL,
  exit_strategy JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sentinel_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES sentinel_rules(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT,
  status TEXT CHECK (status IN ('pending','executing','completed','failed')) NOT NULL,
  exit_amount NUMERIC,
  actual_slippage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian Liability tables (v2)
CREATE TABLE guardian_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id),
  guardian_address TEXT NOT NULL,
  trust_level TEXT CHECK (trust_level IN ('green','amber','red')) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  liability_window_days INTEGER NOT NULL,
  stake_amount NUMERIC NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulatory Policy tables (v2)
CREATE TABLE regulatory_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT[] NOT NULL,
  asset_types TEXT[] NOT NULL,
  action_types TEXT[] NOT NULL,
  restriction TEXT NOT NULL CHECK (restriction IN ('exclude','view_only','allow')),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surplus & Solver Reputation tables (v2+)
CREATE TABLE surplus_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent_id UUID REFERENCES intent_orders(id),
  solver TEXT NOT NULL,
  user_address TEXT NOT NULL,
  total_surplus NUMERIC NOT NULL,
  user_share NUMERIC NOT NULL,
  protocol_share NUMERIC NOT NULL,
  solver_share NUMERIC NOT NULL,
  distribution JSONB NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE surplus_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_percent INTEGER NOT NULL,
  protocol_percent INTEGER NOT NULL,
  solver_percent INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE solver_reputation (
  solver TEXT PRIMARY KEY,
  total_intents INTEGER DEFAULT 0,
  avg_surplus NUMERIC DEFAULT 0,
  negative_surplus_count INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  selection_weight NUMERIC DEFAULT 0
);

-- Threat & Circuit Breaker tables (v2+)
CREATE TABLE circuit_breakers (
  opportunity_id UUID PRIMARY KEY REFERENCES opportunities(id),
  paused BOOLEAN NOT NULL DEFAULT TRUE,
  paused_at TIMESTAMPTZ NOT NULL,
  paused_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  affected_users INTEGER DEFAULT 0,
  cleared_at TIMESTAMPTZ,
  cleared_by TEXT
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol TEXT NOT NULL,
  opportunity_ids UUID[] NOT NULL,
  trigger_alert JSONB NOT NULL,
  paused_at TIMESTAMPTZ NOT NULL,
  cleared_at TIMESTAMPTZ,
  mitigation_actions TEXT[],
  affected_users INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0
);

-- ZK Eligibility tables (v3)
CREATE TABLE zk_eligibility_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id),
  proof_type TEXT NOT NULL,
  proof_hash TEXT NOT NULL,
  result TEXT CHECK (result IN ('verified_eligible','verified_ineligible','unknown')) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL
);

-- User Positions table (Emergency Exit)
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opportunity_id UUID REFERENCES opportunities(id),
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL
);

-- Enums
CREATE TYPE opportunity_type AS ENUM (
  'airdrop', 'quest', 'staking', 'yield', 'points', 'loyalty', 'testnet'
);

CREATE TYPE reward_unit AS ENUM (
  'TOKEN', 'USD', 'APR', 'APY', 'POINTS', 'NFT'
);

CREATE TYPE opportunity_status AS ENUM (
  'draft', 'published', 'expired', 'flagged', 'quarantined', 'paused_due_to_risk'
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

**LOCATION:** `supabase/functions/hunter-eligibility-preview/lib/eligibility-scorer.ts` (Edge Function internal module)

```typescript
// EDGE FUNCTION: supabase/functions/hunter-eligibility-preview/lib/eligibility-scorer.ts
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

**LOCATION:** `app/api/hunter/opportunities/route.ts` (Next.js thin proxy - calls Edge Function)

```typescript
// CLIENT PROXY: app/api/hunter/opportunities/route.ts
// This is a THIN LAYER that only validates and forwards to Edge Function
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

  // Call Edge Function (where ALL business logic lives)
  const { data, error } = await supabase.functions.invoke('hunter-feed', {
    body: parsed.data
  });
  
  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message } },
      { status: 500 }
    );
  }

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

## 
18. Multi-Wallet Selection Component

### Overview

The Multi-Wallet Selection component allows users with multiple connected wallets to switch between them, providing personalized feed ranking and eligibility checks for the selected wallet.

### Component Structure

```
WalletSelector
├── WalletButton (Trigger)
│   ├── WalletIcon
│   ├── WalletLabel/Address
│   └── ChevronDown
└── WalletDropdown (Popover)
    ├── WalletOption[] (Connected wallets)
    │   ├── CheckIcon (if active)
    │   ├── WalletIcon
    │   ├── Label
    │   └── Address
    └── ConnectButton
```

### Data Model

```typescript
interface ConnectedWallet {
  address: string;           // Ethereum address
  label?: string;            // User-defined label
  ens?: string;              // ENS name if available
  chain: string;             // Primary chain (ethereum, polygon, etc.)
  balance?: string;          // Optional balance display
  lastUsed?: Date;           // Last time this wallet was active
}

interface WalletSelectorState {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  isOpen: boolean;
  isLoading: boolean;
}
```

### Context Provider

```typescript
// src/contexts/WalletContext.tsx

interface WalletContextValue {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  setActiveWallet: (address: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  isLoading: boolean;
}

export const WalletProvider: React.FC = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('activeWallet');
    const savedWallets = localStorage.getItem('connectedWallets');
    
    if (savedWallets) {
      const wallets = JSON.parse(savedWallets);
      setConnectedWallets(wallets);
      
      if (savedWallet && wallets.some(w => w.address === savedWallet)) {
        setActiveWallet(savedWallet);
      } else if (wallets.length > 0) {
        setActiveWallet(wallets[0].address);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (activeWallet) {
      localStorage.setItem('activeWallet', activeWallet);
    }
    if (connectedWallets.length > 0) {
      localStorage.setItem('connectedWallets', JSON.stringify(connectedWallets));
    }
  }, [activeWallet, connectedWallets]);

  const handleSetActiveWallet = useCallback((address: string) => {
    setIsLoading(true);
    setActiveWallet(address);
    
    // Update lastUsed timestamp
    setConnectedWallets(prev => 
      prev.map(w => 
        w.address === address 
          ? { ...w, lastUsed: new Date() }
          : w
      )
    );
    
    // Trigger feed refresh
    queryClient.invalidateQueries(['hunter-feed']);
    
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return (
    <WalletContext.Provider value={{
      connectedWallets,
      activeWallet,
      setActiveWallet: handleSetActiveWallet,
      connectWallet,
      disconnectWallet,
      isLoading,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
```

### Component Implementation

```typescript
// src/components/hunter/WalletSelector.tsx

export function WalletSelector() {
  const { 
    connectedWallets, 
    activeWallet, 
    setActiveWallet, 
    connectWallet,
    isLoading 
  } = useWallet();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleWalletChange = (address: string) => {
    setActiveWallet(address);
    setIsOpen(false);
  };

  // No wallets connected - show connect button
  if (connectedWallets.length === 0) {
    return (
      <button 
        onClick={connectWallet}
        className="connect-wallet-btn"
        aria-label="Connect wallet"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  const active = connectedWallets.find(w => w.address === activeWallet);
  const displayName = active?.ens || active?.label || truncateAddress(active?.address);

  return (
    <div className="wallet-selector" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="wallet-selector-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        <WalletIcon chain={active?.chain} className="w-5 h-5" />
        <div className="wallet-info">
          <span className="wallet-name">{displayName}</span>
          <span className="wallet-address">{truncateAddress(active?.address)}</span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="wallet-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Connected Wallets */}
            {connectedWallets.map((wallet) => {
              const isActive = wallet.address === activeWallet;
              const displayName = wallet.ens || wallet.label || 'Wallet';
              
              return (
                <button
                  key={wallet.address}
                  onClick={() => handleWalletChange(wallet.address)}
                  className={`wallet-option ${isActive ? 'active' : ''}`}
                  title={wallet.address}
                  aria-label={`Select ${displayName}`}
                >
                  {isActive && <Check className="w-4 h-4 text-green-500" />}
                  <WalletIcon chain={wallet.chain} className="w-5 h-5" />
                  <div className="wallet-details">
                    <span className="wallet-label">{displayName}</span>
                    <span className="wallet-address">{truncateAddress(wallet.address)}</span>
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div className="wallet-dropdown-divider" />

            {/* Connect New Wallet */}
            <button
              onClick={() => {
                connectWallet();
                setIsOpen(false);
              }}
              className="wallet-option connect-new"
              aria-label="Connect new wallet"
            >
              <Plus className="w-4 h-4" />
              <span>Connect New Wallet</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility function
function truncateAddress(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

### Styling

```css
/* Light Theme */
.wallet-selector {
  position: relative;
}

.wallet-selector-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.wallet-selector-trigger:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(20, 184, 166, 0.3);
}

.wallet-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.wallet-name {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.wallet-address {
  font-size: 12px;
  color: #64748B;
  font-family: 'Roboto Mono', monospace;
}

.wallet-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 50;
}

.wallet-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
  text-align: left;
}

.wallet-option:hover {
  background: rgba(20, 184, 166, 0.08);
}

.wallet-option.active {
  background: rgba(20, 184, 166, 0.12);
}

.wallet-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.wallet-label {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.wallet-dropdown-divider {
  height: 1px;
  background: rgba(229, 231, 235, 0.5);
  margin: 8px 0;
}

.connect-new {
  color: #14B8A6;
  font-weight: 600;
}

/* Dark Theme */
.dark .wallet-selector-trigger {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .wallet-name {
  color: #E4E8F3;
}

.dark .wallet-address {
  color: #94A3B8;
}

.dark .wallet-dropdown {
  background: rgba(15, 23, 42, 0.95);
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.dark .wallet-label {
  color: #E4E8F3;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .wallet-selector-trigger {
    padding: 8px 12px;
    gap: 8px;
  }

  .wallet-info {
    display: none; /* Hide on mobile, show only icon */
  }

  .wallet-dropdown {
    right: -8px;
    min-width: 260px;
  }
}
```

### Integration with Feed

```typescript
// src/hooks/useHunterFeed.ts

export function useHunterFeed(props: UseHunterFeedProps) {
  const { activeWallet } = useWallet();

  // Include active wallet in query key for automatic refetch
  const queryKey = ['hunter-feed', queryParams, useRealAPI, activeWallet];

  const queryFn = async ({ pageParam }) => {
    const result = await getFeedPage({
      ...queryParams,
      cursor: pageParam as string | undefined,
      walletAddress: activeWallet || undefined, // Pass active wallet
    });

    return result;
  };

  // ... rest of implementation
}
```

### Integration with Eligibility

```typescript
// src/components/hunter/OpportunityCard.tsx

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { activeWallet } = useWallet();

  // Fetch eligibility for active wallet
  const { data: eligibility, isLoading } = useQuery({
    queryKey: ['eligibility', opportunity.id, activeWallet],
    queryFn: () => 
      getEligibilityPreview(
        activeWallet!, 
        opportunity.id, 
        opportunity.chains[0]
      ),
    enabled: !!activeWallet,
    staleTime: 60 * 60 * 1000, // 60 minutes
  });

  return (
    <div className="opportunity-card">
      {/* ... card content */}
      
      {activeWallet && (
        <div className="eligibility-section">
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : eligibility ? (
            <EligibilityBadge 
              status={eligibility.status}
              reasons={eligibility.reasons}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
```

### Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels and roles
- Focus management
- Screen reader announcements
- Minimum 44px touch targets on mobile
- High contrast mode support
- Reduced motion support

### Performance Considerations

- Lazy load wallet icons
- Debounce wallet switching
- Cache wallet metadata
- Optimize re-renders with React.memo
- Use virtual scrolling for many wallets (>10)

### Error Handling

- Handle wallet disconnection gracefully
- Show error states for failed connections
- Provide retry mechanisms
- Log errors for debugging
- Show user-friendly error messages

### Testing Strategy

- Unit tests for WalletSelector component
- Integration tests for wallet switching
- E2E tests for complete flow
- Accessibility tests
- Performance tests
- Cross-browser tests


## 19. Ranking Safety & Drift Detection (v2)

**Implementation Phase:** v2 (Launch + 3 months)  
**Edge Function:** `ranking-safety` (cron) + integrated into `hunter-feed`  
**LOCATION:** `supabase/functions/ranking-safety/` (cron) + `supabase/functions/hunter-feed/lib/ranking-safety.ts`

### Overview

The Ranking Safety system monitors feed quality metrics in real-time to prevent algorithmic drift toward low-trust opportunities, implementing automatic circuit breakers when quality degrades.

**ARCHITECTURE NOTE:** All ranking safety logic lives in Edge Functions. The `hunter-feed` function calls `applySafetyMode()` before executing queries. UI never sees or manipulates safety state.

**Architecture Note:** All ranking safety logic lives in Edge Functions. The `hunter-feed` function calls `applySafetyMode()` before executing queries. UI never sees or manipulates safety state.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Ranking Safety Monitor                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Metrics      │  │ Threshold    │  │ Safety Mode  │      │
│  │ Collector    │  │ Evaluator    │  │ Controller   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  Alert       │                         │
│                     │  System      │                         │
│                     └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface RankingMetrics {
  timestamp: Date;
  windowMinutes: number;
  top10: {
    avgTrustScore: number;
    avgRiskLevel: number;
    categoryDistribution: Record<OpportunityType, number>;
  };
  top50: {
    avgTrustScore: number;
    avgRiskLevel: number;
    categoryDistribution: Record<OpportunityType, number>;
  };
}

interface SafetyModeState {
  active: boolean;
  triggeredAt?: Date;
  reason: string;
  previousMetrics: RankingMetrics;
  currentMetrics: RankingMetrics;
  deploymentSHA: string;
}
```

### Implementation

```typescript
// lib/ranking-safety.ts

const SAFETY_THRESHOLDS = {
  minTrustScore: 75,
  windowMinutes: 30,
  recoveryWindowMinutes: 30,
};

export async function evaluateRankingSafety(): Promise<SafetyModeState | null> {
  // Collect metrics for top 10 and top 50
  const metrics = await collectRankingMetrics();
  
  // Check if trust score dropped below threshold
  if (metrics.top10.avgTrustScore < SAFETY_THRESHOLDS.minTrustScore) {
    const previousMetrics = await getPreviousMetrics(SAFETY_THRESHOLDS.windowMinutes);
    
    return {
      active: true,
      triggeredAt: new Date(),
      reason: `Top 10 avg trust score (${metrics.top10.avgTrustScore}) below threshold (${SAFETY_THRESHOLDS.minTrustScore})`,
      previousMetrics,
      currentMetrics: metrics,
      deploymentSHA: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    };
  }
  
  return null;
}

export async function applySafetyMode(query: FeedQuery): Promise<FeedQuery> {
  const safetyState = await getSafetyModeState();
  
  if (!safetyState?.active) {
    return query;
  }
  
  // Override with safe baseline sort
  return {
    ...query,
    sort: 'trust',
    trustMin: 80,
    showRisky: false,
    _safetyMode: true,
  };
}
```



## 20. Regulatory Policy Engine & Geo Compliance (v2)

**LOCATION:** `supabase/functions/hunter-feed/lib/regulatory-policy.ts` (Edge Function internal module)

### Overview

The Regulatory Policy Engine evaluates each opportunity against regional compliance rules, filtering or restricting access based on user location, asset type, and regulatory requirements.

**ARCHITECTURE NOTE:** Policy evaluation happens inside the `hunter-feed` Edge Function. Next.js never performs policy filtering.

### Architecture

```typescript
interface PolicyRule {
  id: string;
  region: string[]; // ISO country codes
  assetTypes: string[]; // EMT, ART, algo_stable, etc.
  actionTypes: string[]; // swap, leverage, RWA, etc.
  restriction: 'exclude' | 'view_only' | 'allow';
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

interface PolicyEvaluation {
  allowed: boolean;
  restriction: 'exclude' | 'view_only' | 'allow';
  policyVersion: string;
  appliedRules: string[];
}
```

### Implementation

```typescript
// lib/regulatory-policy.ts

export class RegulatoryPolicyEngine {
  private rules: PolicyRule[];
  private version: string;

  async evaluateOpportunity(
    opportunity: Opportunity,
    userRegion: string
  ): Promise<PolicyEvaluation> {
    const applicableRules = this.rules.filter(rule =>
      rule.region.includes(userRegion) &&
      this.matchesAssetType(opportunity, rule) &&
      this.matchesActionType(opportunity, rule) &&
      this.isEffective(rule)
    );

    // Most restrictive rule wins
    const restriction = this.getMostRestrictive(applicableRules);

    return {
      allowed: restriction !== 'exclude',
      restriction,
      policyVersion: this.version,
      appliedRules: applicableRules.map(r => r.id),
    };
  }

  private getMostRestrictive(rules: PolicyRule[]): 'exclude' | 'view_only' | 'allow' {
    if (rules.some(r => r.restriction === 'exclude')) return 'exclude';
    if (rules.some(r => r.restriction === 'view_only')) return 'view_only';
    return 'allow';
  }
}

// API integration
export async function filterByPolicy(
  opportunities: Opportunity[],
  userRegion: string
): Promise<Opportunity[]> {
  const engine = await getPolicyEngine();

  const evaluated = await Promise.all(
    opportunities.map(async (opp) => ({
      opportunity: opp,
      policy: await engine.evaluateOpportunity(opp, userRegion),
    }))
  );

  return evaluated
    .filter(({ policy }) => policy.allowed)
    .map(({ opportunity, policy }) => ({
      ...opportunity,
      _policyRestriction: policy.restriction,
      _policyVersion: policy.policyVersion,
    }));
}
```



## 21. Guardian Liability & Safety Pool (v2)

### Overview

Guardian Liability Mode adds economic skin-in-the-game to Guardian verifications through staking and slashing mechanisms, creating an Affected Users Pool for compensation when verified opportunities turn malicious.

### Smart Contract Architecture

```solidity
// contracts/GuardianSafetyPool.sol

contract GuardianSafetyPool {
    struct GuardianStake {
        address guardian;
        uint256 amount;
        uint256 stakedAt;
        bool liabilityMode;
    }

    struct Verification {
        bytes32 opportunityId;
        address guardian;
        uint8 trustLevel; // 0=red, 1=amber, 2=green
        uint256 verifiedAt;
        uint256 liabilityWindowDays;
        uint256 stakeReference;
    }

    struct SlashingEvent {
        bytes32 opportunityId;
        address guardian;
        uint256 slashedAmount;
        uint256 slashedAt;
        string reason;
    }

    mapping(address => GuardianStake) public stakes;
    mapping(bytes32 => Verification) public verifications;
    mapping(address => uint256) public affectedUsersPool;

    event GuardianStaked(address indexed guardian, uint256 amount);
    event OpportunityVerified(bytes32 indexed opportunityId, address indexed guardian);
    event GuardianSlashed(address indexed guardian, uint256 amount, bytes32 opportunityId);
    event UserCompensated(address indexed user, uint256 amount);

    function stakeAsGuardian(bool liabilityMode) external payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        stakes[msg.sender] = GuardianStake({
            guardian: msg.sender,
            amount: msg.value,
            stakedAt: block.timestamp,
            liabilityMode: liabilityMode
        });
        emit GuardianStaked(msg.sender, msg.value);
    }

    function verifyOpportunity(
        bytes32 opportunityId,
        uint8 trustLevel,
        uint256 liabilityWindowDays
    ) external {
        require(stakes[msg.sender].amount > 0, "Not staked");
        require(trustLevel <= 2, "Invalid trust level");

        verifications[opportunityId] = Verification({
            opportunityId: opportunityId,
            guardian: msg.sender,
            trustLevel: trustLevel,
            verifiedAt: block.timestamp,
            liabilityWindowDays: liabilityWindowDays,
            stakeReference: stakes[msg.sender].amount
        });

        emit OpportunityVerified(opportunityId, msg.sender);
    }

    function slashGuardian(
        bytes32 opportunityId,
        string calldata reason
    ) external onlyAdmin {
        Verification memory verification = verifications[opportunityId];
        require(verification.guardian != address(0), "No verification found");
        
        // Check if within liability window
        require(
            block.timestamp <= verification.verifiedAt + (verification.liabilityWindowDays * 1 days),
            "Outside liability window"
        );

        GuardianStake storage stake = stakes[verification.guardian];
        uint256 slashAmount = (stake.amount * SLASH_PERCENTAGE) / 100;

        stake.amount -= slashAmount;
        affectedUsersPool[opportunityId] += slashAmount;

        emit GuardianSlashed(verification.guardian, slashAmount, opportunityId);
    }

    function claimCompensation(bytes32 opportunityId, bytes calldata proof) external {
        // Verify user participated in compromised opportunity
        require(verifyParticipation(msg.sender, opportunityId, proof), "Invalid proof");
        
        uint256 poolAmount = affectedUsersPool[opportunityId];
        uint256 userShare = calculateProRataShare(msg.sender, opportunityId, poolAmount);

        require(userShare > 0, "No compensation available");

        affectedUsersPool[opportunityId] -= userShare;
        payable(msg.sender).transfer(userShare);

        emit UserCompensated(msg.sender, userShare);
    }
}
```

### Backend Integration

```typescript
// lib/guardian-liability.ts

export interface GuardianVerification {
  opportunityId: string;
  guardianAddress: string;
  trustLevel: 'green' | 'amber' | 'red';
  verifiedAt: Date;
  liabilityWindowDays: number;
  stakeAmount: string;
  signature: string;
}

export async function recordGuardianVerification(
  verification: GuardianVerification
): Promise<void> {
  // Store in database
  await db.guardian_verifications.insert({
    opportunity_id: verification.opportunityId,
    guardian_address: verification.guardianAddress,
    trust_level: verification.trustLevel,
    verified_at: verification.verifiedAt,
    liability_window_days: verification.liabilityWindowDays,
    stake_amount: verification.stakeAmount,
    signature: verification.signature,
  });

  // Update opportunity trust score
  await db.opportunities.update({
    where: { id: verification.opportunityId },
    data: {
      trust_score: trustLevelToScore(verification.trustLevel),
      trust_level: verification.trustLevel,
      guardian_verified: true,
      guardian_address: verification.guardianAddress,
    },
  });
}
```



## 22. Intent-Centric Outcome Execution (v2+)

**LOCATION:** `supabase/functions/hunter-intent-quote/` and `supabase/functions/hunter-intent-execute/` (Edge Functions)

### Overview

Intent-based execution allows users to specify desired outcomes (e.g., "Stake 500 USDC into Base pool") while the system orchestrates complex multi-step transactions through solver networks.

**ARCHITECTURE NOTE:** All solver orchestration, quote aggregation, and execution logic lives in Edge Functions. UI only displays quotes and triggers execution via `supabase.functions.invoke()`.

### Architecture

```typescript
interface Intent {
  id: string;
  userId: string;
  opportunityId: string;
  outcome: {
    action: 'stake' | 'provide_liquidity' | 'bridge_and_stake';
    inputAsset: string;
    inputChain: string;
    inputAmount: string;
    targetProtocol: string;
    targetChain: string;
    targetPool?: string;
  };
  constraints: {
    maxSlippage: number; // basis points
    minOutput?: string;
    maxGas?: string;
    deadline: Date;
  };
  status: 'pending' | 'quoted' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

interface IntentPlan {
  intentId: string;
  solver: string; // Li.Fi, 1inch Fusion, CowSwap
  steps: IntentStep[];
  estimatedGas: string;
  estimatedSlippage: number;
  estimatedDuration: number; // seconds
  quote: {
    inputAmount: string;
    outputAmount: string;
    rate: string;
    validUntil: Date;
  };
}

interface IntentStep {
  type: 'bridge' | 'swap' | 'approve' | 'deposit' | 'stake';
  protocol: string;
  chain: string;
  from: string;
  to: string;
  amount: string;
  data?: string;
}
```

### Solver Integration

```typescript
// lib/intent-solver.ts

export class IntentSolverOrchestrator {
  private solvers: Map<string, IntentSolver>;

  constructor() {
    this.solvers = new Map([
      ['lifi', new LiFiSolver()],
      ['1inch', new OneInchFusionSolver()],
      ['cowswap', new CowSwapSolver()],
    ]);
  }

  async requestQuotes(intent: Intent): Promise<IntentPlan[]> {
    const quotes = await Promise.allSettled(
      Array.from(this.solvers.values()).map(solver =>
        solver.quote(intent)
      )
    );

    return quotes
      .filter((result): result is PromiseFulfilledResult<IntentPlan> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
      .sort((a, b) => 
        // Sort by best output amount
        parseFloat(b.quote.outputAmount) - parseFloat(a.quote.outputAmount)
      );
  }

  async executeIntent(intentId: string, planId: string): Promise<ExecutionResult> {
    const plan = await this.getPlan(planId);
    const solver = this.solvers.get(plan.solver);

    if (!solver) {
      throw new Error(`Solver ${plan.solver} not found`);
    }

    // Execute with solver
    const result = await solver.execute(plan);

    // Update intent status
    await this.updateIntentStatus(intentId, {
      status: result.success ? 'completed' : 'failed',
      txHash: result.txHash,
      actualGas: result.gasUsed,
      actualSlippage: result.slippage,
      completedAt: new Date(),
    });

    return result;
  }
}

// Example: Li.Fi Solver
class LiFiSolver implements IntentSolver {
  async quote(intent: Intent): Promise<IntentPlan> {
    const response = await fetch('https://li.quest/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromChain: intent.outcome.inputChain,
        toChain: intent.outcome.targetChain,
        fromToken: intent.outcome.inputAsset,
        toToken: 'USDC', // Target token
        fromAmount: intent.outcome.inputAmount,
        fromAddress: intent.userId,
        slippage: intent.constraints.maxSlippage / 10000,
      }),
    });

    const data = await response.json();

    return {
      intentId: intent.id,
      solver: 'lifi',
      steps: this.convertToSteps(data.transactionRequest),
      estimatedGas: data.estimate.gasCosts[0].amount,
      estimatedSlippage: data.estimate.slippage,
      estimatedDuration: data.estimate.executionDuration,
      quote: {
        inputAmount: intent.outcome.inputAmount,
        outputAmount: data.estimate.toAmount,
        rate: data.estimate.exchangeRate,
        validUntil: new Date(Date.now() + 60000), // 1 minute
      },
    };
  }

  async execute(plan: IntentPlan): Promise<ExecutionResult> {
    // Execute transaction through Li.Fi
    // ...
  }
}
```



## 23. Hunter Sentinel Agents (v3)

**Implementation Phase:** v3 (Future)  
**Edge Function:** `hunter-sentinel-monitor` (cron)  
**LOCATION:** `supabase/functions/hunter-sentinel-monitor/` (Edge Function)

**Implementation Note:** Data sources SHOULD be event-driven (indexers, oracle feeds, Guardian events) instead of raw block polling to keep infrastructure costs manageable.

### Overview

Sentinel Agents provide automated position protection by monitoring conditions and executing pre-authorized exit strategies when risk thresholds are breached.

**ARCHITECTURE NOTE:** All monitoring and trigger evaluation happens in the `hunter-sentinel-monitor` Edge Function (scheduled). UI only reads `sentinel_rules` and `sentinel_executions` for display.

**Architecture Note:** All monitoring and trigger evaluation happens in the `hunter-sentinel-monitor` Edge Function (scheduled). UI only reads `sentinel_rules` and `sentinel_executions` for display.

### Architecture

```typescript
interface SentinelRule {
  id: string;
  userId: string;
  opportunityId: string;
  positionId: string;
  enabled: boolean;
  mode: 'auto' | 'manual_confirm';
  triggers: SentinelTrigger[];
  exitStrategy: ExitStrategy;
  createdAt: Date;
}

interface SentinelTrigger {
  type: 'guardian_score_drop' | 'tvl_drop' | 'apr_collapse' | 'protocol_alert';
  threshold: number;
  windowMinutes?: number;
}

interface ExitStrategy {
  type: 'immediate' | 'gradual' | 'limit_order';
  slippageTolerance: number;
  minOutput?: string;
  gasLimit?: string;
}

interface SentinelExecution {
  id: string;
  ruleId: string;
  triggeredBy: string;
  triggeredAt: Date;
  txHash?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  exitAmount: string;
  actualSlippage?: number;
}
```

### Monitoring Service

```typescript
// services/sentinel-monitor.ts

export class SentinelMonitor {
  private rules: Map<string, SentinelRule>;
  private dataProviders: DataProvider[];

  async monitorRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const conditions = await this.evaluateConditions(rule);

      if (conditions.triggered) {
        await this.handleTrigger(rule, conditions);
      }
    }
  }

  private async evaluateConditions(rule: SentinelRule): Promise<{
    triggered: boolean;
    reason: string;
    data: any;
  }> {
    for (const trigger of rule.triggers) {
      const result = await this.evaluateTrigger(trigger, rule);
      if (result.triggered) {
        return result;
      }
    }

    return { triggered: false, reason: '', data: null };
  }

  private async evaluateTrigger(
    trigger: SentinelTrigger,
    rule: SentinelRule
  ): Promise<{ triggered: boolean; reason: string; data: any }> {
    switch (trigger.type) {
      case 'guardian_score_drop': {
        const currentScore = await this.getGuardianScore(rule.opportunityId);
        const previousScore = await this.getPreviousGuardianScore(
          rule.opportunityId,
          trigger.windowMinutes || 60
        );

        if (currentScore < trigger.threshold && currentScore < previousScore) {
          return {
            triggered: true,
            reason: `Guardian score dropped from ${previousScore} to ${currentScore}`,
            data: { currentScore, previousScore },
          };
        }
        break;
      }

      case 'tvl_drop': {
        const currentTVL = await this.getTVL(rule.opportunityId);
        const previousTVL = await this.getPreviousTVL(
          rule.opportunityId,
          trigger.windowMinutes || 60
        );

        const dropPercent = ((previousTVL - currentTVL) / previousTVL) * 100;

        if (dropPercent >= trigger.threshold) {
          return {
            triggered: true,
            reason: `TVL dropped ${dropPercent.toFixed(2)}%`,
            data: { currentTVL, previousTVL, dropPercent },
          };
        }
        break;
      }

      case 'apr_collapse': {
        const currentAPR = await this.getAPR(rule.opportunityId);
        const previousAPR = await this.getPreviousAPR(
          rule.opportunityId,
          trigger.windowMinutes || 60
        );

        const dropPercent = ((previousAPR - currentAPR) / previousAPR) * 100;

        if (dropPercent >= trigger.threshold) {
          return {
            triggered: true,
            reason: `APR collapsed ${dropPercent.toFixed(2)}%`,
            data: { currentAPR, previousAPR, dropPercent },
          };
        }
        break;
      }

      case 'protocol_alert': {
        const alerts = await this.getProtocolAlerts(rule.opportunityId);
        const highSeverity = alerts.filter(a => a.severity === 'high' || a.severity === 'critical');

        if (highSeverity.length > 0) {
          return {
            triggered: true,
            reason: `High severity alert: ${highSeverity[0].message}`,
            data: { alerts: highSeverity },
          };
        }
        break;
      }
    }

    return { triggered: false, reason: '', data: null };
  }

  private async handleTrigger(
    rule: SentinelRule,
    conditions: { triggered: boolean; reason: string; data: any }
  ): Promise<void> {
    // Create execution record
    const execution: SentinelExecution = {
      id: generateId(),
      ruleId: rule.id,
      triggeredBy: conditions.reason,
      triggeredAt: new Date(),
      status: 'pending',
      exitAmount: '0',
    };

    await this.saveExecution(execution);

    if (rule.mode === 'auto') {
      // Execute exit automatically
      await this.executeExit(rule, execution);
    } else {
      // Send notification for manual confirmation
      await this.sendNotification(rule.userId, {
        type: 'sentinel_trigger',
        rule,
        conditions,
        execution,
      });
    }
  }

  private async executeExit(
    rule: SentinelRule,
    execution: SentinelExecution
  ): Promise<void> {
    try {
      execution.status = 'executing';
      await this.updateExecution(execution);

      // Use Action Engine to exit position
      const result = await actionEngine.exitPosition({
        positionId: rule.positionId,
        strategy: rule.exitStrategy,
      });

      execution.status = 'completed';
      execution.txHash = result.txHash;
      execution.exitAmount = result.amount;
      execution.actualSlippage = result.slippage;

      await this.updateExecution(execution);

      // Send success notification
      await this.sendNotification(rule.userId, {
        type: 'sentinel_exit_success',
        rule,
        execution,
      });
    } catch (error) {
      execution.status = 'failed';
      await this.updateExecution(execution);

      // Send failure notification
      await this.sendNotification(rule.userId, {
        type: 'sentinel_exit_failed',
        rule,
        execution,
        error: error.message,
      });
    }
  }
}
```



## 24. Privacy-Preserving Eligibility (ZK Mode - v3)

**Implementation Phase:** v3 (R&D / EB-1A Research Spec)  
**Edge Function:** `zk-eligibility-verify`  
**LOCATION:** Client generates proofs (allowed), `supabase/functions/zk-eligibility-verify/` verifies (Edge Function)

**Implementation Note:** Phase 1 ZK Mode MAY integrate a managed provider like Sismo/ZeroDev for proofs instead of running custom circuits. The full Circom + groth16 path here is v3+ research spec for maximum privacy.

### Overview

Zero-Knowledge eligibility checking allows users to prove they meet opportunity requirements without revealing wallet addresses or balances to the backend.

**ARCHITECTURE NOTE:** Client generates ZK proofs (allowed on client). Edge Function `zk-eligibility-verify` verifies proofs and checks requirements. UI only displays results.

**Architecture Note:** Client generates ZK proofs (allowed on client). Edge Function `zk-eligibility-verify` verifies proofs and checks requirements. UI only displays results.

### Architecture

```typescript
interface ZKEligibilityProof {
  proofType: 'wallet_age' | 'tx_count' | 'contract_interaction' | 'balance_threshold';
  proof: string; // ZK proof bytes
  publicInputs: string[]; // Public parameters
  verificationKey: string;
  generatedAt: Date;
}

interface ZKEligibilityResult {
  opportunityId: string;
  status: 'verified_eligible' | 'verified_ineligible' | 'unknown';
  proofHash: string; // Hash of proof for audit trail
  verifiedAt: Date;
  privacyMode: true;
}
```

### ZK Circuit Design

```typescript
// circuits/eligibility.circom

pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

// Prove wallet has >= N transactions without revealing exact count
template ProveTransactionCount(n) {
    signal input txCount;
    signal input threshold;
    signal input walletHash; // Hash of wallet address
    signal output valid;

    // Check txCount >= threshold
    component gte = GreaterEqThan(32);
    gte.in[0] <== txCount;
    gte.in[1] <== threshold;

    valid <== gte.out;

    // Constrain wallet hash (prevents proof reuse)
    component hasher = Poseidon(1);
    hasher.inputs[0] <== walletHash;
}

// Prove wallet interacted with specific contract
template ProveContractInteraction() {
    signal input walletAddress;
    signal input contractAddress;
    signal input blockNumber;
    signal input merkleRoot;
    signal input merkleProof[8];
    signal output valid;

    // Verify Merkle proof that wallet interacted with contract
    // ...
}
```

### Client-Side Proof Generation

```typescript
// lib/zk-eligibility-client.ts

import { groth16 } from 'snarkjs';

export class ZKEligibilityProver {
  async generateTxCountProof(
    walletAddress: string,
    txCount: number,
    threshold: number
  ): Promise<ZKEligibilityProof> {
    // Hash wallet address for privacy
    const walletHash = await this.hashWallet(walletAddress);

    // Generate witness
    const input = {
      txCount,
      threshold,
      walletHash,
    };

    // Generate proof
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '/circuits/tx_count.wasm',
      '/circuits/tx_count_final.zkey'
    );

    return {
      proofType: 'tx_count',
      proof: JSON.stringify(proof),
      publicInputs: publicSignals,
      verificationKey: await this.getVerificationKey('tx_count'),
      generatedAt: new Date(),
    };
  }

  async generateContractInteractionProof(
    walletAddress: string,
    contractAddress: string,
    blockNumber: number
  ): Promise<ZKEligibilityProof> {
    // Fetch Merkle proof from indexer
    const merkleProof = await this.getMerkleProof(
      walletAddress,
      contractAddress,
      blockNumber
    );

    const input = {
      walletAddress: this.addressToField(walletAddress),
      contractAddress: this.addressToField(contractAddress),
      blockNumber,
      merkleRoot: merkleProof.root,
      merkleProof: merkleProof.siblings,
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '/circuits/contract_interaction.wasm',
      '/circuits/contract_interaction_final.zkey'
    );

    return {
      proofType: 'contract_interaction',
      proof: JSON.stringify(proof),
      publicInputs: publicSignals,
      verificationKey: await this.getVerificationKey('contract_interaction'),
      generatedAt: new Date(),
    };
  }

  private async hashWallet(address: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(address);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

### Backend Verification

```typescript
// lib/zk-eligibility-verifier.ts

export class ZKEligibilityVerifier {
  async verifyProof(
    opportunityId: string,
    proof: ZKEligibilityProof
  ): Promise<ZKEligibilityResult> {
    // Verify ZK proof
    const isValid = await this.verifyZKProof(proof);

    if (!isValid) {
      return {
        opportunityId,
        status: 'unknown',
        proofHash: await this.hashProof(proof),
        verifiedAt: new Date(),
        privacyMode: true,
      };
    }

    // Check if public inputs meet opportunity requirements
    const meetsRequirements = await this.checkRequirements(
      opportunityId,
      proof.proofType,
      proof.publicInputs
    );

    return {
      opportunityId,
      status: meetsRequirements ? 'verified_eligible' : 'verified_ineligible',
      proofHash: await this.hashProof(proof),
      verifiedAt: new Date(),
      privacyMode: true,
    };
  }

  private async verifyZKProof(proof: ZKEligibilityProof): Promise<boolean> {
    const vKey = JSON.parse(proof.verificationKey);
    const proofData = JSON.parse(proof.proof);

    return await groth16.verify(vKey, proof.publicInputs, proofData);
  }

  private async checkRequirements(
    opportunityId: string,
    proofType: string,
    publicInputs: string[]
  ): Promise<boolean> {
    const opportunity = await this.getOpportunity(opportunityId);

    switch (proofType) {
      case 'tx_count':
        // Public input is just the validity flag (0 or 1)
        return publicInputs[0] === '1';

      case 'contract_interaction':
        // Public inputs include contract address and block range
        const requiredContract = opportunity.eligibility?.requiredContract;
        return publicInputs[1] === requiredContract;

      default:
        return false;
    }
  }
}
```

### Analytics Privacy

```typescript
// lib/privacy-analytics.ts

export function generatePrivateSessionId(walletAddress: string): string {
  // Use separate salt for privacy mode
  const privacySalt = process.env.PRIVACY_ANALYTICS_SALT;
  const sessionSalt = crypto.randomBytes(16).toString('hex');

  return crypto
    .createHash('sha256')
    .update(`${walletAddress}:${privacySalt}:${sessionSalt}`)
    .digest('hex');
}

// Ensure no cross-context correlation
export function trackPrivateEvent(event: AnalyticsEvent): void {
  // Strip all identifying information
  const sanitized = {
    ...event,
    userId: undefined,
    walletAddress: undefined,
    sessionId: event.privacySessionId,
    privacyMode: true,
  };

  analytics.track(sanitized);
}
```



## 25. Real-Time Threat Alerts & Circuit Breakers (v2+)

**LOCATION:** `supabase/functions/hunter-threat-monitor/` (Edge Function cron job)

### Overview

Real-time threat monitoring integrates with security providers to detect exploits and automatically pause affected opportunities, protecting users from depositing into compromised protocols.

**ARCHITECTURE NOTE:** All threat monitoring, circuit breaker logic, and notification sending happens in Edge Functions. UI only displays paused state.

### Architecture

```typescript
interface ThreatAlert {
  id: string;
  protocol: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'exploit' | 'abnormal_outflow' | 'oracle_manipulation' | 'governance_attack';
  description: string;
  detectedAt: Date;
  source: 'hypernative' | 'forta' | 'guardian' | 'manual';
  affectedContracts: string[];
  affectedChains: string[];
}

interface CircuitBreakerState {
  opportunityId: string;
  paused: boolean;
  pausedAt?: Date;
  pausedBy: string; // Alert ID or admin
  reason: string;
  affectedUsers: number;
  clearedAt?: Date;
  clearedBy?: string;
}

interface IncidentRecord {
  id: string;
  opportunityIds: string[];
  protocol: string;
  triggerAlert: ThreatAlert;
  pausedAt: Date;
  clearedAt?: Date;
  mitigationActions: string[];
  affectedUsers: number;
  notificationsSent: number;
}
```

### Threat Monitor Service

```typescript
// services/threat-monitor.ts

export class ThreatMonitorService {
  private providers: ThreatProvider[];
  private alertQueue: Queue<ThreatAlert>;

  async monitorThreats(): Promise<void> {
    // Poll threat providers
    const alerts = await Promise.all(
      this.providers.map(provider => provider.getAlerts())
    );

    const allAlerts = alerts.flat();

    // Process high/critical alerts immediately
    const urgent = allAlerts.filter(a => 
      a.severity === 'high' || a.severity === 'critical'
    );

    for (const alert of urgent) {
      await this.handleThreatAlert(alert);
    }
  }

  private async handleThreatAlert(alert: ThreatAlert): Promise<void> {
    // Find affected opportunities
    const affected = await this.findAffectedOpportunities(alert);

    if (affected.length === 0) return;

    // Pause all affected opportunities
    const pauseResults = await Promise.all(
      affected.map(opp => this.pauseOpportunity(opp.id, alert))
    );

    // Create incident record
    const incident: IncidentRecord = {
      id: generateId(),
      opportunityIds: affected.map(o => o.id),
      protocol: alert.protocol,
      triggerAlert: alert,
      pausedAt: new Date(),
      mitigationActions: ['opportunities_paused', 'users_notified'],
      affectedUsers: 0,
      notificationsSent: 0,
    };

    await this.saveIncident(incident);

    // Notify affected users
    await this.notifyAffectedUsers(affected, alert, incident);

    // Trigger Sentinel exits if configured
    await this.triggerSentinelExits(affected, alert);
  }

  private async pauseOpportunity(
    opportunityId: string,
    alert: ThreatAlert
  ): Promise<CircuitBreakerState> {
    const state: CircuitBreakerState = {
      opportunityId,
      paused: true,
      pausedAt: new Date(),
      pausedBy: alert.id,
      reason: `${alert.severity} alert: ${alert.description}`,
      affectedUsers: await this.countAffectedUsers(opportunityId),
    };

    // Update database
    await db.opportunities.update({
      where: { id: opportunityId },
      data: {
        status: 'paused_due_to_risk',
        paused_at: state.pausedAt,
        pause_reason: state.reason,
      },
    });

    // Purge from CDN cache
    await purgeCDNCache([opportunityId]);

    // Store circuit breaker state
    await db.circuit_breakers.insert(state);

    return state;
  }

  private async notifyAffectedUsers(
    opportunities: Opportunity[],
    alert: ThreatAlert,
    incident: IncidentRecord
  ): Promise<void> {
    // Find users with active positions
    const users = await this.getUsersWithPositions(
      opportunities.map(o => o.id)
    );

    // Send high-priority notifications
    await Promise.all(
      users.map(user =>
        this.sendNotification(user.id, {
          type: 'threat_alert',
          priority: 'high',
          title: `⚠️ ${alert.protocol} Security Alert`,
          message: alert.description,
          opportunities: opportunities.map(o => o.title),
          actions: [
            { label: 'View Details', url: `/incidents/${incident.id}` },
            { label: 'Exit Position', url: `/positions?exit=true` },
          ],
        })
      )
    );

    // Update incident record
    incident.notificationsSent = users.length;
    await this.updateIncident(incident);
  }

  async clearThreat(
    incidentId: string,
    clearedBy: string,
    reason: string
  ): Promise<void> {
    const incident = await this.getIncident(incidentId);

    // Require Guardian rescan confirmation
    const rescans = await Promise.all(
      incident.opportunityIds.map(id => this.requestGuardianRescan(id))
    );

    const allClear = rescans.every(scan => scan.score >= 80);

    if (!allClear) {
      throw new Error('Guardian rescans did not confirm safety');
    }

    // Unpause opportunities
    await Promise.all(
      incident.opportunityIds.map(id => this.unpauseOpportunity(id, clearedBy))
    );

    // Update incident
    incident.clearedAt = new Date();
    incident.clearedBy = clearedBy;
    incident.mitigationActions.push('threat_cleared', 'opportunities_resumed');

    await this.updateIncident(incident);

    // Log clearance
    await this.logClearance({
      incidentId,
      clearedBy,
      reason,
      clearedAt: new Date(),
    });
  }
}

// Integration with threat providers
class HypernativeProvider implements ThreatProvider {
  async getAlerts(): Promise<ThreatAlert[]> {
    const response = await fetch('https://api.hypernative.io/v1/alerts', {
      headers: { Authorization: `Bearer ${process.env.HYPERNATIVE_API_KEY}` },
    });

    const data = await response.json();

    return data.alerts.map(alert => ({
      id: alert.id,
      protocol: alert.protocol,
      severity: alert.severity,
      type: alert.type,
      description: alert.description,
      detectedAt: new Date(alert.timestamp),
      source: 'hypernative',
      affectedContracts: alert.contracts,
      affectedChains: alert.chains,
    }));
  }
}
```

### Frontend Integration

```typescript
// components/OpportunityCard.tsx

export function OpportunityCard({ opportunity }: Props) {
  const isPaused = opportunity.status === 'paused_due_to_risk';

  if (isPaused) {
    return (
      <div className="opportunity-card paused">
        <div className="threat-banner">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <h4>Protocol Risk – Temporarily Paused</h4>
            <p>{opportunity.pause_reason}</p>
          </div>
        </div>

        {/* Disabled CTA */}
        <button disabled className="cta-disabled">
          Deposits Paused
        </button>

        {/* Link to incident details */}
        <a href={`/incidents/${opportunity.incident_id}`}>
          View Security Alert →
        </a>
      </div>
    );
  }

  // Normal card rendering
  return <div className="opportunity-card">...</div>;
}
```



## 26. Solver Surplus Capture & Monetization

### Overview

Solver surplus capture allows the platform to monetize positive slippage from intent execution while maintaining transparency and fair distribution between users, protocol, and solvers.

### Architecture

```typescript
interface SurplusEvent {
  id: string;
  intentId: string;
  solver: string;
  userAddress: string;
  totalSurplus: string; // In output token
  userShare: string;
  protocolShare: string;
  solverShare: string;
  distribution: SurplusDistribution;
  executedAt: Date;
}

interface SurplusDistribution {
  userPercent: number; // e.g., 50
  protocolPercent: number; // e.g., 30
  solverPercent: number; // e.g., 20
}

interface SolverReputation {
  solver: string;
  totalIntents: number;
  avgSurplus: number;
  negativeSurplusCount: number;
  reputationScore: number; // 0-100
  selectionWeight: number; // Used in solver auction
}
```

### Surplus Calculation

```typescript
// lib/surplus-calculator.ts

export class SurplusCalculator {
  async calculateSurplus(
    intent: Intent,
    execution: ExecutionResult
  ): Promise<SurplusEvent | null> {
    // Get user's signed minimum output
    const minOutput = parseFloat(intent.constraints.minOutput || '0');
    const actualOutput = parseFloat(execution.outputAmount);

    // Calculate surplus
    const surplus = actualOutput - minOutput;

    if (surplus <= 0) {
      // No surplus or negative slippage
      return null;
    }

    // Get distribution config (server-side, no client deployment needed)
    const distribution = await this.getDistributionConfig();

    // Calculate shares
    const userShare = (surplus * distribution.userPercent) / 100;
    const protocolShare = (surplus * distribution.protocolPercent) / 100;
    const solverShare = (surplus * distribution.solverPercent) / 100;

    return {
      id: generateId(),
      intentId: intent.id,
      solver: execution.solver,
      userAddress: intent.userId,
      totalSurplus: surplus.toString(),
      userShare: userShare.toString(),
      protocolShare: protocolShare.toString(),
      solverShare: solverShare.toString(),
      distribution,
      executedAt: new Date(),
    };
  }

  private async getDistributionConfig(): Promise<SurplusDistribution> {
    // Fetch from database or config service
    const config = await db.surplus_config.findFirst({
      where: { active: true },
      orderBy: { created_at: 'desc' },
    });

    return config || {
      userPercent: 50,
      protocolPercent: 30,
      solverPercent: 20,
    };
  }
}
```

### Solver Reputation System

```typescript
// lib/solver-reputation.ts

export class SolverReputationManager {
  async updateReputation(
    solver: string,
    surplusEvent: SurplusEvent | null,
    execution: ExecutionResult
  ): Promise<void> {
    const reputation = await this.getReputation(solver);

    // Update metrics
    reputation.totalIntents++;

    if (surplusEvent) {
      const surplus = parseFloat(surplusEvent.totalSurplus);
      reputation.avgSurplus = 
        (reputation.avgSurplus * (reputation.totalIntents - 1) + surplus) / 
        reputation.totalIntents;
    } else if (execution.slippage < 0) {
      // Negative slippage
      reputation.negativeSurplusCount++;
    }

    // Calculate reputation score (0-100)
    reputation.reputationScore = this.calculateScore(reputation);

    // Update selection weight for solver auction
    reputation.selectionWeight = this.calculateWeight(reputation);

    await this.saveReputation(reputation);
  }

  private calculateScore(reputation: SolverReputation): number {
    // Factors:
    // - Average surplus (higher is better)
    // - Negative surplus rate (lower is better)
    // - Total intents (more data is better)

    const negativeSurplusRate = 
      reputation.negativeSurplusCount / reputation.totalIntents;

    const surplusScore = Math.min(reputation.avgSurplus * 10, 50); // Max 50 points
    const reliabilityScore = (1 - negativeSurplusRate) * 30; // Max 30 points
    const volumeScore = Math.min(reputation.totalIntents / 100, 1) * 20; // Max 20 points

    return Math.round(surplusScore + reliabilityScore + volumeScore);
  }

  private calculateWeight(reputation: SolverReputation): number {
    // Higher reputation = higher weight in solver selection
    return reputation.reputationScore / 100;
  }

  async selectSolver(intent: Intent): Promise<string> {
    const solvers = await this.getAllSolvers();

    // Weighted random selection based on reputation
    const totalWeight = solvers.reduce((sum, s) => sum + s.selectionWeight, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const solver of solvers) {
      cumulative += solver.selectionWeight;
      if (random <= cumulative) {
        return solver.solver;
      }
    }

    // Fallback to first solver
    return solvers[0].solver;
  }
}
```

### UI Integration

```typescript
// components/IntentQuote.tsx

export function IntentQuote({ intent, quote }: Props) {
  const estimatedSurplus = calculateEstimatedSurplus(quote);
  const userShare = estimatedSurplus * 0.5; // 50% to user

  return (
    <div className="intent-quote">
      <div className="quote-details">
        <div className="quote-row">
          <span>You receive (minimum)</span>
          <span className="font-mono">{quote.outputAmount} USDC</span>
        </div>

        {estimatedSurplus > 0 && (
          <div className="quote-row surplus-info">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Estimated Price Improvement</span>
            </div>
            <span className="font-mono text-green-600">
              +{userShare.toFixed(2)} USDC
            </span>
          </div>
        )}

        <div className="quote-note">
          <Info className="w-4 h-4" />
          <span>You keep 50% of any positive slippage</span>
        </div>
      </div>

      <button onClick={() => executeIntent(intent, quote)}>
        Execute Intent
      </button>
    </div>
  );
}
```

### Analytics & Reporting

```typescript
// lib/surplus-analytics.ts

export async function generateSurplusReport(
  startDate: Date,
  endDate: Date
): Promise<SurplusReport> {
  const events = await db.surplus_events.findMany({
    where: {
      executedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalSurplus = events.reduce(
    (sum, e) => sum + parseFloat(e.totalSurplus),
    0
  );

  const userTotal = events.reduce(
    (sum, e) => sum + parseFloat(e.userShare),
    0
  );

  const protocolTotal = events.reduce(
    (sum, e) => sum + parseFloat(e.protocolShare),
    0
  );

  const solverTotal = events.reduce(
    (sum, e) => sum + parseFloat(e.solverShare),
    0
  );

  return {
    period: { start: startDate, end: endDate },
    totalIntents: events.length,
    totalSurplus,
    userTotal,
    protocolTotal,
    solverTotal,
    avgSurplusPerIntent: totalSurplus / events.length,
    topSolvers: await this.getTopSolvers(events),
  };
}
```



## 27. Universal Gas Abstraction (Paymaster)

### Overview

Gas abstraction via ERC-4337 Paymasters allows users to pay transaction fees using any token (e.g., USDC) instead of native gas tokens, removing friction from cross-chain operations.

### Architecture

```typescript
interface PaymasterConfig {
  chain: string;
  paymasterAddress: string;
  supportedTokens: string[]; // Token addresses
  maxFeePercent: number; // e.g., 5% above oracle price
  enabled: boolean;
}

interface GasEstimate {
  nativeGas: string; // In native token (ETH, MATIC, etc.)
  tokenGas?: string; // In selected token (USDC, etc.)
  token?: string;
  conversionRate: number;
  feePercent: number;
}

interface PaymasterSponsorshipData {
  paymasterAddress: string;
  paymasterData: string; // Encoded sponsorship data
  paymasterVerificationGasLimit: string;
  paymasterPostOpGasLimit: string;
}
```

### Paymaster Integration

```typescript
// lib/paymaster.ts

export class PaymasterService {
  private configs: Map<string, PaymasterConfig>;

  async estimateGas(
    chain: string,
    transaction: Transaction,
    paymentToken?: string
  ): Promise<GasEstimate> {
    // Estimate native gas
    const nativeGas = await this.estimateNativeGas(chain, transaction);

    if (!paymentToken) {
      return { nativeGas };
    }

    // Check if paymaster available
    const config = this.configs.get(chain);
    if (!config?.enabled || !config.supportedTokens.includes(paymentToken)) {
      return { nativeGas };
    }

    // Get conversion rate from oracle
    const rate = await this.getConversionRate(chain, paymentToken);

    // Calculate token gas with fee
    const tokenGasBase = parseFloat(nativeGas) * rate;
    const feePercent = config.maxFeePercent;
    const tokenGas = tokenGasBase * (1 + feePercent / 100);

    return {
      nativeGas,
      tokenGas: tokenGas.toString(),
      token: paymentToken,
      conversionRate: rate,
      feePercent,
    };
  }

  async getSponsorshipData(
    chain: string,
    userOp: UserOperation,
    paymentToken: string
  ): Promise<PaymasterSponsorshipData> {
    const config = this.configs.get(chain);
    if (!config) {
      throw new Error(`Paymaster not configured for chain ${chain}`);
    }

    // Request sponsorship from paymaster
    const response = await fetch(`${config.paymasterAddress}/sponsor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userOp,
        paymentToken,
        chain,
      }),
    });

    const data = await response.json();

    return {
      paymasterAddress: config.paymasterAddress,
      paymasterData: data.paymasterData,
      paymasterVerificationGasLimit: data.verificationGasLimit,
      paymasterPostOpGasLimit: data.postOpGasLimit,
    };
  }

  async constructUserOperation(
    intent: Intent,
    paymentToken?: string
  ): Promise<UserOperation> {
    const chain = intent.outcome.inputChain;

    // Build base user operation
    const userOp: UserOperation = {
      sender: intent.userId,
      nonce: await this.getNonce(intent.userId, chain),
      initCode: '0x',
      callData: await this.encodeCallData(intent),
      callGasLimit: '0',
      verificationGasLimit: '0',
      preVerificationGas: '0',
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
      paymasterAndData: '0x',
      signature: '0x',
    };

    // Estimate gas
    const gasEstimate = await this.estimateGas(chain, userOp, paymentToken);

    userOp.callGasLimit = gasEstimate.nativeGas;
    userOp.verificationGasLimit = '100000'; // Standard
    userOp.preVerificationGas = '21000'; // Standard

    // Get gas price
    const gasPrice = await this.getGasPrice(chain);
    userOp.maxFeePerGas = gasPrice.maxFeePerGas;
    userOp.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;

    // Add paymaster data if using token payment
    if (paymentToken) {
      const sponsorship = await this.getSponsorshipData(
        chain,
        userOp,
        paymentToken
      );

      userOp.paymasterAndData = this.encodePaymasterData(sponsorship);
      userOp.verificationGasLimit = sponsorship.paymasterVerificationGasLimit;
    }

    return userOp;
  }

  private encodePaymasterData(sponsorship: PaymasterSponsorshipData): string {
    return ethers.utils.concat([
      sponsorship.paymasterAddress,
      sponsorship.paymasterData,
    ]);
  }
}
```

### Frontend Integration

```typescript
// components/GasPaymentSelector.tsx

export function GasPaymentSelector({ intent, onSelect }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'native' | 'token'>('native');
  const [selectedToken, setSelectedToken] = useState<string>('USDC');

  const { data: gasEstimate } = useQuery({
    queryKey: ['gas-estimate', intent.id, paymentMethod, selectedToken],
    queryFn: () =>
      paymentMethod === 'native'
        ? estimateGas(intent.outcome.inputChain, intent)
        : estimateGasWithToken(intent.outcome.inputChain, intent, selectedToken),
  });

  const nativeBalance = useNativeBalance(intent.userId, intent.outcome.inputChain);
  const tokenBalance = useTokenBalance(intent.userId, selectedToken, intent.outcome.inputChain);

  const canPayNative = nativeBalance >= parseFloat(gasEstimate?.nativeGas || '0');
  const canPayToken = tokenBalance >= parseFloat(gasEstimate?.tokenGas || '0');

  return (
    <div className="gas-payment-selector">
      <h4>Pay gas with</h4>

      {/* Native gas option */}
      <button
        className={`payment-option ${paymentMethod === 'native' ? 'selected' : ''}`}
        onClick={() => setPaymentMethod('native')}
        disabled={!canPayNative}
      >
        <div className="option-header">
          <img src={getNativeTokenIcon(intent.outcome.inputChain)} />
          <span>{getNativeTokenSymbol(intent.outcome.inputChain)}</span>
        </div>
        <div className="option-amount">
          {gasEstimate?.nativeGas} {getNativeTokenSymbol(intent.outcome.inputChain)}
        </div>
        {!canPayNative && (
          <div className="insufficient-badge">Insufficient balance</div>
        )}
      </button>

      {/* Token gas option */}
      {gasEstimate?.tokenGas && (
        <button
          className={`payment-option ${paymentMethod === 'token' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('token')}
          disabled={!canPayToken}
        >
          <div className="option-header">
            <img src={getTokenIcon(selectedToken)} />
            <span>{selectedToken}</span>
            <span className="convenience-fee">+{gasEstimate.feePercent}% fee</span>
          </div>
          <div className="option-amount">
            {gasEstimate.tokenGas} {selectedToken}
          </div>
          {!canPayToken && (
            <div className="insufficient-badge">Insufficient balance</div>
          )}
        </button>
      )}

      <button
        className="confirm-button"
        onClick={() => onSelect(paymentMethod, selectedToken)}
        disabled={paymentMethod === 'native' ? !canPayNative : !canPayToken}
      >
        Continue
      </button>
    </div>
  );
}
```

### Error Handling

```typescript
// lib/paymaster-errors.ts

export class PaymasterError extends Error {
  constructor(
    public code: PaymasterErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymasterError';
  }
}

export enum PaymasterErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PAYMASTER_DEPLETED = 'PAYMASTER_DEPLETED',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SPONSORSHIP_REJECTED = 'SPONSORSHIP_REJECTED',
}

export function handlePaymasterError(error: PaymasterError): {
  message: string;
  actions: Action[];
} {
  switch (error.code) {
    case PaymasterErrorCode.INSUFFICIENT_BALANCE:
      return {
        message: 'Insufficient token balance to pay for gas',
        actions: [
          { label: 'Top up balance', url: '/wallet/deposit' },
          { label: 'Use native gas', action: 'switch_to_native' },
        ],
      };

    case PaymasterErrorCode.PAYMASTER_DEPLETED:
      return {
        message: 'Paymaster temporarily unavailable. Please use native gas.',
        actions: [
          { label: 'Use native gas', action: 'switch_to_native' },
          { label: 'Retry later', action: 'retry' },
        ],
      };

    case PaymasterErrorCode.UNSUPPORTED_TOKEN:
      return {
        message: 'This token is not supported for gas payment on this chain',
        actions: [
          { label: 'Use native gas', action: 'switch_to_native' },
          { label: 'Cancel', action: 'cancel' },
        ],
      };

    default:
      return {
        message: 'Gas payment failed. Please try again.',
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Cancel', action: 'cancel' },
        ],
      };
  }
}
```



## 28. Emergency Exit & Direct Contract Access

**Implementation Phase:** v1 (Core requirement)  
**Smart Contracts:** All Hunter vault contracts

**Security Requirement:** All Hunter vault contracts MUST expose a verified `emergencyWithdraw()` function and be linked from the Status page and in-app Emergency Exit panels. This is non-negotiable for user safety.

### Overview

Emergency Exit functionality ensures users can always recover funds directly on-chain, even if the AlphaWhale UI or APIs are unavailable, by providing verified contract access and documentation.

### Architecture

```typescript
interface EmergencyExitInfo {
  contractAddress: string;
  chain: string;
  abi: any[];
  exitFunction: string;
  explorerUrl: string;
  documentation: string;
  verified: boolean;
  lastAudit?: Date;
}

interface UserPosition {
  id: string;
  userId: string;
  opportunityId: string;
  contractAddress: string;
  chain: string;
  amount: string;
  token: string;
  enteredAt: Date;
  emergencyExitInfo: EmergencyExitInfo;
}
```

### Smart Contract Design

```solidity
// contracts/HunterVault.sol

/**
 * @title HunterVault
 * @notice Vault contract for Hunter opportunity positions with emergency exit
 * @dev All positions can be exited directly via emergencyWithdraw() without backend
 */
contract HunterVault {
    struct Position {
        address user;
        address token;
        uint256 amount;
        uint256 enteredAt;
        bytes32 opportunityId;
    }

    mapping(address => Position[]) public userPositions;

    event PositionEntered(address indexed user, bytes32 indexed opportunityId, uint256 amount);
    event PositionExited(address indexed user, bytes32 indexed opportunityId, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    /**
     * @notice Emergency withdraw function - always available
     * @dev Can be called directly from block explorer without AlphaWhale UI
     * @param positionIndex Index of position in user's position array
     */
    function emergencyWithdraw(uint256 positionIndex) external {
        require(positionIndex < userPositions[msg.sender].length, "Invalid position");

        Position storage position = userPositions[msg.sender][positionIndex];
        require(position.amount > 0, "Position already withdrawn");

        uint256 amount = position.amount;
        address token = position.token;

        // Clear position
        position.amount = 0;

        // Transfer tokens back to user
        IERC20(token).transfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, amount);
    }

    /**
     * @notice Get all positions for a user
     * @param user User address
     * @return Array of positions
     */
    function getUserPositions(address user) external view returns (Position[] memory) {
        return userPositions[user];
    }

    /**
     * @notice Check if user has any active positions
     * @param user User address
     * @return True if user has positions with amount > 0
     */
    function hasActivePositions(address user) external view returns (bool) {
        Position[] storage positions = userPositions[user];
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i].amount > 0) {
                return true;
            }
        }
        return false;
    }
}
```

### Contract Verification & Publishing

```typescript
// scripts/verify-contracts.ts

export async function verifyAndPublishContract(
  contractAddress: string,
  chain: string,
  constructorArgs: any[]
): Promise<void> {
  // Verify on block explorer
  await hre.run('verify:verify', {
    address: contractAddress,
    constructorArguments: constructorArgs,
    network: chain,
  });

  // Publish ABI to database
  const artifact = await hre.artifacts.readArtifact('HunterVault');

  await db.contract_abis.upsert({
    where: { address_chain: { address: contractAddress, chain } },
    create: {
      address: contractAddress,
      chain,
      name: 'HunterVault',
      abi: JSON.stringify(artifact.abi),
      verified: true,
      verified_at: new Date(),
      explorer_url: getExplorerUrl(chain, contractAddress),
    },
    update: {
      abi: JSON.stringify(artifact.abi),
      verified: true,
      verified_at: new Date(),
    },
  });

  console.log(`✅ Contract verified and published: ${contractAddress} on ${chain}`);
}
```

### UI Integration

```typescript
// components/EmergencyExitPanel.tsx

export function EmergencyExitPanel({ position }: { position: UserPosition }) {
  const [showInstructions, setShowInstructions] = useState(false);

  const explorerUrl = `${position.emergencyExitInfo.explorerUrl}#writeContract`;

  return (
    <div className="emergency-exit-panel">
      <div className="panel-header">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h3>Emergency Exit Available</h3>
      </div>

      <p className="panel-description">
        You can exit this position directly on-chain, even if AlphaWhale is unavailable.
      </p>

      <div className="exit-options">
        {/* Option 1: Exit via AlphaWhale (preferred) */}
        <button
          className="exit-button primary"
          onClick={() => exitViaAlphaWhale(position)}
        >
          <Zap className="w-4 h-4" />
          Exit via AlphaWhale (Recommended)
        </button>

        {/* Option 2: Direct contract interaction */}
        <button
          className="exit-button secondary"
          onClick={() => setShowInstructions(true)}
        >
          <ExternalLink className="w-4 h-4" />
          Emergency Exit via Explorer
        </button>
      </div>

      {/* Instructions modal */}
      {showInstructions && (
        <Modal onClose={() => setShowInstructions(false)}>
          <div className="emergency-instructions">
            <h3>Emergency Exit Instructions</h3>

            <div className="instruction-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Open Block Explorer</h4>
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                    {position.emergencyExitInfo.explorerUrl}
                  </a>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Connect Your Wallet</h4>
                  <p>Click "Connect to Web3" on the explorer page</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Call emergencyWithdraw</h4>
                  <p>Find the "emergencyWithdraw" function</p>
                  <div className="code-block">
                    <code>positionIndex: {position.id}</code>
                  </div>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Confirm Transaction</h4>
                  <p>Review gas fees and confirm in your wallet</p>
                </div>
              </div>
            </div>

            <div className="contract-info">
              <h4>Contract Details</h4>
              <div className="info-row">
                <span>Address:</span>
                <code>{position.contractAddress}</code>
              </div>
              <div className="info-row">
                <span>Chain:</span>
                <span>{position.chain}</span>
              </div>
              <div className="info-row">
                <span>Verified:</span>
                <span className="verified-badge">
                  {position.emergencyExitInfo.verified ? '✓ Verified' : '⚠ Not Verified'}
                </span>
              </div>
            </div>

            <a
              href={position.emergencyExitInfo.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="docs-link"
            >
              View Full Documentation →
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
```

### Status Page Integration

```typescript
// pages/status.tsx

export function StatusPage() {
  const { data: status } = useQuery({
    queryKey: ['system-status'],
    queryFn: getSystemStatus,
    refetchInterval: 30000, // 30 seconds
  });

  const isOutage = status?.api === 'down' || status?.frontend === 'down';

  return (
    <div className="status-page">
      <h1>AlphaWhale System Status</h1>

      {isOutage && (
        <div className="outage-alert">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h2>Service Disruption Detected</h2>
            <p>
              You can still exit your positions directly via smart contracts.
              See instructions below.
            </p>
          </div>
        </div>
      )}

      <div className="status-grid">
        <StatusCard
          service="API"
          status={status?.api}
          uptime={status?.apiUptime}
        />
        <StatusCard
          service="Frontend"
          status={status?.frontend}
          uptime={status?.frontendUptime}
        />
        <StatusCard
          service="Smart Contracts"
          status="operational"
          uptime="100%"
        />
      </div>

      {isOutage && (
        <div className="emergency-section">
          <h2>Emergency Contract Access</h2>
          <p>
            All Hunter positions can be exited directly on-chain without the AlphaWhale UI.
          </p>

          <div className="contract-list">
            {HUNTER_CONTRACTS.map(contract => (
              <div key={contract.address} className="contract-card">
                <h3>{contract.name}</h3>
                <div className="contract-details">
                  <div>
                    <strong>Chain:</strong> {contract.chain}
                  </div>
                  <div>
                    <strong>Address:</strong>
                    <code>{contract.address}</code>
                  </div>
                  <a
                    href={contract.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <a href="/docs/emergency-exit" className="docs-button">
            View Emergency Exit Guide
          </a>
        </div>
      )}
    </div>
  );
}
```

### Pre-Deployment Checklist

```typescript
// scripts/pre-deployment-check.ts

export async function runPreDeploymentChecks(
  contractAddress: string,
  chain: string
): Promise<CheckResult> {
  const checks: Check[] = [];

  // 1. Verify emergency exit function exists
  checks.push(await checkEmergencyExitFunction(contractAddress, chain));

  // 2. Verify contract is verified on explorer
  checks.push(await checkContractVerification(contractAddress, chain));

  // 3. Test emergency exit with test account
  checks.push(await testEmergencyExit(contractAddress, chain));

  // 4. Verify ABI is published
  checks.push(await checkABIPublished(contractAddress, chain));

  // 5. Verify documentation exists
  checks.push(await checkDocumentation(contractAddress));

  const allPassed = checks.every(c => c.passed);

  return {
    passed: allPassed,
    checks,
    timestamp: new Date(),
  };
}
```

---

**Document Version:** 2.0  
**Last Updated:** November 2025  
**Next Review:** After v2 launch

