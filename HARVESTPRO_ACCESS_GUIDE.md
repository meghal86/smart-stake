# HarvestPro Access Guide

## How to View the HarvestPro Dashboard

### Option 1: Direct URL Access
Navigate directly to the HarvestPro dashboard:
```
http://localhost:5173/harvestpro
```
(or your deployed URL + `/harvestpro`)

### Option 2: Footer Navigation
HarvestPro is now included in the footer navigation bar:

1. Look at the bottom of any page in the app
2. Find the **Leaf icon** (🍃) in the footer navigation
3. Click on it to navigate to HarvestPro

**Footer Navigation Order:**
- Home
- Pulse (Activity)
- Guardian (Shield)
- Hunter (Compass)
- **HarvestPro (Leaf)** ← NEW!
- Whale Alert (Waves)
- Portfolio (Briefcase)
- Settings (User)

### What You'll See

When you access HarvestPro, you'll see:

1. **Header** with:
   - AlphaWhale logo and "HarvestPro" title
   - Demo/Live toggle buttons
   - Wallet selector
   - Refresh button
   - AI Digest button

2. **Filter Chips** (horizontally scrollable):
   - All, High Benefit, Short-Term Loss, Long-Term Loss
   - CEX Holdings, Gas Efficient, Illiquid, Safe, High Risk, Favorites

3. **Summary Card** showing:
   - Total Harvestable Loss
   - Estimated Net Benefit
   - Eligible Tokens Count
   - Gas Efficiency Score

4. **Opportunity Cards** (3 mock examples):
   - ETH opportunity (LOW risk, recommended)
   - MATIC opportunity (MEDIUM risk, high-benefit)
   - LINK opportunity (HIGH risk, guardian-flagged)

5. **Demo State Switcher** at the bottom to test different views:
   - Loading state (skeletons)
   - No wallet connected
   - No opportunities detected
   - All opportunities harvested
   - API error state
   - Normal state (default)

### Interactive Features

Try these interactions:

- **Hover over cards** - See smooth animations and glow effects
- **Click filter chips** - Filter changes (visual only for now)
- **Click "Start Harvest"** - Console logs the opportunity ID
- **Click action buttons** - Save, Share, Report (console logs)
- **Use state switcher** - View all empty states and loading states
- **Toggle Demo/Live** - Switch between demo and live modes

### Current Status

✅ **Implemented (Tasks 10 & 11)**:
- Complete dashboard UI
- Header with all controls
- Filter chip row
- Summary card with metrics
- Opportunity cards with all sub-components
- Loading skeletons
- Empty states
- Responsive layout (mobile/tablet/desktop)

🚧 **Coming Next**:
- Task 12: Filtering system with state management
- Task 13: Real API integration
- Task 14: Detail modal
- Task 16: Execution flow

### Development Notes

The dashboard currently uses:
- Mock data for opportunities
- Console logging for button actions
- State switcher for testing different views
- All components are fully functional and styled

### Troubleshooting

If you don't see HarvestPro in the footer:
1. Make sure you've saved all files
2. Refresh your browser
3. Check that the dev server is running (`npm run dev`)
4. Clear browser cache if needed

If the page doesn't load:
1. Check the browser console for errors
2. Verify the route is added in `src/App.tsx`
3. Make sure all imports are correct

### Next Steps

To continue development:
1. Implement Task 12 (Filtering system)
2. Implement Task 13 (API endpoints)
3. Connect real data sources
4. Add detail modal functionality
5. Implement execution flow

---

**Quick Access**: Just click the Leaf icon (🍃) in the footer! 🚀
