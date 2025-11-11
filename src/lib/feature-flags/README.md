# Feature Flags System

A robust feature flag system for gradual rollouts and A/B testing.

## Features

- ✅ **Vercel Edge Config Integration**: Fetch flags from Edge Config for instant updates
- ✅ **Environment Variable Overrides**: Override flags via environment variables
- ✅ **Gradual Rollout**: Percentage-based rollout with consistent hashing
- ✅ **In-Memory Caching**: 60-second cache to reduce API calls
- ✅ **React Hooks**: Easy-to-use hooks for client-side components
- ✅ **Type-Safe**: Full TypeScript support

## Available Feature Flags

| Flag | Description | Default Rollout |
|------|-------------|-----------------|
| `rankingModelV2` | Enhanced ranking model with improved personalization | 10% |
| `eligibilityPreviewV2` | Improved eligibility scoring with additional signals | 50% |
| `sponsoredPlacementV2` | Enhanced sponsored placement with better distribution | 100% |
| `guardianChipStyleV2` | New Guardian trust chip design | 0% (disabled) |

## Usage

### Server-Side (API Routes)

```typescript
import { isFeatureEnabled, getFeatureFlags } from '@/lib/feature-flags';

// Check a single flag
const enabled = await isFeatureEnabled('rankingModelV2', {
  userId: user.id,
  sessionId: req.sessionId,
});

if (enabled) {
  // Use new ranking model
} else {
  // Use old ranking model
}

// Get all flags
const flags = await getFeatureFlags({
  userId: user.id,
});

console.log(flags.rankingModelV2); // true/false
```

### Client-Side (React Components)

```typescript
import { useFeatureFlag, useFeatureFlags } from '@/lib/feature-flags';

function MyComponent() {
  // Check a single flag
  const { enabled, loading } = useFeatureFlag('rankingModelV2', {
    userId: user?.id,
    sessionId: sessionId,
  });
  
  if (loading) {
    return <Spinner />;
  }
  
  return enabled ? <NewFeature /> : <OldFeature />;
}

function AnotherComponent() {
  // Get all flags
  const { flags, loading } = useFeatureFlags({
    userId: user?.id,
  });
  
  return (
    <div>
      {flags.rankingModelV2 && <NewRanking />}
      {flags.eligibilityPreviewV2 && <NewEligibility />}
    </div>
  );
}
```

## Configuration

### Method 1: Vercel Edge Config (Recommended)

1. Create an Edge Config in Vercel dashboard
2. Add `EDGE_CONFIG` environment variable
3. Set feature flags in Edge Config:

```json
{
  "featureFlags": {
    "rankingModelV2": {
      "enabled": true,
      "rolloutPercentage": 25,
      "description": "Enhanced ranking model",
      "lastUpdated": "2025-01-10T00:00:00Z"
    }
  }
}
```

4. Changes take effect within 60 seconds (cache TTL)

### Method 2: Environment Variables

Set environment variables in `.env` or Vercel dashboard:

```bash
# Format: FEATURE_FLAG_<FLAG_NAME>=enabled:rolloutPercentage
FEATURE_FLAG_RANKING_MODEL_V2=true:25
FEATURE_FLAG_ELIGIBILITY_PREVIEW_V2=true:50
FEATURE_FLAG_SPONSORED_PLACEMENT_V2=true:100
FEATURE_FLAG_GUARDIAN_CHIP_STYLE_V2=false:0
```

### Method 3: Code Defaults

Edit `src/lib/feature-flags/config.ts` to change default values.

## Rollout Strategy

The system uses **consistent hashing** to ensure:
- Same user always gets same experience
- Deterministic rollout based on userId/sessionId/IP
- No flicker between enabled/disabled states

### Rollout Percentage Examples

- `0%`: Feature disabled for everyone
- `10%`: Feature enabled for 10% of users
- `50%`: Feature enabled for 50% of users
- `100%`: Feature enabled for everyone

### Identifier Priority

1. **userId** (if authenticated)
2. **sessionId** (if available)
3. **ipAddress** (fallback)
4. `"anonymous"` (last resort)

## Testing

### Unit Tests

```typescript
import { isInRollout, shouldEnableFeature } from '@/lib/feature-flags';

describe('Feature Flags', () => {
  it('should enable feature for users in rollout', () => {
    expect(isInRollout('user-123', 100)).toBe(true);
    expect(isInRollout('user-123', 0)).toBe(false);
  });
  
  it('should be deterministic', () => {
    const result1 = isInRollout('user-123', 50);
    const result2 = isInRollout('user-123', 50);
    expect(result1).toBe(result2);
  });
});
```

### Integration Tests

```typescript
import { clearFeatureFlagsCache, getFeatureFlags } from '@/lib/feature-flags';

beforeEach(() => {
  clearFeatureFlagsCache();
});

it('should fetch flags from Edge Config', async () => {
  const flags = await getFeatureFlags({ userId: 'test-user' });
  expect(flags).toHaveProperty('rankingModelV2');
});
```

## Admin API

Get raw configuration (for admin dashboards):

```typescript
import { getFeatureFlagsConfig } from '@/lib/feature-flags';

const config = await getFeatureFlagsConfig();
console.log(config.rankingModelV2.rolloutPercentage); // 10
```

## Best Practices

1. **Always provide context**: Pass userId/sessionId for consistent experience
2. **Handle loading states**: Use loading flag in React hooks
3. **Gradual rollout**: Start with 1-10%, then 25%, 50%, 100%
4. **Monitor metrics**: Track feature usage and errors
5. **Clean up old flags**: Remove flags after full rollout
6. **Document changes**: Update lastUpdated timestamp

## Troubleshooting

### Flags not updating

- Check cache TTL (60 seconds)
- Clear cache: `clearFeatureFlagsCache()`
- Verify Edge Config connection
- Check environment variables

### Inconsistent behavior

- Ensure same identifier is used
- Check rollout percentage
- Verify flag is enabled

### Performance issues

- Cache is working (60s TTL)
- Edge Config is fast (<10ms)
- Consider client-side caching for static flags

## Requirements Met

✅ **16.1**: Server-side feature flags with per-percent rollout  
✅ **16.2**: Eligibility preview algorithm controlled by flags  
✅ **16.3**: Sponsored placement rules controlled by flags  
✅ **16.4**: Gradual rollout support (1%, 10%, 50%, 100%)  
✅ **16.5**: Changes take effect within 60 seconds without deployment
