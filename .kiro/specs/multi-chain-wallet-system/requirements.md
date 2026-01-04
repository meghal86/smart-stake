# Multi-Chain EVM Wallet System Requirements (v2.4.1)

## Introduction
The AlphaWhale multi-chain wallet system enables users to manage multiple EVM wallet addresses across multiple EVM networks through a unified, **server-authoritative** registry. The system integrates with **Guardian**, **Hunter**, and **HarvestPro** while maintaining strict security, performance, and UX standards.

## Glossary
- **System**: Multi-chain EVM wallet management system
- **User**: Authenticated AlphaWhale platform user
- **Wallet**: Ethereum-compatible wallet address
- **Network**: EVM blockchain network identified via CAIP-2 (`eip155:<chainId>`)
- **Active_Wallet**: Currently selected wallet address (address-level)
- **Active_Network**: Currently selected network (`chain_namespace`)
- **Wallet_Registry**: Server-side database of wallet addresses + network associations
- **Session**: Authenticated user session (Supabase JWT)

## Requirements

### Requirement 1: Multi-Chain Network Support
**User Story:** As a user, I want to manage wallets across multiple EVM networks, so I can track assets and activity on different chains from one interface.

**Acceptance Criteria**
1. The System SHALL support Ethereum mainnet (`eip155:1`) as the primary network.
2. The System SHALL support Polygon (`eip155:137`), Arbitrum (`eip155:42161`), Optimism (`eip155:10`), and Base (`eip155:8453`).
3. When a user switches networks, the System SHALL preserve the active wallet address.
4. The System SHALL use CAIP-2 format for all network identifiers.
5. When a network is unavailable, the System SHALL display clear error messages and fallback options.

---

### Requirement 2: Authenticated Wallet Registry (Server Source of Truth)
**User Story:** As a user, I want my wallets to persist across sessions, so I don’t have to re-add them every time.

**Acceptance Criteria**
1. When a user signs in, the System SHALL hydrate the wallet registry from the server database.
2. The System SHALL store registry data in `user_wallets` as the source of truth (not localStorage).
3. When a user adds/removes/updates a wallet, the System SHALL persist changes **via Edge Functions**.
4. The System SHALL prevent direct client-side mutations of `user_wallets`.
5. After refresh, the wallet list displayed in UI SHALL match server state.

---

### Requirement 3: Route Protection and Authentication Flow
**User Story:** As a platform owner, I want only authenticated users to access wallet features, so user data stays secure and correctly associated.

**Acceptance Criteria**
1. When an unauthenticated user accesses a protected route, the System SHALL redirect to `/login?next=<path>`.
2. The System SHALL validate `next` to prevent open redirects (**must start with `/`** and **must not start with `//`**).
3. After successful login, the System SHALL redirect to `next` if valid, otherwise apply default routing.
4. If the authenticated user has **zero wallets**, the System SHALL render Guardian onboarding empty state (within `/guardian`).
5. If the authenticated user has **≥1 wallet**, the System SHALL route to `/guardian` by default.
6. The System SHALL treat `/signin` as an alias to `/login`, preserving all query parameters.
7. Example: `/signin?next=/guardian` SHALL redirect to `/login?next=/guardian`.

---

### Requirement 4: Cross-Module Session Consistency
**User Story:** As a user, I want wallet changes to reflect across Guardian/Hunter/HarvestPro, so the app stays consistent.

**Acceptance Criteria**
1. When a user switches wallets/networks in any module, all other modules SHALL reflect the change immediately.
2. Guardian SHALL read wallet state only from authenticated WalletContext.
3. Hunter SHALL read wallet state only from authenticated WalletContext.
4. HarvestPro SHALL read wallet state only from authenticated WalletContext.
5. The System SHALL prevent modules from maintaining independent wallet lists or “demo-mode” wallet state when authenticated.

---

### Requirement 5: Wallet Addition and Validation
**User Story:** As a user, I want to add wallets safely, so I can trust the system with my wallet info.

**Acceptance Criteria**
1. If input ends with `.eth`, the System SHALL resolve ENS to an address using Ethereum mainnet resolver.
2. If user input matches a private-key-like pattern (64 hex characters with optional '0x' prefix), the System SHALL reject with validation error code `PRIVATE_KEY_DETECTED`.
3. If user input matches a seed-phrase-like pattern (12 or more space-separated words), the System SHALL reject with validation error code `SEED_PHRASE_DETECTED`.
4. If user adds a duplicate `(address, network)` pair, the System SHALL return **409 Conflict** with `WALLET_DUPLICATE`.
5. If the user adds their **first wallet**, the System SHALL automatically set it as primary.

---

### Requirement 6: Network Switching and State Management
**User Story:** As a user, I want seamless network switching to view multi-chain data quickly.

**Acceptance Criteria**
1. Network switches SHALL complete within **2 seconds** (P95).
2. If the active wallet is not registered on the selected network, the UI SHALL show **“Not added on this network”**.
3. The UI SHALL offer **“Add network”** for missing wallet-network combinations.
4. The System SHALL keep network-specific data isolated (balances, Guardian scores) by `chain_namespace`.
5. The System SHALL emit `wallet_switched` and `network_switched` events on state changes to enable module reactivity.

---

### Requirement 7: Quota Management and Enforcement
**User Story:** As a platform owner, I want plan-based wallet limits enforced, so we can tier service and manage resources.

**Acceptance Criteria**
1. Quota SHALL count **unique wallet addresses** (case-insensitive) per user, NOT `(address, network)` row tuples.
2. Example: Adding address `0xabc` on Ethereum + Polygon = **1 quota unit used** (not 2).
3. Example: Adding address `0xdef` on Ethereum = **2 quota units used** (new address).
4. The System SHALL check quota BEFORE allowing any new address addition.
5. When quota is reached, adding a **new address** SHALL be rejected with **409** `QUOTA_EXCEEDED`.
6. Adding an existing address on a new network SHALL NOT consume additional quota.
7. The UI SHALL display quota usage (`used_addresses`, `used_rows`, `total`) for the user.
8. Quota enforcement SHALL occur server-side in Edge Functions.

---

### Requirement 8: Primary Wallet Management (Address-Level Primary)
**User Story:** As a user, I want a primary wallet, so the app has a deterministic default.

**Acceptance Criteria**
1. The System SHALL ensure only **one primary** wallet per user.
2. Primary updates SHALL be **atomic** to prevent race conditions.
3. **Primary Semantics:** Primary is set at the **address level** - when an address is marked primary, the System chooses one representative row for that address to mark `is_primary = true`.
4. When choosing the representative row to mark primary for an address, the System SHALL prefer:
   1) row matching `Active_Network`
   2) else `eip155:1` row
   3) else any row for that address
5. If the primary wallet row is deleted, the System SHALL reassign primary to another row for that address using this priority:
   1) Row with `chain_namespace = 'eip155:1'` (Ethereum mainnet)
   2) Oldest row by `created_at` (tiebreaker: smallest `id`)
   3) If no other rows exist for that address, pick any row from another address in priority order above.
6. Primary reassignment SHALL be atomic with deletion (same transaction).
7. The System SHALL never allow the database to contain >1 primary row per user.

---

### Requirement 9: Database Security and Integrity
**User Story:** As a platform owner, I want strong data integrity + security for wallet records.

**Acceptance Criteria**
1. The System SHALL enforce uniqueness on `(user_id, address_lc, chain_namespace)`.
2. The System SHALL store `address_lc` as lowercase for consistent lookups.
3. Client-side access to `user_wallets` SHALL be **SELECT-only**.
4. INSERT/UPDATE/DELETE SHALL be possible only via Edge Functions (service role).
5. RLS policies SHALL ensure users can only read their own rows.

---

### Requirement 10: Error Handling and Recovery
**User Story:** As a user, I want clear errors and graceful fallbacks.

**Acceptance Criteria**
1. When network requests fail, the UI SHALL show user-friendly errors.
2. If ENS resolution fails, the API SHALL return **422** with `ENS_RESOLUTION_FAILED`.
3. If rate limit exceeded, the API SHALL return **429** with `RATE_LIMITED` and retry guidance.
4. If Edge Functions are unavailable, the UI SHOULD show cached data with an offline indicator (when available).
5. All critical flows SHALL have safe failure behavior (no broken state).

---

### Requirement 11: Performance and Caching
**User Story:** As a user, I want fast operations and responsive UX.

**Acceptance Criteria**
1. Network switching P95 SHALL be ≤ 2 seconds.
2. Network-specific caches (balances, Guardian scores) SHALL be stored per-network (JSONB).
3. Database indexes SHALL support efficient lookup by `(user_id, chain_namespace)`.
4. Wallet mutation endpoints SHALL be rate limited at **10/min per user**.
5. ENS resolution results SHALL be cached for **10 minutes**.

---

### Requirement 12: Integration with External Wallet Providers (RainbowKit/wagmi)
**User Story:** As a user, I want to easily add wallets I already connect with.

**Acceptance Criteria**
1. When a wallet is connected via RainbowKit, the UI SHALL prompt: **“Add this wallet to your registry?”** (default yes).
2. The System SHALL prevent “connected but nothing shows” by clear prompting and UI feedback.
3. If adding would exceed quota, the UI SHALL show an actionable error and not add.
4. Existing RainbowKit/wagmi integration SHALL remain compatible.
5. The prompt workflow SHALL not block core navigation if the user declines.

---

### Requirement 13: Edge Function Contracts (Exact APIs)
**User Story:** As a platform owner, I want stable APIs, so client + server stay aligned.

**Acceptance Criteria**
1. The System SHALL implement:
   - `GET  /functions/v1/wallets-list`
   - `POST /functions/v1/wallets-add-watch`
   - `POST /functions/v1/wallets-remove`
   - `POST /functions/v1/wallets-remove-address`
   - `POST /functions/v1/wallets-set-primary`
2. All Edge Function calls SHALL require `Authorization: Bearer <supabase_jwt>`.
3. Error responses SHALL follow `{ "error": { "code": "...", "message": "..." } }`.
4. Status codes MUST include: 401, 403, 409, 422, 429.
5. `wallets-list` MUST return deterministic ordering suitable for stable UI restoration.

**wallets-list Response Shape (MANDATORY)**:
```json
{
  "wallets": [
    {
      "id": "uuid",
      "address": "0x...",
      "chain_namespace": "eip155:1",
      "is_primary": true,
      "guardian_scores": {},
      "balance_cache": {}
    }
  ],
  "quota": { "used_addresses": 2, "used_rows": 4, "total": 5, "plan": "free" },
  "active_hint": { "primary_wallet_id": "uuid" }
}
```

**wallets-add-watch Request Body**:
```json
{
  "address_or_ens": "vitalik.eth",
  "chain_namespace": "eip155:1",
  "label": "Main"
}
```

**wallets-add-watch Response (200 OK)**:
```json
{ "wallet": { "id", "address", "chain_namespace", "is_primary", ... } }
```

**wallets-add-watch Response (409 Conflict)**:
```json
{ "error": { "code": "WALLET_DUPLICATE", "message": "Wallet already exists for this network" } }
```

**wallets-add-watch Response (422 Validation)**:
```json
{ "error": { "code": "INVALID_ADDRESS", "message": "..." } }
```

---

### Requirement 14: CORS + Preflight (Browser Compatibility)
**User Story:** As a user, I want wallet actions to work reliably in the browser.

**Acceptance Criteria**
1. Every Edge Function SHALL handle `OPTIONS` preflight.
2. Responses SHALL include `Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info, idempotency-key`.
3. Responses SHALL include allowed methods (GET/POST/OPTIONS).
4. Browser calls MUST succeed without CORS errors.
5. Preflight MUST succeed even when unauthenticated (main call returns 401).

---

### Requirement 15: Deterministic Ordering + Active Selection Restoration
**User Story:** As a user, I want stable wallet ordering and reliable “return to last state.”

**Acceptance Criteria**
1. `wallets-list` SHALL return rows sorted by: `is_primary DESC, created_at DESC, id ASC`.
2. This deterministic ordering ensures WalletProvider can reliably restore state on page refresh.
3. Example output:
   ```json
   [
     { "id": "uuid-1", "is_primary": true, "created_at": "2026-01-01" },
     { "id": "uuid-3", "is_primary": false, "created_at": "2025-12-30" },
     { "id": "uuid-2", "is_primary": false, "created_at": "2025-12-29" }
   ]
   ```
4. WalletProvider SHALL restore active selection using:
   1) localStorage `(aw_active_address, aw_active_network)` if valid in server data
   2) else server primary + default network
   3) else ordered-first
5. If localStorage selection is invalid, the System SHALL self-heal.
6. Switching networks SHALL never mutate Active_Wallet.
7. UI SHALL clearly handle missing (address, network) combinations.

---

### Requirement 16: Concurrency Safety + Idempotency
**User Story:** As a user, I want wallet actions to behave correctly under double-click or concurrent requests.

**Acceptance Criteria**
1. `wallets-set-primary` SHALL be atomic.
2. `wallets-remove` SHALL be atomic when it reassigns primary.
3. Mutations SHALL accept `Idempotency-Key` header (UUID format, TTL 60s cache):
   - If same `Idempotency-Key` received within 60s, return cached response without duplication.
   - After 60s, key expires and duplicate submission is allowed (may create duplicate if constraints permit).
4. At minimum, `wallets-add-watch` MUST implement idempotency; others recommended.
5. Example:
   ```
   POST /wallets-add-watch
   Authorization: Bearer <jwt>
   Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
   
   Body: { "address_or_ens": "0xabc...", "chain_namespace": "eip155:1" }
   ```
6. Database constraints SHALL prevent actual duplicates regardless of idempotency expiration.
7. The System SHALL include tests covering concurrency + duplicate adds.

---

### Requirement 17: Safe Database Migration
**User Story:** As a platform owner, I want migrations to succeed without data loss.

**Acceptance Criteria**
1. Before creating the `UNIQUE (user_id) WHERE is_primary = true` constraint, the migration SHALL clean up any users with >1 primary.
2. For each user with multiple primary rows, keep one (oldest by `created_at`) and set others to `is_primary = false`.
3. For each user with zero primary rows, assign primary to the oldest row.
4. The cleanup migration SHALL be idempotent (safe to re-run).
5. All cleanup SHALL happen BEFORE the constraint is created.

---

### Requirement 18: RLS Enforcement
**User Story:** As a platform owner, I want bulletproof data security for wallet records.

**Acceptance Criteria**
1. The System SHALL execute `REVOKE INSERT, UPDATE, DELETE ON user_wallets FROM anon, authenticated;` to prevent any bypass of Edge Function authorization.
2. Acceptance Test: Direct client insert/update/delete on `user_wallets` via Supabase JS client SHALL fail with 403.
3. RLS policies SHALL ensure users can only read their own rows.
4. Edge Functions using service role SHALL be the only way to mutate `user_wallets`.
5. The System SHALL log any unauthorized access attempts.

---

### Requirement 19: Database-to-UI Shape Adapter
**User Story:** As a developer, I want clear transformation rules from database rows to UI wallet shape.

**Acceptance Criteria**
1. Database stores one row per `(address, chain_namespace)` tuple.
2. UI displays wallets grouped by address with networks listed under each.
3. WalletProvider SHALL implement a shape adapter that:
   - Groups rows by address (case-insensitive)
   - Creates `ConnectedWallet` objects with `{ address, networks: [...], primaryAddress: bool, ... }`
   - Prevents duplicate addresses in final `connectedWallets` array
4. Shape adapter MUST handle missing wallets gracefully (UI shows "Not added on this network").
5. Example transformation:
   ```
   DB Rows:
   [
     { address: "0xabc", chain_namespace: "eip155:1", is_primary: true },
     { address: "0xabc", chain_namespace: "eip155:137", is_primary: false },
     { address: "0xdef", chain_namespace: "eip155:1", is_primary: false }
   ]
   
   UI Shape:
   [
     { address: "0xabc", networks: ["eip155:1", "eip155:137"], primaryAddress: true },
     { address: "0xdef", networks: ["eip155:1"], primaryAddress: false }
   ]
   ```

---

### Requirement 20: Edge Function Security Pattern
**User Story:** As a platform owner, I want secure two-client authentication for Edge Functions, so wallet operations are properly authorized.

**Acceptance Criteria**
1. Edge Functions SHALL validate JWT tokens using Supabase service role client.
2. Edge Functions SHALL extract `user_id` from validated JWT claims.
3. Edge Functions SHALL use `user_id` for all database operations (never trust client-provided user IDs).
4. Edge Functions SHALL return 401 for missing/invalid Authorization headers.
5. Edge Functions SHALL return 403 for valid JWTs with insufficient permissions.
6. All wallet mutations SHALL be scoped to the authenticated user's `user_id`.
7. Edge Functions SHALL log security violations for monitoring.

---

## Out of Scope

The following features are explicitly **NOT** included in this requirements specification:

### Non-EVM Networks
- Bitcoin, Solana, Cosmos, or other non-EVM networks
- Cross-chain bridging or asset transfers
- Non-Ethereum wallet formats (Bitcoin addresses, Solana public keys)

### Advanced Wallet Features
- Hardware wallet integration (Ledger, Trezor)
- Multi-signature wallet support
- Wallet creation or key generation
- Private key management or storage
- Transaction signing or broadcasting

### Enterprise Features (Future Versions)
- Team/organization wallet sharing
- Role-based access control for wallets
- Audit trails for wallet operations
- Bulk wallet import/export
- API keys for programmatic access

### Third-Party Integrations
- Portfolio tracking services (Zapper, DeBank)
- Tax reporting integrations
- DeFi protocol-specific features
- NFT collection management

---

## Implementation Status Summary
**Current Status: ~75% Complete**

### ✅ Completed (Infrastructure)
- Multi-chain WalletContext + WalletSelector UI
- CAIP-2 network configuration + tests
- DB columns and migration scaffolding for multi-chain JSONB data

### 🔴 Critical Missing (Integration + Production Hardening)
- Auth ↔ Wallet hydration, route protection, cross-module enforcement
- Edge functions for server-authoritative wallet CRUD
- RLS + REVOKE + constraints + migration safety
- Shape adapter, quota semantics, deterministic ordering, idempotency, concurrency

**Key Insight:** Infra exists, but auth + server registry + hardening must be connected for production.
