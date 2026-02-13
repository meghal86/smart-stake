# Portfolio Realtime Data - QUICK REFERENCE

## 🚀 Quick Start

### Test the Implementation

1. **Open test page:**
   ```bash
   # Open in browser
   test-portfolio-realtime.html
   ```

2. **Or test manually:**
   ```bash
   # Start dev server
   npm run dev
   
   # Open portfolio
   http://localhost:3000/portfolio
   ```

### What to Check

✅ **Demo Mode:** No wallet → Shows demo data  
✅ **Live Mode:** Wallet connected → Shows real data  
✅ **Wallet Switch:** Switch wallets → Data updates  
✅ **Audit Tab:** Open in demo mode → No errors  
✅ **Console:** Check for "✅ REAL data" or "🎭 MOCK data"

## 🔍 Console Logs Cheat Sheet

### Demo Mode (Expected)
```
🎭 [PortfolioValuation] Using MOCK data
🎭 [Guardian] Using MOCK data
🎭 [Hunter] Using MOCK data
```

### Live Mode - Success (Expected)
```
✅ [PortfolioValuation] Received REAL data
✅ [Guardian] Received REAL scan data
✅ [Hunter] Received REAL opportunities
```

### Live Mode - Fallback (Expected if edge functions not deployed)
```
⚠️ [PortfolioValuation] Edge function error, falling back to mock data
🎭 [PortfolioValuation] Using MOCK data
```

### Errors (NOT Expected - Something is wrong)
```
❌ TypeError: Cannot read property 'filter' of undefined
❌ ReferenceError: process is not defined
❌ Error: Supabase client initialization failed
```

## 🛠️ Quick Fixes

### Problem: White Screen

**Solution:**
```typescript
// Check services use lazy-loaded clients
private getSupabaseClient() {
  return createClient(...);  // ✅ Good
}

// NOT this:
const supabase = createClient(...);  // ❌ Bad
```

### Problem: Audit Tab Error

**Solution:**
```typescript
// Check components have defaults
export function AuditTab({ approvals = [] }: Props) {  // ✅ Good
  const safe = Array.isArray(approvals) ? approvals : [];  // ✅ Good
  const filtered = safe.filter(...);  // ✅ Good
}
```

### Problem: Mock Data in Live Mode

**Solution:**
```bash
# Deploy edge functions
supabase functions deploy portfolio-tracker-live
supabase functions deploy guardian-scan-v2
supabase functions deploy hunter-opportunities

# Check they're running
supabase functions list
```

## 📊 Data Flow

```
User → PortfolioRouteShell → usePortfolioIntegration → Services → Edge Functions → Real Data → Tabs
```

## 🎯 Key Files

### Services (Call Edge Functions)
- `src/services/PortfolioValuationService.ts`
- `src/services/guardianService.ts`
- `src/services/hunterService.ts`

### Components (Display Data)
- `src/components/portfolio/PortfolioRouteShell.tsx`
- `src/components/portfolio/tabs/AuditTab.tsx`
- `src/components/portfolio/ApprovalsRiskList.tsx`

### Hooks (Fetch Data)
- `src/hooks/portfolio/usePortfolioIntegration.ts`

## 🔧 Edge Functions Required

1. **portfolio-tracker-live** - Portfolio valuation
2. **guardian-scan-v2** - Security scanning
3. **hunter-opportunities** - Opportunity discovery

## ✅ Success Checklist

- [ ] Demo mode works (no wallet)
- [ ] Live mode works (wallet connected)
- [ ] Wallet switching works
- [ ] Audit tab works in demo mode
- [ ] Console shows correct logs
- [ ] No white screen errors
- [ ] No JavaScript errors

## 📚 Full Documentation

- **Complete Guide:** `PORTFOLIO_REALTIME_COMPLETE_SOLUTION.md`
- **Status Report:** `PORTFOLIO_INTEGRATION_STATUS.md`
- **Test Page:** `test-portfolio-realtime.html`

## 🆘 Need Help?

1. Check console logs (F12)
2. Check Network tab for API calls
3. Review documentation files
4. Test with demo mode first

---

**TL;DR:** Open `test-portfolio-realtime.html` and follow the tests. Check console for "✅ REAL data" or "🎭 MOCK data". If you see errors, check the troubleshooting section.
