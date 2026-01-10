# Property-Based Tests CI/CD Integration

This document describes how property-based tests are integrated into the CI/CD pipeline for the multi-chain wallet system.

## Overview

Property-based tests (PBT) are critical for ensuring correctness of the multi-chain wallet system. They validate that universal properties hold for ALL valid inputs, not just specific examples.

The CI/CD pipeline includes dedicated property test execution to ensure:
- All 20 correctness properties pass consistently
- Tests run with sufficient iterations (100-1000)
- Performance meets requirements (< 30 seconds total)
- Results are properly reported and tracked

## CI/CD Pipeline Structure

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/ci.yml` and includes three jobs:

#### 1. Build Job
- **Purpose**: Compile TypeScript and run linting
- **Steps**:
  - Checkout code
  - Setup Node.js 20
  - Install dependencies
  - Build project
  - Run ESLint
- **Timeout**: 10 minutes
- **Failure**: Blocks PR merge

#### 2. Test Job
- **Purpose**: Run all unit and property tests
- **Steps**:
  - Checkout code
  - Setup Node.js 20
  - Install dependencies
  - Run unit tests: `npm test -- --run`
  - Run property tests: `npm test -- --run --grep "Property"`
- **Timeout**: 10 minutes
- **Failure**: Blocks PR merge

#### 3. Property-Tests Job
- **Purpose**: Dedicated property test execution with detailed reporting
- **Steps**:
  - Checkout code
  - Setup Node.js 20
  - Install dependencies
  - Run all property tests: `npm test -- --run --grep "Feature: multi-chain-wallet-system, Property"`
  - Generate test report
  - Upload test report as artifact
- **Timeout**: 15 minutes
- **Failure**: Blocks PR merge
- **Artifacts**: `property-test-report.txt`

## Running Property Tests Locally

### Quick Start

```bash
# Run all property tests
npm run test:properties

# Run property tests in watch mode
npm run test:properties:watch

# Run specific property test
npm test -- --run --grep "Property 1: CAIP-2"
```

### Advanced Usage

```bash
# Run with coverage report
npm test -- --run --coverage --grep "Feature: multi-chain-wallet-system, Property"

# Run with verbose output
npm test -- --run --reporter=verbose --grep "Feature: multi-chain-wallet-system, Property"

# Run specific property with high iteration count
npm test -- --run --grep "Property 5: Database Constraint" -- --numRuns=1000

# Run property tests using the shell script
./scripts/run-property-tests.sh --verbose --coverage
```

## Test Configuration

### Vitest Configuration

Property tests use the standard `vitest.config.ts` with these settings:

```typescript
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  // Standard timeout for all tests
  testTimeout: 30000,
}
```

### Test Iterations

Property tests are configured with:

- **Standard properties**: 100 iterations minimum
- **Critical properties** (auth, database): 1000 iterations
- **Edge case properties**: 200 iterations

Example:

```typescript
// Standard property: 100 iterations
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
);

// Critical property: 1000 iterations
fc.assert(
  fc.property(/* ... */),
  { numRuns: 1000 }
);
```

## Test Tagging Convention

All property tests MUST include a comment tag for CI/CD tracking:

```typescript
// Feature: multi-chain-wallet-system, Property 6: Net Benefit Calculation
// Validates: Requirements 4.1, 4.2, 4.3, 4.4
test('net benefit equals tax savings minus costs', () => {
  fc.assert(
    fc.property(/* ... */),
    { numRuns: 100 }
  );
});
```

This tag format allows:
1. **Filtering**: `--grep "Feature: multi-chain-wallet-system, Property"`
2. **Tracking**: Map tests to requirements
3. **Reporting**: Generate compliance reports

## Performance Targets

The CI/CD pipeline enforces these performance targets:

| Metric | Target | Timeout |
|--------|--------|---------|
| All property tests | < 30 seconds | 15 minutes |
| Individual property | < 5 seconds | 60 seconds |
| Critical properties | < 10 seconds | 60 seconds |
| Full test suite | < 2 minutes | 10 minutes |

## Failure Handling

### Property Test Failures

When a property test fails in CI/CD:

1. **Immediate notification**: PR status shows failure
2. **Detailed report**: Test report artifact uploaded
3. **Counterexample**: fast-check provides failing input
4. **Blocking**: PR cannot be merged until fixed

### Debugging Failed Properties

To debug a failed property:

1. **Download artifact**: Get `property-test-report.txt` from CI/CD
2. **Find counterexample**: Look for "Counterexample:" in report
3. **Reproduce locally**: Create test with failing input
4. **Fix code**: Address the issue
5. **Verify**: Run property test locally before pushing

Example:

```
Property failed after 42 runs
Counterexample: [
  { address: "0xabc...", chainNamespace: "eip155:1", ... }
]
```

## Continuous Integration Best Practices

### Before Pushing

```bash
# Run all tests locally
npm run test:properties

# Run full test suite
npm test -- --run

# Check linting
npm run lint

# Build project
npm run build
```

### PR Requirements

All PRs must:
- ✅ Pass all property tests
- ✅ Pass all unit tests
- ✅ Pass linting
- ✅ Build successfully
- ✅ Have proper test tagging

### Merge Requirements

Before merging to `main`:
- ✅ All CI/CD jobs pass
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ Property tests pass with 100+ iterations

## Monitoring and Reporting

### Test Reports

Property test results are available in:

1. **GitHub Actions**: View in PR checks
2. **Artifacts**: Download `property-test-report.txt`
3. **Local**: Run `npm run test:properties`

### Coverage Reports

Generate coverage reports:

```bash
npm test -- --run --coverage --grep "Feature: multi-chain-wallet-system, Property"
```

Coverage reports are generated in:
- `coverage/` directory (HTML report)
- `coverage/coverage-final.json` (JSON report)

### Performance Metrics

Track performance metrics:

```bash
# Run with timing information
npm test -- --run --reporter=verbose --grep "Feature: multi-chain-wallet-system, Property"
```

## Troubleshooting

### Tests Timeout in CI/CD

If property tests timeout:

1. **Check iteration count**: Reduce `numRuns` if > 1000
2. **Check generators**: Ensure generators don't create huge inputs
3. **Check system load**: May need more powerful CI/CD runner
4. **Check test logic**: Ensure no infinite loops in properties

### Tests Pass Locally but Fail in CI/CD

Possible causes:

1. **Different Node version**: CI uses Node 20, check local version
2. **Different environment**: CI uses Linux, check OS-specific code
3. **Timing issues**: CI may be slower, increase timeouts
4. **Random seed**: Use `--seed` flag to reproduce

### Flaky Tests

If tests are flaky (sometimes pass, sometimes fail):

1. **Increase iterations**: More runs catch edge cases
2. **Review generators**: Ensure they produce valid inputs
3. **Check for race conditions**: Async code may have timing issues
4. **Add determinism**: Use fixed seeds for debugging

## Adding New Property Tests

When adding a new property test:

1. **Create file**: `src/lib/__tests__/properties/[name].property.test.ts`
2. **Add tagging**: Include feature and property number
3. **Reference requirements**: Document which requirements are validated
4. **Use smart generators**: Constrain to valid input spaces
5. **Set iterations**: Use 100+ for standard, 1000+ for critical
6. **Test locally**: Verify before pushing
7. **Update documentation**: Add to README and this file

Example:

```typescript
// Feature: multi-chain-wallet-system, Property 21: New Property
// Validates: Requirements X.Y, X.Z
describe('Feature: multi-chain-wallet-system, Property 21: New Property', () => {
  test('property holds for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ /* ... */ })),
        (inputs) => {
          const result = functionUnderTest(inputs);
          expect(result).toSatisfy(property);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## CI/CD Configuration Files

### `.github/workflows/ci.yml`

Main CI/CD workflow file with:
- Build job
- Test job
- Property-tests job

### `vitest.config.ts`

Vitest configuration for all tests:
- Environment setup
- Test timeout
- Coverage configuration

### `package.json` Scripts

Test scripts:
- `npm test`: Run all tests
- `npm run test:properties`: Run property tests
- `npm run test:properties:watch`: Run property tests in watch mode

### `scripts/run-property-tests.sh`

Shell script for running property tests with options:
- `--watch`: Watch mode
- `--coverage`: Coverage report
- `--verbose`: Verbose output
- `--ci`: CI mode

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Multi-Chain Wallet System Design](../specs/multi-chain-wallet-system/design.md)
- [Multi-Chain Wallet System Requirements](../specs/multi-chain-wallet-system/requirements.md)

## Support

For issues or questions about property tests in CI/CD:

1. Check the [Property Tests README](../src/lib/__tests__/properties/README.md)
2. Review [fast-check documentation](https://github.com/dubzzz/fast-check)
3. Check GitHub Actions logs for detailed error messages
4. Review property test counterexamples in artifacts
