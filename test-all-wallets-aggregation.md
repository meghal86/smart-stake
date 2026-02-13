# Testing All Wallets Aggregation - Quick Guide

## Prerequisites

Before testing, ensure you have:
1. Multiple wallet addresses added to your account
2. Portfolio page accessible at `localhost:8080/portfolio`
3. Browser console open (F12) to view logs

## Test Scenario 1: Add Multiple Wallets

### Step 1: Add Wallets to Database

Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
INSERT INTO user_portfolio_addresses (user_id, address, label)
VALUES 
  ('YOUR_USER_ID', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Main Wallet'),
  ('YOUR_USER_ID', '0x8888887dDDd1d1D1D1D1D1D1D1D1D1D1D1D1D1D1', 'Trading Wallet'),
  ('YOUR_USER_ID', '0x9999999999999999999999999999999999999999', 'Cold Storage')
ON CONFLICT (user_id, address) DO NOTHING;
```

### Step 2: Verify Wallets Added

```sql
SELECT * FROM user_portfolio_addresses WHERE user_id = 'YOUR_USER_ID';
```

You should see 3 rows with your wallets.

## Test Scenario 2: View Individual Wallet

### Steps:
1. Open `localhost:8080/portfolio`
2. Look for wallet dropdown (desktop: top of page, mobile: in GlobalHeader)
3. Select "Main Wallet" from dropdown
4. Open browser console (F12)

### Expected Console Output:
```
🎯 [PortfolioSnapshot] Resolving addresses for ACTIVE_WALLET mode: 0x742d35Cc...
📊 [PortfolioSnapshot] Fetching portfolio data for 1 address(es)
🔄 [PortfolioSnapshot] Fetching portfolio data for single wallet
✅ [PortfolioSnapshot] Portfolio data: $50000.00
```

### Expected UI:
- Net worth shows data for ONLY that wallet
- Positions show ONLY tokens in that wallet
- Approvals show ONLY approvals for that wallet

## Test Scenario 3: View All Wallets (Aggregated)

### Steps:
1. Stay on `localhost:8080/portfolio`
2. Select "All Wallets" from dropdown
3. Watch browser console

### Expected Console Output:
```
🎯 [PortfolioSnapshot] Resolving addresses for ALL_WALLETS mode, userId: YOUR_USER_ID
✅ [PortfolioSnapshot] Found 3 wallets for user: ['0x742d35Cc...', '0x88888...', '0x99999...']

📊 [PortfolioSnapshot] Fetching portfolio data for 3 address(es)
🔄 [PortfolioSnapshot] Aggregating portfolio data across multiple wallets
✅ [PortfolioSnapshot] Aggregated portfolio: $125000.00, 15 positions

🛡️ [PortfolioSnapshot] Fetching Guardian data for 3 address(es)
🔄 [PortfolioSnapshot] Aggregating Guardian data across multiple wallets
✅ [PortfolioSnapshot] Aggregated Guardian: 8 approvals, risk score 7.5

🎯 [PortfolioSnapshot] Fetching Hunter data for 3 address(es)
✅ [PortfolioSnapshot] Hunter data: 12 opportunities

💰 [PortfolioSnapshot] Fetching Harvest data for 3 address(es)
✅ [PortfolioSnapshot] Harvest data: 5 recommendations, $2500.00 potential savings
```

### Expected UI:
- Net worth shows **SUM** of all 3 wallets
- Positions show **COMBINED** tokens from all wallets
- Approvals show **ALL** approvals across all wallets
- Opportunities show **ALL** opportunities across all wallets

## Test Scenario 4: Switch Between Modes

### Steps:
1. Start with "All Wallets" selected
2. Note the net worth value (e.g., $125,000)
3. Switch to "Main Wallet"
4. Note the net worth value (e.g., $50,000)
5. Switch back to "All Wallets"
6. Verify net worth returns to $125,000

### Expected Behavior:
- Data refreshes on each switch
- Console logs show mode change
- Loading spinner appears briefly
- No errors in console

## Test Scenario 5: Verify Aggregation Math

### Manual Verification:

1. **Net Worth Aggregation**:
   - Select "Main Wallet" → Note net worth (e.g., $50,000)
   - Select "Trading Wallet" → Note net worth (e.g., $45,000)
   - Select "Cold Storage" → Note net worth (e.g., $30,000)
   - Select "All Wallets" → Verify net worth = $125,000 (sum of above)

2. **Position Count**:
   - Select "Main Wallet" → Count positions (e.g., 5)
   - Select "Trading Wallet" → Count positions (e.g., 7)
   - Select "Cold Storage" → Count positions (e.g., 3)
   - Select "All Wallets" → Verify positions = 15 (sum of above)

3. **Risk Score**:
   - Select "Main Wallet" → Note risk score (e.g., 6.5)
   - Select "Trading Wallet" → Note risk score (e.g., 7.5)
   - Select "Cold Storage" → Note risk score (e.g., 4.0)
   - Select "All Wallets" → Verify risk score = 7.5 (maximum of above)

## Test Scenario 6: Error Handling

### Test Partial Failure:

1. Add an invalid wallet address:
   ```sql
   INSERT INTO user_portfolio_addresses (user_id, address, label)
   VALUES ('YOUR_USER_ID', '0xinvalid', 'Invalid Wallet');
   ```

2. Select "All Wallets"

### Expected Behavior:
- Console shows error for invalid wallet
- Other wallets still load successfully
- UI shows data from successful wallets
- Confidence score may drop (degraded mode banner)

### Expected Console Output:
```
❌ [PortfolioSnapshot] Failed to fetch portfolio for wallet 0xinvalid: Invalid address
✅ [PortfolioSnapshot] Aggregated portfolio: $125000.00, 15 positions (from 3 successful wallets)
```

## Test Scenario 7: Empty Wallet List

### Steps:
1. Remove all wallets from database:
   ```sql
   DELETE FROM user_portfolio_addresses WHERE user_id = 'YOUR_USER_ID';
   ```

2. Refresh Portfolio page

### Expected Behavior:
- Dropdown shows only "All Wallets" option (no individual wallets)
- Net worth shows $0
- No API calls made (check console)
- Empty state message displayed

### Expected Console Output:
```
🎯 [PortfolioSnapshot] Resolving addresses for ALL_WALLETS mode, userId: YOUR_USER_ID
✅ [PortfolioSnapshot] Found 0 wallets for user: []
⚠️ [PortfolioSnapshot] No addresses provided, returning empty portfolio
```

## Test Scenario 8: Performance Check

### Steps:
1. Add 5+ wallets to database
2. Select "All Wallets"
3. Open Network tab in DevTools
4. Watch for parallel API calls

### Expected Behavior:
- Multiple API calls fire **simultaneously** (not sequentially)
- Total load time < 3 seconds
- No blocking/freezing of UI
- Loading spinner shows during fetch

### Performance Metrics:
- Portfolio API: ~500ms per wallet
- Guardian API: ~800ms per wallet
- Hunter API: ~600ms (handles multiple wallets)
- Harvest API: ~700ms (handles multiple wallets)
- **Total with parallel**: ~1.5s (not sum of all)

## Troubleshooting

### Issue: "All Wallets" shows $0

**Possible Causes**:
1. No wallets in database
2. User ID mismatch
3. RLS policies blocking access

**Solution**:
```sql
-- Check if wallets exist
SELECT * FROM user_portfolio_addresses WHERE user_id = 'YOUR_USER_ID';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_portfolio_addresses';
```

### Issue: Console shows "Found 0 wallets"

**Possible Causes**:
1. User not authenticated
2. Wrong user ID
3. Database connection issue

**Solution**:
- Check `useAuth()` hook returns valid user
- Verify Supabase connection
- Check browser console for auth errors

### Issue: Aggregation math is wrong

**Possible Causes**:
1. Duplicate wallets in database
2. Stale cache
3. API returning incorrect data

**Solution**:
```sql
-- Check for duplicate wallets
SELECT address, COUNT(*) 
FROM user_portfolio_addresses 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY address
HAVING COUNT(*) > 1;

-- Clear cache
localStorage.clear();
sessionStorage.clear();
```

### Issue: Risk score not showing maximum

**Possible Causes**:
1. Guardian API not returning risk scores
2. Aggregation logic error

**Solution**:
- Check console logs for Guardian responses
- Verify `maxRiskScore = Math.max(maxRiskScore, scanResult.riskScore)` logic
- Check if Guardian API is returning valid scores

## Success Criteria

✅ All tests pass if:
1. Individual wallet mode shows data for ONLY that wallet
2. All wallets mode shows AGGREGATED data across all wallets
3. Net worth in "All Wallets" = sum of individual wallets
4. Risk score in "All Wallets" = maximum of individual wallets
5. Switching between modes works smoothly
6. Console logs show correct mode and aggregation
7. No errors in console
8. UI updates correctly on wallet switch
9. Loading states show during data fetch
10. Partial failures don't break entire page

## Next Steps

After successful testing:
1. Test with real wallet addresses (not test data)
2. Test with wallets that have actual balances
3. Test with wallets on different chains
4. Test performance with 10+ wallets
5. Test on mobile devices
6. Test with slow network (throttle in DevTools)

## Report Issues

If you find bugs, report with:
- Browser and version
- Console logs (full output)
- Network tab screenshots
- Steps to reproduce
- Expected vs actual behavior

---

**Happy Testing!** 🚀
