# AlphaWhale Home Page Development Standards

## Overview

This steering document defines development standards, patterns, and best practices specific to the AlphaWhale Home page. Follow these guidelines to ensure consistency, maintainability, and quality.

## Pre-Implementation Setup Checklist

Before starting Home page development, ensure these are ready:

### Backend Requirements (Must be Ready)
- [ ] Supabase project configured with authentication
- [ ] `/api/home-metrics` endpoint implemented and tested
- [ ] `/api/auth/verify` endpoint for signature verification
- [ ] `/api/auth/me` endpoint for session validation
- [ ] Database schema for metrics aggregation
- [ ] Rate limiting configured on API routes
- [ ] Error logging (Sentry) configured

### Environment Setup (Must be Configured)
- [ ] `.env.local` file with all required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SENTRY_DSN=
```
- [ ] WalletConnect v2 project created
- [ ] Sentry project created for error tracking

### Dependencies (Must be Installed)
- [ ] React 18+
- [ ] Next.js 14+ (App Router)
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] React Query (@tanstack/react-query)
- [ ] Framer Motion
- [ ] Lucide React (icons)
- [ ] wagmi + @web3modal/wagmi (wallet connection)
- [ ] zod (validation)
- [ ] axios or fetch wrapper
- [ ] @sentry/nextjs (error tracking)

### Development Tools
- [ ] ESLint configured with accessibility rules
```bash
npm install eslint-plugin-jsx-a11y
```
- [ ] Prettier for code formatting
- [ ] Vitest for unit tests
- [ ] Playwright for E2E tests
- [ ] axe DevTools for accessibility testing

### Monorepo Structure (If Applicable)
- [ ] Shared types in `/packages/types`
- [ ] Shared hooks in `/packages/hooks`
- [ ] Shared constants in `/packages/constants`
- [ ] Shared contexts in `/packages/contexts`

### Documentation Ready
- [ ] API documentation with examples
- [ ] Design system documentation (colors, spacing, fonts)
- [ ] Component storybook (optional but recommended)
- [ ] Demo/sample data documented

**If ANY of these are missing, development will be blocked.**

## Architecture Principles

### UI is Presentation Only

**NEVER write business logic in React components.**

**UI Responsibilities (ALLOWED)**:
- Fetch data via hooks (useHomeMetrics, useAuth)
- Display data in components
- Capture user input
- Trigger navigation
- Handle user interactions
- Manage local UI state (modals, loading states)

**Forbidden in UI (NEVER DO THIS)**:
- ❌ Complex calculations in `useEffect`
- ❌ Data transformation beyond simple formatting
- ❌ Business logic in event handlers
- ❌ Direct API calls (use hooks instead)

### Demo Mode First

**All pages must work in demo mode without authentication.**

- Demo metrics load instantly (< 200ms)
- No API calls in demo mode
- Demo data is hardcoded and deterministic
- Clear "Demo Mode" badges visible
- Smooth transition from demo → live on wallet connect

### Progressive Enhancement

**Core content must render without JavaScript.**

- Hero section, feature cards, footer render server-side
- Metrics load progressively
- Skeleton loaders for async content
- Graceful degradation on errors

## Component Standards

### Component Structure

```typescript
// 1. Imports (grouped: React, external libs, internal)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';

// 2. Types/Interfaces
interface FeatureCardProps {
  feature: 'guardian' | 'hunter' | 'harvestpro';
  icon: LucideIcon;
  title: string;
  tagline: string;
  previewLabel: string;
  previewValue: string | number;
  previewDescription: string;
  primaryRoute: string;
  demoRoute?: string;
  isLoading?: boolean;
  isDemo?: boolean;
}

// 3. Component
export const FeatureCard = ({
  feature,
  icon: Icon,
  title,
  tagline,
  previewLabel,
  previewValue,
  previewDescription,
  primaryRoute,
  demoRoute,
  isLoading = false,
  isDemo = false,
}: FeatureCardProps) => {
  // 4. Hooks
  const router = useRouter();
  
  // 5. Event handlers
  const handlePrimaryClick = () => {
    router.push(primaryRoute);
  };
  
  const handleDemoClick = () => {
    if (demoRoute) {
      router.push(demoRoute);
    }
  };
  
  // 6. Render
  return (
    <motion.div
      className="feature-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      {/* Component JSX */}
    </motion.div>
  );
};
```

### Naming Conventions

- **Components**: PascalCase (`FeatureCard`, `HeroSection`)
- **Hooks**: camelCase with `use` prefix (`useHomeMetrics`, `useAuth`)
- **Utils**: camelCase (`getDemoMetrics`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`ERROR_MESSAGES`, `DEMO_METRICS`)
- **Types**: PascalCase (`HomeMetrics`, `FeatureCardProps`)

### File Organization

```
src/
├── app/
│   ├── page.tsx                    # Home page (uses components)
│   └── api/
│       └── home-metrics/
│           └── route.ts            # API endpoint
├── components/
│   └── home/
│       ├── HeroSection.tsx
│       ├── FeatureCard.tsx
│       ├── TrustBuilders.tsx
│       ├── OnboardingSection.tsx
│       └── index.ts                # Barrel export
├── hooks/
│   ├── useHomeMetrics.ts
│   └── useAuth.ts
├── lib/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   └── demoDataService.ts
│   └── constants/
│       └── errorMessages.ts
└── types/
    └── home.ts
```

## Data Fetching Patterns

### Use React Query for All API Calls

```typescript
// ✅ Good: Use React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['homeMetrics'],
  queryFn: fetchHomeMetrics,
  staleTime: 60000,
  refetchInterval: 30000,
});

// ❌ Bad: Direct fetch in useEffect
useEffect(() => {
  fetch('/api/home-metrics')
    .then(res => res.json())
    .then(data => setMetrics(data));
}, []);
```

### Demo vs Live Data Pattern

```typescript
const useHomeMetrics = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['homeMetrics', isAuthenticated],
    queryFn: async () => {
      // Demo mode: instant return
      if (!isAuthenticated) {
        return getDemoMetrics();
      }
      
      // Live mode: API call
      const response = await fetch('/api/home-metrics', {
        credentials: 'include',
      });
      return response.json();
    },
    staleTime: isAuthenticated ? 60000 : Infinity,
    refetchInterval: isAuthenticated ? 30000 : false,
  });
};
```

## Error Handling

### Use Centralized Error Messages

```typescript
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

// ✅ Good: Use constant
toast.error(ERROR_MESSAGES.WALLET_CONNECTION_FAILED);

// ❌ Bad: Hardcoded string
toast.error('Failed to connect wallet');
```

### Error Boundaries for Component Errors

```typescript
// Wrap major sections in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <HeroSection />
</ErrorBoundary>

<ErrorBoundary fallback={<ErrorFallback />}>
  <FeatureCards />
</ErrorBoundary>
```

### Graceful Degradation

```typescript
// Always provide fallback values
const { metrics, isLoading, error } = useHomeMetrics();

if (error) {
  // Show cached data or fallback
  return <FeatureCard previewValue="—" error={error.message} />;
}

if (isLoading) {
  return <FeatureCardSkeleton />;
}

return <FeatureCard previewValue={metrics.guardianScore} />;
```

## Styling Standards

### Use Tailwind CSS Classes

```typescript
// ✅ Good: Tailwind classes
<div className="bg-slate-900 rounded-lg p-6 border border-white/10">

// ❌ Bad: Inline styles
<div style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}>
```

### Glassmorphism Pattern

```typescript
// Standard glassmorphism card
<div className="
  bg-white/5 
  backdrop-blur-md 
  border border-white/10 
  rounded-lg 
  p-6
">
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  flex flex-col          // Mobile: stack
  md:flex-row            // Tablet+: row
  gap-4                  // Mobile: 1rem gap
  md:gap-6               // Tablet+: 1.5rem gap
">
```

## Animation Standards

### Use Framer Motion for Interactions

```typescript
import { motion } from 'framer-motion';

// Hover animations
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
>

// Fade in animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### Respect prefers-reduced-motion

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.02 }}
>
```

## Accessibility Standards

### ARIA Labels on All Interactive Elements

```typescript
// ✅ Good: ARIA label
<button aria-label="Connect wallet to see your data">
  Connect Wallet
</button>

// ❌ Bad: No label
<button>
  <WalletIcon />
</button>
```

### Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
```

### Contrast Ratios

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Use tools like axe DevTools to verify

## Performance Standards

### Code Splitting

```typescript
// Lazy load non-critical components
const OnboardingSection = lazy(() => import('@/components/home/OnboardingSection'));

<Suspense fallback={<Skeleton />}>
  <OnboardingSection />
</Suspense>
```

### Image Optimization

```typescript
// Always use Next.js Image component
import Image from 'next/image';

<Image
  src="/hero-background.png"
  alt="AlphaWhale hero background"
  width={1920}
  height={1080}
  priority  // For above-the-fold images
/>
```

### Prefetch Routes on Hover

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

<Link
  href="/guardian"
  onMouseEnter={() => router.prefetch('/guardian')}
>
  View Guardian
</Link>
```

## Testing Standards

### Unit Tests for Components

```typescript
import { render, screen } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

describe('FeatureCard', () => {
  test('renders all required elements', () => {
    render(<FeatureCard {...mockProps} />);
    
    expect(screen.getByText('Guardian')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  test('shows demo badge when isDemo is true', () => {
    render(<FeatureCard {...mockProps} isDemo={true} />);
    
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });
});
```

### Integration Tests for Data Flow

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useHomeMetrics } from './useHomeMetrics';

describe('useHomeMetrics', () => {
  test('returns demo metrics when not authenticated', async () => {
    const { result } = renderHook(() => useHomeMetrics());
    
    await waitFor(() => {
      expect(result.current.metrics.isDemo).toBe(true);
      expect(result.current.metrics.guardianScore).toBe(89);
    });
  });
});
```

### E2E Tests for Critical Flows

```typescript
test('complete home screen user journey', async ({ page }) => {
  await page.goto('/');
  
  // Verify demo mode
  await expect(page.locator('[data-testid="demo-badge"]')).toBeVisible();
  
  // Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  
  // Verify live mode
  await expect(page.locator('[data-testid="demo-badge"]')).not.toBeVisible();
});
```

## Security Standards

### Never Expose Sensitive Data

```typescript
// ✅ Good: JWT in httpOnly cookie
document.cookie = 'auth_token=...; httpOnly; secure; SameSite=Strict';

// ❌ Bad: JWT in localStorage
localStorage.setItem('auth_token', jwt);
```

### Validate All User Input

```typescript
// Use Zod for validation
import { z } from 'zod';

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

const validateAddress = (address: string) => {
  return walletAddressSchema.safeParse(address);
};
```

### Rate Limiting

```typescript
// Implement rate limiting on API routes
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
});

export async function GET(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429 }
    );
  }
  
  // Continue with request
}
```

## Monitoring & Logging

### Log Errors to Sentry

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await fetchHomeMetrics();
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'HomeMetrics' },
    extra: { userId: user?.id },
  });
  throw error;
}
```

### Track User Events

```typescript
import { analytics } from '@/lib/analytics';

// Track wallet connection
analytics.track('Wallet Connected', {
  walletAddress: address,
  timestamp: new Date().toISOString(),
});

// Track feature card clicks
analytics.track('Feature Card Clicked', {
  feature: 'guardian',
  isDemo: true,
});
```

## Development Workflow & Code Review Standards

### Branch Naming Convention
- Feature: `feat/home-hero-section`
- Bug fix: `fix/demo-metrics-loading`
- Refactor: `refactor/auth-context`
- Chore: `chore/update-dependencies`

### Commit Message Format
Follow conventional commits:

```
feat(home): add feature card component with live metrics

Implements feature card with glassmorphism styling
- Adds demo/live mode badge switching
- Includes WCAG AA contrast compliance
- Adds unit tests for all states

Closes #123
```

### Pull Request Checklist

**Before submitting PR, ensure:**

- [ ] Code follows component structure standards (imports → types → component → hooks → handlers → render)
- [ ] No business logic in React components
- [ ] All interactive elements have ARIA labels
- [ ] Components tested in demo mode AND live mode
- [ ] Lighthouse score ≥ 90 for performance/accessibility
- [ ] Zero console errors or warnings
- [ ] Error states tested (API failures, timeout, network offline)
- [ ] Loading states show skeletons
- [ ] Mobile responsiveness tested (≤375px, tablet, desktop)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] prefers-reduced-motion respected for animations

### Code Review Criteria

Reviewers must check:

**Architecture**
- ✅ UI components contain zero business logic
- ✅ All API calls use React Query hooks
- ✅ Demo and live data flows are separate
- ✅ Error boundaries wrap major sections

**Styling**
- ✅ Only Tailwind classes (no inline styles)
- ✅ Responsive design mobile-first
- ✅ Dark theme colors used correctly (#0A0F1F base, cyan accents)
- ✅ Glassmorphism applied to cards

**Accessibility**
- ✅ ARIA labels on all buttons/links
- ✅ Contrast ratios verified (4.5:1 normal, 3:1 large)
- ✅ Keyboard navigation logical order
- ✅ Focus indicators visible
- ✅ Image alt text present

**Testing**
- ✅ Unit tests cover all component states
- ✅ Integration tests cover demo → live transition
- ✅ E2E tests cover critical user journeys
- ✅ Accessibility tests pass (axe)

**Performance**
- ✅ No unnecessary re-renders
- ✅ Images optimized via Next/Image
- ✅ Non-critical components lazy-loaded
- ✅ React Query cache properly configured

**Security**
- ✅ No sensitive data in logs/console
- ✅ API calls use credentials: 'include' for cookies
- ✅ User input validated via Zod schemas
- ✅ Error messages don't expose internal details

### Deployment Checklist

**Before merging to main:**

- [ ] All tests passing locally
- [ ] No TypeScript errors
- [ ] ESLint passes with no warnings
- [ ] Accessibility audit passes (axe-core)
- [ ] Build succeeds without errors
- [ ] Lighthouse scores acceptable
- [ ] Code reviewed and approved by 1+ reviewer
- [ ] PR linked to issue/ticket
- [ ] CHANGELOG updated

### Testing Requirements by Component

**HeroSection**
- [ ] Renders headline, subheading, CTA
- [ ] Background animation respects prefers-reduced-motion
- [ ] CTA button routes correctly
- [ ] Demo mode shows "Connect Wallet" button
- [ ] Live mode shows "Start Protecting" button
- [ ] Keyboard accessible (Tab, Enter)

**FeatureCard**
- [ ] Renders icon, title, tagline, preview metric
- [ ] Shows demo badge when isDemo=true
- [ ] Skeleton loader shows during loading
- [ ] Hover animation scales to 1.02
- [ ] Primary button navigates to feature page
- [ ] Secondary button triggers demo
- [ ] Error state shows fallback value ("—")
- [ ] Touch targets ≥44px height on mobile

**TrustBuilders**
- [ ] Displays 4 trust badges
- [ ] Fetches and displays platform stats
- [ ] Shows skeleton loaders while loading
- [ ] Falls back to default values on error
- [ ] Stats update when metrics refresh

**OnboardingSection**
- [ ] Displays 3-step process
- [ ] Primary CTA navigates to /onboarding
- [ ] Secondary CTA navigates to /hunter
- [ ] Steps responsive on mobile (vertical) vs desktop (horizontal)

**FooterNav**
- [ ] Displays 4 icons (Guardian, Hunter, HarvestPro, Settings)
- [ ] Active route highlighted in cyan
- [ ] Click navigates to correct route
- [ ] Fixed positioning on mobile
- [ ] Touch targets ≥44px
- [ ] Keyboard navigation works (arrow keys)

### CI/CD Pipeline

All PRs must pass:

```yaml
# .github/workflows/home-ci.yml
name: Home Page CI

on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run type-check      # TypeScript
      - run: npm run lint            # ESLint
      - run: npm run test:unit       # Vitest
      - run: npm run test:a11y       # axe-core
      - run: npm run build           # Next.js build
      - run: npm run test:lighthouse # Lighthouse CI
```

## Testing Examples by Scenario

### Scenario 1: Demo Mode Initial Load

```typescript
test('loads demo metrics instantly without API call', async () => {
  const { result } = renderHook(() => useHomeMetrics());
  
  // Demo metrics should be available immediately
  expect(result.current.metrics).toEqual(expect.objectContaining({
    isDemo: true,
    guardianScore: 89,
  }));
  
  // Should not make any API calls
  expect(fetch).not.toHaveBeenCalled();
});
```

### Scenario 2: Demo → Live Transition

```typescript
test('transitions from demo to live metrics on wallet connect', async ({ page }) => {
  await page.goto('/');
  
  // Initially demo mode
  expect(await page.locator('[data-testid="demo-badge"]')).toBeVisible();
  
  // Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="select-metamask"]');
  
  // Wait for live metrics to load
  await page.waitForSelector('[data-testid="guardian-score"]:not(:has(~ [data-testid="demo-badge"]))');
  
  // Demo badge should disappear
  expect(await page.locator('[data-testid="demo-badge"]')).not.toBeVisible();
});
```

### Scenario 3: Error Recovery

```typescript
test('shows cached data and retries on API failure', async () => {
  // First call succeeds
  let callCount = 0;
  mockFetch.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({ ok: true, json: () => MOCK_METRICS });
    }
    // Second call fails
    return Promise.reject(new Error('Network error'));
  });
  
  const { result, rerender } = renderHook(() => useHomeMetrics());
  
  // Initial load succeeds
  await waitFor(() => {
    expect(result.current.metrics).toBeDefined();
  });
  
  // Trigger refetch (API fails)
  result.current.refetch();
  
  // Should show cached data, not error
  expect(result.current.metrics).toBeDefined();
});
```

## Summary

Follow these standards for all Home page development:

1. **UI is presentation only** - No business logic in components
2. **Demo mode first** - All pages work without auth
3. **Progressive enhancement** - Core content renders server-side
4. **React Query for data** - Consistent data fetching patterns
5. **Centralized error messages** - Use constants
6. **Tailwind CSS** - No inline styles
7. **Framer Motion** - Smooth animations
8. **Accessibility first** - ARIA labels, keyboard nav, contrast
9. **Performance optimized** - Code splitting, image optimization
10. **Security conscious** - httpOnly cookies, rate limiting
11. **Comprehensive testing** - Unit, integration, E2E
12. **Monitoring enabled** - Sentry, analytics

These standards ensure a consistent, maintainable, and high-quality Home page experience.
