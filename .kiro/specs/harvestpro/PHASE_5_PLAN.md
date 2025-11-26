# Phase 5: Update Next.js API Routes

**Status:** 🚀 READY TO START  
**Previous Phase:** Phase 4 - Edge Function Implementation ✅ COMPLETE  
**Goal:** Update Next.js API routes to call Edge Functions (thin orchestration layer)

---

## Overview

Phase 5 transforms the Next.js API routes from containing business logic to being **thin orchestration layers** that call the Edge Functions created in Phase 4.

**Key Principle:** Next.js API routes should ONLY:
- Validate authentication
- Parse and validate request parameters
- Call Edge Functions
- Format responses
- Handle errors gracefully

**NO business logic should remain in Next.js API routes.**

---

## What Needs to Be Updated

### 1. `/api/harvest/opportunities` ⭐ (CRITICAL)

**Current State:** May contain business logic  
**Target State:** Thin wrapper around `harvest-recompute-opportunities` Edge Function

**Actions:**
- Remove any FIFO, PnL, or calculation logic
- Call `harvest-recompute-opportunities` Edge Function
- Format response for UI consumption
- Add proper error handling
- Add caching (5 min TTL)

### 2. `/api/harvest/sync/wallets` (NEW)

**Current State:** Doesn't exist or incomplete  
**Target State:** Thin wrapper around `harvest-sync-wallets` Edge Function

**Actions:**
- Create new API route
- Validate user authentication
- Extract wallet addresses from request
- Call `harvest-sync-wallets` Edge Function
- Return sync status

### 3. `/api/harvest/sync/cex` (NEW)

**Current State:** Doesn't exist or incomplete  
**Target State:** Thin wrapper around `harvest-sync-cex` Edge Function

**Actions:**
- Create new API route
- Validate user authentication
- Extract CEX account info from request
- Call `harvest-sync-cex` Edge Function
- Return sync status

### 4. `/api/harvest/sync/status` (NEW)

**Current State:** Doesn't exist  
**Target State:** Read sync status from database

**Actions:**
- Create new API route
- Query `harvest_sync_status` table
- Return last sync times and status
- No Edge Function call needed (simple DB read)

### 5. `/api/harvest/sessions/*` (REVIEW)

**Current State:** May be complete from earlier phases  
**Target State:** Verify they're thin wrappers

**Actions:**
- Review existing session management routes
- Ensure no business logic present
- Verify proper Edge Function calls if needed

---

## Implementation Tasks

### Task 1: Update `/api/harvest/opportunities`

**File:** `src/app/api/harvest/opportunities/route.ts`

**Before (BAD - has business logic):**
```typescript
// ❌ BAD: Business logic in API route
export async function GET(req: NextRequest) {
  const lots = await getLots();
  const opportunities = lots
    .filter(lot => lot.unrealizedPnl < -20)
    .map(lot => ({
      ...lot,
      netBenefit: (lot.unrealizedPnl * taxRate) - gasEstimate
    }));
  return NextResponse.json({ items: opportunities });
}
```

**After (GOOD - thin wrapper):**
```typescript
// ✅ GOOD: Thin wrapper calling Edge Function
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  const { taxRate, minLoss } = getQueryParams(req);
  
  // Call Edge Function
  const { data, error } = await supabase.functions.invoke(
    'harvest-recompute-opportunities',
    {
      body: { userId, taxRate, minLossThreshold: minLoss }
    }
  );
  
  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to compute opportunities' } },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    data: data.opportunities,
    summary: {
      totalHarvestableLoss: data.totalPotentialSavings,
      eligibleTokensCount: data.opportunitiesFound
    },
    ts: new Date().toISOString()
  });
}
```

### Task 2: Create `/api/harvest/sync/wallets`

**File:** `src/app/api/harvest/sync/wallets/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await req.json();
    const { walletAddresses, forceRefresh = false } = body;
    
    // Validate input
    if (!walletAddresses || !Array.isArray(walletAddresses)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'walletAddresses array required' } },
        { status: 400 }
      );
    }
    
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke(
      'harvest-sync-wallets',
      {
        body: {
          userId: user.id,
          walletAddresses,
          forceRefresh
        }
      }
    );
    
    if (error) {
      console.error('Wallet sync error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to sync wallets' } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      walletsProcessed: data.walletsProcessed,
      transactionsFound: data.transactionsFound,
      lastSyncAt: data.lastSyncAt
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### Task 3: Create `/api/harvest/sync/cex`

**File:** `src/app/api/harvest/sync/cex/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await req.json();
    const { cexAccounts, forceRefresh = false } = body;
    
    // Validate input
    if (!cexAccounts || !Array.isArray(cexAccounts)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'cexAccounts array required' } },
        { status: 400 }
      );
    }
    
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke(
      'harvest-sync-cex',
      {
        body: {
          userId: user.id,
          cexAccounts,
          forceRefresh
        }
      }
    );
    
    if (error) {
      console.error('CEX sync error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to sync CEX accounts' } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      accountsProcessed: data.accountsProcessed,
      tradesFound: data.tradesFound,
      lastSyncAt: data.lastSyncAt
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### Task 4: Create `/api/harvest/sync/status`

**File:** `src/app/api/harvest/sync/status/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Query sync status from database (simple read, no Edge Function needed)
    const { data: syncStatus, error } = await supabase
      .from('harvest_sync_status')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Sync status query error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to fetch sync status' } },
        { status: 500 }
      );
    }
    
    // Format response
    const walletSync = syncStatus?.find(s => s.sync_type === 'wallets');
    const cexSync = syncStatus?.find(s => s.sync_type === 'cex');
    
    return NextResponse.json({
      wallets: {
        lastSyncAt: walletSync?.last_sync_at || null,
        walletsProcessed: walletSync?.wallets_processed || 0,
        transactionsFound: walletSync?.transactions_found || 0,
        status: walletSync?.status || 'never_synced'
      },
      cex: {
        lastSyncAt: cexSync?.last_sync_at || null,
        accountsProcessed: cexSync?.accounts_processed || 0,
        tradesFound: cexSync?.trades_found || 0,
        status: cexSync?.status || 'never_synced'
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### Task 5: Review Existing Routes

**Files to Review:**
- `src/app/api/harvest/sessions/route.ts`
- `src/app/api/harvest/sessions/[id]/route.ts`
- `src/app/api/harvest/sessions/[id]/execute/route.ts`
- `src/app/api/harvest/sessions/[id]/export/route.ts`
- `src/app/api/harvest/sessions/[id]/proof/route.ts`
- `src/app/api/harvest/settings/route.ts`
- `src/app/api/harvest/prices/route.ts`

**Actions:**
- Verify no business logic present
- Ensure proper Edge Function calls
- Add error handling if missing
- Add response formatting if needed

---

## Testing Checklist

### Unit Tests
- [ ] Test authentication validation
- [ ] Test request parameter validation
- [ ] Test error handling
- [ ] Test response formatting

### Integration Tests
- [ ] Test `/api/harvest/opportunities` calls Edge Function
- [ ] Test `/api/harvest/sync/wallets` calls Edge Function
- [ ] Test `/api/harvest/sync/cex` calls Edge Function
- [ ] Test `/api/harvest/sync/status` reads from database
- [ ] Test error responses
- [ ] Test authentication failures

### End-to-End Tests
- [ ] Test full sync → compute → display flow
- [ ] Test wallet sync from UI
- [ ] Test CEX sync from UI
- [ ] Test opportunity refresh from UI
- [ ] Test error states in UI

---

## Success Criteria

✅ **All API routes are thin wrappers** (< 50 lines each)  
✅ **No business logic in API routes** (only orchestration)  
✅ **All routes call Edge Functions** (where appropriate)  
✅ **Proper error handling** (consistent error format)  
✅ **Authentication validated** (on all protected routes)  
✅ **Response formatting** (consistent JSON structure)  
✅ **Tests passing** (unit + integration)  

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React/Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HarvestPro   │  │ Sync Buttons │  │ Opportunity  │      │
│  │  Dashboard   │  │              │  │    Cards     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Next.js API   │
                    │   Routes (THIN) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Edge Functions │
                    │  (BUSINESS LOGIC)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Database     │
                    │   (Supabase)    │
                    └─────────────────┘
```

---

## Timeline

**Estimated Time:** 2-3 hours

- Task 1: Update `/api/harvest/opportunities` (30 min)
- Task 2: Create `/api/harvest/sync/wallets` (20 min)
- Task 3: Create `/api/harvest/sync/cex` (20 min)
- Task 4: Create `/api/harvest/sync/status` (15 min)
- Task 5: Review existing routes (30 min)
- Testing: (45 min)

---

## Next Steps After Phase 5

**Phase 6: UI Integration & Polish**
- Update UI components to call new API routes
- Add loading states
- Add error handling
- Add success messages
- Polish user experience

---

## Ready to Start?

Phase 5 is well-defined and ready to execute. All Edge Functions from Phase 4 are complete and tested. We just need to wire up the Next.js API routes to call them!

**Let's start with Task 1: Update `/api/harvest/opportunities`** 🚀

