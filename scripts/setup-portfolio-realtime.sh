#!/bin/bash

# Portfolio Real-Time Data Setup Script
# This script helps set up the portfolio real-time data implementation

set -e

echo "🚀 AlphaWhale Portfolio Real-Time Data Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create .env.local manually.${NC}"
        exit 1
    fi
fi

# Check required environment variables
echo ""
echo "📋 Checking environment variables..."
echo ""

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env.local | cut -d '=' -f2)
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_key_here" ] || [ "$var_value" = "your_url_here" ]; then
        echo -e "${RED}❌ ${var_name} not set${NC}"
        return 1
    else
        echo -e "${GREEN}✅ ${var_name} configured${NC}"
        return 0
    fi
}

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

# Optional but recommended variables
OPTIONAL_VARS=(
    "COINGECKO_API_KEY"
    "COINMARKETCAP_API_KEY"
)

all_required_set=true
for var in "${REQUIRED_VARS[@]}"; do
    if ! check_env_var "$var"; then
        all_required_set=false
    fi
done

echo ""
echo "📋 Checking optional variables (for real-time prices)..."
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    check_env_var "$var" || echo -e "${YELLOW}⚠️  ${var} not set (will use fallback/mock data)${NC}"
done

if [ "$all_required_set" = false ]; then
    echo ""
    echo -e "${RED}❌ Some required environment variables are missing.${NC}"
    echo -e "${YELLOW}Please edit .env.local and set the required variables.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All required environment variables are set!${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Skipping database migration.${NC}"
    echo -e "${YELLOW}   Install it with: npm install -g supabase${NC}"
    echo ""
else
    echo "🗄️  Running database migration..."
    echo ""
    
    # Run migration
    if supabase db push; then
        echo ""
        echo -e "${GREEN}✅ Database migration completed!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Database migration failed.${NC}"
        echo -e "${YELLOW}   You may need to run: supabase link${NC}"
        echo ""
    fi
fi

# Check if edge functions are deployed
echo ""
echo "🔧 Checking edge functions..."
echo ""

EDGE_FUNCTIONS=(
    "guardian-scan-v2"
    "hunter-opportunities"
    "harvest-recompute-opportunities"
    "portfolio-tracker-live"
)

echo -e "${YELLOW}Note: Edge functions must be deployed manually.${NC}"
echo ""
echo "To deploy edge functions, run:"
echo ""
for func in "${EDGE_FUNCTIONS[@]}"; do
    echo "  supabase functions deploy $func"
done
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

if npm install; then
    echo ""
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to install dependencies.${NC}"
    exit 1
fi

# Build check
echo ""
echo "🔨 Running build check..."
echo ""

if npm run build; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed. Please fix errors and try again.${NC}"
    exit 1
fi

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Navigate to http://localhost:3000/portfolio"
echo ""
echo "3. Connect your wallet and test real-time data"
echo ""
echo "4. Check the logs for data fetching status:"
echo "   - ✅ = Success (real data)"
echo "   - ⚠️  = Warning (fallback used)"
echo "   - 🎭 = Mock data (edge function not available)"
echo ""
echo "For more information, see:"
echo "  - docs/PORTFOLIO_REALTIME_DATA.md"
echo "  - PORTFOLIO_REALTIME_IMPLEMENTATION_SUMMARY.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
