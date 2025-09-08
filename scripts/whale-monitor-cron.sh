#!/bin/bash

# Whale Monitor Cron Script
# Updates whale data every 10 minutes

# Configuration
SUPABASE_URL="https://rebeznxivaxgserswhbn.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo"

# Whale addresses to monitor
WHALE_ADDRESSES='["0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503","0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a","0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6","0x1522900b6dafac587d499a862861c0869be6e428"]'

# Log file
LOG_FILE="/tmp/whale-monitor.log"

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log "Starting whale monitoring update..."

# Update whale data
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/blockchain-monitor" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"addresses\":$WHALE_ADDRESSES}")

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    PROCESSED=$(echo "$RESPONSE" | grep -o '"processed":[0-9]*' | cut -d':' -f2)
    log "✅ Successfully updated $PROCESSED whales"
else
    log "❌ Failed to update whale data: $RESPONSE"
fi

log "Whale monitoring update completed"