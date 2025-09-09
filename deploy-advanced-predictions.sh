#!/bin/bash

# Deploy Advanced Whale Predictions Feature
echo "🚀 Deploying Advanced Whale Behavior Predictions & Simulations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

echo "📊 Running database migrations..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

echo "🧠 Deploying advanced whale predictions function..."
supabase functions deploy advanced-whale-predictions

if [ $? -ne 0 ]; then
    echo "❌ Function deployment failed"
    exit 1
fi

echo "🔧 Updating existing ML predictions function..."
supabase functions deploy ml-predictions

if [ $? -ne 0 ]; then
    echo "⚠️  ML predictions function update failed, but continuing..."
fi

echo "🎯 Generating TypeScript types..."
supabase gen types typescript --linked > src/integrations/supabase/types.ts

if [ $? -ne 0 ]; then
    echo "⚠️  Type generation failed, but continuing..."
fi

echo "✅ Advanced Whale Predictions feature deployed successfully!"
echo ""
echo "🎉 New Features Available:"
echo "   • Advanced whale behavior predictions (accumulation, liquidation, cluster movements)"
echo "   • Interactive market impact simulations"
echo "   • Multi-chain support (Ethereum, Polygon, BSC, Arbitrum)"
echo "   • Real-time risk assessment and cascade analysis"
echo "   • Explainable AI with feature importance"
echo ""
echo "📱 Access the new features in the 'Analytics' tab of your app"
echo "🔗 Function endpoint: /functions/v1/advanced-whale-predictions"
echo ""
echo "🧪 Test the simulation API:"
echo "curl -X POST 'https://your-project.supabase.co/functions/v1/advanced-whale-predictions?action=simulate' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"whaleCount\": 5, \"transactionSize\": 1000, \"timeframe\": \"24h\", \"chain\": \"ethereum\"}'"