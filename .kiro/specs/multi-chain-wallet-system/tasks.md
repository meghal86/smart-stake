# Implementation Plan: Multi-Chain EVM Wallet Enhancement (v2.4)

## IMPLEMENTATION STATUS: 75% COMPLETE

**CRITICAL DISCOVERY**: Multi-chain infra is built, but auth + server registry integration is missing. This plan covers the final 25% to make it actually work end-to-end.

### ✅ COMPLETED TASKS (Already Built)
- [x] **Task 1**: Database Schema Enhancement ✅ **COMPLETE**
- [x] **Task 2**: Network Configuration System ✅ **COMPLETE**  
- [x] **Task 3**: WalletContext Multi-Chain Support ✅ **COMPLETE**
- [x] **Task 4**: useWalletRegistry Enhancement ✅ **COMPLETE**
- [x] **Task 5**: WalletSelector UI Enhancement ✅ **COMPLETE**
- [x] **Task 10**: Backward Compatibility ✅ **COMPLETE**
- [x] **Task 11**: Performance Monitoring ✅ **COMPLETE**
- [x] **Task 12**: Property-Based Testing ✅ **COMPLETE**

### 🔴 REMAINING CRITICAL TASKS (Auth Integration - 25% Remaining)
- [ ] **Task 6**: Auth Integration + Session Persistence (CRITICAL)
- [ ] **Task 7**: Edge Functions for Wallet Management (CRITICAL)
- [ ] **Task 8**: Provider Integration + Route Protection (CRITICAL)
- [ ] **Task 9**: Cross-Module Session Consistency (CRITICAL)

---

## REUSE-FIRST / NO NEW SYSTEMS RULE

**Client-side must reuse existing WalletContext / WalletSelector / useWalletRegistry.**

### Edge Function Exception ✅
- ✅ New files allowed only under `supabase/functions/*`
- ✅ New tiny route guard wrapper allowed (or implement inline in App router)
- ❌ No new wallet contexts/selectors/tables/network systems

---

## Task 6: Auth Integration and Session Persistence 🔴 **CRITICAL**

**Goal**: When user signs in, the app hydrates wallets from server and all modules use the same WalletContext.

**Work**:
- [ ] 6.1 Connect WalletContext ↔ AuthContext
  - WalletContext must read auth session/user from AuthContext
  - On session established → trigger one hydration call (Task 7 wallets-list)
  - On logout → clear wallet state + clear localStorage keys (aw_active_address, aw_active_network)

- [ ] 6.2 Enforce auth flow contracts
  - After sign up / sign in:
    - If `next` exists → redirect to `next` only if allowed (must start with `/` and must not start with `//`)
    - Else:
      - if wallet count == 0 → Guardian onboarding empty state
      - else → `/guardian`
  - Ensure user profile exists (trigger or "ensure profile" on first authenticated request)

- [ ] 6.3 Hydration keyed by userId
  - Prevent stale wallets after user switch
  - Clear wallet state on logout
  - Hydrate only when userId changes

- [ ] 6.4 Provider hierarchy
  - Provider order must be: AuthProvider → WalletProvider → rest
  - WalletProvider must not mount "fake demo wallet state" when user is authenticated

- [ ] 6.5 Integration tests
  - Sign up → session → redirect rule applied
  - Sign in → hydration runs once → wallet list visible in WalletSelector
  - Logout → wallet state cleared

**Files to modify** (no new client files):
- `src/contexts/WalletContext.tsx`
- `src/contexts/AuthContext.tsx` (only if needed)
- `src/providers/ClientProviders.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Login.tsx` (or your existing SignIn route file)

---

## Task 7: Edge Functions for Wallet Management 🔴 **CRITICAL**

**Goal**: Server authoritative wallet registry:
- SELECT is allowed from client
- ALL mutations happen via Edge Functions (service role)

**Work**:
- [ ] 7.1 GET /functions/v1/wallets-list
  - Returns: wallets + quota + active_hint (primary wallet id)

- [ ] 7.2 POST /functions/v1/wallets-add-watch
  - Validate CAIP-2 network exists in supported config
  - Normalize address (lowercase key)
  - ENS resolution supported (if *.eth)
  - Reject private keys / seed phrases / suspicious input
  - Enforce plan quota (free: e.g., 3 wallets)

- [ ] 7.3 POST /functions/v1/wallets-remove
  - Verify wallet belongs to auth user
  - If removing primary wallet, pick a new primary deterministically

- [ ] 7.4 POST /functions/v1/wallets-set-primary
  - Enforce only 1 primary wallet per user

- [ ] 7.5 Edge function tests
  - 401 unauth, 403 forbidden, 409 duplicate, 422 validation
  - Direct client insert/update/delete returns 403 after RLS changes (Task 8/DB)

**Files to create** ✅ (allowed):
- `supabase/functions/wallets-list/index.ts`
- `supabase/functions/wallets-add-watch/index.ts`
- `supabase/functions/wallets-remove/index.ts`
- `supabase/functions/wallets-remove-address/index.ts`
- `supabase/functions/wallets-set-primary/index.ts`

---

## Task 8: Provider Integration and Route Protection 🔴 **CRITICAL**

**Goal**: Users can't use Guardian/Hunter/HarvestPro without auth + hydrated wallets, and localStorage is no longer the wallet source of truth.

### Route Map (LOCK)
- **Public**: `/`, `/login`, `/signup`, `/signin` (alias to `/login`)
- **Protected**: `/guardian`, `/hunter`, `/harvestpro`

**Work**:
- [ ] 8.1 Update useWalletRegistry to call Edge Functions
  - Replace direct Supabase client mutations with Edge Function calls
  - Reads can remain client-side SELECT if needed (but list should come from wallets-list)

- [ ] 8.2 Implement route protection
  - Any protected route without session → redirect to `/login?next=<path>`
  - After login → apply redirect rules in Task 6.2

- [ ] 8.3 Add /signin alias → /login
  - `/signin` redirects to `/login` preserving query params

- [ ] 8.4 LocalStorage rule
  - **Allowed**: `aw_active_address`, `aw_active_network`, UI preferences only
  - **Forbidden**: storing wallet list as source of truth

- [ ] 8.5 Add DB invariants migration (if not already present)
  - Unique `(user_id, address_lc, chain_namespace)`
  - Unique `is_primary=true` per user

- [ ] 8.6 Route protection tests
  - Unauthed → redirect works
  - Authed + no wallets → `/guardian` shows onboarding empty state
  - Authed + wallets → `/guardian` default

**Files to modify**:
- `src/hooks/useWalletRegistry.ts`
- `src/contexts/WalletContext.tsx`
- `src/App.tsx` (or your router file)
- `supabase/migrations/*` (new migration if constraints aren't in place)

---

## Task 9: Cross-Module Session Consistency 🔴 **CRITICAL**

**Goal**: Guardian/Hunter/HarvestPro never keep their own wallet state. All read from WalletContext.

**Work**:
- [ ] 9.1 Guardian uses WalletContext only
- [ ] 9.2 Hunter uses WalletContext only
- [ ] 9.3 HarvestPro uses WalletContext only
- [ ] 9.4 Cross-module E2E tests
  - Switch wallet/network → all modules reflect change
  - Refresh → hydration restores state and modules remain consistent

---

## PRODUCTION-GRADE IMPLEMENTATION TASKS

### Task 10: Wallet Shape Adapter + Production Fixes 🔴 **CRITICAL**

**Goal**: Implement production-grade fixes for shape adapters, quota semantics, migration safety, and consistency.

**Work**:
- [ ] 10.1 Implement wallet shape adapter in WalletProvider
  - Convert flat rows from `wallets-list` to UI-friendly `ConnectedWallet[]` shape
  - Group by address, merge network metadata
  - Derive `primaryAddress` from `active_hint.primary_wallet_id`

- [ ] 10.2 Implement quota semantics
  - Quota counts unique addresses, not rows
  - Update `wallets-list` response with `used_addresses` and `used_rows`
  - Enforce quota in `wallets-add-watch` (check unique addresses)

- [ ] 10.3 Add remove behavior options
  - Implement `wallets-remove` (single row removal)
  - Implement `wallets-remove-address` (all rows for address)
  - OR add mode flag: `{ "wallet_id": "uuid", "mode": "row" | "address" }`

- [ ] 10.4 Migration safety implementation
  - Add pre-migration cleanup to fix multiple primaries
  - Deterministic primary selection (oldest `created_at` wins)
  - Ensure every user has exactly one primary before constraint creation

- [ ] 10.5 Active selection consistency
  - Fix localStorage key references to `aw_active_address`/`aw_active_network`
  - Implement validity check after hydration
  - Auto-primary for first wallet in `wallets-add-watch`

**Files to modify**:
- `src/contexts/WalletContext.tsx` (shape adapter)
- `supabase/functions/wallets-list/index.ts` (quota response)
- `supabase/functions/wallets-add-watch/index.ts` (quota enforcement, auto-primary)
- `supabase/functions/wallets-remove-address/index.ts` (new function)
- `supabase/migrations/*` (pre-migration cleanup)

### Task 11: Edge Function Security Hardening 🔴 **CRITICAL**

**Goal**: Implement production-grade security for all Edge Functions.

**Work**:
- [ ] 11.1 CORS + OPTIONS preflight handling
  - Every Edge Function responds to OPTIONS requests
  - Include required CORS headers: `authorization`, `content-type`

- [ ] 11.2 Two-client pattern implementation
  - JWT-bound client only for `auth.getUser()`
  - Service-role client for all DB operations
  - Never trust `user_id` from request body

- [ ] 11.3 Database privilege hardening
  - REVOKE INSERT/UPDATE/DELETE from `anon` and `authenticated` on `user_wallets`
  - Combine with existing RLS policies for bulletproof security

- [ ] 11.4 Rate limiting implementation
  - Per-user rate limits: 10/min for wallet mutations
  - Short timeouts for ENS/RPC resolution
  - Use Upstash Redis for rate limiting

**Files to modify**:
- All Edge Functions under `supabase/functions/wallets-*/`
- `supabase/migrations/*` (REVOKE privileges)

### Task 12: Critical Acceptance Tests 🔴 **CRITICAL**

**Goal**: Implement minimum acceptance tests to prevent production bugs.

**Work**:
- [ ] 12.1 CORS acceptance tests
  - Browser can call all Edge Functions with OPTIONS + Authorization header
  - Verify preflight handling works correctly

- [ ] 12.2 Quota acceptance tests
  - Multi-network additions don't incorrectly burn quota
  - Quota enforcement works correctly
  - Address vs row counting validation

- [ ] 12.3 Primary wallet consistency tests
  - Cannot end up with >1 primary even under concurrent requests
  - Primary selection logic works deterministically
  - Migration cleanup handles edge cases

- [ ] 12.4 Shape adapter tests
  - Server rows → UI wallet list without duplicates
  - Correct network badges and metadata merging
  - Primary address derivation works correctly

- [ ] 12.5 localStorage fallback tests
  - Removing wallet/network doesn't brick active selection
  - Validity check restores correct fallback selection
  - First wallet auto-primary behavior

**Files to create**:
- `src/__tests__/integration/WalletShapeAdapter.test.tsx`
- `src/__tests__/integration/QuotaSemantics.test.tsx`
- `src/__tests__/integration/PrimaryWalletConsistency.test.tsx`
- `src/__tests__/integration/ActiveSelectionFallback.test.tsx`
- `src/__tests__/e2e/EdgeFunctionCORS.test.ts`

---

## PRODUCTION-GRADE IMPLEMENTATION TASKS

### Task 10: Wallet Shape Adapter + Production Fixes 🔴 **CRITICAL**

**Goal**: Implement production-grade fixes for shape adapters, quota semantics, migration safety, and consistency.

**Work**:
- [ ] 10.1 Implement wallet shape adapter in WalletProvider
  - Convert flat rows from `wallets-list` to UI-friendly `ConnectedWallet[]` shape
  - Group by address, merge network metadata
  - Derive `primaryAddress` from `active_hint.primary_wallet_id`

- [ ] 10.2 Implement quota semantics
  - Quota counts unique addresses, not rows
  - Update `wallets-list` response with `used_addresses` and `used_rows`
  - Enforce quota in `wallets-add-watch` (check unique addresses)

- [ ] 10.3 Add remove behavior options
  - Implement `wallets-remove` (single row removal)
  - Implement `wallets-remove-address` (all rows for address)
  - OR add mode flag: `{ "wallet_id": "uuid", "mode": "row" | "address" }`

- [ ] 10.4 Migration safety implementation
  - Add pre-migration cleanup to fix multiple primaries
  - Deterministic primary selection (oldest `created_at` wins)
  - Ensure every user has exactly one primary before constraint creation

- [ ] 10.5 Active selection consistency
  - Fix localStorage key references to `aw_active_address`/`aw_active_network`
  - Implement validity check after hydration
  - Auto-primary for first wallet in `wallets-add-watch`

**Files to modify**:
- `src/contexts/WalletContext.tsx` (shape adapter)
- `supabase/functions/wallets-list/index.ts` (quota response)
- `supabase/functions/wallets-add-watch/index.ts` (quota enforcement, auto-primary)
- `supabase/functions/wallets-remove-address/index.ts` (new function)
- `supabase/migrations/*` (pre-migration cleanup)

### Task 11: Edge Function Security Hardening 🔴 **CRITICAL**

**Goal**: Implement production-grade security for all Edge Functions.

**Work**:
- [ ] 11.1 CORS + OPTIONS preflight handling
  - Every Edge Function responds to OPTIONS requests
  - Include required CORS headers: `authorization`, `content-type`

- [ ] 11.2 Two-client pattern implementation
  - JWT-bound client only for `auth.getUser()`
  - Service-role client for all DB operations
  - Never trust `user_id` from request body

- [ ] 11.3 Database privilege hardening
  - REVOKE INSERT/UPDATE/DELETE from `anon` and `authenticated` on `user_wallets`
  - Combine with existing RLS policies for bulletproof security

- [ ] 11.4 Rate limiting implementation
  - Per-user rate limits: 10/min for wallet mutations
  - Short timeouts for ENS/RPC resolution
  - Use Upstash Redis for rate limiting

- [ ] 11.5 Deterministic ordering
  - `wallets-list` returns rows sorted: primary first, then `created_at DESC`, tie-breaker `id ASC`
  - Shape adapter preserves stable ordering

**Files to modify**:
- All Edge Functions under `supabase/functions/wallets-*/`
- `supabase/migrations/*` (REVOKE privileges)

### Task 12: Critical Acceptance Tests 🔴 **CRITICAL**

**Goal**: Implement minimum acceptance tests to prevent production bugs.

**Work**:
- [ ] 12.1 CORS acceptance tests
  - Browser can call all Edge Functions with OPTIONS + Authorization header
  - Verify preflight handling works correctly

- [ ] 12.2 Quota acceptance tests
  - Multi-network additions don't incorrectly burn quota
  - Quota enforcement works correctly
  - Address vs row counting validation

- [ ] 12.3 Primary wallet consistency tests
  - Cannot end up with >1 primary even under concurrent requests
  - Primary selection logic works deterministically
  - Migration cleanup handles edge cases

- [ ] 12.4 Shape adapter tests
  - Server rows → UI wallet list without duplicates
  - Correct network badges and metadata merging
  - Primary address derivation works correctly

- [ ] 12.5 localStorage fallback tests
  - Removing wallet/network doesn't brick active selection
  - Validity check restores correct fallback selection
  - First wallet auto-primary behavior

- [ ] 12.6 Concurrency safety tests
  - Atomic primary operations under concurrent requests
  - Idempotency key handling prevents duplicate operations
  - ENS resolution timeout and caching behavior

- [ ] 12.7 Connected wallet integration tests
  - wagmi connection prompts for registry addition
  - Auto-add behavior respects quota limits
  - Connected wallet appears in registry correctly

**Files to create**:
- `src/__tests__/integration/WalletShapeAdapter.test.tsx`
- `src/__tests__/integration/QuotaSemantics.test.tsx`
- `src/__tests__/integration/PrimaryWalletConsistency.test.tsx`
- `src/__tests__/integration/ActiveSelectionFallback.test.tsx`
- `src/__tests__/e2e/EdgeFunctionCORS.test.ts`
- `src/__tests__/integration/ConcurrencySafety.test.tsx`
- `src/__tests__/integration/ConnectedWalletIntegration.test.tsx`

---

## Definition of Done (Non-Negotiable)

- ✅ Refreshing the page shows the same wallet list from server (not localStorage)
- ✅ Adding/removing wallets works only via Edge Functions
- ✅ Unauthed users cannot access protected modules
- ✅ Switching network never changes active wallet address
- ✅ WalletSelector shows the hydrated wallets across all modules
- ✅ **NEW**: Wallet shape adapter converts DB rows to UI-friendly format without duplicates
- ✅ **NEW**: Quota counts unique addresses, not rows (multi-network doesn't burn quota)
- ✅ **NEW**: Cannot end up with >1 primary wallet even under concurrent requests
- ✅ **NEW**: localStorage selection fallback works when wallet/network removed
- ✅ **NEW**: All Edge Functions handle CORS preflight and use two-client security pattern
- ✅ **NEW**: Migration runs safely without constraint violations
- ✅ **NEW**: First wallet automatically becomes primary
- ✅ **NEW**: ENS resolution uses Ethereum mainnet with proper timeout/caching
- ✅ **NEW**: Connected wallet (wagmi) integration prompts for registry addition
- ✅ **NEW**: Deterministic ordering prevents "newest row" selection bugs
- ✅ **NEW**: Idempotency keys prevent double-click duplicate operations
- ✅ **NEW**: Wallet shape adapter converts DB rows to UI-friendly format without duplicates
- ✅ **NEW**: Quota counts unique addresses, not rows (multi-network doesn't burn quota)
- ✅ **NEW**: Cannot end up with >1 primary wallet even under concurrent requests
- ✅ **NEW**: localStorage selection fallback works when wallet/network removed
- ✅ **NEW**: All Edge Functions handle CORS preflight and use two-client security pattern
- ✅ **NEW**: Migration runs safely without constraint violations
- ✅ **NEW**: First wallet automatically becomes primary