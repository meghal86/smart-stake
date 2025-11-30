# Unified FooterNav Component Guide

## Overview

The `FooterNav` component provides consistent navigation across all major AlphaWhale features. It displays 4 core sections with active state highlighting and full accessibility support.

## Features Included

1. **Guardian** - Security scanning and risk analysis
2. **Hunter** - Opportunity discovery and signals
3. **HarvestPro** - Tax-loss harvesting optimization
4. **Portfolio** - Portfolio tracking and analytics

## Usage

### Basic Implementation

```tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const MyFeaturePage = () => {
  return (
    <div className="min-h-screen pb-[72px]">
      {/* Your page content */}
      <main>
        {/* Content here */}
      </main>
      
      {/* Footer navigation */}
      <FooterNav />
    </div>
  );
};
```

### Important: Add Bottom Padding

Since the footer is fixed at the bottom, add `pb-[72px]` to your page container to prevent content from being hidden behind the footer:

```tsx
<div className="min-h-screen pb-[72px]">
  {/* Content */}
</div>
```

## Route Configuration

The footer automatically highlights the active route based on the current pathname:

| Feature | Route | Icon |
|---------|-------|------|
| Guardian | `/guardian` | Shield |
| Hunter | `/hunter` | Compass |
| HarvestPro | `/harvest` | Leaf |
| Portfolio | `/portfolio` | Briefcase |

### Active State Detection

The footer uses smart route matching:
- Exact match: `/guardian` → Guardian active
- Prefix match: `/guardian/scan` → Guardian active
- Prefix match: `/harvest/opportunities` → HarvestPro active

## Styling

### Design System

- **Background**: Glassmorphism with backdrop blur
- **Active State**: Gradient from cyan (#00C9A7) to purple (#7B61FF)
- **Inactive State**: Gray with hover effect
- **Border**: Subtle top border with shadow
- **Height**: Fixed 72px

### Dark Mode Support

The footer automatically adapts to dark mode:
- Light mode: `bg-[rgba(255,255,255,0.7)]`
- Dark mode: `bg-[rgba(16,18,30,0.8)]`

## Accessibility

### WCAG Compliance

✅ **Touch Targets**: All buttons are ≥44px (meets WCAG 2.1 Level AAA)
✅ **ARIA Labels**: Every link has descriptive aria-label
✅ **Keyboard Navigation**: Full keyboard support with visible focus indicators
✅ **Screen Readers**: Proper semantic HTML with navigation role
✅ **Active State**: Uses `aria-current="page"` for active route

### Keyboard Navigation

- **Tab**: Navigate between footer items
- **Enter**: Activate selected item
- **Shift + Tab**: Navigate backwards

### Focus Indicators

Visible cyan ring appears on focus:
```css
focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
```

## Testing

### Unit Tests

Run the test suite:
```bash
npm test src/components/layout/__tests__/FooterNav.test.tsx
```

### Test Coverage

- ✅ Renders all 4 navigation items
- ✅ Active state highlighting
- ✅ ARIA labels and roles
- ✅ Touch target sizes
- ✅ Focus indicators
- ✅ Correct href attributes
- ✅ Glassmorphism styling
- ✅ Responsive layout

## Examples

### Guardian Page

```tsx
// src/pages/Guardian.tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const Guardian = () => {
  return (
    <div className="min-h-screen pb-[72px] bg-slate-950">
      <header>
        <h1>Guardian Security Scanner</h1>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Guardian content */}
      </main>
      
      <FooterNav />
    </div>
  );
};
```

### Hunter Page

```tsx
// src/pages/Hunter.tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const Hunter = () => {
  return (
    <div className="min-h-screen pb-[72px] bg-slate-950">
      <header>
        <h1>Hunter Opportunities</h1>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Hunter content */}
      </main>
      
      <FooterNav />
    </div>
  );
};
```

### HarvestPro Page

```tsx
// src/pages/HarvestPro.tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const HarvestPro = () => {
  return (
    <div className="min-h-screen pb-[72px] bg-slate-950">
      <header>
        <h1>HarvestPro Tax Optimization</h1>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* HarvestPro content */}
      </main>
      
      <FooterNav />
    </div>
  );
};
```

### Portfolio Page

```tsx
// src/pages/Portfolio.tsx
import { FooterNav } from '@/components/layout/FooterNav';

export const Portfolio = () => {
  return (
    <div className="min-h-screen pb-[72px] bg-slate-950">
      <header>
        <h1>Portfolio Tracker</h1>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Portfolio content */}
      </main>
      
      <FooterNav />
    </div>
  );
};
```

## Mobile Optimization

The footer is optimized for mobile devices:

- **Fixed Positioning**: Always visible at bottom
- **Touch-Friendly**: Large touch targets (44px minimum)
- **Responsive Icons**: Scale appropriately on all screen sizes
- **Smooth Transitions**: 200ms duration for all state changes

## Performance

- **Zero Re-renders**: Uses React Router's `useLocation` hook efficiently
- **Lightweight**: Only 4 navigation items
- **CSS Transitions**: Hardware-accelerated animations
- **No External Dependencies**: Uses only Lucide React icons

## Troubleshooting

### Footer Not Showing

Ensure your page has the footer imported:
```tsx
import { FooterNav } from '@/components/layout/FooterNav';
```

### Content Hidden Behind Footer

Add bottom padding to your page container:
```tsx
<div className="pb-[72px]">
```

### Active State Not Working

Check that your route matches one of the configured paths:
- `/guardian`
- `/hunter`
- `/harvest`
- `/portfolio`

### Dark Mode Issues

Ensure your app has dark mode configured in Tailwind:
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
};
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Add badge notifications (e.g., new opportunities)
- [ ] Add haptic feedback on mobile
- [ ] Add animation on route change
- [ ] Add settings/profile quick access
- [ ] Add keyboard shortcuts (e.g., Cmd+1 for Guardian)

## Support

For issues or questions:
1. Check this guide first
2. Review the test file for usage examples
3. Check the component source code
4. Contact the AlphaWhale development team

---

**Last Updated**: 2025-01-30
**Component Version**: 1.0.0
**Maintained By**: AlphaWhale Team
