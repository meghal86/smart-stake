# Hunter Architecture Clarification

> **⚠️ PRIORITY NOTICE**  
> This file has higher priority than any older design docs.  
> If `design.md` or code examples conflict with this, **this architecture wins**.

**Date:** November 2025  
**Status:** CRITICAL - Architecture Rule Enforcement

## The Golden Rule

**ALL business logic MUST live in Supabase Edge Functions (`supabase/functions/*`)**

**UI (Next.js/React) is PRESENTATION ONLY**

## What This Means in Practice

### ❌ WRONG: Business Logic in Next.js App

```
src/
├── lib/
│   └── hunter/
│       ├── ranking.ts          ❌ NO - ranking logic
│       ├── eligibility.ts      ❌ NO - scoring logic
│       ├── solver.ts           ❌ NO - solver orchestration
│       └── policy.ts           ❌ NO - regulatory logic
└── app/
    └── api/
        └── hunter/
            └── opportunities/
                └── route.ts    ❌ NO - DB queries + ranking
```

### ✅ CORRECT: Business Logic in Edge Functions

```
supabase/functions/
├── hunter-feed/
│   ├── index.ts                ✅ YES - main handler
│   └── lib/
│       ├── ranking.ts          ✅ YES - ranking logic HERE
│       ├── policy.ts           ✅ YES - regulatory logic HERE
│       └── safety.ts           ✅ YES - safety mode HERE
├── hunter-eligibility-preview/
│   ├── index.ts                ✅ YES - main handler
│   └── lib/
│       └── scorer.ts           ✅ YES - scoring logic HERE
└── hunter-intent-quote/
    ├── index.ts                ✅ YES - main handler
    └── lib/
        ├── orchestrator.ts     ✅ YES - solver logic HERE
        └── solvers/
            ├── lifi.ts         ✅ YES
            ├── oneinch.ts      ✅ YES
            └── cowswap.ts      ✅ YES
```

## Architecture Layers

### Layer 1: Client (Next.js/React)

**ALLOWED:**
- Render UI components
- Manage local UI state (open/closed, selected tab, loading)
- Call Edge Functions via `supabase.functions.invoke()`
- Display data returned from Edge Functions
- Light formatting (truncate address, format dates)

**FORBIDDEN:**
- Database queries
- Ranking/sorting logic
- Eligibility scoring
- Trust calculations
- Policy evaluation
- Solver orchestration
- Surplus calculations
- Any DeFi API calls

### Layer 2: Next.js API Routes (Optional Thin Proxy)

**ALLOWED:**
- Validate request with Zod
- Call Edge Function via `supabase.functions.invoke()`
- Add cache headers
- Return response

**FORBIDDEN:**
- Everything from Layer 1 "FORBIDDEN" list
- Direct database access
- Any business logic

**Example:**
```typescript
// app/api/hunter/opportunities/route.ts
export async function GET(req: NextRequest) {
  // 1. Validate only
  const params = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  
  // 2. Call Edge Function (all logic there)
  const { data, error } = await supabase.functions.invoke('hunter-feed', {
    body: params
  });
  
  // 3. Return with headers
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'max-age=60' }
  });
}
```

### Layer 3: Supabase Edge Functions (Business Logic)

**THIS IS WHERE EVERYTHING LIVES:**
- All ranking logic
- All eligibility scoring
- All policy evaluation
- All solver orchestration
- All surplus calculations
- All Guardian integration
- All threat monitoring
- All Sentinel evaluation
- All database queries
- All external API calls (Li.Fi, DeFiLlama, Hypernative, etc.)

## Mapping: Requirements → Edge Functions

| Requirement | Edge Function | What It Does |
|-------------|---------------|--------------|
| Feed Ranking (Req 3) | `hunter-feed` | Ranking, trust filtering, policy, safety mode |
| Eligibility (Req 6) | `hunter-eligibility-preview` | Scoring algorithm, cache writes |
| Intent Execution (Req 27) | `hunter-intent-quote`<br>`hunter-intent-execute` | Solver orchestration, surplus calc |
| Ranking Safety (Req 24) | `ranking-safety` (cron)<br>Used by `hunter-feed` | Metrics monitoring, safety mode |
| Regulatory Policy (Req 25) | Used by `hunter-feed` | Geo filtering, compliance |
| Guardian Liability (Req 26) | `guardian-liability` | Verification, staking logic |
| Sentinel Agents (Req 28) | `hunter-sentinel-monitor` (cron) | Trigger evaluation, exits |
| ZK Eligibility (Req 29) | `zk-eligibility-verify` | Proof verification |
| Threat Alerts (Req 30) | `hunter-threat-monitor` (cron) | Circuit breakers, pausing |
| Surplus Capture (Req 31) | Used by `hunter-intent-execute` | Surplus calc, reputation |
| Paymaster (Req 32) | `paymaster-orchestrator` | Gas abstraction, sponsorship |
| Emergency Exit (Req 33) | `emergency-exit-info` | Contract info, instructions |

## Feed Query Pipeline (Inside `hunter-feed` Edge Function)

```
User Request
  ↓
[Edge Function: hunter-feed]
  ↓
1. Parse & Validate Filters
  ↓
2. Get User Region (from IP/headers)
  ↓
3. Apply Regulatory Policy Engine
   - Load policy rules from DB
   - Filter opportunities by region
   - Mark restricted items
  ↓
4. Check Ranking Safety Mode
   - Query safety_mode config
   - If active, override to safe sort
  ↓
5. Build SQL Query
   - Apply trust filters
   - Apply personalization (if wallet)
   - Apply cursor pagination
   - Execute ranked query
  ↓
6. Return OpportunitiesResponse
  ↓
[Back to Client]
```

## Client Data Flow

```typescript
// ✅ CORRECT: Client calls Edge Function

// In OpportunityCard.tsx
const { data: eligibility } = useQuery({
  queryKey: ['eligibility', opportunityId, activeWallet],
  enabled: !!activeWallet,
  queryFn: async () => {
    const supabase = createClient(...);
    const { data } = await supabase.functions.invoke(
      'hunter-eligibility-preview',
      { body: { walletAddress: activeWallet, opportunityId } }
    );
    return data; // Just display it
  },
});

// ❌ WRONG: Client does scoring
const eligibility = calculateEligibilityScore(signals); // NO!
```

## Design Document Interpretation

When reading `design.md`, interpret code examples as follows:

**If you see:**
```typescript
// lib/eligibility.ts
export function calculateEligibilityScore(signals) { ... }
```

**It actually means:**
```typescript
// supabase/functions/hunter-eligibility-preview/lib/scorer.ts
export function calculateEligibilityScore(signals) { ... }
```

**NOT:**
```typescript
// src/lib/eligibility.ts  ❌ WRONG LOCATION
```

## Quick Checklist for Any Code

Ask yourself:

1. **Does this code hit Postgres?** → Edge Function
2. **Does this code call DeFi APIs?** → Edge Function
3. **Does this code compute trust/ranking/eligibility?** → Edge Function
4. **Does this code make policy decisions?** → Edge Function
5. **Does this code calculate surplus/reputation?** → Edge Function
6. **Does this code render JSX?** → Next.js App (OK)
7. **Does this code manage UI state?** → Next.js App (OK)
8. **Does this code call `supabase.functions.invoke()`?** → Next.js App (OK)

## Summary

The design document shows the **logic and algorithms** that need to be implemented.

The **location** of that logic is:
- **Edge Functions** for all business logic
- **Next.js App** for presentation only

When implementing, all the TypeScript classes and functions shown in design.md for ranking, eligibility, solvers, policy, etc. should be created in `supabase/functions/*/lib/` directories, NOT in `src/lib/`.

---

**This is non-negotiable for AlphaWhale architecture.**
