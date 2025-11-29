# Quick Access Guide - AlphaWhale Home Page

## 🎯 Access Your New Home Page

### Start the Dev Server
```bash
npm run dev
```

### Navigate to the New Home Page
```
http://localhost:5173/home
```

## 📍 Route Map

| Route | Page | Description |
|-------|------|-------------|
| `/` | AlphaWhale Lite | Original index page |
| **`/home`** | **AlphaWhale Home** | **NEW - Your dashboard** ✨ |
| `/whale-alerts` | Whale Alerts | Old home page (whale transactions) |
| `/signals` | Signals Feed | Advanced signals page |
| `/guardian` | Guardian | Security scanner |
| `/hunter` | Hunter | Whale tracker |
| `/harvestpro` | HarvestPro | Tax loss harvesting |

## ✅ What's on the New Home Page

### 1. Hero Section
- **Headline:** "Master Your DeFi Risk & Yield – In Real Time"
- **Subheading:** "Track whales, scan risks, harvest tax losses"
- **CTA Button:** "Connect Wallet" (demo) or "Start Protecting" (live)

### 2. Feature Cards (3 cards)
- **Guardian** - Security score: 89/100 (demo)
- **Hunter** - Active whales: 1,247 (demo)
- **HarvestPro** - Opportunities: 12 (demo)

Each card has:
- Purple "Demo" badge (when not authenticated)
- Primary action button
- Secondary "Try Demo" button

### 3. Trust Builders
- Platform statistics
- Trust badges
- Social proof

### 4. Onboarding Section
- 3-step guide
- "Get Started" CTA
- "Explore Hunter" secondary CTA

### 5. Footer Navigation
- Links to all features
- Active route highlighting

## 🎨 Visual Improvements (Task 13.2)

### Contrast Fixes Applied
- **Text:** Changed from gray-500 to gray-400
  - Before: 3.95:1 ❌
  - After: 7.51:1 ✅
  
- **Buttons:** Changed from cyan-500 to cyan-700
  - Before: 2.43:1 ❌
  - After: 5.36:1 ✅

All elements now meet WCAG AA standards (4.5:1 minimum).

## 🔄 Demo vs Live Mode

### Demo Mode (Default)
- No wallet connection required
- Instant loading
- Purple "Demo" badges visible
- Hardcoded metrics
- No API calls

### Live Mode (After Wallet Connection)
1. Click "Connect Wallet"
2. Select wallet (MetaMask, WalletConnect, etc.)
3. Demo badges disappear
4. Real metrics load from API
5. Smooth transition animation

## 🧪 Testing Checklist

### Visual Testing
- [ ] Hero section displays correctly
- [ ] All 3 feature cards render
- [ ] Demo badges are visible
- [ ] Trust builders section shows stats
- [ ] Onboarding section displays
- [ ] Footer navigation works

### Interaction Testing
- [ ] "Connect Wallet" button works
- [ ] Feature card buttons navigate correctly
- [ ] "Try Demo" buttons work
- [ ] Footer links navigate
- [ ] Hover animations work smoothly

### Responsive Testing
- [ ] Mobile (≤375px) - Cards stack vertically
- [ ] Tablet (768px) - 2 columns
- [ ] Desktop (1024px+) - 3 columns
- [ ] All text remains readable

### Accessibility Testing
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Contrast ratios pass (use browser DevTools)
- [ ] Screen reader compatible

## 🐛 Troubleshooting

### Issue: Page shows whale transactions instead of new home
**Solution:** You're on `/whale-alerts` instead of `/home`
- Navigate to: `http://localhost:5173/home`

### Issue: Components not loading
**Solution:** Check browser console for errors
- Open DevTools (F12)
- Check Console tab
- Look for import errors

### Issue: Demo badges not showing
**Solution:** This is expected if wallet is connected
- Disconnect wallet to see demo mode
- Or check in incognito window

### Issue: Contrast looks wrong
**Solution:** Clear browser cache
```bash
# Hard refresh
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows/Linux)
```

## 📚 Related Documentation

- **Testing Guide:** `.kiro/specs/alphawhale-home/TESTING_GUIDE.md`
- **Contrast Fixes:** `.kiro/specs/alphawhale-home/CONTRAST_FIXES_SUMMARY.md`
- **Task Completion:** `.kiro/specs/alphawhale-home/TASK_13.2_COMPLETION.md`
- **Routing Fix:** `.kiro/specs/alphawhale-home/ROUTING_FIX_COMPLETE.md`

## 🎉 Success Criteria

You'll know it's working when you see:
1. ✅ Hero section with gradient background
2. ✅ Three feature cards with purple "Demo" badges
3. ✅ Trust builders with platform stats
4. ✅ Onboarding section with 3 steps
5. ✅ Footer navigation with 4 icons
6. ✅ All text is easily readable (good contrast)
7. ✅ Smooth hover animations on cards

## 🚀 Next Steps

1. **Test the page** at `http://localhost:5173/home`
2. **Connect a wallet** to see live mode
3. **Navigate to features** using the cards
4. **Test on mobile** by resizing browser
5. **Share feedback** if anything looks off

---

**Quick Link:** [http://localhost:5173/home](http://localhost:5173/home)
