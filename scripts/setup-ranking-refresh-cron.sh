#!/bin/bash

# Setup script for ranking materialized view refresh cron job
# This script sets up a cron job to refresh the mv_opportunity_rank view every 2-5 minutes
#
# Requirements: 3.1-3.6 (Personalized Feed Ranking)

set -e

echo "🔄 Setting up ranking materialized view refresh cron job..."

# Check if we're using Vercel or another platform
if [ -n "$VERCEL" ]; then
  echo "📦 Detected Vercel environment"
  echo "⚠️  Please configure Vercel Cron in vercel.json:"
  echo ""
  echo '{
  "crons": [
    {
      "path": "/api/cron/refresh-ranking",
      "schedule": "*/3 * * * *"
    }
  ]
}'
  echo ""
  echo "Then create the API route at: app/api/cron/refresh-ranking/route.ts"
  exit 0
fi

# For local development or self-hosted, use pg_cron
echo "🗄️  Setting up pg_cron for materialized view refresh..."

# Check if pg_cron extension is available
SUPABASE_DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL or DATABASE_URL environment variable not set"
  exit 1
fi

# Install pg_cron extension (if not already installed)
psql "$SUPABASE_DB_URL" <<SQL
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh every 3 minutes
SELECT cron.schedule(
  'refresh-opportunity-rank',
  '*/3 * * * *',
  \$\$SELECT refresh_opportunity_rank_view();\$\$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'refresh-opportunity-rank';
SQL

echo "✅ Cron job created successfully!"
echo "📊 The materialized view will refresh every 3 minutes"
echo ""
echo "To manually refresh the view, run:"
echo "  psql \$SUPABASE_DB_URL -c \"SELECT refresh_opportunity_rank_view();\""
echo ""
echo "To check cron job status:"
echo "  psql \$SUPABASE_DB_URL -c \"SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-opportunity-rank') ORDER BY start_time DESC LIMIT 10;\""

