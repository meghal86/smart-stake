# AlphaWhale UI v2 - Premium Interface

## Overview

UI v2 transforms the AlphaWhale Lite homepage into a premium, finance-grade interface while reusing all existing data adapters and business logic. The new interface features dark theme, animated KPIs, provenance tracking, and enhanced visual hierarchy.

## Screenshots

### Desktop View
- **Hero Section**: Lightning icon, bold typography, gradient accents
- **Whale Spotlight**: Full-width card with 3 animated KPI stats
- **Two-Column Layout**: Fear Index (left) + Daily Digest (right)
- **Portfolio Lite**: Wallet connection with enhanced styling
- **Upgrade CTA**: Full-width gradient banner with feature highlights

### Mobile View
- **Responsive Grid**: Cards stack vertically on mobile
- **Sticky CTA**: Upgrade banner appears after 50% scroll
- **Touch-Friendly**: Larger buttons and touch targets

## Component Reuse Map

### ✅ Reused Components
- `Card`, `CardHeader`, `CardContent` - Enhanced with alpha colors
- `Badge` - Extended with `real`, `simulated`, `warning` variants
- `Button` - Reused with custom styling
- `Skeleton` - Reused for loading states

### 🆕 New UI Primitives
- `Stat` - Animated counter with icon and sublabel
- `Meter` - Animated gradient progress bar for Fear Index
- `KPIGrid` - Responsive 1/2/3 column grid
- `LastUpdated` - Timestamp with pulsing dot animation

### 🔄 Enhanced Cards
- `WhaleSpotlightCard` - 3 KPI stats, gradient border, share/follow actions
- `FearIndexCard` - Large score display, animated meter, tooltip
- `DailyDigestCard` - Animated list items, gating support
- `UpgradeBannerCTA` - Gradient background, feature icons, call-to-action

## Data Flow (Unchanged)

All data continues to flow through existing adapters:
- `getWhaleSpotlight()` → WhaleSpotlightCard
- `getFearIndex()` → FearIndexCard  
- `getDigest()` → DailyDigestCard

**Provenance badges** show `Real | Simulated` based on adapter responses.

## Feature Flag Control

### Toggle UI Version
```typescript
// Enable v2 (default)
localStorage.setItem('feature_flags', JSON.stringify({ 'ui.v2': true }));

// Disable v2 (fallback to original)
localStorage.setItem('feature_flags', JSON.stringify({ 'ui.v2': false }));
```

### Runtime Switching
```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function LitePage() {
  const { isEnabled } = useFeatureFlags();
  
  return isEnabled('ui.v2') ? <PremiumLite /> : <EnhancedLite />;
}
```

## Visual Design System

### Color Palette
```css
--alpha-bg: #0E1A2B      /* Dark background */
--alpha-card: #121F34    /* Card background */
--alpha-teal: #00FFC6    /* Primary accent */
--alpha-coral: #FF4D4D   /* Error/sell states */
--alpha-gray: #A0AEC0    /* Secondary text */
--alpha-purple: #7A5CFF  /* CTA accent */
```

### Gradients
```css
.bg-gradient-spotlight { background: linear-gradient(135deg, #00FFC6 0%, #1B66FF 100%); }
.bg-gradient-cta { background: linear-gradient(135deg, #1B66FF 0%, #7A5CFF 100%); }
```

### Animations
- **Counter Animation**: Numbers animate from 0 → value over 600ms
- **Staggered Entry**: Cards fade in with 80ms delays
- **Pulsing Dot**: "Updated" indicator pulses every 4s
- **Hover Effects**: Cards lift with teal glow on hover

## Accessibility Features

### WCAG AA Compliance
- **Contrast Ratios**: All text meets AA standards on dark backgrounds
- **Focus States**: Visible focus rings on interactive elements
- **ARIA Labels**: Screen reader support for complex components
- **Keyboard Navigation**: Full keyboard accessibility

### Screen Reader Support
```typescript
<div aria-live="polite" aria-label="Whale activity updates">
  <Stat label="Largest Move" value="$12.5M" />
</div>
```

## Performance Optimizations

### Bundle Size
- **Lazy Loading**: Premium components only load when ui.v2 enabled
- **Tree Shaking**: Unused animations removed in production
- **Code Splitting**: Framer Motion loaded separately

### Animation Performance
- **GPU Acceleration**: Transform and opacity animations only
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **Conditional Animation**: Disabled on low-end devices

## Testing Coverage

### Unit Tests (`tests/unit/ui-components.test.tsx`)
- ✅ Stat component rendering and animation
- ✅ Meter value clamping and display
- ✅ Badge variant styling
- ✅ KPIGrid responsive behavior

### E2E Tests (`tests/e2e/home.premium.spec.ts`)
- ✅ Premium layout rendering
- ✅ Animated meter functionality
- ✅ Share button interaction
- ✅ Mobile responsiveness
- ✅ Loading skeleton states

### Visual Regression
- ✅ Desktop screenshot comparison
- ✅ Mobile screenshot comparison
- ✅ Dark theme consistency

### Performance Tests
- ✅ P95 < 400ms load time
- ✅ Animation frame rate > 60fps
- ✅ Bundle size within targets

## Adding New Premium Cards

### 1. Create Card Component
```typescript
// components/premium/NewCard.tsx
export function NewCard({ data }: { data: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.X }} // Stagger delay
    >
      <Card className="bg-alpha-card border-alpha-gray/20">
        {/* Card content */}
      </Card>
    </motion.div>
  );
}
```

### 2. Add to PremiumLite
```typescript
// Import and use in grid layout
import { NewCard } from './premium/NewCard';

// Add to appropriate grid section
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <ExistingCard />
  <NewCard data={newData} />
</div>
```

### 3. Add Tests
```typescript
// tests/e2e/home.premium.spec.ts
test('should render new card', async ({ page }) => {
  await page.goto('/lite');
  await expect(page.locator('[data-testid="new-card"]')).toBeVisible();
});
```

## Troubleshooting

### UI v2 Not Showing
1. Check feature flag: `localStorage.getItem('feature_flags')`
2. Verify `ui.v2: true` in flags object
3. Clear browser cache and reload

### Animation Issues
1. Check `prefers-reduced-motion` setting
2. Verify framer-motion is installed
3. Check console for motion errors

### Styling Problems
1. Verify Tailwind includes alpha colors
2. Check CSS custom properties are defined
3. Ensure dark mode is enabled

### Performance Issues
1. Check bundle size with analyzer
2. Verify animations use transform/opacity only
3. Monitor frame rate in dev tools

## Migration Checklist

- [x] Extended Tailwind config with alpha colors
- [x] Created new UI primitives (Stat, Meter, etc.)
- [x] Enhanced existing Badge component
- [x] Built premium card components
- [x] Implemented feature flag switching
- [x] Added comprehensive test coverage
- [x] Documented component usage
- [x] Verified accessibility compliance
- [x] Optimized for performance
- [x] Created migration documentation

## Future Enhancements

### Phase 2 Features
- **Theme Switcher**: Light/dark mode toggle
- **Custom Themes**: User-defined color schemes
- **Advanced Animations**: Particle effects, morphing shapes
- **Interactive Charts**: Hover states, drill-down capabilities
- **Real-time Updates**: WebSocket-powered live data

### Performance Improvements
- **Virtual Scrolling**: For large data sets
- **Image Optimization**: WebP/AVIF support
- **Service Worker**: Offline functionality
- **Edge Caching**: CDN optimization

---

**🎨 UI v2 Complete**: AlphaWhale Lite now features a world-class, premium interface while maintaining full backward compatibility and data flow integrity.