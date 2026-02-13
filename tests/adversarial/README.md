# Adversarial Testing Suite

This directory contains advanced adversarial security tests for the Unified Portfolio System (V2).

## Overview

The adversarial testing suite validates the system's resistance to various attack vectors and security threats. These tests go beyond basic functional testing to ensure the system can withstand real-world adversarial conditions.

## Test Categories

### 1. Prompt Injection Tests (`prompt-injection.spec.ts`)

Tests Copilot's resistance to prompt injection attacks via:
- Token names with malicious instructions
- Transaction metadata manipulation
- Jailbreak attempts
- Automation promise injection
- SQL injection style attacks
- XSS attempts
- Unicode confusion
- Role confusion

**Requirements:** 13.3, 9.1, 9.2, 9.3

**Run:**
```bash
npx playwright test tests/adversarial/prompt-injection.spec.ts
```

### 2. Payload Mismatch Tests (`payload-mismatch.spec.ts`)

Tests detection and blocking of mismatched transaction payloads:
- Target contract mismatch
- Calldata class mismatch
- Asset delta mismatch beyond tolerance
- Stale simulation receipts
- TOCTOU (Time-of-Check-Time-of-Use) attack prevention
- Audit trail verification

**Requirements:** 13.3, 6.6, 6.7, 8.1

**Run:**
```bash
npx playwright test tests/adversarial/payload-mismatch.spec.ts
```

### 3. Deep-Link Phishing Tests (`deep-link-phishing.spec.ts`)

Tests protection against phishing attacks via deep links and QR codes:
- Direct execution attempts
- Approval phishing
- Transfer phishing
- Disguised actions
- QR code entry protection
- Social engineering detection
- Urgency manipulation
- Authority impersonation

**Requirements:** 13.3, 14.1

**Run:**
```bash
npx playwright test tests/adversarial/deep-link-phishing.spec.ts
```

## Running Tests

### Run All Adversarial Tests
```bash
npx playwright test tests/adversarial/
```

### Run Specific Test Suite
```bash
npx playwright test tests/adversarial/prompt-injection.spec.ts
npx playwright test tests/adversarial/payload-mismatch.spec.ts
npx playwright test tests/adversarial/deep-link-phishing.spec.ts
```

### Run with UI Mode (for debugging)
```bash
npx playwright test tests/adversarial/ --ui
```

### Run in Headed Mode
```bash
npx playwright test tests/adversarial/ --headed
```

### Generate HTML Report
```bash
npx playwright test tests/adversarial/
npx playwright show-report
```

## Test Configuration

Tests use Playwright with the following configuration:
- **Timeout:** 30 seconds per test
- **Retries:** 2 retries on failure
- **Browsers:** Chromium, Firefox, WebKit
- **Parallel execution:** Enabled

## Expected Results

All adversarial tests should **PASS**, indicating:
- ✅ Copilot resists prompt injection
- ✅ Payload mismatches are detected and blocked
- ✅ Deep-link phishing attempts trigger warnings
- ✅ Audit events are logged for all security incidents
- ✅ System remains stable under attack

## Failure Investigation

If tests fail:

1. **Check audit logs** - All security events should be logged
2. **Review error messages** - Should contain specific security warnings
3. **Verify blocking behavior** - Risky actions should be gated
4. **Check taxonomy compliance** - Copilot should only output valid types

## Weekly Adversarial Suite

These tests should be run **weekly** as part of the V2 testing strategy:

```bash
# Weekly adversarial suite
npm run test:adversarial:weekly
```

This command runs:
1. All adversarial tests
2. Chaos engineering tests
3. Performance tests under adversarial conditions
4. Generates comprehensive security report

## Integration with CI/CD

Add to `.github/workflows/adversarial-tests.yml`:

```yaml
name: Weekly Adversarial Tests

on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday at midnight
  workflow_dispatch: # Manual trigger

jobs:
  adversarial-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/adversarial/
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: adversarial-test-report
          path: playwright-report/
```

## Security Incident Response

If adversarial tests detect a vulnerability:

1. **Immediate:** File critical security issue
2. **Document:** Capture failing test output and logs
3. **Isolate:** Identify affected components
4. **Fix:** Implement security patch
5. **Verify:** Re-run adversarial suite
6. **Deploy:** Emergency security release

## Maintenance

- **Update attack vectors** as new threats emerge
- **Add new test cases** for discovered vulnerabilities
- **Review test coverage** quarterly
- **Update documentation** with new findings

## Related Documentation

- [Chaos Engineering Tests](../chaos/README.md)
- [Performance Tests](../performance/README.md)
- [Requirements Document](../../.kiro/specs/unified-portfolio/requirements.md)
- [Design Document](../../.kiro/specs/unified-portfolio/design.md)
