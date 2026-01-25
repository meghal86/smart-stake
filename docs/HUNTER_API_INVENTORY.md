# Hunter Demand-Side: Complete Third-Party API Inventory

## Overview

This document provides a comprehensive inventory of all third-party APIs required for the Hunter Demand-Side system across all 7 modules. The implementation follows a phased approach to minimize costs while delivering value.

## Phased API Strategy

### Phase 1: MVP ($0/month) - Week 1-2
**Goal:** Launch all 7 modules with zero external API costs

**APIs:**
- DeFiLlama (FREE, no key) - Yield/Staking data
- Alchemy (FREE tier) - Wallet signals
- Supabase (FREE tier) - Database
- Admin Seeds - Airdrops, Quests, Points, RWA

**Cost:** $0/month
**Timeline:** Week 1-2
**Status:** Ready to implement

### Phase 2: Enhanced Data ($0-100/month) - Month 2-3
**Goal:** Replace admin seeds with real APIs via partnerships

**APIs:**
- Layer3 API (Partnership) - Quest data
- Galxe API (Partnership) - Quest/Campaign data
- Zealy API (Partnership) - Community quest data
- QuestN API (Partnership) - Quest aggregation

**Cost:** $0-100/month (partnership negotiations)
**Timeline:** Month 2-3
**Status:** Pending partnerships

### Phase 3: Scale & Premium ($100-500/month) - Month 4+
**Goal:** Scale to thousands of users with premium data

**APIs:**
- DeBank API (Premium) - Enhanced wallet analytics
- RWA.xyz API (Premium) - Real-world asset data
- DeFiLlama Pro (Premium) - Priority access, more data
- Alchemy Growth (Premium) - Higher compute units

**Cost:** $100-500/month
**Timeline:** Month 4+
**Status:** Optional for scale

---

## Phase 1 APIs (MVP - $0/month)

### 1. DeFiLlama API
**Purpose:** Yield/Staking opportunities (Module 1)
**Cost:** FREE forever
**Limits:** 100 requests/minute
**Documentation:** https://defillama.com/docs/api

**Endpoints Used:**
- `GET https://yields.llama.fi/pools` - All yield pools
- `GET https://yields.llama.fi/chart/{pool}` - Historical APY

**Setup:**
```bash
# No API key required
DEFILLAMA_API_URL=https://yields.llama.fi
```

**Usage Estimate:**
- Sync job: Every 2 hours = 12 calls/day
- Response size: ~2MB per call
- Monthly: 360 calls, ~720MB data
- Well within free tier limits

**Rate Limiting:**
- 100 req/min = 6,000 req/hour
- Our usage: 0.5 req/hour
- Headroom: 12,000x

### 2. Alchemy API
**Purpose:** Wallet signals (age, tx count, balances)
**Cost:** FREE tier (30M compute units/month)
**Limits:** ~25 requests/second
**Documentation:** https://docs.alchemy.com/

**Endpoints Used:**
- `eth_getTransactionCount` - Transaction count
- `eth_getBalance` - ETH balance
- Asset Transfers API - Wallet age (first transaction)

**Setup:**
```bash
# Get key: https://dashboard.alchemy.com
ALCHEMY_TRANSFERS_API_KEY=your_key
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
```

**Usage Estimate:**
- Per wallet: 3 RPC calls (tx count, balance, transfers)
- Compute units: ~50 CU per wallet
- Daily active users: 100
- Daily usage: 5,000 CU
- Monthly: 150,000 CU
- Free tier: 30,000,000 CU
- Headroom: 200x

**Caching Strategy:**
- Wallet signals cached 5 minutes
- Reduces API calls by 90%
- Actual monthly usage: ~15,000 CU

### 3. Supabase
**Purpose:** Database for all 7 modules
**Cost:** FREE tier (500MB database)
**Limits:** 500MB storage, 2GB bandwidth
**Documentation:** https://supabase.com/docs

**Setup:**
```bash
# Already configured in existing .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Usage Estimate:**
- Opportunities table: ~50-100MB
- User data: ~10-20MB
- Eligibility cache: ~20-30MB
- Total: ~100MB
- Free tier: 500MB
- Headroom: 5x

### 4. Admin Seed Scripts
**Purpose:** Airdrops, Quests, Points, RWA data (Modules 2-5)
**Cost:** $0 (manual curation)
**Maintenance:** Weekly updates

**Data Sources:**
- Twitter/X announcements
- Discord communities
- Crypto news sites
- Manual research

**Seed Data:**
- 10-15 airdrops
- 10-15 quests
- 10-15 points programs
- 10-15 RWA vaults
- Total: 40-60 opportunities

---

## Phase 2 APIs (Enhanced Data - $0-100/month)

### 1. Layer3 API
**Purpose:** Quest data (Module 3)
**Cost:** Partnership (target: $0-50/month)
**Documentation:** https://layer3.xyz/docs

**Partnership Strategy:**
- Reach out to Layer3 BD team
- Propose mutual benefit: We drive users to their quests
- Request API access for quest metadata
- Negotiate revenue share or free tier

**Endpoints:**
- `GET /api/quests` - All active quests
- `GET /api/quests/{id}` - Quest details
- `POST /api/quests/{id}/track` - Track completion

**Fallback:** Continue with admin seeds if partnership fails

### 2. Galxe API
**Purpose:** Campaign/Quest data (Module 3)
**Cost:** Partnership (target: $0-50/month)
**Documentation:** https://docs.galxe.com/

**Partnership Strategy:**
- Similar to Layer3
- Galxe has public GraphQL API
- May not require partnership for read-only access

**Endpoints:**
- GraphQL: `query { campaigns { ... } }`
- GraphQL: `query { campaign(id: $id) { ... } }`

**Fallback:** Use public GraphQL API with rate limiting

### 3. Zealy API
**Purpose:** Community quest data (Module 3)
**Cost:** Partnership (target: $0-50/month)
**Documentation:** https://zealy.io/docs

**Partnership Strategy:**
- Zealy focuses on community engagement
- Propose integration to drive community growth
- Request API access for quest aggregation

**Fallback:** Continue with admin seeds

### 4. QuestN API
**Purpose:** Quest aggregation (Module 3)
**Cost:** Partnership (target: $0-50/month)
**Documentation:** https://questn.com/docs

**Partnership Strategy:**
- QuestN aggregates quests from multiple platforms
- Single API for multiple quest sources
- Negotiate bulk access

**Fallback:** Continue with admin seeds

---

## Phase 3 APIs (Scale & Premium - $100-500/month)

### 1. DeBank API
**Purpose:** Enhanced wallet analytics
**Cost:** $100-200/month (Pro tier)
**Documentation:** https://docs.cloud.debank.com/

**Features:**
- Comprehensive wallet history
- Multi-chain portfolio tracking
- DeFi position tracking
- NFT holdings

**When to Upgrade:**
- 1,000+ daily active users
- Need for real-time portfolio data
- Advanced wallet analytics required

### 2. RWA.xyz API
**Purpose:** Real-world asset data (Module 5)
**Cost:** $50-100/month
**Documentation:** https://rwa.xyz/docs

**Features:**
- Curated RWA vault data
- KYC/jurisdiction information
- Yield tracking
- Issuer verification

**When to Upgrade:**
- RWA module gains traction
- Need for verified RWA data
- Compliance requirements

### 3. DeFiLlama Pro
**Purpose:** Priority access, more data
**Cost:** $50-100/month
**Documentation:** https://defillama.com/pro

**Features:**
- Priority API access
- Historical data
- Advanced analytics
- Custom endpoints

**When to Upgrade:**
- Free tier rate limits hit
- Need for historical APY data
- Advanced yield analytics required

### 4. Alchemy Growth
**Purpose:** Higher compute units
**Cost:** $49/month (40M CU) or $199/month (150M CU)
**Documentation:** https://www.alchemy.com/pricing

**When to Upgrade:**
- 500+ daily active users
- Free tier compute units exhausted
- Need for faster response times

---

## Cost Optimization Strategies

### 1. Aggressive Caching
- Wallet signals: 5-minute cache
- Eligibility results: 24-hour cache
- DeFiLlama pools: 30-minute cache
- Reduces API calls by 90%

### 2. Preselection
- Compute eligibility for top 50 candidates only
- Preselect by hybrid score: (trust_score * 0.7 + recency_boost * 0.3)
- Reduces wallet signal calls by 80%

### 3. Batching
- Batch RPC calls where possible
- Use multicall contracts
- Reduces API calls by 50%

### 4. Graceful Degradation
- Return null signals if RPC unavailable
- Use cached data on API failures
- Continue with partial data

### 5. Rate Limiting
- Limit eligibility computation to authenticated users
- Throttle sync jobs to off-peak hours
- Implement exponential backoff

---

## API Key Management

### Environment Variables
```bash
# Phase 1 (Required)
DEFILLAMA_API_URL=https://yields.llama.fi
ALCHEMY_TRANSFERS_API_KEY=your_key
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
CRON_SECRET=your_random_secret

# Phase 2 (Optional)
LAYER3_API_KEY=your_key
GALXE_API_KEY=your_key
ZEALY_API_KEY=your_key
QUESTN_API_KEY=your_key

# Phase 3 (Optional)
DEBANK_API_KEY=your_key
RWA_API_KEY=your_key
DEFILLAMA_PRO_API_KEY=your_key
```

### Security Best Practices
- Never commit .env to git
- Use Vercel environment variables for production
- Rotate keys quarterly
- Monitor API usage daily
- Set up alerts for rate limit warnings

---

## Monitoring & Alerts

### Metrics to Track
- API call count per endpoint
- API response times
- API error rates
- Cache hit rates
- Compute unit usage (Alchemy)
- Database storage usage (Supabase)

### Alert Thresholds
- API response time > 2 seconds
- API error rate > 5%
- Cache hit rate < 80%
- Alchemy CU usage > 80% of free tier
- Supabase storage > 400MB (80% of free tier)

### Monitoring Tools
- Vercel Analytics (built-in)
- Supabase Dashboard (built-in)
- Alchemy Dashboard (built-in)
- Custom logging in Edge Functions

---

## Timeline & Milestones

### Week 1-2: Phase 1 Implementation
- [ ] Configure DeFiLlama (0 minutes)
- [ ] Get Alchemy API keys (5 minutes)
- [ ] Verify Supabase setup (5 minutes)
- [ ] Generate CRON_SECRET (2 minutes)
- [ ] Create admin seed scripts (15 minutes)
- [ ] Run seed scripts (5 minutes)
- [ ] Configure Vercel cron jobs (10 minutes)
- [ ] Test all APIs (15 minutes)
- **Total: ~1 hour**

### Month 2-3: Phase 2 Partnerships
- [ ] Reach out to Layer3 BD team
- [ ] Reach out to Galxe BD team
- [ ] Reach out to Zealy BD team
- [ ] Reach out to QuestN BD team
- [ ] Negotiate partnership terms
- [ ] Integrate APIs (if approved)
- **Total: 4-6 weeks**

### Month 4+: Phase 3 Scale
- [ ] Monitor Phase 1 API usage
- [ ] Evaluate need for premium tiers
- [ ] Upgrade Alchemy if needed
- [ ] Add DeBank if needed
- [ ] Add RWA.xyz if needed
- **Total: Ongoing**

---

## Summary

**Phase 1 (MVP):**
- Cost: $0/month
- APIs: DeFiLlama, Alchemy, Supabase, Admin Seeds
- Timeline: Week 1-2
- Status: Ready to implement

**Phase 2 (Enhanced):**
- Cost: $0-100/month
- APIs: Layer3, Galxe, Zealy, QuestN
- Timeline: Month 2-3
- Status: Pending partnerships

**Phase 3 (Scale):**
- Cost: $100-500/month
- APIs: DeBank, RWA.xyz, DeFiLlama Pro, Alchemy Growth
- Timeline: Month 4+
- Status: Optional for scale

**Total Annual Cost:**
- Year 1: $0-1,200 ($0-100/month average)
- Year 2+: $1,200-6,000 ($100-500/month average)

**Cost per User (at scale):**
- 1,000 users: $0.10-0.50/user/month
- 10,000 users: $0.01-0.05/user/month
- 100,000 users: $0.001-0.005/user/month

This phased approach allows us to launch quickly with zero costs, validate product-market fit, then scale with premium APIs as revenue grows.
