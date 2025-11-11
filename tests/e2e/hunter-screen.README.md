# Hunter Screen E2E Tests

Comprehensive end-to-end tests for the Hunter Screen feature using Playwright.

## Test Coverage

### 1. Feed Loading and Pagination
- ✅ Initial feed loading with opportunity cards
- ✅ Display of all required card elements
- ✅ Infinite scroll functionality
- ✅ No duplicate cards across pages
- ✅ Loading state indicators

### 2. Filter Application and Persistence
- ✅ Filter drawer opening
- ✅ Filtering by opportunity type
- ✅ Filtering by chain
- ✅ Filtering by trust level
- ✅ Filter persistence in URL
- ✅ Filter reset functionality

### 3. Red Trust Consent Gate
- ✅ Red trust items hidden by default
- ✅ Consent modal display
- ✅ Red items shown after consent
- ✅ Consent persistence for session

### 4. Card Interactions
- ✅ Save opportunity
- ✅ Share opportunity
- ✅ Report modal opening
- ✅ Report submission
- ✅ CTA button clicks
- ✅ Guardian trust details

### 5. Search Functionality
- ✅ Search bar visibility
- ✅ Search query execution
- ✅ Search debouncing (300ms)
- ✅ Clear search
- ✅ Search suggestions

### 6. Tab Navigation
- ✅ All tabs visible
- ✅ Tab switching
- ✅ Active tab persistence in URL
- ✅ Feed updates on tab change
- ✅ Active tab highlighting

### 7. Mobile Responsive Behavior (375x667)
- ✅ Single column layout
- ✅ Right rail hidden
- ✅ Filter drawer as bottom sheet
- ✅ Touch scrolling
- ✅ Sticky sub-filters
- ✅ Touch-friendly tap targets (44x44px minimum)

### 8. Tablet Responsive Behavior (768x1024)
- ✅ 2-column grid layout
- ✅ Right rail hidden
- ✅ Compact cards

### 9. Desktop Responsive Behavior (1920x1080)
- ✅ 3-column grid layout
- ✅ Right rail visible
- ✅ Personal picks module
- ✅ Saved items list
- ✅ Season progress widget

### 10. Accessibility Compliance (WCAG AA)
- ✅ Proper heading hierarchy
- ✅ Aria-labels on interactive elements
- ✅ Keyboard navigation support
- ✅ ESC key closes modals
- ✅ Sufficient color contrast
- ✅ Text labels (not color-only)
- ✅ Keyboard accessible tooltips
- ✅ No focus trapping
- ✅ Proper ARIA roles
- ✅ Dynamic content announcements

### 11. Performance and Loading
- ✅ Load time < 3 seconds
- ✅ Loading state display
- ✅ Prefetch at 70% scroll

### 12. Error Handling
- ✅ Error state on API failure
- ✅ Retry button on error
- ✅ Empty state when no results

### 13. Sponsored Capping (Separate Test File)
- ✅ See `sponsored-capping.e2e.test.ts` for comprehensive coverage
- ✅ ≤2 sponsored per 12-card window
- ✅ Compliance across all viewport sizes
- ✅ Deterministic behavior

## Running the Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run only Hunter Screen tests
```bash
npx playwright test hunter-screen
```

### Run in headed mode (see browser)
```bash
npx playwright test hunter-screen --headed
```

### Run specific test
```bash
npx playwright test hunter-screen -g "should load initial feed"
```

### Run on specific browser
```bash
npx playwright test hunter-screen --project=chromium
npx playwright test hunter-screen --project=firefox
npx playwright test hunter-screen --project=webkit
```

### Run mobile tests only
```bash
npx playwright test hunter-screen -g "Mobile Responsive"
```

### Debug mode
```bash
npx playwright test hunter-screen --debug
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Retries**: 2 in CI, 0 locally
- **Timeout**: 30 seconds per test
- **Trace**: On first retry

## Test Data

Tests use fixture mode for deterministic data:
```
/hunter?mode=fixtures
```

This ensures:
- Consistent test data across runs
- All opportunity types represented
- Edge cases included (Red trust, geo-gated, expired, etc.)

## Requirements Coverage

These tests cover all requirements from the Hunter Screen specification:

- **Requirement 1**: Performance & Speed
- **Requirement 2**: Trust & Security Display
- **Requirement 3**: Personalized Feed Ranking
- **Requirement 4**: Comprehensive Filtering
- **Requirement 5**: Opportunity Card Display
- **Requirement 6**: Eligibility Preview
- **Requirement 7**: Navigation & Layout
- **Requirement 8**: Empty States & Error Handling
- **Requirement 9**: Accessibility (WCAG AA)
- **Requirement 10**: Analytics & Telemetry (partial)
- **Requirement 11**: Security & Abuse Prevention
- **Requirement 12**: Data Refresh & Sync
- **Requirement 13**: Data Normalization & Deduplication

## CI/CD Integration

Tests run automatically in CI:
- On pull requests
- Before deployment
- Nightly regression runs

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity

### Flaky tests
- Add explicit waits: `await page.waitForTimeout(500)`
- Use `waitForSelector` instead of fixed timeouts
- Check for race conditions

### Element not found
- Verify `data-testid` attributes exist
- Check if element is in viewport
- Wait for element to be visible

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting
3. **Test user flows** not implementation details
4. **Keep tests independent** - no shared state
5. **Use fixtures** for consistent test data
6. **Test accessibility** in every test suite
7. **Verify responsive behavior** across viewports

## Maintenance

- Update tests when UI changes
- Add tests for new features
- Remove tests for deprecated features
- Keep test data fixtures up to date
- Review and update selectors regularly

## Related Documentation

- [Hunter Screen Requirements](../../.kiro/specs/hunter-screen-feed/requirements.md)
- [Hunter Screen Design](../../.kiro/specs/hunter-screen-feed/design.md)
- [Hunter Screen Tasks](../../.kiro/specs/hunter-screen-feed/tasks.md)
- [Playwright Documentation](https://playwright.dev/)
