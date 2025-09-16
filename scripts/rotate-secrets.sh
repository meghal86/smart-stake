#!/bin/bash
# Secret Rotation Script for Whale Analytics
# Usage: ./scripts/rotate-secrets.sh [service]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID}"
BACKUP_DIR="./backups/secrets"

# Create backup directory
mkdir -p "$BACKUP_DIR"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Backup current secrets
backup_secrets() {
    log "Backing up current secrets..."
    local backup_file="$BACKUP_DIR/secrets-$(date +%Y%m%d-%H%M%S).env"
    
    if [ -f .env ]; then
        cp .env "$backup_file"
        log "Secrets backed up to $backup_file"
    else
        warn "No .env file found to backup"
    fi
}

# Rotate Supabase keys
rotate_supabase() {
    log "Rotating Supabase service role key..."
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        error "SUPABASE_PROJECT_ID not set"
    fi
    
    # Generate new service role key (requires Supabase CLI)
    if command -v supabase &> /dev/null; then
        log "Generating new Supabase service role key..."
        # Note: This would require Supabase API integration
        warn "Manual rotation required: Visit Supabase Dashboard > Settings > API"
    else
        error "Supabase CLI not installed"
    fi
}

# Rotate Stripe keys
rotate_stripe() {
    log "Rotating Stripe keys..."
    warn "Manual rotation required:"
    echo "1. Visit Stripe Dashboard > Developers > API Keys"
    echo "2. Create new secret key"
    echo "3. Update STRIPE_SECRET_KEY in .env"
    echo "4. Update webhook endpoints with new secret"
}

# Rotate blockchain API keys
rotate_blockchain() {
    log "Rotating blockchain API keys..."
    warn "Manual rotation required:"
    echo "1. Alchemy: Visit dashboard.alchemy.com"
    echo "2. Moralis: Visit admin.moralis.io"
    echo "3. Infura: Visit infura.io/dashboard"
}

# Update Supabase Edge Function secrets
update_edge_secrets() {
    log "Updating Edge Function secrets..."
    
    if [ -f .env ]; then
        # Extract secrets from .env
        STRIPE_SECRET=$(grep "STRIPE_SECRET_KEY=" .env | cut -d'=' -f2 | tr -d '"')
        STRIPE_WEBHOOK=$(grep "STRIPE_WEBHOOK_SECRET=" .env | cut -d'=' -f2 | tr -d '"')
        
        if [ -n "$STRIPE_SECRET" ]; then
            supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET" || warn "Failed to update STRIPE_SECRET_KEY"
        fi
        
        if [ -n "$STRIPE_WEBHOOK" ]; then
            supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK" || warn "Failed to update STRIPE_WEBHOOK_SECRET"
        fi
        
        log "Edge Function secrets updated"
    else
        error ".env file not found"
    fi
}

# Validate new secrets
validate_secrets() {
    log "Validating new secrets..."
    
    # Check if required secrets are present
    local required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_PUBLISHABLE_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env 2>/dev/null; then
            error "Required secret $var not found in .env"
        fi
    done
    
    log "Secret validation completed"
}

# Main rotation function
rotate_all() {
    log "Starting complete secret rotation..."
    
    backup_secrets
    
    warn "The following services require manual key rotation:"
    echo "1. Supabase (service role key)"
    echo "2. Stripe (secret key & webhook secret)"
    echo "3. Blockchain APIs (Alchemy, Moralis, Infura)"
    echo ""
    echo "After updating .env with new keys, run:"
    echo "./scripts/rotate-secrets.sh update-edge"
    
    read -p "Have you updated all keys in .env? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        validate_secrets
        update_edge_secrets
        log "Secret rotation completed successfully"
    else
        warn "Secret rotation cancelled"
    fi
}

# Main script logic
case "${1:-all}" in
    "supabase")
        backup_secrets
        rotate_supabase
        ;;
    "stripe")
        backup_secrets
        rotate_stripe
        ;;
    "blockchain")
        backup_secrets
        rotate_blockchain
        ;;
    "update-edge")
        update_edge_secrets
        ;;
    "validate")
        validate_secrets
        ;;
    "all")
        rotate_all
        ;;
    *)
        echo "Usage: $0 [supabase|stripe|blockchain|update-edge|validate|all]"
        echo ""
        echo "Commands:"
        echo "  supabase     - Rotate Supabase keys"
        echo "  stripe       - Rotate Stripe keys"
        echo "  blockchain   - Rotate blockchain API keys"
        echo "  update-edge  - Update Edge Function secrets"
        echo "  validate     - Validate current secrets"
        echo "  all          - Complete rotation workflow (default)"
        exit 1
        ;;
esac