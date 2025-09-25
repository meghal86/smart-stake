#!/bin/bash

# Setup script for whale clustering system
# Run from project root: ./scripts/setup-whale-clustering.sh

set -e

echo "🐋 Setting up Whale Clustering System..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo "Run 'supabase init' first or navigate to your project root"
    exit 1
fi

echo "📊 Running database migrations..."
supabase db push

echo "🚀 Deploying Edge Functions..."
supabase functions deploy whale-clusters

echo "🔧 Generating TypeScript types..."
supabase gen types typescript --linked > src/integrations/supabase/types.ts

echo "✅ Whale clustering system setup complete!"
echo ""
echo "Next steps:"
echo "1. Check the debug component in the Hub tab"
echo "2. Verify clusters are being generated"
echo "3. Remove the debug component when satisfied"
echo ""
echo "If you see 'No clusters found', check that:"
echo "- Database tables have sample data"
echo "- Edge Function is deployed correctly"
echo "- Network requests are working"