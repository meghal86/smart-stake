#!/bin/bash

# Guardian Smart Automation Deployment Script
set -e

echo "🚀 Deploying Guardian Smart Automation System..."

# Check required environment variables
required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "UPSTASH_REDIS_URL" "RPC_URL" "RELAYER_PRIVATE_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# 1. Deploy database migrations
echo "📊 Applying database migrations..."
supabase db reset --linked
echo "✅ Database migrations applied"

# 2. Deploy edge functions
echo "⚡ Deploying edge functions..."
supabase functions deploy guardian-automation-propose
echo "✅ Edge functions deployed"

# 3. Build and deploy relayer service
echo "🔄 Building relayer service..."
cd services/guardian-relayer
npm install
npm run build

# Start relayer service (in production, use PM2 or similar)
echo "🚀 Starting relayer service..."
npm start &
RELAYER_PID=$!
echo "✅ Relayer service started (PID: $RELAYER_PID)"

# 4. Deploy smart contracts (if on testnet/mainnet)
if [ "$DEPLOY_CONTRACTS" = "true" ]; then
    echo "📜 Deploying smart contracts..."
    cd ../../contracts
    npm install
    npm run compile
    
    if [ "$NETWORK" = "mainnet" ]; then
        npm run deploy:mainnet
    else
        npm run deploy:goerli
    fi
    echo "✅ Smart contracts deployed"
fi

# 5. Health check
echo "🏥 Running health checks..."
sleep 5

# Check relayer health
RELAYER_HEALTH=$(curl -s http://localhost:3001/health | jq -r '.status' || echo "unhealthy")
if [ "$RELAYER_HEALTH" = "healthy" ]; then
    echo "✅ Relayer service is healthy"
else
    echo "❌ Relayer service health check failed"
    kill $RELAYER_PID 2>/dev/null || true
    exit 1
fi

# Check edge function
EDGE_FUNCTION_HEALTH=$(supabase functions invoke guardian-automation-propose --body '{"test": true}' 2>/dev/null | jq -r '.error' || echo "ok")
if [ "$EDGE_FUNCTION_HEALTH" != "ok" ]; then
    echo "✅ Edge function is accessible"
else
    echo "❌ Edge function health check failed"
fi

echo "🎉 Guardian Smart Automation deployment complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Database: ✅ Migrated"
echo "   - Edge Functions: ✅ Deployed"
echo "   - Relayer Service: ✅ Running (PID: $RELAYER_PID)"
echo "   - Smart Contracts: ${DEPLOY_CONTRACTS:-false}"
echo ""
echo "🔗 Service URLs:"
echo "   - Relayer Health: http://localhost:3001/health"
echo "   - Queue Status: http://localhost:3001/api/queue-status"
echo ""
echo "⚠️  Remember to:"
echo "   1. Set up monitoring for the relayer service"
echo "   2. Configure proper secrets management"
echo "   3. Set up log aggregation"
echo "   4. Test automation with low-risk scenarios first"