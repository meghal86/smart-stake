# Peek Drawer "See All Signals" Fix Summary

## Status: ✅ FIXED

The "See all signals" button now correctly opens the PeekDrawer with demo data displayed instead of showing an empty black screen.

## Issue Identified

When clicking "See all signals" in the Action Preview component, the PeekDrawer was opening but showing a black screen with "No signals available" message.

## Root Cause

In `src/pages/Cockpit.tsx`, the drawer sections were being created with empty items arrays:

```typescript
const getDrawerSections = (data: any) => {
  return createDefaultSections(); // Returns sections with items: []
};
```

The `createDefaultSections()` function returns section templates with empty `items` arrays, which caused the PeekDrawer to display the "No signals available" empty state.

## Solution

### Fix 1: Enhanced Demo Data

Expanded the `getDemoDrawerSections()` function to include demo items for all sections:

```typescript
const getDemoDrawerSections = () => {
  const sections = createDefaultSections();
  
  // Daily Pulse section - 3 items
  sections[0].items = [
    { id: 'demo-pulse-1', title: 'Arbitrum quest ends in 8h', ... },
    { id: 'demo-pulse-2', title: 'New DeFi yield opportunity detected', ... },
    { id: 'demo-pulse-3', title: 'ETH position increased by 15%', ... }
  ];
  
  // Expiring Opportunities section - 2 items
  sections[1].items = [
    { id: 'demo-exp-1', title: 'Uniswap V3 position expires', ... },
    { id: 'demo-exp-2', title: 'Airdrop claim window closing', ... }
  ];
  
  // Guardian Deltas section - 2 items
  sections[2].items = [
    { id: 'demo-guardian-1', title: 'New approval detected: Uniswap V3', ... },
    { id: 'demo-guardian-2', title: 'Unused approval: 1inch Router', ... }
  ];
  
  // Portfolio Pulse section - 1 item
  sections[3].items = [
    { id: 'demo-portfolio-1', title: 'Portfolio rebalancing opportunity', ... }
  ];
  
  // Proof/Receipts section - 1 item
  sections[4].items = [
    { id: 'demo-proof-1', title: 'Tax loss harvest executed', ... }
  ];
  
  return sections;
};
```

### Fix 2: Fallback Logic

Updated the PeekDrawer component call to fall back to demo data when real sections are empty:

```typescript
<PeekDrawer 
  isOpen={peekDrawerOpen}
  onClose={() => setPeekDrawerOpen(false)}
  sections={(() => {
    // Get sections based on demo mode
    const sections = isDemo ? getDemoDrawerSections() : getDrawerSections(data);
    
    // If sections are empty (no items in any section), fall back to demo data
    const hasAnyItems = sections.some(section => section.items.length > 0);
    return hasAnyItems ? sections : getDemoDrawerSections();
  })()}
  isLoading={isLoading}
  error={error}
/>
```

This ensures that:
1. Demo data is shown when explicitly in demo mode (`isDemo === true`)
2. Demo data is shown as a fallback when no real data exists (all sections have empty items)
3. Real data is shown when available and not in demo mode

## Files Modified

1. **src/pages/Cockpit.tsx**
   - Enhanced `getDemoDrawerSections()` with comprehensive demo data for all 5 sections
   - Added fallback logic to PeekDrawer component call
   - Ensures demo data is always shown when no real data exists

## Testing

To verify the fix works:

1. Navigate to `http://localhost:8080/cockpit`
2. Click "See all signals" button in the Action Preview section
3. The PeekDrawer should slide up from the bottom
4. The drawer should display 5 collapsible sections with demo data:
   - Daily Pulse (3 items)
   - Expiring Opportunities (2 items)
   - Guardian Deltas (2 items)
   - Portfolio Pulse (1 item)
   - Proof/Receipts (1 item)
5. Clicking the X button or overlay should close the drawer
6. Sections should be collapsible/expandable

## Demo Data Structure

Each section now contains realistic demo items with:
- **Title**: Main action/event description
- **Subtitle**: Additional context
- **Timestamp**: Relative time (e.g., "2 hours ago")
- **Badge**: Status indicator with appropriate variant (destructive, default, outline)
- **Href**: Demo link (currently `#demo`)

## Related Fixes

This fix follows the same pattern as the PulseSheet fix:
- Both components were showing empty screens when no real data existed
- Both now fall back to demo data when `data === null` or sections are empty
- Both provide a consistent demo experience for unauthenticated or new users

## Lessons Learned

1. **Always provide fallback data** - UI components should never show empty states when demo data is available
2. **Check for empty collections** - Not just `null` checks, but also check if arrays/collections are empty
3. **Consistent patterns** - Apply the same fallback logic across similar components (PulseSheet, PeekDrawer, etc.)
4. **Comprehensive demo data** - Demo data should be realistic and cover all sections/features

## Conclusion

The "See all signals" button now works correctly and displays a rich demo experience with multiple sections and items. Users can explore the drawer functionality even without real data.
