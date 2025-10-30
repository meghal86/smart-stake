#!/bin/bash
# =====================================================
# Multi-Wallet Registry Setup Script
# Deploys database migrations and edge functions
# =====================================================

set -e  # Exit on error

echo "🐋 AlphaWhale Multi-Wallet Registry Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking Supabase connection...${NC}"
if supabase status &> /dev/null; then
    echo -e "${GREEN}✓ Connected to Supabase${NC}"
else
    echo -e "${RED}❌ Not connected to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Running database migrations...${NC}"

# Check if migrations exist
if [ ! -f "supabase/migrations/20251025000000_user_wallets_registry.sql" ]; then
    echo -e "${RED}❌ Migration files not found${NC}"
    exit 1
fi

# Run migrations
supabase db push

echo -e "${GREEN}✓ Database migrations applied${NC}"

echo ""
echo -e "${BLUE}Step 3: Deploying edge function...${NC}"

# Check if edge function exists
if [ ! -f "supabase/functions/wallet-registry-scan/index.ts" ]; then
    echo -e "${RED}❌ Edge function not found${NC}"
    exit 1
fi

# Deploy edge function
supabase functions deploy wallet-registry-scan

echo -e "${GREEN}✓ Edge function deployed${NC}"

echo ""
echo -e "${BLUE}Step 4: Verifying setup...${NC}"

# Test database
echo -n "Testing database schema... "
if psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_wallets';" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Multi-Wallet Registry Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update your routes to use GuardianRegistry component"
echo "2. Test wallet addition via UI"
echo "3. Verify cron jobs: SELECT * FROM cron.job;"
echo ""
echo "Documentation: ./MULTI_WALLET_REGISTRY_GUIDE.md"
echo ""



