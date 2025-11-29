# AlphaWhale Home - Project Structure Clarification

## Current State Analysis

### Existing Pages

1. **`src/app/page.tsx`** (Next.js App Router)
   - Currently renders `<MarketHub persona="pro" />`
   - This is the main landing page at `/`
   - **This will be replaced** with the new AlphaWhale Home page

2. **`src/pages/Index.tsx`** (React Router)
   - AlphaWhale Lite app
   - Shows digest cards, signals, portfolio demo
   - This is a separate experience for lite users

3. **`src/pages/Home.tsx`** (React Router)
   - Whale Alerts page (not the home page)
   - Shows whale transactions and alerts
   - This is a feature page, not the landing page

### What We're Building

According to the spec, we're creating a **NEW AlphaWhale Home page** that will:
- Be a completely separate page from existing pages
- Showcase the three core features: Guardian, Hunter, HarvestPro
- Include hero section, feature cards, trust builders, onboarding, footer nav
- Support demo mode (unauthenticated) and live mode (authenticated)

**Important Naming Strategy:**
- Existing pages remain untouched: `Index.tsx` (Lite), `Home.tsx` (Whale Alerts)
- New components will use clear "AlphaWhale" prefix to avoid confusion
- Main component: `AlphaWhaleHomePage.tsx` (not just `HomePage.tsx`)
- This ensures no conflicts with existing code

## Task 1 Completion Summary

We've successfully completed the **infrastructure setup** for the new home page:

### ✅ Created Files

1. **Type Definitions** (`src/types/home.ts`)
   - `HomeMetrics` interface
   - Component prop interfaces
   - API response types
   - Hook types

2. **Demo Data Service** (`src/lib/services/demoDataService.ts`)
   - `getDemoMetrics()` - Instant demo data
   - `isDemoMetrics()` - Check if demo
   - `getDemoMetricsWithOverrides()` - Custom demo data

3. **Error Messages** (`src/lib/constants/errorMessages.ts`)
   - `ERROR_MESSAGES` - 30+ error messages
   - `SUCCESS_MESSAGES` - Success messages
   - `INFO_MESSAGES` - Info messages
   - `WARNING_MESSAGES` - Warning messages
   - Helper functions for message retrieval

4. **Error Boundary** (`src/components/ui/ErrorBoundary.tsx`)
   - `HomeErrorBoundary` component
   - Sentry integration
   - Fallback UI with retry
   - `withErrorBoundary` HOC

5. **Component Directory** (`src/components/home/`)
   - Created directory structure
   - Added `index.ts` barrel export (placeholder)

6. **Type Exports** (`src/types/index.ts`)
   - Barrel export for all types
   - Includes new home types

## Next Steps

### Task 2: Implement Authentication System
- Create Auth Context and Provider
- Configure WalletConnect v2
- Implement wallet connection flow
- Set up JWT cookie handling
- Create useAuth hook

### Task 3: Create Data Fetching Layer
- Implement `useHomeMetrics` hook
- Set up React Query configuration
- Handle demo vs live data switching
- Implement error recovery and retry logic

### Task 4+: Build UI Components
- HeroSection
- FeatureCard (Guardian, Hunter, HarvestPro)
- TrustBuilders
- OnboardingSection
- FooterNav

### Final Integration
Once all components are built, we'll update `src/app/page.tsx` to render the new home page:

```typescript
// src/app/page.tsx (future - when ready to switch)
import { AlphaWhaleHomePage } from '@/components/home/AlphaWhaleHomePage';

export default function Page() {
  return <AlphaWhaleHomePage />;
}
```

**Note:** The existing `src/app/page.tsx` currently shows `<MarketHub persona="pro" />`. We'll keep this until the new AlphaWhale Home is fully ready, then switch it over. The old MarketHub can be preserved at a different route if needed.

## Architecture Notes

### Demo Mode First
- Unauthenticated users see demo data instantly
- No API calls in demo mode
- Clear "Demo Mode" badges
- Smooth transition to live mode on wallet connect

### Progressive Enhancement
- Core content renders server-side
- Metrics load progressively
- Skeleton loaders for async content
- Graceful degradation on errors

### Type Safety
- All components properly typed
- Strict TypeScript mode
- No `any` types
- Explicit return types

## File Organization

```
src/
├── app/
│   └── page.tsx                              # Current: MarketHub (will switch later)
├── pages/
│   ├── Index.tsx                             # ✅ Existing: AlphaWhale Lite (keep)
│   └── Home.tsx                              # ✅ Existing: Whale Alerts (keep)
├── types/
│   ├── home.ts                               # ✅ New home types
│   └── index.ts                              # ✅ Updated barrel export
├── lib/
│   ├── services/
│   │   └── demoDataService.ts               # ✅ Demo data
│   └── constants/
│       └── errorMessages.ts                 # ✅ Error messages
├── components/
│   ├── ui/
│   │   └── ErrorBoundary.tsx                # ✅ Error boundary (HomeErrorBoundary)
│   └── home/
│       ├── index.ts                          # ✅ Placeholder
│       ├── AlphaWhaleHeroSection.tsx        # TODO: Task 4
│       ├── AlphaWhaleFeatureCard.tsx        # TODO: Task 5
│       ├── AlphaWhaleTrustBuilders.tsx      # TODO: Task 7
│       ├── AlphaWhaleOnboardingSection.tsx  # TODO: Task 8
│       └── AlphaWhaleHomePage.tsx           # TODO: Task 10 (main component)
└── hooks/
    └── useHomeMetrics.ts                    # TODO: Task 3
```

**Naming Convention:**
- All new components prefixed with "AlphaWhale" to avoid conflicts
- Existing pages (`Index.tsx`, `Home.tsx`) remain untouched
- Clear separation between old and new code

## Status

✅ **Task 1 Complete** - Project structure and core infrastructure ready
⏳ **Task 2 Next** - Implement authentication system

All infrastructure is in place to begin building the authentication system and UI components.

---

**Date:** 2025-01-28
**Status:** Infrastructure Complete, Ready for Task 2
