# Risk Scanner Test Cases

## 🧪 Comprehensive Test Suite for Wallet Risk Analysis

### 📋 Test Wallet Addresses

#### 1. **Low Risk Wallets** (Score: 1-3)
```
0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE  // Binance Hot Wallet
0x28C6c06298d514Db089934071355E5743bf21d60  // Binance 14
0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549  // Binance 15
```
**Expected Results:**
- Risk Score: 1-3/10
- Risk Level: Low
- High transaction volume (>100k transactions)
- Long wallet age (>3 years)
- High balance
- Regular activity patterns

#### 2. **Medium Risk Wallets** (Score: 4-6)
```
0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6  // Random active wallet
0x8ba1f109551bD432803012645Hac136c9c1618  // MEV Bot wallet
0x1111111254fb6c44bAC0beD2854e76F90643097d  // 1inch Router
```
**Expected Results:**
- Risk Score: 4-6/10
- Risk Level: Medium
- Moderate transaction history
- Some contract interactions
- Regular but not excessive activity

#### 3. **High Risk Wallets** (Score: 7-10)
```
0x0000000000000000000000000000000000000000  // Null address
0x000000000000000000000000000000000000dEaD  // Burn address
0x1234567890123456789012345678901234567890  // Invalid/new address
```
**Expected Results:**
- Risk Score: 7-10/10
- Risk Level: High
- Very low or no transaction history
- New wallet (if exists)
- Suspicious patterns

### 🔬 Test Case Scenarios

#### **Test Case 1: Exchange Wallet (Low Risk)**
```javascript
{
  testName: "Binance Hot Wallet - Low Risk",
  walletAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
  expectedResults: {
    riskScore: 1-2,
    riskLevel: "low",
    totalTransactions: ">100000",
    walletAge: ">1000 days",
    currentBalance: ">1000 ETH",
    uniqueContracts: ">50",
    riskFactors: [],
    recommendations: ["Wallet appears safe for normal interactions"]
  }
}
```

#### **Test Case 2: Active DeFi User (Medium Risk)**
```javascript
{
  testName: "DeFi Power User - Medium Risk",
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  expectedResults: {
    riskScore: 4-5,
    riskLevel: "medium",
    totalTransactions: "1000-10000",
    walletAge: "100-500 days",
    currentBalance: "1-100 ETH",
    uniqueContracts: "10-30",
    riskFactors: ["High smart contract interaction frequency"],
    recommendations: ["Monitor transactions closely", "Verify recent activity"]
  }
}
```

#### **Test Case 3: New/Empty Wallet (High Risk)**
```javascript
{
  testName: "New Empty Wallet - High Risk",
  walletAddress: "0x1234567890123456789012345678901234567890",
  expectedResults: {
    riskScore: 8-10,
    riskLevel: "high",
    totalTransactions: "0-5",
    walletAge: "0-30 days",
    currentBalance: "0-0.1 ETH",
    uniqueContracts: "0-2",
    riskFactors: [
      "New wallet (less than 30 days old)",
      "Low transaction history",
      "Very low ETH balance"
    ],
    recommendations: [
      "Proceed with extreme caution",
      "Verify wallet ownership",
      "Start with small amounts"
    ]
  }
}
```

### 🧪 Automated Test Suite

#### **Test Case 4: Risk Score Calculation**
```javascript
describe('Risk Score Calculation', () => {
  test('should calculate low risk for established wallets', async () => {
    const result = await scanWallet('0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE');
    expect(result.risk_score).toBeLessThanOrEqual(3);
    expect(result.risk_level).toBe('low');
  });

  test('should calculate high risk for new wallets', async () => {
    const result = await scanWallet('0x1234567890123456789012345678901234567890');
    expect(result.risk_score).toBeGreaterThanOrEqual(7);
    expect(result.risk_level).toBe('high');
  });
});
```

#### **Test Case 5: Risk Factor Detection**
```javascript
describe('Risk Factor Detection', () => {
  test('should detect new wallet risk factor', async () => {
    const result = await scanWallet('0x1234567890123456789012345678901234567890');
    expect(result.risk_factors).toContain('New wallet (less than 30 days old)');
  });

  test('should detect low transaction history', async () => {
    const result = await scanWallet('0x1234567890123456789012345678901234567890');
    expect(result.risk_factors).toContain('Low transaction history');
  });
});
```

### 📊 Manual Testing Checklist

#### **UI/UX Testing**
- [ ] Scanner input accepts valid Ethereum addresses
- [ ] Loading state displays during scan
- [ ] Risk score displays correctly (1-10 scale)
- [ ] Risk level color coding works (green/yellow/red)
- [ ] Risk breakdown charts render properly
- [ ] Risk factors list displays correctly
- [ ] Recommendations show based on risk level
- [ ] Error handling for invalid addresses
- [ ] Error handling for API failures

#### **Functional Testing**
- [ ] Etherscan API integration works
- [ ] Transaction history analysis accurate
- [ ] Balance calculation correct
- [ ] Wallet age calculation accurate
- [ ] Contract interaction counting works
- [ ] Failed transaction ratio calculated
- [ ] Risk score algorithm functions properly
- [ ] Database storage of scan results
- [ ] Alert creation for high-risk wallets

#### **Edge Cases**
- [ ] Empty wallet (0 transactions)
- [ ] Very old wallet (>5 years)
- [ ] High-volume wallet (>1M transactions)
- [ ] Contract address instead of EOA
- [ ] Invalid address format
- [ ] Network timeout handling
- [ ] Rate limiting handling

### 🎯 Performance Testing

#### **Load Testing Scenarios**
```javascript
// Test concurrent scans
const testWallets = [
  '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
  '0x28C6c06298d514Db089934071355E5743bf21d60',
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549'
];

// Concurrent scan test
Promise.all(testWallets.map(wallet => scanWallet(wallet)))
  .then(results => {
    console.log('All scans completed:', results.length);
  });
```

### 🔍 Security Testing

#### **Input Validation**
- [ ] SQL injection prevention
- [ ] XSS prevention in address display
- [ ] Address format validation
- [ ] Rate limiting on scan requests
- [ ] Authentication for premium features

#### **Data Privacy**
- [ ] Scan results properly isolated by user
- [ ] No sensitive data in logs
- [ ] Proper error message sanitization

### 📈 Expected Performance Metrics

#### **Response Times**
- Low-activity wallet: <5 seconds
- High-activity wallet: <15 seconds
- Error cases: <2 seconds

#### **Accuracy Targets**
- Risk score accuracy: >90%
- Risk factor detection: >95%
- False positive rate: <5%

### 🚀 Test Execution Commands

```bash
# Run all scanner tests
npm test -- --testPathPattern=Scanner

# Run specific test suite
npm test -- --testNamePattern="Risk Scanner"

# Run with coverage
npm test -- --coverage --testPathPattern=Scanner

# Manual testing with curl
curl -X POST https://your-project.supabase.co/functions/v1/riskScan \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE"}'
```

### ✅ Test Results Template

```markdown
## Test Execution Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [PROD/STAGING/DEV]

### Test Results Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

### Failed Tests
1. [Test Name] - [Reason] - [Priority]

### Performance Results
- Average scan time: X seconds
- API success rate: X%
- Error rate: X%

### Recommendations
- [Action items based on test results]
```

This comprehensive test suite covers all aspects of the risk scanner functionality with real wallet addresses and expected outcomes.