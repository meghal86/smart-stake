# How to Extend AlphaWhale Lite

This guide explains how to add new features to the AlphaWhale Lite app while following the reuse-first approach.

## Overview

The AlphaWhale app uses a feature registry system that tracks existing components, hooks, and APIs. Before adding new functionality, always check what already exists and reuse it.

## Step-by-Step Process

### 1. Run Feature Audit

Before making any changes, run the audit to understand what exists:

```bash
npm run audit:features
```

This generates `docs/reuse-map.md` showing all existing features and their status.

### 2. Check Feature Registry

Look at `src/app/_internal/feature-registry.ts` to see what features are tracked and their status:

- `existing`: Feature is implemented and ready to use
- `adapter`: Feature needs an adapter to legacy systems
- `missing`: Feature needs to be built from scratch

### 3. Add New Feature

#### Option A: Reuse Existing Feature

If the feature exists, import and use it:

```typescript
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchlistManager } from '@/components/watchlist/WatchlistManager';

// Use directly in your component
const { watchlist, addToWatchlist } = useWatchlist();
```

#### Option B: Create Adapter

If the feature exists in legacy but needs adaptation:

1. Create adapter in `src/lib/adapters/[feature].ts`
2. Use the adapter pattern with circuit breaker and cache
3. Always include provenance badge (`Real` | `Simulated`)

```typescript
// src/lib/adapters/newFeature.ts
import { withCache, withCircuitBreaker } from '../net';

export async function getNewFeature() {
  return withCache('new-feature', 300000)(async () => {
    return withCircuitBreaker()(async () => {
      try {
        // Try real API first
        const response = await fetch('/api/legacy-endpoint');
        if (response.ok) {
          const data = await response.json();
          return { ...data, provenance: 'Real' as const };
        }
      } catch (error) {
        console.warn('Failed to fetch real data, using simulated');
      }
      
      // Fallback to simulated data
      return {
        data: 'simulated',
        provenance: 'Simulated' as const
      };
    });
  });
}
```

#### Option C: Build New Feature

If the feature doesn't exist:

1. Create component in appropriate directory
2. Add hook if needed
3. Add API route if needed
4. Update feature registry
5. Add to gating configuration

### 4. Update Feature Registry

After adding a feature, update the registry:

```typescript
// src/app/_internal/feature-registry.ts
export const features: Record<FeatureKey, FeatureDefinition> = {
  // ... existing features
  newFeature: {
    status: 'existing',
    path: 'src/components/new/NewFeature.tsx',
    components: ['src/components/new/NewFeature.tsx'],
    hooks: ['src/hooks/useNewFeature.ts'],
    needsAdapter: false
  }
};
```

### 5. Add Feature Gating

Update the gating configuration:

```json
// config/gating.json
{
  "free": ["whaleSpotlight", "fearIndex", "portfolioLite"],
  "pro": ["alerts", "exports", "digest", "watchlist", "referrals", "shareCards", "newFeature"],
  "enterprise": ["proGating"]
}
```

Use the `useGate` hook in components:

```typescript
import { useGate } from '@/hooks/useGate';

function MyComponent() {
  const { hasAccess, needsUpgrade } = useGate('newFeature');
  
  if (!hasAccess && needsUpgrade) {
    return <UpgradePrompt />;
  }
  
  return <FeatureContent />;
}
```

### 6. Add Tests

Create tests for new functionality:

```typescript
// tests/unit/newFeature.test.ts
import { describe, it, expect } from 'vitest';
import { getNewFeature } from '@/lib/adapters/newFeature';

describe('newFeature', () => {
  it('should return data with provenance', async () => {
    const result = await getNewFeature();
    expect(result.provenance).toMatch(/Real|Simulated/);
  });
});
```

```typescript
// tests/e2e/newFeature.spec.ts
import { test, expect } from '@playwright/test';

test('should render new feature', async ({ page }) => {
  await page.goto('/page-with-feature');
  await expect(page.locator('[data-testid="new-feature"]')).toBeVisible();
});
```

### 7. Update Documentation

1. Run audit again: `npm run audit:features`
2. Update `docs/reuse-map.md` with new feature
3. Add feature to this guide if it's a common pattern

## Best Practices

### Reuse First
- Always check existing components before creating new ones
- Use adapters to bridge legacy systems
- Maintain backward compatibility

### Provenance Tracking
- Always show whether data is `Real` or `Simulated`
- Use consistent badge styling
- Log when falling back to simulated data

### Feature Gating
- Use the `useGate` hook for access control
- Provide clear upgrade paths
- Test both gated and ungated states

### Performance
- Use circuit breakers for external APIs
- Cache responses appropriately
- Monitor performance with k6 tests

### Testing
- Write unit tests for adapters
- Add E2E tests for user flows
- Include performance smoke tests

## Common Patterns

### Adding a New Card to Homepage

1. Check if similar card exists in `src/components/hub/`
2. Create new card component following existing patterns
3. Add to homepage with gating if needed
4. Include provenance badge for data

### Adding a New API Endpoint

1. Check existing endpoints in `src/app/api/`
2. Follow REST conventions
3. Add error handling and validation
4. Include in performance tests

### Adding a New Hook

1. Check existing hooks in `src/hooks/`
2. Follow naming convention (`use[Feature]`)
3. Include loading states and error handling
4. Add to feature registry

## Troubleshooting

### Feature Not Showing
- Check feature registry status
- Verify gating configuration
- Check user tier/permissions

### Adapter Not Working
- Check circuit breaker state
- Verify API endpoints
- Check network connectivity

### Tests Failing
- Run audit to ensure registry is up to date
- Check for breaking changes in dependencies
- Verify test data and mocks

## Getting Help

1. Check the reuse map: `docs/reuse-map.md`
2. Look at existing similar features
3. Review the feature registry
4. Check test examples for patterns