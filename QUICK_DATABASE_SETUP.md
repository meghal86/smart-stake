# 🚀 Quick Database Setup Guide

## Fix the 404 Error - Database Tables Missing

The 404 error occurs because the database tables haven't been created yet. Follow these steps to set up your database:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rebeznxivaxgserswhbn`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Database Setup**
   - Copy the entire content from `database-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `users`
     - `users_metadata`
     - `subscriptions`
     - `alerts`
     - `user_preferences`

### Option 2: Using Supabase CLI (If you have Docker)

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset

# Link to your project
supabase link --project-ref rebeznxivaxgserswhbn

# Push to remote
supabase db push
```

### Option 3: Manual Table Creation

If the SQL script doesn't work, create tables manually:

#### 1. Create `users` table:
```sql
CREATE TABLE public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Create `users_metadata` table:
```sql
CREATE TABLE public.users_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Enable RLS and create policies:
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own metadata" ON public.users_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata" ON public.users_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata" ON public.users_metadata
  FOR UPDATE USING (auth.uid() = user_id);
```

## After Database Setup

1. **Refresh your application**
   - The 404 error should be resolved
   - User profiles should load properly

2. **Test user registration**
   - Sign up with a new account
   - Check if user data is created automatically

3. **Verify in Supabase Dashboard**
   - Go to Table Editor
   - Check if data appears in `users` and `users_metadata` tables

## Troubleshooting

### If you still get 404 errors:

1. **Check table names** in Supabase Dashboard
2. **Verify RLS policies** are created
3. **Check user permissions** in Authentication tab
4. **Clear browser cache** and refresh

### If authentication doesn't work:

1. **Check Auth settings** in Supabase Dashboard
2. **Verify redirect URLs** are configured
3. **Check environment variables** in your app

### If Stripe integration fails:

1. **Set up Edge Functions** (see DEPLOYMENT_GUIDE.md)
2. **Configure webhook endpoints**
3. **Update price IDs** in Subscription.tsx

## Next Steps

After the database is set up:

1. ✅ **Database tables created**
2. 🔄 **Configure OAuth providers** (Google, Apple)
3. 🔄 **Set up Stripe webhooks**
4. 🔄 **Deploy Edge Functions**
5. 🔄 **Update Stripe price IDs**

The application should now work properly with user authentication and profile management!