#!/bin/bash

# HarvestPro Complete Test Runner
# Runs ALL HarvestPro tests: Client-side (Vitest) + Server-side (Deno)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 HarvestPro Complete Test Suite"
echo "=================================="
echo ""

# Track results
CLIENT_PASSED=false
SERVER_PASSED=false

# Run client-side tests (Vitest)
echo -e "${YELLOW}📦 Phase 1: Client-Side Tests (Vitest)${NC}"
echo "-----------------------------------"
echo "Running tests in: src/lib/harvestpro/__tests__/"
echo ""

if npm test -- src/lib/harvestpro/__tests__/ --run; then
    echo -e "${GREEN}✅ Client-side tests PASSED${NC}"
    CLIENT_PASSED=true
else
    echo -e "${RED}❌ Client-side tests FAILED${NC}"
    CLIENT_PASSED=false
fi

echo ""
echo ""

# Run server-side tests (Deno)
echo -e "${YELLOW}📦 Phase 2: Server-Side Tests (Deno)${NC}"
echo "-----------------------------------"
echo "Running tests in: supabase/functions/_shared/harvestpro/__tests__/"
echo ""

if ./supabase/functions/_shared/harvestpro/__tests__/run-all-tests.sh; then
    echo -e "${GREEN}✅ Server-side tests PASSED${NC}"
    SERVER_PASSED=true
else
    echo -e "${RED}❌ Server-side tests FAILED${NC}"
    SERVER_PASSED=false
fi

echo ""
echo "=================================="
echo -e "${BLUE}📊 Final Summary${NC}"
echo "=================================="

if [ "$CLIENT_PASSED" = true ] && [ "$SERVER_PASSED" = true ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "🎉 HarvestPro complete test suite passed!"
    echo "   ✅ Client-side tests (Vitest)"
    echo "   ✅ Server-side unit tests (Deno)"
    echo "   ✅ Server-side property tests (Deno)"
    echo ""
    echo "Total coverage:"
    echo "   - 11 client-side test files"
    echo "   - 14 server-side unit test files"
    echo "   - 2 property-based test files (12 properties, 1,850+ runs)"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo ""
    if [ "$CLIENT_PASSED" = false ]; then
        echo -e "${RED}   ❌ Client-side tests failed${NC}"
    fi
    if [ "$SERVER_PASSED" = false ]; then
        echo -e "${RED}   ❌ Server-side tests failed${NC}"
    fi
    echo ""
    echo "Please review the failed tests above and fix any issues."
    exit 1
fi
