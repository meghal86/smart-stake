#!/bin/bash
# Production Health Check - A++ Grade System
# Tests all Lite dashboard endpoints for live data

set -e

BASE_URL="${1:-http://localhost:3000}"
FAILED=()
WARNINGS=()

echo "🔍 AlphaWhale Lite Dashboard - Health Check"
echo "Target: $BASE_URL"
echo ""

# Test /api/lite/digest
echo "1️⃣  Testing /api/lite/digest..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/lite/digest")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$STATUS" -eq 200 ]; then
  ITEMS=$(echo "$BODY" | jq -r '.items | length' 2>/dev/null || echo "0")
  SOURCE=$(echo "$BODY" | jq -r '.source' 2>/dev/null || echo "unknown")
  
  if [ "$ITEMS" -gt 0 ] && [ "$SOURCE" = "whale-alert-live" ]; then
    echo "   ✅ PASS - $ITEMS whale transactions from live source"
  else
    echo "   ⚠️  WARN - Response OK but data quality issue"
    WARNINGS+=("/api/lite/digest - Items: $ITEMS, Source: $SOURCE")
  fi
else
  ERROR=$(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "Unknown error")
  echo "   ❌ FAIL - HTTP $STATUS: $ERROR"
  FAILED+=("/api/lite/digest")
fi

# Test /api/lite/whale-index
echo "2️⃣  Testing /api/lite/whale-index..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/lite/whale-index")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$STATUS" -eq 200 ]; then
  SCORE=$(echo "$BODY" | jq -r '.score' 2>/dev/null || echo "null")
  LABEL=$(echo "$BODY" | jq -r '.label' 2>/dev/null || echo "null")
  SOURCE=$(echo "$BODY" | jq -r '.source' 2>/dev/null || echo "unknown")
  
  if [ "$SCORE" != "null" ] && [ "$SOURCE" = "market-summary-live" ]; then
    echo "   ✅ PASS - Score: $SCORE ($LABEL) from live source"
  else
    echo "   ⚠️  WARN - Response OK but data quality issue"
    WARNINGS+=("/api/lite/whale-index - Score: $SCORE, Source: $SOURCE")
  fi
else
  ERROR=$(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "Unknown error")
  echo "   ❌ FAIL - HTTP $STATUS: $ERROR"
  FAILED+=("/api/lite/whale-index")
fi

# Test /api/lite/streak
echo "3️⃣  Testing /api/lite/streak..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/lite/streak")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$STATUS" -eq 200 ]; then
  AUTH=$(echo "$BODY" | jq -r '.authenticated' 2>/dev/null || echo "false")
  SOURCE=$(echo "$BODY" | jq -r '.source' 2>/dev/null || echo "unknown")
  
  if [ "$AUTH" = "false" ]; then
    echo "   ✅ PASS - Unauthenticated response (expected)"
  elif [ "$SOURCE" = "supabase-live" ]; then
    STREAK=$(echo "$BODY" | jq -r '.streak_count' 2>/dev/null || echo "0")
    echo "   ✅ PASS - Streak: $STREAK from live source"
  else
    echo "   ⚠️  WARN - Response OK but data quality issue"
    WARNINGS+=("/api/lite/streak - Source: $SOURCE")
  fi
else
  ERROR=$(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "Unknown error")
  echo "   ❌ FAIL - HTTP $STATUS: $ERROR"
  FAILED+=("/api/lite/streak")
fi

# Test /api/lite/unlocks
echo "4️⃣  Testing /api/lite/unlocks..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/lite/unlocks")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$STATUS" -eq 200 ]; then
  ITEMS=$(echo "$BODY" | jq -r '.items | length' 2>/dev/null || echo "0")
  SOURCE=$(echo "$BODY" | jq -r '.source' 2>/dev/null || echo "unknown")
  
  if [ "$SOURCE" = "supabase-live" ]; then
    echo "   ✅ PASS - $ITEMS upcoming unlocks from live source"
  else
    echo "   ⚠️  WARN - Response OK but data quality issue"
    WARNINGS+=("/api/lite/unlocks - Items: $ITEMS, Source: $SOURCE")
  fi
else
  ERROR=$(echo "$BODY" | jq -r '.error' 2>/dev/null || echo "Unknown error")
  echo "   ❌ FAIL - HTTP $STATUS: $ERROR"
  FAILED+=("/api/lite/unlocks")
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary
if [ ${#FAILED[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED - System is A++ Grade"
  echo "   All endpoints returning live data"
  exit 0
elif [ ${#FAILED[@]} -eq 0 ]; then
  echo "⚠️  WARNINGS DETECTED"
  printf '   - %s\n' "${WARNINGS[@]}"
  echo ""
  echo "System functional but investigate warnings"
  exit 0
else
  echo "❌ CRITICAL FAILURES DETECTED"
  printf '   - %s\n' "${FAILED[@]}"
  
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Additional Warnings:"
    printf '   - %s\n' "${WARNINGS[@]}"
  fi
  
  echo ""
  echo "🔧 Troubleshooting:"
  echo "   1. Check environment variables: ./check-env.sh"
  echo "   2. Verify Supabase Edge Functions deployed"
  echo "   3. Check API keys are valid"
  echo "   4. Review logs: vercel logs --follow"
  exit 1
fi
