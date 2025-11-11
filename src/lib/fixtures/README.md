# Test Fixtures for Hunter Screen

This module provides deterministic test data for E2E testing of the Hunter Screen opportunities feed.

## Overview

The fixtures module generates a consistent dataset that includes:
- All opportunity types (airdrop, quest, staking, yield, points, loyalty, testnet)
- Various trust levels (green, amber, red)
- Different eligibility states (likely, maybe, unlikely, unknown)
- Edge cases for comprehensive testing

## Usage

### In API Route

```typescript
import { getFixtureOpportunities } from '@/lib/fixtures/hunter-opportunities';

// In your API handler
if (params.mode === 'fixtures') {
  const fixtures = getFixtureOpportunities();
  return NextResponse.json({
    items: fixtures,
    cursor: null,
    ts: new Date().toISOString(),
  });
}
```

### In E2E Tests

```typescript
// Playwright test
test('should display all opportunity types', async ({ page }) => {
  await page.goto('/api/hunter/opportunities?mode=fixtures');
  const response = await page.textContent('body');
  const data = JSON.parse(response);
  
  expect(data.items).toHaveLength(15);
  expect(data.items[0].type).toBe('airdrop');
});
```

## Fixture Dataset

The dataset includes 15 opportunities:

1. **Standard Airdrop** - Green trust, likely eligible, featured
2. **Quest** - Amber trust, maybe eligible, ending soon
3. **Red Trust Airdrop** - Red trust (requires consent), risky
4. **Staking Pool** - APY reward, green trust
5. **Sponsored #1** - First sponsored item
6. **Points Program** - Points reward, season bonus, new
7. **Expired Opportunity** - Status: expired, time_left_sec: 0
8. **Zero Reward Quest** - XP only, no monetary reward
9. **Geo-Gated Yield** - Regional restrictions
10. **Sponsored #2** - Second sponsored item
11. **Testnet Campaign** - Testnet type, retroactive badge
12. **Loyalty Program** - Long-term rewards, hot
13. **NFT Reward Quest** - NFT currency type
14. **Sponsored #3** - Third sponsored item (tests capping)
15. **Unlikely Eligible** - Advanced difficulty, strict requirements

## Edge Cases Covered

### Trust Levels
- ✅ Green trust (score ≥80): Items 1, 4, 5, 6, 9, 10, 12, 13, 14, 15
- ✅ Amber trust (score 60-79): Items 2, 8, 11
- ✅ Red trust (score <60): Item 3

### Eligibility States
- ✅ Likely eligible (score ≥0.7): Item 1
- ✅ Maybe eligible (score 0.4-0.69): Item 2
- ✅ Unlikely eligible (score <0.4): Item 15
- ✅ Unknown eligibility: Items without eligibility_preview

### Reward Types
- ✅ USD: Items 1, 3, 7, 9, 15
- ✅ TOKEN: Items 5, 10, 11, 14
- ✅ POINTS: Items 2, 6, 8, 12
- ✅ APY: Items 4, 9
- ✅ NFT: Item 13

### Special Cases
- ✅ Expired: Item 7 (status: 'expired', expires_at in past)
- ✅ Zero reward: Item 8 (min: 0, max: 0)
- ✅ Geo-gated: Item 9 (regional restrictions)
- ✅ Sponsored: Items 5, 10, 14 (tests ≤2 per fold capping)
- ✅ Featured: Items 1, 12
- ✅ Various urgency: ending_soon (2), new (6), hot (12)

### Opportunity Types
- ✅ airdrop: Items 1, 3, 5, 7, 14, 15
- ✅ quest: Items 2, 8, 10, 13
- ✅ staking: Item 4
- ✅ yield: Item 9
- ✅ points: Item 6
- ✅ loyalty: Item 12
- ✅ testnet: Item 11

## Requirements Satisfied

- **15.1**: Deterministic dataset - same data on every call
- **15.2**: All opportunity types included
- **15.3**: Various trust levels and eligibility states
- **15.4**: Edge cases (Red trust, geo-gated, expired, zero-reward, sponsored, duplicates)

## Testing Recommendations

### Unit Tests
```typescript
import { getFixtureOpportunities } from '@/lib/fixtures/hunter-opportunities';

test('fixtures are deterministic', () => {
  const fixtures1 = getFixtureOpportunities();
  const fixtures2 = getFixtureOpportunities();
  expect(fixtures1).toEqual(fixtures2);
});

test('fixtures include all opportunity types', () => {
  const fixtures = getFixtureOpportunities();
  const types = new Set(fixtures.map(f => f.type));
  expect(types.size).toBe(7); // All 7 types
});
```

### E2E Tests
```typescript
test('sponsored capping works with fixtures', async ({ page }) => {
  await page.goto('/hunter?mode=fixtures');
  
  // Count sponsored items in first 12 cards
  const sponsoredCount = await page.locator('[data-sponsored="true"]').count();
  expect(sponsoredCount).toBeLessThanOrEqual(2);
});
```

## Notes

- All fixture IDs start with `f1000000-` for easy identification
- Base timestamp is `2025-01-15T00:00:00Z` for consistency
- Placeholder images use `via.placeholder.com` for testing
- All external URLs point to `example.com` domain
