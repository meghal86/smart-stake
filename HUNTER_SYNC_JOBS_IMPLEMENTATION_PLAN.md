# Hunter Screen: Data Sync Jobs & Wallet Personalization Implementation Plan

## Current Status

### ✅ What's Working (Quick Fix)
- API endpoint `/api/hunter/opportunities` exists and returns data
- Live mode makes API calls successfully
- Demo mode toggle works both directions
- Database returns test/dummy data

### ❌ What's Missing (Per Requirements)

The Quick Fix only gets API calls working. **Two major features are still missing:**

1. **Data Sync Jobs (Requirement 12)** - Populate opportunities from external APIs
2. **Wallet Personalization (Requirements 3, 6)** - Rank and filter opportunities based on user's wallet

---

## Problem 1: No Data Sync Jobs

### Current Situation
- Database has **test/dummy data** (3 hardcoded opportunities)
- No mechanism to populate real opportunities from external sources
- Opportunities are static and never update

### What's Required (Requirement 12)

**Scheduled sync jobs that fetch opportunities from external APIs:**

1. **Airdrops** - Hourly sync from Layer3, Galxe APIs
   - Endpoint: `/api/sync/airdrops`
   - Schedule: Every hour
   - Sources: Layer3 API, Galxe API

2. **Quests** - Hourly sync from quest platforms
   - Endpoint: `/api/sync/quests`
   - Schedule: Every hour
   - Sources: Zealy, QuestN, Layer3

3. **Yield/Staking** - 2-hour sync from DeFi protocols
   - Endpoint: `/api/sync/yield`
   - Schedule: Every 2 hours
   - Sources: DeFiLlama, Aave, Compound, Lido

4. **Points/Loyalty** - Daily sync from loyalty programs
   - Endpoint: `/api/sync/points`
   - Schedule: Daily
   - Sources: Various loyalty programs

### Architecture

```
External APIs (Layer3, Galxe, DeFiLlama, etc.)
    ↓
Scheduled Cron Jobs (Vercel Cron)
    ↓
Sync API Routes (/api/sync/*)
    ↓
Supabase Database (opportunities table)
    ↓
Hunter Feed API (/api/hunter/opportunities)
    ↓
User sees fresh opportunities
```

### Implementation Steps

#### Step 1: Create Sync API Routes

**File: `src/app/api/sync/airdrops/route.ts`**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verify cron secret (security)
  // 2. Fetch from Layer3 API
  // 3. Fetch from Galxe API
  // 4. Transform to our schema
  // 5. Upsert to opportunities table
  // 6. Return sync stats
}
```

**File: `src/app/api/sync/quests/route.ts`**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verify cron secret
  // 2. Fetch from Zealy, QuestN, Layer3
  // 3. Transform to our schema
  // 4. Upsert to opportunities table
  // 5. Return sync stats
}
```

**File: `src/app/api/sync/yield/route.ts`**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verify cron secret
  // 2. Fetch from DeFiLlama
  // 3. Fetch from Aave, Compound, Lido
  // 4. Transform to our schema
  // 5. Upsert to opportunities table
  // 6. Return sync stats
}
```

**File: `src/app/api/sync/points/route.ts`**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verify cron secret
  // 2. Fetch from loyalty programs
  // 3. Transform to our schema
  // 4. Upsert to opportunities table
  // 5. Return sync stats
}
```

#### Step 2: Configure Cron Jobs

**File: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/sync/airdrops",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/sync/quests",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/sync/yield",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/sync/points",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Step 3: External API Integration

**Required API Keys (add to `.env`):**
```bash
# Airdrop Sources
LAYER3_API_KEY=
GALXE_API_KEY=

# Quest Sources
ZEALY_API_KEY=
QUESTN_API_KEY=

# Yield Sources
DEFILLAMA_API_KEY=
AAVE_API_KEY=
COMPOUND_API_KEY=
LIDO_API_KEY=

# Cron Security
CRON_SECRET=
```

#### Step 4: Data Transformation

Each sync job must transform external API data to our schema:

```typescript
interface ExternalOpportunity {
  // External API format (varies by source)
}

interface OpportunityInsert {
  id: string;
  type: 'airdrop' | 'quest' | 'staking' | 'yield' | 'points';
  title: string;
  description: string;
  protocol: { name: string; logo_url: string };
  chains: string[];
  reward: { min: number; max: number; currency: string };
  apr?: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  time_left_sec?: number;
  expires_at?: string;
  status: 'published';
  source: 'partner' | 'internal' | 'aggregator';
  // ... other fields
}

function transformToOpportunity(external: ExternalOpportunity): OpportunityInsert {
  // Transform logic
}
```

---

## Problem 2: No Wallet Personalization

### Current Situation
- API returns **ALL opportunities** regardless of wallet
- No personalized ranking based on wallet history
- No eligibility filtering based on wallet signals
- Wallet address is passed but **NOT used**

### What's Required

#### Requirement 3: Personalized Ranking

**When a wallet is connected, opportunities should be ranked using:**
- 60% relevance (wallet history, chain presence, recent completions)
- 25% trust (Guardian score)
- 15% freshness/urgency (time left, new opportunities)

**Implementation:**

1. **Create Materialized View (Task 9a)**

**File: `supabase/migrations/YYYYMMDD_create_opportunity_rank_view.sql`**
```sql
CREATE MATERIALIZED VIEW mv_opportunity_rank AS
SELECT
  o.id,
  o.type,
  o.title,
  o.protocol,
  o.chains,
  o.reward,
  o.apr,
  o.difficulty,
  o.time_left_sec,
  o.expires_at,
  o.trust_score,
  o.trust_level,
  o.featured,
  o.sponsored,
  -- Ranking components
  COALESCE(o.trending_score, o.trust_score) * 0.6 AS relevance_weighted,
  o.trust_score * 0.25 AS trust_weighted,
  (CASE
    WHEN o.time_left_sec < 172800 THEN 100  -- <48h = urgent
    WHEN o.created_at > now() - interval '24 hours' THEN 80  -- new
    ELSE 50
  END) * 0.15 AS freshness_weighted,
  -- Final rank score
  (COALESCE(o.trending_score, o.trust_score) * 0.6) +
  (o.trust_score * 0.25) +
  ((CASE
    WHEN o.time_left_sec < 172800 THEN 100
    WHEN o.created_at > now() - interval '24 hours' THEN 80
    ELSE 50
  END) * 0.15) AS rank_score
FROM opportunities o
WHERE o.status = 'published'
  AND (o.expires_at IS NULL OR o.expires_at > now());

-- Refresh every 5 minutes
CREATE INDEX idx_mv_opportunity_rank_score ON mv_opportunity_rank(rank_score DESC);
```

2. **Update API Route to Use Ranking**

**File: `src/app/api/hunter/opportunities/route.ts`**
```typescript
// Change from:
let query = supabase.from('opportunities').select('*');

// To:
let query = supabase.from('mv_opportunity_rank').select('*');

// Sort by rank_score instead of created_at
query = query.order('rank_score', { ascending: false });
```

3. **Implement Wallet-Based Personalization**

**File: `src/lib/hunter/personalization.ts`**
```typescript
interface WalletSignals {
  chains: string[];  // Chains wallet has used
  txCount: number;   // Total transactions
  age: number;       // Wallet age in days
  completedTypes: string[];  // Types of opportunities completed
  savedTypes: string[];      // Types of opportunities saved
}

async function getWalletSignals(walletAddress: string): Promise<WalletSignals> {
  // 1. Query blockchain for wallet history
  // 2. Query database for completed/saved opportunities
  // 3. Return signals
}

function calculateRelevanceBoost(
  opportunity: Opportunity,
  signals: WalletSignals
): number {
  let boost = 0;
  
  // Chain presence (40% of relevance)
  if (opportunity.chains.some(chain => signals.chains.includes(chain))) {
    boost += 0.4;
  }
  
  // Completed similar opportunities (30% of relevance)
  if (signals.completedTypes.includes(opportunity.type)) {
    boost += 0.3;
  }
  
  // Saved similar opportunities (20% of relevance)
  if (signals.savedTypes.includes(opportunity.type)) {
    boost += 0.2;
  }
  
  // Wallet activity (10% of relevance)
  if (signals.txCount > 10) {
    boost += 0.1;
  }
  
  return boost;
}
```

4. **Update API to Apply Personalization**

```typescript
export async function GET(req: NextRequest) {
  const walletAddress = searchParams.get('walletAddress');
  
  // Fetch opportunities from ranking view
  let { data: opportunities } = await supabase
    .from('mv_opportunity_rank')
    .select('*')
    .order('rank_score', { ascending: false });
  
  // If wallet connected, apply personalization
  if (walletAddress) {
    const signals = await getWalletSignals(walletAddress);
    
    opportunities = opportunities.map(opp => ({
      ...opp,
      rank_score: opp.rank_score + calculateRelevanceBoost(opp, signals)
    }));
    
    // Re-sort by adjusted rank_score
    opportunities.sort((a, b) => b.rank_score - a.rank_score);
  }
  
  return NextResponse.json({ items: opportunities, ... });
}
```

#### Requirement 6: Eligibility Preview

**When a wallet is connected, show eligibility status on each card:**
- "Likely Eligible" (score ≥ 0.7)
- "Maybe Eligible" (score 0.4-0.69)
- "Unlikely Eligible" (score < 0.4)

**Implementation:**

1. **Create Eligibility Scoring Function**

**File: `src/lib/hunter/eligibility.ts`**
```typescript
interface EligibilityScore {
  score: number;  // 0-1
  status: 'likely' | 'maybe' | 'unlikely' | 'unknown';
  reasons: string[];
}

async function calculateEligibilityScore(
  walletAddress: string,
  opportunity: Opportunity
): Promise<EligibilityScore> {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Chain presence (40% weight)
  const walletChains = await getWalletChains(walletAddress);
  if (opportunity.chains.some(chain => walletChains.includes(chain))) {
    score += 0.4;
    reasons.push(`Active on ${opportunity.chains[0]}`);
  } else {
    reasons.push(`Not active on required chains`);
  }
  
  // 2. Wallet age (25% weight)
  const walletAge = await getWalletAge(walletAddress);
  if (walletAge >= 30) {
    score += 0.25;
    reasons.push('Wallet age > 30 days');
  } else {
    reasons.push('Wallet too new');
  }
  
  // 3. Transaction count (20% weight)
  const txCount = await getTransactionCount(walletAddress);
  if (txCount >= 10) {
    score += 0.2;
    reasons.push('Sufficient transaction history');
  } else {
    reasons.push('Low transaction count');
  }
  
  // 4. Holdings (15% weight)
  const hasRequiredTokens = await checkHoldings(walletAddress, opportunity);
  if (hasRequiredTokens) {
    score += 0.15;
    reasons.push('Holds required tokens');
  }
  
  // Determine status
  let status: 'likely' | 'maybe' | 'unlikely';
  if (score >= 0.7) status = 'likely';
  else if (score >= 0.4) status = 'maybe';
  else status = 'unlikely';
  
  return { score, status, reasons: reasons.slice(0, 2) };
}
```

2. **Create Eligibility API Endpoint**

**File: `src/app/api/hunter/eligibility/route.ts`**
```typescript
export async function GET(req: NextRequest) {
  const walletAddress = searchParams.get('walletAddress');
  const opportunityId = searchParams.get('opportunityId');
  
  if (!walletAddress || !opportunityId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  // Check cache first
  const cached = await redis.get(`eligibility:${walletAddress}:${opportunityId}`);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }
  
  // Calculate eligibility
  const opportunity = await getOpportunity(opportunityId);
  const eligibility = await calculateEligibilityScore(walletAddress, opportunity);
  
  // Cache for 60 minutes
  await redis.set(
    `eligibility:${walletAddress}:${opportunityId}`,
    JSON.stringify(eligibility),
    { ex: 3600 }
  );
  
  return NextResponse.json(eligibility);
}
```

3. **Update OpportunityCard to Show Eligibility**

**File: `src/components/hunter/OpportunityCard.tsx`**
```typescript
export function OpportunityCard({ opportunity }: Props) {
  const { activeWallet } = useWallet();
  
  // Fetch eligibility if wallet connected
  const { data: eligibility } = useQuery({
    queryKey: ['eligibility', activeWallet, opportunity.id],
    queryFn: () => fetchEligibility(activeWallet!, opportunity.id),
    enabled: !!activeWallet,
  });
  
  return (
    <div className="opportunity-card">
      {/* ... other card content ... */}
      
      {eligibility && (
        <div className={`eligibility-badge ${eligibility.status}`}>
          {eligibility.status === 'likely' && '✓ Likely Eligible'}
          {eligibility.status === 'maybe' && '? Maybe Eligible'}
          {eligibility.status === 'unlikely' && '✗ Unlikely Eligible'}
          <div className="reasons">
            {eligibility.reasons.map(reason => (
              <div key={reason}>• {reason}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Priority

### Phase 1: Data Sync Jobs (Week 1-2)
**Priority: CRITICAL** - Without this, database has no real data

1. Create sync API routes (`/api/sync/*`)
2. Integrate external APIs (Layer3, Galxe, DeFiLlama, etc.)
3. Implement data transformation logic
4. Set up cron jobs in `vercel.json`
5. Test sync jobs populate database

### Phase 2: Ranking System (Week 2-3)
**Priority: HIGH** - Improves user experience

1. Create materialized view `mv_opportunity_rank`
2. Update API route to use ranking view
3. Implement wallet signals fetching
4. Add personalization boost calculation
5. Test ranking with and without wallet

### Phase 3: Eligibility Preview (Week 3-4)
**Priority: MEDIUM** - Nice-to-have feature

1. Create eligibility scoring function
2. Create eligibility API endpoint
3. Add caching layer (Redis)
4. Update OpportunityCard to show eligibility
5. Test eligibility calculations

---

## Testing Plan

### Sync Jobs Testing
```bash
# Manual trigger sync jobs
curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "Authorization: Bearer $CRON_SECRET"

# Verify database populated
psql $DATABASE_URL -c "SELECT COUNT(*) FROM opportunities WHERE type = 'airdrop';"
```

### Ranking Testing
```bash
# Test anonymous ranking (no wallet)
curl http://localhost:3000/api/hunter/opportunities?filter=All&sort=recommended

# Test personalized ranking (with wallet)
curl http://localhost:3000/api/hunter/opportunities?filter=All&sort=recommended&walletAddress=0x123...
```

### Eligibility Testing
```bash
# Test eligibility calculation
curl http://localhost:3000/api/hunter/eligibility?walletAddress=0x123...&opportunityId=abc-123
```

---

## Summary

**Current State:**
- ✅ API endpoint exists
- ✅ Live mode makes API calls
- ✅ Demo mode works
- ❌ Database has dummy data (no sync jobs)
- ❌ No wallet personalization
- ❌ No eligibility preview

**What's Needed:**
1. **Data Sync Jobs** - Populate opportunities from external APIs (Requirement 12)
2. **Ranking System** - Personalize feed based on wallet (Requirement 3)
3. **Eligibility Preview** - Show eligibility status on cards (Requirement 6)

**Estimated Timeline:**
- Phase 1 (Sync Jobs): 1-2 weeks
- Phase 2 (Ranking): 1-2 weeks
- Phase 3 (Eligibility): 1-2 weeks
- **Total: 3-6 weeks** (1-2 developers)

**Next Steps:**
1. Start with Phase 1 (Data Sync Jobs) - most critical
2. Get external API keys (Layer3, Galxe, DeFiLlama, etc.)
3. Create sync API routes
4. Configure cron jobs
5. Test sync jobs populate database with real data
