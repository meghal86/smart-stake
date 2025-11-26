# Phase 2 File 6: guardian-adapter.ts Migration Complete ✅

**Date:** November 24, 2025  
**Status:** ✅ COMPLETE  
**File:** `guardian-adapter.ts` - Guardian API integration

---

## Migration Summary

Successfully migrated `guardian-adapter.ts` from Node.js (`src/lib/harvestpro/`) to Deno (`supabase/functions/_shared/harvestpro/`).

---

## Changes Made

### 1. Import Conversions ✅

**Before (Node.js):**
```typescript
import type { RiskLevel } from '@/types/harvestpro';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
```

**After (Deno):**
```typescript
import type { RiskLevel } from './types.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const GUARDIAN_API_KEY = Deno.env.get('GUARDIAN_API_KEY');
```

### 2. Environment Variable Access ✅

- Changed from `import.meta.env.VITE_SUPABASE_URL` to `Deno.env.get('SUPABASE_URL')`
- Added `GUARDIAN_API_KEY` environment variable for API authentication
- Updated `isGuardianAvailable()` to use Deno environment variables

### 3. Cache Source Fix ✅

Fixed cache implementation to properly mark cached scores:

```typescript
function getCachedScore(token: string): GuardianScore | null {
  const cached = guardianCache.get(token.toUpperCase());
  
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    guardianCache.delete(token.toUpperCase());
    return null;
  }
  
  // Return cached score with source updated to 'cache'
  return {
    ...cached.score,
    source: 'cache',
  };
}
```

### 4. API Integration ✅

Updated Guardian API calls to include authentication:

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/guardian-scan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GUARDIAN_API_KEY}`,
  },
  body: JSON.stringify({
    token: token.toUpperCase(),
    scan_type: 'token',
  }),
});
```

---

## Features Preserved

All functionality from the original implementation was preserved:

1. **Guardian Score Fetching** ✅
   - `getGuardianScore(token, forceRefresh)` - Single token scoring
   - `getGuardianScores(tokens, forceRefresh)` - Batch token scoring

2. **Caching Layer** ✅
   - 1-hour TTL for Guardian scores
   - Cache hit/miss tracking
   - Force refresh capability
   - Cache management functions

3. **Mock Fallback** ✅
   - Deterministic mock scores for development
   - Automatic fallback when Guardian API unavailable
   - Graceful error handling

4. **Risk Classification** ✅
   - `classifyRiskFromScore(score)` - Score to risk level mapping
   - `getRiskColor(riskLevel)` - CSS color variables
   - `getRiskLabel(riskLevel)` - Human-readable labels
   - `getRiskDescription(riskLevel)` - Risk descriptions

5. **Utility Functions** ✅
   - `isGuardianAvailable()` - Health check
   - `clearGuardianCache(token?)` - Cache clearing
   - `getGuardianCacheStats()` - Cache statistics

---

## Testing Results

### Type Check ✅
```bash
deno check supabase/functions/_shared/harvestpro/guardian-adapter.ts
# ✅ Check passed
```

### Unit Tests ✅
```bash
deno test --allow-env supabase/functions/_shared/harvestpro/__tests__/guardian-adapter.test.ts
# ✅ 10 passed | 0 failed
```

**Test Coverage:**
- ✅ Mock score generation
- ✅ Cache hit/miss behavior
- ✅ Force refresh bypasses cache
- ✅ Batch token fetching
- ✅ Risk classification (HIGH/MEDIUM/LOW)
- ✅ Cache management
- ✅ Deterministic mock scores
- ✅ Token symbol normalization

---

## Dependencies

**No external dependencies** - Uses only Deno built-ins:
- `Deno.env.get()` for environment variables
- Native `fetch()` for HTTP requests
- Native `Map` for caching
- Native `Date` for timestamps

---

## Environment Variables Required

```bash
# Required for Guardian API integration
SUPABASE_URL=https://your-project.supabase.co
GUARDIAN_API_KEY=your-guardian-api-key

# Optional - falls back to mock if not set
```

---

## API Endpoints Used

1. **Guardian Scan**
   - Endpoint: `${SUPABASE_URL}/functions/v1/guardian-scan`
   - Method: POST
   - Purpose: Fetch Guardian security score for token

2. **Guardian Health Check**
   - Endpoint: `${SUPABASE_URL}/functions/v1/guardian-healthz`
   - Method: GET
   - Purpose: Check if Guardian API is available

---

## Integration Points

This module is used by:

1. **opportunity-detection.ts** - Risk scoring for harvest opportunities
2. **risk-classification.ts** - Risk level classification
3. **harvest-recompute-opportunities** Edge Function - Opportunity computation

---

## Risk Classification Rules

As per Requirements 15.1-15.3:

| Guardian Score | Risk Level | Color | Description |
|---------------|------------|-------|-------------|
| 0-3 | HIGH | Red | Significant risk factors |
| 4-6 | MEDIUM | Amber | Some risk factors |
| 7-10 | LOW | Green | Strong security profile |

---

## Cache Behavior

- **TTL:** 1 hour (3600 seconds)
- **Storage:** In-memory Map (per Edge Function instance)
- **Invalidation:** Automatic on expiry or manual via `clearGuardianCache()`
- **Source Tracking:** 'guardian', 'mock', or 'cache'

---

## Mock Score Algorithm

For development/testing when Guardian API is unavailable:

```typescript
// Deterministic scoring based on token name
const hash = token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
const score = 3 + (hash % 8); // Score between 3-10
```

This ensures:
- Same token always gets same mock score
- Scores are in valid range (3-10)
- No tokens get HIGH risk (score <= 3) in mock mode

---

## Next Steps

1. ✅ **File 6 Complete** - guardian-adapter.ts migrated
2. ⏭️ **File 7** - Migrate `price-oracle.ts`
3. ⏭️ **File 8** - Migrate `gas-estimation.ts`
4. ⏭️ **File 9** - Migrate `slippage-estimation.ts`
5. ⏭️ **File 10** - Migrate `token-tradability.ts`

---

## Verification Checklist

- [x] File copied to `supabase/functions/_shared/harvestpro/`
- [x] Imports converted to Deno format
- [x] Environment variables updated to use `Deno.env.get()`
- [x] Type check passes
- [x] All unit tests pass
- [x] Cache source tracking fixed
- [x] API authentication added
- [x] Mock fallback working
- [x] Risk classification preserved
- [x] Documentation updated

---

**Status:** ✅ Migration complete and verified  
**Next Action:** Proceed to File 7 (price-oracle.ts)
