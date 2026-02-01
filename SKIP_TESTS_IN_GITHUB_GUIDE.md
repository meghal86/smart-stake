# Skip Tests in GitHub Actions - Complete Guide

## Problem
Your GitHub Actions CI workflow runs both unit tests and property-based tests on every deployment, which can be slow and may not be necessary for every push.

## Solutions

### Option 1: Comment Out Test Jobs (Quick Fix)
Simply comment out the test jobs in your CI workflow.

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, feat/* ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm run lint

  # TESTS DISABLED - Uncomment to re-enable
  # test:
  #   runs-on: ubuntu-latest
  #   steps:
  #   - uses: actions/checkout@v4
  #   - uses: actions/setup-node@v4
  #     with:
  #       node-version: '20'
  #       cache: 'npm'
  #   
  #   - run: npm ci
  #   - name: Run unit tests
  #     run: npm test -- --run
  #   - name: Run property-based tests
  #     run: >
  #       npm test -- run 
  #       --testNamePattern 'Feature: multi-chain-wallet-system, Property'
  #     timeout-minutes: 10

  # property-tests:
  #   runs-on: ubuntu-latest
  #   name: Property-Based Tests
  #   timeout-minutes: 15
  #   steps:
  #   - uses: actions/checkout@v4
  #   - uses: actions/setup-node@v4
  #     with:
  #       node-version: '20'
  #       cache: 'npm'
  #   
  #   - run: npm ci
  #   - name: Run all property-based tests
  #     run: >
  #       npm test -- run 
  #       --testNamePattern 'Feature: multi-chain-wallet-system, Property'
  #   - name: Generate test report
  #     if: always()
  #     run: >
  #       npm test -- run --reporter=verbose 
  #       --testNamePattern 'Feature: multi-chain-wallet-system, Property' 
  #       > property-test-report.txt 2>&1 || true
  #   - name: Upload test report
  #     if: always()
  #     uses: actions/upload-artifact@v4
  #     with:
  #       name: property-test-report
  #       path: property-test-report.txt
```

---

### Option 2: Skip Tests with Commit Message (Flexible)
Run tests only when you want them by checking the commit message.

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, feat/* ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm run lint

  test:
    runs-on: ubuntu-latest
    # Only run if commit message contains [test] or [run-tests]
    if: contains(github.event.head_commit.message, '[test]') || contains(github.event.head_commit.message, '[run-tests]')
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run unit tests
      run: npm test -- --run
    - name: Run property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
      timeout-minutes: 10

  property-tests:
    runs-on: ubuntu-latest
    name: Property-Based Tests
    timeout-minutes: 15
    # Only run if commit message contains [test] or [run-tests]
    if: contains(github.event.head_commit.message, '[test]') || contains(github.event.head_commit.message, '[run-tests]')
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run all property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
    - name: Generate test report
      if: always()
      run: >
        npm test -- run --reporter=verbose 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property' 
        > property-test-report.txt 2>&1 || true
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: property-test-report
        path: property-test-report.txt
```

**Usage:**
```bash
# Tests will NOT run
git commit -m "fix: update wallet context"

# Tests WILL run
git commit -m "fix: update wallet context [test]"
git commit -m "feat: new feature [run-tests]"
```

---

### Option 3: Run Tests Only on Pull Requests (Recommended)
Skip tests on direct pushes, but run them on PRs.

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, feat/* ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm run lint

  test:
    runs-on: ubuntu-latest
    # Only run on pull requests
    if: github.event_name == 'pull_request'
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run unit tests
      run: npm test -- --run
    - name: Run property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
      timeout-minutes: 10

  property-tests:
    runs-on: ubuntu-latest
    name: Property-Based Tests
    timeout-minutes: 15
    # Only run on pull requests
    if: github.event_name == 'pull_request'
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run all property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
    - name: Generate test report
      if: always()
      run: >
        npm test -- run --reporter=verbose 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property' 
        > property-test-report.txt 2>&1 || true
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: property-test-report
        path: property-test-report.txt
```

---

### Option 4: Separate Workflows (Most Flexible)
Create separate workflows for build and tests.

**File 1**: `.github/workflows/build.yml` (Always runs)
```yaml
name: Build

on:
  push:
    branches: [ main, feat/* ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm run lint
```

**File 2**: `.github/workflows/tests.yml` (Manual trigger only)
```yaml
name: Tests

on:
  workflow_dispatch:  # Manual trigger only
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sunday at midnight (optional)

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run unit tests
      run: npm test -- --run
    - name: Run property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
      timeout-minutes: 10

  property-tests:
    runs-on: ubuntu-latest
    name: Property-Based Tests
    timeout-minutes: 15
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - name: Run all property-based tests
      run: >
        npm test -- run 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property'
    - name: Generate test report
      if: always()
      run: >
        npm test -- run --reporter=verbose 
        --testNamePattern 'Feature: multi-chain-wallet-system, Property' 
        > property-test-report.txt 2>&1 || true
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: property-test-report
        path: property-test-report.txt
```

**Usage**: Go to GitHub Actions tab → Select "Tests" workflow → Click "Run workflow"

---

## Recommendation

**For your use case, I recommend Option 3** (Run tests only on PRs):
- ✅ Fast deployments on direct pushes
- ✅ Tests still run on PRs before merging
- ✅ Good balance between speed and safety
- ✅ No manual intervention needed

## Implementation

Choose one of the options above and I'll update your `.github/workflows/ci.yml` file accordingly.

Which option would you like me to implement?
