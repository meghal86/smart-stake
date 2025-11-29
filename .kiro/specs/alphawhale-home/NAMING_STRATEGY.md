# AlphaWhale Home - Naming Strategy

## Overview

To avoid confusion with existing pages and ensure clear separation, all new AlphaWhale Home components use the **"AlphaWhale" prefix**.

## Existing Pages (DO NOT MODIFY)

These pages remain untouched and will be used in later phases:

1. **`src/pages/Index.tsx`**
   - AlphaWhale Lite app
   - Current landing experience for lite users
   - Shows digest cards, signals, portfolio demo
   - **Keep as-is**

2. **`src/pages/Home.tsx`**
   - Whale Alerts page
   - Shows whale transactions and alerts
   - Feature page, not a landing page
   - **Keep as-is**

3. **`src/app/page.tsx`**
   - Current Next.js App Router landing page
   - Shows `<MarketHub persona="pro" />`
   - Will be updated later when new home is ready
   - **Keep as-is for now**

## New Components (AlphaWhale Home)

All new components use clear "AlphaWhale" prefix:

### Main Page Component
- **`AlphaWhaleHomePage.tsx`** - Main page component
  - NOT `HomePage.tsx` (too generic, could conflict)
  - NOT `Home.tsx` (already exists)
  - Clear, unambiguous name

### Section Components
- **`AlphaWhaleHeroSection.tsx`** - Hero section with headline and CTA
- **`AlphaWhaleFeatureCard.tsx`** - Feature card for Guardian/Hunter/HarvestPro
- **`AlphaWhaleTrustBuilders.tsx`** - Trust indicators and statistics
- **`AlphaWhaleOnboardingSection.tsx`** - Onboarding flow section
- **`AlphaWhaleFooterNav.tsx`** - Footer navigation (if needed separately)

### Supporting Components
- **`HomeErrorBoundary`** - Error boundary (already created in `ErrorBoundary.tsx`)
- **`useHomeMetrics`** - Hook for fetching metrics
- **`getDemoMetrics`** - Demo data service

## Type Definitions

Types use clear, descriptive names without "AlphaWhale" prefix (since they're in `types/home.ts`):

- `HomeMetrics` - Core metrics interface
- `HeroSectionProps` - Hero section props
- `FeatureCardProps` - Feature card props
- `TrustBuildersProps` - Trust builders props
- `OnboardingSectionProps` - Onboarding section props

## File Structure

```
src/
├── pages/
│   ├── Index.tsx                             ✅ KEEP (Lite app)
│   └── Home.tsx                              ✅ KEEP (Whale Alerts)
├── app/
│   └── page.tsx                              ✅ KEEP (will update later)
├── components/
│   └── home/
│       ├── AlphaWhaleHomePage.tsx           🆕 NEW (main page)
│       ├── AlphaWhaleHeroSection.tsx        🆕 NEW
│       ├── AlphaWhaleFeatureCard.tsx        🆕 NEW
│       ├── AlphaWhaleTrustBuilders.tsx      🆕 NEW
│       ├── AlphaWhaleOnboardingSection.tsx  🆕 NEW
│       └── index.ts                          🆕 NEW (barrel export)
├── types/
│   └── home.ts                               🆕 NEW (type definitions)
├── lib/
│   ├── services/
│   │   └── demoDataService.ts               🆕 NEW
│   └── constants/
│       └── errorMessages.ts                 🆕 NEW
└── hooks/
    └── useHomeMetrics.ts                    🆕 NEW
```

## Import Examples

### Good Imports (Clear and Unambiguous)

```typescript
// Importing new AlphaWhale Home components
import { AlphaWhaleHomePage } from '@/components/home/AlphaWhaleHomePage';
import { AlphaWhaleHeroSection } from '@/components/home/AlphaWhaleHeroSection';
import { AlphaWhaleFeatureCard } from '@/components/home/AlphaWhaleFeatureCard';

// Importing types
import type { HomeMetrics, FeatureCardProps } from '@/types/home';

// Importing services
import { getDemoMetrics } from '@/lib/services/demoDataService';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

// Importing hooks
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
```

### Bad Imports (Avoid These)

```typescript
// ❌ Too generic, could conflict
import { HomePage } from '@/components/home/HomePage';
import { HeroSection } from '@/components/home/HeroSection';

// ❌ Confusing with existing pages
import Home from '@/pages/Home';
import Index from '@/pages/Index';
```

## Future Integration

When the AlphaWhale Home page is ready to go live:

```typescript
// src/app/page.tsx (future)
import { AlphaWhaleHomePage } from '@/components/home/AlphaWhaleHomePage';

export default function Page() {
  return <AlphaWhaleHomePage />;
}
```

The old MarketHub can be preserved at a different route:

```typescript
// src/app/market-hub/page.tsx (optional)
import { MarketHub } from '@/components/MarketHub';

export default function MarketHubPage() {
  return <MarketHub persona="pro" />;
}
```

## Benefits of This Approach

1. **No Conflicts** - Clear separation from existing code
2. **Easy to Find** - All AlphaWhale Home components grouped together
3. **Future-Proof** - Can coexist with existing pages during development
4. **Clear Intent** - Anyone reading the code knows it's for the new home page
5. **Safe Refactoring** - Can update gradually without breaking existing features

## Component Naming Pattern

All components follow this pattern:

```
AlphaWhale + [ComponentPurpose] + [ComponentType]

Examples:
- AlphaWhaleHomePage (main page)
- AlphaWhaleHeroSection (section)
- AlphaWhaleFeatureCard (card)
- AlphaWhaleTrustBuilders (section)
```

## Summary

✅ **DO:**
- Use "AlphaWhale" prefix for all new components
- Keep existing pages untouched
- Use clear, descriptive names
- Group related components in `components/home/`

❌ **DON'T:**
- Modify existing `Index.tsx` or `Home.tsx`
- Use generic names like `HomePage` or `HeroSection`
- Create naming conflicts with existing code
- Delete or rename existing pages

---

**Status:** Naming strategy defined and documented
**Date:** 2025-01-28
**Next:** Implement Task 2 (Authentication) with this naming convention
