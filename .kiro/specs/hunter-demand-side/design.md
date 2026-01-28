# Design Document

## Critical Implementation Rules

**These rules MUST be followed to avoid implementation bugs:**

1. **Canonical external identity fields**: opportunities table uses `(source, source_ref)` unique constraint. Use `source_ref` (text) consistently - NOT `source_id`.
2. **Wallet age computation**: Only compute if Alchemy Transfers API or indexed endpoint exists; otherwise return `null`. Do NOT attempt "first_tx_block via RPC" - this is infeasible.
3. **Scoring clamp**: ALL scores (relevance, freshness, overall) MUST be clamped between 0 and 1.
4. **API pattern**: MVP uses **single endpoint** `/api/hunter/opportunities?type=...&walletAddress=...` with type filter. Module-specific endpoints are optional wrappers.
5. **Minimal UI allowed**: Add tabs for RWA + Strategies in Hunter; add Referrals entry in Settings; add eligibility badge display on cards.
6. **Eligibility candidate selection**: Preselect candidates by `(trust_score * 0.7 + recency_boost * 0.3)` then compute eligibility for top 50 to avoid missing high-relevance items.
7. **Referral activation**: Defined as first `user_opportunities.status = 'completed'` event for referred user.
8. **Strategy trust**: Store `strategies.trust_score_cached` as computed value; recompute on strategy create/update; return both cached score and `steps_trust_breakdown[]`.

## Overview

The Hunter Demand-Side system completes all 7 opportunity modules with wallet-aware personalization. The design follows a **layered architecture** where:

1. **API Layer** (src/app/api/hunter/*) - Enhanced with ranking logic, module-specific endpoints
2. **Service Layer** (NEW) - Wallet signals, eligibility engine, ranking engine
3. **Sync Layer** (NEW) - DeFiLlama integration, admin-seeded stubs
4. **Data Layer** (existing + NEW) - opportunities table + module-specific tables

**The 7 Modules:**
1. **Yield/Staking** - DeFiLlama real data (APY, TVL, protocols)
2. **Airdrops** - Admin-seeded with claim windows and eligibility
3. **Quests** - Admin-seeded with multi-step progress tracking
4. **Points/Loyalty** - Admin-seeded programs with conversion hints
5. **RWA Vaults** - Admin-seeded with KYC and jurisdiction requirements
6. **Strategies** - Creator plays linking multiple opportunities
7. **Referrals** - Internal system for viral growth

**Key Design Principles:**
- **Minimal UI changes** - Existing Hunter.tsx works; add RWA/Strategies tabs + Referrals in Settings + eligibility badges
- **Backward compatible** - API works without walletAddress parameter (existing behavior)
- **Cost-controlled** - Aggressive caching, limited eligibility computation
- **Graceful degradation** - Works without Alchemy keys (returns null signals)
- **Module independence** - Each module has its own schema, sync job, and API endpoints

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Hunter Demand-Side                       │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Hunter.tsx │─────▶│ useHunterFeed│                    │
│  │  (existing)  │      │  (existing)   │                    │
│  └──────────────┘      └───────┬──────┘                    │
│                                 │                            │
│                                 ▼                            │
│                    ┌────────────────────────┐               │
│                    │ /api/hunter/           │               │
│                    │ opportunities          │               │
│                    │ (ENHANCED)             │               │
│                    └──────────┬─────────────┘               │
│                               │                              │
│         ┌─────────────────────┼─────────────────────┐       │
│         │                     │                     │       │
│         ▼                     ▼                     ▼       │
│  ┌─────────────┐      ┌──────────────┐     ┌──────────┐   │
│  │   Wallet    │      │  Eligibility │     │ Ranking  │   │
│  │   Signals   │      │    Engine    │     │  Engine  │   │
│  │  (NEW)      │      │   (NEW)      │     │  (NEW)   │   │
│  └──────┬──────┘      └──────┬───────┘     └────┬─────┘   │
│         │                    │                   │          │
│         │                    ▼                   │          │
│         │            ┌───────────────┐           │          │
│         │            │ eligibility_  │           │          │
│         │            │    cache      │           │          │
│         │            └───────────────┘           │          │
│         │                                        │          │
│         └────────────────┬───────────────────────┘          │
│                          │                                  │
│                          ▼                                  │
│                 ┌─────────────────┐                        │
│                 │  opportunities  │                        │
│                 │     table       │                        │
│                 └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

External APIs:
┌──────────────┐         ┌──────────────┐
│  DeFiLlama   │────────▶│ /api/sync/   │
│   (public)   │         │    yield     │
└──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐
│   Alchemy    │────────▶│   Wallet     │
│  (RPC keys)  │         │   Signals    │
└──────────────┘         └──────────────┘
```

### Data Flow

**Scenario 1: Unauthenticated User (Demo Mode)**
```
User → Hunter.tsx → useHunterFeed(isDemo=true)
                  → Returns mock data
                  → No API call
```

**Scenario 2: Authenticated User WITHOUT Wallet**
```
User → Hunter.tsx → useHunterFeed(isDemo=false, activeWallet=null)
                  → GET /api/hunter/opportunities (no walletAddress)
                  → SELECT * FROM opportunities ORDER BY created_at DESC
                  → Returns opportunities (no eligibility, no ranking)
```

**Scenario 3: Authenticated User WITH Wallet (NEW)**
```
User → Hunter.tsx → useHunterFeed(isDemo=false, activeWallet="0x...")
                  → GET /api/hunter/opportunities?walletAddress=0x...
                  → Wallet Signals Service (cached 5min)
                  → Eligibility Engine (cached 24h)
                  → Ranking Engine (computed)
                  → Returns opportunities sorted by ranking.overall DESC
```

**Scenario 4: Sync Job (NEW)**
```
Vercel Cron → POST /api/sync/yield (CRON_SECRET header)
            → Fetch DeFiLlama pools API
            → Transform to opportunities format
            → UPSERT INTO opportunities (source='defillama', source_ref=pool_id)
            → Return {count, source, duration_ms}
```

## Components and Interfaces

### 1. Wallet Signals Service (NEW)

**Location:** `src/lib/hunter/wallet-signals.ts`

**Purpose:** Fetch on-chain wallet characteristics for personalization.

**Interface:**
```typescript
interface WalletSignals {
  address: string;
  wallet_age_days: number | null;
  tx_count_90d: number | null;
  chains_active: string[];
  top_assets: Array<{symbol: string; amount: number}>;
  stablecoin_usd_est: number | null;
}

async function getWalletSignals(
  address: string
): Promise<WalletSignals>
```

**Implementation Strategy:**

1. **Validation:**
   - Validate address format: `/^0x[a-fA-F0-9]{40}$/`
   - Return error if invalid

2. **Cache Check:**
   - Check in-memory LRU cache (key: address, TTL: 5min)
   - If cached and fresh, return immediately

3. **RPC Calls (if ALCHEMY_ETH_RPC_URL exists):**
   - Call `eth_getTransactionCount(address)` for tx count
   - Call `eth_getBalance(address)` for ETH balance
   - Estimate tx_count_90d: tx_count × (90 / wallet_age_days) if wallet_age_days available

4. **Wallet Age (if ALCHEMY_TRANSFERS_API_KEY exists):**
   - Call Alchemy Asset Transfers API to get first seen transaction timestamp
   - Calculate wallet_age_days: (now - first_seen_timestamp) / 86400
   - If ALCHEMY_TRANSFERS_API_KEY not configured, set wallet_age_days = null
   - Do NOT attempt first_tx_block via plain RPC - this is infeasible

5. **Graceful Degradation (if no RPC keys):**
   - Return WalletSignals with null values
   - Log warning: "Alchemy RPC not configured, returning null signals"

5. **Cache Store:**
   - Store result in LRU cache with 5min TTL

**Cost Control:**
- Max 3 RPC calls per wallet per 5 minutes
- Exponential backoff on failures (1s, 2s, 4s)
- Timeout after 3 seconds

### 2. Eligibility Engine (NEW)

**Location:** `src/lib/hunter/eligibility-engine.ts`

**Purpose:** Evaluate whether a wallet qualifies for an opportunity.

**Interface:**
```typescript
interface EligibilityResult {
  status: 'likely' | 'maybe' | 'unlikely';
  score: number; // 0-1
  reasons: string[];
}

async function evaluateEligibility(
  walletSignals: WalletSignals,
  opportunity: Opportunity
): Promise<EligibilityResult>
```

**Implementation Strategy:**

1. **Cache Check:**
   - Query eligibility_cache table: `WHERE wallet_address = ? AND opportunity_id = ? AND created_at > NOW() - INTERVAL '24 hours'`
   - If cached and fresh, return immediately
   - **Note:** TTL is enforced via query timestamp check, not automatic table expiration. The table does not auto-delete old records.

2. **Requirements Parsing:**
   - Parse opportunity.requirements JSONB
   - Expected structure:
     ```json
     {
       "chains": ["ethereum", "base"],
       "min_wallet_age_days": 90,
       "min_tx_count": 10,
       "required_tokens": ["ETH", "USDC"]
     }
     ```

3. **Eligibility Scoring:**
   - Start with score = 1.0
   - For each requirement:
     - **No requirements:** score = 0.5, status = "maybe", reasons = ["No specific requirements"]
     - **Unknown signals:** score = 0.5, status = "maybe", reasons = ["Wallet data unavailable"]
     - **Chain mismatch:** score -= 0.3, reasons += "Not active on required chains"
     - **Wallet age too low:** score -= 0.3, reasons += "Wallet age below minimum"
     - **Tx count too low:** score -= 0.2, reasons += "Transaction count below minimum"
     - **Missing tokens:** score -= 0.2, reasons += "Missing required tokens"

4. **Status Mapping:**
   - score >= 0.8 → status = "likely"
   - 0.5 <= score < 0.8 → status = "maybe"
   - score < 0.5 → status = "unlikely"

5. **Reasons Generation:**
   - Always include 2-5 reasons
   - Positive reasons for "likely": "Active on required chains", "Meets wallet age requirement"
   - Neutral reasons for "maybe": "Partial requirements met", "Some criteria unknown"
   - Negative reasons for "unlikely": "Missing required tokens", "Wallet too new"

6. **Cache Store:**
   - INSERT INTO eligibility_cache (wallet_address, opportunity_id, eligibility_status, eligibility_score, reasons, created_at, updated_at)
   - ON CONFLICT (wallet_address, opportunity_id) DO UPDATE SET eligibility_status = EXCLUDED.eligibility_status, eligibility_score = EXCLUDED.eligibility_score, reasons = EXCLUDED.reasons, updated_at = NOW()
   - **Note:** Always update `updated_at` timestamp on upsert to track last computation time

**Cost Control:**
- Only compute for top 50 of preselected candidates (preselection by hybrid score: trust_score * 0.7 + recency_boost * 0.3)
- Cache results for 24 hours (enforced via query: `created_at > NOW() - INTERVAL '24 hours'`)
- Skip computation if wallet signals are null

### 2.1. Galxe Sync Service (NEW)

**Location:** `src/lib/hunter/sync/galxe.ts`

**Purpose:** Fetch quests and airdrops from Galxe GraphQL API with pagination.

**Interface:**
```typescript
interface GalxeCampaign {
  id: string;
  name: string;
  description: string;
  startTime: number; // Unix timestamp
  endTime: number | null;
  status: 'Active' | 'Expired';
  chain: string;
}

interface GalxeSyncResult {
  quests: Opportunity[];
  airdrops: Opportunity[];
  total_fetched: number;
  pages_fetched: number;
}

async function syncGalxeOpportunities(maxPages?: number): Promise<GalxeSyncResult>
```

**Implementation Strategy:**

1. **Pagination Loop:**
   - Start with cursor = null
   - Make POST request to Galxe GraphQL endpoint
   - Extract pageInfo.endCursor and pageInfo.hasNextPage
   - Continue until hasNextPage === false OR maxPages reached
   - Add 100ms delay between requests to avoid rate limiting

2. **Classification Logic:**
   ```typescript
   function isAirdropCampaign(campaign: GalxeCampaign): boolean {
     const text = (campaign.name + ' ' + campaign.description).toLowerCase();
     
     const airdropKeywords = ['airdrop', 'claim', 'snapshot', 'distribution'];
     const questKeywords = ['milestone', 'complete', 'join', 'follow'];
     
     const hasAirdrop = airdropKeywords.some(kw => text.includes(kw));
     const hasQuest = questKeywords.some(kw => text.includes(kw));
     
     return hasAirdrop && !hasQuest;
   }
   ```

3. **Error Recovery:**
   - Catch GraphQL errors → log + return partial results
   - Network timeout (10s) → retry once with backoff
   - Invalid campaign data → skip campaign, log warning

4. **Cost Control:**
   - Max 10 pages per sync (500 campaigns)
   - 10-minute response cache
   - Only sync 'Active' campaigns

#### Deduplication Strategy

When same airdrop exists in multiple sources (Galxe, DeFiLlama, admin):

**Priority Order (Highest Trust First):**
1. Admin (trust_score = 95 for curated)
2. DeFiLlama (trust_score = 90)
3. Galxe (trust_score = 85)

**Deduplication Algorithm:**
```typescript
function deduplicateAirdrops(
  galxe: Opportunity[],
  defillama: Opportunity[],
  admin: Opportunity[]
): Opportunity[] {
  const map = new Map<string, Opportunity>();
  
  // Process in reverse priority order
  for (const opp of galxe) {
    const key = `${opp.protocol.name}-${opp.chains[0]}`;
    map.set(key, opp);
  }
  
  // DeFiLlama overrides Galxe
  for (const opp of defillama) {
    const key = `${opp.protocol.name}-${opp.chains[0]}`;
    if (!map.has(key) || map.get(key)!.source === 'galxe') {
      map.set(key, opp);
    }
  }
  
  // Admin overrides both (highest trust)
  for (const opp of admin) {
    const key = `${opp.protocol.name}-${opp.chains[0]}`;
    map.set(key, opp); // Always use admin if exists
  }
  
  return Array.from(map.values());
}
```

**Example:**
- Galxe has "Arbitrum Airdrop" (trust=85)
- DeFiLlama has "Arbitrum Airdrop" (trust=90)
- Admin has "Arbitrum Airdrop" (trust=95)
- **Result:** Keep admin version only

### 2.2. Historical Eligibility Checker (NEW)

**Location:** `src/lib/hunter/historical-eligibility.ts`

**Purpose:** Check if wallet was active before airdrop snapshot date.

**Interface:**
```typescript
async function checkSnapshotEligibility(
  walletAddress: string,
  snapshotDate: string, // ISO8601
  requiredChain: string
): Promise<{
  was_active: boolean;
  first_tx_date: string | null;
  reason: string;
}>
```

**Implementation:**
1. Convert snapshot date to block number
2. Call Alchemy Transfers API with block range
3. Filter transfers by chain
4. Return earliest transaction date
5. Cache result for 7 days

### 2.3. Galxe Quest Parser (NEW)

**Location:** `src/lib/action-center/adapters/galxe-quest-parser.ts`

**Purpose:** Parse Galxe campaign description into executable widget steps.

**Implementation:**

Galxe descriptions contain numbered task lists in markdown. Parse them into steps:

**Example Galxe Description:**
```
Join our community!
1. Follow @Protocol on Twitter
2. Join Discord: https://discord.gg/protocol
3. Share campaign on Twitter
```

**Parser Logic:**
```typescript
export function parseGalxeQuestSteps(description: string): WidgetStep[] {
  const steps: WidgetStep[] = [];
  
  // Regex to find numbered lists (1. Task, 2. Task, etc.)
  const taskPattern = /^\s*(\d+)[.)]\s*(.+)$/gm;
  let match;
  
  while ((match = taskPattern.exec(description)) !== null) {
    const stepNumber = parseInt(match[1]);
    const taskText = match[2].trim();
    
    // Extract URLs from task text
    const urlMatch = taskText.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[0] : null;
    
    // Classify step type
    let evidenceType: 'checkbox' | 'url' | 'txhash';
    if (taskText.toLowerCase().includes('share') || 
        taskText.toLowerCase().includes('tweet')) {
      evidenceType = 'url'; // User must paste tweet URL
    } else {
      evidenceType = 'checkbox'; // Simple "Done" confirmation
    }
    
    steps.push({
      step_id: `step-${stepNumber}`,
      type: 'widget',
      title: taskText,
      description: url ? `Click to open: ${url}` : 'Complete this task',
      metadata: {
        url,
        evidence_required: evidenceType,
      },
    });
  }
  
  // Add final verification step
  steps.push({
    step_id: `step-verify`,
    type: 'verification',
    title: 'Verify completion on Galxe',
    description: 'We\'ll check if you completed all tasks',
    metadata: {
      galxe_campaign_id: campaign.id,
    },
  });
  
  return steps;
}
```

**Fallback for Unstructured Descriptions:**
If no numbered list found:
- Create single widget step with full description
- Add verification step
- Let user manually confirm

**Testing:**
- **Test Case 1: Numbered List**
  - Input: "1. Follow Twitter\n2. Join Discord"
  - Output: 2 widget steps + 1 verification step
- **Test Case 2: No Structure**
  - Input: "Complete tasks to earn rewards"
  - Output: 1 generic widget step + 1 verification step

### 3. Ranking Engine (NEW)

**Location:** `src/lib/hunter/ranking-engine.ts`

**Purpose:** Score opportunities based on relevance, trust, and freshness.

**Interface:**
```typescript
interface RankingScores {
  overall: number; // 0-1
  relevance: number; // 0-1
  freshness: number; // 0-1
}

function calculateRanking(
  opportunity: Opportunity,
  eligibility: EligibilityResult,
  walletSignals: WalletSignals,
  userHistory: UserHistory
): RankingScores
```

**Implementation Strategy:**

1. **Relevance Score (0-1):**
   - Base: 0.0
   - +0.4 if opportunity.chains ∩ walletSignals.chains_active ≠ ∅
   - +0.2 if eligibility.status === 'likely'
   - +0.1 if eligibility.status === 'maybe'
   - +0.1 if opportunity.tags ∩ userHistory.saved_tags ≠ ∅
   - +0.2 if opportunity.type === userHistory.most_completed_type
   - **Clamp to [0, 1]**

2. **Trust Score (0-1):**
   - Normalize: opportunity.trust_score / 100

3. **Freshness Score (0-1):**
   - **Urgency Boost (for opportunities with end_date):**
     - hours_to_end = (end_date - now) / 3600
     - urgency = max(0, 1 - hours_to_end / 168) // 168 hours = 7 days
   - **Recency (for all opportunities):**
     - days_since_created = (now - created_at) / 86400
     - recency = max(0, 1 - days_since_created / 30) // 30 days
   - **Final Freshness:**
     - freshness = max(urgency, recency)
   - **Clamp to [0, 1]**

4. **Overall Score:**
   - overall = 0.60 × relevance + 0.25 × trust + 0.15 × freshness
   - **Clamp to [0, 1]**

**Cost Control:**
- Computed on-demand (not cached)
- Lightweight calculation (no external API calls)

### 4. DeFiLlama Sync Service (NEW)

**Location:** `src/lib/hunter/sync/defillama.ts`

**Purpose:** Fetch yield opportunities from DeFiLlama and upsert into database.

**Interface:**
```typescript
interface SyncResult {
  count: number;
  source: string;
  duration_ms: number;
  errors?: string[];
}

async function syncYieldOpportunities(): Promise<SyncResult>
```

**Implementation Strategy:**

1. **Fetch Pools:**
   - Call DeFiLlama API: `GET https://yields.llama.fi/pools`
   - Response: Array of pool objects with apy, tvlUsd, chain, project, symbol

2. **Filter Pools:**
   - Only include pools with:
     - apy > 0
     - tvlUsd > 100000 (min $100k TVL)
     - chain in ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon']

3. **Transform to Opportunities:**
   ```typescript
   {
     slug: `${project}-${chain}-${symbol}`.toLowerCase().replace(/\s+/g, '-'),
     title: `${project} ${symbol} Staking`,
     protocol: project,
     type: 'staking',
     chains: [chain.toLowerCase()],
     reward_min: null,
     reward_max: null,
     reward_currency: 'USD',
     apr: apy,
     tvl_usd: tvlUsd,
     trust_score: 80, // Default for DeFiLlama pools
     source: 'defillama',
     source_ref: pool.pool, // DeFiLlama pool ID
     requirements: {
       chains: [chain.toLowerCase()],
       min_wallet_age_days: 0,
       min_tx_count: 1
     }
   }
   ```

4. **Upsert:**
   - `INSERT INTO opportunities (...) ON CONFLICT (source, source_ref) DO UPDATE SET ...`
   - Update: apr, tvl_usd, updated_at, last_synced_at

5. **Error Handling:**
   - Catch API errors, log, continue
   - Return partial results with errors array

**Cost Control:**
- Cache DeFiLlama response for 30 minutes
- Only sync top 100 pools by TVL
- Timeout after 30 seconds

### 5. Enhanced API Route

**Location:** `src/app/api/hunter/opportunities/route.ts` (MODIFY EXISTING)

**Changes:**

1. **Add walletAddress parameter handling:**
   ```typescript
   const walletAddress = searchParams.get('walletAddress');
   ```

2. **Conditional personalization:**
   ```typescript
   if (walletAddress) {
     // NEW: Fetch wallet signals
     const signals = await getWalletSignals(walletAddress);
     
     // NEW: Preselect candidates by hybrid score to avoid missing high-relevance items
     const now = Date.now();
     const candidatesWithScore = data.map(opp => ({
       ...opp,
       preScore: (opp.trust_score * 0.7) + (calculateRecencyBoost(opp.created_at, now) * 0.3)
     }));
     candidatesWithScore.sort((a, b) => b.preScore - a.preScore);
     const topCandidates = candidatesWithScore.slice(0, 100);
     
     // NEW: Evaluate eligibility for top 50 of preselected candidates
     const eligibilityResults = await Promise.all(
       topCandidates.slice(0, 50).map(opp => evaluateEligibility(signals, opp))
     );
     
     // NEW: Calculate ranking
     const rankedOpps = topCandidates.slice(0, 50).map((opp, i) => ({
       ...opp,
       eligibility_preview: eligibilityResults[i],
       ranking: calculateRanking(opp, eligibilityResults[i], signals, userHistory)
     }));
     
     // NEW: Sort by ranking.overall DESC
     rankedOpps.sort((a, b) => b.ranking.overall - a.ranking.overall);
     
     return NextResponse.json({
       items: rankedOpps,
       cursor: null,
       ts: new Date().toISOString()
     });
   }
   
   // EXISTING: Return without personalization
   return NextResponse.json({
     items: data,
     cursor: null,
     ts: new Date().toISOString()
   });
   ```

3. **Add error handling:**
   - Catch wallet signals errors → return opportunities without personalization
   - Catch eligibility errors → return opportunities without eligibility
   - Log all errors for monitoring

### 6. Sync API Routes (NEW)

**Location:** `src/app/api/sync/yield/route.ts` (NEW)

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }
  
  // Run sync
  const result = await syncYieldOpportunities();
  
  return NextResponse.json(result);
}
```

**Location:** `src/app/api/sync/airdrops/route.ts` (NEW - STUB)

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }
  
  // Stub response
  return NextResponse.json({
    count: 0,
    source: 'stub',
    message: 'Admin seeding required. Layer3/Galxe integration pending partnership approval.',
    duration_ms: 0
  });
}
```

**Similar stubs for:** `/api/sync/quests`, `/api/sync/points`

## Data Models

### Opportunities Table (EXTEND EXISTING)

**New Columns:**
```sql
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_ref TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
-- Yield/Staking columns
ADD COLUMN IF NOT EXISTS apy NUMERIC,
ADD COLUMN IF NOT EXISTS tvl_usd NUMERIC,
ADD COLUMN IF NOT EXISTS underlying_assets TEXT[],
ADD COLUMN IF NOT EXISTS lockup_days INTEGER,
-- Airdrop columns
ADD COLUMN IF NOT EXISTS snapshot_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS airdrop_category TEXT,
-- Quest columns
ADD COLUMN IF NOT EXISTS quest_steps JSONB,
ADD COLUMN IF NOT EXISTS quest_difficulty TEXT CHECK (quest_difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS xp_reward INTEGER,
ADD COLUMN IF NOT EXISTS quest_type TEXT,
-- Points columns
ADD COLUMN IF NOT EXISTS points_program_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_hint TEXT,
ADD COLUMN IF NOT EXISTS points_estimate_formula TEXT,
-- RWA columns
ADD COLUMN IF NOT EXISTS issuer_name TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_investment NUMERIC,
ADD COLUMN IF NOT EXISTS liquidity_term_days INTEGER,
ADD COLUMN IF NOT EXISTS rwa_type TEXT;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'opportunities_source_ref_unique'
  ) THEN
    ALTER TABLE opportunities 
    ADD CONSTRAINT opportunities_source_ref_unique 
    UNIQUE (source, source_ref);
  END IF;
END $$;
```

### Module-Specific Tables (NEW)

**User Yield Positions:**
```sql
CREATE TABLE IF NOT EXISTS user_yield_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_deposited NUMERIC,
  current_value NUMERIC,
  apy_at_deposit NUMERIC,
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  UNIQUE (user_id, opportunity_id, wallet_address)
);
```

**User Airdrop Status:**
```sql
CREATE TABLE IF NOT EXISTS user_airdrop_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  status TEXT CHECK (status IN ('eligible', 'maybe', 'unlikely', 'claimed', 'missed', 'expired')) NOT NULL,
  claim_amount NUMERIC,
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);
```

**User Quest Progress:**
```sql
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::JSONB,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, opportunity_id, wallet_address)
);
```

**User Points Status:**
```sql
CREATE TABLE IF NOT EXISTS user_points_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  estimated_value_usd NUMERIC,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);
```

**User RWA Positions:**
```sql
CREATE TABLE IF NOT EXISTS user_rwa_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_invested NUMERIC,
  current_value NUMERIC,
  kyc_completed BOOLEAN DEFAULT FALSE,
  invested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);
```

**Strategies:**
```sql
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  steps JSONB NOT NULL, -- Array of opportunity IDs
  trust_score_cached INTEGER DEFAULT 80,
  steps_trust_breakdown JSONB, -- Array of per-step trust scores
  category TEXT[],
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, strategy_id)
);
```

**Referrals:**
```sql
CREATE TABLE IF NOT EXISTS referral_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_rewards NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ,
  reward_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referrer_id, referred_user_id)
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Eligibility Cache Table (EXTEND EXISTING)

**New Columns:**
```sql
ALTER TABLE eligibility_cache
ADD COLUMN IF NOT EXISTS eligibility_status TEXT CHECK (eligibility_status IN ('likely', 'maybe', 'unlikely')),
ADD COLUMN IF NOT EXISTS eligibility_score NUMERIC(3,2) CHECK (eligibility_score >= 0 AND eligibility_score <= 1);

-- Rename column if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eligibility_cache' AND column_name = 'eligible'
  ) THEN
    ALTER TABLE eligibility_cache RENAME COLUMN eligible TO is_eligible;
  END IF;
END $$;

-- Add composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_eligibility_wallet_opp 
ON eligibility_cache (wallet_address, opportunity_id);
```

### User History View (NEW)

**Purpose:** Aggregate user behavior for relevance scoring.

```sql
CREATE OR REPLACE VIEW user_history AS
SELECT 
  user_id,
  ARRAY_AGG(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL) AS saved_tags,
  MODE() WITHIN GROUP (ORDER BY o.type) AS most_completed_type,
  COUNT(DISTINCT uo.opportunity_id) AS completed_count
FROM user_opportunities uo
JOIN opportunities o ON uo.opportunity_id = o.id
CROSS JOIN LATERAL unnest(o.tags) AS t(tag)
WHERE uo.status = 'completed'
GROUP BY user_id;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing correctness properties, I need to analyze the acceptance criteria for testability using the prework tool.


### Property 1: Wallet Signals Computation for All Addresses

*For any* valid wallet address provided to GET /api/hunter/opportunities, the system should compute wallet signals and include them in the personalization pipeline.

**Validates: Requirements 1.1, 4.1**

### Property 2: Eligibility Evaluation Completeness

*For any* set of opportunities and valid wallet signals, the system should evaluate eligibility for each opportunity in the result set.

**Validates: Requirements 1.2**

### Property 3: Ranking Follows Eligibility

*For any* opportunity with computed eligibility, the system should calculate ranking scores (relevance, trust, freshness) and include them in the response.

**Validates: Requirements 1.3**

### Property 4: Ranked Opportunities Sorted Descending

*For any* set of opportunities with ranking scores, the returned list should be sorted by ranking.overall in descending order (highest score first).

**Validates: Requirements 1.4**

### Property 5: Backward Compatibility Without Wallet

*For any* request to GET /api/hunter/opportunities without walletAddress parameter, the system should return opportunities sorted by created_at descending without eligibility or ranking objects.

**Validates: Requirements 1.5**

### Property 6: Eligibility Preview Presence

*For any* response from GET /api/hunter/opportunities with walletAddress parameter, each opportunity should include an eligibility_preview object with status, score, and reasons fields.

**Validates: Requirements 1.6, 7.1**

### Property 7: Ranking Object Presence

*For any* response from GET /api/hunter/opportunities with walletAddress parameter, each opportunity should include a ranking object with overall, relevance, and freshness fields.

**Validates: Requirements 1.7, 7.2**

### Property 8: Sync Job Idempotence

*For any* yield opportunity from DeFiLlama, running the sync job multiple times should not create duplicate records (upsert by source + source_ref).

**Validates: Requirements 2.5**

### Property 9: Sync Job Authorization

*For any* request to POST /api/sync/* endpoints without valid CRON_SECRET header, the system should return 401 Unauthorized.

**Validates: Requirements 2.8**

### Property 10: Wallet Address Validation

*For any* string provided as wallet address, the system should only accept strings matching the pattern /^0x[a-fA-F0-9]{40}$/ and reject all others.

**Validates: Requirements 4.1**

### Property 11: Wallet Signals Caching

*For any* wallet address, fetching signals twice within 5 minutes should return cached data without making additional RPC calls.

**Validates: Requirements 4.4, 4.5, 10.5**

### Property 12: Empty Requirements Default Eligibility

*For any* opportunity with no requirements field or empty requirements object, the eligibility engine should return status "maybe" with score 0.5.

**Validates: Requirements 5.1**

### Property 13: Eligibility Score to Status Mapping

*For any* eligibility score, the system should map it to status as follows: score >= 0.8 → "likely", 0.5 <= score < 0.8 → "maybe", score < 0.5 → "unlikely".

**Validates: Requirements 5.7, 5.8, 5.9**

### Property 14: Eligibility Reasons Count

*For any* eligibility result, the reasons array should contain between 2 and 5 reasons (inclusive).

**Validates: Requirements 5.10**

### Property 15: Ranking Formula Correctness

*For any* opportunity with relevance, trust_score, and freshness values, the overall ranking score should equal: 0.60 × relevance + 0.25 × (trust_score / 100) + 0.15 × freshness.

**Validates: Requirements 6.1**

### Property 16: Relevance Calculation Correctness

*For any* opportunity, wallet signals, and eligibility result, the relevance score should be calculated as the sum of:
- +0.4 if opportunity chains intersect with wallet active chains
- +0.2 if eligibility status is "likely"
- +0.1 if eligibility status is "maybe"
- +0.1 if opportunity tags intersect with user saved tags
- +0.2 if opportunity type matches user's most completed type

**Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 17: Freshness Calculation Correctness

*For any* opportunity, the freshness score should be calculated as:
- urgency = max(0, 1 - hours_to_end / 168) for opportunities with end_date
- recency = max(0, 1 - days_since_created / 30) for all opportunities
- freshness = max(urgency, recency)

**Validates: Requirements 6.7, 6.8, 6.9**

### Property 18: DeFiLlama Response Caching

*For any* DeFiLlama API call, fetching the same data twice within 30 minutes should return cached data without making additional API calls.

**Validates: Requirements 10.4**

### Property 19: Eligibility Results Caching

*For any* wallet address and opportunity pair, computing eligibility twice within 24 hours should return cached data without recomputing.

**Validates: Requirements 10.6**

### Property 20: Top 50 Eligibility Limit

*For any* request with more than 50 opportunities, the system should preselect the top 100 candidates by hybrid score (trust_score * 0.7 + recency_boost * 0.3), then compute eligibility for the top 50 of those preselected candidates.

**Validates: Requirements 11.2, 11.3**

### Property 21: Opportunity Serialization Round Trip

*For any* valid opportunity object, serializing to JSON then deserializing should produce an equivalent object (all fields preserved).

**Validates: Requirements 12.5**

## Error Handling

### Wallet Signals Service Errors

**Scenario:** Alchemy RPC call fails or times out

**Handling:**
1. Log error with wallet address and error message
2. Return WalletSignals with null values
3. Continue with eligibility evaluation (will return "maybe" status)
4. Do NOT throw error to API route

**Scenario:** Invalid wallet address format

**Handling:**
1. Return error response: `{error: {code: 'INVALID_ADDRESS', message: 'Wallet address must match 0x[a-fA-F0-9]{40}'}}`
2. HTTP 400 Bad Request

### Eligibility Engine Errors

**Scenario:** Wallet signals are null (RPC unavailable)

**Handling:**
1. Return EligibilityResult with status "maybe", score 0.5, reasons ["Wallet data unavailable"]
2. Cache this result for 1 hour (shorter TTL than normal)

**Scenario:** Opportunity requirements parsing fails

**Handling:**
1. Log error with opportunity ID
2. Return EligibilityResult with status "maybe", score 0.5, reasons ["Requirements format invalid"]
3. Continue processing other opportunities

### Ranking Engine Errors

**Scenario:** Missing eligibility or wallet signals

**Handling:**
1. Use default values: relevance = 0.1, trust = opportunity.trust_score / 100, freshness = recency only
2. Log warning
3. Continue with ranking

### Sync Job Errors

**Scenario:** DeFiLlama API returns 429 (rate limited)

**Handling:**
1. Implement exponential backoff: wait 1s, 2s, 4s, 8s
2. After 3 retries, log error and return partial results
3. Return SyncResult with errors array: `{count: N, source: 'defillama', errors: ['Rate limited after 3 retries']}`

**Scenario:** Database upsert fails

**Handling:**
1. Log error with opportunity slug and error message
2. Continue processing other opportunities
3. Return SyncResult with errors array

**Scenario:** Invalid CRON_SECRET

**Handling:**
1. Return 401 Unauthorized immediately
2. Log security warning with IP address
3. Do NOT execute sync logic

### API Route Errors

**Scenario:** Wallet signals service throws error

**Handling:**
1. Catch error, log it
2. Continue without personalization (return opportunities sorted by created_at)
3. Include warning in response: `{items: [...], warning: 'Personalization unavailable'}`

**Scenario:** Database query fails

**Handling:**
1. Return 500 Internal Server Error
2. Log error with query details
3. Return error response: `{error: {code: 'INTERNAL', message: 'Failed to fetch opportunities'}}`

## Testing Strategy

### Dual Testing Approach

The Hunter Demand-Side MVP requires both **unit tests** and **property-based tests** for comprehensive coverage:

**Unit Tests** (Vitest):
- Specific examples demonstrating correct behavior
- Edge cases (empty requirements, null signals, invalid addresses)
- Error conditions (API failures, timeouts, invalid secrets)
- Integration points (API route → services → database)

**Property-Based Tests** (fast-check):
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each property test references its design document property

### Property-Based Testing Configuration

**Library:** fast-check (TypeScript property-based testing library)

**Installation:**
```bash
npm install --save-dev fast-check
```

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `// Feature: hunter-demand-side, Property N: [property text]`
- Each test validates requirements: `// Validates: Requirements X.Y, X.Z`

**Example Property Test:**
```typescript
import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { evaluateEligibility } from '@/lib/hunter/eligibility-engine';

// Feature: hunter-demand-side, Property 12: Empty Requirements Default Eligibility
// Validates: Requirements 5.1
describe('Eligibility Engine - Empty Requirements', () => {
  test('returns maybe status with 0.5 score for opportunities with no requirements', () => {
    fc.assert(
      fc.property(
        // Generator: opportunities with empty or missing requirements
        fc.record({
          id: fc.uuid(),
          title: fc.string(),
          type: fc.constantFrom('airdrop', 'quest', 'staking', 'yield'),
          requirements: fc.oneof(
            fc.constant({}),
            fc.constant(null),
            fc.constant(undefined)
          )
        }),
        // Generator: any wallet signals
        fc.record({
          address: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s),
          wallet_age_days: fc.option(fc.nat()),
          tx_count_90d: fc.option(fc.nat()),
          chains_active: fc.array(fc.string()),
          top_assets: fc.array(fc.record({ symbol: fc.string(), amount: fc.float() })),
          stablecoin_usd_est: fc.option(fc.float())
        }),
        async (opportunity, walletSignals) => {
          const result = await evaluateEligibility(walletSignals, opportunity);
          
          expect(result.status).toBe('maybe');
          expect(result.score).toBe(0.5);
          expect(result.reasons).toContain('No specific requirements');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Examples

**Wallet Signals Service:**
```typescript
describe('Wallet Signals Service', () => {
  test('validates wallet address format', async () => {
    await expect(getWalletSignals('invalid')).rejects.toThrow('Invalid wallet address');
    await expect(getWalletSignals('0x123')).rejects.toThrow('Invalid wallet address');
    await expect(getWalletSignals('0x' + 'a'.repeat(40))).resolves.toBeDefined();
  });
  
  test('returns null signals when RPC unavailable', async () => {
    // Mock: no ALCHEMY_ETH_RPC_URL
    delete process.env.ALCHEMY_ETH_RPC_URL;
    
    const signals = await getWalletSignals('0x' + 'a'.repeat(40));
    
    expect(signals.wallet_age_days).toBeNull();
    expect(signals.tx_count_90d).toBeNull();
    expect(signals.chains_active).toEqual([]);
  });
  
  test('caches signals for 5 minutes', async () => {
    const address = '0x' + 'a'.repeat(40);
    
    // First call
    const signals1 = await getWalletSignals(address);
    
    // Second call (should be cached)
    const signals2 = await getWalletSignals(address);
    
    expect(signals1).toEqual(signals2);
    // Verify no additional RPC calls made (mock assertion)
  });
});
```

**Eligibility Engine:**
```typescript
describe('Eligibility Engine', () => {
  test('returns unlikely for missing required chain', async () => {
    const opportunity = {
      id: '1',
      requirements: { chains: ['ethereum'] }
    };
    const walletSignals = {
      address: '0x...',
      chains_active: ['base', 'arbitrum']
    };
    
    const result = await evaluateEligibility(walletSignals, opportunity);
    
    expect(result.status).toBe('unlikely');
    expect(result.score).toBeLessThan(0.5);
    expect(result.reasons).toContain('Not active on required chains');
  });
  
  test('returns likely for meeting all requirements', async () => {
    const opportunity = {
      id: '1',
      requirements: {
        chains: ['ethereum'],
        min_wallet_age_days: 30,
        min_tx_count: 10
      }
    };
    const walletSignals = {
      address: '0x...',
      wallet_age_days: 90,
      tx_count_90d: 50,
      chains_active: ['ethereum', 'base']
    };
    
    const result = await evaluateEligibility(walletSignals, opportunity);
    
    expect(result.status).toBe('likely');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });
});
```

**Ranking Engine:**
```typescript
describe('Ranking Engine', () => {
  test('calculates overall score with correct weights', () => {
    const opportunity = { trust_score: 80 };
    const eligibility = { status: 'likely', score: 0.9 };
    const relevance = 0.7;
    const freshness = 0.5;
    
    const ranking = calculateRanking(opportunity, eligibility, walletSignals, userHistory);
    
    const expected = 0.60 * relevance + 0.25 * 0.8 + 0.15 * freshness;
    expect(ranking.overall).toBeCloseTo(expected, 2);
  });
  
  test('adds 0.4 to relevance for chain match', () => {
    const opportunity = { chains: ['ethereum'] };
    const walletSignals = { chains_active: ['ethereum', 'base'] };
    
    const ranking = calculateRanking(opportunity, eligibility, walletSignals, userHistory);
    
    expect(ranking.relevance).toBeGreaterThanOrEqual(0.4);
  });
});
```

**Sync Jobs:**
```typescript
describe('DeFiLlama Sync', () => {
  test('upserts opportunities without creating duplicates', async () => {
    // Mock DeFiLlama response with same pool twice
    const mockPools = [
      { pool: 'aave-eth-usdc', apy: 5.2, tvlUsd: 1000000 },
      { pool: 'aave-eth-usdc', apy: 5.3, tvlUsd: 1100000 } // Updated
    ];
    
    const result = await syncYieldOpportunities();
    
    // Verify only 1 record in database
    const count = await db.query('SELECT COUNT(*) FROM opportunities WHERE source_ref = ?', ['aave-eth-usdc']);
    expect(count).toBe(1);
    
    // Verify updated values
    const opp = await db.query('SELECT * FROM opportunities WHERE source_ref = ?', ['aave-eth-usdc']);
    expect(opp.apr).toBe(5.3);
    expect(opp.tvl_usd).toBe(1100000);
  });
  
  test('rejects requests without valid CRON_SECRET', async () => {
    const response = await fetch('/api/sync/yield', {
      method: 'POST',
      headers: { 'x-cron-secret': 'invalid' }
    });
    
    expect(response.status).toBe(401);
  });
});
```

### Integration Testing

**API Route with Personalization:**
```typescript
describe('GET /api/hunter/opportunities', () => {
  test('returns personalized opportunities for authenticated user with wallet', async () => {
    const response = await fetch('/api/hunter/opportunities?walletAddress=0x...', {
      credentials: 'include'
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify personalization
    expect(data.items[0]).toHaveProperty('eligibility_preview');
    expect(data.items[0]).toHaveProperty('ranking');
    
    // Verify sorting
    for (let i = 1; i < data.items.length; i++) {
      expect(data.items[i-1].ranking.overall).toBeGreaterThanOrEqual(data.items[i].ranking.overall);
    }
  });
  
  test('returns non-personalized opportunities without walletAddress', async () => {
    const response = await fetch('/api/hunter/opportunities');
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify no personalization
    expect(data.items[0]).not.toHaveProperty('eligibility_preview');
    expect(data.items[0]).not.toHaveProperty('ranking');
  });
});
```

### E2E Testing

**Complete Personalization Flow:**
```typescript
test('complete personalization flow from wallet connect to ranked feed', async ({ page }) => {
  // Navigate to Hunter
  await page.goto('/hunter');
  
  // Initially demo mode
  await expect(page.locator('[data-testid="demo-badge"]')).toBeVisible();
  
  // Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="select-metamask"]');
  
  // Wait for personalized feed
  await page.waitForSelector('[data-testid="eligibility-status"]');
  
  // Verify eligibility badges visible
  const eligibilityBadges = await page.locator('[data-testid="eligibility-status"]').count();
  expect(eligibilityBadges).toBeGreaterThan(0);
  
  // Verify opportunities are ranked (first has highest score)
  const firstScore = await page.locator('[data-testid="ranking-score"]').first().textContent();
  const secondScore = await page.locator('[data-testid="ranking-score"]').nth(1).textContent();
  expect(parseFloat(firstScore!)).toBeGreaterThanOrEqual(parseFloat(secondScore!));
});
```

### Test Coverage Requirements

**Minimum Coverage:**
- Property tests: 100% of correctness properties (21 properties)
- Unit tests: 80% line coverage for services
- Integration tests: All API endpoints
- E2E tests: Critical user flows (demo → live, wallet connect → personalized feed)

**Coverage Exclusions:**
- UI components (tested via E2E)
- Type definitions
- Configuration files

### Running Tests

```bash
# Run all tests
npm test

# Run property tests only
npm test -- --grep "Property"

# Run unit tests only
npm test -- --grep "unit"

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

## Summary

The Hunter Demand-Side system completes all 7 opportunity modules with:

1. **Wallet-aware personalization** - Relevance scoring based on wallet characteristics
2. **Eligibility evaluation** - Likely/Maybe/Unlikely status with reasons
3. **Multi-factor ranking** - 60% relevance + 25% trust + 15% freshness
4. **Complete module coverage** - All 7 types (Yield, Airdrops, Quests, Points, RWA, Strategies, Referrals)
5. **Sync jobs** - DeFiLlama yield integration, admin-seeded data for other modules
6. **Cost-controlled architecture** - Aggressive caching, limited computation

**Module Status:**
- **Yield/Staking** - DeFiLlama real data (highest priority)
- **Airdrops** - Admin-seeded with claim windows
- **Quests** - Admin-seeded with progress tracking
- **Points** - Admin-seeded with conversion hints
- **RWA** - Admin-seeded with KYC requirements
- **Strategies** - Creator plays linking opportunities
- **Referrals** - Internal viral growth system

**Key Design Decisions:**
- **Minimal UI changes** - Existing components work; add RWA/Strategies tabs + Referrals in Settings + eligibility badges
- **Backward compatible** - API works without walletAddress parameter
- **Graceful degradation** - Works without Alchemy keys (returns null signals)
- **Property-based testing** - 21 correctness properties with 100+ iterations each
- **Module independence** - Each module has its own schema, sync job, and API endpoints

**Next Steps:**
- Review and approve design
- Create implementation tasks (already done)
- Execute tasks with property-based testing
