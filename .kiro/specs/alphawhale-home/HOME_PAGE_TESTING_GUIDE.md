# AlphaWhale Home Page Testing Guide

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The app should start at `http://localhost:5173` (or the port shown in your terminal).

### 2. Navigate to Home Page

Open your browser and go to:
```
http://localhost:5173/
```

---

## What to Test

### Visual Inspection

#### 1. Hero Section
**What to look for:**
- ✅ Headline: "Master Your DeFi Risk & Yield – In Real Time"
- ✅ Subheading: "Secure your wallet. Hunt alpha. Harvest taxes."
- ✅ Animated background (subtle geometric shapes)
- ✅ **CTA button is darker cyan** (cyan-700, not bright cyan-500)
- ✅ Button text is clearly readable (white on dark cyan)

**Test:**
- Hover over the CTA button - should lighten slightly
- Click the button - should open wallet connection modal (demo mode)

#### 2. Feature Cards
**What to look for:**
- ✅ Three cards: Guardian, Hunter, HarvestPro
- ✅ Each card shows demo metrics with "Demo" badge
- ✅ **Labels are lighter gray** (gray-400, not dark gray-500)
- ✅ **Primary buttons are darker cyan** (cyan-700)
- ✅ All text is clearly readable

**Test:**
- Hover over each card - should scale up slightly (1.02x)
- Click "View Guardian" button - should navigate to /guardian
- Click "Demo" button - should show demo

#### 3. Trust Builders Section
**What to look for:**
- ✅ Four trust badges (Non-custodial, No KYC, On-chain, Guardian-vetted)
- ✅ Platform statistics (wallets protected, yield optimized, avg score)
- ✅ **Statistics in cyan-400** (bright, readable cyan)
- ✅ All text clearly readable

#### 4. Onboarding Section
**What to look for:**
- ✅ Three numbered steps
- ✅ **"Start Onboarding" button is darker cyan** (cyan-700)
- ✅ "Skip" button has outline style
- ✅ All text clearly readable

**Test:**
- Click "Start Onboarding" - should navigate to /onboarding
- Click "Skip" - should navigate to /hunter

#### 5. Footer Navigation
**What to look for:**
- ✅ Four icons: Guardian, Hunter, HarvestPro, Settings
- ✅ Home icon highlighted in cyan
- ✅ Fixed at bottom on mobile

---

## Contrast Testing

### Manual Contrast Check

#### Method 1: Browser DevTools (Chrome)
1. Open DevTools (F12)
2. Select any text element
3. Go to "Accessibility" pane
4. Look for "Contrast" section
5. Should show ✅ green checkmark with ratio

#### Method 2: Browser DevTools (Firefox)
1. Open DevTools (F12)
2. Select any text element
3. Go to "Accessibility" tab
4. Check contrast ratio
5. Should show "AA" or "AAA" badge

#### Method 3: axe DevTools Extension
1. Install [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
2. Open extension
3. Click "Scan ALL of my page"
4. Check "Color Contrast" section
5. Should show **0 issues**

### Automated Contrast Tests

Run the contrast test suite:
```bash
npm test -- src/lib/utils/__tests__/contrast.test.ts --run
```

Expected output:
```
✅ White text on slate-950: 19.07:1 (AAA)
✅ Gray-400 text on slate-950: 7.51:1 (AAA)
✅ Cyan-400 text/icons on slate-950: 10.55:1 (AAA)
✅ White text on cyan-700 button: 5.36:1 (AA)
```

---

## Responsive Testing

### Desktop (≥1024px)
```bash
# Resize browser to 1920x1080
```
**What to check:**
- ✅ Feature cards in 3-column row
- ✅ Hero section 2-column layout
- ✅ Onboarding steps in horizontal row
- ✅ Footer nav horizontal

### Tablet (768px - 1023px)
```bash
# Resize browser to 768x1024
```
**What to check:**
- ✅ Feature cards in 2-column grid or stacked
- ✅ Hero section stacked
- ✅ Onboarding steps in row or stacked
- ✅ Footer nav horizontal

### Mobile (≤767px)
```bash
# Resize browser to 375x667 (iPhone SE)
```
**What to check:**
- ✅ Feature cards stacked vertically
- ✅ Hero section stacked
- ✅ Onboarding steps stacked vertically
- ✅ Footer nav fixed at bottom
- ✅ All buttons ≥44px height (touch targets)

---

## Keyboard Navigation Testing

### Test Flow
1. Press `Tab` key repeatedly
2. Should focus elements in logical order:
   - Hero CTA button
   - Guardian card primary button
   - Guardian card demo button
   - Hunter card primary button
   - Hunter card demo button
   - HarvestPro card primary button
   - HarvestPro card demo button
   - Start Onboarding button
   - Skip button
   - Footer nav icons (4)

### What to Check
- ✅ Focus indicator visible (cyan ring)
- ✅ Focus order logical (top to bottom, left to right)
- ✅ Press `Enter` or `Space` to activate buttons
- ✅ No keyboard traps

---

## Demo Mode vs Live Mode Testing

### Demo Mode (Default - Not Authenticated)
**What to see:**
- ✅ "Demo" badges on all feature cards
- ✅ Sample metrics (Guardian Score: 89, etc.)
- ✅ "Connect Wallet" button in hero
- ✅ Data loads instantly (< 200ms)

**Test:**
```bash
# Open browser in incognito mode
# Navigate to http://localhost:5173/
# Should see demo mode immediately
```

### Live Mode (After Wallet Connection)
**What to see:**
- ✅ No "Demo" badges
- ✅ Real user metrics
- ✅ "Start Protecting" button in hero
- ✅ Data loads from API

**Test:**
```bash
# Click "Connect Wallet"
# Connect MetaMask or other wallet
# Sign message
# Should transition to live mode
```

---

## Accessibility Testing

### Screen Reader Testing

#### macOS VoiceOver
```bash
# Enable: Cmd + F5
# Navigate: Ctrl + Option + Arrow keys
```

**What to check:**
- ✅ All images have alt text
- ✅ All buttons have descriptive labels
- ✅ Headings in logical order (h1, h2, h3)
- ✅ Landmarks announced (navigation, main, region)

#### NVDA (Windows)
```bash
# Download from https://www.nvaccess.org/
# Start: Ctrl + Alt + N
# Navigate: Arrow keys
```

### Color Blindness Testing

Use browser extensions:
- [Colorblindly](https://chrome.google.com/webstore/detail/colorblindly/floniaahmccleoclneebhhmnjgdfijgg)
- Test with: Protanopia, Deuteranopia, Tritanopia

**What to check:**
- ✅ Information not conveyed by color alone
- ✅ Buttons still distinguishable
- ✅ Text still readable

---

## Performance Testing

### Lighthouse Audit
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" and "Accessibility"
4. Click "Analyze page load"

**Target Scores:**
- ✅ Performance: ≥90
- ✅ Accessibility: ≥90
- ✅ Best Practices: ≥90

### Core Web Vitals
**Targets:**
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ FID (First Input Delay): < 100ms
- ✅ CLS (Cumulative Layout Shift): < 0.1

---

## Component Testing

### Run All Component Tests
```bash
npm test -- src/components/home/__tests__ --run
```

Expected: ✅ 175/175 tests passing

### Run Specific Component Tests
```bash
# Hero Section
npm test -- src/components/home/__tests__/HeroSection.test.tsx --run

# Feature Cards
npm test -- src/components/home/__tests__/FeatureCard.test.tsx --run

# Trust Builders
npm test -- src/components/home/__tests__/TrustBuilders.test.tsx --run

# Onboarding Section
npm test -- src/components/home/__tests__/OnboardingSection.test.tsx --run

# Footer Nav
npm test -- src/components/home/__tests__/FooterNav.test.tsx --run
```

---

## Integration Testing

### Test User Journeys

#### Journey 1: New User (Demo Mode)
1. ✅ Land on home page
2. ✅ See demo metrics immediately
3. ✅ Click "Connect Wallet"
4. ✅ Connect wallet and sign
5. ✅ See live metrics
6. ✅ Click "View Guardian"
7. ✅ Navigate to Guardian page

#### Journey 2: Returning User
1. ✅ Land on home page
2. ✅ Already authenticated (JWT cookie)
3. ✅ See live metrics immediately
4. ✅ Click "Start Protecting"
5. ✅ Navigate to Guardian page

#### Journey 3: Onboarding Flow
1. ✅ Land on home page
2. ✅ Scroll to onboarding section
3. ✅ Click "Start Onboarding"
4. ✅ Navigate to /onboarding
5. ✅ Complete onboarding steps

---

## Error Scenarios Testing

### Test API Failures
```bash
# Simulate API failure
# 1. Disconnect internet
# 2. Reload page
# 3. Should show cached data or fallback values
```

**What to check:**
- ✅ No broken layout
- ✅ Fallback values displayed
- ✅ Error message shown (if applicable)
- ✅ Retry button available

### Test Slow Network
```bash
# Chrome DevTools > Network tab > Throttling > Slow 3G
```

**What to check:**
- ✅ Skeleton loaders show
- ✅ Content loads progressively
- ✅ No layout shift

---

## Visual Regression Testing

### Before/After Comparison

#### Old Colors (FAILED WCAG AA)
- ❌ Gray-500 text: 3.95:1 ratio
- ❌ Cyan-500 buttons: 2.43:1 ratio

#### New Colors (PASSES WCAG AA)
- ✅ Gray-400 text: 7.51:1 ratio
- ✅ Cyan-700 buttons: 5.36:1 ratio

### Side-by-Side Test
1. Take screenshot of current page
2. Compare with design mockups
3. Verify colors match specification

---

## Browser Compatibility Testing

### Test in Multiple Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### What to Check
- ✅ Layout consistent
- ✅ Colors render correctly
- ✅ Animations work
- ✅ Buttons clickable
- ✅ Navigation works

---

## Mobile Device Testing

### iOS Safari
```bash
# Test on iPhone SE, iPhone 12, iPhone 14 Pro
```

### Android Chrome
```bash
# Test on Pixel 5, Samsung Galaxy S21
```

### What to Check
- ✅ Touch targets ≥44px
- ✅ Footer nav fixed at bottom
- ✅ Buttons easy to tap
- ✅ Text readable without zoom
- ✅ No horizontal scroll

---

## Checklist: Before Marking Complete

### Visual
- [ ] All text clearly readable
- [ ] Buttons darker cyan (cyan-700)
- [ ] Labels lighter gray (gray-400)
- [ ] No bright cyan-500 buttons
- [ ] Animations smooth
- [ ] Layout responsive

### Functional
- [ ] All buttons clickable
- [ ] Navigation works
- [ ] Demo mode shows sample data
- [ ] Wallet connection works
- [ ] Live mode shows real data

### Accessibility
- [ ] Contrast ratios pass (run tests)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] Touch targets ≥44px

### Performance
- [ ] Page loads < 3s
- [ ] No layout shift
- [ ] Animations respect prefers-reduced-motion
- [ ] Lighthouse score ≥90

### Testing
- [ ] All unit tests pass (175/175)
- [ ] All contrast tests pass (22/22)
- [ ] No console errors
- [ ] No console warnings

---

## Troubleshooting

### Issue: Buttons still bright cyan
**Solution**: Clear browser cache and hard reload (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Text still dark gray
**Solution**: Verify you're on the latest code, run `git pull` and restart dev server

### Issue: Tests failing
**Solution**: Run `npm install` to ensure dependencies are up to date

### Issue: Page not loading
**Solution**: Check console for errors, verify API endpoints are accessible

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Run all tests
npm test

# Run contrast tests only
npm test -- contrast.test.ts --run

# Run component tests only
npm test -- src/components/home/__tests__ --run

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Need Help?

### Documentation
- [CONTRAST_FIXES_SUMMARY.md](.kiro/specs/alphawhale-home/CONTRAST_FIXES_SUMMARY.md)
- [CONTRAST_VISUAL_GUIDE.md](.kiro/specs/alphawhale-home/CONTRAST_VISUAL_GUIDE.md)
- [TASK_13.2_COMPLETION.md](.kiro/specs/alphawhale-home/TASK_13.2_COMPLETION.md)

### Common Questions
**Q: Why are buttons darker now?**  
A: To meet WCAG AA accessibility standards (5.36:1 contrast ratio)

**Q: Why is text lighter gray?**  
A: Gray-400 has 7.51:1 contrast ratio (exceeds WCAG AAA)

**Q: Will this affect other pages?**  
A: No, changes are isolated to Home page components

---

**Happy Testing! 🎉**

All contrast ratios now meet WCAG AA standards, making the AlphaWhale Home page accessible to all users.
