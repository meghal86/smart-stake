#!/bin/bash
# Environment Variables Validation - A++ Grade System

set -e

echo "🔐 Checking Required Environment Variables..."
echo ""

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "WHALE_ALERT_API_KEY"
)

OPTIONAL_VARS=(
  "CMC_API_KEY"
  "ETHERSCAN_API_KEY"
  "STRIPE_SECRET_KEY"
)

MISSING=()
PRESENT=()

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
    echo "❌ $var - MISSING (REQUIRED)"
  else
    PRESENT+=("$var")
    # Show first 10 chars only for security
    VALUE="${!var}"
    PREVIEW="${VALUE:0:10}..."
    echo "✅ $var - Set ($PREVIEW)"
  fi
done

echo ""

# Check optional variables
for var in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️  $var - Not set (optional, has fallback)"
  else
    VALUE="${!var}"
    PREVIEW="${VALUE:0:10}..."
    echo "✅ $var - Set ($PREVIEW)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ CRITICAL: Missing ${#MISSING[@]} required variable(s)"
  echo ""
  echo "Add to .env.local:"
  for var in "${MISSING[@]}"; do
    echo "  $var=your_value_here"
  done
  echo ""
  echo "Then restart: npm run dev"
  exit 1
else
  echo "✅ All ${#PRESENT[@]} required variables are set"
  echo ""
  echo "System ready for deployment"
  exit 0
fi
