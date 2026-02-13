# Weekly Adversarial Suite - V2

## Overview

The Weekly Adversarial Suite is a comprehensive testing framework for the Unified Portfolio System that validates security, resilience, and performance under adversarial conditions. This suite is part of the V2 testing strategy and should be run weekly to ensure the system can withstand real-world threats.

## Components

### 1. Adversarial Security Tests

Tests the system's resistance to various attack vectors:

- **Prompt Injection** - Validates Copilot's resistance to malicious instructions
- **Payload Mismatch** - Ensures transaction payloads match simulations
- **Deep-Link Phishing** - Protects against phishing via deep links and QR codes

**Location:** `tests/adversarial/`

**Requirements:** 13.3, 9.1, 9.2, 9.3, 6.6, 6.7, 8.1, 14.1

### 2. Chaos Engineering Tests

Tests system resilience under failure conditions:

- **Random API Failures** - 30-50% failure rates
- **Service Outages** - Complete service unavailability
- **Network Instability** - Intermittent connections and slow responses
- **Cache Resilience** - Cached data serving during outages
- **Recovery Mechanisms** - Automatic retry and restoration

**Location:** `tests/chaos/`

**Requirements:** 13.3, 10.2, 10.6

### 3. Performance Tests (k6)

Tests system performance under load:

- **API Load Testing** - 100-200 concurrent users
- **Multi-Wallet Aggregation** - 2-20 wallets per user
- **Concurrent Users** - Spike and sustained load scenarios

**Location:** `tests/performance/`

**Requirements:** 13.3, 10.3, 10.4, 12.1, 12.2, 12.3

## Running the Suite

### Quick Start

```bash
# Run complete weekly adversarial suite
npm run test:adversarial:weekly
```

This command runs all three test categories and generates a comprehensive report.

### Individual Test Categories

```bash
# Run only adversarial security tests
npm run test:adversarial

# Run only chaos engineering tests
npm run test:chaos

# Run only k6 performance tests
npm run test:k6:all
```

### Specific Test Suites

```bash
# Adversarial tests
npm run test:adversarial:prompt-injection
npm run test:adversarial:payload-mismatch
npm run test:adversarial:deep-link

# k6 performance tests
npm run test:k6:api-load
npm run test:k6:multi-wallet
npm run test:k6:concurrent
```

## Prerequisites

### Required Tools

1. **Node.js** (18+)
2. **Playwright** (installed via npm)
3. **k6** (load testing tool)

### Installing k6

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

### Environment Variables

```bash
# Base URL for testing
export BASE_URL=https://staging.alphawhale.com

# Authentication token
export AUTH_TOKEN=your-test-token

# Chaos test configuration
export CHAOS_DURATION=60000        # 60 seconds
export CHAOS_FAILURE_RATE=0.3      # 30% failure rate
```

## Expected Results

### Success Criteria

All tests should **PASS**, indicating:

✅ **Adversarial Security**
- Copilot resists prompt injection
- Payload mismatches are detected and blocked
- Deep-link phishing triggers warnings
- Audit events logged for all security incidents

✅ **Chaos Engineering**
- System remains stable under failures
- No crashes or unhandled errors
- Graceful degradation activated
- Cached data served appropriately
- Automatic recovery after restoration

✅ **Performance**
- API endpoints meet latency targets
- Multi-wallet aggregation performs well
- System handles concurrent users
- Error rates below thresholds

### Performance Targets

| Metric | Target |
|--------|--------|
| Snapshot cached P95 | < 600ms |
| Snapshot cold P95 | < 1200ms |
| Approvals P95 | < 900ms |
| Actions P95 | < 800ms |
| Multi-wallet aggregation P95 | < 2000ms |
| Unified risk scoring P95 | < 1500ms |
| Error rate | < 1% |

## Report Generation

After running the suite, reports are generated in:

```
test-results/adversarial-{timestamp}/
├── adversarial/
│   └── index.html          # Playwright HTML report
├── chaos/
│   └── index.html          # Playwright HTML report
├── api-load-results.json   # k6 JSON results
├── multi-wallet-results.json
├── concurrent-users-results.json
└── summary.txt             # Overall summary
```

### Viewing Reports

```bash
# Open Playwright reports
npx playwright show-report test-results/adversarial-{timestamp}/adversarial
npx playwright show-report test-results/adversarial-{timestamp}/chaos

# View k6 results
cat test-results/adversarial-{timestamp}/api-load-results.json | jq

# View summary
cat test-results/adversarial-{timestamp}/summary.txt
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/weekly-adversarial-suite.yml`:

```yaml
name: Weekly Adversarial Suite

on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday at midnight UTC
  workflow_dispatch: # Manual trigger

jobs:
  adversarial-suite:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Weekly Adversarial Suite
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: npm run test:adversarial:weekly
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: adversarial-suite-results
          path: test-results/
          retention-days: 30
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Weekly Adversarial Suite failed! Review the results.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Failure Response

### Critical Security Failures

If adversarial security tests fail:

1. **Immediate Action**
   - File critical security issue
   - Notify security team
   - Halt deployments

2. **Investigation**
   - Review failing test output
   - Capture audit logs
   - Identify affected components

3. **Remediation**
   - Implement security patch
   - Re-run adversarial suite
   - Verify fix effectiveness

4. **Post-Mortem**
   - Document vulnerability
   - Update test coverage
   - Review security practices

### Chaos Test Failures

If chaos engineering tests fail:

1. **Assess Impact**
   - Determine failure severity
   - Check production stability
   - Review error rates

2. **Root Cause Analysis**
   - Identify failure points
   - Review error handling
   - Check retry mechanisms

3. **Improve Resilience**
   - Enhance error boundaries
   - Improve cache strategies
   - Add retry logic

### Performance Failures

If performance tests fail:

1. **Identify Bottlenecks**
   - Review slow endpoints
   - Check database queries
   - Analyze cache hit rates

2. **Optimize**
   - Add database indexes
   - Improve caching
   - Optimize queries

3. **Verify**
   - Re-run performance tests
   - Monitor production metrics
   - Adjust thresholds if needed

## Maintenance

### Weekly Tasks

- [ ] Run complete adversarial suite
- [ ] Review all test results
- [ ] Update test data if needed
- [ ] Check for new attack vectors
- [ ] Update documentation

### Monthly Tasks

- [ ] Review and update attack vectors
- [ ] Add new chaos scenarios
- [ ] Adjust performance thresholds
- [ ] Update CI/CD workflows
- [ ] Review security incidents

### Quarterly Tasks

- [ ] Comprehensive security audit
- [ ] Update testing strategy
- [ ] Review and improve test coverage
- [ ] Update documentation
- [ ] Train team on new threats

## Metrics and Monitoring

### Key Metrics

Track these metrics over time:

1. **Security Metrics**
   - Prompt injection resistance rate
   - Payload mismatch detection rate
   - Deep-link phishing warning rate
   - Audit event logging completeness

2. **Resilience Metrics**
   - System uptime during failures
   - Cache hit rate during outages
   - Recovery time after restoration
   - Error boundary effectiveness

3. **Performance Metrics**
   - API latency trends (P50, P95, P99)
   - Error rate trends
   - Concurrent user capacity
   - Multi-wallet aggregation performance

### Dashboards

Create monitoring dashboards for:

- Weekly test results trends
- Performance metrics over time
- Security incident tracking
- Chaos test outcomes

## Related Documentation

- [Adversarial Tests README](../tests/adversarial/README.md)
- [Chaos Tests README](../tests/chaos/README.md)
- [Performance Tests README](../tests/performance/README.md)
- [Requirements Document](../.kiro/specs/unified-portfolio/requirements.md)
- [Design Document](../.kiro/specs/unified-portfolio/design.md)

## Support

For questions or issues:

1. Review test documentation
2. Check CI/CD logs
3. Contact security team for critical issues
4. File GitHub issue for test improvements
