# Property-Based Tests for Multi-Chain Wallet System

This directory contains property-based tests (PBT) for the multi-chain wallet system using `fast-check`.

## Overview

Property-based testing validates that universal properties hold for ALL valid inputs, not just specific examples. This is critical for tax calculations and financial operations where correctness must be guaranteed.

## Test Structure

Each property test file follows this pattern:

```typescript
// Feature: multi-chain-wallet-system, Property X: [Description]
// Validates: Requirements Y.Z, A.B
test('property holds for all valid inputs', () => {
  fc.assert(
    fc.property(
      // Generators for random inputs
      fc.array(fc.record({ /* ... */ })),
      // Property to verify
      (inputs) => {
        const result = functionUnderTest(inputs);
        expect(result).toSatisfy(property);
      }
    ),
    { numRuns: 100 } // Minimum 100 iterations
  );
});
```

## Property Tests Implemented

### Core Properties (1-10)

1. **CAIP-2 Format Consistency** (`caip2-format-validation.property.test.ts`)
   - All network identifiers follow CAIP-2 format
   - Chain namespaces map to valid configurations
   - Validates: Requirements 1.1, 1.4, 6.2

2. **Wallet Registry Source of Truth** (`wallet-registry.property.test.ts`)
   - Server database is authoritative source
   - localStorage only stores UI preferences
   - After refresh, wallet list matches server state
   - Validates: Requirements 2.2, 2.5

3. **Auth Flow Determinism** (`auth-flow.property.test.ts`)
   - Sign in/up follows deterministic redirect logic
   - Session established before wallet hydration
   - All modules read from same authenticated context
   - Validates: Requirements 2.1, 3.3, 3.4, 3.5

4. **Active Selection Network Invariance** (`active-selection.property.test.ts`)
   - Network switching preserves active wallet address
   - Missing wallet-network combinations show appropriate UI
   - Validates: Requirements 1.3, 6.2, 6.3, 15.6

5. **Database Constraint Enforcement** (`database-constraints.property.test.ts`)
   - Duplicate (user_id, address_lc, chain_namespace) returns 409
   - Only one primary wallet per user allowed
   - Address normalization is consistently lowercase
   - Validates: Requirements 5.4, 8.1, 8.7, 9.1, 9.2

6. **API Contract Consistency** (`api-contracts.property.test.ts`)
   - Authentication headers required
   - Error responses follow standard format
   - Request/response shapes match specifications
   - Validates: Requirements 13.2, 13.3, 13.4, 13.5

7. **RLS Security Enforcement** (`rls-security.property.test.ts`)
   - SELECT allowed for authenticated users on own data
   - INSERT/UPDATE/DELETE returns 403 Forbidden
   - Edge Functions with service role succeed
   - Validates: Requirements 9.3, 9.4, 9.5, 18.1-18.4

8. **Input Validation Security** (`input-validation.property.test.ts`)
   - Private key patterns rejected with PRIVATE_KEY_DETECTED
   - Seed phrase patterns rejected with SEED_PHRASE_DETECTED
   - Only valid addresses or ENS names accepted
   - Validates: Requirements 5.2, 5.3

9. **Cross-Module Session Consistency** (`cross-module.property.test.ts`)
   - Wallet/network changes reflect immediately across modules
   - No module maintains independent wallet state when authenticated
   - Session consistency maintained across refreshes
   - Validates: Requirements 4.1-4.5, 6.5

10. **Quota Enforcement Logic** (`quota-enforcement.property.test.ts`)
    - Quota counts unique addresses (not rows)
    - Quota checked before allowing new address additions
    - Quota limits enforced server-side
    - Validates: Requirements 7.1, 7.4, 7.5, 7.6, 7.8

### Advanced Properties (11-20)

11. **Primary Wallet Semantics** (`primary-wallet.property.test.ts`)
    - Primary set at address level with one representative row
    - Primary selection follows network preference order
    - Primary reassignment atomic with deletion
    - Validates: Requirements 8.3-8.6

12. **Route Protection and Validation** (`route-protection.property.test.ts`)
    - Unauthenticated users redirected to login with valid next parameters
    - Next parameter validation prevents open redirects
    - Signin aliases to login preserving parameters
    - Validates: Requirements 3.1, 3.2, 3.6

13. **CORS and Preflight Handling** (`cors-preflight.property.test.ts`)
    - OPTIONS preflight handled correctly
    - CORS headers include all required headers
    - Browser calls succeed without CORS errors
    - Validates: Requirements 14.1-14.5

14. **Idempotency Behavior** (`idempotency.property.test.ts`)
    - Same Idempotency-Key within 60s returns cached response
    - Expired keys allow new operations
    - Database constraints prevent duplicates regardless of expiration
    - Validates: Requirements 16.3, 16.4, 16.6

15. **Data Isolation by Network** (`data-isolation-by-network.property.test.ts`)
    - Data isolated by chain_namespace
    - Network switches don't leak data between networks
    - Caches stored per-network
    - Validates: Requirements 6.4, 11.2

16. **Active Selection Restoration** (`active-selection-restoration.property.test.ts`)
    - Active selection restores using localStorage if valid
    - Fallback to server primary + default network
    - Invalid localStorage self-heals
    - Validates: Requirements 15.4, 15.5

17. **Edge Function Security Pattern** (`edge-function-security-pattern.property.test.ts`)
    - JWT tokens validated using JWT-bound anon client
    - user_id extracted from validated claims
    - Security violations logged for monitoring
    - Validates: Requirements 14.1-14.5, 16.3-16.6, 18.1-18.5

18. **Wallet Shape Adapter Consistency** (`wallet-adapter.property.test.ts`)
    - Rows grouped by address case-insensitively
    - ConnectedWallet objects have correct structure
    - Duplicate addresses prevented
    - Missing wallet-network combinations handled gracefully
    - Validates: Requirements 19.1-19.4

19. **Error Handling Standardization** (`error-handling.property.test.ts`)
    - Network failures show user-friendly messages
    - ENS failures return 422 with ENS_RESOLUTION_FAILED
    - Rate limit exceeded returns 429 with RATE_LIMITED
    - Offline mode shows cached data with indicators
    - Validates: Requirements 10.1-10.4

20. **Migration Safety and Atomicity** (`migration-safety-atomicity.property.test.ts`)
    - Cleanup happens before constraint creation
    - Multiple primaries resolved to oldest wallet
    - Zero primary users get assigned primary
    - Migrations are idempotent
    - Validates: Requirements 17.1-17.5

## Running Property Tests

### Local Development

```bash
# Run all property tests
npm run test:properties

# Run property tests in watch mode
npm run test:properties:watch

# Run specific property test
npm test -- --run --grep "Property 1: CAIP-2"

# Run with verbose output
npm test -- --run --reporter=verbose --grep "Feature: multi-chain-wallet-system, Property"
```

### CI/CD Pipeline

Property tests run automatically on:
- Push to `main` branch
- Push to `feat/*` branches
- Pull requests to `main`

The CI pipeline includes:
1. **Build job**: Compiles TypeScript and runs linting
2. **Test job**: Runs all unit and property tests
3. **Property-tests job**: Dedicated property test execution with timeout

### Test Configuration

Property tests are configured with:
- **Minimum iterations**: 100 runs per property
- **Critical properties**: 1000 runs (auth, database)
- **Timeout**: 15 minutes for full property test suite
- **Reporting**: Verbose output with test report artifacts

## Smart Generators

Each property test uses smart generators that constrain to valid input spaces:

```typescript
// ✅ Good: Constrained generator
const validAddressGenerator = fc.string({ minLength: 40, maxLength: 40 })
  .filter(s => /^[0-9a-fA-F]{40}$/.test(s))
  .map(s => `0x${s.toLowerCase()}`);

// ❌ Bad: Unconstrained generator
const badAddressGenerator = fc.string(); // Could be empty or invalid
```

## Debugging Failed Properties

When a property test fails, fast-check provides a counterexample:

```
Property failed after 42 runs
Counterexample: [
  { address: "0xabc...", chainNamespace: "eip155:1", ... }
]
```

To reproduce:

```typescript
test('debug failing property', () => {
  const failingInput = [
    { address: "0xabc...", chainNamespace: "eip155:1" }
  ];
  
  const result = functionUnderTest(failingInput);
  // Debug here
});
```

## Test Tagging Convention

All property tests MUST include a comment tag:

```typescript
// Feature: multi-chain-wallet-system, Property 6: Net Benefit Calculation
// Validates: Requirements 4.1, 4.2, 4.3, 4.4
test('net benefit equals tax savings minus costs', () => {
  // ...
});
```

This allows us to:
1. Map tests to requirements
2. Track property coverage
3. Generate compliance reports

## Performance Targets

- **All property tests**: < 30 seconds total
- **Individual property**: < 5 seconds
- **Critical properties**: < 10 seconds (1000 iterations)

## Coverage Requirements

- **Property tests**: 100% of correctness properties
- **Unit tests**: 80% line coverage for utilities
- **Integration tests**: All API endpoints
- **E2E tests**: All critical user flows

## Adding New Properties

When adding a new property test:

1. Create a new file: `src/lib/__tests__/properties/[property-name].property.test.ts`
2. Include proper tagging with feature and property number
3. Reference requirements validated
4. Use smart generators for valid input spaces
5. Run with minimum 100 iterations
6. Add to this README
7. Update CI/CD pipeline if needed

## References

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Multi-Chain Wallet System Design](../../design.md)
- [Multi-Chain Wallet System Requirements](../../requirements.md)
