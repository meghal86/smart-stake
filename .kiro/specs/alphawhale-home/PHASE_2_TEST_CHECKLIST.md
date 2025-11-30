# Phase 2 Testing Checklist

## Manual Testing Steps

### 1. Home Page Testing

**Navigate to**: `http://localhost:5173/` (or your dev server URL)

#### Footer Navigation
- [ ] Footer shows "Harvest" label (not "HarvestPro")
- [ ] Clicking "Harvest" navigates to `/harvestpro`

#### Feature Cards
- [ ] Guardian card button says "Explore Guardian"
- [ ] Hunter card button says "Explore Hunter"
- [ ] Harvest card button says "Explore Harvest"

#### Feature Card Descriptions
- [ ] Guardian: "Protect against smart contract risks"
- [ ] Hunter: "Find vetted yield opportunities"
- [ ] Harvest: "Reduce tax liability automatically"

---

### 2. Hunter Page Testing

**Navigate to**: `/hunter`

#### Header
- [ ] Title shows "Hunter"
- [ ] Tagline shows: "Discover high-confidence yield opportunities"
- [ ] Tagline is gray text below the title

---

### 3. Harvest Page Testing

**Navigate to**: `/harvestpro`

#### Header
- [ ] Title shows "Harvest" (not "HarvestPro")
- [ ] Tagline shows: "Optimize your tax strategy for maximum savings"
- [ ] Tagline is gray text below the title

#### Empty State (if no wallets connected)
- [ ] Message says "Harvest will analyze..." (not "HarvestPro will analyze...")

---

### 4. Proof Page Testing (if accessible)

**Navigate to**: `/harvestpro/proof/:sessionId`

#### Button
- [ ] Button says "Return to Harvest" (not "Return to HarvestPro")

---

## Quick Grep Test

Run these commands to verify text changes:

```bash
# Check footer label
grep -r "label: 'Harvest'" src/components/layout/FooterNav.tsx

# Check button text
grep -r "Explore" src/components/home/FeatureCard.tsx

# Check taglines
grep -r "Discover high-confidence" src/components/hunter/Header.tsx
grep -r "Optimize your tax strategy" src/components/harvestpro/HarvestProHeader.tsx

# Check descriptions
grep -r "Protect against smart contract risks" src/components/home/GuardianFeatureCard.tsx
grep -r "Find vetted yield opportunities" src/components/home/HunterFeatureCard.tsx
grep -r "Reduce tax liability automatically" src/components/home/HarvestProFeatureCard.tsx
```

---

## Browser DevTools Testing

### 1. Check Button Text
Open DevTools Console and run:
```javascript
// Check feature card buttons
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.includes('Explore')) {
    console.log('✅ Found:', btn.textContent);
  }
});
```

### 2. Check Footer Label
```javascript
// Check footer navigation
const footerLinks = document.querySelectorAll('footer a');
footerLinks.forEach(link => {
  console.log(link.textContent);
});
// Should see: Home, Guardian, Hunter, Harvest, Portfolio
```

---

## Screenshot Comparison

Take screenshots of these screens and compare:

1. **Home Page** - Feature cards section
2. **Hunter Page** - Header with tagline
3. **Harvest Page** - Header with tagline
4. **Footer** - Navigation labels

---

## Expected Results Summary

| Location | Element | Expected Text |
|----------|---------|---------------|
| Footer | Harvest label | "Harvest" |
| Home | Guardian button | "Explore Guardian" |
| Home | Hunter button | "Explore Hunter" |
| Home | Harvest button | "Explore Harvest" |
| Home | Guardian description | "Protect against smart contract risks" |
| Home | Hunter description | "Find vetted yield opportunities" |
| Home | Harvest description | "Reduce tax liability automatically" |
| Hunter | Header tagline | "Discover high-confidence yield opportunities" |
| Harvest | Header tagline | "Optimize your tax strategy for maximum savings" |

---

## Common Issues

### Issue: Changes not showing
**Solution**: 
- Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Restart dev server
- Check if you're on the correct branch

### Issue: Old text still appears
**Solution**:
- Run `npm run build` to rebuild
- Check if there are multiple instances of the component

---

## Pass Criteria

Phase 2 passes if:
- ✅ All 9 text changes are visible
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ All navigation works correctly
- ✅ Responsive design maintained
