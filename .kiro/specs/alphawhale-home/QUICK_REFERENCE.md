# AlphaWhale Home - Quick Reference

## 🎯 Naming Convention

**All new components use "AlphaWhale" prefix to avoid conflicts**

## Existing Pages (Don't Touch)
- `src/pages/Index.tsx` → AlphaWhale Lite
- `src/pages/Home.tsx` → Whale Alerts
- `src/app/page.tsx` → Current landing (MarketHub)

## New Components (Task 1 Complete)
- ✅ `src/types/home.ts` → Type definitions
- ✅ `src/lib/services/demoDataService.ts` → Demo data
- ✅ `src/lib/constants/errorMessages.ts` → Error messages
- ✅ `src/components/ui/ErrorBoundary.tsx` → HomeErrorBoundary
- ✅ `src/components/home/index.ts` → Barrel export

## New Components (Coming in Tasks 2-10)
- ⏳ `AlphaWhaleHomePage.tsx` → Main page
- ⏳ `AlphaWhaleHeroSection.tsx` → Hero
- ⏳ `AlphaWhaleFeatureCard.tsx` → Feature cards
- ⏳ `AlphaWhaleTrustBuilders.tsx` → Trust section
- ⏳ `AlphaWhaleOnboardingSection.tsx` → Onboarding

## Quick Imports

```typescript
// Types
import type { HomeMetrics } from '@/types/home';

// Services
import { getDemoMetrics } from '@/lib/services/demoDataService';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

// Components (future)
import { AlphaWhaleHomePage } from '@/components/home/AlphaWhaleHomePage';
```

## Demo Data Values
- Guardian Score: **89**
- Hunter Opportunities: **42** (18.5% APY)
- HarvestPro Estimate: **$12,400** (7 tokens)
- Platform: **50K wallets**, **$12.4M optimized**

## Status
✅ Task 1 Complete - Infrastructure ready
⏳ Task 2 Next - Authentication system

## Key Files
- 📄 `NAMING_STRATEGY.md` → Full naming guide
- 📄 `TASK_1_COMPLETION.md` → Detailed completion
- 📄 `PROJECT_STRUCTURE_CLARIFICATION.md` → Structure explanation
