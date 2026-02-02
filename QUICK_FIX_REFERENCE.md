# Stress Test Button - Quick Fix Reference

## 🎯 Problem
Button not responding to clicks in Portfolio > Stress Test

## ✅ Solution Applied
Enhanced click handler with event management and CSS fixes

## 🧪 Quick Test
```
1. Go to: Portfolio > Stress Test
2. Click: "Run Stress Test" button
3. Expect: Loading spinner → Results (2 sec)
```

## 📊 Console Output (Expected)
```
🎯 Button clicked - event triggered
🧪 [StressTestTab] Starting stress test...
📊 [StressTestTab] Portfolio Value: $2,450,000
✅ [StressTestTab] Stress test completed successfully
```

## 🔍 Debug Commands

### Check Button Exists
```javascript
document.querySelector('[data-testid="run-stress-test-button"]')
```

### Manual Trigger
```javascript
document.querySelector('[data-testid="run-stress-test-button"]').click()
```

### Run Full Diagnostic
```javascript
// Copy/paste contents of debug-stress-test-button.js
```

## 📁 Test Files

| File | Purpose |
|------|---------|
| `test-stress-test-button-fix.html` | Basic functionality tests |
| `test-stress-test-visual-verification.html` | Visual verification suite |
| `debug-stress-test-button.js` | Console diagnostic script |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button grayed out | Check `isRunning` state in React DevTools |
| No click response | Run diagnostic script |
| No results | Check console for errors |
| View doesn't change | Verify `setView('results')` executes |

## 📞 Quick Checks

- [ ] Browser console clear of errors?
- [ ] Button visible and enabled?
- [ ] React DevTools shows `isRunning: false`?
- [ ] No overlays blocking button?
- [ ] Portfolio data loaded?

## 🔧 Code Changes

**File:** `src/components/portfolio/tabs/StressTestTab.tsx`

**Key Changes:**
- Added `e.preventDefault()` and `e.stopPropagation()`
- Added `relative z-10 pointer-events-auto`
- Added `data-testid="run-stress-test-button"`
- Added comprehensive logging
- Added guard clause for multiple clicks

## ⚡ One-Line Test
```javascript
document.querySelector('[data-testid="run-stress-test-button"]')?.click()
```

---
**Status:** ✅ Fixed | **Date:** Jan 28, 2026
