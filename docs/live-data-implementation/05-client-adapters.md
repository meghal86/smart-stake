# 05 - Client Adapters

## Adapter Updates

Update existing adapters to point to new Edge Functions while respecting data mode.

### Spotlight Adapter

**File**: `src/lib/adapters/spotlight.ts`

```typescript
export async function fetchSpotlight() {
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE
  
  if (dataMode === 'mock') {
    return getMockSpotlightData()
  }
  
  try {
    const response = await fetch('/functions/v1/whale-spotlight', {
      headers: { 'Cache-Control': 'max-age=60' }
    })
    
    if (!response.ok) {
      throw new Error('Spotlight API failed')
    }
    
    return await response.json()
  } catch (error) {
    console.warn('Falling back to mock data:', error)
    return getMockSpotlightData()
  }
}

function getMockSpotlightData() {
  return {
    largest_move_usd: 2500000,
    most_active_wallet: '0x742d35Cc6634C0532925a3b8D',
    total_volume_usd: 45000000,
    tx_hash: '0x123...',
    last_updated_iso: new Date().toISOString(),
    provenance: 'Simulated'
  }
}
```

### Fear Index Adapter

**File**: `src/lib/adapters/fearIndex.ts`

```typescript
export async function fetchFearIndex() {
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE
  
  if (dataMode === 'mock') {
    return getMockFearIndexData()
  }
  
  try {
    const response = await fetch('/functions/v1/fear-index')
    
    if (!response.ok) {
      throw new Error('Fear Index API failed')
    }
    
    return await response.json()
  } catch (error) {
    console.warn('Falling back to mock data:', error)
    return getMockFearIndexData()
  }
}

function getMockFearIndexData() {
  return {
    score: 67,
    label: 'Accumulation',
    last_updated_iso: new Date().toISOString(),
    provenance: 'Simulated',
    methodologyUrl: '/docs/methodology#fear-index'
  }
}
```

### Prices Adapter

**File**: `src/lib/adapters/prices.ts`

```typescript
export async function fetchPrices(coins: string[] = ['ethereum', 'bitcoin']) {
  try {
    const response = await fetch(
      `/functions/v1/prices?ids=${coins.join(',')}`,
      { headers: { 'Cache-Control': 'max-age=60' } }
    )
    
    return await response.json()
  } catch (error) {
    console.warn('Price fetch failed:', error)
    return {}
  }
}
```

## React Hooks Updates

### useSpotlight Hook

**File**: `src/hooks/useSpotlight.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchSpotlight } from '@/lib/adapters/spotlight'

export function useSpotlight() {
  return useQuery({
    queryKey: ['spotlight'],
    queryFn: fetchSpotlight,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,       // 30 seconds
    retry: 2
  })
}
```

### useFearIndex Hook

**File**: `src/hooks/useFearIndex.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchFearIndex } from '@/lib/adapters/fearIndex'

export function useFearIndex() {
  return useQuery({
    queryKey: ['fear-index'],
    queryFn: fetchFearIndex,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2
  })
}
```

## UI Components

No changes needed to existing UI components. They already handle:

- **Provenance chips**: Show "Real" vs "Simulated" 
- **Last updated timestamps**: Display refresh times
- **Loading states**: Handle async data fetching
- **Error boundaries**: Graceful fallbacks

## Environment Detection

**File**: `src/lib/env.ts`

```typescript
export const isLiveDataMode = () => {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'live'
}

export const getDataModeLabel = () => {
  return isLiveDataMode() ? 'Live Data' : 'Demo Mode'
}
```

## Feature Flag Integration

**File**: `src/lib/featureFlags.ts`

```typescript
export function isLiveDataEnabled() {
  const envMode = process.env.NEXT_PUBLIC_DATA_MODE === 'live'
  const flagEnabled = getFeatureFlag('data.live')
  
  return envMode && flagEnabled
}
```

---

**Next**: [Health Monitoring](./06-health-monitoring.md)