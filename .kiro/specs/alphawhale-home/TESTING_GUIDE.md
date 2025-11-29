# AlphaWhale Home Dashboard - Testing Guide

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### 2. Navigate to Home Page

Open your browser and go to:
```
http://localhost:5173/
```

You should see the AlphaWhale Home page with:
- Hero section with headline and CTA button
- Three feature cards (Guardian, Hunter, HarvestPro)
- Trust builders section with badges and stats
- Onboarding section with 3 steps
- Footer navigation

---

## Testing Modes

### Demo Mode (Default - No Wallet Connected)

**What to expect:**
- Page loads instantly with sample data
- All feature cards show demo metrics
- Purple "Demo" badges visible on cards
- "Connect Wallet" button in hero section
- All interactions work without authentication

**How to test:**
1. Open the page (no wallet connection needed)
2. Verify demo badges appear on feature cards
3. Check that metrics display (Guardian Score: 89, Hunter Opportunities: 42, etc.)
4. Click "Connect Wallet" button - should open WalletConnect modal
5. Navigate using footer nav - all routes should work

### Live Mode (Wallet Connected)

**What to expect:**
- Real metrics from your connected wallet
- No demo badges
- "Start Protecting" button in hero section
- Data refreshes every 30 seconds
- Personalized statistics

**How to test:**
1. Click "Connect Wallet" button
2. Connect your wallet (MetaMask, WalletConnect, etc.)
3. Sign the authentication message
4. Page should refresh with your real data
5. Demo badges should disappear
6. Metrics should show your actual Guardian score, opportunities, etc.

---

## Component Testing Checklist

### ✅ Hero Section

**Visual Check:**
- [ ] Headline displays: "Master Your DeFi Risk & Yield – In Real Time"
- [ ] Subheading displays: "Secure your wallet. Hunt alpha. Harvest taxes."
- [ ] Animated background visible (subtle geometric shapes)
- [ ] CTA button has proper contrast (cyan-700 background)

**Interaction Check:**
- [ ] CTA button shows "Connect Wallet" when not authenticated
- [ ] CTA button shows "Start Protecting" when authenticated
- [ ] Button is keyboard accessible (Tab to focus, Enter to activate)
- [ ] Hover state changes button color
- [ ] Click opens wallet modal (demo) or navigates to /guardian (live)

**Accessibility Check:**
- [ ] Text is readable (white on dark background)
- [ ] Button has visible focus indicator
- [ ] Animation respects prefers-reduced-motion setting

### ✅ Feature Cards

**Guardian Card:**
- [ ] Shield icon displays
- [ ] Title: "Guardian"
- [ ] Tagline: "Secure your wallet"
- [ ] Preview shows Guardian Score (89 in demo, real score in live)
- [ ] Demo badge appears in demo mode
- [ ] "View Guardian" button navigates to /guardian
- [ ] Card scales on hover (1.02x)

**Hunter Card:**
- [ ] Zap icon displays
- [ ] Title: "Hunter"
- [ ] Tagline: "Hunt alpha opportunities"
- [ ] Preview shows opportunity count (42 in demo)
- [ ] Demo badge appears in demo mode
- [ ] "View Hunter" button navigates to /hunter

**HarvestPro Card:**
- [ ] Leaf icon displays
- [ ] Title: "HarvestPro"
- [ ] Tagline: "Harvest tax losses"
- [ ] Preview shows tax benefit estimate ($12,400 in demo)
- [ ] Demo badge appears in demo mode
- [ ] "View HarvestPro" button navigates to /harvestpro

**Loading States:**
- [ ] Skeleton loaders show while data is fetching
- [ ] Smooth transition from loading to loaded state

**Error States:**
- [ ] If API fails, shows "—" placeholder
- [ ] Error message displays below metric
- [ ] "Retry" button appears

### ✅ Trust Builders Section

**Badges:**
- [ ] "Non-custodial" badge displays
- [ ] "No KYC" badge displays
- [ ] "On-chain" badge displays
- [ ] "Guardian-vetted" badge displays

**Statistics:**
- [ ] Total Wallets Protected displays (10,000+ in demo)
- [ ] Total Yield Optimized displays ($5M+ in demo)
- [ ] Average Guardian Score displays (85 in demo)
- [ ] Numbers are formatted with commas

**Loading:**
- [ ] Skeleton loaders show while stats are loading
- [ ] Stats fade in when loaded

### ✅ Onboarding Section

**Steps:**
- [ ] Step 1: "Connect Wallet" displays with icon
- [ ] Step 2: "Run Guardian Scan" displays with icon
- [ ] Step 3: "Browse Hunter" displays with icon
- [ ] Step numbers (1, 2, 3) are visible
- [ ] Cards have hover animation (scale 1.05)

**CTAs:**
- [ ] "Start Onboarding" button navigates to /onboarding
- [ ] "Skip" button navigates to /hunter
- [ ] Both buttons are keyboard accessible

### ✅ Footer Navigation

**Icons:**
- [ ] Guardian icon displays
- [ ] Hunter icon displays
- [ ] HarvestPro icon displays
- [ ] Settings icon displays

**Interaction:**
- [ ] Clicking Guardian navigates to /guardian
- [ ] Clicking Hunter navigates to /hunter
- [ ] Clicking HarvestPro navigates to /harvestpro
- [ ] Clicking Settings navigates to /settings
- [ ] Active route is highlighted in cyan
- [ ] Touch targets are at least 44px tall

---

## Responsive Testing

### Desktop (≥1024px)
```bash
# Open browser DevTools (F12)
# Set viewport to 1920x1080
```

**Check:**
- [ ] Hero section uses 2-column layout
- [ ] Feature cards display in a row (3 columns)
- [ ] All text is readable
- [ ] Spacing looks balanced

### Tablet (768px - 1023px)
```bash
# Set viewport to 768x1024
```

**Check:**
- [ ] Feature cards display in 2x2 grid or stacked
- [ ] Hero section stacks vertically
- [ ] Footer nav remains at bottom
- [ ] Touch targets are adequate

### Mobile (≤767px)
```bash
# Set viewport to 375x667 (iPhone SE)
```

**Check:**
- [ ] All elements stack vertically
- [ ] Feature cards are full width
- [ ] Text is readable (no tiny fonts)
- [ ] Buttons are full width
- [ ] Footer nav is fixed at bottom
- [ ] Touch targets are at least 44px
- [ ] No horizontal scrolling

---

## Accessibility Testing

### Keyboard Navigation

**Test:**
1. Press Tab repeatedly
2. Verify focus moves through all interactive elements in logical order:
   - Hero CTA button
   - Guardian card button
   - Hunter card button
   - HarvestPro card button
   - Onboarding "Start" button
   - Onboarding "Skip" button
   - Footer nav icons

**Check:**
- [ ] All buttons are focusable
- [ ] Focus indicator is visible (cyan ring)
- [ ] Enter key activates focused element
- [ ] Space key activates focused element
- [ ] Tab order is logical

### Screen Reader Testing

**macOS VoiceOver:**
```bash
# Enable: Cmd + F5
```

**Check:**
- [ ] Headline is announced
- [ ] Button labels are clear ("Connect wallet to get started")
- [ ] Feature card content is announced
- [ ] Navigation landmarks are identified

### Contrast Testing

**Using Browser DevTools:**
1. Open DevTools (F12)
2. Select element
3. Check "Accessibility" pane
4. Verify contrast ratio

**Check:**
- [ ] White text on dark background: ≥19:1 ✅
- [ ] Gray-400 text on dark background: ≥7.5:1 ✅
- [ ] Cyan-400 icons on dark background: ≥10.5:1 ✅
- [ ] White text on cyan-700 buttons: ≥5.4:1 ✅

**Or run automated test:**
```bash
npm test -- src/lib/utils/__tests__/contrast.test.ts --run
```

### Color Blindness Testing

**Browser Extensions:**
- Chrome: "Colorblindly"
- Firefox: "Colorblind - Dalton"

**Check:**
- [ ] Interface is usable with protanopia (red-blind)
- [ ] Interface is usable with deuteranopia (green-blind)
- [ ] Interface is usable with tritanopia (blue-blind)
- [ ] Information isn't conveyed by color alone

---

## Performance Testing

### Lighthouse Audit

```bash
# In Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to "Lighthouse" tab
# 3. Select "Performance" and "Accessibility"
# 4. Click "Analyze page load"
```

**Target Scores:**
- [ ] Performance: ≥90
- [ ] Accessibility: ≥90
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

**Key Metrics:**
- [ ] LCP (Largest Contentful Paint): <2.5s
- [ ] FID (First Input Delay): <100ms
- [ ] CLS (Cumulative Layout Shift): <0.1
- [ ] TTI (Time to Interactive): <3.0s

### Network Throttling

**Test on slow connection:**
```bash
# In DevTools:
# 1. Go to "Network" tab
# 2. Select "Slow 3G" from throttling dropdown
# 3. Reload page
```

**Check:**
- [ ] Page loads within 5 seconds
- [ ] Skeleton loaders show during load
- [ ] No layout shift when content loads
- [ ] Images load progressively

---

## Automated Testing

### Run All Tests

```bash
# Run all home page tests
npm test -- src/components/home --run

# Run contrast tests
npm test -- src/lib/utils/__tests__/contrast.test.ts --run

# Run integration tests
npm test -- src/__tests__/api/home-metrics.integration.test.ts --run
```

**Expected Results:**
- [ ] 175+ component tests passing
- [ ] 22 contrast tests passing
- [ ] All integration tests passing

### Run Specific Component Tests

```bash
# Test HeroSection
npm test -- src/components/home/__tests__/HeroSection.test.tsx --run

# Test FeatureCard
npm test -- src/components/home/__tests__/FeatureCard.test.tsx --run

# Test TrustBuilders
npm test -- src/components/home/__tests__/TrustBuilders.test.tsx --run
```

---

## Common Issues & Solutions

### Issue: Demo badges not showing
**Solution:** Check that `isDemo` prop is true in demo mode. Verify `useHomeMetrics` hook returns `isDemo: true` when not authenticated.

### Issue: Buttons have wrong colors
**Solution:** Verify Tailwind classes use `bg-cyan-700` (not cyan-500). Check `src/lib/utils/contrast.ts` for correct color values.

### Issue: Wallet connection not working
**Solution:** 
1. Check WalletConnect project ID in `.env`
2. Verify `homeWagmi.ts` configuration
3. Check browser console for errors

### Issue: Metrics not loading
**Solution:**
1. Check `/api/home-metrics` endpoint is running
2. Verify authentication token is valid
3. Check browser console for API errors
4. Test with demo mode first

### Issue: Layout breaks on mobile
**Solution:**
1. Check responsive classes (md:, lg:)
2. Verify container max-widths
3. Test with DevTools mobile emulation

---

## Browser Compatibility

### Supported Browsers

**Desktop:**
- [ ] Chrome 90+ ✅
- [ ] Firefox 88+ ✅
- [ ] Safari 14+ ✅
- [ ] Edge 90+ ✅

**Mobile:**
- [ ] iOS Safari 14+ ✅
- [ ] Chrome Android 90+ ✅
- [ ] Samsung Internet 14+ ✅

### Test in Multiple Browsers

```bash
# Use BrowserStack or similar service
# Or test locally with:
# - Chrome
# - Firefox
# - Safari (macOS only)
```

---

## Visual Regression Testing

### Take Screenshots

```bash
# Using Playwright
npx playwright test --update-snapshots
```

### Compare Before/After

1. Take screenshot before changes
2. Make changes
3. Take screenshot after changes
4. Compare visually

---

## User Acceptance Testing

### Test Scenarios

**Scenario 1: New User First Visit**
1. Open page (no wallet)
2. See demo data
3. Explore feature cards
4. Click "Connect Wallet"
5. Connect wallet
6. See real data

**Scenario 2: Returning User**
1. Open page (wallet already connected)
2. See real data immediately
3. Navigate to Guardian
4. Return to home
5. Data persists

**Scenario 3: Error Recovery**
1. Disconnect internet
2. Reload page
3. See cached data
4. Reconnect internet
5. Data refreshes automatically

---

## Checklist for Production

Before deploying to production:

- [ ] All automated tests pass
- [ ] Manual testing complete on all devices
- [ ] Lighthouse scores ≥90
- [ ] Accessibility audit passes
- [ ] No console errors
- [ ] No broken links
- [ ] SEO metadata present
- [ ] Analytics tracking works
- [ ] Error monitoring configured (Sentry)
- [ ] Performance monitoring enabled

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/components/home/__tests__/HeroSection.test.tsx

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Getting Help

If you encounter issues:

1. Check browser console for errors
2. Review test output for failures
3. Check `.kiro/specs/alphawhale-home/` for documentation
4. Review component source code
5. Check contrast ratios with DevTools

---

**Last Updated**: November 29, 2025  
**Status**: All tests passing ✅  
**Ready for**: User acceptance testing
