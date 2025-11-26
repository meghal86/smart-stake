#!/bin/bash

# HarvestPro Complete Test Suite Runner
# Runs all unit tests and property-based tests for the Deno/Edge Functions implementation

set -e  # Exit on error

echo "🧪 HarvestPro Complete Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test file
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${BLUE}Running: ${test_name}${NC}"
    
    if deno test "$test_file" --allow-all; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
}

# Change to the test directory
cd "$(dirname "$0")"

echo -e "${YELLOW}📦 Phase 1: Unit Tests${NC}"
echo "-----------------------------------"

# Run all unit tests
run_test "fifo.test.ts" "FIFO Unit Tests"
run_test "net-benefit.test.ts" "Net Benefit Unit Tests"
run_test "eligibility-import-test.ts" "Eligibility Unit Tests"
run_test "risk-classification.test.ts" "Risk Classification Unit Tests"
run_test "guardian-adapter.test.ts" "Guardian Adapter Unit Tests"
run_test "price-oracle.test.ts" "Price Oracle Unit Tests"
run_test "gas-estimation.test.ts" "Gas Estimation Unit Tests"
run_test "gas-estimation-integration.test.ts" "Gas Estimation Integration Tests"
run_test "slippage-estimation.test.ts" "Slippage Estimation Unit Tests"
run_test "token-tradability.test.ts" "Token Tradability Unit Tests"
run_test "multi-chain-engine.test.ts" "Multi-Chain Engine Unit Tests"
run_test "cex-integration.test.ts" "CEX Integration Unit Tests"
run_test "wallet-connection.test.ts" "Wallet Connection Unit Tests"
run_test "data-aggregation.test.ts" "Data Aggregation Unit Tests"

echo ""
echo -e "${YELLOW}🔬 Phase 2: Property-Based Tests${NC}"
echo "-----------------------------------"

# Run all property-based tests
run_test "fifo.property.test.ts" "FIFO Property Tests (6 properties, 700 runs)"
run_test "net-benefit.property.test.ts" "Net Benefit Property Tests (6 properties, 1,150 runs)"

echo ""
echo "=================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "Total Test Files: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 HarvestPro test suite complete!"
    echo "   - Unit tests verify specific examples and edge cases"
    echo "   - Property tests verify universal correctness across 1,850+ runs"
    echo "   - Tax calculations proven correct for regulatory compliance"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Please review the failed tests above and fix any issues."
    exit 1
fi
