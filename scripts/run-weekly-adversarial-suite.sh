#!/bin/bash

# Weekly Adversarial Suite Runner
# Runs all adversarial, chaos, and performance tests
# Requirements: 13.3 (advanced adversarial)

set -e

echo "=========================================="
echo "Weekly Adversarial Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
  local test_name=$1
  local test_command=$2
  
  echo ""
  echo "=========================================="
  echo "Running: $test_name"
  echo "=========================================="
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if eval "$test_command"; then
    echo -e "${GREEN}✓ $test_name PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ $test_name FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
  echo -e "${YELLOW}Warning: k6 is not installed. Skipping performance tests.${NC}"
  echo "Install k6: https://k6.io/docs/getting-started/installation/"
  SKIP_K6=true
else
  SKIP_K6=false
fi

# 1. Adversarial Security Tests
echo ""
echo "=========================================="
echo "Phase 1: Adversarial Security Tests"
echo "=========================================="

run_test "Prompt Injection Tests" "npx playwright test tests/adversarial/prompt-injection.spec.ts"
run_test "Payload Mismatch Tests" "npx playwright test tests/adversarial/payload-mismatch.spec.ts"
run_test "Deep-Link Phishing Tests" "npx playwright test tests/adversarial/deep-link-phishing.spec.ts"

# 2. Chaos Engineering Tests
echo ""
echo "=========================================="
echo "Phase 2: Chaos Engineering Tests"
echo "=========================================="

run_test "Chaos Engineering Tests" "npx playwright test tests/chaos/chaos-engineering.spec.ts"

# 3. Performance Tests (k6)
if [ "$SKIP_K6" = false ]; then
  echo ""
  echo "=========================================="
  echo "Phase 3: Performance Tests (k6)"
  echo "=========================================="
  
  run_test "API Load Test" "k6 run tests/performance/api-load.k6.js"
  run_test "Multi-Wallet Aggregation Test" "k6 run tests/performance/multi-wallet.k6.js"
  run_test "Concurrent Users Test" "k6 run tests/performance/concurrent-users.k6.js"
else
  echo ""
  echo "=========================================="
  echo "Phase 3: Performance Tests (SKIPPED)"
  echo "=========================================="
  echo -e "${YELLOW}k6 not installed - skipping performance tests${NC}"
fi

# 4. Generate Report
echo ""
echo "=========================================="
echo "Test Suite Summary"
echo "=========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
