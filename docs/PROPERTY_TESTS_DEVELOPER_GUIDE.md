# Property-Based Tests Developer Guide

This guide explains how to work with property-based tests in the multi-chain wallet system, including local development, CI/CD integration, and best practices.

## Quick Start

### Running Property Tests Locally

```bash
# Run all property tests
npm run test:properties

# Run property tests in watch mode (auto-rerun on changes)
npm run test:properties:watch

# Run specific property test
npm test -- --run --grep "Property 1: CAIP-2"

# Run with coverage report
npm test -- --run --coverage --grep "Feature: multi-chain-wallet-system, Property"
```

### Before Pushing Code

```bash
# 1. Run all property tests
npm run test:properties

# 2. Run all tests (unit + property)
npm test -- --run

# 3. Check linting
npm run lint

# 4. Build project
npm run build

# 5. If all pass, push to GitHub
git push origin your-branch
```

## Understanding Property-Based Tests

### What is a Property?

A property is a universal statement about your code that should hold for ALL valid inputs.

**Example:**
```typescript
// ❌ Unit test (specific example)
test('FIFO calculates correctly for 2 lots', () => {
  const result = calculateFIFO([
    { qty: 10, price: 100 },
    { qty: 5, price: 200 }
  ]);
  expect(result).toEqual([...]);
});

// ✅ Property test (universal property)
test('FIFO always returns lots in chronological order', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ qty: fc.nat(), price: fc.nat() })),
      (transactions) => {
        const lots = calculateFIFO(transactions);
        // Property: lots are always in chronological order
        for (let i = 1; i < lots.length; i++) {
          expect(lots[i].timestamp >= lots[i-1].timestamp).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Why Property Tests Matter

Property tests are critical for:
- **Tax calculations**: Must be correct for ALL inputs
- **Financial operations**: No edge cases allowed
- **Regulatory compliance**: Auditable correctness
- **Catching bugs**: Finds edge cases you wouldn't think of

## Writing Property Tests

### Basic Structure

```typescript
import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

// Feature: multi-chain-wallet-system, Property X: [Description]
// Validates: Requirements Y.Z, A.B
describe('Feature: multi-chain-wallet-system, Property X: [Description]', () => {
  test('property holds for all valid inputs', () => {
    fc.assert(
      fc.property(
        // 1. Generators for random inputs
        fc.array(fc.record({
          address: fc.hexaString({ minLength: 40, maxLength: 40 }),
          chainId: fc.integer({ min: 1, max: 999999 }),
        })),
        // 2. Property to verify
        (inputs) => {
          const result = functionUnderTest(inputs);
          
          // 3. Assert property holds
          expect(result).toSatisfy(property);
        }
      ),
      { numRuns: 100 } // 4. Number of iterations
    );
  });
});
```

### Smart Generators

Generators create random test inputs. Use smart generators that constrain to valid input spaces:

```typescript
// ✅ Good: Constrained generator
const validAddressGenerator = fc.string({ minLength: 40, maxLength: 40 })
  .filter(s => /^[0-9a-fA-F]{40}$/.test(s))
  .map(s => `0x${s.toLowerCase()}`);

// ✅ Good: Predefined values
const chainNamespaceGenerator = fc.constantFrom(
  'eip155:1',
  'eip155:137',
  'eip155:42161'
);

// ✅ Good: Composite generator
const walletGenerator = fc.record({
  address: validAddressGenerator,
  chainNamespace: chainNamespaceGenerator,
  label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
});

// ❌ Bad: Unconstrained generator
const badAddressGenerator = fc.string(); // Could be empty or invalid

// ❌ Bad: No constraints
const badChainGenerator = fc.integer(); // Could be negative or huge
```

### Common Property Patterns

#### 1. Invariants (Properties that remain constant)

```typescript
// Property: Collection size after map equals original size
test('map preserves collection size', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const mapped = arr.map(x => x * 2);
        expect(mapped.length).toBe(arr.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### 2. Round-Trip Properties (Operation + inverse = original)

```typescript
// Property: Encode then decode returns original
test('serialization round-trip preserves data', () => {
  fc.assert(
    fc.property(
      fc.record({ address: validAddressGenerator, chainId: fc.integer() }),
      (wallet) => {
        const encoded = encodeWallet(wallet);
        const decoded = decodeWallet(encoded);
        expect(decoded).toEqual(wallet);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### 3. Idempotence (Doing it twice = doing it once)

```typescript
// Property: Applying filter twice = applying once
test('filter is idempotent', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const filtered1 = arr.filter(x => x > 0);
        const filtered2 = filtered1.filter(x => x > 0);
        expect(filtered2).toEqual(filtered1);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### 4. Metamorphic Properties (Relationships between inputs/outputs)

```typescript
// Property: Filtered array is always smaller or equal
test('filter reduces or maintains size', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const filtered = arr.filter(x => x > 0);
        expect(filtered.length).toBeLessThanOrEqual(arr.length);
      }
    ),
    { numRuns: 100 }
  );
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

This allows:
1. **Filtering in CI/CD**: `--grep "Feature: multi-chain-wallet-system, Property"`
2. **Tracking coverage**: Map tests to requirements
3. **Compliance reporting**: Generate audit trails

## Debugging Failed Properties

When a property test fails, fast-check provides a counterexample:

```
Property failed after 42 runs
Counterexample: [
  { address: "0xabc...", chainNamespace: "eip155:1", ... }
]
```

### Steps to Debug

1. **Capture the counterexample**
   ```
   Counterexample: [
     { address: "0xabc123...", chainId: 1, label: null }
   ]
   ```

2. **Create a test with the failing input**
   ```typescript
   test('debug failing property', () => {
     const failingInput = [
       { address: "0xabc123...", chainId: 1, label: null }
     ];
     
     const result = functionUnderTest(failingInput);
     // Debug here - add console.log, breakpoints, etc.
     expect(result).toSatisfy(property);
   });
   ```

3. **Run the test locally**
   ```bash
   npm test -- --run --grep "debug failing property"
   ```

4. **Fix the code**
   - Understand why the property failed
   - Fix the implementation
   - Verify the fix

5. **Re-run the property test**
   ```bash
   npm run test:properties
   ```

## CI/CD Integration

### GitHub Actions Workflow

Property tests run automatically on:
- Push to `main` branch
- Push to `feat/*` branches
- Pull requests to `main`

### Three-Job Pipeline

1. **Build Job**: Compile and lint
2. **Test Job**: Run all unit and property tests
3. **Property-Tests Job**: Dedicated property test execution

### Viewing Results

1. **In GitHub PR**: Check "Checks" tab
2. **In GitHub Actions**: View workflow run
3. **Download artifact**: Get `property-test-report.txt`

### Failure Handling

If property tests fail in CI/CD:

1. **Check the error**: View GitHub Actions logs
2. **Download report**: Get `property-test-report.txt` artifact
3. **Find counterexample**: Look for "Counterexample:" in report
4. **Reproduce locally**: Run with failing input
5. **Fix and push**: Re-run CI/CD

## Performance Optimization

### Iteration Count

- **Standard properties**: 100 iterations
- **Critical properties**: 1000 iterations
- **Edge cases**: 200 iterations

```typescript
// Standard: 100 iterations
fc.assert(fc.property(/* ... */), { numRuns: 100 });

// Critical: 1000 iterations
fc.assert(fc.property(/* ... */), { numRuns: 1000 });
```

### Generator Performance

Optimize generators for performance:

```typescript
// ✅ Good: Fast generator
const fastGenerator = fc.constantFrom('a', 'b', 'c');

// ❌ Bad: Slow generator
const slowGenerator = fc.string()
  .filter(s => s.length > 0)
  .filter(s => /^[a-z]+$/.test(s))
  .filter(s => s.length < 100);
```

### Timeout Configuration

Property tests have these timeouts:
- **Individual test**: 30 seconds
- **Full suite**: 15 minutes (CI/CD)

## Best Practices

### 1. Use Smart Generators

```typescript
// ✅ Good: Constrained to valid space
const validWalletGenerator = fc.record({
  address: fc.hexaString({ minLength: 40, maxLength: 40 })
    .map(s => `0x${s.toLowerCase()}`),
  chainId: fc.constantFrom(1, 137, 42161),
});

// ❌ Bad: Unconstrained
const badWalletGenerator = fc.record({
  address: fc.string(),
  chainId: fc.integer(),
});
```

### 2. Test Universal Properties

```typescript
// ✅ Good: Universal property
test('all wallets have valid addresses', () => {
  fc.assert(
    fc.property(
      fc.array(validWalletGenerator),
      (wallets) => {
        wallets.forEach(wallet => {
          expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
      }
    ),
    { numRuns: 100 }
  );
});

// ❌ Bad: Specific example
test('wallet 0xabc... is valid', () => {
  const wallet = { address: '0xabc...', chainId: 1 };
  expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
});
```

### 3. Include Proper Tagging

```typescript
// ✅ Good: Proper tagging
// Feature: multi-chain-wallet-system, Property 5: Database Constraints
// Validates: Requirements 5.4, 8.1, 9.1
test('duplicate wallets return 409', () => { /* ... */ });

// ❌ Bad: No tagging
test('duplicate wallets return 409', () => { /* ... */ });
```

### 4. Document Properties

```typescript
// ✅ Good: Clear documentation
/**
 * Property: Wallet registry source of truth
 * 
 * For any wallet operation sequence, the server database should always
 * be the authoritative source. localStorage should only store UI preferences.
 * After refresh, the wallet list should match server state exactly.
 * 
 * Validates: Requirements 2.2, 2.5
 */
test('server is source of truth', () => { /* ... */ });
```

### 5. Test Edge Cases

```typescript
// ✅ Good: Include edge cases
test('handles empty arrays', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer(), { minLength: 0, maxLength: 100 }),
      (arr) => {
        const result = processArray(arr);
        expect(result).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

## Common Mistakes

### 1. Unconstrained Generators

```typescript
// ❌ Bad: Could generate invalid data
const badGenerator = fc.record({
  address: fc.string(), // Could be empty or invalid
  chainId: fc.integer(), // Could be negative
});

// ✅ Good: Constrained to valid space
const goodGenerator = fc.record({
  address: fc.hexaString({ minLength: 40, maxLength: 40 })
    .map(s => `0x${s.toLowerCase()}`),
  chainId: fc.constantFrom(1, 137, 42161),
});
```

### 2. Testing Specific Examples

```typescript
// ❌ Bad: Only tests one example
test('wallet is valid', () => {
  const wallet = { address: '0xabc...', chainId: 1 };
  expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
});

// ✅ Good: Tests all valid inputs
test('all wallets are valid', () => {
  fc.assert(
    fc.property(
      fc.array(validWalletGenerator),
      (wallets) => {
        wallets.forEach(wallet => {
          expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### 3. Missing Tagging

```typescript
// ❌ Bad: No tagging
test('property holds', () => { /* ... */ });

// ✅ Good: Proper tagging
// Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format
// Validates: Requirements 1.1, 1.4
test('CAIP-2 format is valid', () => { /* ... */ });
```

### 4. Too Few Iterations

```typescript
// ❌ Bad: Only 10 iterations
fc.assert(fc.property(/* ... */), { numRuns: 10 });

// ✅ Good: Sufficient iterations
fc.assert(fc.property(/* ... */), { numRuns: 100 });

// ✅ Good: Critical properties with more iterations
fc.assert(fc.property(/* ... */), { numRuns: 1000 });
```

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Vitest Documentation](https://vitest.dev/)
- [Multi-Chain Wallet System Design](../specs/multi-chain-wallet-system/design.md)
- [Property Tests CI/CD Guide](./PROPERTY_TESTS_CI_CD.md)
- [Property Tests README](../src/lib/__tests__/properties/README.md)

## Getting Help

1. **Check existing tests**: Look at `src/lib/__tests__/properties/` for examples
2. **Read documentation**: Review README files in test directories
3. **Review fast-check docs**: Check [fast-check GitHub](https://github.com/dubzzz/fast-check)
4. **Ask team**: Discuss with team members or in code review
