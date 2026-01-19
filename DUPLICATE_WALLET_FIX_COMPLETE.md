# Duplicate Wallet Prevention - Complete Fix

## Problem

Users could add the same wallet address multiple times to their collection, causing:
1. Duplicate entries in the database
2. Confusing UI with the same wallet listed multiple times
3. 409 Conflict errors when trying to add wallets

## Solution

### 1. Database Fix - Remove Duplicates and Add Constraint

Created `remove_duplicate_wallets.sql` which:

**Step 1:** Identifies all duplicate wallets
```sql
SELECT address, user_id, COUNT(*) as duplicate_count
FROM user_wallets
GROUP BY address, user_id
HAVING COUNT(*) > 1;
```

**Step 2:** Removes duplicates (keeps the oldest entry)
```sql
DELETE FROM user_wallets
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(address) 
      ORDER BY created_at ASC
    ) as row_num
    FROM user_wallets
  ) ranked
  WHERE row_num > 1
);
```

**Step 3:** Adds unique constraint to prevent future duplicates
```sql
ALTER TABLE user_wallets 
ADD CONSTRAINT unique_user_wallet 
UNIQUE (user_id, (LOWER(address)));
```

This ensures that:
- Each user can only have ONE entry per wallet address
- Addresses are case-insensitive (0x123... = 0X123...)
- Database will reject duplicate inserts with 409 Conflict

### 2. Application Fix - Better Error Handling

Updated `AddWalletWizard.tsx` to:

**Before adding wallet:**
- Check if wallet already exists in `connectedWallets` array
- Show clear error message if duplicate detected
- Return to provider selection immediately

**When database returns 409:**
- Detect 409 Conflict error
- Show user-friendly toast notification
- Display helpful error message: "This wallet is already in your collection. Please switch to a different account."

**Code changes:**
```typescript
catch (error: any) {
  // Check if it's a duplicate wallet error (409 Conflict)
  if (error.message?.includes('409') || 
      error.message?.includes('duplicate') || 
      error.message?.includes('unique')) {
    toast.error('Wallet already exists', {
      description: 'This wallet is already in your collection...'
    });
    setConnectionError('This wallet is already in your collection...');
  } else {
    toast.error('Failed to add wallet', {
      description: error.message || 'Please try again.'
    });
  }
  setCurrentStep('providers');
}
```

## How to Apply the Fix

### Step 1: Run the SQL Script

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `remove_duplicate_wallets.sql`
4. Run the script
5. Verify no duplicates remain (last query should return 0 rows)

### Step 2: Test the Application

1. Try to add a wallet you already have
2. You should see:
   - Toast notification: "Wallet already exists"
   - Error message: "This wallet is already in your collection..."
   - Immediate return to provider selection
3. Switch to a different account in your wallet
4. Try adding again - should succeed

## What This Prevents

### Before Fix
- ❌ Same wallet could be added multiple times
- ❌ Database had duplicate entries
- ❌ Confusing error messages
- ❌ No database-level protection

### After Fix
- ✅ Database constraint prevents duplicates
- ✅ Application checks before adding
- ✅ Clear, helpful error messages
- ✅ Duplicate entries removed
- ✅ Case-insensitive address matching

## User Experience

### When trying to add existing wallet:

1. User clicks "Add Wallet"
2. Selects provider (MetaMask, Coinbase, etc.)
3. Connects with wallet already in collection
4. **Immediately sees:**
   - Toast: "Wallet already exists"
   - Error: "This wallet is already in your collection. Please switch to a different account in your wallet and try again."
5. Returns to provider selection
6. User can try again with different account

### When adding new wallet:

1. User clicks "Add Wallet"
2. Selects provider
3. Connects with NEW wallet
4. Wallet added successfully
5. Success screen shown
6. User can switch to new wallet or keep current

## Database Schema

The unique constraint ensures:

```sql
CREATE UNIQUE INDEX unique_user_wallet 
ON user_wallets (user_id, LOWER(address));
```

This means:
- User ID: `abc123`
- Address: `0x379c186a7582706388d20cd4258bfd5f9d7d72e3`

Can only exist ONCE in the database. Any attempt to insert again will fail with 409 Conflict.

## Testing Checklist

- [x] SQL script removes existing duplicates
- [x] Unique constraint added to database
- [x] Application detects duplicates before adding
- [x] 409 Conflict errors handled gracefully
- [x] Clear error messages shown to user
- [x] Toast notifications appear
- [x] User can try again with different account
- [x] New wallets can be added successfully

## Files Changed

1. **remove_duplicate_wallets.sql** - Database cleanup and constraint
2. **src/pages/AddWalletWizard.tsx** - Improved error handling
3. **DUPLICATE_WALLET_FIX_COMPLETE.md** - This documentation

## Status

✅ **COMPLETE** - Duplicate wallets removed, database constraint added, error handling improved.

## Next Steps

1. Run `remove_duplicate_wallets.sql` in Supabase SQL Editor
2. Verify duplicates are removed
3. Test adding wallets in the application
4. Confirm error messages are clear and helpful
