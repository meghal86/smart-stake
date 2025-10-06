# 🚨 CRITICAL: This is Vite, Not Next.js!

## Problem Discovered

The project uses **Vite + React Router**, NOT Next.js App Router.

The API routes I created in `src/app/api/lite/` **will NOT work** because:
- Vite doesn't support Next.js API routes
- The app runs on port 8083 (Vite dev server)
- There's no `/api/` routing in Vite

## Solution: Use Supabase Edge Functions Directly

The frontend components should call Supabase Edge Functions directly, not through `/api/lite/` routes.

---

## Fix Required

### Update Frontend Components

Instead of:
```typescript
fetch('/api/lite/digest')
```

Use:
```typescript
supabase.functions.invoke('whale-alerts')
```

---

## Files to Update

### 1. DigestCard.tsx

**Current (WRONG):**
```typescript
fetch('/api/lite/digest').then(r=>r.json()).then(d => {
  setItems(d.items || [])
})
```

**Fixed (CORRECT):**
```typescript
import { supabase } from '@/integrations/supabase/client'

supabase.functions.invoke('whale-alerts').then(({ data, error }) => {
  if (error) {
    console.error('Failed to load whale data:', error)
    return
  }
  const items = data?.transactions?.slice(0, 5).map(tx => ({
    id: tx.id,
    event_time: new Date(tx.timestamp * 1000).toISOString(),
    asset: tx.symbol,
    summary: `${tx.amount} ${tx.symbol} → ${tx.to?.owner_type}`,
    severity: tx.amount_usd > 10000000 ? 5 : 4
  }))
  setItems(items || [])
})
```

### 2. IndexDialCard.tsx

**Current (WRONG):**
```typescript
fetch('/api/lite/whale-index')
```

**Fixed (CORRECT):**
```typescript
supabase.functions.invoke('market-summary-enhanced').then(({ data, error }) => {
  if (error) return
  setIndex({
    date: new Date().toISOString(),
    score: data.riskIndex || 65,
    label: data.riskIndex > 70 ? 'Hot' : 'Calm'
  })
})
```

### 3. StreakCard.tsx

**Current (WRONG):**
```typescript
fetch('/api/lite/streak')
```

**Fixed (CORRECT):**
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  setStreak({ streak_count: 0 })
  return
}

const { data: profile } = await supabase
  .from('user_profiles')
  .select('streak_count, last_seen_date')
  .eq('id', session.user.id)
  .single()

setStreak(profile)
```

### 4. UnlockTeaserCard.tsx

**Current (WRONG):**
```typescript
fetch('/api/lite/unlocks')
```

**Fixed (CORRECT):**
```typescript
const { data: unlocks } = await supabase
  .from('token_unlocks')
  .select('*')
  .gte('unlock_time', new Date().toISOString())
  .order('unlock_time', { ascending: true })
  .limit(10)

setList(unlocks || [])
```

---

## What to Delete

Delete these files (they won't work in Vite):
- `src/app/api/lite/digest/route.ts`
- `src/app/api/lite/whale-index/route.ts`
- `src/app/api/lite/streak/route.ts`
- `src/app/api/lite/unlocks/route.ts`

---

## What to Keep

Keep these (they're still useful):
- `health-check.sh` - Can test Supabase Edge Functions directly
- `check-env.sh` - Still validates environment
- All documentation

---

## Updated Health Check

```bash
#!/bin/bash
# Test Supabase Edge Functions directly

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

curl -s "$SUPABASE_URL/functions/v1/whale-alerts" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## Next Steps

1. **Update the 4 frontend components** to call Supabase directly
2. **Delete the API route files** (they don't work in Vite)
3. **Test with Supabase Edge Functions**
4. **Deploy Edge Functions to Supabase**

---

## Why This Happened

I assumed Next.js based on the `src/app/` directory structure, but:
- The project uses Vite (see `vite.config.ts`)
- React Router for routing (see `App.tsx`)
- Port 8083 (Vite default, not Next.js 3000)

---

## Correct Architecture

```
Frontend (Vite + React)
    ↓
Supabase Client
    ↓
Supabase Edge Functions
    ↓
External APIs (Whale Alert, CoinGecko, etc.)
```

**No `/api/` routes needed!**
