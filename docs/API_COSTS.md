# Hunter Demand-Side: API Costs & Phased Roadmap

## Executive Summary

The Hunter Demand-Side system implements a **phased API strategy** to minimize costs while delivering value across all 7 opportunity modules. This document provides detailed cost breakdowns, usage projections, and optimization strategies.

**Total Cost Summary:**
- **Phase 1 (MVP):** $0/month - Launch all 7 modules with zero external API costs
- **Phase 2 (Enhanced):** $0-100/month - Replace admin seeds with real APIs via partnerships
- **Phase 3 (Scale):** $100-500/month - Scale to thousands of users with premium data

---

## Phase 1: MVP ($0/month)

### Timeline
**Week 1-2** - Immediate implementation

### APIs

#### 1. DeFiLlama (Yield/Staking Data)
- **Cost:** FREE forever
- **Rate Limit:** 100 requests/minute
- **Usage:** 12 calls/day (every 2 hours)
- **Monthly:** 360 calls, ~720MB data
- **Headroom:** 12,000x (well within limits)
- **Documentation:** https://defillama.com/docs/api

#### 2. Alchemy (Wallet Signals)
- **Cost:** FREE tier (30M compute units/month)
- **Rate Limit:** ~25 requests/second
- **Usage per wallet:** 3 RPC calls (50 CU)
- **Daily active users:** 100
- **Daily usage:** 5,000 CU
- **Monthly:** 150,000 CU (with 5min cache: ~15,000 CU)
- **Headroom:** 200x
- **Documentation:** https://docs.alchemy.com/

**Compute Unit Breakdown:**
- `eth_getTransactionCount`: 10 CU
- `eth_getBalance`: 10 CU
- Asset Transfers API: 30 CU
- **Total per wallet:** 50 CU

**Caching Strategy:**
- Wallet signals cached 5 minutes
- Reduces API calls by 90%
- Actual monthly usage: ~15,000 CU

#### 3. Supabase (Database)
- **Cost:** FREE tier (500MB database, 2GB bandwidth)
- **Usage:** ~100MB (opportunities + cache + user data)
- **Headroom:** 5x
- **Documentation:** https://supabase.com/docs

**Storage Breakdown:**
- Opportunities table: ~50-100MB
- User data: ~10-20MB
- Eligibility cache: ~20-30MB
- **Total:** ~100MB

#### 4. Admin Seed Scripts (Airdrops, Quests, Points, RWA)
- **Cost:** $0 (manual curation)
- **Maintenance:** Weekly updates (~1 hour/week)
- **Data sources:** Twitter/X, Discord, crypto news
- **Seed data:** 40-60 opportunities total

### Phase 1 Total Cost
**$0/month** ✅

---

## Phase 2: Enhanced Data ($0-100/month)

### Timeline
**Month 2-3** - Partnership negotiations

### APIs

#### 1. Layer3 API (Quest Data)
- **Cost:** Partnership (target: $0-50/month)
- **Strategy:** Mutual benefit - we drive users to their quests
- **Fallback:** Continue with admin seeds
- **Documentation:** https://layer3.xyz/docs

**Partnership Pitch:**
- AlphaWhale drives qualified users to Layer3 quests
- Revenue share or free tier access
- Mutual growth opportunity

#### 2. Galxe API (Campaign/Quest Data)
- **Cost:** Partnership (target: $0-50/month)
- **Strategy:** Public GraphQL API available
- **Fallback:** Use public API with rate limiting
- **Documentation:** https://docs.galxe.com/

**Implementation:**
- GraphQL: `query { campaigns { ... } }`
- May not require partnership for read-only access
- Rate limiting: 100 req/hour

#### 3. Zealy API (Community Quest Data)
- **Cost:** Partnership (target: $0-50/month)
- **Strategy:** Community engagement focus
- **Fallback:** Continue with admin seeds
- **Documentation:** https://zealy.io/docs

#### 4. QuestN API (Quest Aggregation)
- **Cost:** Partnership (target: $0-50/month)
- **Strategy:** Single API for multiple quest sources
- **Fallback:** Continue with admin seeds
- **Documentation:** https://questn.com/docs

### Phase 2 Total Cost
**$0-100/month** (partnership negotiations)

### Partnership Strategy

**Outreach Plan:**
1. Identify BD contacts at each platform
2. Prepare partnership deck highlighting mutual benefits
3. Propose pilot program (3-month trial)
4. Negotiate terms (free tier or revenue share)
5. Integrate APIs if approved

**Timeline:**
- Week 1-2: Outreach and initial meetings
- Week 3-4: Proposal and negotiation
- Week 5-8: Integration (if approved)

---

## Phase 3: Scale & Premium ($100-500/month)

### Timeline
**Month 4+** - Scale to thousands of users

### APIs

#### 1. DeBank API (Enhanced Wallet Analytics)
- **Cost:** $100-200/month (Pro tier)
- **Features:** Comprehensive wallet history, multi-chain portfolio, DeFi positions, NFT holdings
- **When to upgrade:** 1,000+ daily active users
- **Documentation:** https://docs.cloud.debank.com/

**Upgrade Triggers:**
- Daily active users > 1,000
- Need for real-time portfolio data
- Advanced wallet analytics required

#### 2. RWA.xyz API (Real-World Asset Data)
- **Cost:** $50-100/month
- **Features:** Curated RWA vault data, KYC/jurisdiction info, yield tracking, issuer verification
- **When to upgrade:** RWA module gains traction
- **Documentation:** https://rwa.xyz/docs

**Upgrade Triggers:**
- RWA module has 100+ active users
- Need for verified RWA data
- Compliance requirements

#### 3. DeFiLlama Pro (Priority Access)
- **Cost:** $50-100/month
- **Features:** Priority API access, historical data, advanced analytics, custom endpoints
- **When to upgrade:** Free tier rate limits hit
- **Documentation:** https://defillama.com/pro

**Upgrade Triggers:**
- Free tier rate limits hit (100 req/min)
- Need for historical APY data
- Advanced yield analytics required

#### 4. Alchemy Growth (Higher Compute Units)
- **Cost:** $49/month (40M CU) or $199/month (150M CU)
- **When to upgrade:** 500+ daily active users
- **Documentation:** https://www.alchemy.com/pricing

**Upgrade Triggers:**
- Free tier compute units exhausted (30M CU/month)
- Daily active users > 500
- Need for faster response times

### Phase 3 Total Cost
**$100-500/month** (scale-dependent)

---

## Cost Optimization Strategies

### 1. Aggressive Caching
**Impact:** Reduces API calls by 90%

- **Wallet signals:** 5-minute cache
- **Eligibility results:** 24-hour cache
- **DeFiLlama pools:** 30-minute cache
- **Implementation:** In-memory LRU cache + database cache

**Example:**
```typescript
// Without cache: 100 users × 3 RPC calls = 300 calls/min
// With 5min cache: 100 users × 3 RPC calls / 5 = 60 calls/min
// Reduction: 80%
```

### 2. Preselection
**Impact:** Reduces wallet signal calls by 80%

- Compute eligibility for top 50 candidates only
- Preselect by hybrid score: `(trust_score * 0.7 + recency_boost * 0.3)`
- Avoids unnecessary RPC calls for low-relevance opportunities

**Example:**
```typescript
// Without preselection: 100 opportunities × 50 CU = 5,000 CU
// With preselection: 50 opportunities × 50 CU = 2,500 CU
// Reduction: 50%
```

### 3. Batching
**Impact:** Reduces API calls by 50%

- Batch RPC calls where possible
- Use multicall contracts
- Aggregate requests

**Example:**
```typescript
// Without batching: 3 separate RPC calls
// With batching: 1 multicall with 3 operations
// Reduction: 66%
```

### 4. Graceful Degradation
**Impact:** Maintains functionality during API failures

- Return null signals if RPC unavailable
- Use cached data on API failures
- Continue with partial data

**Example:**
```typescript
if (!alchemyRpcUrl) {
  return { wallet_age_days: null, tx_count_90d: null };
}
```

### 5. Rate Limiting
**Impact:** Prevents abuse and controls costs

- Limit eligibility computation to authenticated users
- Throttle sync jobs to off-peak hours
- Implement exponential backoff

**Example:**
```typescript
// Sync jobs run every 2 hours (off-peak)
// Exponential backoff: 1s, 2s, 4s, 8s
```

---

## Cost Projections

### User Growth Scenarios

#### Scenario 1: Conservative Growth
- **Month 1:** 100 daily active users
- **Month 3:** 500 daily active users
- **Month 6:** 1,000 daily active users
- **Month 12:** 2,500 daily active users

**Cost Projection:**
- **Month 1-2:** $0/month (Phase 1)
- **Month 3-6:** $0-50/month (Phase 2 partnerships)
- **Month 7-12:** $100-200/month (Phase 3 - Alchemy Growth + DeBank)

**Annual Cost:** $600-1,200

#### Scenario 2: Aggressive Growth
- **Month 1:** 500 daily active users
- **Month 3:** 2,000 daily active users
- **Month 6:** 5,000 daily active users
- **Month 12:** 10,000 daily active users

**Cost Projection:**
- **Month 1-2:** $0/month (Phase 1)
- **Month 3-6:** $50-100/month (Phase 2 partnerships)
- **Month 7-12:** $300-500/month (Phase 3 - All premium tiers)

**Annual Cost:** $1,800-3,600

### Cost per User

**At 1,000 users:**
- Phase 1: $0/user/month
- Phase 2: $0.05-0.10/user/month
- Phase 3: $0.10-0.50/user/month

**At 10,000 users:**
- Phase 1: $0/user/month
- Phase 2: $0.005-0.01/user/month
- Phase 3: $0.01-0.05/user/month

**At 100,000 users:**
- Phase 1: $0/user/month
- Phase 2: $0.0005-0.001/user/month
- Phase 3: $0.001-0.005/user/month

---

## Monitoring & Alerts

### Metrics to Track

1. **API Call Count**
   - DeFiLlama: calls/day
   - Alchemy: compute units/day
   - Supabase: queries/day

2. **API Response Times**
   - Target: < 2 seconds
   - Alert: > 2 seconds

3. **API Error Rates**
   - Target: < 1%
   - Alert: > 5%

4. **Cache Hit Rates**
   - Target: > 80%
   - Alert: < 80%

5. **Compute Unit Usage (Alchemy)**
   - Target: < 80% of free tier
   - Alert: > 80% of free tier

6. **Database Storage (Supabase)**
   - Target: < 400MB (80% of free tier)
   - Alert: > 400MB

### Alert Thresholds

```typescript
const ALERT_THRESHOLDS = {
  apiResponseTime: 2000, // ms
  apiErrorRate: 0.05, // 5%
  cacheHitRate: 0.80, // 80%
  alchemyCUUsage: 0.80, // 80% of 30M
  supabaseStorage: 400, // MB
};
```

### Monitoring Tools

- **Vercel Analytics:** Built-in (free)
- **Supabase Dashboard:** Built-in (free)
- **Alchemy Dashboard:** Built-in (free)
- **Custom Logging:** Edge Functions

---

## Cost Control Checklist

### Before Launch
- [ ] Implement aggressive caching (5min wallet signals, 24h eligibility)
- [ ] Implement preselection (top 50 candidates only)
- [ ] Implement graceful degradation (null signals if RPC unavailable)
- [ ] Set up monitoring and alerts
- [ ] Test with 100 users to validate cost projections

### Monthly Review
- [ ] Review API usage dashboards
- [ ] Check cache hit rates (target: > 80%)
- [ ] Monitor compute unit usage (target: < 80% of free tier)
- [ ] Evaluate need for Phase 2/3 upgrades
- [ ] Optimize slow queries

### Quarterly Review
- [ ] Evaluate partnership opportunities
- [ ] Review cost per user metrics
- [ ] Assess need for premium tiers
- [ ] Optimize caching strategies
- [ ] Plan for next phase

---

## Summary

**Phase 1 (MVP):**
- **Cost:** $0/month
- **Timeline:** Week 1-2
- **Status:** Ready to implement
- **APIs:** DeFiLlama, Alchemy, Supabase, Admin Seeds

**Phase 2 (Enhanced):**
- **Cost:** $0-100/month
- **Timeline:** Month 2-3
- **Status:** Pending partnerships
- **APIs:** Layer3, Galxe, Zealy, QuestN

**Phase 3 (Scale):**
- **Cost:** $100-500/month
- **Timeline:** Month 4+
- **Status:** Optional for scale
- **APIs:** DeBank, RWA.xyz, DeFiLlama Pro, Alchemy Growth

**Total Annual Cost:**
- **Year 1:** $0-1,200 ($0-100/month average)
- **Year 2+:** $1,200-6,000 ($100-500/month average)

**Cost per User (at scale):**
- **1,000 users:** $0.10-0.50/user/month
- **10,000 users:** $0.01-0.05/user/month
- **100,000 users:** $0.001-0.005/user/month

This phased approach allows us to:
1. **Launch quickly** with zero costs
2. **Validate product-market fit** before spending
3. **Scale efficiently** as revenue grows
4. **Maintain profitability** at all stages
