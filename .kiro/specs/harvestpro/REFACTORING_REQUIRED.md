# HarvestPro v1 Refactoring Required

**Date:** November 24, 2025  
**Status:** ⚠️ **ARCHITECTURE VIOLATION - REFACTORING REQUIRED**

## Summary

Tasks 1-20 are **functionally complete** but **architecturally incorrect**. All business logic must be moved from `src/lib/harvestpro/` to Supabase Edge Functions.

## What's Pending: Complete Refactoring

### ❌ CRITICAL VIOLATION: Business Logic Location

**Current (WRONG):**
```
src/lib/harvestpro/
├── fifo.ts                      ❌ Should be in Edge Function
├── opportunity-detection.ts     ❌ Should be in Edge Function
├── eligibility.ts               ❌ Should be in Edge Function
├── net-benefit.ts               ❌ Should be in Edge Function
├── risk-classification.ts       ❌ Should be in Edge Function
├── guardian-adapter.ts          ❌ Should be in Edge Function
├── price-oracle.ts              ❌ Should be in Edge Function
├── gas-estimation.ts            ❌ Should be in Edge Function
├── slippage-estimation.ts       ❌ Should be in Edge Function
├── cex-integration.ts           ❌ Should be in Edge Function
├── wallet-connection.ts         ❌ Should be in Edge Function
└── data-aggregation.ts          ❌ Should be in Edge Function
```

**Target (CORRECT):**
```
supabase/functions/
├── harvest-sync-wallets/
│   └── index.ts                 ✅ FIFO + wallet sync
├── harvest-sync-cex/
│   └── index.ts                 ✅ CEX integration
├── harvest-recompute-opportunities/
│   └── index.ts                 ✅ All calculations
├── harvest-notify/
│   └── index.ts                 ✅ Notifications
└── _shared/harvestpro/
    ├── fifo.ts                  ✅ Moved from src/lib
    ├── net-benefit.ts           ✅ Moved from src/lib
    ├── eligibility.ts           ✅ Moved from src/lib
    └── ...                      ✅ All business logic
```

## Task-by-Task Refactoring Checklist

### ✅ Task 1: Database Schema
**Status:** Complete - No changes needed  
**Reason:** Database schema is correct

### ❌ Task 2: FIFO Engine
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/fifo.ts`  
**Target:** `supabase/functions/_shared/harvestpro/fifo.ts`  
**Used by:** `harvest-sync-wallets` Edge Function

### ❌ Task 2.1: FIFO Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/fifo.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/fifo.test.ts`

### ❌ Task 3: Opportunity Detection
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/opportunity-detection.ts`  
**Target:** `supabase/functions/_shared/harvestpro/opportunity-detection.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 3.1: Eligibility Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/eligibility.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/eligibility.test.ts`

### ❌ Task 4: Eligibility Filtering
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/eligibility.ts`  
**Target:** `supabase/functions/_shared/harvestpro/eligibility.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 4.1: Net Benefit Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/net-benefit.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/net-benefit.test.ts`

### ❌ Task 5: Net Benefit Calculation
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/net-benefit.ts`  
**Target:** `supabase/functions/_shared/harvestpro/net-benefit.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 5.1: Risk Classification Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/risk-classification.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/risk-classification.test.ts`

### ❌ Task 6: Guardian Adapter
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/guardian-adapter.ts`  
**Target:** `supabase/functions/_shared/harvestpro/guardian-adapter.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 6.1: Risk Classification
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/risk-classification.ts`  
**Target:** `supabase/functions/_shared/harvestpro/risk-classification.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 7: Wallet Connection
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/wallet-connection.ts`  
**Target:** `supabase/functions/_shared/harvestpro/wallet-connection.ts`  
**Used by:** `harvest-sync-wallets` Edge Function

### ❌ Task 7.1: Credential Encryption Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/credential-encryption.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/credential-encryption.test.ts`

### ❌ Task 8: CEX Integration
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/cex-integration.ts`  
**Target:** `supabase/functions/_shared/harvestpro/cex-integration.ts`  
**Used by:** `harvest-sync-cex` Edge Function

### ❌ Task 8.1: Data Aggregation Property Test
**Status:** NEEDS MOVING  
**Current:** `src/lib/harvestpro/__tests__/data-aggregation.test.ts`  
**Target:** `supabase/functions/_shared/harvestpro/__tests__/data-aggregation.test.ts`

### ❌ Task 9: Price Oracle
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/price-oracle.ts`  
**Target:** `supabase/functions/_shared/harvestpro/price-oracle.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 9.1: Gas Estimation
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/gas-estimation.ts`  
**Target:** `supabase/functions/_shared/harvestpro/gas-estimation.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 9.2: Slippage Estimation
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/slippage-estimation.ts`  
**Target:** `supabase/functions/_shared/harvestpro/slippage-estimation.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 9.3: Token Tradability
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/token-tradability.ts`  
**Target:** `supabase/functions/_shared/harvestpro/token-tradability.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ❌ Task 9.4: Multi-Chain Engine
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/multi-chain-engine.ts`  
**Target:** `supabase/functions/_shared/harvestpro/multi-chain-engine.ts`  
**Used by:** `harvest-recompute-opportunities` Edge Function

### ✅ Task 10: Dashboard UI
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 10.1: Loading Skeletons
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 10.2: Empty States
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 11: Opportunity Cards
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 11.1: Card Unit Tests
**Status:** Complete - No changes needed  
**Reason:** UI tests are correct

### ✅ Task 12: Filtering System
**Status:** Complete - No changes needed  
**Reason:** Client-side filtering is acceptable for UI state

### ✅ Task 12.1: Filter Property Test
**Status:** Complete - No changes needed  
**Reason:** Client-side filter logic is acceptable

### ⚠️ Task 13: Opportunities API
**Status:** NEEDS MINOR FIXES  
**File:** `src/app/api/harvest/opportunities/route.ts`  
**Issues:**
- Remove `calculateGasEfficiencyGrade()` function (lines 31-42)
- Remove summary aggregation calculations (lines 145-151)
- Replace with database view or pre-computed values

### ✅ Task 13.1: API Integration Tests
**Status:** Complete - No changes needed  
**Reason:** Tests are correct

### ✅ Task 14: Detail Modal
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 15: Session Management
**Status:** Complete - No changes needed  
**Reason:** Simple CRUD operations are acceptable in API routes

### ✅ Task 15.1: Session State Property Test
**Status:** Complete - No changes needed  
**Reason:** State machine logic is simple enough for client

### ❌ Task 16: Action Engine Simulator
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/action-engine-simulator.ts`  
**Target:** `supabase/functions/_shared/harvestpro/action-engine-simulator.ts`  
**Used by:** Execution Edge Functions

### ✅ Task 16.1: Action Engine Integration
**Status:** Complete - No changes needed  
**Reason:** UI orchestration is correct

### ❌ Task 17: CEX Execution
**Status:** NEEDS REFACTORING  
**Current:** `src/lib/harvestpro/cex-execution.ts`  
**Target:** `supabase/functions/_shared/harvestpro/cex-execution.ts`  
**Used by:** Execution Edge Functions

### ✅ Task 18: Success Screen
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 19: CSV Export
**Status:** Complete - No changes needed  
**Reason:** Light formatting in API route is acceptable

### ✅ Task 19.1: CSV Property Tests
**Status:** Complete - No changes needed  
**Reason:** Tests are correct

### ✅ Task 20: Proof-of-Harvest Page
**Status:** Complete - No changes needed  
**Reason:** UI components are presentation-only (correct)

### ✅ Task 20.1: Proof Hash Property Test
**Status:** Complete - No changes needed  
**Reason:** Cryptographic hashing can remain in API route

## Summary Statistics

| Category | Complete | Needs Refactoring | Total |
|----------|----------|-------------------|-------|
| Database/Schema | 1 | 0 | 1 |
| Business Logic | 0 | 12 | 12 |
| Property Tests | 0 | 8 | 8 |
| UI Components | 8 | 0 | 8 |
| API Routes | 4 | 1 | 5 |
| **TOTAL** | **13** | **21** | **34** |

**Completion Rate:** 38% architecturally correct, 62% needs refactoring

## Required Edge Functions (Missing)

### 1. harvest-sync-wallets
**Purpose:** Fetch on-chain transaction history, rebuild harvest_lots  
**Contains:**
- `fifo.ts` - FIFO cost basis calculation
- `wallet-connection.ts` - Wallet data fetching
- Transaction processing logic

### 2. harvest-sync-cex
**Purpose:** Call CEX APIs, update cex_trades and harvest_lots  
**Contains:**
- `cex-integration.ts` - CEX API integration
- `data-aggregation.ts` - Data aggregation
- Trade history processing

### 3. harvest-recompute-opportunities
**Purpose:** Heavy optimization - compute PnL, eligibility, net benefit  
**Contains:**
- `opportunity-detection.ts` - Opportunity detection
- `eligibility.ts` - Eligibility filtering
- `net-benefit.ts` - Net benefit calculation
- `risk-classification.ts` - Risk classification
- `guardian-adapter.ts` - Guardian integration
- `price-oracle.ts` - Price fetching
- `gas-estimation.ts` - Gas estimation
- `slippage-estimation.ts` - Slippage estimation
- `token-tradability.ts` - Tradability checks
- `multi-chain-engine.ts` - Multi-chain support

### 4. harvest-notify
**Purpose:** Scan opportunities, send notifications (scheduled)  
**Contains:**
- Notification threshold checking
- Push notification sending
- Email notification sending

## Refactoring Effort Estimate

| Phase | Tasks | Effort | Priority |
|-------|-------|--------|----------|
| **Phase 1: Create Edge Functions** | Create 4 Edge Functions | 2-3 days | CRITICAL |
| **Phase 2: Move Business Logic** | Move 12 files + 8 tests | 1-2 days | CRITICAL |
| **Phase 3: Update API Routes** | Fix 1 API route | 1 day | HIGH |
| **Phase 4: Test & Validate** | End-to-end testing | 1 day | HIGH |
| **TOTAL** | | **5-7 days** | |

## Why This Matters

### Security Risks
- ❌ Tax calculations exposed in client-accessible code
- ❌ Business logic can be manipulated by users
- ❌ No server-side validation of calculations

### Compliance Risks
- ❌ Tax calculations not auditable
- ❌ No deterministic server-side proof
- ❌ Regulatory risk for institutional users

### Performance Issues
- ❌ Heavy calculations in Next.js instead of Edge runtime
- ❌ Cannot leverage Edge Function caching
- ❌ Slower response times

### Maintainability Issues
- ❌ Logic scattered between client and server
- ❌ Difficult to test in isolation
- ❌ Cannot reuse for OaaS model

## Recommendation

**DO NOT PROCEED WITH v2/v3 UNTIL v1 IS REFACTORED**

The current implementation violates the core architectural principle. Refactoring must happen before adding more features to avoid compounding the technical debt.

---

**Created:** November 24, 2025  
**Status:** ⚠️ REFACTORING REQUIRED  
**Next Action:** Create Edge Functions and move business logic

