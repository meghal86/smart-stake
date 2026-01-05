# Test User Setup Guide

## Status: ✅ TEST_USER_ID Set

The `TEST_USER_ID` has been successfully configured in `.env.test`:

```
TEST_USER_ID=e5d55a48-b3fa-4c70-bbaa-373fd70ff1f7
```

## Next Steps: Generate TEST_JWT_TOKEN

To complete the integration test setup, you need to:

1. **Create a test user in Supabase Auth** with this UUID
2. **Generate a valid JWT token** for that user
3. **Update `.env.test`** with the JWT token

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `rebeznxivaxgserswhbn`
3. Navigate to **Authentication → Users**
4. Click **Add user**
5. Create a new user with:
   - **Email**: `test@example.com` (or any email)
   - **Password**: Generate a secure password
   - **Auto Confirm User**: ✅ Check this box
6. Copy the user UUID and verify it matches: `e5d55a48-b3fa-4c70-bbaa-373fd70ff1f7`
7. Generate a session token:
   - Click the user row
   - Look for "Session" or "Access Token" section
   - Copy the JWT token

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Create a test user
supabase auth admin create-user \
  --email test@example.com \
  --password testpass123 \
  --project-ref rebeznxivaxgserswhbn

# List users to get the UUID
supabase auth admin list-users --project-ref rebeznxivaxgserswhbn

# Generate a session token
supabase auth admin create-session \
  --user-id e5d55a48-b3fa-4c70-bbaa-373fd70ff1f7 \
  --project-ref rebeznxivaxgserswhbn
```

### Option 3: Using Supabase JS Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
);

// Sign up a new user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpass123',
});

if (error) {
  console.error('Error creating user:', error);
} else {
  const userId = data.user?.id;
  const token = data.session?.access_token;
  
  console.log(`User ID: ${userId}`);
  console.log(`JWT Token: ${token}`);
}
```

## Update .env.test

Once you have the JWT token, update `.env.test`:

```bash
# Replace with your actual JWT token
TEST_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiJlNWQ1NWE0OC1iM2ZhLTRjNzAtYmJhYS0zNzNmZDcwZmYxZjciLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.YOUR_ACTUAL_TOKEN_HERE
```

## Verify Setup

Once you've set both `TEST_USER_ID` and `TEST_JWT_TOKEN`, verify the setup:

```bash
# Run the integration tests
npm test -- src/__tests__/integration/edge-functions.test.ts --run
```

Expected output:
```
✓ src/__tests__/integration/edge-functions.test.ts (30 tests)
  ✓ 1. wallets-list (3 tests)
  ✓ 2. wallets-add-watch (7 tests)
  ✓ 3. wallets-remove (3 tests)
  ✓ 4. wallets-remove-address (4 tests)
  ✓ 5. wallets-set-primary (3 tests)
  ✓ CORS & Authentication (3 tests)

Test Files  1 passed (1)
Tests       30 passed (30)
```

## Troubleshooting

### Issue: "401 Unauthorized" errors

**Cause**: JWT token is invalid or expired

**Solution**:
1. Verify the token is not expired
2. Generate a new token using one of the methods above
3. Ensure the token contains the correct `sub` claim (should match TEST_USER_ID)

### Issue: "user_wallets table not found"

**Cause**: Database table doesn't exist

**Solution**: Run the database migration:
```bash
supabase db push --project-ref rebeznxivaxgserswhbn
```

### Issue: "Edge Function not found"

**Cause**: Edge Functions not deployed

**Solution**: Deploy Edge Functions:
```bash
supabase functions deploy wallets-list --project-ref rebeznxivaxgserswhbn
supabase functions deploy wallets-add-watch --project-ref rebeznxivaxgserswhbn
supabase functions deploy wallets-remove --project-ref rebeznxivaxgserswhbn
supabase functions deploy wallets-remove-address --project-ref rebeznxivaxgserswhbn
supabase functions deploy wallets-set-primary --project-ref rebeznxivaxgserswhbn
```

## Summary

✅ **Completed**:
- TEST_USER_ID set to: `e5d55a48-b3fa-4c70-bbaa-373fd70ff1f7`

⏳ **Next**:
- Create test user in Supabase Auth with this UUID
- Generate JWT token for the test user
- Update TEST_JWT_TOKEN in `.env.test`
- Run integration tests to verify setup

Once both TEST_USER_ID and TEST_JWT_TOKEN are configured, the integration test checklist can be executed.
