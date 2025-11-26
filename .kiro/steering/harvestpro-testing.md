# HarvestPro Testing Standards

## Testing Philosophy

HarvestPro requires **correctness guarantees** for tax calculations. We use a dual testing approach:

1. **Property-Based Testing (PBT)**: Verify universal properties across all inputs
2. **Unit Testing**: Verify specific examples and edge cases

**Both are required** - they complement each other.

## Property-Based Testing (Primary)

### What is Property-Based Testing?

Instead of testing specific examples, PBT tests **properties that should hold for ALL valid inputs**.

**Example:**
```typescript
// ❌ Unit test (specific example)
test('FIFO calculates correctly', () => {
  const lots = calculateFIFO([
    { qty: 10, price: 100 },
    { qty: 5, price: 200 }
  ]);
  expect(lots).toEqual([...]);
});

// ✅ Property test (universal property)
test('FIFO always returns lots in chronological order', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ qty: fc.nat(), price: fc.nat(), timestamp: fc.date() })),
      (transactions) => {
        const lots = calculateFIFO(transactions);
        // Property: lots are always in chronological order
        for (let i = 1; i < lots.length; i++) {
          expect(lots[i].timestamp >= lots[i-1].timestamp).toBe(true);
        }
      }
    )
  );
});
```

### Library: fast-check

Use `fast-check` for all property-based tests.

```bash
npm install --save-dev fast-check
```

### Property Test Structure

```typescript
import * as fc from 'fast-check';
import { describe, test } from 'vitest';

describe('Feature: harvestpro, Property X: [description]', () => {
  test('property holds for all valid inputs', () => {
    fc.assert(
      fc.property(
        // Generators for random inputs
        fc.array(fc.record({
          token: fc.string(),
          quantity: fc.nat(),
          price: fc.float({ min: 0 })
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

**Location:** Property tests for HarvestPro MUST live under `src/lib/harvestpro/__tests__/` (or the agreed lib directory) and MUST only test pure business-logic functions that are used by Supabase Edge Functions, not UI components.

### Required Properties for HarvestPro

Each correctness property in `design.md` MUST have a corresponding property test:

**v1 Properties (1-20):**
- Property 1: FIFO Cost Basis Consistency
- Property 2: Unrealized PnL Calculation Accuracy
- Property 3: Loss Threshold Filtering
- Property 4: Holding Period Calculation
- Property 5: Eligibility Filter Composition
- Property 6: Net Benefit Calculation
- Property 7: Not Recommended Classification
- Property 8: Filter Application
- Property 9: Session State Transitions
- Property 10: CSV Export Completeness
- Property 11: Monetary Value Formatting
- Property 12: Risk Level Classification
- Property 13: Calculation Determinism
- Property 14: Export Data Completeness
- Property 15: Session Data Persistence
- Property 16: Hash Function Determinism
- Property 17: Credential Encryption
- Property 18: Data Aggregation Completeness
- Property 19: Settings Application
- Property 20: Notification Threshold

**v2 Properties (21-29):**
- Property 21: Private RPC Routing
- Property 22: Private RPC Recording
- Property 23: Economic Substance Evaluation
- Property 24: Economic Substance Blocking
- Property 25: Proxy Asset Recording
- Property 26: Guardrail Enforcement - Daily Loss
- Property 27: Guardrail Enforcement - Position Size
- Property 28: Guardrail Enforcement - Slippage
- Property 29: Enhanced Proof Payload

**v3 Properties (30-37):**
- Property 30: Custody Integration - No Private Keys
- Property 31: Custody Transaction Routing
- Property 32: Approval Threshold Transition
- Property 33: Approval Requirement
- Property 34: Sanctions Screening
- Property 35: Sanctioned Route Blocking
- Property 36: TWAP Order Slicing
- Property 37: TWAP Safety Floor

### Property Test Tagging

**CRITICAL**: Every property test MUST include a comment tag:

```typescript
// Feature: harvestpro, Property 6: Net Benefit Calculation
// Validates: Requirements 4.1, 4.2, 4.3, 4.4
test('net benefit equals tax savings minus costs', () => {
  // ...
});
```

This allows us to:
1. Map tests to requirements
2. Track property coverage
3. Generate compliance reports

### Smart Generators

Write generators that constrain to valid input space:

```typescript
// ✅ Good: Constrained generator
const validLotGenerator = fc.record({
  token: fc.constantFrom('ETH', 'BTC', 'USDC'),
  quantity: fc.float({ min: 0.001, max: 1000 }),
  price: fc.float({ min: 0.01, max: 100000 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() })
});

// ❌ Bad: Unconstrained generator
const badLotGenerator = fc.record({
  token: fc.string(), // Could be empty or invalid
  quantity: fc.float(), // Could be negative or NaN
  price: fc.float(), // Could be negative or Infinity
  timestamp: fc.anything() // Could be invalid
});
```

### Minimum Iterations

Configure property tests to run **at least 100 iterations**:

```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
);
```

For critical properties (tax calculations), use 1000 iterations:

```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 1000 }
);
```

## Unit Testing (Complementary)

### When to Use Unit Tests

Use unit tests for:
- Specific examples that demonstrate correct behavior
- Edge cases (empty inputs, boundary values)
- Error conditions
- Integration points between components

### Library: Vitest

```typescript
import { describe, test, expect } from 'vitest';

describe('calculateNetBenefit', () => {
  test('returns zero benefit when loss is zero', () => {
    const result = calculateNetBenefit({
      unrealizedLoss: 0,
      taxRate: 0.24,
      gasEstimate: 10,
      slippageEstimate: 5,
      tradingFees: 2
    });
    
    expect(result.netBenefit).toBe(0);
  });
  
  test('handles negative benefit correctly', () => {
    const result = calculateNetBenefit({
      unrealizedLoss: 10,
      taxRate: 0.24,
      gasEstimate: 100, // Gas exceeds benefit
      slippageEstimate: 0,
      tradingFees: 0
    });
    
    expect(result.netBenefit).toBeLessThan(0);
    expect(result.recommended).toBe(false);
  });
});
```

### Unit Test Structure

```typescript
describe('Module/Function Name', () => {
  describe('when [condition]', () => {
    test('should [expected behavior]', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

## Integration Testing

### API Endpoint Tests

Test Next.js API routes with actual HTTP requests:

```typescript
import { describe, test, expect } from 'vitest';

describe('GET /api/harvest/opportunities', () => {
  test('returns opportunities for authenticated user', async () => {
    const response = await fetch('/api/harvest/opportunities', {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.items).toBeInstanceOf(Array);
  });
  
  test('returns 401 for unauthenticated user', async () => {
    const response = await fetch('/api/harvest/opportunities');
    expect(response.status).toBe(401);
  });
});
```

### Edge Function Tests

Test Supabase Edge Functions with Deno test:

```typescript
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

Deno.test('harvest-recompute-opportunities calculates correctly', async () => {
  const result = await invokeEdgeFunction('harvest-recompute-opportunities', {
    userId: 'test-user-id'
  });
  
  assertEquals(result.success, true);
  assertEquals(result.opportunities.length > 0, true);
});
```

## E2E Testing

### Library: Playwright

Test critical user flows end-to-end:

```typescript
import { test, expect } from '@playwright/test';

test('complete harvest flow', async ({ page }) => {
  // Navigate to HarvestPro
  await page.goto('/harvest');
  
  // Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="metamask"]');
  
  // Wait for opportunities to load
  await expect(page.locator('[data-testid="opportunity-card"]')).toBeVisible();
  
  // Click first opportunity
  await page.click('[data-testid="opportunity-card"]:first-child');
  
  // Execute harvest
  await page.click('[data-testid="execute-harvest"]');
  
  // Verify success screen
  await expect(page.locator('[data-testid="success-screen"]')).toBeVisible();
});
```

## Test Organization

### File Structure

```
src/lib/harvestpro/
├── fifo.ts
├── __tests__/
│   ├── fifo.test.ts           # Property tests
│   └── fifo.unit.test.ts      # Unit tests
```

### Naming Conventions

- Property tests: `*.test.ts`
- Unit tests: `*.unit.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Test Coverage Requirements

### Minimum Coverage
- **Property tests**: 100% of correctness properties
- **Unit tests**: 80% line coverage for utilities
- **Integration tests**: All API endpoints
- **E2E tests**: All critical user flows

### Coverage Exclusions
- UI components (tested via E2E)
- Type definitions
- Configuration files

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run property tests only
npm test -- --grep "Property"

# Run unit tests only
npm test -- --grep "unit"

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### CI/CD Integration

All tests MUST pass before merging:

```yaml
# .github/workflows/test.yml
- name: Run property tests
  run: npm test -- --grep "Property"
  
- name: Run unit tests
  run: npm test -- --grep "unit"
  
- name: Run integration tests
  run: npm test -- --grep "integration"
```

## Debugging Failed Property Tests

When a property test fails, fast-check provides a counterexample:

```
Property failed after 42 runs
Counterexample: [
  { token: "ETH", quantity: 0.0001, price: 50000, timestamp: 2023-01-01 }
]
```

To reproduce:

```typescript
test('debug failing property', () => {
  const failingInput = [
    { token: "ETH", quantity: 0.0001, price: 50000, timestamp: new Date('2023-01-01') }
  ];
  
  const result = functionUnderTest(failingInput);
  // Debug here
});
```

## Summary

**Property-Based Testing is PRIMARY** for HarvestPro because:
1. Tax calculations must be correct for ALL inputs
2. Catches edge cases we wouldn't think to test
3. Provides mathematical proof of correctness
4. Required for regulatory compliance

**Unit Testing is COMPLEMENTARY** for:
1. Specific examples
2. Error conditions
3. Integration points

**Both are required** - don't skip either one.

Every correctness property in `design.md` MUST have a corresponding property test with proper tagging.
