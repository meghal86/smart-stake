#!/bin/bash

echo "🚀 Deploying Live Portfolio Function..."

# Deploy the live portfolio tracker function
supabase functions deploy portfolio-tracker-live

echo "✅ Live Portfolio Function deployed successfully!"
echo ""
echo "🔥 Live Data Features Now Available:"
echo "- Real ETH balances via Alchemy"
echo "- Live token prices from CoinGecko"
echo "- Auto-refresh every 30 seconds"
echo "- Smart caching system"
echo ""
echo "📊 Check your Portfolio tab to see live data indicator!"
echo "Green badge = Live data | Gray badge = Cached data"