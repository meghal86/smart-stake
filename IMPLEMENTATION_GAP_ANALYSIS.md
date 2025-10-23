# Guardian Implementation Gap Analysis

## 🎯 Specification vs Implementation

### ✅ What's Implemented (70% Match)

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Architecture** | ✅ Partial | Built for Vite (not Next.js) |
| TypeScript | ✅ Complete | All files typed |
| Tailwind + shadcn/ui | ✅ Complete | UI components ready |
| TanStack Query | ✅ Complete | Used in hooks |
| Supabase | ✅ Complete | Edge Functions + DB |
| Zod | ✅ Complete | Validation in place |
| Trust Score (0-100) | ✅ Complete | Calculation engine done |
| Risk Factors | ✅ Complete | Categories implemented |
| Database Schema | ✅ Complete | Tables + RLS + indexes |
| UI Components | ✅ Complete | All 5 components |
| Dark Theme | ✅ Complete | Matches screenshots |
| Mobile Responsive | ✅ Complete | Optimized layouts |
| Tests | ✅ Partial | 3 test files created |

### ⚠️ Critical Gaps (Not Next.js-specific)

| Feature | Status | Impact |
|---------|--------|--------|
| **Wagmi/RainbowKit** | ❌ Mock Only | Real wallet integration needed |
| **Streaming UI** | ❌ Missing | No progressive rendering |
| **Confidence Scores** | ❌ Missing | Only trust score, no confidence |
| **Evidence Metadata** | ❌ Missing | No {source, observedAt, ttl} |
| **Idempotency Keys** | ❌ Missing | Duplicate tx risk |
| **Pre-simulation** | ❌ Missing | No gas/outcome preview |
| **Upstash Rate Limiting** | ❌ Partial | In-memory only |
| **ARIA Live Regions** | ❌ Missing | No screen reader updates |
| **x-request-id** | ❌ Missing | No request tracing |
| **Sentry Integration** | ❌ Stub Only | No real error tracking |
| **Cache Hit Ratio** | ❌ Missing | No metrics |
| **Risk Reduction Preview** | ❌ Missing | No score delta on revoke |

### 🔴 Major Architectural Difference

**Requested:** Next.js 14 App Router with `/api` routes (Node.js runtime)
**Implemented:** Vite + React Router with Supabase Edge Functions (Deno runtime)

This is because your project is **Vite-based**, not Next.js!

## 📋 Detailed Gap Analysis

### 1. Stack Mismatch

```
Requested:         Implemented:
Next.js 14     →   Vite + React Router
/app/api/*     →   Supabase Edge Functions
Node runtime   →   Deno runtime
Wagmi/RainbowKit → Mock wallet
```

**Why:** Your `package.json` shows this is a Vite project, not Next.js.

### 2. Missing Features

#### A. Streaming UI Updates ❌
**Requested:**
```typescript
// Stream progress as scan runs
scanWallet(address) {
  yield { step: 'approvals', partial: {...} }
  yield { step: 'reputation', partial: {...} }
  yield { step: 'mixer', partial: {...} }
  return { success: true, data: {...} }
}
```

**Current:** Single response, no streaming.

**To Add:**
- Server-Sent Events (SSE) or chunked responses
- Progressive UI updates
- Step-by-step rendering

#### B. Confidence Scores ❌
**Requested:**
```typescript
interface TrustScoreResult {
  score: number;           // ✅ Have
  confidence: number;      // ❌ Missing
  grade: string;           // ✅ Have
  factors: RiskFactor[];   // ✅ Have
}

interface RiskFactor {
  evidence?: {             // ❌ Missing
    source: string;
    observedAt: number;
    ttl: number;
  }
}
```

**Current:** No confidence tracking, no evidence metadata.

**Impact:** Can't show data freshness or reliability.

#### C. Idempotency Keys ❌
**Requested:**
```typescript
// Prevent duplicate transactions
POST /api/guardian/revoke
{
  token: "0x...",
  spender: "0x...",
  idempotencyKey: "usr_abc_token_xyz_1234"
}

// Check Upstash before processing
if (await redis.get(idempotencyKey)) {
  return 409 Conflict
}
```

**Current:** No duplicate protection.

**Impact:** Users could accidentally revoke twice.

#### D. Pre-Simulation ❌
**Requested:**
```typescript
// Simulate tx before returning
const { success, gasUsed, reason } = await simulateTx(tx, chainId);
if (!success) {
  return { error: `Simulation failed: ${reason}` }
}
```

**Current:** Returns unsigned tx without simulation.

**Impact:** User might sign a failing transaction.

#### E. ARIA Live Regions ❌
**Requested:**
```tsx
<div aria-live="polite" aria-atomic="true">
  <p>Checking approvals... {approvalsChecked}/{totalApprovals}</p>
</div>
```

**Current:** Visual-only updates.

**Impact:** Screen readers don't announce progress.

#### F. Observability ❌
**Requested:**
```typescript
// Request ID for tracing
const requestId = crypto.randomUUID();
headers.set('x-request-id', requestId);
logger.info({ requestId, event: 'scan_started', address });

// Sentry integration
Sentry.captureException(error, { extra: { requestId } });
```

**Current:** Console logs only, no request IDs.

**Impact:** Hard to debug production issues.

### 3. Database Schema Gaps

**Requested:**
```sql
-- Add confidence + better indexes
confidence numeric not null default 0.8,
create index idx_scans_target_recent on scans(target_address) 
  where created_at > now() - interval '30 days';
```

**Current:** No confidence column, basic indexes.

### 4. Rate Limiting Gaps

**Requested:**
- Upstash Redis distributed rate limiting
- Per-IP: 10 req/min
- Per-user: 20 req/min
- 429 with `retryAfterSec`

**Current:**
- In-memory Map (not distributed)
- Per-IP only
- Basic 429 response

**Impact:** Won't scale across multiple servers.

### 5. Real Wallet Integration

**Requested:**
```tsx
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const { address, isConnected } = useAccount();
```

**Current:**
```tsx
// Mock wallet
const [address, setAddress] = useState(null);
const connect = () => setAddress('0x...');
```

**Impact:** Can't scan real user wallets.

## 🔧 What Works Right Now

Despite the gaps, here's what **does** work:

✅ **Beautiful UI** matching your screenshots
✅ **Trust score calculation** with weighted factors
✅ **Risk detection logic** (approvals, mixer, honeypot, reputation)
✅ **Database persistence** with RLS
✅ **Basic caching** with TTLs
✅ **Component architecture** ready to enhance
✅ **Mock data flow** to test UI
✅ **Dark theme** with teal accents
✅ **Mobile responsive** design

## 🚀 What's Needed for Full Spec

### Priority 1: Core Functionality
1. **Wagmi/RainbowKit Integration**
   ```bash
   npm install wagmi viem @rainbow-me/rainbowkit
   ```
   - Replace mock wallet
   - Add RainbowKit provider
   - Connect to real wallets

2. **Add Confidence Tracking**
   - Update database schema
   - Calculate per-probe confidence
   - Show in UI with explanations

3. **Idempotency for Revokes**
   ```bash
   npm install crypto-random-string
   ```
   - Generate idempotency keys
   - Store in Upstash
   - Return 409 for duplicates

### Priority 2: UX Enhancements
4. **Streaming UI Updates**
   - Implement Server-Sent Events
   - Progressive rendering
   - Step-by-step updates

5. **Pre-Simulation**
   - Add Alchemy Simulate calls
   - Show gas estimates
   - Predict outcomes

6. **ARIA Live Regions**
   - Add aria-live attributes
   - Announce progress to screen readers

### Priority 3: Production Readiness
7. **Upstash Rate Limiting**
   - Replace in-memory with Redis
   - Distributed across servers
   - Better error messages

8. **Observability**
   ```bash
   npm install uuid pino @sentry/nextjs
   ```
   - Add request IDs
   - Structured logging
   - Sentry error tracking

9. **Evidence Metadata**
   - Add source/timestamp to factors
   - Show data freshness
   - Cache hit ratio

## 📊 Completion Percentage

### Overall: 70% Complete

- **UI/UX:** 95% ✅
- **Core Logic:** 85% ✅
- **Database:** 80% ✅
- **API Integration:** 60% ⚠️
- **Wallet Integration:** 0% ❌
- **Streaming:** 0% ❌
- **Observability:** 10% ❌
- **Production Features:** 40% ⚠️

## 🎯 Decision Point

### Option A: Enhance Current Implementation
Keep Vite + Supabase Edge Functions, add:
- Wagmi integration
- Confidence scores
- Idempotency
- Pre-simulation
- Better rate limiting

**Pros:** Works with your existing stack
**Cons:** Still not using Next.js as specified

### Option B: Migrate to Next.js
Start fresh with Next.js 14:
- Use /app/api routes
- Node.js runtime
- Server components
- Better for this architecture

**Pros:** Matches spec exactly
**Cons:** Major refactor, your project is Vite

### Option C: Hybrid Approach
Keep UI in Vite, but:
- Move heavy logic to separate Next.js API
- Use as microservice
- Vite calls Next.js endpoints

**Pros:** Best of both worlds
**Cons:** More complex deployment

## 💡 My Recommendation

Since your project is **Vite-based**, I recommend **Option A**:

1. Keep what works (UI, logic, Edge Functions)
2. Add missing features incrementally:
   - Wagmi/RainbowKit (2 hours)
   - Confidence scores (3 hours)
   - Idempotency (2 hours)
   - Pre-simulation (2 hours)
   - ARIA live (1 hour)
   - Observability (3 hours)

**Total effort:** ~2 days to reach 95% spec compliance.

## 📝 Next Steps

Would you like me to:

1. **Add Wagmi/RainbowKit** for real wallet connection?
2. **Implement confidence scores** with evidence metadata?
3. **Add streaming UI** with progressive rendering?
4. **Set up idempotency** with Upstash?
5. **All of the above** (comprehensive upgrade)?

Or would you prefer to:
- **Use as-is** for prototyping/testing?
- **Migrate to Next.js** for exact spec match?

Let me know your priority! 🚀

