#!/bin/bash
# Guardian Secrets Setup Script
# Sets all required secrets for Guardian edge functions

echo "🔐 Setting up Guardian secrets in Supabase..."
echo ""

# WalletConnect Project ID (for wallet connection)
echo "Setting WALLETCONNECT_PROJECT_ID..."
supabase secrets set WALLETCONNECT_PROJECT_ID=f13ce31c7183dda28756902c7195ab5e

# Alchemy API Key (for blockchain data)
echo "Setting ALCHEMY_API_KEY..."
echo "Please enter your Alchemy API key:"
read -r ALCHEMY_KEY
supabase secrets set ALCHEMY_API_KEY="$ALCHEMY_KEY"

# Etherscan API Key (for contract verification)
echo "Setting ETHERSCAN_API_KEY..."
echo "Please enter your Etherscan API key:"
read -r ETHERSCAN_KEY
supabase secrets set ETHERSCAN_API_KEY="$ETHERSCAN_KEY"

# Optional: Upstash Redis (for distributed rate limiting)
echo ""
echo "Do you want to set up Upstash Redis? (y/n)"
read -r SETUP_REDIS
if [ "$SETUP_REDIS" = "y" ]; then
    echo "Please enter your Upstash Redis REST URL:"
    read -r REDIS_URL
    supabase secrets set UPSTASH_REDIS_REST_URL="$REDIS_URL"
    
    echo "Please enter your Upstash Redis REST Token:"
    read -r REDIS_TOKEN
    supabase secrets set UPSTASH_REDIS_REST_TOKEN="$REDIS_TOKEN"
fi

# Optional: Sentry DSN (for error tracking)
echo ""
echo "Do you want to set up Sentry? (y/n)"
read -r SETUP_SENTRY
if [ "$SETUP_SENTRY" = "y" ]; then
    echo "Please enter your Sentry DSN:"
    read -r SENTRY_DSN
    supabase secrets set SENTRY_DSN="$SENTRY_DSN"
fi

echo ""
echo "✅ Secrets setup complete!"
echo ""
echo "To verify secrets were set:"
echo "  supabase secrets list"
echo ""
echo "To unset a secret:"
echo "  supabase secrets unset SECRET_NAME"



