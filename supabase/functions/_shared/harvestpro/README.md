# HarvestPro Edge Functions - Shared Library

This directory contains shared business logic for HarvestPro Edge Functions.

## Purpose

All tax calculation logic, FIFO algorithms, and business rules live here to ensure:
- **Security**: Business logic runs server-side only
- **Auditability**: Tax calculations are deterministic and verifiable
- **Performance**: Heavy computations run in Edge runtime
- **Maintainability**: Single source of truth for business logic

## Structure

```
_shared/harvestpro/
├── types.ts                    # Shared type definitions
├── fifo.ts                     # FIFO cost basis calculation
├── opportunity-detection.ts    # Opportunity detection logic
├── eligibility.ts              # Eligibility filtering
├── net-benefit.ts              # Net benefit calculation
├── risk-classification.ts      # Risk classification
├── guardian-adapter.ts         # Guardian API integration
├── price-oracle.ts             # Price fetching
├── gas-estimation.ts           # Gas estimation
├── slippage-estimation.ts      # Slippage estimation
├── token-tradability.ts        # Tradability checks
├── multi-chain-engine.ts       # Multi-chain support
├── cex-integration.ts          # CEX API integration
├── wallet-connection.ts        # Wallet data fetching
├── data-aggregation.ts         # Data aggregation
└── __tests__/                  # Property-based tests
    ├── fifo.test.ts
    ├── net-benefit.test.ts
    └── ...
```

## Usage in Edge Functions

```typescript
import { calculateFIFOLots } from '../_shared/harvestpro/fifo.ts';
import { detectOpportunities } from '../_shared/harvestpro/opportunity-detection.ts';
import type { Lot, HarvestOpportunity } from '../_shared/harvestpro/types.ts';

// Use in your Edge Function
const lots = calculateFIFOLots(transactions);
const opportunities = detectOpportunities(lots);
```

## Testing

Run property-based tests with Deno:

```bash
# Run all tests
deno test supabase/functions/_shared/harvestpro/__tests__/

# Run specific test
deno test supabase/functions/_shared/harvestpro/__tests__/fifo.test.ts

# Run with coverage
deno test --coverage supabase/functions/_shared/harvestpro/__tests__/
```

## Migration Status

Files will be migrated from `src/lib/harvestpro/` to this directory during Phase 2 of the refactoring.

**Current Status:** Infrastructure created, awaiting file migration.

## Next Steps

1. Copy business logic files from `src/lib/harvestpro/`
2. Convert imports to Deno-compatible format
3. Update Edge Functions to use shared logic
4. Run property-based tests in Deno
5. Deploy Edge Functions

See `.kiro/specs/harvestpro/REFACTORING_ACTION_PLAN.md` for details.
