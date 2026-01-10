#!/bin/bash

# Property-Based Test Runner Script
# 
# This script runs all property-based tests for the multi-chain wallet system
# with proper reporting and CI/CD integration.
#
# Usage:
#   ./scripts/run-property-tests.sh [options]
#
# Options:
#   --watch       Run in watch mode
#   --coverage    Generate coverage report
#   --verbose     Verbose output
#   --ci          CI mode (no watch, exit on failure)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
WATCH=false
COVERAGE=false
VERBOSE=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --watch)
      WATCH=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Property-Based Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Print configuration
echo -e "${YELLOW}Configuration:${NC}"
echo "  Watch mode: $WATCH"
echo "  Coverage: $COVERAGE"
echo "  Verbose: $VERBOSE"
echo "  CI mode: $CI_MODE"
echo ""

# Build command
CMD="npm test -- --run"

if [ "$WATCH" = true ]; then
  CMD="npm test"
fi

if [ "$VERBOSE" = true ]; then
  CMD="$CMD --reporter=verbose"
fi

if [ "$COVERAGE" = true ]; then
  CMD="$CMD --coverage"
fi

# Filter to property tests
CMD="$CMD --grep 'Feature: multi-chain-wallet-system, Property'"

echo -e "${BLUE}Running command:${NC}"
echo "  $CMD"
echo ""

# Run tests
if eval "$CMD"; then
  echo ""
  echo -e "${GREEN}✓ All property tests passed!${NC}"
  echo ""
  
  # Print summary
  if [ -f "property-test-results.json" ]; then
    echo -e "${YELLOW}Test Summary:${NC}"
    # Extract test count from JSON (basic parsing)
    TOTAL=$(grep -o '"numPassedTests":[0-9]*' property-test-results.json | head -1 | grep -o '[0-9]*' || echo "0")
    echo "  Total tests passed: $TOTAL"
  fi
  
  exit 0
else
  echo ""
  echo -e "${RED}✗ Property tests failed!${NC}"
  echo ""
  
  if [ "$CI_MODE" = true ]; then
    echo -e "${RED}CI mode: Exiting with failure${NC}"
    exit 1
  fi
  
  exit 1
fi
