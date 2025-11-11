# Feature Flags Quick Start Guide

## 5-Minute Setup

### 1. Check a Feature Flag (Server-Side)

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  
  const useNewRanking = await isFeatureEnabled('rankingModelV2', {
    userId: userId || undefined,
  });
  
  if (useNewRanking) {
    return Response.json({ version: 'v2' });
  }
  
  return Response.json({ version: 'v1' });
}
```

### 2. Use in React Component

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

export function MyComponent({ userId }: { userId?: string }) {
  const { enabled, loading } = useFeatureFlag('rankingModelV2', { userId });
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {enabled ? (
        <NewRankingComponent />
      ) : (
        <OldRankingComponent />
      )}
    </div>
  );
}
```

### 3. Get All Flags

```typescript
import { useFeatureFlags } from '@/lib/feature-flags';

export function Dashboard({ userId }: { userId?: string }) {
  const { flags, loading } = useFeatureFlags({ userId });
  
  return (
    <div>
      <h2>Feature Flags</h2>
      <ul>
        <li>Ranking V2: {flags.rankingModelV2 ? '✅' : '❌'}</li>
        <li>Eligibility V2: {flags.eligibilityPreviewV2 ? '✅' : '❌'}</li>
        <li>Sponsored V2: {flags.sponsoredPlacementV2 ? '✅' : '❌'}</li>
        <li>Guardian Chip V2: {flags.guardianChipStyleV2 ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}
```

## Available Flags

| Flag | Current Rollout | Description |
|------|-----------------|-------------|
| `rankingModelV2` | 10% | New ranking algorithm |
| `eligibilityPreviewV2` | 50% | Enhanced eligibility scoring |
| `sponsoredPlacementV2` | 100% | Improved sponsored placement |
| `guardianChipStyleV2` | 0% (disabled) | New chip design |

## Configuration

### Option 1: Environment Variables (Easiest)

Add to `.env`:

```bash
FEATURE_FLAG_RANKING_MODEL_V2=true:25
```

Format: `FEATURE_FLAG_<FLAG_NAME>=enabled:rolloutPercentage`

### Option 2: Vercel Edge Config (Production)

1. Create Edge Config in Vercel dashboard
2. Add `EDGE_CONFIG` environment variable
3. Set flags in Edge Config JSON:

```json
{
  "featureFlags": {
    "rankingModelV2": {
      "enabled": true,
      "rolloutPercentage": 25
    }
  }
}
```

## Common Patterns

### Conditional Rendering

```typescript
const { enabled } = useFeatureFlag('rankingModelV2', { userId });

return enabled ? <NewUI /> : <OldUI />;
```

### Multiple Flags

```typescript
const { flags } = useFeatureFlags({ userId });

if (flags.rankingModelV2 && flags.eligibilityPreviewV2) {
  return <FullV2Experience />;
}
```

### Server-Side Logic

```typescript
const flags = await getFeatureFlags({ userId });

const data = flags.rankingModelV2 
  ? await fetchWithNewRanking()
  : await fetchWithOldRanking();
```

## Testing

### Mock Flags in Tests

```typescript
import { clearFeatureFlagsCache } from '@/lib/feature-flags';

beforeEach(() => {
  clearFeatureFlagsCache();
  process.env.FEATURE_FLAG_RANKING_MODEL_V2 = 'true:100';
});

afterEach(() => {
  delete process.env.FEATURE_FLAG_RANKING_MODEL_V2;
});
```

## Rollout Strategy

1. **Start Small**: 1-10% of users
2. **Monitor**: Watch for errors and metrics
3. **Increase Gradually**: 25% → 50% → 100%
4. **Full Rollout**: Set to 100%
5. **Clean Up**: Remove flag after stable

## Troubleshooting

**Q: Flags not updating?**  
A: Wait 60 seconds for cache to expire, or call `clearFeatureFlagsCache()`

**Q: Different results for same user?**  
A: Ensure you're passing the same userId/sessionId consistently

**Q: How to disable a flag?**  
A: Set `enabled: false` or `rolloutPercentage: 0`

## Need Help?

- 📖 Full docs: `src/lib/feature-flags/README.md`
- 💡 Examples: `src/lib/feature-flags/example-usage.ts`
- 🧪 Tests: `src/__tests__/lib/feature-flags/`
