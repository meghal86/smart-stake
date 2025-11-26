# HarvestPro UI → API Connection Fix

**Issue:** UI is using mock data instead of calling the Edge Functions via API routes

**Status:** Needs Implementation

## Problem

The `src/pages/HarvestPro.tsx` component currently uses hardcoded mock data:

```typescript
// Current (WRONG)
const mockOpportunities: HarvestOpportunity[] = [
  { id: '1', token: 'ETH', ... },
  { id: '2', token: 'MATIC', ... },
  { id: '3', token: 'LINK', ... },
];
```

This means:
- ❌ Edge Functions are never called
- ❌ No real data is fetched
- ❌ Business logic in Edge Functions is not executed
- ❌ Users see fake data

## Solution

Replace mock data with real API calls using React Query.

### Step 1: Install React Query (if not already installed)

```bash
npm install @tanstack/react-query
```

### Step 2: Create API Hook

Create `src/hooks/useHarvestOpportunities.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import type { OpportunitiesResponse, HarvestOpportunity } from '@/types/harvestpro';

export interface UseHarvestOpportunitiesOptions {
  taxRate?: number;
  minLossThreshold?: number;
  maxRiskLevel?: 'low' | 'medium' | 'high';
  excludeWashSale?: boolean;
  enabled?: boolean;
}

export function useHarvestOpportunities(options: UseHarvestOpportunitiesOptions = {}) {
  const {
    taxRate = 0.24,
    minLossThreshold = 100,
    maxRiskLevel = 'medium',
    excludeWashSale = true,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['harvest-opportunities', { taxRate, minLossThreshold, maxRiskLevel, excludeWashSale }],
    queryFn: async (): Promise<OpportunitiesResponse> => {
      const params = new URLSearchParams({
        taxRate: String(taxRate),
        minLossThreshold: String(minLossThreshold),
        maxRiskLevel,
        excludeWashSale: String(excludeWashSale),
      });

      const response = await fetch(`/api/harvest/opportunities?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch opportunities');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
```

### Step 3: Update HarvestPro Page

Update `src/pages/HarvestPro.tsx`:

```typescript
// Remove mock data
// const mockOpportunities = [...]; // DELETE THIS

// Add React Query hook
import { useHarvestOpportunities } from '@/hooks/useHarvestOpportunities';

export default function HarvestPro() {
  // ... existing state ...

  // Replace mock data with real API call
  const {
    data: opportunitiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useHarvestOpportunities({
    enabled: !isDemo, // Only fetch when not in demo mode
  });

  // Extract opportunities and summary from API response
  const opportunities = opportunitiesData?.items || [];
  const summary = opportunitiesData?.summary || {
    totalHarvestableLoss: 0,
    estimatedNetBenefit: 0,
    eligibleTokensCount: 0,
    gasEfficiencyScore: 'C' as const,
  };

  // Update refresh handler to call API
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  // Update view state based on API response
  useEffect(() => {
    if (isLoading) {
      setViewState('loading');
    } else if (isError) {
      setViewState('error');
    } else if (opportunities.length === 0) {
      setViewState('no-opportunities');
    } else {
      setViewState('normal');
    }
  }, [isLoading, isError, opportunities.length]);

  // ... rest of component ...
}
```

### Step 4: Add Query Provider

Wrap app with QueryClientProvider in `src/main.tsx` or `src/app/layout.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## Complete Flow After Fix

```
User opens HarvestPro page
  ↓
useHarvestOpportunities() hook called
  ↓
GET /api/harvest/opportunities
  ↓
Next.js API Route validates auth
  ↓
Calls supabase.functions.invoke('harvest-recompute-opportunities')
  ↓
Edge Function executes business logic:
  - Fetches transactions from DB
  - Calculates FIFO cost basis
  - Gets current prices
  - Detects opportunities
  - Estimates gas & slippage
  - Calculates net benefit
  - Classifies risk
  - Applies eligibility filters
  ↓
Returns opportunities to API route
  ↓
API route formats response
  ↓
React Query caches result
  ↓
UI displays real opportunities
```

## Demo Mode

Keep demo mode working with mock data:

```typescript
export default function HarvestPro() {
  const [isDemo, setIsDemo] = useState(true);

  // Only fetch real data when not in demo mode
  const {
    data: opportunitiesData,
    isLoading,
    isError,
    refetch,
  } = useHarvestOpportunities({
    enabled: !isDemo, // Key change: disable API calls in demo mode
  });

  // Use mock data in demo mode, real data otherwise
  const opportunities = isDemo 
    ? mockOpportunities 
    : (opportunitiesData?.items || []);

  const summary = isDemo
    ? mockSummary
    : (opportunitiesData?.summary || defaultSummary);

  // ... rest of component ...
}
```

## Testing the Fix

### 1. Check API Route
```bash
# Test the API route directly
curl -X GET 'http://localhost:3000/api/harvest/opportunities' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 2. Check Edge Function
```bash
# Test Edge Function directly
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/harvest-recompute-opportunities' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "test-user-id"}'
```

### 3. Check UI
1. Open browser DevTools → Network tab
2. Navigate to HarvestPro page
3. Toggle demo mode OFF
4. Should see request to `/api/harvest/opportunities`
5. Should see response with real data

## Files to Create/Modify

### Create:
1. `src/hooks/useHarvestOpportunities.ts` - API hook

### Modify:
1. `src/pages/HarvestPro.tsx` - Replace mock data with API calls
2. `src/main.tsx` or `src/app/layout.tsx` - Add QueryClientProvider

## Priority

**HIGH** - This is the missing piece that connects the UI to the backend!

Without this fix:
- Edge Functions are never called
- Business logic is never executed
- Users see fake data
- System doesn't work end-to-end

## Estimated Time

30 minutes to implement and test.

## Next Steps

1. Install React Query
2. Create `useHarvestOpportunities` hook
3. Update `HarvestPro.tsx` to use hook
4. Add QueryClientProvider
5. Test with real Supabase connection
6. Verify Edge Function is called
7. Verify opportunities are displayed

---

**This is the final piece to make HarvestPro fully functional!** 🚀
