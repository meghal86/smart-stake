#!/bin/bash

# Guardian Local Test Script
# Tests the Guardian Edge Function locally without deploying

echo "🛡️  Guardian Local Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📦 Starting Supabase local functions..."
echo ""

# Start functions locally in background
supabase functions serve guardian-scan &
FUNC_PID=$!

# Wait for function to start
sleep 3

echo ""
echo "🧪 Testing guardian-scan function..."
echo ""

# Test with sample wallet
RESPONSE=$(curl -s -X POST http://localhost:54321/functions/v1/guardian-scan \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C",
    "network": "ethereum"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
kill $FUNC_PID 2>/dev/null

echo ""
echo "✅ Test complete!"
echo ""
echo "To use in your app:"
echo "  1. Set VITE_SUPABASE_URL in .env.local"
echo "  2. Run: npm run dev"
echo "  3. Navigate to: http://localhost:8080/guardian"

