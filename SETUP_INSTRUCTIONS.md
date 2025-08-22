# 🚀 Step-by-Step Setup Instructions

## Fix the Database Error - Complete Guide

Follow these exact steps to fix the "ON CONFLICT" error and set up your database properly.

### Step 1: Clean Database Setup

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rebeznxivaxgserswhbn`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Clean Setup Script**
   - Copy the **entire content** from `database-setup-clean.sql`
   - Paste it into the SQL Editor
   - Click "Run" (this will take a few seconds)

### Step 2: Verify Database Setup

1. **Check Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - ✅ `users`
     - ✅ `users_metadata`
     - ✅ `subscriptions`
     - ✅ `alerts`
     - ✅ `user_preferences`
     - ✅ `devices`
     - ✅ `risk_scans`
     - ✅ `yields`
     - ✅ `yield_history`

2. **Check Sample Data**
   - Click on `alerts` table
   - You should see 5 sample whale transactions
   - Click on `yields` table
   - You should see 7 sample yield opportunities

### Step 3: Test the Application

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Visit Debug Page**
   - Go to: http://localhost:3000/debug
   - All tables should show "OK" status
   - If any show "Error", repeat Step 1

3. **Test User Registration**
   - Go to: http://localhost:3000/signup
   - Create a new account
   - Check if profile loads without errors

### Step 4: Verify User Creation

1. **Sign Up with Test Account**
   - Use a test email (e.g., test@example.com)
   - Complete the signup process

2. **Check Database Records**
   - Go back to Supabase Dashboard
   - Check `users` table - should have your user record
   - Check `users_metadata` table - should have your profile data

### Step 5: Test Authentication Flow

1. **Login/Logout**
   - Test login with your account
   - Check if user header shows your name
   - Test logout functionality

2. **Profile Management**
   - Visit profile page
   - Check if all user data loads correctly
   - Test preference updates

## Troubleshooting

### If you still get errors:

#### Error: "relation does not exist"
- **Solution**: Run the `database-setup-clean.sql` script again
- Make sure you copied the entire script

#### Error: "permission denied"
- **Solution**: Check RLS policies in Supabase Dashboard
- Go to Authentication → Policies
- Ensure policies are created for all tables

#### Error: "duplicate key value"
- **Solution**: This is normal - it means the record already exists
- The app handles this gracefully

#### 404 errors on API calls
- **Solution**: Check if tables exist in Table Editor
- Verify RLS policies are enabled
- Check browser console for detailed errors

### If authentication doesn't work:

1. **Check Environment Variables**
   ```bash
   # Verify these are set correctly in .env
   VITE_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

2. **Check Supabase Auth Settings**
   - Go to Authentication → Settings
   - Verify Site URL is set correctly
   - Check redirect URLs

## Next Steps After Database Setup

1. ✅ **Database setup complete**
2. 🔄 **Configure OAuth providers** (Google, Apple)
3. 🔄 **Set up Stripe integration**
4. 🔄 **Deploy Edge Functions**
5. 🔄 **Update Stripe price IDs**

## Success Indicators

You'll know everything is working when:

- ✅ Debug page shows all tables as "OK"
- ✅ User registration creates records in database
- ✅ Profile page loads user information
- ✅ No 404 errors in browser console
- ✅ User header shows name and avatar

## Need Help?

If you're still having issues:

1. **Check browser console** for detailed error messages
2. **Visit `/debug` page** to see database status
3. **Check Supabase logs** in the dashboard
4. **Verify all steps** were completed in order

The database setup is the most critical step - once this is working, everything else will fall into place!