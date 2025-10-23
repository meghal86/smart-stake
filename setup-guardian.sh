#!/bin/bash

# Guardian Setup Script
# Automates the installation and configuration of AlphaWhale Guardian

set -e

echo "🛡️  AlphaWhale Guardian Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for required tools
echo "📋 Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install wagmi viem @rainbow-me/rainbowkit @upstash/ratelimit @upstash/redis date-fns lottie-react @types/react-window --save

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Check for .env.local
echo "🔐 Checking environment configuration..."
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating template..."
    cat > .env.local << 'EOF'
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend (for Edge Functions)
SUPABASE_SERVICE_ROLE=your-service-role-key
ALCHEMY_API_KEY=your-alchemy-api-key
ETHERSCAN_API_KEY=your-etherscan-api-key

# Optional
HONEYPOT_API_URL=https://api.honeypot.is/v2/IsHoneypot
REPUTATION_SOURCE=etherscan

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# Environment
NODE_ENV=development
EOF
    echo "⚠️  Please edit .env.local with your API keys"
    echo "   Then run this script again."
    exit 0
fi
echo "✅ Environment file exists"
echo ""

# Run database migration
echo "🗄️  Running database migrations..."
if supabase db push; then
    echo "✅ Database migrated"
else
    echo "❌ Database migration failed. Make sure Supabase is linked:"
    echo "   supabase link --project-ref your-project-ref"
    exit 1
fi
echo ""

# Deploy Edge Functions
echo "☁️  Deploying Edge Functions..."

echo "  → Deploying guardian-scan..."
if supabase functions deploy guardian-scan; then
    echo "    ✅ guardian-scan deployed"
else
    echo "    ❌ Failed to deploy guardian-scan"
fi

echo "  → Deploying guardian-revoke..."
if supabase functions deploy guardian-revoke; then
    echo "    ✅ guardian-revoke deployed"
else
    echo "    ❌ Failed to deploy guardian-revoke"
fi

echo "  → Deploying guardian-healthz..."
if supabase functions deploy guardian-healthz; then
    echo "    ✅ guardian-healthz deployed"
else
    echo "    ❌ Failed to deploy guardian-healthz"
fi
echo ""

# Set function secrets
echo "🔑 Setting function secrets..."
echo "⚠️  You'll need to run these manually with your actual values:"
echo ""
echo "  supabase secrets set ALCHEMY_API_KEY=your-key"
echo "  supabase secrets set ETHERSCAN_API_KEY=your-key"
echo "  supabase secrets set UPSTASH_REDIS_REST_URL=your-url"
echo "  supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-token"
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test -- --run src/__tests__/guardian/; then
    echo "✅ Tests passed"
else
    echo "⚠️  Some tests failed. Review the output above."
fi
echo ""

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Guardian Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "  1. Set function secrets (see above)"
echo "  2. Start dev server: npm run dev"
echo "  3. Navigate to: http://localhost:8080/guardian"
echo "  4. Connect wallet and test scanning"
echo ""
echo "📚 Documentation:"
echo "  • GUARDIAN_README.md - Full documentation"
echo "  • GUARDIAN_IMPLEMENTATION_SUMMARY.md - Feature overview"
echo ""
echo "🔍 Health check:"
echo "  curl http://localhost:54321/functions/v1/guardian-healthz"
echo ""
echo "Happy coding! 🚀"

