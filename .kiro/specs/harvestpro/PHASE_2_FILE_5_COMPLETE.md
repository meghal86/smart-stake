# Phase 2 Migration Complete: risk-classification.ts

**Date:** November 24, 2025  
**Status:** ✅ COMPLETE  
**File:** `risk-classification.ts`

---

## Summary

Successfully migrated `risk-classification.ts` from client-side (`src/lib/harvestpro/`) to Supabase Edge Functions (`supabase/functions/_shared/harvestpro/`).

---

## Files Created

### 1. Edge Function Implementation
**Path:** `supabase/functions/_shared/harvestpro/risk-classification.ts`

**Key Functions:**
- `classifyRiskFromScore(guardianScore)` - Classify risk based on Guardian score (0-10)
- `classifyLiquidityRisk(liquidityScore)` - Classify risk based on liquidity score (0-100)
- `determineOverallRisk(guardianScore, liquidityScore)` - Determine overall risk level
- `assessRisk(opportunity, guardianScore?)` - Comprehensive risk assessment
- `generateRiskChip(riskLevel)` - Generate risk chip data for UI
- `sortByRisk(opportunities)` - Sort opportunities by risk (safest first)
- `filterByMaxRisk(opportunities, maxRisk)` - Filter by maximum acceptable risk

**Risk Classification Rules:**
- Guardian score <= 3: HIGH RISK
- Guardian score 4-6: MEDIUM RISK
- Guardian score >= 7: LOW RISK
- Liquidity < 50: HIGH RISK (overrides Guardian score)

### 2. Property-Based Tests
**Path:** `supabase/functions/_shared/harvestpro/__tests__/risk-classification.test.ts`

**Test Coverage:**
- ✅ Property 12: Risk Level Classification - Guardian score <= 3 means HIGH RISK
- ✅ Property 12: Risk Level Classification - liquidity < 50 means HIGH RISK
- ✅ Property 12: Risk Level Classification - Guardian score 4-6 means MEDIUM RISK
- ✅ Property 12: Risk Level Classification - Guardian score >= 7 and liquidity >= 50 means LOW RISK
- ✅ Property: classifyRiskFromScore correctly classifies all Guardian scores
- ✅ Property: classifyLiquidityRisk correctly classifies all liquidity scores
- ✅ Property: Liquidity risk overrides Guardian risk when worse
- ✅ Property: assessRisk overall risk matches determineOverallRisk
- ✅ Property: Risk score is bounded between 0 and 100
- ✅ Property: Risk score increases with Guardian score and liquidity

**Test Results:**
```
✅ All 10 property tests passed (100 iterations each)
✅ Total execution time: 16ms
```

---

## Import Conversions

### Node.js → Deno

| Node.js Import | Deno Import |
|----------------|-------------|
| `import type { RiskLevel } from '@/types/harvestpro'` | `import type { RiskLevel } from './types.ts'` |
| `import type { OpportunityCandidate } from './opportunity-detection'` | `import type { OpportunityCandidate } from './opportunity-detection.ts'` |

**Key Changes:**
1. ✅ Added `.ts` extensions to all relative imports
2. ✅ Updated type imports to use relative paths
3. ✅ Removed dependency on client-side guardian-adapter (moved classifyRiskFromScore inline)
4. ✅ All functions remain pure (no side effects)

---

## Type Compatibility

### OpportunityCandidate Structure
The Edge Function version uses a slightly different structure:

**Client-side (old):**
```typescript
interface OpportunityCandidate {
  token: string;
  unrealizedPnl: number;
  remainingQty: number;
  holdingPeriodDays: number;
  guardianScore: number;
  liquidityScore: number;
  riskLevel: RiskLevel;
}
```

**Edge Function (new):**
```typescript
interface OpportunityCandidate {
  lot: Lot;  // Contains acquisition details
  unrealizedPnl: number;
  unrealizedLoss: number;
  holdingPeriodDays: number;
  longTerm: boolean;
  guardianScore: number;
  liquidityScore: number;
  riskLevel: RiskLevel;
}
```

---

## Validation

### Type Checking
```bash
✅ deno check supabase/functions/_shared/harvestpro/risk-classification.ts
```

### Property Tests
```bash
✅ deno test supabase/functions/_shared/harvestpro/__tests__/risk-classification.test.ts
```

**Results:**
- All 10 property tests passed
- 100 iterations per test
- Total: 1,000 test cases executed successfully

---

## Requirements Validated

### Requirement 15.1
✅ Guardian score <= 3 means HIGH RISK

### Requirement 15.2
✅ Guardian score 4-6 means MEDIUM RISK

### Requirement 15.3
✅ Guardian score >= 7 means LOW RISK

### Requirement 15.4
✅ Liquidity < 50 overrides Guardian score (always HIGH RISK)

### Requirement 15.5
✅ Risk displayed as colored chip (generateRiskChip function)

---

## Dependencies

### Imports
- `./types.ts` - RiskLevel type
- `./opportunity-detection.ts` - OpportunityCandidate interface

### No External Dependencies
- Pure TypeScript/Deno code
- No npm packages required
- No API calls

---

## Next Steps

1. ✅ **File 5 Complete:** `risk-classification.ts` migrated and tested
2. ⏭️ **Next File:** `guardian-adapter.ts` - Guardian API integration
3. 📋 **Remaining Files:** 7 more files to migrate (see PHASE_2_MIGRATION_GUIDE.md)

---

## Testing Notes

### Property-Based Testing
- Used `fast-check@3.15.0` via npm
- Configured Deno with `"nodeModulesDir": "auto"` in `deno.json`
- All tests use 100 iterations minimum
- Tests validate Requirements 15.1-15.4

### Test Structure
- Nested test steps using `await t.step()`
- Consistent with other Edge Function tests (fifo, eligibility, net-benefit)
- Clear property descriptions and requirement references

---

## Configuration Updates

### deno.json
Added `"nodeModulesDir": "auto"` to enable npm package imports:

```json
{
  "nodeModulesDir": "auto",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "lib": ["deno.window", "dom"]
  }
}
```

---

**Status:** Phase 2 File 5 migration complete. Ready to proceed with File 6 (guardian-adapter.ts).
