# Chaos Engineering Tests

This directory contains chaos engineering tests for the Unified Portfolio System (V2).

## Overview

Chaos engineering tests validate system resilience under various failure conditions. These tests intentionally inject failures to ensure the system can handle real-world instability gracefully.

## Test Scenarios

### 1. Random API Failures

Injects random API failures at configurable rates:
- **30% failure rate** - Moderate chaos
- **50% failure rate** - High chaos
- **Duration:** 60 seconds

**Expected Behavior:**
- System remains stable
- No crashes or unhandled errors
- Graceful degradation
- Cached data served when available

### 2. Service Outages

Simulates complete service outages:
- Guardian service down
- Hunter service down
- Simulation service down
- Multiple simultaneous outages

**Expected Behavior:**
- Degraded mode banner displayed
- Cached data shown with indicator
- Risky actions gated
- System remains usable

### 3. Network Instability

Tests intermittent network issues:
- Random connection failures
- Slow API responses (5s delay)
- Timeout scenarios

**Expected Behavior:**
- Retry mechanisms activated
- Loading states displayed
- Timeout handling
- Recovery after restoration

### 4. Cache Resilience

Validates cache behavior during outages:
- Serving cached data
- Cache invalidation on wallet switch
- Stale data prevention

**Expected Behavior:**
- Cached data served during outages
- Cache cleared on wallet switch
- Cached data indicator shown

### 5. Recovery and Retry

Tests automatic recovery mechanisms:
- Exponential backoff retry
- Service restoration detection
- Graceful recovery

**Expected Behavior:**
- Automatic retries (up to 3 attempts)
- Exit degraded mode on recovery
- Fresh data indicator after recovery

## Running Tests

### Run All Chaos Tests
```bash
npx playwright test tests/chaos/
```

### Run Specific Scenario
```bash
npx playwright test tests/chaos/chaos-engineering.spec.ts -g "Random API Failures"
npx playwright test tests/chaos/chaos-engineering.spec.ts -g "Service Outages"
npx playwright test tests/chaos/chaos-engineering.spec.ts -g "Network Instability"
```

### Run with Extended Duration
```bash
# Run chaos tests for 5 minutes
CHAOS_DURATION=300000 npx playwright test tests/chaos/
```

### Run in Headed Mode (watch chaos unfold)
```bash
npx playwright test tests/chaos/ --headed --workers=1
```

## Test Configuration

### Environment Variables

```bash
# Chaos test configuration
CHAOS_DURATION=60000        # Duration in milliseconds
CHAOS_FAILURE_RATE=0.3      # Failure rate (0.0 - 1.0)
CHAOS_DELAY_MS=5000         # Delay in milliseconds
```

### Playwright Configuration

```typescript
// playwright.config.ts
{
  timeout: 120000, // 2 minutes per test
  retries: 0,      // No retries for chaos tests
  workers: 1,      // Run sequentially
}
```

## Expected Results

All chaos tests should **PASS**, indicating:
- ✅ System remains stable under failures
- ✅ No crashes or unhandled errors
- ✅ Graceful degradation activated
- ✅ Cached data served appropriately
- ✅ Automatic recovery after restoration
- ✅ Error boundaries catch component errors

## Metrics Collected

During chaos tests, the following metrics are collected:

1. **Stability Metrics**
   - Crash count
   - Unhandled error count
   - UI responsiveness

2. **Resilience Metrics**
   - Cache hit rate during outages
   - Retry success rate
   - Recovery time after restoration

3. **User Experience Metrics**
   - Degraded mode activation time
   - Loading state display
   - Error message clarity

## Failure Investigation

If chaos tests fail:

1. **Check error logs** - Review browser console and network logs
2. **Verify error boundaries** - Ensure component errors are caught
3. **Check cache behavior** - Verify cached data is served
4. **Review retry logic** - Ensure retries are attempted
5. **Test recovery** - Verify system recovers after restoration

## Weekly Chaos Runs

Chaos tests should be run **weekly** as part of the V2 testing strategy:

```bash
# Weekly chaos run
npm run test:chaos:weekly
```

This command runs:
1. All chaos scenarios
2. Extended duration tests (5 minutes)
3. Multiple failure rate configurations
4. Generates chaos engineering report

## Integration with CI/CD

Add to `.github/workflows/chaos-tests.yml`:

```yaml
name: Weekly Chaos Tests

on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2 AM
  workflow_dispatch: # Manual trigger

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/chaos/
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: chaos-test-report
          path: playwright-report/
```

## Chaos Engineering Principles

1. **Hypothesis-Driven** - Define expected behavior before testing
2. **Minimize Blast Radius** - Start with small failure rates
3. **Automate** - Run chaos tests regularly
4. **Learn and Improve** - Use failures to improve resilience

## Advanced Chaos Scenarios (Future)

- Database connection failures
- Memory pressure simulation
- CPU throttling
- Disk I/O failures
- DNS resolution failures
- SSL/TLS errors
- WebSocket disconnections

## Related Documentation

- [Adversarial Tests](../adversarial/README.md)
- [Performance Tests](../performance/README.md)
- [Requirements Document](../../.kiro/specs/unified-portfolio/requirements.md)
- [Design Document](../../.kiro/specs/unified-portfolio/design.md)
