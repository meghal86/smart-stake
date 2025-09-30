# Vercel Deployment Guide

## 🚀 Deploy AlphaWhale to Vercel

### 1. Deploy Legacy App First
```bash
# Deploy legacy app to Vercel
cd apps/legacy
vercel --prod
# Note the URL: https://your-legacy-app.vercel.app
```

### 2. Update Configuration
Update `apps/web/vercel.json` with your legacy app URL:
```json
{
  "env": {
    "LEGACY_PROXY_BASE": "https://your-actual-legacy-app.vercel.app"
  }
}
```

### 3. Deploy Web App
```bash
# Deploy web app to Vercel
cd apps/web
vercel --prod
```

### 4. Environment Variables
Set in Vercel dashboard:
- `NODE_ENV=production`
- `LEGACY_PROXY_BASE=https://your-legacy-app.vercel.app`
- `FEATURE_FLAGS_PATH=./feature_flags.json`

### 5. Feature Flags
Copy `feature_flags.json` to production:
```json
{
  "next_web_enabled": true,
  "spotlight_share": { "tiers": ["lite", "pro", "enterprise"], "rollout": 1 }
}
```

### 6. Test URLs
- Landing: `https://your-web-app.vercel.app`
- Lite: `https://your-web-app.vercel.app/lite`
- Legacy: `https://your-web-app.vercel.app/legacy` (proxied)
- Tier gating: `https://your-web-app.vercel.app/pro?tier=lite` → redirects to `/upgrade`

### 7. Rollback Plan
Set `next_web_enabled: false` in feature flags to route all traffic to legacy.

## ✅ Deployment Checklist
- [ ] Legacy app deployed
- [ ] Web app deployed  
- [ ] Environment variables set
- [ ] Feature flags configured
- [ ] All pages accessible
- [ ] Legacy proxy working
- [ ] Tier gating functional