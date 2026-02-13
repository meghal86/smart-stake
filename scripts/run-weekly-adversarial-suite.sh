#!/bin/bash

# Weekly Adversarial Suite Runner
# Runs all V2 adversarial, chaos, and performance tests
# Requirements: 13.3 (advanced adversarial)

set -e

echo "========================================="
echo "Weekly Adversarial Suite - V2"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="test-results/adversarial-${TIMESTAMP}"

mkdir -p "${REPORT_DIR}"

echo "Report directory: ${REPORT_DIR}"
echo ""

# ============================================================================
# 1. ADVERSARIAL SECURITY TESTS
# ============================================================================

echo "${YELLOW}[1/4] Running Adversarial Security Tests...${NC}"
echo "-------------------------------------------"

if npx playwright test tests/adversarial/ --reporter=html --output="${REPORT_DIR}/adversarial"; then
  echo "${GREEN}✓ Adversarial tests passed${NC}"
  ADVERSARIAL_STATUS="PASS"
else
  echo "${RED}✗ Adversarial tests failed${NC}"
  ADVERSARIAL_STATUS="FAIL"
fi

echo ""

# ============================================================================
# 2. CHAOS ENGINEERING TESTS
# ============================================================================

echo "${YELLOW}[2/4] Running Chaos Engineering Tests...${NC}"
echo "-------------------------------------------"

if npx playwright test tests/chaos/ --reporter=html --output="${REPORT_DIR}/chaos"; then
  echo "${GREEN}✓ Chaos tests passed${NC}"
  CHAOS_STATUS="PASS"
else
  echo "${RED}✗ Chaos tests failed${NC}"
  CHAOS_STATUS="FAIL"
fi

echo ""

# ============================================================================
# 3. PERFORMANCE TESTS (k6)
# ============================================================================

echo "${YELLOW}[3/4] Running Performance Tests (k6)...${NC}"
echo "-------------------------------------------"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "${RED}✗ k6 is not installed${NC}"
  echo "Install k6: https://k6.io/docs/getting-started/installation/"
  PERFORMANCE_STATUS="SKIP"
else
  # API Load Tests
  echo "Running API Load Tests..."
  if k6 run --out json="${REPORT_DIR}/api-load-results.json" tests/performance/api-load.k6.js; then
    echo "${GREEN}✓ API load tests passed${NC}"
    API_LOAD_STATUS="PASS"
  else
    echo "${RED}✗ API load tests failed${NC}"
    API_LOAD_STATUS="FAIL"
  fi
  
  echo ""
  
  # Multi-Wallet Tests
  echo "Running Multi-Wallet Tests..."
  if k6 run --out json="${REPORT_DIR}/multi-wallet-results.json" tests/performance/multi-wallet.k6.js; then
    echo "${GREEN}✓ Multi-wallet tests passed${NC}"
    MULTI_WALLET_STATUS="PASS"
  else
    echo "${RED}✗ Multi-wallet tests failed${NC}"
    MULTI_WALLET_STATUS="FAIL"
  fi
  
  echo ""
  
  # Concurrent Users Tests
  echo "Running Concurrent Users Tests..."
  if k6 run --out json="${REPORT_DIR}/concurrent-users-results.json" tests/performance/concurrent-users.k6.js; then
    echo "${GREEN}✓ Concurrent users tests passed${NC}"
    CONCURRENT_STATUS="PASS"
  else
    echo "${RED}✗ Concurrent users tests failed${NC}"
    CONCURRENT_STATUS="FAIL"
  fi
  
  # Overall performance status
  if [[ "$API_LOAD_STATUS" == "PASS" && "$MULTI_WALLET_STATUS" == "PASS" && "$CONCURRENT_STATUS" == "PASS" ]]; then
    PERFORMANCE_STATUS="PASS"
  else
    PERFORMANCE_STATUS="FAIL"
  fi
fi

echo ""

# ============================================================================
# 4. GENERATE SUMMARY REPORT
# ============================================================================

echo "${YELLOW}[4/4] Generating Summary Report...${NC}"
echo "-------------------------------------------"

SUMMARY_FILE="${REPORT_DIR}/summary.txt"

cat > "${SUMMARY_FILE}" << EOF
========================================
Weekly Adversarial Suite Summary
========================================

Timestamp: ${TIMESTAMP}
Date: $(date)

Test Results:
-------------
Adversarial Security Tests: ${ADVERSARIAL_STATUS}
Chaos Engineering Tests:    ${CHAOS_STATUS}
Performance Tests (k6):     ${PERFORMANCE_STATUS}
  - API Load Tests:         ${API_LOAD_STATUS:-N/A}
  - Multi-Wallet Tests:     ${MULTI_WALLET_STATUS:-N/A}
  - Concurrent Users Tests: ${CONCURRENT_STATUS:-N/A}

Report Location:
----------------
${REPORT_DIR}

Detailed Reports:
-----------------
- Adversarial: ${REPORT_DIR}/adversarial/index.html
- Chaos:       ${REPORT_DIR}/chaos/index.html
- Performance: ${REPORT_DIR}/*-results.json

Next Steps:
-----------
EOF

# Add next steps based on results
if [[ "$ADVERSARIAL_STATUS" == "FAIL" ]]; then
  echo "1. Review adversarial test failures - CRITICAL SECURITY ISSUE" >> "${SUMMARY_FILE}"
fi

if [[ "$CHAOS_STATUS" == "FAIL" ]]; then
  echo "2. Review chaos test failures - System resilience issue" >> "${SUMMARY_FILE}"
fi

if [[ "$PERFORMANCE_STATUS" == "FAIL" ]]; then
  echo "3. Review performance test failures - Performance degradation" >> "${SUMMARY_FILE}"
fi

if [[ "$ADVERSARIAL_STATUS" == "PASS" && "$CHAOS_STATUS" == "PASS" && "$PERFORMANCE_STATUS" == "PASS" ]]; then
  echo "✓ All tests passed - System is secure and resilient" >> "${SUMMARY_FILE}"
fi

cat "${SUMMARY_FILE}"

echo ""
echo "========================================="
echo "Weekly Adversarial Suite Complete"
echo "========================================="

# Exit with error if any tests failed
if [[ "$ADVERSARIAL_STATUS" == "FAIL" || "$CHAOS_STATUS" == "FAIL" || "$PERFORMANCE_STATUS" == "FAIL" ]]; then
  echo "${RED}Some tests failed. Review the reports above.${NC}"
  exit 1
else
  echo "${GREEN}All tests passed!${NC}"
  exit 0
fi
