#!/bin/bash
set -e

echo "🐋 Deploying AlphaWhale Live Data Integration"

# Check environment
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ SUPABASE_PROJECT_REF not set"
  exit 1
fi

if [ -z "$ALCHEMY_API_KEY" ]; then
  echo "❌ ALCHEMY_API_KEY not set"
  exit 1
fi

# Deploy database migration
echo "📊 Deploying database schema..."
supabase db push --project-ref $SUPABASE_PROJECT_REF

# Deploy edge functions
echo "⚡ Deploying edge functions..."
supabase functions deploy ingest_whales_live --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy whale-spotlight --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy fear-index --project-ref $SUPABASE_PROJECT_REF
supabase functions deploy prices --project-ref $SUPABASE_PROJECT_REF

# Set up cron jobs
echo "⏰ Setting up cron jobs..."
psql $DATABASE_URL -c "
SELECT cron.schedule(
  'ingest-whales-live',
  '* * * * *',
  'https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/ingest_whales_live'
);
"

# Test deployment
echo "🧪 Testing deployment..."
curl -f "https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/whale-spotlight" || {
  echo "❌ Deployment test failed"
  exit 1
}

echo "✅ Live data integration deployed successfully!"
echo "🔗 Status page: https://your-app.com/status"