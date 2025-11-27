# Get Your Real Supabase Service Role Key

Your `.env` file currently has a placeholder service role key. You need to get the real one from Supabase.

## Steps to Get Your Service Role Key

### Option 1: From Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project: `rebeznxivaxgserswhbn`
3. Click on **Settings** (gear icon in left sidebar)
4. Click on **API** in the settings menu
5. Scroll down to **Project API keys**
6. Find the **service_role** key (NOT the anon key)
7. Click the eye icon to reveal it
8. Copy the entire key

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref rebeznxivaxgserswhbn

# Get the service role key
supabase status
```

Look for the line that says `service_role key:` and copy that value.

## Update Your .env File

Once you have the real service role key, update **TWO** places in your `.env` file:

```bash
# Replace BOTH of these lines with your real key:
SUPABASE_SERVICE_ROLE_KEY="your-real-key-here"
GUARDIAN_API_KEY=your-real-key-here
```

**Important:** Both should have the SAME value (your real service role key).

## After Updating

1. Save the `.env` file
2. Restart your dev server: `npm run dev`
3. Go to HarvestPro
4. Click "Live" mode
5. You should now see API calls in the Network tab!

---

**Security Note:** Never commit your service role key to git. It's already in `.gitignore`.
