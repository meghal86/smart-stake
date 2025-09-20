#!/bin/bash

# Daily drift monitoring script
# Add to crontab: 0 6 * * * /path/to/drift-cron.sh

SUPABASE_URL="https://rebeznxivaxgserswhbn.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key"

echo "$(date): Running drift monitoring..."

response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/drift-daily" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json")

echo "$(date): Response: $response"

# Log to file
echo "$(date): $response" >> /var/log/drift-monitoring.log