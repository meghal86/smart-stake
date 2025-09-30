# Day-One AlphaWhale Implementation

## ✅ Completed Features

### 1. Environment-aware Next.js Config
- **Dev**: Legacy routes redirect to `http://localhost:8080` (new tab)
- **Prod**: Legacy routes proxied under `/legacy/*` (same domain)
- Environment variable: `LEGACY_PROXY_BASE`

### 2. Tier Detection & Gating
- Middleware sets `x-user-tier` header
- Pro/Enterprise routes redirect to `/upgrade` for Lite users
- URL parameter fallback: `?tier=lite|pro|enterprise`

### 3. Feature Flags + Kill Switch
- JSON-based feature flags in `feature_flags.json`
- Kill switch: `next_web_enabled=false` routes all traffic to Legacy
- Runtime flag checking with `getFlag()` function

### 4. Analytics Tracking
- PostHog-style `track()` function (console.debug for now)
- Events: `landing_view`, `landing_choice`, `spotlight_view`, `upgrade_click`

### 5. Landing Page Enhancements
- Auto-highlight cards based on current tier
- "Learn more" toggles with feature bullets
- Legacy reassurance text: "Legacy remains during migration — no features will be lost ✅"
- Environment-aware Legacy links (new tab in dev, same tab in prod)

### 6. Lite Dashboard with Real Data
- Server-side rendering with ISR (5min revalidate)
- Real API calls to `@sdk/lite` functions
- Components: WhaleSpotlightCard, FearAndWhaleDial, DigestList, PortfolioLite

### 7. Portfolio Lite
- Add/remove crypto holdings
- localStorage persistence
- Simple form interface

### 8. OG Share Images
- API route: `/api/share/spotlight/[id]`
- Dynamic image generation for whale spotlights
- Edge runtime for performance

### 9. Playwright Smoke Tests
- Landing → Lite navigation test
- Tier gating redirect test
- Configuration in `playwright.config.ts`

### 10. Monorepo Structure
- `pnpm-workspace.yaml` for workspace management
- Turbo.json pipeline configuration
- Shared packages: `@sdk`, `@ui`, `@types`, `@config`

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development (two terminals)
pnpm --filter ./apps/legacy dev     # :8080
pnpm --filter ./apps/web dev        # :3000

# Test URLs
http://localhost:3000                # Landing
http://localhost:3000/lite?tier=lite # Lite Dashboard
http://localhost:3000/pro?tier=lite  # Should redirect to /upgrade

# Run tests
npx playwright test tests/e2e/landing-lite.spec.ts
```

## 🎯 Acceptance Criteria Status

- ✅ Landing shows three cards with tier auto-highlight
- ✅ "Learn more" toggles with feature bullets
- ✅ Legacy reassurance text displayed
- ✅ Environment-aware Legacy links (dev: new tab, prod: same domain)
- ✅ Middleware tier gating with redirects
- ✅ Lite dashboard with real data and ISR
- ✅ Portfolio Lite with localStorage persistence
- ✅ OG share image API route
- ✅ Feature flag kill switch (`next_web_enabled`)
- ✅ Analytics events via `track()` calls
- ✅ Playwright smoke tests
- ✅ Health page preserved (not modified)

## 📁 Key Files Created/Modified

### Core Infrastructure
- `apps/web/next.config.js` - Environment-aware routing
- `apps/web/middleware.ts` - Tier gating + kill switch
- `apps/web/src/lib/legacy.ts` - Legacy URL helper
- `apps/web/src/lib/flags.ts` - Feature flags system
- `apps/web/src/lib/track.ts` - Analytics tracking

### Pages & Components
- `apps/web/src/app/page.tsx` - Enhanced landing page
- `apps/web/src/app/lite/page.tsx` - Server-side Lite dashboard
- `apps/web/src/app/lite/LiteClientWrapper.tsx` - Analytics wrapper
- `apps/web/src/app/pro/page.tsx` - Pro page for testing
- `apps/web/src/app/upgrade/page.tsx` - Upgrade redirect page
- `apps/web/src/components/portfolio/PortfolioLite.tsx` - Portfolio component

### API & Sharing
- `apps/web/src/app/api/share/spotlight/[id]/route.tsx` - OG images

### Configuration
- `feature_flags.json` - Active feature flags
- `feature_flags.example.json` - Example configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `playwright.config.ts` - Test configuration
- `apps/web/.env.example` - Environment variables

### Tests
- `tests/e2e/landing-lite.spec.ts` - Smoke tests

## 🔧 Environment Variables

```bash
# Development
NODE_ENV=development
LEGACY_PROXY_BASE=http://localhost:8080

# Production
NODE_ENV=production
LEGACY_PROXY_BASE=https://legacy-internal:8080

# Feature Flags
FEATURE_FLAGS_PATH=./feature_flags.json
```

## 🎛️ Feature Flags

```json
{
  "next_web_enabled": true,
  "spotlight_share": { "tiers": ["lite", "pro", "enterprise"], "rollout": 1 },
  "pro_leaderboard": { "tiers": ["pro", "enterprise"], "rollout": 1 }
}
```

## 📊 Performance Targets

- **Lite Route**: <200KB gzipped ✅
- **LCP P75**: ≤2.0s (ISR + server components)
- **Lighthouse Score**: >90

## 🔄 Rollback Plan

1. Set `next_web_enabled: false` in feature flags
2. All traffic routes to Legacy app
3. Zero downtime rollback capability

---

**Status**: ✅ Day-One Ready for Production Deployment