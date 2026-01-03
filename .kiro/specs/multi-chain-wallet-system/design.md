# Multi-Chain EVM Wallet System Architecture (v2.4)

## ARCHITECTURE OVERVIEW

The AlphaWhale multi-chain wallet system is a **server-authoritative, auth-integrated** wallet registry that supports multiple EVM networks using CAIP-2 chain namespaces. The system is **75% complete** with solid infrastructure but requires critical auth integration to function end-to-end.

## CRITICAL ARCHITECTURAL INVARIANTS

### 🔒 HARD LOCK 1: Auth Flow Contracts (Prevents "signin works but modules don't know")

**On Sign Up (First Session Created)**:
- Create/ensure `user_profiles` row exists (trigger on `auth.users` insert OR server-side on first request)
- Immediately redirect:
  - if wallet count == 0 → `/guardian` (renders onboarding empty state)
  - else → `/guardian`

**On Sign In**:
- Session established in AuthProvider
- Wallet registry hydration runs once (calls `GET /functions/v1/wallets-list`)
- Redirect to `next` param if provided, else same logic as above

**Acceptance Criteria**:
✅ This prevents current state where auth "works" but app modules don't know.
✅ All modules (Guardian/Hunter/HarvestPro) read from the same authenticated WalletContext.
✅ No module maintains its own independent wallet list.

### 🔒 HARD LOCK 2: Wallet Registry Source of Truth Rule (Prevents localStorage drift)

**Source of truth = `user_wallets` in Postgres**

LocalStorage is allowed only for:
- `aw_active_address` (or active address)
- `aw_active_network`
- UI preferences

**Database Invariants**:
- **Canonical row**: One per `(user_id, address_lc, chain_namespace)`
- **address_lc**: MUST be lowercase (stored in generated column)
- **Primary wallet**: Only one `is_primary=true` per user

**Database Constraints**:
```sql
-- Address normalization (lowercase storage)
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS address_lc text 
GENERATED ALWAYS AS (lower(address)) STORED;

-- Unique constraint per user/address/network
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_user_addr_chain 
ON user_wallets(user_id, address_lc, chain_namespace);

-- Only one primary wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_primary_per_user 
ON user_wallets(user_id) WHERE is_primary = true;
```

**Acceptance Criteria**:
✅ After refresh, wallet list must match server, not localStorage.
✅ Adding same wallet+network twice returns 409 Conflict.
✅ User can't end up with 2 "primary" wallets.

### 🔒 HARD LOCK 3: API Contracts with Exact Shapes (Prevents "it's not stored/used" bugs)

**Authentication Headers**:
All Edge Function calls require: `Authorization: Bearer <supabase_jwt>`
Use `supabase.auth.getUser()` inside functions to bind `user_id`

**Standard Error Responses**:
```json
{ "error": { "code": "WALLET_DUPLICATE", "message": "Wallet already exists for this network" } }
```

**Status Codes**: 401 unauth, 403 forbidden, 409 duplicate, 422 validation

**GET /functions/v1/wallets-list**
Returns:
```json
{
  "wallets": [{
    "id": "uuid",
    "address": "0x...",
    "chain_namespace": "eip155:1",
    "label": null,
    "is_primary": true,
    "guardian_scores": {},
    "balance_cache": {}
  }],
  "quota": { 
    "used_addresses": 2, 
    "used_rows": 8, 
    "total": 3, 
    "plan": "free" 
  },
  "active_hint": { "primary_wallet_id": "uuid" }
}
```

**POST /functions/v1/wallets-add-watch**
Body:
```json
{ 
  "address_or_ens": "vitalik.eth", 
  "label": "Main", 
  "chain_namespace": "eip155:1" 
}
```

**Behavior**:
- ENS → resolve to address (if string ends with .eth)
- Reject private-key-like input (Property 8)
- Normalize address to lowercase
- Validate chain_namespace is supported
- Return 409 if duplicate wallet+network

**POST /functions/v1/wallets-remove**
Body: `{ "wallet_id": "uuid" }`

**POST /functions/v1/wallets-set-primary**
Body: `{ "wallet_id": "uuid" }`

**Acceptance Criteria**:
✅ Without these exact contracts, you'll keep "it's not stored / not used" bugs.

### 🔒 HARD LOCK 4: RLS Security Rule (Prevents "not associated" bugs)

**RLS must be SELECT-only for `user_wallets` for authenticated users. All inserts/updates/deletes only via service role in Edge Functions.**

**Acceptance Tests**:
- Direct client insert/update/delete on `user_wallets` returns 403
- Edge Function mutation succeeds

**Why this matters**: Even if sign in/up works, Guardian/Hunter/HarvestPro will feel disconnected if:
- they don't share a single session provider
- they read wallets from wagmi address or localStorage, not server registry
- modules still have demo mode fallbacks
- wallet mutations happen client-side but RLS blocks or writes go to a different table/shape

### 🔒 HARD LOCK 5: Active Selection Invariants (Prevents cross-network breaks)

**Active Selection Model**:
- `activeWallet` (address)
- `activeNetwork` (chain_namespace)

**Critical Invariant**: 
✅ Switching networks must not change the active address.
✅ If (address, newNetwork) row doesn't exist, UI must show "Not added on this network" (and offer "Add network").

**Active Selection Restoration Order**:
1. localStorage `aw_active_address` + `aw_active_network`
2. server `is_primary` wallet address + default network
3. newest wallet row

**Acceptance Criteria**:
✅ Cross-network switching preserves wallet selection.
✅ UI gracefully handles missing wallet+network combinations.

---

## SYSTEM ARCHITECTURE

### Provider Hierarchy (CRITICAL ORDER)

```typescript
// MANDATORY: AuthProvider must wrap WalletProvider
function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>           {/* 1. Auth session first */}
      <WalletProvider>       {/* 2. Wallet context reads auth */}
        <QueryProvider>      {/* 3. React Query for API calls */}
          {children}
        </QueryProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
```

**Why this order matters**: WalletProvider must read auth session to determine if it should hydrate from server or show demo mode.

### Route Protection Architecture

**Route Map**:
- **Public**: `/`, `/login`, `/signup`, `/signin` (alias to `/login`)
- **Protected**: `/guardian`, `/hunter`, `/harvestpro`

**Route Guard Logic**:
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !session) {
      const currentPath = window.location.pathname + window.location.search;
      const next = encodeURIComponent(currentPath);
      
      // Validate next parameter: must start with / and must not start with //
      const isValidNext = currentPath.startsWith('/') && !currentPath.startsWith('//');
      
      if (isValidNext) {
        router.push(`/login?next=${next}`);
      } else {
        router.push('/login');
      }
    }
  }, [session, isLoading, router]);
  
  if (isLoading) return <LoadingSpinner />;
  if (!session) return null;
  
  return <>{children}</>;
}
```

**Route Alias Implementation**:
- `/signin` redirects to `/login` preserving query params

### Data Flow Architecture

**Wallet Registry Read Flows (LOCKED)**:
```
WalletContext
  ↓ (hydration)
Edge Function GET /functions/v1/wallets-list
  ↓
Supabase DB (service role reads or owner RLS reads)
  ↓
WalletContext hydrates state
```

**Wallet Registry Write Flows (LOCKED)**:
```
UI Component
  ↓ (user action: add/remove wallet)
WalletContext method
  ↓
Edge Function (wallets-add-watch, wallets-remove, etc.)
  ↓
Supabase DB (update with service role)
  ↓
WalletContext (refresh state)
  ↓
UI Component (updated display)
```

**Other Data Read Flows (Normal Operations)**:
```
UI Component
  ↓ (user action)
Next.js API Route (thin layer: auth, schema validation)
  ↓
Supabase DB (read with RLS)
  ↓
Next.js API Route (wraps in { data, ts })
  ↓
UI Component (display)
```

**Hydration Flow (Post-Auth)**:
```
User signs in
  ↓
AuthProvider establishes session
  ↓
WalletProvider detects auth change
  ↓
Calls GET /functions/v1/wallets-list
  ↓
Hydrates WalletContext state
  ↓
All modules (Guardian/Hunter/HarvestPro) see wallets
```

---

## COMPONENT ARCHITECTURE

### WalletContext Integration Pattern

**Current State** (75% complete):
```typescript
// src/contexts/WalletContext.tsx - EXISTING INFRASTRUCTURE
interface WalletContextValue {
  // ✅ Already implemented
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  activeNetwork: string;
  setActiveWallet: (address: string) => void;
  setActiveNetwork: (chainNamespace: string) => void;
  
  // ✅ Multi-chain properties already exist
  balancesByNetwork: Record<string, TokenBalance[]>;
  guardianScoresByNetwork: Record<string, number>;
}
```

**Required Integration** (25% missing):
```typescript
// NEEDS TO BE ADDED to existing WalletContext
interface WalletContextValue {
  // ... existing properties preserved
  
  // NEW: Auth integration
  isAuthenticated: boolean;
  hydrateFromServer: () => Promise<void>;
  clearWalletState: () => void;
}

// IMPLEMENTATION PATTERN:
function WalletProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth(); // Read from AuthProvider
  const hydratedForUserIdRef = useRef<string | null>(null);
  
  // Hydrate wallets when auth session established (keyed by userId)
  useEffect(() => {
    const userId = session?.user?.id ?? null;
    
    if (!userId) {
      hydratedForUserIdRef.current = null;
      clearWalletState();
      return;
    }
    
    if (hydratedForUserIdRef.current !== userId) {
      hydratedForUserIdRef.current = userId;
      hydrateFromServer();
    }
  }, [session]);
}
```

### Database Schema Architecture

**Existing Schema** (Complete):
```sql
-- user_wallets table - ALREADY EXISTS with multi-chain support
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain_namespace TEXT DEFAULT 'eip155:1', -- CAIP-2 format
  network_metadata JSONB DEFAULT '{}'::jsonb,
  balance_cache JSONB DEFAULT '{}'::jsonb,
  guardian_scores JSONB DEFAULT '{}'::jsonb,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Required Constraints** (Missing):
```sql
-- NEEDS TO BE ADDED for data integrity
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS address_lc text 
GENERATED ALWAYS AS (lower(address)) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_user_addr_chain 
ON user_wallets(user_id, address_lc, chain_namespace);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_primary_per_user 
ON user_wallets(user_id) WHERE is_primary = true;
```

### Network Configuration Architecture

**Existing Configuration** (Complete):
```typescript
// src/lib/networks/config.ts - ALREADY EXISTS
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  'eip155:1': {
    chainId: 1,
    chainNamespace: 'eip155:1',
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    rpcUrls: ['https://eth-mainnet.alchemyapi.io/v2/...'],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    guardianSupported: true,
  },
  // ... 4 other networks already configured
};
```

**Integration Pattern**:
```typescript
// USAGE in WalletContext (already implemented)
const networkConfig = SUPPORTED_NETWORKS[activeNetwork];
const isGuardianSupported = networkConfig?.guardianSupported ?? false;
```

---

## SECURITY ARCHITECTURE

### Authentication Security

**Session Management**:
- Supabase Auth handles JWT tokens and session lifecycle
- WalletContext reads session state, never manages auth directly
- Edge Functions validate JWT tokens via `supabase.auth.getUser()`

**RLS (Row Level Security)**:
```sql
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Allow read for owner
DROP POLICY IF EXISTS "Users can view own wallets" ON user_wallets;
CREATE POLICY "Users can view own wallets" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Deny all direct writes from client (INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Deny direct writes" ON user_wallets;
CREATE POLICY "Deny direct writes" ON user_wallets
  FOR ALL USING (false) WITH CHECK (false);
```

**Input Validation**:
```typescript
// Property 8: Private Key Input Rejection
function validateWalletInput(input: string): ValidationResult {
  // Reject private key patterns
  if (input.match(/^(0x)?[a-fA-F0-9]{64}$/)) {
    return { valid: false, error: 'Private keys not allowed' };
  }
  
  // Reject seed phrase patterns
  if (input.split(' ').length >= 12) {
    return { valid: false, error: 'Seed phrases not allowed' };
  }
  
  // Validate address or ENS
  if (input.endsWith('.eth')) {
    return { valid: true, type: 'ens' };
  }
  
  if (input.match(/^0x[a-fA-F0-9]{40}$/)) {
    return { valid: true, type: 'address' };
  }
  
  return { valid: false, error: 'Invalid address format' };
}
```

### Network Security

**CAIP-2 Validation**:
```typescript
// Property 1: CAIP-2 Format Consistency
function validateChainNamespace(chainNamespace: string): boolean {
  return /^eip155:\d+$/.test(chainNamespace) && 
         SUPPORTED_NETWORKS[chainNamespace] !== undefined;
}
```

**RPC Security**:
- All RPC calls use authenticated endpoints
- Rate limiting per network to prevent abuse
- Fallback RPC providers for redundancy

---

## ERROR HANDLING ARCHITECTURE

### Network-Specific Error Codes

```typescript
const NETWORK_ERROR_CODES = {
  'eip155:1': {
    RPC_FAILURE: 'ETH_RPC_001',
    RATE_LIMITED: 'ETH_RATE_002',
    INVALID_RESPONSE: 'ETH_RESP_003',
  },
  'eip155:137': {
    RPC_FAILURE: 'MATIC_RPC_001', 
    RATE_LIMITED: 'MATIC_RATE_002',
    INVALID_RESPONSE: 'MATIC_RESP_003',
  },
  // ... other networks
};
```

### Fallback Architecture

**RPC Fallback Chain**:
1. Primary RPC provider fails → Switch to secondary provider
2. Secondary fails → Switch to tertiary provider  
3. All providers fail → Display network unavailable message
4. Cache last known data for offline viewing

**Auth Fallback**:
1. Session expires → Redirect to login with return URL
2. Edge Function auth fails → Clear wallet state, show login prompt
3. Network request fails → Show cached data with "offline" indicator

---

## TESTING ARCHITECTURE

### Property-Based Testing (Primary)

**Critical Properties**:
1. **CAIP-2 Format Consistency** - All network identifiers follow CAIP-2 standard
2. **Wallet Registry Source of Truth** - Server always authoritative over localStorage
3. **Active Selection Invariants** - Network switching preserves wallet selection
4. **Auth Flow Contracts** - Sign in/up always follows deterministic flow
5. **Database Constraints** - No duplicate wallets, single primary per user

**Test Configuration**:
```typescript
// Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency
test('CAIP-2 format validation', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.record({ valid: fc.literal(true), namespace: fc.constantFrom('eip155:1', 'eip155:137') }),
        fc.record({ valid: fc.literal(false), namespace: fc.string().filter(s => !s.match(/^eip155:\d+$/)) })
      ),
      ({ valid, namespace }) => {
        const result = validateChainNamespace(namespace);
        expect(result).toBe(valid);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Critical Flows**:
1. **Auth → Wallet Hydration** - Sign in triggers wallet list fetch
2. **Wallet Mutation → State Update** - Add/remove wallet updates all modules
3. **Network Switch → UI Update** - Network change reflects across components
4. **Error Recovery** - Network failures gracefully degrade

### End-to-End Testing

**User Journeys**:
1. **New User Flow** - Sign up → Link wallet → Access Guardian
2. **Returning User Flow** - Sign in → Hydrate wallets → Continue session
3. **Multi-Network Flow** - Switch networks → Verify data isolation
4. **Error Scenarios** - Network failures → Fallback behavior

---

## PERFORMANCE ARCHITECTURE

### Caching Strategy

**Multi-Level Caching**:
1. **Browser Cache** - Network configs, static assets
2. **localStorage** - Active wallet/network selection only
3. **Database Cache** - Balance cache per network in JSONB
4. **Redis Cache** - Guardian scores, price data (if available)

**Cache Invalidation**:
- Wallet mutations → Clear relevant cache entries
- Network switch → Invalidate network-specific cache
- Auth logout → Clear all user-specific cache

### Performance Monitoring

**Metrics Tracked**:
- Network switching response time (< 2 seconds requirement)
- Wallet hydration time after auth
- Database query performance for multi-chain lookups
- Edge Function response times

**Optimization Strategies**:
- Database indexes on `(user_id, chain_namespace)`
- Batch Guardian scans by network
- Lazy load non-critical network data
- Progressive enhancement for network features

---

## DEPLOYMENT ARCHITECTURE

### Feature Flags

```typescript
const FEATURE_FLAGS = {
  ENABLE_MULTI_CHAIN_EVM: true,        // Master toggle
  ENABLE_POLYGON_SUPPORT: true,        // Individual networks
  ENABLE_ARBITRUM_SUPPORT: true,
  ENABLE_OPTIMISM_SUPPORT: true,
  ENABLE_BASE_SUPPORT: false,          // Gradual rollout
};
```

### Rollout Strategy

1. **Internal Testing** - Enable for internal users first
2. **Beta Users** - Gradual rollout to beta user group  
3. **Staged Rollout** - 10% → 25% → 50% → 100% of users
4. **Monitoring** - Track performance metrics and error rates

### Rollback Plan

- Disable feature flags to revert to single-chain mode
- Database rollback scripts for CAIP-2 migration
- Component fallback to original WalletSelector behavior

---

## SUMMARY

This architecture provides a **server-authoritative, auth-integrated** multi-chain wallet system that:

1. **Prevents "signin works but modules don't know"** via Auth Flow Contracts
2. **Prevents localStorage drift** via Wallet Registry Source of Truth Rule  
3. **Prevents "it's not stored/used" bugs** via exact API contracts
4. **Prevents "not associated" bugs** via RLS Security Rules
5. **Prevents cross-network breaks** via Active Selection Invariants

The system is **75% complete** with solid infrastructure. The remaining **25%** is critical auth integration that connects the existing multi-chain components with user authentication to create a unified, functional experience.
```

---

## CORRECTNESS PROPERTIES (Property-Based Testing)

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CAIP-2 Format Consistency
*For any* chain namespace string, the CAIP-2 validator should correctly accept valid formats (eip155:chainId) and reject invalid formats, and all network configurations should have valid CAIP-2 identifiers.
**Validates: Auth Flow Contracts, Network Configuration**

### Property 2: Wallet Registry Source of Truth Invariant
*For any* wallet operation sequence, the server database should always be the authoritative source, localStorage should only store UI preferences, and after refresh the wallet list should match server state.
**Validates: Hard Lock 2 - Wallet Registry Source of Truth Rule**

### Property 3: Auth Flow Determinism
*For any* sign up or sign in event, the redirect logic should be deterministic based on wallet count, session state should be established before wallet hydration, and all modules should read from the same authenticated context.
**Validates: Hard Lock 1 - Auth Flow Contracts**

### Property 4: Active Selection Invariants
*For any* network switching operation, the active wallet address should remain unchanged, switching to unsupported network combinations should show appropriate UI, and active selection should restore deterministically.
**Validates: Hard Lock 5 - Active Selection Invariants**

### Property 5: Database Constraint Enforcement
*For any* wallet mutation attempt, duplicate (user_id, address_lc, chain_namespace) should return 409 Conflict, only one primary wallet per user should be allowed, and address normalization should be consistent.
**Validates: Hard Lock 2 - Database Invariants**

### Property 6: API Contract Consistency
*For any* Edge Function call, authentication headers should be required, error responses should follow standard format, and request/response shapes should match exact specifications.
**Validates: Hard Lock 3 - API Contracts with Exact Shapes**

### Property 7: RLS Security Enforcement
*For any* client-side database operation, SELECT should be allowed for authenticated users, INSERT/UPDATE/DELETE should return 403 Forbidden, and Edge Functions with service role should succeed.
**Validates: Hard Lock 4 - RLS Security Rule**

### Property 8: Private Key Input Rejection
*For any* user input string, the system should never accept or store inputs that contain private key patterns, seed phrase patterns should be rejected, and only valid addresses or ENS names should be accepted.
**Validates: Security Architecture - Input Validation**

### Property 9: Cross-Module Session Consistency
*For any* wallet or network change in one module, all other modules should reflect the change immediately, no module should maintain independent wallet state, and session consistency should be maintained across refreshes.
**Validates: Hard Lock 1 - Cross-Module Session Consistency**

### Property 10: Network Configuration Extensibility
*For any* new network added to SUPPORTED_NETWORKS, the UI should automatically display appropriate badges, validation should accept the new network, and all network-dependent features should work without code changes.
**Validates: Network Configuration Architecture**

### Property 11: Error Code Standardization
*For any* network and error type combination, error codes should follow the standard format (NETWORK_TYPE_###), error messages should be user-friendly, and fallback behavior should be consistent.
**Validates: Error Handling Architecture**

### Property 12: Multi-Chain Caching Isolation
*For any* network operation, cache writes should be isolated by chain_namespace, cache reads should never return data from another network, and TTL expiration should work correctly per network.
**Validates: Performance Architecture - Caching Strategy**

---

## TESTING ARCHITECTURE

### Property-Based Testing (Primary)

**Library**: fast-check for all property-based tests

**Test Structure**:
```typescript
import * as fc from 'fast-check';
import { describe, test } from 'vitest';

describe('Feature: multi-chain-wallet-system, Property X: [description]', () => {
  test('property holds for all valid inputs', () => {
    fc.assert(
      fc.property(
        // Generators for random inputs
        fc.array(fc.record({
          chainNamespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
          address: fc.hexaString({ minLength: 40, maxLength: 40 }),
          userId: fc.uuid()
        })),
        // Property to verify
        (inputs) => {
          const result = functionUnderTest(inputs);
          
          // Assert property holds
          expect(result).toSatisfy(property);
        }
      ),
      { numRuns: 100 } // Run 100 iterations minimum
    );
  });
});
```

**Property Test Examples**:

```typescript
// Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency
test('CAIP-2 format validation', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.record({ valid: fc.literal(true), namespace: fc.constantFrom('eip155:1', 'eip155:137') }),
        fc.record({ valid: fc.literal(false), namespace: fc.string().filter(s => !s.match(/^eip155:\d+$/)) })
      ),
      ({ valid, namespace }) => {
        const result = validateChainNamespace(namespace);
        expect(result).toBe(valid);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: multi-chain-wallet-system, Property 5: Database Constraint Enforcement
test('database constraints prevent duplicates', () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.uuid(),
        address: fc.hexaString({ minLength: 40, maxLength: 40 }),
        chainNamespace: fc.constantFrom('eip155:1', 'eip155:137')
      }),
      async (wallet) => {
        // First insert should succeed
        const result1 = await addWallet(wallet);
        expect(result1.success).toBe(true);
        
        // Duplicate insert should fail with 409
        const result2 = await addWallet(wallet);
        expect(result2.success).toBe(false);
        expect(result2.error.code).toBe('WALLET_DUPLICATE');
      }
    ),
    { numRuns: 50 }
  );
});
```

### Unit Testing (Complementary)

**Use Cases**:
- Specific UI component rendering
- Error message content verification
- Integration points with external services
- Edge cases and boundary conditions

**Example**:
```typescript
describe('NetworkBadge Component', () => {
  test('renders Ethereum badge correctly', () => {
    render(<NetworkBadge chainNamespace="eip155:1" />);
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toHaveClass('bg-blue-500/20');
  });
});
```

### Integration Testing

**Critical Flows**:
1. **Auth → Wallet Hydration** - Sign in triggers wallet list fetch
2. **Wallet Mutation → State Update** - Add/remove wallet updates all modules
3. **Network Switch → UI Update** - Network change reflects across components
4. **Error Recovery** - Network failures gracefully degrade

### End-to-End Testing

**User Journeys**:
1. **New User Flow** - Sign up → Link wallet → Access Guardian
2. **Returning User Flow** - Sign in → Hydrate wallets → Continue session
3. **Multi-Network Flow** - Switch networks → Verify data isolation
4. **Error Scenarios** - Network failures → Fallback behavior

**Test Configuration**:
- **Minimum 100 iterations** per property test
- **1000 iterations** for critical properties (auth flows, database constraints)
- **Tag format**: `Feature: multi-chain-wallet-system, Property {number}: {property_text}`
- **Libraries**: fast-check, Vitest, Playwright

---

## PRODUCTION-GRADE ARCHITECTURE FIXES

### Wallet Shape Adapter Architecture

**Problem**: Database stores rows per `(address, chain_namespace)` but UI needs address-first grouping.

**Solution**: WalletProvider implements shape adapter:

```typescript
// Input: Flat rows from wallets-list Edge Function
interface WalletRow {
  id: string;
  address: string;
  chain_namespace: string;
  is_primary: boolean;
  guardian_scores: Record<string, number>;
  balance_cache: Record<string, any>;
}

// Output: UI-friendly shape for WalletSelector
interface ConnectedWallet {
  address: string;
  networks: string[]; // Available chain_namespaces
  primaryAddress: boolean; // Derived from active_hint
  guardianScoresByNetwork: Record<string, number>;
  balanceCacheByNetwork: Record<string, any>;
}

// Adapter implementation in WalletProvider
function adaptWalletRows(rows: WalletRow[], activeHint: { primary_wallet_id: string }): ConnectedWallet[] {
  const grouped = groupBy(rows, 'address');
  return Object.entries(grouped).map(([address, addressRows]) => ({
    address,
    networks: addressRows.map(row => row.chain_namespace),
    primaryAddress: addressRows.some(row => row.id === activeHint.primary_wallet_id),
    guardianScoresByNetwork: mergeGuardianScores(addressRows),
    balanceCacheByNetwork: mergeBalanceCache(addressRows),
  }));
}
```

### Primary Wallet Semantics

**Rule**: Primary is address-level, not row-level.

**Implementation**:
- One representative row per primary address has `is_primary=true`
- When setting primary address, choose row by preference:
  1. Row matching current `activeNetwork`
  2. `eip155:1` row if available
  3. Any row for that address

### Quota Architecture

**Quota counts unique addresses, not rows**:

```typescript
// wallets-list response
{
  "quota": {
    "used_addresses": 2,    // Unique addresses
    "used_rows": 8,         // Total rows (debugging)
    "total": 3,             // Address limit
    "plan": "free"
  }
}

// wallets-add-watch enforcement
if (uniqueAddresses.size >= quota.total && !addressExists) {
  return { error: { code: 'QUOTA_EXCEEDED', message: 'Address limit reached' } };
}
```

### Migration Safety Architecture

**Pre-constraint cleanup**:

```sql
-- Migration: Fix multiple primaries before adding constraint
DO $$
DECLARE
  user_record RECORD;
  oldest_wallet_id UUID;
BEGIN
  -- For each user with multiple primaries
  FOR user_record IN 
    SELECT user_id 
    FROM user_wallets 
    WHERE is_primary = true 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
  LOOP
    -- Find oldest wallet for this user
    SELECT id INTO oldest_wallet_id
    FROM user_wallets 
    WHERE user_id = user_record.user_id 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Set all to non-primary
    UPDATE user_wallets 
    SET is_primary = false 
    WHERE user_id = user_record.user_id;
    
    -- Set oldest to primary
    UPDATE user_wallets 
    SET is_primary = true 
    WHERE id = oldest_wallet_id;
  END LOOP;
  
  -- Handle users with no primary
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM user_wallets 
    WHERE user_id NOT IN (
      SELECT user_id FROM user_wallets WHERE is_primary = true
    )
  LOOP
    SELECT id INTO oldest_wallet_id
    FROM user_wallets 
    WHERE user_id = user_record.user_id 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    UPDATE user_wallets 
    SET is_primary = true 
    WHERE id = oldest_wallet_id;
  END LOOP;
END $$;

-- Now safe to add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_primary_per_user 
ON user_wallets(user_id) WHERE is_primary = true;
```

### Edge Function Security Architecture

**CORS + Preflight Handling**:

```typescript
// Every Edge Function must handle OPTIONS
export async function handler(req: Request): Promise<Response> {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }
  
  // Main logic...
}
```

**Two-Client Pattern**:

```typescript
// JWT client for auth only
const jwtClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: req.headers.get('authorization') } }
});

// Service role client for DB writes
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Get user identity with JWT client
const { data: { user }, error } = await jwtClient.auth.getUser();
if (!user) return new Response('Unauthorized', { status: 401 });

// All DB operations with service client
const { data, error } = await serviceClient
  .from('user_wallets')
  .insert({ user_id: user.id, ...walletData });
```

**Rate Limiting**:

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute
});

export async function handler(req: Request) {
  const userId = await getUserId(req);
  const { success } = await ratelimit.limit(`wallet-mutations:${userId}`);
  
  if (!success) {
    return new Response(
      JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
      { status: 429 }
    );
  }
  
  // Continue...
}
```

### Active Selection Consistency Architecture

**localStorage Validation**:

```typescript
// After hydration, validate localStorage selection
function validateActiveSelection(
  serverWallets: ConnectedWallet[],
  storedAddress: string | null,
  storedNetwork: string | null
): { address: string; network: string } {
  
  // Check if stored selection exists in server data
  const addressExists = serverWallets.find(w => w.address === storedAddress);
  const networkExists = addressExists?.networks.includes(storedNetwork || '');
  
  if (addressExists && networkExists) {
    return { address: storedAddress!, network: storedNetwork! };
  }
  
  // Fallback 1: Primary address + default network
  const primaryWallet = serverWallets.find(w => w.primaryAddress);
  if (primaryWallet) {
    const defaultNetwork = primaryWallet.networks.includes('eip155:1') 
      ? 'eip155:1' 
      : primaryWallet.networks[0];
    return { address: primaryWallet.address, network: defaultNetwork };
  }
  
  // Fallback 2: Newest wallet
  const newestWallet = serverWallets[0]; // Assuming sorted by created_at DESC
  return { 
    address: newestWallet.address, 
    network: newestWallet.networks[0] 
  };
}
```

**First Wallet Auto-Primary**:

```typescript
// In wallets-add-watch Edge Function
const existingWallets = await serviceClient
  .from('user_wallets')
  .select('id')
  .eq('user_id', user.id);

const isFirstWallet = existingWallets.data?.length === 0;

const { data, error } = await serviceClient
  .from('user_wallets')
  .insert({
    user_id: user.id,
    address: normalizedAddress,
    chain_namespace: chainNamespace,
    is_primary: isFirstWallet, // Auto-primary for first wallet
  });
```

---

## IMPLEMENTATION SUMMARY

This architecture provides a **server-authoritative, auth-integrated** multi-chain wallet system that:

1. **Prevents "signin works but modules don't know"** via Auth Flow Contracts
2. **Prevents localStorage drift** via Wallet Registry Source of Truth Rule  
3. **Prevents "it's not stored/used" bugs** via exact API contracts
4. **Prevents "not associated" bugs** via RLS Security Rules
5. **Prevents cross-network breaks** via Active Selection Invariants

The system is **75% complete** with solid infrastructure. The remaining **25%** is critical auth integration that connects the existing multi-chain components with user authentication to create a unified, functional experience.

**Key Architectural Decisions**:
- **Reuse-first approach**: Extend existing components rather than create new ones
- **Server-authoritative**: Database is source of truth, not localStorage
- **Property-based testing**: Ensure correctness across all valid inputs
- **Hard invariants**: Prevent common integration bugs through architectural constraints
- **Gradual rollout**: Feature flags enable safe deployment and rollback