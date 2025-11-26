# Phase 2 File 4 Complete: net-benefit.ts

**Date:** November 24, 2025  
**Status:** ✅ COMPLETE  
**File:** `net-benefit.ts` - Net Benefit Calculation Engine

---

## Migration Summary

Successfully migrated the net benefit calculation engine from client-side to Supabase Edge Functions. This is a critical component for tax-loss harvesting as it calculates the actual financial benefit after accounting for all execution costs.

---

## What Was Migrated

### Core Functions (10 total)

1. **`calculateTaxSavings()`**
   - Calculates tax savings from unrealized loss
   - Formula: `unrealizedLoss × taxRate`
   - Validates: Requirement 4.1

2. **`calculateTotalCosts()`**
   - Sums all execution costs
   - Formula: `gas + slippage + tradingFees`
   - Validates: Requirements 4.2, 4.3, 4.4

3. **`calculateNetBenefit()`**
   - Core calculation: tax savings minus costs
   - Formula: `(loss × rate) - gas - slippage - fees`
   - Validates: Requirements 4.1-4.4

4. **`calculateHarvestBenefit()`**
   - Complete calculation with recommendation
   - Returns full `HarvestCalculation` object
   - Validates: Requirements 4.1-4.5

5. **`calculateBenefitCostRatio()`**
   - Measures benefit per dollar of cost
   - Higher ratio = better opportunity

6. **`calculateEfficiencyScore()`**
   - Percentage of tax savings retained after costs
   - Range: 0-100

7. **`classifyGasEfficiency()`**
   - Grades gas cost as percentage of loss
   - Grades: A (<5%), B (5-15%), C (>15%)

8. **`calculateBreakEvenTaxRate()`**
   - Minimum tax rate for profitability
   - Helps users understand if harvest makes sense

9. **`estimatePaybackPeriod()`**
   - Time to recover costs through tax savings
   - Human-readable descriptions

10. **`calculateAggregateStats()`**
    - Portfolio-level statistics
    - Totals, averages, counts

---

## Property Tests Implemented

### Property 6: Net Benefit Calculation (Primary)
**Validates:** Requirements 4.1, 4.2, 4.3, 4.4

For any harvest opportunity, net benefit SHALL equal:
```
(unrealized_loss × tax_rate) - gas_estimate - slippage_estimate - trading_fees
```

### Additional Properties (9 total)

1. **Tax Savings Correctness**
   - `taxSavings = unrealizedLoss × taxRate`

2. **Total Costs Correctness**
   - `totalCosts = gas + slippage + fees`

3. **Monotonicity with Tax Rate**
   - Higher tax rate → higher net benefit

4. **Monotonicity with Costs**
   - Higher costs → lower net benefit

5. **Zero Tax Rate Edge Case**
   - Zero tax rate → negative net benefit (just costs)

6. **Zero Costs Edge Case**
   - Zero costs → net benefit = tax savings

7. **Recommendation Logic**
   - `recommended = true` if `netBenefit > 0`
   - `recommended = false` if `netBenefit ≤ 0`

8. **Value Preservation**
   - All input values preserved in output

9. **Commutativity**
   - Cost order doesn't affect result

---

## Import Changes

### Before (Client-side)
```typescript
import type { OpportunityCandidate } from './opportunity-detection';
import type { HarvestCalculation } from '@/types/harvestpro';
```

### After (Edge Functions)
```typescript
import type { HarvestCalculation } from './types.ts';
```

**Key Changes:**
- Removed `OpportunityCandidate` dependency (not needed)
- Changed `@/types/harvestpro` to `./types.ts`
- Added `.ts` extension (Deno requirement)

---

## Files Created

1. **`supabase/functions/_shared/harvestpro/net-benefit.ts`**
   - Core implementation (273 lines)
   - 10 exported functions
   - 2 exported types

2. **`supabase/functions/_shared/harvestpro/__tests__/net-benefit.test.ts`**
   - Property tests (400+ lines)
   - 10 property tests
   - 100 iterations per test

3. **`supabase/functions/_shared/harvestpro/__tests__/net-benefit-import-test.ts`**
   - Import verification test
   - Basic functionality test

---

## Why This Matters

### Tax Compliance
- Net benefit calculation is the core of tax-loss harvesting
- Must be deterministic and auditable
- IRS requires accurate cost basis and loss calculations

### User Trust
- Users need to know the actual benefit after costs
- Transparent calculation builds confidence
- Clear recommendation logic helps decision-making

### Financial Accuracy
- Prevents users from executing unprofitable harvests
- Accounts for all costs (gas, slippage, fees)
- Provides multiple metrics for informed decisions

---

## Testing Strategy

### Property-Based Testing (Primary)
- 10 properties tested
- 100 iterations per property
- Covers edge cases automatically
- Validates mathematical correctness

### Unit Testing (Complementary)
- Specific examples in import test
- Verifies basic functionality
- Quick smoke test

---

## Next Steps

1. ✅ **File 4 Complete:** `net-benefit.ts`
2. ⏭️ **Next File:** `risk-classification.ts` (File 5)
3. 📊 **Progress:** 4/14 files complete (29%)

---

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| 4.1 | Tax savings = loss × rate | ✅ Validated |
| 4.2 | Subtract gas cost | ✅ Validated |
| 4.3 | Subtract slippage cost | ✅ Validated |
| 4.4 | Subtract trading fees | ✅ Validated |
| 4.5 | Not recommended if ≤ 0 | ✅ Validated |

---

## Code Quality Metrics

**Complexity:**
- All functions: O(1) time complexity
- `calculateAggregateStats()`: O(n) linear

**Purity:**
- 100% pure functions (no side effects)
- Deterministic output for same input
- Safe for concurrent execution

**Type Safety:**
- Full TypeScript coverage
- Strict type checking
- No `any` types

**Test Coverage:**
- 10 property tests
- 100 iterations per test
- 1000+ test cases total

---

**Migration Status:** ✅ COMPLETE  
**Verification:** ✅ Import test passes  
**Property Tests:** ✅ All 10 properties validated  
**Next Action:** Proceed to `risk-classification.ts`
