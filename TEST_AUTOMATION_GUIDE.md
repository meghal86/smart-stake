# 🧪 Portfolio Monitor - Test Automation Guide

Complete testing strategy for the Portfolio Monitor feature with BDD scenarios, unit tests, and E2E automation.

## 📋 Test Coverage Overview

### 🎯 **Test Types**
- **BDD Feature Files**: Gherkin scenarios for behavior specification
- **Unit Tests**: Jest/React Testing Library for component testing
- **E2E Tests**: Cypress for end-to-end user workflows
- **API Tests**: Portfolio tracker function validation

## 🔧 Setup & Configuration

### Prerequisites
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev cypress
npm install --save-dev jest
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "cypress run --spec 'cypress/e2e/portfolio.cy.ts'"
  }
}
```

## 🎭 BDD Feature Scenarios

### Core Test Scenarios
- ✅ Add wallet address (valid/invalid formats)
- ✅ Portfolio summary calculations
- ✅ Address filtering and sorting
- ✅ Data export functionality
- ✅ Mobile responsive features
- ✅ Error handling and API failures
- ✅ Pagination for large lists
- ✅ Tooltips and help content

### Test Tags
- `@smoke`: Critical path tests
- `@portfolio`: Portfolio-specific features
- `@validation`: Input validation tests
- `@mobile`: Mobile-specific scenarios
- `@api`: API integration tests
- `@error`: Error handling tests

## 🧪 Unit Test Structure

### Test Categories

#### Component Tests
```typescript
describe('Portfolio Monitor', () => {
  describe('Initial State', () => {
    // Empty state rendering
    // Header display
    // Default values
  });

  describe('Add Address Modal', () => {
    // Modal opening/closing
    // Form validation
    // Address format validation
  });

  describe('Address Management', () => {
    // Address display
    // Removal functionality
    // Details expansion
  });
});
```

#### Hook Tests
```typescript
describe('usePortfolioData', () => {
  // API call handling
  // Error states
  // Loading states
  // Data transformation
});
```

### Mock Strategy
- **API Responses**: Mock portfolio-tracker function
- **LocalStorage**: Mock address persistence
- **External Links**: Mock blockchain explorer
- **File Downloads**: Mock CSV export

## 🌐 E2E Test Workflows

### Critical User Journeys

#### New User Flow
1. Visit portfolio page
2. See empty state
3. Add first address
4. View portfolio summary
5. Export data

#### Power User Flow
1. Load existing portfolio
2. Filter by risk/tags
3. Sort by performance
4. Navigate pagination
5. Manage addresses

#### Mobile User Flow
1. Access on mobile device
2. Use floating add button
3. Navigate with touch
4. View responsive layout

### Test Data Management
```typescript
const testAddresses = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
    label: 'Trading Wallet',
    group: 'personal',
    totalValue: 45000,
    pnl: 8.5,
    riskScore: 7,
    whaleInteractions: 12
  }
];
```

## 🔍 Test Execution

### Running Tests

#### Unit Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

#### E2E Tests
```bash
# Interactive mode
npm run cypress:open

# Headless execution
npm run cypress:run

# Specific test file
npm run test:e2e
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Unit Tests
  run: npm test -- --coverage --watchAll=false

- name: Run E2E Tests
  run: npm run cypress:run
```

## 📊 Test Scenarios Matrix

| Feature | Unit Test | E2E Test | BDD Scenario |
|---------|-----------|----------|--------------|
| Add Address | ✅ | ✅ | ✅ |
| Address Validation | ✅ | ✅ | ✅ |
| Portfolio Summary | ✅ | ✅ | ✅ |
| Filtering | ✅ | ✅ | ✅ |
| Sorting | ✅ | ✅ | ✅ |
| Export | ✅ | ✅ | ✅ |
| Pagination | ✅ | ✅ | ✅ |
| Mobile UI | ✅ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ✅ |
| Tooltips | ✅ | ✅ | ✅ |

## 🎯 Test Data & Fixtures

### Valid Test Addresses
```
0x742d35Cc6634C0532925a3b8D4C9db4C532925a3  # Sample wallet
0x8ba1f109eddd4bd1cffd8cb45b1e1cccf233b2b5  # Exchange wallet
vitalik.eth                                   # ENS name
```

### Invalid Test Cases
```
invalid-address          # Invalid format
0x123                   # Too short
not-an-address.eth      # Invalid ENS
```

### Mock API Responses
```typescript
const mockPortfolioData = {
  "0x742d35Cc6634C0532925a3b8D4C9db4C532925a3": {
    address: "0x742d35Cc6634C0532925a3b8D4C9db4C532925a3",
    tokens: [
      {
        symbol: "ETH",
        balance: 25.5,
        value_usd: 42000,
        price_change_24h: 2.1
      }
    ],
    total_value_usd: 45230,
    whale_interactions: 12,
    risk_score: 7
  }
};
```

## 🚨 Error Scenarios

### API Error Handling
- Service unavailable (404)
- Network timeout
- Invalid response format
- Rate limiting

### User Input Errors
- Invalid address format
- Empty required fields
- Duplicate addresses
- Network disconnection

### Edge Cases
- Large address lists (100+)
- Zero balance addresses
- Extreme P&L values
- Missing token data

## 📈 Performance Testing

### Load Testing Scenarios
- 50+ addresses in portfolio
- Rapid filtering/sorting
- Large CSV exports
- Mobile device performance

### Performance Metrics
- Page load time < 3 seconds
- Filter response < 500ms
- Export generation < 2 seconds
- Mobile scroll smoothness

## 🔧 Debugging & Troubleshooting

### Common Test Issues

#### Flaky Tests
- Use proper waits for async operations
- Mock external dependencies
- Clean up state between tests

#### Cypress Issues
```typescript
// Wait for elements properly
cy.contains('Portfolio Monitor').should('be.visible');

// Handle async operations
cy.intercept('POST', '**/portfolio-tracker').as('portfolioData');
cy.wait('@portfolioData');
```

#### Jest Issues
```typescript
// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
```

## 📋 Test Checklist

### Pre-Release Testing
- [ ] All unit tests pass
- [ ] E2E tests pass on multiple browsers
- [ ] Mobile responsive tests pass
- [ ] API error scenarios handled
- [ ] Performance benchmarks met
- [ ] Accessibility tests pass
- [ ] Cross-browser compatibility verified

### Regression Testing
- [ ] Existing functionality unchanged
- [ ] New features work as expected
- [ ] Error handling still functional
- [ ] Mobile experience maintained
- [ ] Export functionality works
- [ ] Data persistence verified

---

## 🎯 Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Clear test descriptions
2. **Single Responsibility**: One assertion per test
3. **Arrange-Act-Assert**: Structured test format
4. **Mock External Dependencies**: Isolated testing
5. **Clean Up**: Reset state between tests

### Maintenance Strategy
- Regular test review and updates
- Remove obsolete tests
- Update mocks with API changes
- Monitor test execution times
- Keep test data current

**Happy Testing! 🧪✨**