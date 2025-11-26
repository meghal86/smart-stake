# HarvestPro v1 Architecture Validation Report

**Date:** January 2025  
**Scope:** Tasks 1-20 (v1 Core Implementation)  
**Validation Against:** Kiro Steering Files (architecture, stack, testing)

---

## Executive Summary

**Status:** ⚠️ **ARCHITECTURE VIOLATION DETECTED**

The v1 implementation (Tasks 1-20) **violates the Golden Rule** defined in the steering files:

> **"UI is Presentation Only. ALL business logic MUST reside in Supabase Edge Functions."**

### Critical Finding

**ALL business logic is currently in `src/lib/harvestpro/` instead of Supabase Edge Functions.**

This includes:
- FIFO cost basis calculation (`fifo.ts`)
- Net benefit calculation (`net-benefit.ts`)
- Eligibility filtering (`eligibility.ts`)
- Opportunity detection (`opportunity-detection.ts`)
- Risk classification (`risk-classification.ts`)
- Guardian adapter (`guardian-adapter.ts`)
- Price oracle (`price-oracle.ts`)
- Gas estimation (`gas-estimation.ts`)
- Slippage estimation (`slippage-estimation.ts`)

### Impact

1. **Tax Compliance Risk**: Business logic in client-accessible code can be manipulated
2. **Security Risk**: Tax calculations exposed to client-side tampering
3. **Performance**: Heavy calculations running in Next.js instead of Edge runtime
4. **Maintainability**: Logic duplicated between client and server
5. **Testing**: Cannot properly test with property-based tests in Edge Functions
6. **Future OaaS**: Not positioned for Opportunities-as-a-Service model

---

## Detailed Validation Results

### ✅ PASS: UI Components (Presentation Only)

**Validated Files:**
- `src/components/harvestpro/*.tsx`
- `src/pages/HarvestPro.tsx`
- `src/hooks/useHarvestSession.ts`
- `src/hooks/useCEXExecution.ts`

**Finding:** ✅ **NO business logic detected in UI components**

The UI components correctly:
- Fetch data via API calls
- Display data
- Capture user input
- Trigger API calls
- Manage local UI state (filters, modals, loading)

**No violations found:**
- No `useEffect` with complex math
- No `reduce` functions calculating financial totals
- No FIFO calculations
- No eligibility filtering
- No net benefit calculations

---

### ⚠️ PARTIAL PASS: Next.js API Routes

**Validated Files:**
- `src/app/api/harvest/opportunities/route.ts`
- `src/app/api/harvest/sessions/route.ts`
- `src/app/api/harvest/prices/route.ts`

**Finding:** ⚠️ **MINOR VIOLATIONS**

#### Violations Found:

**1. `opportunities/route.ts` - Line 31-42:**
```typescript
function calculateGasEfficiencyGrade(opportunities: HarvestOpportunity[]): GasEfficiencyGrade {
  if (opportunities.length === 0) return 'C';
  
  const avgGasPercentage = opportunities.reduce((sum, opp) => {
    const gasPercentage = (opp.gasEstimate / opp.unrealizedLoss) * 100;
    return sum + gasPercentage;
  }, 0) / opportunities.length;
  
  if (avgGasPercentage < 5) return 'A';
  if (avgGasPercentage < 15) return 'B';
  return 'C';
}
```

**Issue:** Business logic (gas efficiency calculation) in API route  
**Should be:** In Edge Function or pre-computed in database

**2. `opportunities/route.ts` - Line 145-151:**
```typescript
const summary = {
  totalHarvestableLoss: items.reduce((sum, opp) => sum + opp.unrealizedLoss, 0),
  estimatedNetBenefit: items.reduce((sum, opp) => sum + opp.net_tax_benefit, 0),
  eligibleTokensCount: new Set(items.map(opp => opp.token)).size,
  gasEfficiencyScore: calculateGasEfficiencyGrade(items as HarvestOpportunity[]),
};
```

**Issue:** Aggregation calculations in API route  
**Should be:** Pre-computed in Edge Function or database view

#### What's Correct:

✅ Simple database reads with filters  
✅ Auth/RLS validation  
✅ JSON response formatting  
✅ Cursor pagination  
✅ Rate limiting  
✅ Error handling

---

### ❌ FAIL: Business Logic Location

**Critical Violation:** All business logic is in `src/lib/harvestpro/` instead of Supabase Edge Functions.

#### Missing Edge Functions:

According to `harvestpro-architecture.md`, these Edge Functions MUST exist:

**v1 Core (MISSING):**
1. ❌ `harvest-sync-wallets` - Fetch on-chain tx history, rebuild harvest_lots
2. ❌ `harvest-sync-cex` - Call CEX APIs, update cex_trades and harvest_lots
3. ❌ `harvest-recompute-opportunities` - Heavy optimization: compute PnL, eligibility, net benefit
4. ❌ `harvest-notify` - Scan opportunities, send notifications (scheduled)

**Current State:**
- **0 out of 4** required Edge Functions exist
- All logic is in `src/lib/harvestpro/` files
- Logic is accessible from client-side code

#### Files That Should Be Edge Functions:

| Current File | Should Be Edge Function | Contains |
|--------------|-------------------------|----------|
| `src/lib/harvestpro/fifo.ts` | `harvest-sync-wallets` | FIFO cost basis calculation |
| `src/lib/harvestpro/opportunity-detection.ts` | `harvest-recompute-opportunities` | Opportunity detection |
| `src/lib/harvestpro/eligibility.ts` | `harvest-recompute-opportunities` | Eligibility filtering |
| `src/lib/harvestpro/net-benefit.ts` | `harvest-recompute-opportunities` | Net benefit calculation |
| `src/lib/harvestpro/risk-classification.ts` | `harvest-recompute-opportunities` | Risk classification |
| `src/lib/harvestpro/guardian-adapter.ts` | `harvest-recompute-opportunities` | Guardian integration |
| `src/lib/harvestpro/price-oracle.ts` | `harvest-recompute-opportunities` | Price fetching |
| `src/lib/harvestpro/gas-estimation.ts` | `harvest-recompute-opportunities` | Gas estimation |
| `src/lib/harvestpro/slippage-estimation.ts` | `harvest-recompute-opportunities` | Slippage estimation |
| `src/lib/harvestpro/cex-integration.ts` | `harvest-sync-cex` | CEX API integration |
| `src/lib/harvestpro/wallet-connection.ts` | `harvest-sync-wallets` | Wallet sync |

---

### ✅ PASS: Property-Based Tests

**Validated Files:**
- `src/lib/harvestpro/__tests__/fifo.test.ts`
- `src/lib/harvestpro/__tests__/net-benefit.test.ts`
- `src/lib/harvestpro/__tests__/eligibility.test.ts`
- `src/lib/harvestpro/__tests__/risk-classification.test.ts`
- `src/lib/harvestpro/__tests__/data-aggregation.test.ts`
- `src/lib/harvestpro/__tests__/credential-encryption.test.ts`
- `src/lib/harvestpro/__tests__/csv-export.test.ts`
- `src/lib/harvestpro/__tests__/proof-hash.test.ts`
- `src/lib/harvestpro/__tests__/price-oracle.test.ts`

**Finding:** ✅ **Property tests exist and follow standards**

All property tests:
- Use `fast-check` library ✅
- Include proper tagging (Feature, Property, Validates) ✅
- Run 100+ iterations ✅
- Use smart generators ✅
- Follow naming conventions ✅

---

### ✅ PASS: Database Schema

**Validated Files:**
- `supabase/migrations/20250201000000_harvestpro_schema.sql`
- `supabase/seeds/harvestpro_seed.sql`

**Finding:** ✅ **Schema follows conventions**

- Uses `snake_case` for tables and columns ✅
- Prefixes HarvestPro tables with `harvest_` ✅
- Proper indexes with `idx_` prefix ✅
- RLS policies with `p_` prefix ✅
- Foreign keys with `_id` suffix ✅
- Timestamps with `_at` suffix ✅

---

### ✅ PASS: TypeScript Standards

**Validated:** All TypeScript files

**Finding:** ✅ **Follows coding standards**

- Strict mode enabled ✅
- No `any` types detected ✅
- Explicit return types ✅
- Uses interfaces for object shapes ✅
- Zod validation for API inputs ✅
- Named exports (no default exports) ✅

---

## Recommendations

### Priority 1: CRITICAL - Move Business Logic to Edge Functions

**Action Required:** Refactor v1 implementation to align with architecture.

#### Step 1: Create Edge Functions

Create these Edge Functions in `supabase/functions/`:

```
supabase/functions/
├── harvest-sync-wallets/
│   └── index.ts          # FIFO + wallet sync logic
├── harvest-sync-cex/
│   └── index.ts          # CEX integration logic
├── harvest-recompute-opportunities/
│   └── index.ts          # Opportunity detection + eligibility + net benefit
├── harvest-notify/
│   └── index.ts          # Notification logic (scheduled)
└── _shared/
    └── harvestpro/
        ├── fifo.ts       # Move from src/lib
        ├── net-benefit.ts
        ├── eligibility.ts
        ├── opportunity-detection.ts
        ├── risk-classification.ts
        └── guardian-adapter.ts
```

#### Step 2: Update API Routes

**Before (WRONG):**
```typescript
// src/app/api/harvest/opportunities/route.ts
const summary = {
  totalHarvestableLoss: items.reduce((sum, opp) => sum + opp.unrealizedLoss, 0),
  // ... calculations in API route
};
```

**After (CORRECT):**
```typescript
// src/app/api/harvest/opportunities/route.ts
// Simple read - NO calculations
const { data } = await supabase
  .from('harvest_opportunities')
  .select('*, summary:harvest_opportunity_summary(*)')
  .eq('user_id', userId);
```

#### Step 3: Update Data Flow

**Current (WRONG):**
```
UI → Next.js API Route → src/lib/harvestpro/*.ts → Database
```

**Target (CORRECT):**
```
UI → Next.js API Route (thin read) → Database
                                        ↑
                                        |
                            Edge Function (business logic)
```

#### Step 4: Move Tests to Edge Functions

Move property tests from `src/lib/harvestpro/__tests__/` to `supabase/functions/_shared/harvestpro/__tests__/`

---

### Priority 2: MEDIUM - Fix API Route Violations

**File:** `src/app/api/harvest/opportunities/route.ts`

**Remove:**
- `calculateGasEfficiencyGrade()` function
- Summary aggregation calculations

**Replace with:**
- Database view or pre-computed values
- Or call Edge Function to compute

---

### Priority 3: LOW - Add Missing Edge Functions

For v2/v3, ensure these are created as Edge Functions from the start:

**v2 Institutional:**
- `harvest-economic-substance`
- `harvest-mev-protection`

**v3 Enterprise:**
- `harvest-kyt-screen`
- `webhook-fireblocks`
- `webhook-copper`
- `harvest-twap-worker`

---

## Compliance Summary

| Category | Status | Details |
|----------|--------|---------|
| UI Components | ✅ PASS | No business logic in UI |
| API Routes | ⚠️ PARTIAL | Minor calculations present |
| Edge Functions | ❌ FAIL | 0/4 required functions exist |
| Business Logic Location | ❌ FAIL | All logic in src/lib instead of Edge Functions |
| Property Tests | ✅ PASS | All tests follow standards |
| Database Schema | ✅ PASS | Follows conventions |
| TypeScript Standards | ✅ PASS | Strict mode, no any types |

**Overall Compliance:** ❌ **FAIL - Architecture Violation**

---

## Impact Assessment

### If Not Fixed:

**Security:**
- ❌ Tax calculations can be manipulated client-side
- ❌ Business logic exposed in browser
- ❌ No server-side validation of calculations

**Performance:**
- ❌ Heavy calculations in Next.js instead of Edge runtime
- ❌ Cannot leverage Edge Function caching
- ❌ Slower response times

**Maintainability:**
- ❌ Logic scattered between client and server
- ❌ Difficult to test in isolation
- ❌ Cannot reuse for OaaS model

**Compliance:**
- ❌ Tax calculations not auditable
- ❌ No deterministic server-side proof
- ❌ Regulatory risk for institutional users

---

## Action Plan

### Immediate (Before v2/v3):

1. **Create Edge Functions** (2-3 days)
   - `harvest-sync-wallets`
   - `harvest-sync-cex`
   - `harvest-recompute-opportunities`
   - `harvest-notify`

2. **Move Business Logic** (1-2 days)
   - Move `src/lib/harvestpro/*.ts` to `supabase/functions/_shared/harvestpro/`
   - Update imports
   - Update tests

3. **Update API Routes** (1 day)
   - Remove calculations from `opportunities/route.ts`
   - Make routes thin read layers
   - Add Edge Function orchestration

4. **Test & Validate** (1 day)
   - Run all property tests in Edge Functions
   - Verify API routes are thin
   - Validate end-to-end flow

**Total Effort:** 5-7 days

### For v2/v3:

- Create new Edge Functions from the start
- Follow architecture rules strictly
- Use steering files as enforcement

---

## Conclusion

The v1 implementation (Tasks 1-20) **violates the core architecture rule** by placing all business logic in `src/lib/harvestpro/` instead of Supabase Edge Functions.

**This must be fixed before v2/v3 implementation** to ensure:
- Tax compliance and auditability
- Security and tamper-resistance
- Performance and scalability
- Maintainability and testability
- Regulatory compliance for institutional users

**Recommendation:** Refactor v1 to align with architecture before proceeding with v2/v3 features.

---

**Validated By:** Kiro AI  
**Validation Date:** January 2025  
**Next Review:** After refactoring
