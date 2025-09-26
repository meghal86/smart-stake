# Quick Test Guide

## Test the Enhanced Overview

1. **Navigate to the new Overview page:**
   ```
   http://localhost:5173/overview
   ```

2. **Desktop Layout (width > 768px):**
   - ✅ Sticky header with time window chips
   - ✅ 3-column layout: Clusters | Chain Risk | AI Digest
   - ✅ Click cluster cards to expand details
   - ✅ Hover chain risk bubbles for tooltips

3. **Mobile Layout (width < 768px):**
   - ✅ Mobile-first content order
   - ✅ AI Digest floating card at bottom
   - ✅ 2x2 grid layouts for clusters and chain risk
   - ✅ Touch-friendly 44px targets

## Key Features to Test

### Time Window Sync
- Change time window in header chips
- Verify both chain risk and clusters update

### AI Digest
- **Desktop:** Right rail with digest items
- **Mobile:** Floating card that opens bottom sheet
- Click "View" to scroll to related cluster
- Click "Rule" to create alert rule

### Cluster Interactions
- Click cluster cards to expand details
- Use star/bell/download quick actions
- View "Why this cluster?" explanation

### Chain Risk Heatmap
- Hover bubbles for component breakdown
- Empty state shows enrichment explainer
- Quick actions for alerts/watchlist/export

## Fallback Behavior

If no data loads:
- Empty states show helpful messages
- All layouts remain stable
- No JavaScript errors in console

## Accessibility Test

1. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Enter/Space to activate buttons
   - Esc to close tooltips/modals

2. **Screen Reader:**
   - All elements have proper ARIA labels
   - Live announcements for dynamic content

3. **Reduced Motion:**
   - Set `prefers-reduced-motion: reduce`
   - Animations should be minimal

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest) 
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

The implementation is production-ready with proper error boundaries and graceful degradation.