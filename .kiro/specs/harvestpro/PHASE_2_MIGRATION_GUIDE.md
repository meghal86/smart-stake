`# Phase 2: Business Logic Migration Guide

**Date:** November 24, 2025  
**Status:** 🚧 IN PROGRESS  
**Goal:** Move all business logic from `src/lib/harvestpro/` to Supabase Edge Functions

---

## Overview

This guide provides step-by-step instructions for migrating HarvestPro business logic to Edge Functions. The migration ensures tax calculations run server-side for security, auditability, and compliance.

---

## Migration Checklist

### Files to Migrate (12 total)

- [x] 1. `fifo.ts` - FIFO cost basis calculation
- [x] 2. `opportunity-detection.ts` - Opportunity detection logic
- [x] 3. `eligibility.ts` - Eligibility filtering
- [x] 4. `net-benefit.ts` - Net benefit calculation
- [x] 5. `risk-classification.ts` - Risk classification
- [x] 6. `guardian-adapter.ts` - Guardian API integration
- [x] 7. `price-oracle.ts` - Price fetching
- [x] 8. `gas-estimation.ts` - Gas estimation
- [x] 9. `slippage-estimation.ts` - Slippage estimation
- [x] 10. `token-tradability.ts` - Tradability checks
- [x] 11. `multi-chain-engine.ts` - Multi-chain support
- [x] 12. `cex-integration.ts` - CEX API integration
- [x] 13. `wallet-connection.ts` - Wallet data fetching
- [x] 14. `data-aggregation.ts` - Data aggregation

---

## Step-by-Step Migration Process

### For Each File:

1. **Copy** the file from `src/lib/harvestpro/` to `supabase/functions/_shared/harvestpro/`
2. **Convert imports** from Node.js to Deno format
3. **Test** the converted file
4. **Update** Edge Functions to use the migrated logic
5. **Verify** functionality

---

## Import Conversion Rules

### Node.js → Deno Import Mapping

```typescript
// ❌ Node.js (OLD)
import { createClient } from '@/lib/supabase/client';
import type { HarvestOpportunity } from '@/types/harvestpro';
import crypto from 'crypto';

// ✅ Deno (NEW)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { HarvestOpportunity } from '../types.ts';
// crypto is built into Deno, no import needed
```

### Common Import Conversions

| Node.js | Deno |
|---------|------|
| `@/lib/supabase/client` | `https://esm.sh/@supabase/supabase-js@2` |
| `@/types/harvestpro` | `../types.ts` |
| `@/lib/harvestpro/fifo` | `./fifo.ts` |
| `crypto` (Node) | Built-in Deno `crypto` |
| `process.env.VAR` | `Deno.env.get('VAR')` |

---

## Detailed Migration Instructions

### File 1: fifo.ts

**Purpose:** FIFO cost basis calculation  
**Used by:** `harvest-sync-wallets`, `harvest-recompute-opportunities`  
**Dependencies:** None (pure logic)

**Steps:**
1. Copy file to `supabase/functions/_shared/harvestpro/fifo.ts`
2. Update type imports to use `./types.ts`
3. No external dependencies to convert
4. Test with existing property tests (after converting tests)

**Changes needed:**
```typescript
// Change this:
import type { Lot, Transaction } from '@/types/harvestpro';

// To this:
import type { Lot, Transaction } from './types.ts';
```

---

### File 2: opportunity-detection.ts

**Purpose:** Detect harvest opportunities from lots  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** `fifo.ts`, types

**Steps:**
1. Copy file to `supabase/functions/_shared/harvestpro/opportunity-detection.ts`
2. Update imports
3. Ensure `fifo.ts` is migrated first

**Changes needed:**
```typescript
// Change this:
import { calculateFIFOLots } from '@/lib/harvestpro/fifo';
import type { Lot, HarvestOpportunity } from '@/types/harvestpro';

// To this:
import { calculateFIFOLots } from './fifo.ts';
import type { Lot, HarvestOpportunity } from './types.ts';
```

---

### File 3: eligibility.ts

**Purpose:** Filter opportunities by eligibility criteria  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** types

**Steps:**
1. Copy file
2. Update type imports
3. No external API calls

**Changes needed:**
```typescript
// Change this:
import type { HarvestOpportunity, EligibilityCheck } from '@/types/harvestpro';

// To this:
import type { HarvestOpportunity, EligibilityCheck } from './types.ts';
```

---

### File 4: net-benefit.ts

**Purpose:** Calculate net tax benefit  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** types

**Steps:**
1. Copy file
2. Update type imports
3. Pure calculation logic

**Changes needed:**
```typescript
// Change this:
import type { HarvestCalculation } from '@/types/harvestpro';

// To this:
import type { HarvestCalculation } from './types.ts';
```

---

### File 5: risk-classification.ts

**Purpose:** Classify risk levels  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** types

**Steps:**
1. Copy file
2. Update type imports

**Changes needed:**
```typescript
// Change this:
import type { RiskLevel } from '@/types/harvestpro';

// To this:
import type { RiskLevel } from './types.ts';
```

---

### File 6: guardian-adapter.ts

**Purpose:** Guardian API integration  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** External API (Guardian)

**Steps:**
1. Copy file
2. Update fetch calls (Deno uses native fetch)
3. Update environment variables

**Changes needed:**
```typescript
// Change this:
const apiKey = process.env.GUARDIAN_API_KEY;

// To this:
const apiKey = Deno.env.get('GUARDIAN_API_KEY');

// fetch() works the same in Deno
```

---

### File 7: price-oracle.ts

**Purpose:** Fetch token prices  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** External APIs (CoinGecko, CoinMarketCap)

**Steps:**
1. Copy file
2. Update environment variables
3. fetch() works natively in Deno

**Changes needed:**
```typescript
// Change this:
const apiKey = process.env.COINGECKO_API_KEY;

// To this:
const apiKey = Deno.env.get('COINGECKO_API_KEY');
```

---

### File 8: gas-estimation.ts

**Purpose:** Estimate gas costs  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** RPC providers

**Steps:**
1. Copy file
2. Update environment variables
3. May need ethers.js from esm.sh

**Changes needed:**
```typescript
// If using ethers:
import { ethers } from 'https://esm.sh/ethers@6';

// Environment variables:
const rpcUrl = Deno.env.get('ALCHEMY_API_KEY');
```

---

### File 9: slippage-estimation.ts

**Purpose:** Estimate slippage  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** DEX APIs

**Steps:**
1. Copy file
2. Update API calls
3. Update environment variables

---

### File 10: token-tradability.ts

**Purpose:** Check if token is tradable  
**Used by:** `harvest-recompute-opportunities`  
**Dependencies:** DEX APIs

**Steps:**
1. Copy file
2. Update API calls

---

### File 11: multi-chain-engine.ts

**Purpose:** Multi-chain support  
**Used by:** Multiple Edge Functions  
**Dependencies:** RPC providers

**Steps:**
1. Copy file
2. Update RPC provider imports
3. Update environment variables

---

### File 12: cex-integration.ts

**Purpose:** CEX API integration  
**Used by:** `harvest-sync-cex`  
**Dependencies:** CEX APIs (Binance, Coinbase, Kraken)

**Steps:**
1. Copy file
2. Update crypto imports (for signing requests)
3. Update environment variables

**Changes needed:**
```typescript
// Deno has built-in crypto
const signature = await crypto.subtle.sign(
  { name: 'HMAC', hash: 'SHA-256' },
  key,
  data
);
```

---

### File 13: wallet-connection.ts

**Purpose:** Fetch wallet data  
**Used by:** `harvest-sync-wallets`  
**Dependencies:** Blockchain RPCs

**Steps:**
1. Copy file
2. Update RPC calls
3. May need ethers.js

---

### File 14: data-aggregation.ts

**Purpose:** Aggregate wallet + CEX data  
**Used by:** `harvest-sync-cex`  
**Dependencies:** Other migrated files

**Steps:**
1. Copy file
2. Update imports
3. Ensure dependencies are migrated first

---

## Testing After Migration

### For Each Migrated File:

1. **Run Deno type check:**
```bash
deno check supabase/functions/_shared/harvestpro/fifo.ts
```

2. **Run property tests (after converting):**
```bash
deno test supabase/functions/_shared/harvestpro/__tests__/fifo.test.ts
```

3. **Test in Edge Function:**
```bash
supabase functions serve harvest-recompute-opportunities
```

---

## Next Steps After Phase 2

Once all files are migrated:

1. ✅ **Phase 3:** Move property tests to Deno
2. ✅ **Phase 4:** Implement Edge Function logic
3. ✅ **Phase 5:** Update Next.js API routes
4. ✅ **Phase 6:** End-to-end testing
5. ✅ **Phase 7:** Deploy to production

---

## Need Help?

**Common Issues:**

1. **Import errors:** Check import paths use `.ts` extension
2. **Type errors:** Ensure types.ts is up to date
3. **Environment variables:** Use `Deno.env.get()` not `process.env`
4. **Crypto operations:** Use Deno's built-in Web Crypto API

**Resources:**
- [Deno Manual](https://deno.land/manual)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Standard Library](https://deno.land/std)

---

**Status:** Phase 2 guide created. Ready to begin file migration.  
**Next Action:** Start migrating files one by one, beginning with `fifo.ts`

