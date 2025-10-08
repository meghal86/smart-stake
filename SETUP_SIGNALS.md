# 🚀 Signals Feed Setup Guide

## ✅ What's Already There
- `whale_digest` table ✓
- `user_profiles` table ✓
- Supabase client ✓
- SignalCard component ✓

## 📦 Install Dependencies

```bash
npm install react-virtuoso
```

## 🗄️ Database Migration

Run this migration to add signal filters to user profiles:

```bash
# Apply the migration
supabase db push supabase/migrations/20250128000001_add_signal_filters.sql
```

Or run directly in Supabase SQL Editor:

```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS signal_filters JSONB DEFAULT '{
  "mutedWallets": [], 
  "mutedExchanges": [], 
  "mutedAssets": []
}'::jsonb;
```

## 🔴 Enable Realtime

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for `whale_digest` table
3. Or run: `ALTER PUBLICATION supabase_realtime ADD TABLE whale_digest;`

## 🛣️ Add Route

Add to your router (e.g., `src/App.tsx` or router config):

```tsx
import SignalsFeedPage from '@/pages/SignalsFeed';

// Add route
{
  path: '/signals',
  element: <SignalsFeedPage />
}
```

## ✅ Test

```bash
npm run dev
# Navigate to http://localhost:3000/signals
```

## 📊 Verify Data

Check if you have whale_digest data:

```sql
SELECT COUNT(*) FROM whale_digest;
SELECT * FROM whale_digest ORDER BY event_time DESC LIMIT 5;
```

If empty, the feed will show "No whale moves yet" message.

## 🎯 That's It!

The implementation uses your existing:
- `whale_digest` table (id, event_time, asset, summary, severity, source)
- `user_profiles` table (now with signal_filters column)
- Supabase client setup
- SignalCard component from hub2

No new tables created. Minimal changes only.
