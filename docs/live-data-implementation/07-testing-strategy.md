# 07 - Testing Strategy

## Unit Tests

### Data Processing Tests

**File**: `src/__tests__/data-processing.test.ts`

```typescript
import { processTransfers, calculateConfidence } from '@/lib/data-processing'

describe('Data Processing', () => {
  test('USD calculation accuracy', () => {
    const transfer = {
      value: '1000000000000000000', // 1 ETH in wei
      asset: 'ETH'
    }
    const prices = { ethereum: { usd: 2500 } }
    
    const result = calculateUSDAmount(transfer, prices)
    expect(result).toBe(2500)
  })
  
  test('confidence heuristic', () => {
    expect(calculateConfidence(3000000)).toBe('High')    // >$2M
    expect(calculateConfidence(1000000)).toBe('Medium')  // $750k-$2M  
    expect(calculateConfidence(500000)).toBe('Low')      // <$750k
  })
  
  test('deduplication guard', () => {
    const events = [
      { tx_hash: '0x123', log_index: 0, amount_usd: 1000000 },
      { tx_hash: '0x123', log_index: 0, amount_usd: 1000000 }, // duplicate
      { tx_hash: '0x456', log_index: 0, amount_usd: 2000000 }
    ]
    
    const deduplicated = deduplicateEvents(events)
    expect(deduplicated).toHaveLength(2)
  })
})
```

### Adapter Tests

**File**: `src/__tests__/adapters.test.ts`

```typescript
import { fetchSpotlight, fetchFearIndex } from '@/lib/adapters'

describe('Data Adapters', () => {
  test('spotlight adapter fallback', async () => {
    // Mock API failure
    global.fetch = jest.fn().mockRejectedValue(new Error('API down'))
    
    const result = await fetchSpotlight()
    
    expect(result.provenance).toBe('Simulated')
    expect(result.largest_move_usd).toBeGreaterThan(0)
  })
  
  test('fear index provenance switching', async () => {
    // Mock fresh data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        score: 75,
        provenance: 'Real',
        last_updated_iso: new Date().toISOString()
      })
    })
    
    const result = await fetchFearIndex()
    expect(result.provenance).toBe('Real')
  })
})
```

## Integration Tests (MSW)

**File**: `src/__tests__/integration/live-data.test.tsx`

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, waitFor } from '@testing-library/react'
import { SpotlightCard } from '@/components/SpotlightCard'

const server = setupServer(
  rest.get('/functions/v1/whale-spotlight', (req, res, ctx) => {
    return res(ctx.json({
      largest_move_usd: 5000000,
      most_active_wallet: '0x742d35Cc6634C0532925a3b8D',
      total_volume_usd: 85000000,
      tx_hash: '0xabc123',
      last_updated_iso: new Date().toISOString(),
      provenance: 'Real'
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Live Data Integration', () => {
  test('displays real data with correct provenance', async () => {
    render(<SpotlightCard />)
    
    await waitFor(() => {
      expect(screen.getByText('Real')).toBeInTheDocument()
      expect(screen.getByText('$5,000,000')).toBeInTheDocument()
    })
  })
  
  test('falls back to simulated on API failure', async () => {
    server.use(
      rest.get('/functions/v1/whale-spotlight', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )
    
    render(<SpotlightCard />)
    
    await waitFor(() => {
      expect(screen.getByText('Simulated')).toBeInTheDocument()
    })
  })
})
```

## E2E Tests (Playwright)

**File**: `tests/e2e/live-data.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Live Data Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Set live data mode
    await page.addInitScript(() => {
      window.localStorage.setItem('dataMode', 'live')
    })
  })
  
  test('shows real provenance chips', async ({ page }) => {
    await page.goto('/lite')
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="spotlight-card"]')
    
    // Check provenance chips
    const provenanceChips = page.locator('[data-testid="provenance-chip"]')
    await expect(provenanceChips.first()).toContainText('Real')
  })
  
  test('etherscan links work with real tx hashes', async ({ page }) => {
    await page.goto('/lite')
    
    // Wait for spotlight data
    await page.waitForSelector('[data-testid="etherscan-link"]')
    
    const etherscanLink = page.locator('[data-testid="etherscan-link"]')
    const href = await etherscanLink.getAttribute('href')
    
    expect(href).toMatch(/https:\/\/etherscan\.io\/tx\/0x[a-fA-F0-9]{64}/)
  })
  
  test('timestamps update within reasonable time', async ({ page }) => {
    await page.goto('/lite')
    
    const timestamp = page.locator('[data-testid="last-updated"]')
    const initialTime = await timestamp.textContent()
    
    // Wait and refresh
    await page.waitForTimeout(65000) // 65 seconds
    await page.reload()
    
    const updatedTime = await timestamp.textContent()
    expect(updatedTime).not.toBe(initialTime)
  })
})
```

## Performance Tests (k6)

**File**: `tests/perf/live-data-smoke.js`

```javascript
import http from 'k6/http'
import { check } from 'k6'

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% under 400ms
    http_req_failed: ['rate<0.1']     // <10% failure rate
  }
}

export default function() {
  // Test spotlight endpoint
  let spotlightRes = http.get(`${__ENV.BASE_URL}/functions/v1/whale-spotlight`)
  check(spotlightRes, {
    'spotlight status 200': (r) => r.status === 200,
    'spotlight has provenance': (r) => JSON.parse(r.body).provenance !== undefined
  })
  
  // Test fear index endpoint  
  let fearRes = http.get(`${__ENV.BASE_URL}/functions/v1/fear-index`)
  check(fearRes, {
    'fear index status 200': (r) => r.status === 200,
    'fear index has score': (r) => JSON.parse(r.body).score !== undefined
  })
}
```

## Data Quality Tests

**File**: `src/__tests__/data-quality.test.ts`

```typescript
describe('Data Quality Invariants', () => {
  test('no negative USD amounts', async () => {
    const { data } = await supabase
      .from('events_whale')
      .select('amount_usd')
      .lt('amount_usd', 0)
    
    expect(data).toHaveLength(0)
  })
  
  test('all transactions have hashes', async () => {
    const { data } = await supabase
      .from('events_whale')
      .select('tx_hash')
      .or('tx_hash.is.null,tx_hash.eq.')
    
    expect(data).toHaveLength(0)
  })
  
  test('data freshness within SLO', async () => {
    const { data } = await supabase
      .from('data_freshness')
      .select('age_seconds')
      .single()
    
    expect(data.age_seconds).toBeLessThan(600) // 10 minutes
  })
})
```

## Test Commands

```bash
# Unit tests
npm test

# Integration tests  
npm test -- --testPathPattern=integration

# E2E tests
npx playwright test

# Performance tests
k6 run tests/perf/live-data-smoke.js

# Data quality tests
npm test -- --testPathPattern=data-quality
```

---

**Next**: [Deployment Checklist](./08-deployment-checklist.md)