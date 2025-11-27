# Hunter Design Document - Architecture Alignment Complete

## Summary

The Hunter `design.md` has been updated to be 100% compliant with `ARCHITECTURE_CLARIFICATION.md`. All business logic is now explicitly documented as living in Supabase Edge Functions, not Next.js app code.

## Changes Made

### 1. Priority Notice Added (Top of Document)

Added a prominent notice at the beginning of `design.md`:

```markdown
> **⚠️ ARCHITECTURE PRIORITY NOTICE**  
> This file follows the **Hunter Architecture Clarification** (ARCHITECTURE_CLARIFICATION.md).  
> **If any code examples in this document conflict with the architecture rules, the architecture document wins.**  
> 
> **Key Rule:** All business logic (ranking, eligibility scoring, solver orchestration, regulatory policy, surplus calculation, sentinel evaluation, etc.) is implemented in **Supabase Edge Functions** under `supabase/functions/*`.  
> Any `lib/*.ts` examples in this doc should be interpreted as **Edge Function internal modules**, NOT Next.js app code.
```

### 2. Location Tags Added Throughout

Every major implementation section now has explicit **LOCATION** tags:

#### Core Feed Logic
- **Eligibility Scoring**: `supabase/functions/hunter-eligibility-preview/lib/eligibility-scorer.ts`
- **Feed API**: `app/api/hunter/opportunities/route.ts` (thin proxy) → calls `hunter-feed` Edge Function

#### v2 Features
- **Ranking Safety**: `supabase/functions/ranking-safety/` (cron) + `supabase/functions/hunter-feed/lib/ranking-safety.ts`
- **Regulatory Policy**: `supabase/functions/hunter-feed/lib/regulatory-policy.ts`
- **Guardian Liability**: Smart contracts + Edge Function integration
- **Intent Execution**: `supabase/functions/hunter-intent-quote/` and `supabase/functions/hunter-intent-execute/`
- **Threat Monitoring**: `supabase/functions/hunter-threat-monitor/`

#### v3 Features
- **Sentinel Agents**: `supabase/functions/hunter-sentinel-monitor/`
- **ZK Eligibility**: Client generates proofs → `supabase/functions/zk-eligibility-verify/` verifies

### 3. Architecture Notes Added

Each section now includes explicit architecture notes like:

- "All ranking safety logic lives in Edge Functions. UI never sees or manipulates safety state."
- "Policy evaluation happens inside the `hunter-feed` Edge Function. Next.js never performs policy filtering."
- "All solver orchestration, quote aggregation, and execution logic lives in Edge Functions."
- "All monitoring and trigger evaluation happens in Edge Functions. UI only reads tables for display."

### 4. Code Examples Updated

The Feed API example was updated to show the correct pattern:

**BEFORE (Wrong):**
```typescript
const data = await getFeedPage(parsed.data);
```

**AFTER (Correct):**
```typescript
// Call Edge Function (where ALL business logic lives)
const { data, error } = await supabase.functions.invoke('hunter-feed', {
  body: parsed.data
});
```

## How to Use This Going Forward

### When Reading design.md

1. **Always remember**: Any `lib/*.ts` path mentioned = Edge Function internal module
2. **Next.js routes** = Thin proxies that only validate + forward to Edge Functions
3. **UI components** = Presentation only, no business logic

### When Implementing

1. **Start with Edge Functions**: Implement all logic in `supabase/functions/*` first
2. **Then add Next.js proxy**: Create thin API route that calls Edge Function
3. **Finally add UI**: Build React components that call the API

### Example Flow

**Implementing Eligibility Preview:**

1. ✅ Create `supabase/functions/hunter-eligibility-preview/index.ts`
   - Contains scoring algorithm
   - Queries database
   - Returns eligibility result

2. ✅ Create `app/api/hunter/eligibility/preview/route.ts` (optional)
   - Validates request with Zod
   - Calls `supabase.functions.invoke('hunter-eligibility-preview', ...)`
   - Returns response with cache headers

3. ✅ Create `src/components/hunter/EligibilityBadge.tsx`
   - Calls API via React Query
   - Displays result
   - No scoring logic

## Verification Checklist

- [x] Priority notice added to top of design.md
- [x] All major sections have LOCATION tags
- [x] Architecture notes added to v2/v3 features
- [x] Feed API example updated to show Edge Function call
- [x] Eligibility scoring marked as Edge Function module
- [x] Intent execution marked as Edge Functions
- [x] Sentinel monitoring marked as Edge Function
- [x] Threat monitoring marked as Edge Function
- [x] ZK verification marked as Edge Function

## What This Achieves

### 1. **Clarity**
No ambiguity about where code lives. Every example is tagged.

### 2. **Consistency**
Design doc now matches architecture doc 100%.

### 3. **Maintainability**
Future developers (and AI tools) won't accidentally put business logic in Next.js.

### 4. **Scalability**
Edge Functions can be independently deployed, scaled, and tested.

### 5. **Security**
Business logic can't be manipulated by client-side code.

## Next Steps

When implementing Hunter:

1. **Phase 1**: Create Edge Functions for core features
   - `hunter-feed`
   - `hunter-eligibility-preview`
   - `hunter-intent-quote`
   - `hunter-intent-execute`

2. **Phase 2**: Create Next.js thin proxies (optional)
   - Most can call Edge Functions directly from client
   - Only add proxies if you need server-side caching/headers

3. **Phase 3**: Build UI components
   - Use React Query to call APIs
   - Focus on presentation and UX
   - Zero business logic

## Reference

- **Architecture Rules**: `.kiro/specs/hunter-screen-feed/ARCHITECTURE_CLARIFICATION.md`
- **Design Document**: `.kiro/specs/hunter-screen-feed/design.md`
- **Requirements**: `.kiro/specs/hunter-screen-feed/requirements.md`

---

**Status**: ✅ Complete  
**Date**: 2025-01-09  
**Verified By**: Architecture alignment review
