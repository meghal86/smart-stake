#!/bin/bash
# Deploy Guardian Secrets to Supabase Edge Functions

set -e

echo "🔐 Deploying Guardian Secrets to Supabase Edge Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if logged in
if ! supabase projects list &>/dev/null; then
    echo "⚠️  Not logged in to Supabase. Please run:"
    echo "   supabase login"
    echo ""
    exit 1
fi

echo "Setting secrets..."
echo ""

# Upstash Redis (Rate Limiting & Idempotency)
supabase secrets set \
  UPSTASH_REDIS_REST_URL="https://prepared-shark-8055.upstash.io" \
  UPSTASH_REDIS_REST_TOKEN="AR93AAImcDJlYzRmNTI1MDczNTQ0MDc3ODk4MDg5Mzc2ZmU4ZGMzZnAyODA1NQ"

if [ $? -eq 0 ]; then
    echo "✅ Upstash Redis secrets set"
else
    echo "❌ Failed to set Upstash secrets"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All Guardian secrets deployed!"
echo ""
echo "Next steps:"
echo "  1. Deploy Edge Functions:"
echo "     supabase functions deploy guardian-scan-v2"
echo "     supabase functions deploy guardian-revoke-v2"
echo ""
echo "  2. Run migration:"
echo "     supabase db push"
echo ""
echo "  3. Test Guardian:"
echo "     npm run dev"
echo "     Navigate to http://localhost:8080/guardian"
echo ""

