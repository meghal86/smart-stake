# 🧪 Cypress Test Execution Guide - WhalePlus UI Redesign

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Tests (New Terminal)
```bash
# Interactive test runner
npm run cypress:open

# Headless execution
npm run cypress:run:ui-redesign
```

---

## 📋 Test Commands

### **Interactive Testing**
```bash
# Open Cypress Test Runner (Recommended for development)
npm run cypress:open

# Select E2E Testing → Choose browser → Run tests
```

### **Headless Testing**
```bash
# Run all UI redesign tests
npm run cypress:run:ui-redesign

# Run specific test file
npx cypress run --spec "cypress/e2e/ui-redesign/navigation.cy.ts"

# Run with specific browser
npx cypress run --browser chrome --spec "cypress/e2e/ui-redesign/*.cy.ts"
```

### **Complete Test Suite**
```bash
# Run unit tests + E2E tests
npm run test:all

# Run only E2E tests
npm run test:e2e
```

---

## 🎯 Individual Test Execution

### **Navigation Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/navigation.cy.ts"
```
**Validates**: 6-tab navigation, routing, mobile responsiveness

### **Plan Gating Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/plan-gating.cy.ts"
```
**Validates**: Free/Pro/Premium/Enterprise access control

### **Predictions Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/predictions-scenarios.cy.ts"
```
**Validates**: Merged predictions, scenarios, explainability

### **Market Dashboard Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/market-dashboard.cy.ts"
```
**Validates**: Combined whale analytics, sentiment, portfolio

### **Scanner Compliance Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/scanner-compliance.cy.ts"
```
**Validates**: Enterprise scanner, Market Maker Sentinel

### **Reports Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/reports-exports.cy.ts"
```
**Validates**: PDF/CSV exports, scheduled reports

### **Home & Alerts Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/home-alerts.cy.ts"
```
**Validates**: Alert teasers, whale transactions, filtering

### **Responsive Design Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/responsive-design.cy.ts"
```
**Validates**: Mobile/tablet/desktop viewports

### **User Flows Tests**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/user-flows.cy.ts"
```
**Validates**: End-to-end user journeys

### **Complete Test Runner**
```bash
npx cypress run --spec "cypress/e2e/ui-redesign/test-runner.cy.ts"
```
**Validates**: All features, performance, accessibility

---

## 🔧 Test Configuration

### **Environment Setup**
```bash
# Set test environment variables
export CYPRESS_baseUrl=http://localhost:5173
export CYPRESS_MOCK_API=true
```

### **Browser Selection**
```bash
# Chrome (default)
npx cypress run --browser chrome

# Firefox
npx cypress run --browser firefox

# Edge
npx cypress run --browser edge

# Electron (headless)
npx cypress run --browser electron
```

### **Viewport Testing**
```bash
# Mobile viewport
npx cypress run --config viewportWidth=375,viewportHeight=667

# Tablet viewport  
npx cypress run --config viewportWidth=768,viewportHeight=1024

# Desktop viewport
npx cypress run --config viewportWidth=1920,viewportHeight=1080
```

---

## 📊 Test Scenarios

### **Plan-Based Testing**
```bash
# Test as Free user
CYPRESS_USER_PLAN=free npx cypress run --spec "**/plan-gating.cy.ts"

# Test as Pro user
CYPRESS_USER_PLAN=pro npx cypress run --spec "**/plan-gating.cy.ts"

# Test as Premium user
CYPRESS_USER_PLAN=premium npx cypress run --spec "**/plan-gating.cy.ts"

# Test as Enterprise user
CYPRESS_USER_PLAN=enterprise npx cypress run --spec "**/plan-gating.cy.ts"
```

### **Feature-Specific Testing**
```bash
# Navigation only
npx cypress run --spec "**/navigation.cy.ts"

# Predictions only
npx cypress run --spec "**/predictions-scenarios.cy.ts"

# Responsive only
npx cypress run --spec "**/responsive-design.cy.ts"
```

---

## 🎥 Test Recording & Reporting

### **Video Recording**
```bash
# Enable video recording
npx cypress run --record --key YOUR_RECORD_KEY

# Disable video (faster execution)
npx cypress run --config video=false
```

### **Screenshots**
```bash
# Enable screenshots on failure
npx cypress run --config screenshotOnRunFailure=true

# Custom screenshot folder
npx cypress run --config screenshotsFolder=cypress/screenshots
```

### **Test Reports**
```bash
# Generate JUnit report
npx cypress run --reporter junit --reporter-options mochaFile=results/test-results.xml

# Generate JSON report
npx cypress run --reporter json --reporter-options toConsole=true
```

---

## 🐛 Debugging Tests

### **Debug Mode**
```bash
# Open DevTools
npx cypress open --config chromeWebSecurity=false

# Debug specific test
npx cypress run --spec "cypress/e2e/ui-redesign/navigation.cy.ts" --headed --no-exit
```

### **Slow Motion**
```bash
# Add delays between commands
npx cypress run --config defaultCommandTimeout=10000,requestTimeout=10000
```

### **Console Logs**
```bash
# Enable console logs
npx cypress run --config env.DEBUG=true
```

---

## ⚡ Performance Testing

### **Load Time Validation**
```bash
# Test page load performance
npx cypress run --spec "**/user-flows.cy.ts" --config defaultCommandTimeout=5000
```

### **Memory Usage**
```bash
# Monitor memory usage
npx cypress run --browser chrome --browser-args="--max_old_space_size=4096"
```

---

## 📱 Mobile Testing

### **Device Simulation**
```bash
# iPhone SE
npx cypress run --config viewportWidth=375,viewportHeight=667

# iPad
npx cypress run --config viewportWidth=768,viewportHeight=1024

# iPhone 12 Pro
npx cypress run --config viewportWidth=390,viewportHeight=844
```

### **Touch Events**
```bash
# Enable touch events
npx cypress run --config touchEvents=true
```

---

## 🔍 Test Validation Checklist

### **Before Running Tests**
- [ ] Development server running (`npm run dev`)
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Mock data available

### **Test Execution**
- [ ] All navigation tests pass
- [ ] Plan gating works for all user types
- [ ] Predictions interface functions correctly
- [ ] Market dashboard displays properly
- [ ] Scanner compliance is enterprise-gated
- [ ] Reports export functionality works
- [ ] Responsive design validated
- [ ] User flows complete successfully

### **After Testing**
- [ ] Review test results
- [ ] Check screenshots for failures
- [ ] Validate performance metrics
- [ ] Confirm accessibility compliance

---

## 🚨 Troubleshooting

### **Common Issues**

**Server Not Running**
```bash
# Start dev server first
npm run dev
# Then run tests in new terminal
```

**Port Conflicts**
```bash
# Change base URL if needed
npx cypress run --config baseUrl=http://localhost:3000
```

**Test Timeouts**
```bash
# Increase timeout
npx cypress run --config defaultCommandTimeout=15000
```

**Memory Issues**
```bash
# Increase memory limit
NODE_OPTIONS="--max_old_space_size=4096" npx cypress run
```

### **Test Failures**

**Element Not Found**
- Check if component has correct `data-testid`
- Verify element is visible before interaction
- Add wait conditions if needed

**Plan Gating Issues**
- Ensure mock user plan is set correctly
- Check localStorage values
- Verify subscription hook mocking

**Responsive Issues**
- Confirm viewport settings
- Check CSS media queries
- Validate touch event handling

---

## 📈 CI/CD Integration

### **GitHub Actions**
```yaml
- name: Run Cypress Tests
  run: |
    npm run dev &
    npm run cypress:run:ui-redesign
```

### **Docker**
```bash
# Run in Docker container
docker run -it -v $PWD:/e2e -w /e2e cypress/included:latest
```

---

## 🎯 Success Criteria

**All tests should pass with:**
- ✅ Navigation between 6 tabs works
- ✅ Plan gating enforced correctly
- ✅ Predictions interface functional
- ✅ Market dashboard responsive
- ✅ Scanner compliance enterprise-only
- ✅ Reports export working
- ✅ Mobile responsiveness validated
- ✅ User flows complete end-to-end
- ✅ Performance benchmarks met
- ✅ Accessibility standards compliant

**🚀 Ready for production deployment when all tests pass!**