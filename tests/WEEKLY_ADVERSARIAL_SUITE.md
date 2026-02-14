# Weekly Adversarial Suite

Comprehensive testing suite for the Unified Portfolio System (V2) that validates system resilience, security, and performance under adversarial conditions.

## Overview

The Weekly Adversarial Suite combines three types of advanced testing:

1. **Adversarial Security Tests** - Validate resistance to attacks
2. **Chaos Engineering Tests** - Ensure resilience under failures
3. **Performance Tests (k6)** - Verify scalability under load

**Requirements:** 13.3 (advanced adversarial), 10.3, 10.4

## Test Categories

### 1. Adversarial Security Tests

Tests system resistance to various attack vectors:

- **Prompt Injection** - Token names, transaction metadata manipulation
- **Payload Mismatch** - TOCTOU attacks, simulation vs execution mismatches
- **Deep-Link Phishing** - QR codes, social engineering, urgency manipulation

**Technology:** Playwright  
**Duration:** ~15 minutes  
**Requirements:** 13.3, 9.1, 9.2, 9.3, 6.6, 6.7, 8.1, 14.1

### 2. Chaos Engineering Tests

Tests system resilience under failure conditions:

- **Random API Failures** - 30-50% failure rates
- **Service Outages** - Guardian, Hunter, Simulation services down
- **Network Instability** - Intermittent failures, slow responses
- **Cache Resilience** - Serving cached data during outages
- **Recovery and Retry** - Automatic recovery mechanisms

**Technology:** Playwright  
**Duration:** ~20 minutes  
**Requirements:** 13.3, 10.2, 10.6

### 3. Performance Tests (k6)

Tests system performance under various load conditions:

#### API Load Test
- **Ramp-up:** 0 → 10 → 50 → 100 users over 7 minutes
- **Spike:** 100 → 200 users for 5 minutes
- **Ramp-down:** 200 → 0 users over 2 minutes
- **Endpoints:** snapshot, approvals, actions, positions
- **Targets:** P95 < 600ms (cached), P95 < 1200ms (cold)

#### Multi-Wallet Aggregation Test
- **Load:** 5 → 20 → 50 → 100 users over 14 minutes
- **Wallet counts:** 2, 3, 5, 10, 20 wallets per user
- **Targets:** P95 < 2000ms (aggregation), P95 < 1500ms (risk scoring)

#### Concurrent Users Test
- **Scenario 1:** Gradual ramp-up (0 → 50 → 100 users)
- **Scenario 2:** Spike test (0 → 200 users in 10s)
- **Scenario 3:** Constant load (50 users for 5 minutes)
- **Targets:** P95 < 1500ms (reads), P95 < 3000ms (simulation)

**Technology:** k6  
**Duration:** ~45 minutes  
**Requirements:** 13.3, 10.3, 10.4, 12.1, 12.2, 12.3

## Running Tests

### Prerequisites

**Node.js and npm:**
```bash
node --version  # v18+
npm --version
```

**Playwright:**
```bash
npm install
npx playwright install --with-deps
```

**k6 (for performance tests):**

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

### Run Complete Suite

```bash
# Run all tests (adversarial + chaos + performance)
npm run test:adversarial:weekly
```

This script runs:
1. All adversarial security tests
2. All chaos engineering tests
3. All k6 performance tests
4. Generates summary report

**Duration:** ~80 minutes total

### Run Individual Test Categories

```bash
# Adversarial security tests only
npm run test:adversarial

# Chaos engineering tests only
npm run test:chaos

# Performance tests only (k6)
npm run test:k6:all
```

### Run Specific Tests

```bash
# Prompt injection tests
npm run test:adversarial:prompt-injection

# Payload mismatch tests
npm run test:adversarial:payload-mismatch

# Deep-link phishing tests
npm run test:adversarial:deep-link

# API load test
npm run test:k6:api-load

# Multi-wallet aggregation test
npm run test:k6:multi-wallet

# Concurrent users test
npm run test:k6:concurrent
```

## Environment Configuration

### Environment Variables

```bash
# Base URL for tests
BASE_URL=https://staging.alphawhale.com

# Authentication token
AUTH_TOKEN=your-test-token

# Chaos test configuration
CHAOS_DURATION=60000        # Duration in milliseconds
CHAOS_FAILURE_RATE=0.3      # Failure rate (0.0 - 1.0)
CHAOS_DELAY_MS=5000         # Delay in milliseconds
```

### Example Usage

```bash
# Run against staging environment
BASE_URL=https://staging.alphawhale.com AUTH_TOKEN=test-token npm run test:adversarial:weekly

# Run k6 tests with custom settings
BASE_URL=https://staging.alphawhale.com AUTH_TOKEN=test-token k6 run tests/performance/api-load.k6.js
```

## CI/CD Integration

### GitHub Actions Workflow

The suite runs automatically every Sunday at 2 AM UTC via GitHub Actions:

**File:** `.github/workflows/weekly-adversarial-suite.yml`

**Triggers:**
- Scheduled: Every Sunday at 2 AM UTC
- Manual: Via workflow_dispatch

**Jobs:**
1. `adversarial-tests` - Runs all adversarial security tests
2. `chaos-tests` - Runs all chaos engineering tests
3. `performance-tests` - Runs all k6 performance tests
4. `report` - Generates summary report

**Artifacts:**
- `adversarial-test-report` - Playwright HTML report
- `chaos-test-report` - Playwright HTML report
- `performance-test-results` - k6 JSON summaries
- `weekly-adversarial-suite-report` - Markdown summary

**Retention:** 30 days (90 days for summary report)

### Manual Trigger

```bash
# Via GitHub CLI
gh workflow run weekly-adversarial-suite.yml

# Via GitHub UI
Actions → Weekly Adversarial Suite → Run workflow
```

### Skip Performance Tests

```bash
# Via GitHub CLI
gh workflow run weekly-adversarial-suite.yml -f skip_performance=true

# Via GitHub UI
Actions → Weekly Adversarial Suite → Run workflow → skip_performance: true
```

## Interpreting Results

### Success Criteria

All tests should **PASS**, indicating:

**Adversarial Security:**
- ✅ Copilot resists prompt injection
- ✅ Payload mismatches detected and blocked
- ✅ Deep-link phishing triggers warnings
- ✅ Audit events logged for security incidents

**Chaos Engineering:**
- ✅ System remains stable under failures
- ✅ No crashes or unhandled errors
- ✅ Graceful degradation activated
- ✅ Cached data served appropriately
- ✅ Automatic recovery after restoration

**Performance:**
- ✅ P95 latencies within targets
- ✅ Error rate < 1-5% (depending on test)
- ✅ No failed requests under normal load
- ✅ System scales to 200 concurrent users

### Failure Investigation

If tests fail:

1. **Check test reports** - Review Playwright HTML reports and k6 summaries
2. **Review error logs** - Check browser console and network logs
3. **Verify thresholds** - Ensure performance targets are realistic
4. **Check infrastructure** - Verify database, cache, and API health
5. **Reproduce locally** - Run failing tests locally for debugging

### Performance Metrics

**Key Metrics:**
- **P50 (Median)** - Typical user experience
- **P95** - 95th percentile - most users experience this or better
- **P99** - 99th percentile - worst-case for most users
- **Error Rate** - Percentage of failed requests
- **Throughput** - Requests per second

**Targets:**
- Snapshot cached P95 < 600ms
- Snapshot cold P95 < 1200ms
- Approvals P95 < 900ms
- Actions P95 < 800ms
- Aggregation P95 < 2000ms
- Error rate < 1-5%

## Maintenance

### Weekly Tasks

1. **Review test results** - Check GitHub Actions artifacts
2. **Investigate failures** - Debug and fix any failing tests
3. **Update baselines** - Adjust performance targets if needed
4. **Add new tests** - Cover newly discovered attack vectors

### Monthly Tasks

1. **Review attack vectors** - Research new security threats
2. **Update test scenarios** - Add tests for new vulnerabilities
3. **Performance tuning** - Optimize slow endpoints
4. **Documentation updates** - Keep README files current

### Quarterly Tasks

1. **Comprehensive review** - Analyze trends over time
2. **Capacity planning** - Adjust infrastructure based on load tests
3. **Security audit** - Review all security controls
4. **Test coverage analysis** - Identify gaps in testing

## Troubleshooting

### Common Issues

**Issue:** k6 not found
```bash
# Solution: Install k6
brew install k6  # macOS
choco install k6  # Windows
# See installation instructions above for Linux
```

**Issue:** Playwright browsers not installed
```bash
# Solution: Install Playwright browsers
npx playwright install --with-deps
```

**Issue:** Tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

**Issue:** High error rate in k6 tests
```bash
# Solution: Check API health and reduce load
# Verify BASE_URL is correct
# Check AUTH_TOKEN is valid
# Reduce VUs in k6 test options
```

**Issue:** Memory issues during tests
```bash
# Solution: Increase Node.js memory
NODE_OPTIONS='--max-old-space-size=8192' npm run test:adversarial:weekly
```

## Related Documentation

- [Adversarial Tests README](./adversarial/README.md)
- [Chaos Tests README](./chaos/README.md)
- [Performance Tests README](./performance/README.md)
- [Requirements Document](../.kiro/specs/unified-portfolio/requirements.md)
- [Design Document](../.kiro/specs/unified-portfolio/design.md)
- [Tasks Document](../.kiro/specs/unified-portfolio/tasks.md)

## Support

For issues or questions:
1. Check existing documentation
2. Review GitHub Actions logs
3. File an issue with test output and logs
4. Contact the development team

## Version History

- **v1.0.0** - Initial implementation (V2)
  - Adversarial security tests
  - Chaos engineering tests
  - k6 performance tests
  - GitHub Actions integration
  - Weekly automated runs
