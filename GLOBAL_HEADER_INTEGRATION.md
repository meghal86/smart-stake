# Global Header Integration Guide

## Summary

The GlobalHeader component has been enhanced with:
- ✅ Sign In functionality (redirects to /auth/signin)
- ✅ Connect Wallet functionality (uses WalletContext)
- ✅ Add Wallet functionality (same as Connect Wallet)
- ✅ Profile dropdown with sign out
- ✅ Theme toggle
- ✅ Session state management (S0_GUEST, S1_ACCOUNT, S2_WALLET, S3_BOTH)

## Integration Steps

### 1. Replace Page-Specific Headers

**Current headers to replace:**
- `DashboardHeader` → `GlobalHeader`
- `HunterHeader` (Header) → `GlobalHeader`
- `HarvestProHeader` → `GlobalHeader`
- `PortfolioHeader` → `GlobalHeader`
- `AppHeader` → `GlobalHeader`
- `LiteGlobalHeader` → `GlobalHeader`

### 2. Example Integration

**Before (Hunter.tsx):**
```tsx
import { Header } from '@/components/hunter/Header';

export default function Hunter() {
  return (
    <div>
      <Header
        isDemo={isDemo}
        setIsDemo={setIsDemo}
        // ... many props
      />
      {/* content */}
    </div>
  );
}
```

**After (Hunter.tsx):**
```tsx
import { GlobalHeader } from '@/components/header/GlobalHeader';

export default function Hunter() {
  return (
    <div>
      <GlobalHeader />
      {/* content */}
    </div>
  );
}
```

### 3. Features Available

**For All Users (S0_GUEST):**
- Sign In button → redirects to /auth/signin
- Connect Wallet button → opens wallet connection modal
- Theme toggle

**For Authenticated Users (S1_ACCOUNT):**
- Add Wallet button → connects new wallet
- Connect Wallet button (secondary)
- Profile dropdown with:
  - Profile link
  - Settings link
  - Sign Out

**For Wallet-Only Users (S2_WALLET):**
- Wallet pill showing connected address
- Save button → prompts to sign in
- Sign In button

**For Authenticated + Wallet (S3_BOTH):**
- Wallet pill (interactive on Portfolio page)
- Profile dropdown

### 4. Page-Specific Context

The header automatically adapts based on the current route:

```typescript
const HEADER_CONTEXT_MAP = {
  '/': { title: 'AlphaWhale', subtitle: 'Institutional-Grade DeFi Risk Management' },
  '/guardian': { title: 'Guardian', subtitle: 'Trust & Safety' },
  '/hunter': { title: 'Hunter', subtitle: 'High-confidence opportunities' },
  '/harvestpro': { title: 'Harvest', subtitle: 'Tax-optimized outcomes' },
  '/portfolio': { title: 'Portfolio', subtitle: 'Overview', enableWalletSelector: true },
};
```

### 5. Migration Checklist

- [ ] Remove old header imports from pages
- [ ] Add `import { GlobalHeader } from '@/components/header/GlobalHeader'`
- [ ] Replace `<OldHeader />` with `<GlobalHeader />`
- [ ] Remove header-specific state management (isDemo, theme, etc.)
- [ ] Test sign in flow
- [ ] Test wallet connection
- [ ] Test sign out
- [ ] Test theme toggle
- [ ] Verify responsive behavior

### 6. Files Modified

**Core Components:**
- `/src/components/header/ActionsSection.tsx` - Added wallet connection and sign in handlers
- `/src/components/header/GlobalHeader.tsx` - Already configured
- `/src/components/header/WalletPill.tsx` - Already configured
- `/src/lib/header/index.ts` - Utility functions
- `/src/lib/header/sign-out.ts` - Sign out handler

**Context Providers:**
- `/src/contexts/WalletContext.tsx` - Wallet management
- `/src/contexts/AuthContext.tsx` - Authentication

### 7. Quick Integration Script

Run this to update all pages at once:

```bash
# Find all pages using old headers
grep -r "import.*Header" src/pages --include="*.tsx" | grep -v "CardHeader\|DialogHeader"

# Replace imports (manual review recommended)
# Example for Hunter.tsx:
sed -i '' 's/import { Header } from.*hunter\/Header/import { GlobalHeader } from "@\/components\/header\/GlobalHeader"/g' src/pages/Hunter.tsx
sed -i '' 's/<Header/<GlobalHeader/g' src/pages/Hunter.tsx
```

### 8. Testing

```bash
# Start dev server
npm run dev

# Test flows:
1. Visit / → Click "Sign In" → Should redirect to /auth/signin
2. Visit / → Click "Connect Wallet" → Should open wallet modal
3. Sign in → Click "Add Wallet" → Should connect wallet
4. With wallet → Click profile → Click "Sign Out" → Should sign out
5. Toggle theme → Should persist across pages
```

### 9. Benefits

- ✅ Consistent UX across all pages
- ✅ Single source of truth for auth/wallet state
- ✅ Reduced code duplication
- ✅ Easier maintenance
- ✅ Better accessibility
- ✅ Responsive design built-in

### 10. Next Steps

1. Update App.tsx to use GlobalHeader in layout
2. Remove old header components
3. Update tests
4. Update documentation
