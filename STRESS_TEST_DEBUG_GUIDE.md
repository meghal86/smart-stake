# Stress Test Debug Guide

## Issue: Stress Test Button Not Working

This guide will help you debug and fix the stress test button issue.

## Quick Tests

### Test 1: Open the Simple Test File
1. Open `test-stress-button-simple.html` in your browser
2. Click all 3 test buttons
3. Check if they work

**If this works**: The button logic is fine, issue is in the React component
**If this doesn't work**: Browser issue or JavaScript disabled

### Test 2: Check Browser Console
1. Open your application
2. Navigate to Portfolio → Audit tab (or Stress Test tab)
3. Open browser DevTools (F12)
4. Go to Console tab
5. Click "Run Stress Test" button
6. Look for these logs:
   - `🧪 [StressTestPanel] Starting stress test...`
   - `📊 [StressTestPanel] Portfolio Value: ...`
   - `✅ [StressTestPanel] Calculations complete: ...`

**If you see these logs**: Button is working, check if results are displaying
**If you don't see logs**: Button click handler not firing

## Common Issues & Solutions

### Issue 1: Button Not Clickable

**Symptoms:**
- Button doesn't respond to clicks
- No console logs appear
- Cursor doesn't change to pointer

**Solutions:**

1. **Check if button is disabled**
   ```typescript
   // In StressTestPanel.tsx, check:
   disabled={isRunning}
   ```
   - If `isRunning` is stuck as `true`, button won't work
   - Solution: Refresh the page

2. **Check for overlaying elements**
   - Open DevTools → Elements tab
   - Inspect the button
   - Check if any element has higher z-index covering it
   - Solution: Add `position: relative; z-index: 10;` to button

3. **Check for event handler**
   ```typescript
   onClick={handleRunStressTest}
   ```
   - Make sure `handleRunStressTest` is defined
   - Check for typos in function name

### Issue 2: Button Clicks But Nothing Happens

**Symptoms:**
- Button responds to click (visual feedback)
- No calculations run
- No results appear

**Solutions:**

1. **Check console for errors**
   - Look for red error messages
   - Common errors:
     - `Cannot read property 'reduce' of undefined` → scenarios not initialized
     - `portfolioValue is undefined` → portfolio data not loaded

2. **Verify state initialization**
   ```typescript
   const [scenarios, setScenarios] = useState<ScenarioConfig>({
     ethereum: -30,
     bitcoin: -25,
     altcoins: -50,
     stablecoinDepeg: -5,
     liquidityCrisis: -40,
     regulatoryShock: -35
   });
   ```

3. **Check portfolio value**
   ```typescript
   const { data: portfolioData } = usePortfolioSummary();
   const portfolioValue = portfolioData?.totalValue || 2450000;
   ```
   - If `portfolioData` is undefined, fallback value should be used

### Issue 3: Calculations Run But Results Don't Display

**Symptoms:**
- Console shows calculations complete
- Results state is set
- But UI doesn't update

**Solutions:**

1. **Check view state**
   ```typescript
   setView('results');
   ```
   - Make sure view switches to 'results'
   - Check if results section is conditionally rendered:
   ```typescript
   {view === 'results' && results && (
     // Results display
   )}
   ```

2. **Verify results structure**
   - Check if `results` object has all required fields:
     - `worstCase`
     - `expectedLoss`
     - `var95` (optional)
     - `recoveryMonths`
     - `riskLevel` (optional)
     - `volatility` (optional)
     - `recommendations`

3. **Check for rendering errors**
   - Look for errors in formatCurrency calls
   - Verify all numeric values are valid numbers (not NaN or undefined)

### Issue 4: Button Stuck in Loading State

**Symptoms:**
- Button shows "Running Stress Test..."
- Spinner keeps spinning
- Never completes

**Solutions:**

1. **Check for unhandled errors**
   - Error in calculation might prevent `finally` block from running
   - Solution: Wrap in try-catch-finally

2. **Verify async completion**
   ```typescript
   try {
     setIsRunning(true);
     // ... calculations
   } finally {
     setIsRunning(false); // This MUST run
   }
   ```

3. **Force reset**
   - Refresh the page
   - Or add a timeout:
   ```typescript
   setTimeout(() => {
     setIsRunning(false);
   }, 10000); // Reset after 10 seconds
   ```

## Step-by-Step Debugging

### Step 1: Verify Component is Mounted

1. Add console log at component start:
   ```typescript
   export function StressTestPanel({ portfolioValue, onRunTest }: StressTestPanelProps) {
     console.log('🔍 StressTestPanel mounted with portfolioValue:', portfolioValue);
     // ... rest of component
   }
   ```

2. Check console - you should see this log when page loads

### Step 2: Verify Button Renders

1. Add console log in render:
   ```typescript
   console.log('🔍 Rendering button, isRunning:', isRunning);
   ```

2. Inspect button element in DevTools
3. Check computed styles

### Step 3: Verify Click Handler

1. Add console log at start of handler:
   ```typescript
   const handleRunStressTest = async () => {
     console.log('🔍 handleRunStressTest called');
     console.log('🔍 Current state:', { isRunning, scenarios, portfolioValue });
     // ... rest of handler
   }
   ```

2. Click button
3. Check if log appears

### Step 4: Verify Calculations

1. Add logs throughout calculation:
   ```typescript
   console.log('🔍 Starting calculations...');
   const scenarioValues = Object.values(scenarios);
   console.log('🔍 Scenario values:', scenarioValues);
   
   const avgLoss = scenarioValues.reduce((sum, val) => sum + val, 0) / scenarioValues.length;
   console.log('🔍 Average loss:', avgLoss);
   
   // ... more calculations
   
   console.log('🔍 Final results:', newResults);
   ```

### Step 5: Verify State Updates

1. Add logs for state changes:
   ```typescript
   setResults(newResults);
   console.log('🔍 Results state updated');
   
   setView('results');
   console.log('🔍 View changed to results');
   ```

2. Use React DevTools to inspect state

## Testing Checklist

- [ ] Open `test-stress-button-simple.html` - all tests pass
- [ ] Browser console shows no errors
- [ ] Component mounts successfully
- [ ] Button is visible and clickable
- [ ] Click handler fires
- [ ] Calculations complete
- [ ] Results state updates
- [ ] View switches to 'results'
- [ ] Results display correctly
- [ ] Button resets after completion

## Files to Check

1. **src/components/portfolio/StressTestPanel.tsx**
   - Main component with button and calculations
   - Check: `handleRunStressTest` function
   - Check: Button `onClick` handler
   - Check: Results display section

2. **src/components/portfolio/tabs/AuditTab.tsx**
   - Integration point for StressTestPanel
   - Check: `portfolioValue` prop
   - Check: `onRunTest` callback

3. **src/components/portfolio/tabs/StressTestTab.tsx**
   - Alternative stress test implementation
   - Check: Similar to StressTestPanel

4. **src/hooks/portfolio/usePortfolioSummary.ts**
   - Provides portfolio data
   - Check: Returns valid data structure

## Quick Fixes

### Fix 1: Force Enable Button
```typescript
// Temporarily remove disabled state
<motion.button
  onClick={handleRunStressTest}
  disabled={false} // Changed from: disabled={isRunning}
  // ... rest of props
>
```

### Fix 2: Add Error Boundary
```typescript
try {
  // All calculation code
} catch (error) {
  console.error('❌ Stress test error:', error);
  alert(`Error: ${error.message}`);
  setIsRunning(false);
}
```

### Fix 3: Simplify Handler
```typescript
const handleRunStressTest = async () => {
  console.log('Button clicked!');
  alert('Button works!');
  
  // If this works, gradually add back functionality
};
```

## Expected Console Output

When working correctly, you should see:

```
🧪 [StressTestPanel] Starting stress test...
📊 [StressTestPanel] Portfolio Value: 125000
📊 [StressTestPanel] Scenarios: {ethereum: -30, bitcoin: -25, ...}
✅ [StressTestPanel] Calculations complete: {worstCase: -62500, ...}
✅ [StressTestPanel] Stress test completed successfully
```

## Still Not Working?

If none of the above solutions work:

1. **Clear browser cache**
   - Ctrl+Shift+Delete
   - Clear cached images and files
   - Reload page

2. **Check for conflicting code**
   - Search for other `handleRunStressTest` functions
   - Check for duplicate component definitions

3. **Verify build**
   ```bash
   npm run build
   ```
   - Check for build errors
   - Verify no TypeScript errors

4. **Test in different browser**
   - Try Chrome, Firefox, Edge
   - Check if issue is browser-specific

5. **Check React version**
   - Ensure React 18+ is installed
   - Check package.json

## Contact Information

If you've tried everything and it still doesn't work, provide:

1. Browser console screenshot (with errors)
2. React DevTools state screenshot
3. Network tab screenshot (if API calls involved)
4. Description of what happens when you click the button
5. Which tab you're testing (Audit or Stress Test)

## Success Indicators

✅ Button is clickable
✅ Console shows calculation logs
✅ Results appear after 2 seconds
✅ All 4 metric cards display
✅ Risk level banner shows
✅ Recommendations list appears
✅ Button resets to "Run Stress Test"

---

**Last Updated**: January 28, 2026
**Version**: 1.0
