# Quick Database Fix for Subscription Error

You're getting a 406 error because the database tables aren't properly set up. Here's how to fix it:

## Option 1: Run the Migration Script (Recommended)

If you already have some data and want to keep it:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-migration-stripe.sql`
4. Click **Run**

## Option 2: Fresh Database Setup

If you want to start fresh:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-setup-clean.sql`
4. Click **Run**

## Option 3: Manual Table Check

Check if your tables exist:

```sql
-- Check if subscriptions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions';

-- Check subscriptions table structure
\d public.subscriptions;
```

## Quick Test

After running the setup, test with this query:

```sql
-- This should work without errors
SELECT COUNT(*) FROM public.subscriptions;
```

## Common Issues

### 1. Table doesn't exist
**Error**: `relation "public.subscriptions" does not exist`
**Fix**: Run `database-setup-clean.sql`

### 2. Missing columns
**Error**: `column "stripe_customer_id" does not exist`
**Fix**: Run `database-migration-stripe.sql`

### 3. Permission issues
**Error**: `permission denied for table subscriptions`
**Fix**: Check RLS policies are set up correctly

## Verify Setup

After running the setup, you can verify everything works by:

1. Going to `/debug` page in your app
2. Checking the Database Status component
3. All tables should show "OK" status

## Need Help?

If you're still having issues:

1. Check the Supabase logs in your dashboard
2. Verify your RLS policies are enabled
3. Make sure you're using the correct project URL and keys
4. Try the database health check in the Debug page

The error you're seeing (`406 Not Acceptable`) typically means the table exists but there's a schema mismatch or RLS policy issue.