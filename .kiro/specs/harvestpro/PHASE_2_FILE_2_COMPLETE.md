# Phase 2 - File 2 Migration Complete: opportunity-detection.ts

**Date:** November 24, 2025  
**Status:** ✅ COMPLETE  
**File:** `opportunity-detection.ts`

---

## Migration Summary

Successfully migrated `opportunity-detection.ts` from client-side (`src/lib/harvestpro/`) to Supabase Edge Functions (`supabase/functions/_shared/harvestpro/`).

---

## Changes Made

### 1. File Location
- **Source:** `src/lib/harvestpro/opportunity-detection.ts`
- **Destination:** `supabase/functions/_shared/harvestpro/opportunity-detection.ts`

### 2. Import Conversions

#### Before (Node.js/Next.js):
```typescript
import type { Lot } from './fifo';
import type { RiskLevel } from '@/types/harvestpro';
import {
  calculateUnrealizedPnL,
  calculateHoldingPeriod,
  isLongTerm,
} from './fifo';
```

#### After (Deno):
```typescript
import type { RiskLevel } from './types.ts';
import type { Lot } from './fifo.ts';
import {
  calculateUnrealizedPnL,
  calculateHoldingPeriod,
  isLongTerm,
} from './fifo.ts';
```

### 3. Key Changes
1. ✅ Added `.ts` extensions to all relative imports
2. ✅ Changed `@/types/harvestpro` to `./types.ts`
3. ✅ Changed `./fifo` to `./fifo.ts`
4. ✅ Updated file header to indicate Deno/Edge Functions implementation
5. ✅ No logic changes - pure migration

---

## Functions Migrated

All functions from the original file were migrated without modification:

### Core Functions:
- `classifyRiskLevel()` - Risk classification based on Guardian score and liquidity
- `detectOpportunities()` - Main opportunity detection engine
- `filterByMinimumLoss()` - Filter by $20 minimum loss threshold

### Utility Functions:
- `sortOpportunities()` - Sort by various criteria
- `groupByHoldingPeriod()` - Group by long-term/short-term
- `groupByRiskLevel()` - Group by LOW/MEDIUM/HIGH risk
- `calculateOpportunitySummary()` - Calculate summary statistics

---

## Dependencies

### Imports From:
- `./types.ts` - RiskLevel type
- `./fifo.ts` - Lot type and calculation functions

### Used By:
- Will be used by `harvest-recompute-opportunities` Edge Function
- Will be used by eligibility filtering logic

---

## Requirements Validated

This migration supports the following requirements:

**Requirement 2.2-2.4:** Opportunity Detection
- ✅ Calculate unrealized PnL for each lot
- ✅ Calculate holding period
- ✅ Determine long-term vs short-term classification

**Requirement 2.3:** Minimum Loss Threshold
- ✅ Only flag lots with unrealized loss > $20

**Requirement 15.1-15.4:** Risk Classification
- ✅ Guardian score <= 3: HIGH RISK
- ✅ Guardian score 4-6: MEDIUM RISK
- ✅ Guardian score >= 7: LOW RISK
- ✅ Low liquidity: HIGH RISK (overrides Guardian score)

---

## Testing Status

### Type Checking:
- ⚠️ Deno not available in current environment
- ✅ TypeScript syntax verified manually
- ✅ All imports use correct Deno format

### Property Tests:
- ℹ️ No existing property tests to migrate
- ℹ️ Property tests will be created in Phase 3 (test migration)

---

## Next Steps

1. ✅ File 2 migration complete
2. ⏭️ Next: Migrate File 3 (`eligibility.ts`)
3. 📋 Remaining: 12 more files to migrate

---

## Verification Checklist

- [x] File copied to correct location
- [x] All imports converted to Deno format
- [x] `.ts` extensions added to all relative imports
- [x] Type imports updated to use `./types.ts`
- [x] FIFO imports updated to use `./fifo.ts`
- [x] File header updated
- [x] No logic changes made
- [x] Migration guide updated
- [x] Completion document created

---

## Notes

- This file has no external dependencies (no API calls, no environment variables)
- Pure business logic - perfect candidate for Edge Functions
- All functions are deterministic and testable
- Ready to be used by Edge Functions once they are created

---

**Migration Status:** ✅ COMPLETE  
**Next File:** `eligibility.ts`
