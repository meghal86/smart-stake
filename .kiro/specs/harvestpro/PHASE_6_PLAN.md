# Phase 6: Supabase Edge Functions Implementation

**Status:** READY TO START  
**Date:** 2025-01-26

## Overview

Implement the four core Supabase Edge Functions that contain all HarvestPro business logic. These functions are called by the thin Next.js API routes we validated in Phase 5.

## Architecture Context

```
UI Component
  ↓
Next.js API Route (thin wrapper - COMPLETE ✅)
  ↓
Supabase Edge Function (business logic - THIS PHASE)
  ↓
Database / External Services
```

## Edge Functions to Implement

### 1. harvest-sync-wallets
**Purpose:** Fetch on-chain transaction history and rebuild harvest_lots table

**Responsibilities:**
- Accept wallet addresses from user
- Call blockchain RPC nodes (Alchemy, Infura)
- Parse transaction history
- Identify token transfers (ERC-20, native)
- Calculate cost basis using FIFO
- Insert/update harvest_lots table
- Handle multi-chain (Ethereum, Polygon, Arbitrum, etc.)

**Shared Modules Used:**
- `wallet-connection.ts` - Wallet validation
- `multi-chain-engine.ts` - Multi-chain support
- `fifo.ts` - Cost basis calculation

**Database Tables:**
- Reads: `harvest_user_wallets`
- Writes: `harvest_lots`, `harvest_sync_jobs`

**Performance Target:** < 10s for 1000 transactions

---

### 2. harvest-sync-cex
**Purpose:** Fetch CEX trade history and update harvest_lots table

**Responsibilities:**
- Accept CEX credentials (encrypted)
- Call CEX APIs (Coinbase, Binance, Kraken)
- Parse trade history
- Calculate cost basis using FIFO
- Insert/update harvest_lots table
- Handle rate limits
- Store encrypted credentials

**Shared Modules Used:**
- `cex-integration.ts` - CEX API adapters
- `fifo.ts` - Cost basis calculation
- `credential-encryption.ts` - Credential handling

**Database Tables:**
- Reads: `harvest_cex_connections`
- Writes: `harvest_lots`, `harvest_sync_jobs`

**Performance Target:** < 10s for 1000 trades

---

### 3. harvest-recompute-opportunities
**Purpose:** Heavy optimization engine - compute all harvest opportunities

**Responsibilities:**
- Read all harvest_lots for user
- Calculate unrealized PnL for each lot
- Apply eligibility filters:
  - Loss threshold (> $20)
  - Holding period (> 30 days)
  - Guardian risk score (< 70)
  - Token tradability (liquidity > $10k)
- Calculate net benefit:
  - Tax savings (loss × tax rate)
  - Minus gas cost
  - Minus slippage
  - Minus trading fees
- Classify risk level (low/medium/high)
- Insert/update harvest_opportunities table
- Return sorted opportunities

**Shared Modules Used:**
- `fifo.ts` - Cost basis
- `opportunity-detection.ts` - PnL calculation
- `eligibility.ts` - Eligibility filters
- `net-benefit.ts` - Net benefit calculation
- `risk-classification.ts` - Risk scoring
- `guardian-adapter.ts` - Security scores
- `price-oracle.ts` - Current prices
- `gas-estimation.ts` - Gas costs
- `slippage-estimation.ts` - Slippage costs
- `token-tradability.ts` - Liquidity checks

**Database Tables:**
- Reads: `harvest_lots`, `harvest_user_settings`
- Writes: `harvest_opportunities`

**Performance Target:** < 2s for 100 lots

---

### 4. harvest-notify
**Purpose:** Scheduled function to scan opportunities and send notifications

**Responsibilities:**
- Run on schedule (every 6 hours)
- For each user with notifications enabled:
  - Call harvest-recompute-opportunities
  - Check if new high-value opportunities exist
  - Apply notification threshold ($100 default)
  - Send notification (email/push)
  - Update last_notified timestamp
- Handle rate limits
- Log notification history

**Shared Modules Used:**
- All modules (calls harvest-recompute-opportunities)

**Database Tables:**
- Reads: `harvest_user_settings`, `harvest_opportunities`
- Writes: `harvest_notification_log`

**Performance Target:** < 30s per user

---

## Implementation Order

### Task 1: Implement harvest-sync-wallets
- Create `supabase/functions/harvest-sync-wallets/index.ts`
- Implement wallet transaction fetching
- Implement FIFO lot creation
- Handle multi-chain
- Write unit tests
- Test with real wallet addresses

### Task 2: Implement harvest-sync-cex
- Create `supabase/functions/harvest-sync-cex/index.ts`
- Implement CEX API adapters
- Implement FIFO lot creation
- Handle encrypted credentials
- Write unit tests
- Test with sandbox CEX accounts

### Task 3: Implement harvest-recompute-opportunities
- Create `supabase/functions/harvest-recompute-opportunities/index.ts`
- Implement opportunity detection pipeline
- Integrate all shared modules
- Optimize for performance
- Write unit tests
- Write property-based tests

### Task 4: Implement harvest-notify
- Create `supabase/functions/harvest-notify/index.ts`
- Implement scheduled execution
- Implement notification logic
- Integrate with notification service
- Write unit tests
- Test scheduled execution

### Task 5: Integration Testing
- Test full flow: sync → compute → notify
- Test error handling
- Test rate limiting
- Test performance under load
- Verify database consistency

## Shared Module Dependencies

All Edge Functions will import from:
```
supabase/functions/_shared/harvestpro/
├── types.ts
├── utils.ts
├── fifo.ts
├── opportunity-detection.ts
├── eligibility.ts
├── net-benefit.ts
├── risk-classification.ts
├── guardian-adapter.ts
├── price-oracle.ts
├── gas-estimation.ts
├── slippage-estimation.ts
├── token-tradability.ts
├── multi-chain-engine.ts
├── cex-integration.ts
├── wallet-connection.ts
└── data-aggregation.ts
```

**Status:** All shared modules already migrated in Phase 2 ✅

## Environment Variables Required

```bash
# Blockchain RPC
ALCHEMY_API_KEY=
INFURA_API_KEY=
QUICKNODE_API_KEY=

# CEX APIs
COINBASE_API_KEY=
COINBASE_API_SECRET=
BINANCE_API_KEY=
BINANCE_API_SECRET=

# Price Oracles
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=

# Guardian
GUARDIAN_API_KEY=

# Encryption
ENCRYPTION_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Notifications (for harvest-notify)
SENDGRID_API_KEY=
PUSH_NOTIFICATION_KEY=
```

## Testing Strategy

### Unit Tests
- Test each Edge Function in isolation
- Mock external API calls
- Test error handling
- Test edge cases

### Integration Tests
- Test full sync → compute → notify flow
- Test with real (sandbox) data
- Test database consistency
- Test concurrent requests

### Property-Based Tests
- Test FIFO calculation properties
- Test net benefit calculation properties
- Test eligibility filter properties
- Use fast-check framework

### Performance Tests
- Measure execution time
- Test with large datasets (1000+ lots)
- Verify P95 < targets
- Test memory usage

## Success Criteria

- [ ] All 4 Edge Functions implemented
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All property-based tests passing
- [ ] Performance targets met
- [ ] Error handling robust
- [ ] Logging comprehensive
- [ ] Documentation complete

## Next Steps After Phase 6

Once Edge Functions are complete:
1. Deploy to Supabase staging
2. Run end-to-end tests
3. Deploy to production
4. Monitor performance
5. Begin Phase 7 (UI integration)

## Notes

- Edge Functions run in Deno runtime (not Node.js)
- Use Deno imports: `https://deno.land/std/...`
- All shared modules already Deno-compatible
- Use Supabase client for database access
- Use fetch API for external calls
- Handle timeouts gracefully (max 60s)
- Log all errors for debugging

---

**Ready to start Task 1: Implement harvest-sync-wallets!** 🚀
