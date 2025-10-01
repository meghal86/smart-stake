#!/bin/bash

echo "🚀 Deploying AlphaWhale Day-One to Vercel..."

# Deploy legacy app first
echo "📦 Deploying Legacy App..."
cd apps/legacy
vercel --prod --yes
LEGACY_URL=$(vercel ls | grep "legacy" | head -1 | awk '{print $2}')
echo "✅ Legacy deployed to: $LEGACY_URL"
cd ../..

# Update web app config with legacy URL
echo "🔧 Updating web app configuration..."
sed -i.bak "s|https://your-legacy-app-url.vercel.app|$LEGACY_URL|g" apps/web/vercel.json

# Deploy web app
echo "📦 Deploying Web App..."
cd apps/web
vercel --prod --yes
WEB_URL=$(vercel ls | grep "web" | head -1 | awk '{print $2}')
echo "✅ Web app deployed to: $WEB_URL"
cd ../..

echo "🎉 Deployment Complete!"
echo "🌐 Landing Page: $WEB_URL"
echo "🐋 Lite Dashboard: $WEB_URL/lite"
echo "🔄 Legacy Proxy: $WEB_URL/legacy"
echo "🛡️ Tier Gating: $WEB_URL/pro?tier=lite → /upgrade"

echo ""
echo "📋 Next Steps:"
echo "1. Test all URLs above"
echo "2. Verify legacy proxy works"
echo "3. Test tier gating redirects"
echo "4. Set feature flags if needed"