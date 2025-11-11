#!/bin/bash

# Performance Testing Script for Hunter Screen
# Tests FCP, TTI, and API response times
# Requirements: 1.1-1.6

set -e

echo "🚀 Starting Performance Tests for Hunter Screen"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASS=0
FAIL=0
WARN=0

# Function to test API response time
test_api_performance() {
  local endpoint=$1
  local max_time=$2
  local name=$3
  
  echo ""
  echo "Testing: $name"
  echo "Endpoint: $endpoint"
  
  # Run 10 requests and calculate P95
  times=()
  for i in {1..10}; do
    time=$(curl -o /dev/null -s -w '%{time_total}\n' "$endpoint")
    times+=($time)
  done
  
  # Sort times and get P95 (9th value out of 10)
  IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
  p95=${sorted[8]}
  
  # Convert to milliseconds
  p95_ms=$(echo "$p95 * 1000" | bc)
  max_ms=$(echo "$max_time * 1000" | bc)
  
  echo "P95 Response Time: ${p95_ms}ms (max: ${max_ms}ms)"
  
  # Check if within threshold
  if (( $(echo "$p95 <= $max_time" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
  fi
}

# Function to test Lighthouse metrics
test_lighthouse() {
  echo ""
  echo "Running Lighthouse CI Tests..."
  echo "==============================="
  
  # Check if lhci is installed
  if ! command -v lhci &> /dev/null; then
    echo -e "${YELLOW}⚠ Lighthouse CI not installed. Installing...${NC}"
    npm install -g @lhci/cli
  fi
  
  # Run Lighthouse CI
  if lhci autorun; then
    echo -e "${GREEN}✓ Lighthouse tests passed${NC}"
    ((PASS++))
  else
    echo -e "${RED}✗ Lighthouse tests failed${NC}"
    ((FAIL++))
  fi
}

# Function to test bundle size
test_bundle_size() {
  echo ""
  echo "Checking Bundle Sizes..."
  echo "========================"
  
  # Build the project
  npm run build
  
  # Check main bundle size
  main_bundle=$(find dist/assets -name "index-*.js" -type f -exec du -k {} \; | sort -n | tail -1 | cut -f1)
  
  echo "Main bundle size: ${main_bundle}KB"
  
  # Warn if bundle is too large (>500KB)
  if [ "$main_bundle" -gt 500 ]; then
    echo -e "${YELLOW}⚠ WARNING: Main bundle is larger than 500KB${NC}"
    ((WARN++))
  else
    echo -e "${GREEN}✓ Bundle size is acceptable${NC}"
    ((PASS++))
  fi
  
  # Check for code splitting
  chunk_count=$(find dist/assets -name "*.js" -type f | wc -l)
  echo "Number of JS chunks: $chunk_count"
  
  if [ "$chunk_count" -lt 3 ]; then
    echo -e "${YELLOW}⚠ WARNING: Limited code splitting detected${NC}"
    ((WARN++))
  else
    echo -e "${GREEN}✓ Code splitting is working${NC}"
    ((PASS++))
  fi
}

# Start local server if not running
echo "Checking if dev server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Starting dev server..."
  npm run dev &
  SERVER_PID=$!
  sleep 10
  CLEANUP_SERVER=true
else
  echo "Dev server already running"
  CLEANUP_SERVER=false
fi

# Run API performance tests
echo ""
echo "API Performance Tests"
echo "===================="

test_api_performance "http://localhost:3000/api/hunter/opportunities?mode=fixtures" 0.2 "Hunter Opportunities API (P95 < 200ms)"
test_api_performance "http://localhost:3000/api/guardian/summary?ids=test-1,test-2" 0.2 "Guardian Summary API (P95 < 200ms)"

# Run Lighthouse tests
test_lighthouse

# Run bundle size tests
test_bundle_size

# Cleanup
if [ "$CLEANUP_SERVER" = true ]; then
  echo ""
  echo "Stopping dev server..."
  kill $SERVER_PID
fi

# Summary
echo ""
echo "================================================"
echo "Performance Test Summary"
echo "================================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ Performance tests failed${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All performance tests passed${NC}"
  exit 0
fi
