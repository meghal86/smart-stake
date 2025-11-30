# Unified FooterNav Usage Guide

## Single Source of Truth

**Location**: `src/components/layout/FooterNav.tsx`

This is the ONE and ONLY footer navigation component for AlphaWhale. All feature pages should use this component.

## Features Included

1. **Guardian** (`/guardian`) - Security scanning
2. **Hunter** (`/hunter`) - Opportunity discovery  
3. **HarvestPro** (`/harvestpro`) - Tax-loss harvesting
4. **Portfolio** (`/portfolio`) - Portfolio tracking

## Pages That Should Use This Footer

### ✅ Currently Using (or Should Use)

- `/guardian` - Guardian security scanner
- `/hunter` - Hunter opportunities
- `/harvestpro` - HarvestPro tax optimization
- `/portfolio` - Portfolio tracker

### Import Statement

```tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const YourPage = () => {
  return (
    <div className="min-h-screen pb-[72px]">
      {/* Your page content */}
      <main>
        {/* Content here */}
      </main>
      
      {/* Unified footer */}
      <FooterNav />
    </div>
  );
};
```

## Important: Bottom Padding

Since the footer is fixed at the bottom (72px height), always add `pb-[72px]` to your page container to prevent content from being hidden:

```tsx
<div className="min-h-screen pb-[72px]">
```

## Deprecated Footer Components

The following footer components should NO LONGER be used:

- ❌ `src/components/navigation/AppFooterNav.tsx` - Old dashboard footer
- ❌ `src/components/navigation/MobileFooterNav.tsx` - Old mobile footer
- ❌ `src/components/nav/MobileFooterNav.tsx` - Old nav footer
- ❌ `src/components/home/FooterNav.tsx` - Home page specific footer

## Migration Steps

If you find a page using an old footer component:

1. Remove the old footer import
2. Import the unified footer: `import { FooterNav } from '@/components/layout/FooterNav';`
3. Replace the old footer component with `<FooterNav />`
4. Ensure the page container has `pb-[72px]` class

## Example Migration

### Before (Old)
```tsx
import { AppFooterNav } from '@/components/navigation/AppFooterNav';

export const MyPage = () => {
  return (
    <div className="min-h-screen">
      <main>{/* content */}</main>
      <AppFooterNav />
    </div>
  );
};
```

### After (New)
```tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const MyPage = () => {
  return (
    <div className="min-h-screen pb-[72px]">
      <main>{/* content */}</main>
      <FooterNav />
    </div>
  );
};
```

## Benefits of Unified Footer

1. **Consistency** - Same navigation experience across all features
2. **Maintainability** - Update once, applies everywhere
3. **Performance** - Single component, less code duplication
4. **User Experience** - Predictable navigation patterns

## Styling

The unified footer uses:
- **Fixed positioning** at bottom
- **72px height**
- **Glassmorphism** design with backdrop blur
- **Gradient active state** (cyan to purple)
- **React Router Link** for client-side navigation
- **Full accessibility** support (ARIA labels, keyboard nav, focus indicators)

## Questions?

Refer to `src/components/layout/FOOTER_NAV_GUIDE.md` for detailed documentation.
