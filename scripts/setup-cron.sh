#!/bin/bash

# Setup Cron Job for Whale Monitoring
# Run this script once to set up automatic whale updates

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/whale-monitor-cron.sh"

echo "🐋 Setting up automatic whale monitoring..."

# Add cron job (every 10 minutes)
(crontab -l 2>/dev/null; echo "*/10 * * * * $SCRIPT_PATH") | crontab -

echo "✅ Cron job added successfully!"
echo "📊 Whale data will update every 10 minutes"
echo "📝 Logs will be saved to /tmp/whale-monitor.log"

# Test the script
echo "🧪 Testing whale monitor script..."
$SCRIPT_PATH

echo ""
echo "🎉 Setup complete! Your whale analytics will now update automatically."
echo ""
echo "To check logs: tail -f /tmp/whale-monitor.log"
echo "To remove cron job: crontab -l | grep -v whale-monitor-cron.sh | crontab -"