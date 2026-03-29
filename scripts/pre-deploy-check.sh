#!/bin/bash
set -e

echo "🐋 AlphaWhale Pre-Deploy Check"
echo "================================"

ERRORS=0

# 1. Check required env vars
REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "VITE_SUPABASE_PROJECT_REF"
  "VITE_ADMIN_EMAILS"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "CRON_SECRET"
)

echo ""
echo "📋 Checking environment variables..."
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "  ❌ Missing: $VAR"
    ERRORS=$((ERRORS + 1))
  else
    echo "  ✅ Set: $VAR"
  fi
done

# 2. Build check
echo ""
echo "🔨 Running production build..."
if npm run build > /dev/null 2>&1; then
  echo "  ✅ Build: PASSED"
else
  echo "  ❌ Build: FAILED"
  ERRORS=$((ERRORS + 1))
fi

# 3. Lint check
echo ""
echo "🔍 Running ESLint..."
LINT_ERRORS=$(npm run lint 2>&1 | grep " error " | wc -l | tr -d ' ')
if [ "$LINT_ERRORS" -eq "0" ]; then
  echo "  ✅ ESLint: 0 errors"
else
  echo "  ❌ ESLint: $LINT_ERRORS errors"
  ERRORS=$((ERRORS + 1))
fi

# 4. Summary
echo ""
echo "================================"
if [ "$ERRORS" -eq "0" ]; then
  echo "✅ Ready to deploy! All checks passed."
  exit 0
else
  echo "❌ NOT ready to deploy. $ERRORS check(s) failed."
  exit 1
fi
