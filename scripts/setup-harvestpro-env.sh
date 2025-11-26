#!/bin/bash

# HarvestPro Environment Setup Script
# This script helps you set up required environment variables for HarvestPro

set -e

echo "🚀 HarvestPro Environment Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

echo ""
echo "📋 Checking required environment variables..."
echo ""

# Function to check if variable is set
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d '=' -f2)
    
    if [ -z "$var_value" ] || [[ "$var_value" == *"your_"* ]]; then
        echo -e "${RED}❌ ${var_name} - Not configured${NC}"
        return 1
    else
        echo -e "${GREEN}✅ ${var_name} - Configured${NC}"
        return 0
    fi
}

# Check required variables
MISSING_VARS=0

echo "Required for v1 Core:"
check_var "NEXT_PUBLIC_SUPABASE_URL" || ((MISSING_VARS++))
check_var "SUPABASE_SERVICE_ROLE_KEY" || ((MISSING_VARS++))
check_var "COINGECKO_API_KEY" || ((MISSING_VARS++))
check_var "GUARDIAN_API_KEY" || ((MISSING_VARS++))
check_var "CEX_ENCRYPTION_KEY" || ((MISSING_VARS++))

echo ""
echo "Recommended for v1:"
check_var "COINMARKETCAP_API_KEY" || ((MISSING_VARS++))
check_var "ALCHEMY_API_KEY" || ((MISSING_VARS++))
check_var "ONEINCH_API_KEY" || ((MISSING_VARS++))

echo ""
echo "================================"

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set Supabase secrets: supabase secrets set GUARDIAN_API_KEY=your_key"
    echo "2. Run migrations: supabase db push"
    echo "3. Test HarvestPro: npm run dev"
else
    echo -e "${YELLOW}⚠️  ${MISSING_VARS} environment variable(s) need configuration${NC}"
    echo ""
    echo "🔧 Quick Setup:"
    echo ""
    
    # Generate CEX encryption key if missing
    if ! check_var "CEX_ENCRYPTION_KEY" &>/dev/null; then
        echo "Generating CEX_ENCRYPTION_KEY..."
        CEX_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        echo ""
        echo -e "${GREEN}Generated CEX_ENCRYPTION_KEY:${NC}"
        echo "$CEX_KEY"
        echo ""
        echo "Add this to your .env file:"
        echo "CEX_ENCRYPTION_KEY=$CEX_KEY"
        echo ""
    fi
    
    echo "📖 For detailed setup instructions, see:"
    echo "   .kiro/specs/harvestpro/ENVIRONMENT_SETUP_GUIDE.md"
    echo ""
    echo "🔑 To get API keys:"
    echo "   • Guardian API: Contact AlphaWhale team"
    echo "   • CoinGecko: https://www.coingecko.com/en/api/pricing"
    echo "   • CoinMarketCap: https://coinmarketcap.com/api/"
    echo "   • Alchemy: https://www.alchemy.com/"
    echo "   • 1inch: https://portal.1inch.dev/"
fi

echo ""
echo "================================"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI detected"
    echo ""
    echo "To set Supabase secrets, run:"
    echo ""
    echo "  supabase secrets set GUARDIAN_API_KEY=your_key"
    echo "  supabase secrets set CEX_ENCRYPTION_KEY=your_key"
    echo "  supabase secrets set COINGECKO_API_KEY=your_key"
    echo "  supabase secrets set COINMARKETCAP_API_KEY=your_key"
    echo "  supabase secrets set ALCHEMY_API_KEY=your_key"
    echo "  supabase secrets set ONEINCH_API_KEY=your_key"
    echo ""
    echo "Verify with: supabase secrets list"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo "Install it: npm install -g supabase"
fi

echo ""
echo "🚀 Ready to deploy HarvestPro!"
echo ""
