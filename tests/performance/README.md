# Performance Testing with k6

This directory contains k6 performance tests for the Unified Portfolio System (V2).

## Overview

Performance tests validate system behavior under load using k6, a modern load testing tool. These tests ensure the system meets performance requirements under various load conditions.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

## Test Scenarios

### 1. API Load Testing (`api-load.k6.js`)

Tests portfolio API endpoints under load:
- **Ramp-up:** 0 → 10 → 50 → 100 users over 7 minutes
- **Spike:** 100 → 200 users for 5 minutes
- **Ramp-down:** 200 → 0 users over 2 minutes

**Endpoints Tested:**
- `GET /api/v1/portfolio/snapshot` (cached)
- `GET /api/v1/portfolio/snapshot` (cold)
- `GET /api/v1/portfolio/approvals`
- `GET /api/v1/portfolio/actions`
- `GET /api/v1/portfolio/positions`

**Performance Targets:**
- Snapshot cached P95 < 600ms
- Snapshot cold P95 < 1200ms
- Approvals P95 < 900ms
- Actions P95 < 800ms
- Error rate < 1%

**Run:**
```bash
k6 run tests/performance/api-load.k6.js
```

### 2. Multi-Wallet Aggregation (`multi-wallet.k6.js`)

Tests multi-wallet portfolio aggregation under load:
- **Load:** 5 → 20 → 50 → 100 users over 14 minutes
- **Wallet counts:** 2, 3, 5, 10, 20 wallets per user

**Endpoints Tested:**
- `GET /api/v1/portfolio/snapshot?scope=all_wallets`
- `GET /api/v1/portfolio/positions?scope=all_wallets`

**Performance Targets:**
- Aggregation P95 < 2000ms
- Unified risk scoring P95 < 1500ms
- Error rate < 2%

**Run:**
```bash
k6 run tests/performance/multi-wallet.k6.js
```

### 3. Concurrent Users (`concurrent-users.k6.js`)

Tests system behavior under concurrent user load:
- **Scenario 1:** Gradual ramp-up (0 → 50 → 100 users)
- **Scenario 2:** Spike test (0 → 200 users in 10s)
- **Scenario 3:** Constant load (50 users for 5 minutes)

**Operations Tested:**
- Portfolio reads (snapshot, approvals, actions)
- Plan creation
- Simulation
- Concurrent plan execution

**Performance Targets:**
- Gradual load P95 < 1500ms
- Spike test P95 < 3000ms
- Constant load P95 < 1200ms
- Error rate < 5%

**Run:**
```bash
k6 run tests/performance/concurrent-users.k6.js
```

## Running Tests

### Basic Usage

```bash
# Run single test
k6 run tests/performance/api-load.k6.js

# Run with custom duration
k6 run --duration 10m tests/performance/api-load.k6.js

# Run with custom VUs
k6 run --vus 100 tests/performance/api-load.k6.js
```

### Environment Variables

```bash
# Set base URL
BASE_URL=https://staging.alphawhale.com k6 run tests/performance/api-load.k6.js

# Set auth token
AUTH_TOKEN=your-token k6 run tests/performance/api-load.k6.js

# Combined
BASE_URL=https://staging.alphawhale.com AUTH_TOKEN=your-token k6 run tests/performance/api-load.k6.js
```

### Output Formats

```bash
# JSON output
k6 run --out json=results.json tests/performance/api-load.k6.js

# CSV output
k6 run --out csv=results.csv tests/performance/api-load.k6.js

# InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 tests/performance/api-load.k6.js

# Cloud output
k6 run --out cloud tests/performance/api-load.k6.js
```

### Docker Usage

```bash
# Run with Docker
docker run --rm -i grafana/k6 run - <tests/performance/api-load.k6.js

# Run with environment variables
docker run --rm -i \
  -e BASE_URL=https://staging.alphawhale.com \
  -e AUTH_TOKEN=your-token \
  grafana/k6 run - <tests/performance/api-load.k6.js
```

## Interpreting Results

### Key Metrics

```
✓ checks.........................: 95.00%  ✓ 950   ✗ 50
✓ snapshot_cached_latency p95...: 580.00ms
✓ snapshot_cold_latency p95.....: 1150.00ms
✓ approvals_latency p95.........: 850.00ms
✓ actions_latency p95...........: 750.00ms
✓ error_rate....................: 0.50%
```

### Success Criteria

- ✅ **All checks pass** - No threshold violations
- ✅ **P95 latencies** - Within target ranges
- ✅ **Error rate** - Below threshold
- ✅ **No failed requests** - All requests succeed

### Failure Investigation

If tests fail:

1. **Check P95 latencies** - Identify slow endpoints
2. **Review error rate** - Investigate failed requests
3. **Check database** - Verify query performance
4. **Review caching** - Ensure cache hit rates
5. **Check resources** - CPU, memory, network

## Performance Optimization

### Database Optimization

```sql
-- Add missing indexes
CREATE INDEX idx_portfolio_snapshots_latest 
ON portfolio_snapshots (user_id, scope_key, updated_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM portfolio_snapshots 
WHERE user_id = 'user_123' 
ORDER BY updated_at DESC LIMIT 1;
```

### Caching Optimization

```typescript
// Increase cache TTL for stable data
const cacheTTL = {
  critical: 10,  // 10 seconds
  high: 30,      // 30 seconds
  medium: 60,    // 60 seconds
  low: 120,      // 120 seconds
};
```

### API Optimization

```typescript
// Enable response compression
app.use(compression());

// Add connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
});
```

## Weekly Performance Tests

Performance tests should be run **weekly** as part of the V2 testing strategy:

```bash
# Weekly performance suite
npm run test:performance:weekly
```

This command runs:
1. All k6 performance tests
2. Extended duration tests
3. Generates performance report
4. Compares against baseline

## Integration with CI/CD

Add to `.github/workflows/performance-tests.yml`:

```yaml
name: Weekly Performance Tests

on:
  schedule:
    - cron: '0 1 * * 0' # Every Sunday at 1 AM
  workflow_dispatch: # Manual trigger

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run API Load Tests
        run: k6 run tests/performance/api-load.k6.js
      
      - name: Run Multi-Wallet Tests
        run: k6 run tests/performance/multi-wallet.k6.js
      
      - name: Run Concurrent Users Tests
        run: k6 run tests/performance/concurrent-users.k6.js
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-test-results
          path: |
            summary.json
            multi-wallet-summary.json
            concurrent-users-summary.json
```

## Performance Monitoring

### Grafana Dashboard

Create a Grafana dashboard to visualize k6 metrics:

1. Install InfluxDB
2. Configure k6 to output to InfluxDB
3. Create Grafana dashboard with panels for:
   - Request rate
   - Response time (P50, P95, P99)
   - Error rate
   - Active VUs

### Alerting

Set up alerts for performance degradation:

```yaml
# Alert when P95 latency exceeds threshold
- alert: HighLatency
  expr: k6_http_req_duration_p95 > 1200
  for: 5m
  annotations:
    summary: "High API latency detected"
```

## Related Documentation

- [Adversarial Tests](../adversarial/README.md)
- [Chaos Tests](../chaos/README.md)
- [Requirements Document](../../.kiro/specs/unified-portfolio/requirements.md)
- [Design Document](../../.kiro/specs/unified-portfolio/design.md)
