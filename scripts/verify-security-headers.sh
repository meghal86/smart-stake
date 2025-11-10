#!/bin/bash

# Security Headers Verification Script
# Verifies that all required security headers are present in HTTP responses

set -e

echo "🔒 Security Headers Verification Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to localhost, but allow override
BASE_URL="${1:-http://localhost:3000}"

echo "Testing URL: $BASE_URL"
echo ""

# Function to check if a header exists
check_header() {
  local header_name="$1"
  local expected_value="$2"
  local response="$3"
  
  if echo "$response" | grep -qi "^$header_name:"; then
    local actual_value=$(echo "$response" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r')
    
    if [ -n "$expected_value" ]; then
      if echo "$actual_value" | grep -q "$expected_value"; then
        echo -e "${GREEN}✓${NC} $header_name: Present and correct"
        return 0
      else
        echo -e "${RED}✗${NC} $header_name: Present but incorrect"
        echo "  Expected: $expected_value"
        echo "  Got: $actual_value"
        return 1
      fi
    else
      echo -e "${GREEN}✓${NC} $header_name: Present"
      return 0
    fi
  else
    echo -e "${RED}✗${NC} $header_name: Missing"
    return 1
  fi
}

# Fetch headers
echo "Fetching headers..."
RESPONSE=$(curl -s -I "$BASE_URL" 2>&1)

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Could not connect to $BASE_URL${NC}"
  echo "Make sure the development server is running:"
  echo "  npm run dev"
  exit 1
fi

echo ""
echo "Checking security headers..."
echo ""

# Track failures
FAILURES=0

# Check each required header
check_header "Content-Security-Policy" "" "$RESPONSE" || ((FAILURES++))
check_header "X-Content-Type-Options" "nosniff" "$RESPONSE" || ((FAILURES++))
check_header "X-Frame-Options" "DENY" "$RESPONSE" || ((FAILURES++))
check_header "Permissions-Policy" "camera=(), microphone=(), geolocation=()" "$RESPONSE" || ((FAILURES++))
check_header "Referrer-Policy" "strict-origin-when-cross-origin" "$RESPONSE" || ((FAILURES++))

# HSTS is only in production
if [[ "$BASE_URL" == https://* ]]; then
  check_header "Strict-Transport-Security" "max-age=31536000" "$RESPONSE" || ((FAILURES++))
else
  echo -e "${YELLOW}⚠${NC} Strict-Transport-Security: Skipped (only in production/HTTPS)"
fi

echo ""
echo "========================================"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✓ All security headers are correctly configured!${NC}"
  exit 0
else
  echo -e "${RED}✗ $FAILURES header(s) failed verification${NC}"
  exit 1
fi
