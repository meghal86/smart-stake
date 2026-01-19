# Set Primary Wallet - Simple Fix (No Function Needed!)

## What You Asked
> "why we are creating function?"

You're absolutely right! We don't need a database function. We can just do direct UPDATE queries.

## The Simple Solution

Instead of creating a database function, I changed the code to do **two simple UPDATE queries**:

### Code in `src/contexts/WalletContext.tsx`

```typescript
// Update is_primary in database - SIMPLE DIRECT UPDATE
(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // First, set all wallets to NOT primary
      const { error: clearError } = await supabase
        .from('user_wallets')
        .update({ is_primary: false })
        .eq('user_id', user.id);
      
      if (clearError) {
        console.error('Failed to clear primary flags:', clearError);
        return;
      }
      
      // Then, set this wallet to primary
      const { error: setPrimaryError } = await supabase
        .from('user_wallets')
        .update({ is_primary: true })
        .eq('user_id', user.id)
        .ilike('address', address);
      
      if (setPrimaryError) {
        console.error('Failed to set primary wallet:', setPrimaryError);
      } else {
        console.log('✅ Primary wallet updated in database');
      }
    }
  } catch (error) {
    console.error('Error updating primary wallet:', error);
  }
})();
```

## What This Does

1. **Step 1**: Set ALL your wallets to `is_primary = false`
2. **Step 2**: Set the clicked wallet to `is_primary = true`

That's it! No database function needed.

## Testing

1. Go to `http://localhost:8080/settings/wallets`
2. Click "Set Active" on any wallet
3. Check console for: `✅ Primary wallet updated in database`
4. Refresh the page - the same wallet should still be active

## Files Changed

- ✅ `src/contexts/WalletContext.tsx` - Added supabase import + direct UPDATE queries

## No Database Migration Needed!

You don't need to run any SQL in Supabase. The code just uses regular UPDATE queries that work with your existing `user_wallets` table.

## Status

**Status**: ✅ COMPLETE
**Date**: January 19, 2026
**Ready for**: Testing now!
