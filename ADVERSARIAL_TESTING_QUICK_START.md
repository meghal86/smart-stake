# Adversarial Testing Quick Start Guide

## What is the Weekly Adversarial Suite?

A comprehensive testing framework that validates the Unified Portfolio System's security, resilience, and performance under adversarial conditions.

## Quick Commands

### Run Everything (Recommended Weekly)
```bash
npm run test:adversarial:weekly
```

### Run Individual Categories
```bash
# Security tests only
npm run test:adversarial

# Chaos tests only
npm run test:chaos

# Performance tests only (requires k6)
npm run test:k6:all
```

### Run Specific Tests
```bash
# Prompt injection resistance
npm run test:adversarial:prompt-injection

# Payload mismatch detection
npm run test:adversarial:payload-mismatch

# Deep-link phishing protection
npm run test:adversarial:deep-link

# API load testing
npm run test:k6:api-load

# Multi-wallet aggregation
npm run test:k6:multi-wallet

# Concurrent users
npm run test:k6:concurrent
```

## Prerequisites

### Required
- Node.js 18+
- Playwright (installed via `npm install`)

### Optional (for k6 tests)
- k6 load testing tool

**Install k6:**
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-get install k6
```

## What Gets Tested?

### 🛡️ Security (Adversarial Tests)
- ✅ Prompt injection resistance
- ✅ Payload mismatch detection
- ✅ Deep-link phishing protection
- ✅ QR code entry verification
- ✅ Social engineering detection

### 🔥 Resilience (Chaos Tests)
- ✅ Random API failures (30-50%)
- ✅ Complete service outages
- ✅ Network instability
- ✅ Cache resilience
- ✅ Automatic recovery

### ⚡ Performance (k6 Tests)
- ✅ API load testing (200 concurrent users)
- ✅ Multi-wallet aggregation (2-20 wallets)
- ✅ Concurrent user scenarios
- ✅ Spike testing

## Expected Results

All tests should **PASS** ✅

If any test fails:
1. Review the test report
2. Check the error logs
3. File a GitHub issue
4. For security failures: notify security team immediately

## Test Reports

Reports are generated in:
```
test-results/adversarial-{timestamp}/
├── adversarial/index.html    # Security test report
├── chaos/index.html          # Chaos test report
├── *.json                    # k6 performance results
└── summary.txt               # Overall summary
```

**View reports:**
```bash
# Open Playwright reports
npx playwright show-report test-results/adversarial-{timestamp}/adversarial

# View summary
cat test-results/adversarial-{timestamp}/summary.txt
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Snapshot cached P95 | < 600ms |
| Snapshot cold P95 | < 1200ms |
| Approvals P95 | < 900ms |
| Actions P95 | < 800ms |
| Multi-wallet P95 | < 2000ms |
| Error rate | < 1% |

## Troubleshooting

### "k6 command not found"
Install k6 (see Prerequisites above) or skip k6 tests:
```bash
npm run test:adversarial
npm run test:chaos
```

### Tests timing out
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60000, // 60 seconds
```

### High failure rate
Check:
1. Network connection
2. API availability
3. Database connectivity
4. Environment variables

## Environment Variables

```bash
# Optional: Set base URL
export BASE_URL=https://staging.alphawhale.com

# Optional: Set auth token
export AUTH_TOKEN=your-test-token

# Optional: Chaos test configuration
export CHAOS_DURATION=60000
export CHAOS_FAILURE_RATE=0.3
```

## CI/CD Integration

The suite runs automatically every Sunday at midnight UTC via GitHub Actions.

**Manual trigger:**
1. Go to Actions tab in GitHub
2. Select "Weekly Adversarial Suite"
3. Click "Run workflow"

## Documentation

- **Full Guide:** `docs/WEEKLY_ADVERSARIAL_SUITE.md`
- **Adversarial Tests:** `tests/adversarial/README.md`
- **Chaos Tests:** `tests/chaos/README.md`
- **Performance Tests:** `tests/performance/README.md`
- **Implementation:** `.kiro/specs/unified-portfolio/ADVERSARIAL_SUITE_IMPLEMENTATION.md`

## Support

Questions? Check:
1. Documentation (links above)
2. Test output and logs
3. GitHub Issues
4. Team Slack channel

## Quick Reference

```bash
# Full suite (weekly)
npm run test:adversarial:weekly

# Security only
npm run test:adversarial

# Resilience only
npm run test:chaos

# Performance only
npm run test:k6:all

# View last report
npx playwright show-report
```

---

**Remember:** Run the full suite weekly to ensure system security and resilience! 🛡️
